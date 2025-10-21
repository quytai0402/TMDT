/**
 * Rewards System Helper Functions
 * Utilities for awarding points and managing rewards
 */

// Import notification function dynamically to avoid circular dependencies
let showPointsNotificationFn: any = null
if (typeof window !== 'undefined') {
  import('@/components/points-earned-notification').then(mod => {
    showPointsNotificationFn = mod.showPointsNotification
  })
}

export interface AwardPointsParams {
  actionType: 
    | "BOOKING_COMPLETED"
    | "REVIEW_SUBMITTED"
    | "REFERRAL_SIGNUP"
    | "PROFILE_COMPLETED"
    | "FIRST_BOOKING"
    | "REPEAT_BOOKING"
    | "IDENTITY_VERIFIED"
    | "PAYMENT_METHOD_ADDED"
    | "WISHLIST_CREATED"
    | "SOCIAL_SHARE"
    | "NEWSLETTER_SIGNUP"
    | "PROPERTY_LISTING"
    | "SUPERHOST_ACHIEVED"
    | "DAILY_CHECK_IN"
    | "QUEST_COMPLETION"
  metadata?: Record<string, any>
  bookingId?: string
  questId?: string
  multiplier?: number
}

export interface AwardPointsResult {
  success: boolean
  transaction?: {
    id: string
    points: number
    action: string
    description: string
  }
  user?: {
    newBalance: number
    currentTier: string
    tierUpgraded: boolean
  }
  badgesEarned?: Array<{
    id: string
    name: string
    icon: string
    bonusPoints: number
  }>
  error?: string
}

/**
 * Award points to user for completing an action
 * This makes an API call to /api/rewards/actions
 */
export async function awardPoints(
  params: AwardPointsParams
): Promise<AwardPointsResult> {
  try {
    const response = await fetch("/api/rewards/actions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      const error = await response.json()
      return {
        success: false,
        error: error.error || "Failed to award points",
      }
    }

    const data = await response.json()
    
    // Show notification if available
    if (showPointsNotificationFn && data.transaction) {
      showPointsNotificationFn({
        points: data.transaction.points,
        action: data.transaction.description || data.transaction.action,
        tierUpgraded: data.user?.tierUpgraded,
        newTier: data.user?.tierUpgraded ? data.user.currentTier : undefined,
        badges: data.badgesEarned || []
      })
    }
    
    return {
      success: true,
      ...data,
    }
  } catch (error) {
    console.error("Error awarding points:", error)
    return {
      success: false,
      error: "Network error while awarding points",
    }
  }
}

/**
 * Award points for booking completion
 * Called after successful booking creation or payment
 */
export async function awardBookingPoints(
  bookingId: string,
  isFirstBooking: boolean = false
): Promise<AwardPointsResult> {
  const actionType = isFirstBooking ? "FIRST_BOOKING" : "BOOKING_COMPLETED"
  
  return awardPoints({
    actionType,
    bookingId,
    metadata: {
      bookingId,
      timestamp: new Date().toISOString(),
    },
  })
}

/**
 * Award points for review submission
 */
export async function awardReviewPoints(
  reviewId: string,
  metadata?: Record<string, any>
): Promise<AwardPointsResult> {
  return awardPoints({
    actionType: "REVIEW_SUBMITTED",
    metadata: {
      reviewId,
      ...metadata,
      timestamp: new Date().toISOString(),
    },
  })
}

/**
 * Award points for profile completion
 */
export async function awardProfileCompletionPoints(): Promise<AwardPointsResult> {
  return awardPoints({
    actionType: "PROFILE_COMPLETED",
    metadata: {
      timestamp: new Date().toISOString(),
    },
  })
}

/**
 * Award points for identity verification
 */
export async function awardIdentityVerificationPoints(): Promise<AwardPointsResult> {
  return awardPoints({
    actionType: "IDENTITY_VERIFIED",
    metadata: {
      timestamp: new Date().toISOString(),
    },
  })
}

/**
 * Award points for adding payment method
 */
export async function awardPaymentMethodPoints(): Promise<AwardPointsResult> {
  return awardPoints({
    actionType: "PAYMENT_METHOD_ADDED",
    metadata: {
      timestamp: new Date().toISOString(),
    },
  })
}

/**
 * Award points for social share
 */
export async function awardSocialSharePoints(
  platform: string,
  contentId: string
): Promise<AwardPointsResult> {
  return awardPoints({
    actionType: "SOCIAL_SHARE",
    metadata: {
      platform,
      contentId,
      timestamp: new Date().toISOString(),
    },
  })
}

/**
 * Award points for daily check-in
 */
export async function awardDailyCheckInPoints(): Promise<AwardPointsResult> {
  return awardPoints({
    actionType: "DAILY_CHECK_IN",
    metadata: {
      timestamp: new Date().toISOString(),
    },
  })
}

/**
 * Format points for display
 */
export function formatPoints(points: number): string {
  return points.toLocaleString()
}

/**
 * Get tier color for UI display
 */
export function getTierColor(tier: string): string {
  switch (tier) {
    case "BRONZE":
      return "bg-gradient-to-r from-amber-600 to-amber-400"
    case "SILVER":
      return "bg-gradient-to-r from-gray-400 to-gray-300"
    case "GOLD":
      return "bg-gradient-to-r from-yellow-500 to-yellow-300"
    case "PLATINUM":
      return "bg-gradient-to-r from-purple-500 to-purple-300"
    case "DIAMOND":
      return "bg-gradient-to-r from-blue-500 to-cyan-400"
    default:
      return "bg-gradient-to-r from-gray-500 to-gray-400"
  }
}

/**
 * Get tier badge color
 */
export function getTierBadgeColor(tier: string): string {
  switch (tier) {
    case "BRONZE":
      return "text-amber-600 bg-amber-50 border-amber-200"
    case "SILVER":
      return "text-gray-600 bg-gray-50 border-gray-200"
    case "GOLD":
      return "text-yellow-600 bg-yellow-50 border-yellow-200"
    case "PLATINUM":
      return "text-purple-600 bg-purple-50 border-purple-200"
    case "DIAMOND":
      return "text-blue-600 bg-blue-50 border-blue-200"
    default:
      return "text-gray-600 bg-gray-50 border-gray-200"
  }
}

/**
 * Check if user qualifies for tier upgrade based on points
 * Fetches reward tiers and determines if upgrade is available
 */
export async function checkTierUpgrade(
  currentPoints: number,
  currentTier: string
): Promise<{
  upgradeAvailable: boolean
  newTier?: string
  tierName?: string
  pointsNeeded?: number
  nextTier?: {
    tier: string
    name: string
    minPoints: number
  }
}> {
  try {
    // Fetch all reward tiers
    const response = await fetch("/api/rewards/tiers")
    
    if (!response.ok) {
      console.error("Failed to fetch reward tiers")
      return { upgradeAvailable: false }
    }

    const tiers = await response.json()
    
    // Sort tiers by minPoints ascending
    const sortedTiers = tiers.sort((a: any, b: any) => a.minPoints - b.minPoints)
    
    // Find current tier index
    const currentTierIndex = sortedTiers.findIndex(
      (t: any) => t.tier === currentTier
    )
    
    if (currentTierIndex === -1) {
      console.error("Current tier not found in tiers list")
      return { upgradeAvailable: false }
    }
    
    // Find the highest tier user qualifies for based on points
    let qualifyingTierIndex = currentTierIndex
    for (let i = sortedTiers.length - 1; i >= 0; i--) {
      if (currentPoints >= sortedTiers[i].minPoints) {
        qualifyingTierIndex = i
        break
      }
    }
    
    // Check if upgrade is available
    if (qualifyingTierIndex > currentTierIndex) {
      const newTier = sortedTiers[qualifyingTierIndex]
      return {
        upgradeAvailable: true,
        newTier: newTier.tier,
        tierName: newTier.name,
      }
    }
    
    // No upgrade available, but show next tier info
    const nextTierIndex = currentTierIndex + 1
    if (nextTierIndex < sortedTiers.length) {
      const nextTier = sortedTiers[nextTierIndex]
      return {
        upgradeAvailable: false,
        pointsNeeded: nextTier.minPoints - currentPoints,
        nextTier: {
          tier: nextTier.tier,
          name: nextTier.name,
          minPoints: nextTier.minPoints,
        },
      }
    }
    
    // User is at max tier
    return { upgradeAvailable: false }
  } catch (error) {
    console.error("Error checking tier upgrade:", error)
    return { upgradeAvailable: false }
  }
}
