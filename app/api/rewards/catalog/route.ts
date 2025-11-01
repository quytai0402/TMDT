import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { Prisma } from "@prisma/client"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/rewards/catalog
 * Browse redeemable rewards with filtering
 * Query params: category, minPoints, maxPoints, available, page, limit
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const minPoints = searchParams.get("minPoints")
    const maxPoints = searchParams.get("maxPoints")
    const available = searchParams.get("available")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")

    // Build filter
    const where: Prisma.RewardCatalogItemWhereInput = {}
    
    if (category) {
      where.category = category as any
    }
    
    if (minPoints || maxPoints) {
      where.pointsCost = {}
      if (minPoints) where.pointsCost.gte = parseInt(minPoints, 10)
      if (maxPoints) where.pointsCost.lte = parseInt(maxPoints, 10)
    }
    
    if (available === "true") {
      where.isActive = true
      where.OR = [
        { quantityAvailable: null },
        { quantityAvailable: { gt: 0 } },
      ]
    }

    // Get total count
    const total = await prisma.rewardCatalogItem.count({ where })

    // Get catalog items with pagination
    const items = await prisma.rewardCatalogItem.findMany({
      where,
      orderBy: [
        { pointsCost: "asc" },
        { createdAt: "desc" },
      ],
      skip: (page - 1) * limit,
      take: limit,
      include: {
        promotion: {
          select: {
            id: true,
            code: true,
            source: true,
            discountType: true,
            discountValue: true,
            maxDiscount: true,
            validFrom: true,
            validUntil: true,
            pointCost: true,
            isActive: true,
          },
        },
      },
    })

    // Get user's points for affordability check
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        loyaltyPoints: true,
        loyaltyTier: true
      }
    })

    // Mark which items user can afford
    const itemsWithAffordability = items.map((item) => {
      const metadata = (typeof item.metadata === "object" && item.metadata !== null) ? item.metadata as Record<string, unknown> : {}
      const requiredTier = typeof metadata.requiredTier === "string" ? metadata.requiredTier : null
      const validityDays = typeof metadata.validityDays === "number" ? metadata.validityDays : null

      return {
        id: item.id,
        slug: item.slug,
        name: item.name,
        description: item.description,
        category: item.category,
        pointsCost: item.pointsCost,
        cashValue: item.cashValue,
        quantityAvailable: item.quantityAvailable,
        maxPerUser: item.maxPerUser,
        startAt: item.startAt,
        endAt: item.endAt,
        isActive: item.isActive,
        image: item.image,
        terms: item.terms,
        metadata: item.metadata,
        badgeId: item.badgeId,
        promotion: item.promotion,
        canAfford: user ? user.loyaltyPoints >= item.pointsCost : false,
        userPoints: user?.loyaltyPoints || 0,
        requiredTier,
        validityDays,
      }
    })

    return NextResponse.json({
      items: itemsWithAffordability,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      userTier: user?.loyaltyTier || "BRONZE",
      userPoints: user?.loyaltyPoints || 0
    })
  } catch (error) {
    console.error("Error fetching rewards catalog:", error)
    return NextResponse.json(
      { error: "Failed to fetch rewards catalog" },
      { status: 500 }
    )
  }
}
