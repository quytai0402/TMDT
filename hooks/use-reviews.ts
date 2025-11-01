'use client'

import { useState } from 'react'

export interface CreateReviewData {
  bookingId: string
  reviewType: 'GUEST_TO_HOST' | 'GUEST_TO_LISTING' | 'HOST_TO_GUEST'
  targetId: string
  rating: number
  comment: string
  categoryRatings?: {
    cleanliness?: number
    accuracy?: number
    checkIn?: number
    communication?: number
    location?: number
    value?: number
  }
}

export function useReviews() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createReview = async (data: CreateReviewData) => {
    setLoading(true)
    setError(null)

    try {
      const payload: Record<string, unknown> = {
        bookingId: data.bookingId,
        type: data.reviewType,
        overallRating: data.rating,
        comment: data.comment.trim(),
      }

      if (data.reviewType === 'GUEST_TO_LISTING' && data.categoryRatings) {
        const categories = data.categoryRatings

        if (categories.cleanliness) {
          payload.cleanlinessRating = categories.cleanliness
        }
        if (categories.accuracy) {
          payload.accuracyRating = categories.accuracy
        }
        if (categories.checkIn) {
          payload.checkInRating = categories.checkIn
        }
        if (categories.communication) {
          payload.communicationRating = categories.communication
        }
        if (categories.location) {
          payload.locationRating = categories.location
        }
        if (categories.value) {
          payload.valueRating = categories.value
        }
      }

      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Review submission failed')
      }

      // Award points for review submission (async, don't block)
      if (result.review?.id) {
        import("@/lib/rewards").then(({ awardReviewPoints }) => {
          awardReviewPoints(result.review.id, {
            rating: data.rating,
            reviewType: data.reviewType
          }).catch(err => {
            console.error("Failed to award review points:", err)
          })
        })

        // Track quest progress for review
        import("@/lib/quests").then(({ trackReviewQuest }) => {
          trackReviewQuest(result.review.id, data.rating).catch(err => {
            console.error("Failed to track review quest:", err)
          })
        })
      }

      return result
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const getReviews = async (params: {
    listingId?: string
    hostId?: string
    guestId?: string
    reviewType?: string
    page?: number
    limit?: number
  }) => {
    setLoading(true)
    setError(null)

    try {
      const queryParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value))
        }
      })

      const response = await fetch(`/api/reviews?${queryParams.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch reviews')
      }

      return data
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const getAISummary = async (listingId: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/reviews/ai-summary?listingId=${listingId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch AI summary')
      }

      return data
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    createReview,
    getReviews,
    getAISummary,
    loading,
    error,
  }
}
