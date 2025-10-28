import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getMembershipForUser } from "@/lib/membership"

const MEMBERSHIP_CONFIG = {
  BRONZE: { freeNights: 0, upgrades: 0 },
  SILVER: { freeNights: 1, upgrades: 1 },
  GOLD: { freeNights: 2, upgrades: 2 },
  PLATINUM: { freeNights: 3, upgrades: 3 },
  DIAMOND: { freeNights: 4, upgrades: 4 },
} as const

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        loyaltyPoints: true,
        loyaltyTier: true,
        createdAt: true,
        membershipStatus: true,
        membershipStartedAt: true,
        membershipExpiresAt: true,
        membershipBillingCycle: true,
        membershipFeatures: true,
        membershipPlan: {
          select: {
            slug: true,
            name: true,
            color: true,
            icon: true,
            features: true,
            exclusiveFeatures: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const tiers = await prisma.rewardTier.findMany({
      orderBy: { minPoints: "asc" },
    })

    const currentTier = tiers.find((tier) => tier.tier === user.loyaltyTier)
    const currentTierIndex = tiers.findIndex((tier) => tier.tier === user.loyaltyTier)
    const nextTier = currentTierIndex >= 0 ? tiers[currentTierIndex + 1] ?? null : null

    const startOfYear = new Date(new Date().getFullYear(), 0, 1)

    const bookingsThisYear = await prisma.booking.count({
      where: {
        guestId: user.id,
        status: { in: ['COMPLETED', 'CONFIRMED'] },
        checkIn: { gte: startOfYear },
      },
    })

    const freeNightRedemptions = await prisma.rewardRedemption.count({
      where: {
        userId: user.id,
        status: 'COMPLETED',
        reward: {
          slug: { contains: 'free-night', mode: 'insensitive' },
        },
      },
    })

    const upgradeRedemptions = await prisma.rewardRedemption.count({
      where: {
        userId: user.id,
        status: 'COMPLETED',
        reward: {
          category: 'UPGRADE',
        },
      },
    })

    const experienceBookings = await prisma.experienceBooking.count({
      where: {
        guestId: user.id,
        status: { in: ['COMPLETED', 'CONFIRMED'] },
      },
    })

    const config = MEMBERSHIP_CONFIG[user.loyaltyTier] ?? MEMBERSHIP_CONFIG.BRONZE
    const freeNightsRemaining = Math.max(config.freeNights - freeNightRedemptions, 0)

    const pointsToNextTier = nextTier
      ? Math.max(nextTier.minPoints - user.loyaltyPoints, 0)
      : null

    const membership = await getMembershipForUser(user.id)

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        loyaltyPoints: user.loyaltyPoints,
        joinDate: user.createdAt,
      },
      currentTier: currentTier
        ? {
            tier: currentTier.tier,
            name: currentTier.name,
            minPoints: currentTier.minPoints,
            maxPoints: currentTier.maxPoints,
            benefits: currentTier.benefits,
            bonusMultiplier: currentTier.bonusMultiplier,
            pointsToNextTier,
            nextTier: nextTier ? nextTier.name : null,
          }
        : null,
      metrics: {
        bookingsThisYear,
        freeNightsUsed: freeNightRedemptions,
        freeNightsRemaining,
        upgradesReceived: upgradeRedemptions,
        eventsAttended: experienceBookings,
        totalSavings: Math.max(user.loyaltyPoints * 1000, 0),
      },
      tiers,
      membership,
    })
  } catch (error) {
    console.error('Membership status error:', error)
    return NextResponse.json({ error: 'Failed to load membership status' }, { status: 500 })
  }
}
