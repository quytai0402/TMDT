'use client'

import { useState } from 'react'

export interface SearchParams {
  q?: string
  city?: string
  checkIn?: string
  checkOut?: string
  guests?: number
  minPrice?: number
  maxPrice?: number
  propertyTypes?: string[]
  amenities?: string[]
  bedrooms?: number
  bathrooms?: number
  allowPets?: boolean
  instantBookable?: boolean
  lat?: number
  lng?: number
  radius?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export function useSearch() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<any>(null)

  const search = async (params: SearchParams) => {
    setLoading(true)
    setError(null)

    try {
      const queryParams = new URLSearchParams()

      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            queryParams.append(key, value.join(','))
          } else {
            queryParams.append(key, String(value))
          }
        }
      })

      const response = await fetch(`/api/search?${queryParams.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Không thể tìm kiếm. Vui lòng thử lại sau.')
      }

      setResults(data)
      return data
    } catch (err: any) {
      const errorMessage = err.message || 'Đã có lỗi xảy ra. Vui lòng kiểm tra kết nối mạng và thử lại.'
      setError(errorMessage)
      // Don't throw, just set error for better UX
      return null
    } finally {
      setLoading(false)
    }
  }

  const semanticSearch = async (query: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/search-semantic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Không thể tìm kiếm. Vui lòng thử lại sau.')
      }

      setResults(data)
      return data
    } catch (err: any) {
      const errorMessage = err.message || 'Đã có lỗi xảy ra. Vui lòng kiểm tra kết nối mạng và thử lại.'
      setError(errorMessage)
      // Don't throw, just set error for better UX
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    search,
    semanticSearch,
    loading,
    error,
    results,
  }
}
