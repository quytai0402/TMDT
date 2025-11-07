import {
  meetsTierRequirement,
  normalizeMembershipTier,
  resolveHighestMembershipTier,
  type NormalizedMembershipTier,
} from "@/lib/membership-tier"

const DEFAULT_FEATURES = {
  conciergeLiveChat: {
    minTier: "DIAMOND" as NormalizedMembershipTier,
    envKey: "FEATURE_CONCIERGE_MIN_TIER",
  },
  hostAutomation: {
    minTier: "GOLD" as NormalizedMembershipTier,
    envKey: "FEATURE_AUTOMATION_MIN_TIER",
  },
}

export type FeatureName = keyof typeof DEFAULT_FEATURES

type FeatureGate = {
  minTier: NormalizedMembershipTier | null
}

function parseTierFromEnv(key: string, fallback: NormalizedMembershipTier): NormalizedMembershipTier {
  const envValue = process.env[key]
  const normalized = normalizeMembershipTier(envValue)
  return normalized ?? fallback
}

const featureConfig: Record<FeatureName, FeatureGate> = {
  conciergeLiveChat: {
    minTier: parseTierFromEnv(DEFAULT_FEATURES.conciergeLiveChat.envKey, DEFAULT_FEATURES.conciergeLiveChat.minTier),
  },
  hostAutomation: {
    minTier: parseTierFromEnv(DEFAULT_FEATURES.hostAutomation.envKey, DEFAULT_FEATURES.hostAutomation.minTier),
  },
}

export function getFeatureGate(name: FeatureName) {
  return featureConfig[name]
}

export function canAccessFeature(
  name: FeatureName,
  membershipTier?: string | null,
  planTier?: string | null,
) {
  const gate = getFeatureGate(name)
  if (!gate) return true

  const effectiveTier = resolveHighestMembershipTier(
    membershipTier ? normalizeMembershipTier(membershipTier) : null,
    planTier ? normalizeMembershipTier(planTier) : null,
  )

  return meetsTierRequirement(effectiveTier, gate.minTier)
}
