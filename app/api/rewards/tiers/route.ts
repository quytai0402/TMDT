import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/rewards/tiers
 * List all reward tiers with their benefits and requirements
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get all tiers
    const tiers = await (prisma as any).rewardTier.findMany({
      orderBy: {
        minPoints: 'asc'
      },
      select: {
        id: true,
        tier: true,
        name: true,
        description: true,
        minPoints: true,
        maxPoints: true,
        bonusMultiplier: true,
        benefits: true,
        displayOrder: true
      }
    })

    // Get user's current points and tier
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        loyaltyPoints: true,
        loyaltyTier: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Find user's current tier
    let currentTier = tiers.find((tier: any) => 
      user.loyaltyPoints >= tier.minPoints &&
      (!tier.maxPoints || user.loyaltyPoints <= tier.maxPoints)
    ) || tiers[0]

    // Find next tier
    const currentTierIndex = tiers.findIndex((t: any) => t.id === currentTier.id)
    const nextTier = tiers[currentTierIndex + 1]

    let progress = null
    if (nextTier) {
      const currentThreshold = tiers[currentTierIndex]?.minPoints || 0
      const nextThreshold = nextTier.minPoints
      const pointsInCurrentTier = user.loyaltyPoints - currentThreshold
      const pointsNeededForNextTier = nextThreshold - currentThreshold

      progress = {
        currentPoints: user.loyaltyPoints,
        nextTierPoints: nextThreshold,
        pointsToNextTier: Math.max(0, nextThreshold - user.loyaltyPoints),
        progressPercentage: Math.min(100, (pointsInCurrentTier / pointsNeededForNextTier) * 100)
      }
    }

    // Calculate points until next tier
    const pointsToNextTier = nextTier
      ? Math.max(0, nextTier.minPoints - user.loyaltyPoints)
      : 0

    return NextResponse.json({
      tiers,
      currentTier: user.loyaltyTier,
      currentPoints: user.loyaltyPoints,
      progress: progress ? Math.round(progress.progressPercentage) : 0,
      nextTier: nextTier || null,
      pointsToNextTier
    })
  } catch (error) {
    console.error("Error fetching reward tiers:", error)
    return NextResponse.json(
      { error: "Failed to fetch reward tiers" },
      { status: 500 }
    )
  }
}
