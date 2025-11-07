import type { Prisma } from "@prisma/client"
import { getLoyaltyDiscountConfig } from "@/lib/loyalty-discounts"

export const cloneMetadata = (metadata: unknown): Prisma.JsonObject => {
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
    return { ...(metadata as Record<string, Prisma.JsonValue>) }
  }

  return {}
}

export const normalizePhone = (value: string) => value.replace(/\D/g, "")

export const formatBookingResponse = (booking: any, userId: string) => {
  const guestContact = {
    name: booking.contactName || booking.guest?.name || "Khách vãng lai",
    email: booking.contactEmail || booking.guest?.email || null,
    phone: booking.contactPhone || booking.guest?.phone || null,
    guestType: booking.guestType,
  }

  const hasReview = Boolean(booking.review)
  const canReview =
    booking.status === "COMPLETED" &&
    userId === booking.guestId &&
    !hasReview

  const additionalServices = Array.isArray(booking.additionalServices)
    ? booking.additionalServices
    : []

  return {
    ...booking,
    additionalServices,
    guestContact,
    canReview,
    hasReview,
    reviewUrl: canReview ? `/trips/${booking.id}/review` : null,
  }
}

type MembershipPlanSnapshot = {
  id?: string | null
  slug?: string | null
  name?: string | null
  bookingDiscountRate?: number | null
  applyDiscountToServices?: boolean | null
}

type MembershipDiscountParams = {
  membershipStatus?: MembershipStatus | null
  membershipExpiresAt?: Date | string | null
  membershipPlan?: MembershipPlanSnapshot | null
  loyaltyTier?: string | null
  accommodationSubtotal: number
  additionalServicesTotal: number
}

export const resolveMembershipDiscount = ({
  membershipStatus,
  membershipExpiresAt,
  membershipPlan,
  loyaltyTier,
  accommodationSubtotal,
  additionalServicesTotal,
}: MembershipDiscountParams) => {
  const now = new Date()
  const expiresAt = membershipExpiresAt ? new Date(membershipExpiresAt) : null
  const normalizedStatus =
    typeof membershipStatus === "string" ? membershipStatus.toUpperCase() : ""
  const membershipIsActive = normalizedStatus === "ACTIVE" && (!expiresAt || expiresAt >= now)

  let discountRate = 0
  let appliesToServices = false
  let planMeta: Record<string, unknown> | null = null

  if (membershipIsActive && membershipPlan) {
    discountRate = Math.max(0, Number(membershipPlan.bookingDiscountRate ?? 0))
    appliesToServices = Boolean(membershipPlan.applyDiscountToServices)
    planMeta = {
      id: membershipPlan.id,
      name: membershipPlan.name,
      slug: membershipPlan.slug,
    }
  } else if (loyaltyTier) {
    const loyaltyConfig = getLoyaltyDiscountConfig(loyaltyTier)
    if (loyaltyConfig.rate > 0) {
      discountRate = loyaltyConfig.rate
      appliesToServices = loyaltyConfig.applyToServices
      planMeta = {
        name: loyaltyConfig.label ?? `Hạng ${loyaltyTier}`,
        slug: loyaltyTier.toLowerCase(),
      }
    }
  }

  const discountableSubtotal =
    accommodationSubtotal + (appliesToServices ? additionalServicesTotal : 0)

  const amount =
    discountRate > 0
      ? Math.min(
          Math.round(discountableSubtotal * (discountRate / 100)),
          discountableSubtotal,
        )
      : 0

  return {
    amount,
    rate: discountRate,
    appliesToServices,
    planMeta,
  }
}
