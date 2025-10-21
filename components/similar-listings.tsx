"use client"

import { useEffect, useState } from "react"
import { ListingCard } from "./listing-card"
import { Skeleton } from "./ui/skeleton"

interface SimilarListingsProps {
  currentListingId: string
}

interface Listing {
  id: string
  title: string
  city: string
  state?: string | null
  basePrice: number
  averageRating: number
  totalReviews: number
  images: string[]
  host: {
    name: string | null
  }
  maxGuests: number
  bedrooms: number
}

export function SimilarListings({ currentListingId }: SimilarListingsProps) {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSimilarListings()
  }, [currentListingId])

  const fetchSimilarListings = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/listings/${currentListingId}/similar?limit=4`)
      if (!response.ok) throw new Error('Failed to fetch similar listings')
      const data = await response.json()
      setListings(data)
    } catch (error) {
      console.error('Error fetching similar listings:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8">Nơi ở tương tự</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (listings.length === 0) return null

  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-2">Nơi ở tương tự</h2>
        <p className="text-muted-foreground mb-8">
          Được gợi ý dựa trên thuật toán Machine Learning (Cosine Similarity)
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              id={listing.id}
              title={listing.title}
              location={`${listing.city}${listing.state ? ', ' + listing.state : ''}`}
              price={listing.basePrice}
              rating={listing.averageRating}
              reviews={listing.totalReviews}
              image={listing.images[0] || '/placeholder.svg'}
              host={listing.host.name || 'Host'}
              guests={listing.maxGuests}
              bedrooms={listing.bedrooms}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
