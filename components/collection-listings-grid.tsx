"use client"

import { ListingCard } from "@/components/listing-card"

export interface CollectionListingCardProps {
  id: string
  title: string
  city: string
  country: string
  basePrice: number
  averageRating: number | null
  totalReviews: number
  images: string[]
  maxGuests: number
  bedrooms: number
  host?: {
    name?: string | null
  } | null
}

interface CollectionListingsGridProps {
  listings: CollectionListingCardProps[]
}

export function CollectionListingsGrid({ listings }: CollectionListingsGridProps) {
  if (listings.length === 0) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        Hiện chưa có homestay nào trong bộ sưu tập này. Vui lòng quay lại sau nhé!
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
      {listings.map((listing) => (
        <ListingCard
          key={listing.id}
          id={listing.id}
          title={listing.title}
          location={`${listing.city}, ${listing.country}`}
          price={listing.basePrice}
          rating={listing.averageRating ?? 4.8}
          reviews={listing.totalReviews}
          image={listing.images?.[0] ?? "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&h=400&fit=crop"}
          host={listing.host?.name ?? "Host LuxeStay"}
          guests={listing.maxGuests}
          bedrooms={listing.bedrooms}
        />
      ))}
    </div>
  )
}
