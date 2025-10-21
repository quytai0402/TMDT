import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/rewards/history
 * Get user's reward transaction history
 * Query params: type, source, page, limit, startDate, endDate
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
    const type = searchParams.get("type") // EARN, REDEMPTION, EXPIRY, ADJUSTMENT
    const source = searchParams.get("source")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // Build filter
    const where: any = {
      userId: session.user.id
    }
    
    if (type) {
      where.type = type
    }
    
    if (source) {
      where.source = source
    }
    
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }

    // Get total count
    const total = await (prisma as any).rewardTransaction.count({ where })

    // Get transactions with related data
    const transactions = await (prisma as any).rewardTransaction.findMany({
      where,
      include: {
        action: {
          select: {
            id: true,
            title: true,
            slug: true,
            type: true
          }
        },
        badge: {
          select: {
            id: true,
            name: true,
            icon: true,
            tier: true
          }
        },
        quest: {
          select: {
            id: true,
            title: true,
            type: true
          }
        },
        redemption: {
          select: {
            id: true,
            status: true,
            pointsSpent: true,
            reward: {
              select: {
                id: true,
                name: true,
                description: true,
                image: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    })

    // Get user's current points for context
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        loyaltyPoints: true,
        loyaltyTier: true
      }
    })

    // Calculate summary stats
    const stats = await (prisma as any).rewardTransaction.aggregate({
      where: {
        userId: session.user.id
      },
      _sum: {
        points: true
      }
    })

    const earnedTotal = await (prisma as any).rewardTransaction.aggregate({
      where: {
        userId: session.user.id,
        points: { gt: 0 }
      },
      _sum: {
        points: true
      }
    })

    const spentTotal = await (prisma as any).rewardTransaction.aggregate({
      where: {
        userId: session.user.id,
        points: { lt: 0 }
      },
      _sum: {
        points: true
      }
    })

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      summary: {
        currentBalance: user?.loyaltyPoints || 0,
        currentTier: user?.loyaltyTier || "BRONZE",
        totalEarned: earnedTotal._sum.points || 0,
        totalSpent: Math.abs(spentTotal._sum.points || 0),
        netPoints: stats._sum.points || 0
      }
    })
  } catch (error) {
    console.error("Error fetching reward history:", error)
    return NextResponse.json(
      { error: "Failed to fetch reward history" },
      { status: 500 }
    )
  }
}
