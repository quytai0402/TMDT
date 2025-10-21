import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
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
    const where: any = {}
    
    if (category) {
      where.category = category
    }
    
    if (minPoints || maxPoints) {
      where.pointsCost = {}
      if (minPoints) where.pointsCost.gte = parseInt(minPoints)
      if (maxPoints) where.pointsCost.lte = parseInt(maxPoints)
    }
    
    if (available === "true") {
      where.isAvailable = true
      where.OR = [
        { stock: { gt: 0 } },
        { stock: null }
      ]
    }

    // Get total count
    const total = await (prisma as any).rewardCatalogItem.count({ where })

    // Get catalog items with pagination
    const items = await (prisma as any).rewardCatalogItem.findMany({
      where,
      orderBy: [
        { featured: 'desc' },
        { pointsCost: 'asc' }
      ],
      skip: (page - 1) * limit,
      take: limit
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
    const itemsWithAffordability = items.map((item: any) => ({
      ...item,
      canAfford: user ? user.loyaltyPoints >= item.pointsCost : false,
      userPoints: user?.loyaltyPoints || 0
    }))

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
