import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const redeemSchema = z.object({
  catalogItemId: z.string().min(1, "Catalog item ID is required"),
  quantity: z.number().int().min(1).max(10).default(1),
  metadata: z.record(z.any()).optional()
})

/**
 * POST /api/rewards/redeem
 * Redeem points for a reward
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validation = redeemSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.errors },
        { status: 400 }
      )
    }

    const { catalogItemId, quantity, metadata } = validation.data

    // Get catalog item
    const catalogItem = await (prisma as any).rewardCatalogItem.findUnique({
      where: { id: catalogItemId }
    })

    if (!catalogItem) {
      return NextResponse.json(
        { error: "Reward not found" },
        { status: 404 }
      )
    }

    // Check if item is available
    if (!catalogItem.isAvailable) {
      return NextResponse.json(
        { error: "This reward is currently unavailable" },
        { status: 400 }
      )
    }

    // Check stock
    if (catalogItem.stock !== null && catalogItem.stock < quantity) {
      return NextResponse.json(
        { error: `Only ${catalogItem.stock} items available` },
        { status: 400 }
      )
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        loyaltyPoints: true,
        loyaltyTier: true,
        email: true,
        name: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    const totalCost = catalogItem.pointsCost * quantity

    // Check if user has enough points
    if (user.loyaltyPoints < totalCost) {
      return NextResponse.json(
        { 
          error: "Insufficient points",
          required: totalCost,
          available: user.loyaltyPoints,
          shortfall: totalCost - user.loyaltyPoints
        },
        { status: 400 }
      )
    }

    // Check tier requirement
    if (catalogItem.requiredTier) {
      const tierOrder = ["BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND"]
      const userTierIndex = tierOrder.indexOf(user.loyaltyTier)
      const requiredTierIndex = tierOrder.indexOf(catalogItem.requiredTier)
      
      if (userTierIndex < requiredTierIndex) {
        return NextResponse.json(
          { 
            error: `This reward requires ${catalogItem.requiredTier} tier or higher`,
            currentTier: user.loyaltyTier,
            requiredTier: catalogItem.requiredTier
          },
          { status: 403 }
        )
      }
    }

    // Create redemption transaction
    const redemptionCode = `RWD-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`
    
    const redemption = await (prisma as any).rewardRedemption.create({
      data: {
        userId: session.user.id,
        catalogItemId,
        pointsSpent: totalCost,
        quantity,
        status: "PENDING",
        redemptionCode,
        metadata: metadata || {},
        expiresAt: catalogItem.validityDays 
          ? new Date(Date.now() + catalogItem.validityDays * 24 * 60 * 60 * 1000)
          : null
      },
      include: {
        catalogItem: true
      }
    })

    // Create reward transaction record
    const transaction = await (prisma as any).rewardTransaction.create({
      data: {
        userId: session.user.id,
        points: -totalCost,
        type: "REDEMPTION",
        source: "CATALOG_REDEMPTION",
        description: `Redeemed ${quantity}x ${catalogItem.name}`,
        redemptionId: redemption.id,
        metadata: {
          catalogItemId,
          quantity,
          redemptionCode
        }
      }
    })

    // Deduct points from user
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        loyaltyPoints: {
          decrement: totalCost
        }
      }
    })

    // Update stock if applicable
    if (catalogItem.stock !== null) {
      await (prisma as any).rewardCatalogItem.update({
        where: { id: catalogItemId },
        data: {
          stock: {
            decrement: quantity
          }
        }
      })
    }

    // TODO: Send confirmation email with redemption code

    return NextResponse.json({
      success: true,
      redemption: {
        id: redemption.id,
        code: redemptionCode,
        item: catalogItem.name,
        quantity,
        pointsSpent: totalCost,
        status: redemption.status,
        expiresAt: redemption.expiresAt,
        createdAt: redemption.createdAt
      },
      transaction: {
        id: transaction.id,
        newBalance: user.loyaltyPoints - totalCost
      }
    })
  } catch (error) {
    console.error("Error redeeming reward:", error)
    return NextResponse.json(
      { error: "Failed to redeem reward" },
      { status: 500 }
    )
  }
}
