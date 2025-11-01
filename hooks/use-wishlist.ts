'use client'

import { useCallback, useState } from 'react'

export function useWishlist() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addToWishlist = useCallback(async (listingId: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add to wishlist')
      }

      return result
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const removeFromWishlist = useCallback(async (listingId: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/wishlist/${listingId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to remove from wishlist')
      }

      return result
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const getWishlist = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/wishlist')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch wishlist')
      }

      return data
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const isInWishlist = useCallback(async (listingId: string) => {
    try {
      const response = await fetch(`/api/wishlist/${listingId}/check`)
      const data = await response.json()
      return data.isInWishlist
    } catch (err) {
      return false
    }
  }, [])

  return {
    addToWishlist,
    removeFromWishlist,
    getWishlist,
    isInWishlist,
    loading,
    error,
  }
}
