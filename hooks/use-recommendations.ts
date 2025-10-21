'use client'

import { useState, useEffect } from 'react'

export function useRecommendations() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recommendations, setRecommendations] = useState<any[]>([])

  const getRecommendations = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/recommendations')
      
      if (!response.ok) {
        throw new Error('Failed to fetch recommendations')
      }

      const data = await response.json()
      setRecommendations(data.listings || [])
      return data
    } catch (err: any) {
      console.error('Recommendations error:', err)
      setError(err.message || 'Không thể tải đề xuất')
      setRecommendations([])
      return { listings: [] }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getRecommendations().catch(console.error)
  }, [])

  return {
    recommendations,
    getRecommendations,
    loading,
    error,
  }
}
