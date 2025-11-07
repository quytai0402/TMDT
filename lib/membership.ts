import { MembershipBillingCycle, MembershipStatus, LoyaltyTier } from "@prisma/client"
import { prisma } from "./prisma"

export type MembershipDetails = {
  status: MembershipStatus
  isActive: boolean
  startedAt: Date | null
  expiresAt: Date | null
  billingCycle: MembershipBillingCycle | null
  features: string[]
  plan: {
    id: string
    slug: string
    name: string
    color: string | null
    icon: string | null
    features: string[]
    exclusiveFeatures: string[]
    bookingDiscountRate: number
    applyDiscountToServices: boolean
    experienceDiscountRate: number
  } | null
}

export async function getMembershipForUser(userId: string): Promise<MembershipDetails | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      membershipStatus: true,
      membershipStartedAt: true,
      membershipExpiresAt: true,
      membershipBillingCycle: true,
      membershipFeatures: true,
      membershipPlan: {
        select: {
          id: true,
          slug: true,
          name: true,
          color: true,
          icon: true,
          features: true,
          exclusiveFeatures: true,
          bookingDiscountRate: true,
          applyDiscountToServices: true,
          experienceDiscountRate: true,
        },
      },
    },
  })

  if (!user) {
    return null
  }

  let currentStatus = user.membershipStatus
  const now = new Date()

  if (
    currentStatus === MembershipStatus.ACTIVE &&
    user.membershipExpiresAt &&
    user.membershipExpiresAt < now
  ) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        membershipStatus: MembershipStatus.EXPIRED,
      },
    })
    currentStatus = MembershipStatus.EXPIRED
  }

  const isActive =
    currentStatus === MembershipStatus.ACTIVE &&
    (!user.membershipExpiresAt || user.membershipExpiresAt >= now)

  return {
    status: currentStatus,
    isActive,
    startedAt: user.membershipStartedAt,
    expiresAt: user.membershipExpiresAt,
    billingCycle: user.membershipBillingCycle,
    features: user.membershipFeatures ?? [],
    plan: user.membershipPlan
      ? {
          id: user.membershipPlan.id,
          slug: user.membershipPlan.slug,
          name: user.membershipPlan.name,
          color: user.membershipPlan.color,
          icon: user.membershipPlan.icon,
          features: user.membershipPlan.features,
          exclusiveFeatures: user.membershipPlan.exclusiveFeatures,
          bookingDiscountRate: user.membershipPlan.bookingDiscountRate,
          applyDiscountToServices: user.membershipPlan.applyDiscountToServices,
          experienceDiscountRate: user.membershipPlan.experienceDiscountRate,
        }
      : null,
  }
}

const LOYALTY_TIER_MAP: Record<string, LoyaltyTier> = {
  silver: LoyaltyTier.SILVER,
  gold: LoyaltyTier.GOLD,
  diamond: LoyaltyTier.DIAMOND,
  platinum: LoyaltyTier.PLATINUM,
  bronze: LoyaltyTier.BRONZE,
}

export function mapMembershipPlanToLoyaltyTier(slug: string, fallback: LoyaltyTier): LoyaltyTier {
  const normalized = slug.trim().toLowerCase()
  return LOYALTY_TIER_MAP[normalized] ?? fallback
}
