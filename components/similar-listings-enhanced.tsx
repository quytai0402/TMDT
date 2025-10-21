'use client'

import { useEffect, useState } from 'react'
import { useSearch } from '@/hooks/use-search'
import { ListingCard } from '@/components/listing-card'
import { Skeleton } from '@/components/ui/skeleton'

interface SimilarListingsProps {
  currentListingId: string
  city: string
  propertyType: string
}

interface SearchListing {
  id: string
  title: string
  city: string
  country: string
  basePrice: number
  averageRating?: number | null
  images: string[]
  maxGuests?: number | null
  bedrooms?: number | null
  host?: {
    name?: string | null
  } | null
  _count?: {
    reviews?: number
  }
}

export function SimilarListings({ currentListingId, city, propertyType }: SimilarListingsProps) {
  const { search, loading } = useSearch()
  const [listings, setListings] = useState<SearchListing[]>([])

  useEffect(() => {
    const fetchSimilar = async () => {
      try {
        const results = await search({
          city,
          propertyTypes: [propertyType],
          limit: 4,
        })

        if (!results || !Array.isArray(results.listings)) {
          setListings([])
          return
        }

        const filtered = (results.listings as SearchListing[]).filter(
          (listing) => listing.id !== currentListingId
        )

        setListings(filtered.slice(0, 4))
      } catch (err) {
        console.error('Failed to fetch similar listings:', err)
      }
    }

    fetchSimilar()
  }, [currentListingId, city, propertyType, search])

  if (listings.length === 0 && !loading) {
    return null
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Chỗ ở tương tự</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-64 w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))
        ) : (
          listings.map((listing) => (
            <ListingCard
              key={listing.id}
              id={listing.id}
              title={listing.title}
              location={[listing.city, listing.country].filter(Boolean).join(', ')}
              price={listing.basePrice}
              rating={listing.averageRating ?? 0}
              reviews={listing._count?.reviews ?? 0}
              image={listing.images?.[0] || '/placeholder.jpg'}
              host={listing.host?.name ?? 'Host'}
              guests={listing.maxGuests ?? undefined}
              bedrooms={listing.bedrooms ?? undefined}
            />
          ))
        )}
      </div>
    </div>
  )
}
