"use client"

import { useMemo } from "react"
import { ListingCard } from "@/components/listing-card"
import { Badge } from "@/components/ui/badge"

export interface SecretListingSummary {
  id: string
  title: string
  location: string
  price: number
  rating: number
  reviews: number
  image: string
  host: string
  guests: number
  bedrooms: number
  featured?: boolean
  isSecret?: boolean
}

interface SecretCollectionGridProps {
  listings: SecretListingSummary[]
}

export function SecretCollectionGrid({ listings }: SecretCollectionGridProps) {
  const hasListings = listings.length > 0

  const sortedListings = useMemo(() => {
    return [...listings].sort((a, b) => Number(b.featured ?? false) - Number(a.featured ?? false))
  }, [listings])

  if (!hasListings) {
    return (
      <div className="rounded-3xl border border-dashed border-primary/30 bg-primary/5 px-6 py-10 text-center">
        <Badge variant="outline" className="mb-3 border-primary/50 text-primary">
          Secret Collection
        </Badge>
        <p className="text-muted-foreground">
          Chưa có homestay nào trong Secret Collection. Hãy quay lại sau, chúng tôi đang cập nhật hàng tuần.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {sortedListings.map((listing) => (
        <ListingCard key={listing.id} {...listing} isSecret />
      ))}
    </div>
  )
}
