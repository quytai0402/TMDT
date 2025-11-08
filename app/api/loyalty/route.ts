import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { BookingStatus, RewardRedemptionStatus } from "@prisma/client"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const FALLBACK_TIERS = [
  {
    id: "bronze",
    tier: "BRONZE",
    name: "Bronze",
    minPoints: 0,
    maxPoints: 999,
    benefits: ["Ưu đãi đặt trước 48h", "Tích 1x điểm cho mỗi 10.000đ"],
    bonusMultiplier: 1,
    displayOrder: 1,
    color: "#a08cd9",
  },
  {
    id: "silver",
    tier: "SILVER",
    name: "Silver",
    minPoints: 1000,
    maxPoints: 2999,
    benefits: ["Ưu tiên hỗ trợ", "Late check-out 2 giờ", "Tích 1.25x điểm"],
    bonusMultiplier: 1.25,
    displayOrder: 2,
    color: "#8fb6d9",
  },
  {
    id: "gold",
    tier: "GOLD",
    name: "Gold",
    minPoints: 3000,
    maxPoints: 4999,
    benefits: ["Nâng hạng phòng miễn phí (nếu có)", "Early check-in 2 giờ", "Tích 1.5x điểm"],
    bonusMultiplier: 1.5,
    displayOrder: 3,
    color: "#f4c84c",
  },
  {
    id: "platinum",
    tier: "PLATINUM",
    name: "Platinum",
    minPoints: 5000,
    maxPoints: null,
    benefits: ["Concierge 24/7", "Ưu đãi spa/đưa đón", "Tích 2x điểm"],
    bonusMultiplier: 2,
    displayOrder: 4,
    color: "#d4af37",
  },
]

const MEMBERSHIP_CONFIG = {
  BRONZE: { freeNights: 0, upgrades: 0 },
  SILVER: { freeNights: 1, upgrades: 1 },
  GOLD: { freeNights: 2, upgrades: 2 },
  PLATINUM: { freeNights: 3, upgrades: 3 },
  DIAMOND: { freeNights: 4, upgrades: 4 },
} as const

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

    let tiers: any[] = []
    if (rewardTierDelegate?.findMany) {
      try {
        tiers = await rewardTierDelegate.findMany({
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
      } catch (tierError) {
        console.warn("Failed to load reward tiers, using fallback:", tierError)
      }
    } else {
      console.warn("RewardTier delegate unavailable on Prisma client. Using fallback tiers.")
    }

    if (!Array.isArray(tiers) || tiers.length === 0) {
      tiers = FALLBACK_TIERS
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
        color: tier.color ?? tier.badge?.color ?? "#2E86DE",
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

    const startOfYear = new Date(new Date().getFullYear(), 0, 1)
    const redemptionStatusFilter = {
      in: [RewardRedemptionStatus.FULFILLED, RewardRedemptionStatus.APPROVED],
    } as const

    const [
      bookingsThisYear,
      experienceBookings,
      freeNightRedemptions,
      upgradeRedemptions,
    ] = await Promise.all([
      prisma.booking.count({
        where: {
          guestId: user.id,
          status: { in: [BookingStatus.COMPLETED, BookingStatus.CONFIRMED] },
          checkIn: { gte: startOfYear },
        },
      }),
      prisma.experienceBooking.count({
        where: {
          guestId: user.id,
          status: { in: [BookingStatus.COMPLETED, BookingStatus.CONFIRMED] },
        },
      }),
      prisma.rewardRedemption.count({
        where: {
          userId: user.id,
          status: redemptionStatusFilter,
          reward: {
            slug: { contains: "free-night", mode: "insensitive" },
          },
        },
      }),
      prisma.rewardRedemption.count({
        where: {
          userId: user.id,
          status: redemptionStatusFilter,
          reward: {
            category: "UPGRADE",
          },
        },
      }),
    ])

    const normalizedTier = (user.loyaltyTier ?? "BRONZE").toUpperCase()
    const config =
      MEMBERSHIP_CONFIG[normalizedTier as keyof typeof MEMBERSHIP_CONFIG] ??
      MEMBERSHIP_CONFIG.BRONZE
    const freeNightsRemaining = Math.max(config.freeNights - freeNightRedemptions, 0)

    // Get recent bookings for activity
    let recentBookings: any[] = []
    try {
      recentBookings = await prisma.booking.findMany({
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
    } catch (bookingHistoryError) {
      console.warn("Failed to load recent bookings for loyalty dashboard:", bookingHistoryError)
    }

    let rewardHistory: any[] = []
    if (rewardTransactionDelegate?.findMany) {
      try {
        rewardHistory = await rewardTransactionDelegate.findMany({
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
      } catch (historyError) {
        console.warn("Failed to load reward history:", historyError)
      }
    }

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
      metrics: {
        bookingsThisYear,
        freeNightsRemaining,
        freeNightsUsed: freeNightRedemptions,
        upgradesReceived: upgradeRedemptions,
        eventsAttended: experienceBookings,
        totalSavings: Math.max(user.loyaltyPoints * 1000, 0),
      },
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
