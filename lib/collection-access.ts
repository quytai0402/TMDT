export type CollectionAccessInfo = {
  membersOnly: boolean
  locked: boolean
  requiredLabel: string | null
}

export function evaluateCollectionAccess(
  tags: string[] | null | undefined,
  membershipStatus: string | null,
  membershipPlanSlug: string | null,
): CollectionAccessInfo {
  const normalized = (tags ?? []).map((tag) => tag.toLowerCase())
  const membersOnly = normalized.some((tag) => tag.includes("members"))
  const requiresDiamond = normalized.some((tag) => tag.includes("diamond"))
  const requiresGold = !requiresDiamond && normalized.some((tag) => tag.includes("gold"))
  const membershipActive = membershipStatus === "ACTIVE"

  if (!membersOnly) {
    return { membersOnly: false, locked: false, requiredLabel: null }
  }

  if (!membershipActive) {
    return {
      membersOnly: true,
      locked: true,
      requiredLabel: requiresDiamond ? "Diamond" : requiresGold ? "Gold" : "Hội viên",
    }
  }

  if (requiresDiamond && membershipPlanSlug !== "diamond") {
    return { membersOnly: true, locked: true, requiredLabel: "Diamond" }
  }

  if (requiresGold && !["gold", "diamond"].includes(membershipPlanSlug ?? "")) {
    return { membersOnly: true, locked: true, requiredLabel: "Gold trở lên" }
  }

  return {
    membersOnly: true,
    locked: false,
    requiredLabel: requiresDiamond ? "Diamond" : requiresGold ? "Gold" : "Hội viên",
  }
}
