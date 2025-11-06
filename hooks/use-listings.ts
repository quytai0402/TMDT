'use client'

import { useCallback, useState } from 'react'

export type PropertyTypeValue =
  | 'APARTMENT'
  | 'HOUSE'
  | 'VILLA'
  | 'CONDO'
  | 'TOWNHOUSE'
  | 'BUNGALOW'
  | 'CABIN'
  | 'FARM_STAY'
  | 'BOAT'
  | 'UNIQUE'

export type RoomTypeValue = 'ENTIRE_PLACE' | 'PRIVATE_ROOM' | 'SHARED_ROOM'

export interface CreateListingData {
  title: string
  description: string
  propertyType: PropertyTypeValue
  roomType: RoomTypeValue
  maxGuests: number
  bedrooms: number
  beds: number
  bathrooms: number
  country: string
  city: string
  address: string
  latitude: number
  longitude: number
  basePrice: number
  cleaningFee?: number
  images: string[]
  amenities: string[]
  nearbyPlaces?: any[] // Auto-detected nearby places from SerpAPI
}

export function useListings() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createListing = useCallback(async (data: CreateListingData) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create listing')
      }

      return result
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateListing = useCallback(async (id: string, data: Partial<CreateListingData>) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/listings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update listing')
      }

      return result
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteListing = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/listings/${id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete listing')
      }

      return result
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const getListing = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/listings/${id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch listing')
      }

      return data
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const getMyListings = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/listings?hostId=me', {
        cache: 'no-store',
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch listings')
      }

      if (Array.isArray(data)) {
        return data
      }

      if (Array.isArray(data?.listings)) {
        return data.listings
      }

      return []
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const generateAIContent = useCallback(async (type: 'title' | 'description', input: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/generate-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, input }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate content')
      }

      return result
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const getPricingSuggestions = useCallback(async (listingId: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/ai/pricing-suggestions?listingId=${listingId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch pricing suggestions')
      }

      return data
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    createListing,
    updateListing,
    deleteListing,
    getListing,
    getMyListings,
    generateAIContent,
    getPricingSuggestions,
    loading,
    error,
  }
}
