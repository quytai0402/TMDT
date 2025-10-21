'use client'

import { useState } from 'react'

export interface CreateListingData {
  title: string
  description: string
  propertyType: string
  address: string
  city: string
  country: string
  latitude: number
  longitude: number
  pricePerNight: number
  maxGuests: number
  bedrooms: number
  beds: number
  bathrooms: number
  amenities: string[]
  photos: string[]
  houseRules?: string[]
  cancellationPolicy?: string
  checkInTime?: string
  checkOutTime?: string
}

export function useListings() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createListing = async (data: CreateListingData) => {
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
  }

  const updateListing = async (id: string, data: Partial<CreateListingData>) => {
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
  }

  const deleteListing = async (id: string) => {
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
  }

  const getListing = async (id: string) => {
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
  }

  const getMyListings = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/listings')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch listings')
      }

      return data
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const generateAIContent = async (type: 'title' | 'description', input: string) => {
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
  }

  const getPricingSuggestions = async (listingId: string) => {
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
  }

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
