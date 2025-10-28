import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { mapMembershipPlanToLoyaltyTier } from "@/lib/membership"
import {
  LoyaltyTier,
  MembershipBillingCycle,
  MembershipStatus,
  RewardSource,
  RewardTransactionType,
} from "@prisma/client"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const planSlug: string | undefined = body?.planSlug
    const billingCycle: string | undefined = body?.billingCycle

    if (!planSlug) {
      return NextResponse.json({ error: "Missing membership plan" }, { status: 400 })
    }

    const plan = await prisma.membershipPlan.findUnique({
      where: { slug: planSlug },
    })

    if (!plan) {
      return NextResponse.json({ error: "Membership plan not found" }, { status: 404 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        loyaltyPoints: true,
        loyaltyTier: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const now = new Date()
    const cycle = billingCycle === "monthly" ? MembershipBillingCycle.MONTHLY : MembershipBillingCycle.ANNUAL
    const expiresAt = new Date(now)
    if (cycle === MembershipBillingCycle.MONTHLY) {
      expiresAt.setMonth(expiresAt.getMonth() + 1)
    } else {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1)
    }

    const combinedFeatures = Array.from(
      new Set([...(plan.features ?? []), ...(plan.exclusiveFeatures ?? [])])
    )

    const targetTier: LoyaltyTier = mapMembershipPlanToLoyaltyTier(plan.slug, user.loyaltyTier)
    const bonusPoints = cycle === MembershipBillingCycle.ANNUAL ? 2000 : 800
    const newBalance = user.loyaltyPoints + bonusPoints

    await prisma.user.update({
      where: { id: user.id },
      data: {
        membershipPlanId: plan.id,
        membershipStatus: MembershipStatus.ACTIVE,
        membershipStartedAt: now,
        membershipExpiresAt: expiresAt,
        membershipBillingCycle: cycle,
        membershipFeatures: combinedFeatures,
        loyaltyTier: targetTier,
        loyaltyPoints: {
          increment: bonusPoints,
        },
      },
    })

    await prisma.rewardTransaction.create({
      data: {
        userId: user.id,
        transactionType: RewardTransactionType.CREDIT,
        source: RewardSource.MEMBERSHIP,
        points: bonusPoints,
        balanceAfter: newBalance,
        description: `Thưởng kích hoạt membership ${plan.name}`,
        metadata: {
          planSlug: plan.slug,
          billingCycle: cycle,
        },
      },
    })

    return NextResponse.json({
      success: true,
      membership: {
        status: MembershipStatus.ACTIVE,
        startedAt: now,
        expiresAt,
        billingCycle: cycle,
        loyaltyTier: targetTier,
        bonusPoints,
        features: combinedFeatures,
        plan: {
          slug: plan.slug,
          name: plan.name,
          color: plan.color,
          icon: plan.icon,
          exclusiveFeatures: plan.exclusiveFeatures,
        },
      },
    })
  } catch (error) {
    console.error("Membership activation error:", error)
    return NextResponse.json({ error: "Failed to activate membership" }, { status: 500 })
  }
}
