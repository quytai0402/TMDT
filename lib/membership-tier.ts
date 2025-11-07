const MEMBERSHIP_PRIORITY = ["BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND"] as const

export type NormalizedMembershipTier = typeof MEMBERSHIP_PRIORITY[number]

export function normalizeMembershipTier(value?: string | null): NormalizedMembershipTier | null {
  if (!value) return null
  const upper = value.trim().toUpperCase()
  if (upper.includes("DIAMOND")) return "DIAMOND"
  if (upper.includes("PLATINUM")) return "PLATINUM"
  if (upper.includes("GOLD")) return "GOLD"
  if (upper.includes("SILVER")) return "SILVER"
  if (upper.includes("BRONZE")) return "BRONZE"
  return MEMBERSHIP_PRIORITY.includes(upper as NormalizedMembershipTier) ? (upper as NormalizedMembershipTier) : null
}

export function resolveHighestMembershipTier(
  ...values: Array<string | null | undefined>
): NormalizedMembershipTier | null {
  let highest: NormalizedMembershipTier | null = null

  for (const raw of values) {
    const normalized = normalizeMembershipTier(raw)
    if (!normalized) continue
    if (!highest) {
      highest = normalized
      continue
    }

    const currentIndex = MEMBERSHIP_PRIORITY.indexOf(normalized)
    const highestIndex = MEMBERSHIP_PRIORITY.indexOf(highest)
    if (currentIndex > highestIndex) {
      highest = normalized
    }
  }

  return highest
}
