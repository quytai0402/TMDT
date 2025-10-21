import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/loyalty - Get user loyalty info
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        image: true,
        loyaltyPoints: true,
        loyaltyTier: true,
        createdAt: true,
        _count: {
          select: {
            bookingsAsGuest: true,
            reviewsWritten: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Pull tier definitions from database
  const rewardTierDelegate = (prisma as any).rewardTier
  const rewardTransactionDelegate = (prisma as any).rewardTransaction

  const tiers = await rewardTierDelegate.findMany({
      orderBy: { displayOrder: "asc" },
      include: {
        badge: {
          select: {
            slug: true,
            name: true,
            icon: true,
            color: true,
          },
        },
      },
    })

    if (!tiers.length) {
      return NextResponse.json(
        { error: "Reward tiers not configured" },
        { status: 500 }
      )
    }

  const orderedTiers = tiers.map((tier: any, index: number) => {
      const nextTier = tiers[index + 1]
      const pointsToNext = nextTier
        ? Math.max(nextTier.minPoints - user.loyaltyPoints, 0)
        : null

      return {
        id: tier.id,
        name: tier.name,
        tier: tier.tier,
        minPoints: tier.minPoints,
        maxPoints: tier.maxPoints,
        benefits: tier.benefits,
        bonusMultiplier: tier.bonusMultiplier,
        displayOrder: tier.displayOrder,
        color: tier.badge?.color ?? "#2E86DE",
        badge: tier.badge
          ? {
              slug: tier.badge.slug,
              name: tier.badge.name,
              icon: tier.badge.icon,
              color: tier.badge.color,
            }
          : null,
        nextTier: nextTier?.tier ?? null,
        pointsToNext,
      }
    })

    const currentTierData = orderedTiers.find(
      (tier: any) => tier.tier === user.loyaltyTier
    ) ?? orderedTiers[0]

    const nextTierData = orderedTiers.find(
      (tier: any) => tier.displayOrder > currentTierData.displayOrder
    )

    const tierProgress = nextTierData
      ? Math.min(
          1,
          (user.loyaltyPoints - currentTierData.minPoints) /
            Math.max(nextTierData.minPoints - currentTierData.minPoints, 1)
        )
      : 1

    // Get recent bookings for activity
    const recentBookings = await prisma.booking.findMany({
      where: { guestId: user.id },
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        checkIn: true,
        checkOut: true,
        totalPrice: true,
        status: true,
        listing: {
          select: {
            title: true,
            images: true,
            city: true,
          },
        },
      },
    })

  const rewardHistory = await rewardTransactionDelegate.findMany({
      where: { userId: user.id },
      orderBy: { occurredAt: "desc" },
      take: 10,
      include: {
        action: {
          select: {
            title: true,
            source: true,
            points: true,
          },
        },
        quest: {
          select: {
            title: true,
          },
        },
        redemption: {
          select: {
            status: true,
            reward: {
              select: {
                name: true,
                category: true,
              },
            },
          },
        },
      },
    })

    const recentActivity = [
      ...recentBookings.map((b) => ({
        id: b.id,
        type: "booking" as const,
        title: `Đặt phòng: ${b.listing.title}`,
        date: b.checkIn,
        location: b.listing.city,
        points: Math.floor(b.totalPrice / 10000),
        status: b.status,
      })),
      ...rewardHistory.map((transaction: any) => ({
        id: transaction.id,
        type: "reward" as const,
        title:
          transaction.action?.title ??
          transaction.quest?.title ??
          "Điểm thưởng",
        date: transaction.occurredAt,
        location: null,
        points:
          transaction.transactionType === "DEBIT"
            ? -transaction.points
            : transaction.points,
        status: transaction.source,
        metadata: {
          actionSource: transaction.action?.source,
          redemptionReward: transaction.redemption?.reward?.name,
          redemptionStatus: transaction.redemption?.status,
        },
      })),
    ].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        image: user.image,
        points: user.loyaltyPoints,
        tier: user.loyaltyTier,
        totalBookings: user._count.bookingsAsGuest,
        totalReviews: user._count.reviewsWritten,
        memberSince: user.createdAt,
        progressToNextTier: tierProgress,
        pointsToNextTier: nextTierData?.minPoints
          ? Math.max(nextTierData.minPoints - user.loyaltyPoints, 0)
          : null,
      },
      currentTier: currentTierData,
      allTiers: orderedTiers,
      recentActivity,
  rewardHistory: rewardHistory.map((transaction: any) => ({
        id: transaction.id,
        occurredAt: transaction.occurredAt,
        points: transaction.points,
        balanceAfter: transaction.balanceAfter,
        transactionType: transaction.transactionType,
        source: transaction.source,
        description: transaction.description,
        action: transaction.action
          ? {
              title: transaction.action.title,
              source: transaction.action.source,
              basePoints: transaction.action.points,
            }
          : null,
        quest: transaction.quest
          ? {
              title: transaction.quest.title,
            }
          : null,
        redemption: transaction.redemption
          ? {
              status: transaction.redemption.status,
              reward: transaction.redemption.reward?.name ?? null,
              category: transaction.redemption.reward?.category ?? null,
            }
          : null,
      })),
    })
  } catch (error) {
    console.error("Error fetching loyalty data:", error)
    return NextResponse.json(
      { error: "Failed to fetch loyalty data" },
      { status: 500 }
    )
  }
}
