export type LoyaltyDiscountKey = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" | "DIAMOND"

const DEFAULT_CONFIG = { rate: 0, applyToServices: false, label: null as string | null }

const LOYALTY_DISCOUNT_CONFIG: Record<LoyaltyDiscountKey, { rate: number; applyToServices: boolean; label: string }> = {
  BRONZE: { rate: 0, applyToServices: false, label: "Hạng Bronze" },
  SILVER: { rate: 5, applyToServices: false, label: "Hạng Silver" },
  GOLD: { rate: 10, applyToServices: true, label: "Hạng Gold" },
  PLATINUM: { rate: 12, applyToServices: true, label: "Hạng Platinum" },
  DIAMOND: { rate: 15, applyToServices: true, label: "Hạng Diamond" },
}

export const getLoyaltyDiscountConfig = (tier?: string | null) => {
  if (!tier) {
    return DEFAULT_CONFIG
  }

  const normalized = tier.toUpperCase() as LoyaltyDiscountKey
  if (normalized in LOYALTY_DISCOUNT_CONFIG) {
    return LOYALTY_DISCOUNT_CONFIG[normalized]
  }

  return DEFAULT_CONFIG
}

export const getLoyaltyLabel = (tier?: string | null) => getLoyaltyDiscountConfig(tier).label

export type LoyaltyDiscountConfig = ReturnType<typeof getLoyaltyDiscountConfig>
