'use client'

import { useCallback, useState } from 'react'

export interface CreateBookingData {
  listingId: string
  checkIn: string
  checkOut: string
  adults: number
  children?: number
  infants?: number
  pets?: number
  specialRequests?: string
  guestName?: string
  guestPhone?: string
  guestEmail?: string
}

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Unexpected error'

export function useBooking() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createBooking = useCallback(async (data: CreateBookingData) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Booking failed')
      }

      return result
    } catch (error) {
      setError(getErrorMessage(error))
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const getBookings = useCallback(async (type: 'guest' | 'host' = 'guest') => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/bookings?type=${type}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch bookings')
      }

      return data
    } catch (error) {
      setError(getErrorMessage(error))
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const getBooking = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/bookings/${id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch booking')
      }

      return data
    } catch (error) {
      setError(getErrorMessage(error))
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const updateBooking = useCallback(async (id: string, action: string, data?: Record<string, unknown>) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...data }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Update failed')
      }

      return result
    } catch (error) {
      setError(getErrorMessage(error))
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    createBooking,
    getBookings,
    getBooking,
    updateBooking,
    loading,
    error,
  }
}
