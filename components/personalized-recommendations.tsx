'use client'

import { useEffect, useState } from 'react'
import { ListingCard } from '@/components/listing-card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { useRecommendations } from '@/hooks/use-recommendations'

export function PersonalizedRecommendations() {
  const { recommendations, loading, error } = useRecommendations()

  if (loading) {
    return (
      <div className="py-12">
        <h2 className="text-2xl font-bold mb-6">Gợi ý dành cho bạn</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-64 w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-12">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!recommendations || recommendations.length === 0) {
    return null
  }

  return (
    <div className="py-12">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Gợi ý dành cho bạn</h2>
        <p className="text-muted-foreground">
          Các homestay phù hợp với sở thích của bạn
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {recommendations.map((listing: any) => (
          <ListingCard
            key={listing.id}
            id={listing.id}
            title={listing.title}
            location={`${listing.city}, ${listing.country}`}
            price={listing.pricePerNight}
            rating={listing.rating || 0}
            reviews={listing.reviewCount || 0}
            image={listing.photos?.[0] || '/placeholder.jpg'}
            host={listing.host?.name || 'Host'}
            guests={listing.maxGuests}
            bedrooms={listing.bedrooms}
          />
        ))}
      </div>
    </div>
  )
}
