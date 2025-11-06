// Helper functions for quest progress tracking

export type QuestTrigger = 
  | 'BOOKING_CREATED'
  | 'BOOKING_COMPLETED'
  | 'REVIEW_CREATED'
  | 'WISHLIST_ADDED'
  | 'PROFILE_COMPLETED'
  | 'EMAIL_VERIFIED'
  | 'PHONE_VERIFIED'
  | 'PAYMENT_METHOD_ADDED'
  | 'COLLECTION_CREATED'
  | 'LISTING_VIEWED'
  | 'LISTING_SHARED'
  | 'POST_CREATED'
  | 'DAILY_CHECK_IN'

// Map quest types to triggers
const QUEST_TYPE_TRIGGERS: Record<string, QuestTrigger> = {
  'FIRST_BOOKING': 'BOOKING_CREATED',
  'COMPLETE_BOOKING': 'BOOKING_COMPLETED',
  'WRITE_REVIEW': 'REVIEW_CREATED',
  'ADD_WISHLIST': 'WISHLIST_ADDED',
  'PROFILE_COMPLETION': 'PROFILE_COMPLETED',
  'EMAIL_VERIFICATION': 'EMAIL_VERIFIED',
  'PHONE_VERIFICATION': 'PHONE_VERIFIED',
  'ADD_PAYMENT_METHOD': 'PAYMENT_METHOD_ADDED',
  'CREATE_COLLECTION': 'COLLECTION_CREATED',
  'VIEW_LISTINGS': 'LISTING_VIEWED',
  'SHARE_LISTING': 'LISTING_SHARED',
  'COMMUNITY_POST': 'POST_CREATED',
  'DAILY_CHECK_IN': 'DAILY_CHECK_IN'
}

/**
 * Track quest progress when user performs an action
 */
export async function trackQuestProgress(
  trigger: QuestTrigger,
  metadata?: Record<string, any>
) {
  try {
    const payload = JSON.stringify({ trigger, metadata })
    const headers = { 'Content-Type': 'application/json' }
    const baseInit: RequestInit = {
      method: 'POST',
      headers,
      body: payload,
      cache: 'no-store',
    }

    const logFailure = async (response: Response) => {
      let detail: string | undefined

      try {
        detail = await response.text()
      } catch (error) {
        detail = undefined
      }

      const context = detail && detail.length > 0 ? ` (${detail})` : ''
      const message = `Quest tracking failed [${response.status}]: ${response.statusText}${context}`

      if (response.status >= 500) {
        console.error(message)
      } else {
        console.warn(message)
      }
    }

    if (typeof window === 'undefined') {
      const baseUrl =
        process.env.NEXTAUTH_URL ??
        process.env.NEXT_PUBLIC_APP_URL ??
        'http://localhost:3000'

      const response = await fetch(`${baseUrl}/api/quests/track`, baseInit)

      if (!response.ok) {
        await logFailure(response)
        return null
      }

      return await response.json()
    }

    const response = await fetch('/api/quests/track', {
      ...baseInit,
      credentials: 'include',
    })

    if (!response.ok) {
      await logFailure(response)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Error tracking quest progress:', error)
    return null
  }
}

/**
 * Track booking quest (first booking, complete booking)
 */
export async function trackBookingQuest(bookingId: string, isCompleted: boolean = false) {
  const trigger = isCompleted ? 'BOOKING_COMPLETED' : 'BOOKING_CREATED'
  return trackQuestProgress(trigger, { bookingId })
}

/**
 * Track review quest
 */
export async function trackReviewQuest(reviewId: string, rating: number) {
  return trackQuestProgress('REVIEW_CREATED', { reviewId, rating })
}

/**
 * Track wishlist quest
 */
export async function trackWishlistQuest(listingId: string) {
  return trackQuestProgress('WISHLIST_ADDED', { listingId })
}

/**
 * Track profile completion quest
 */
export async function trackProfileCompletionQuest() {
  return trackQuestProgress('PROFILE_COMPLETED')
}

/**
 * Track verification quests
 */
export async function trackEmailVerificationQuest() {
  return trackQuestProgress('EMAIL_VERIFIED')
}

export async function trackPhoneVerificationQuest() {
  return trackQuestProgress('PHONE_VERIFIED')
}

/**
 * Track payment method quest
 */
export async function trackPaymentMethodQuest(methodId: string) {
  return trackQuestProgress('PAYMENT_METHOD_ADDED', { methodId })
}

/**
 * Track collection quest
 */
export async function trackCollectionQuest(collectionId: string) {
  return trackQuestProgress('COLLECTION_CREATED', { collectionId })
}

/**
 * Track listing view quest
 */
export async function trackListingViewQuest(listingId: string) {
  return trackQuestProgress('LISTING_VIEWED', { listingId })
}

/**
 * Track listing share quest
 */
export async function trackListingShareQuest(listingId: string, platform: string) {
  return trackQuestProgress('LISTING_SHARED', { listingId, platform })
}

/**
 * Track community post quest
 */
export async function trackCommunityPostQuest(postId: string) {
  return trackQuestProgress('POST_CREATED', { postId })
}

/**
 * Track daily check-in quest
 */
export async function trackDailyCheckInQuest() {
  return trackQuestProgress('DAILY_CHECK_IN')
}
