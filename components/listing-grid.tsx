'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, Star, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Listing {
  id: string
  title: string
  images: string[]
  price: number
  location: string
  rating?: number
  reviewCount?: number
  hostName?: string
  hostImage?: string
  isFavorite?: boolean
}

interface ListingGridProps {
  listings: Listing[]
  columns?: 1 | 2 | 3 | 4
  loading?: boolean
  onFavoriteToggle?: (listingId: string) => void
  className?: string
}

export default function ListingGrid({
  listings,
  columns = 4,
  loading = false,
  onFavoriteToggle,
  className,
}: ListingGridProps) {
  const gridColumns = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  }

  if (loading) {
    return (
      <div className={cn('grid gap-6', gridColumns[columns], className)}>
        {Array.from({ length: 8 }).map((_, index) => (
          <ListingCardSkeleton key={index} />
        ))}
      </div>
    )
  }

  if (listings.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No listings found</p>
        <p className="text-gray-400 text-sm mt-2">
          Try adjusting your search filters
        </p>
      </div>
    )
  }

  return (
    <div className={cn('grid gap-6', gridColumns[columns], className)}>
      {listings.map((listing) => (
        <ListingCard
          key={listing.id}
          listing={listing}
          onFavoriteToggle={onFavoriteToggle}
        />
      ))}
    </div>
  )
}

function ListingCard({
  listing,
  onFavoriteToggle,
}: {
  listing: Listing
  onFavoriteToggle?: (listingId: string) => void
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isFavorite, setIsFavorite] = useState(listing.isFavorite || false)

  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentImageIndex((prev) =>
      prev === 0 ? listing.images.length - 1 : prev - 1
    )
  }

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentImageIndex((prev) =>
      prev === listing.images.length - 1 ? 0 : prev + 1
    )
  }

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsFavorite(!isFavorite)
    onFavoriteToggle?.(listing.id)
  }

  return (
    <Link
      href={`/listing/${listing.id}`}
      className="group block cursor-pointer"
    >
      {/* Image Section */}
      <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-200 mb-3">
        {listing.images.length > 0 ? (
          <>
            <Image
              src={listing.images[currentImageIndex]}
              alt={listing.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />

            {/* Image Navigation */}
            {listing.images.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Previous image"
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Next image"
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>

                {/* Image Dots */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {listing.images.map((_, index) => (
                    <div
                      key={index}
                      className={cn(
                        'w-1.5 h-1.5 rounded-full transition-all',
                        index === currentImageIndex
                          ? 'bg-white w-2'
                          : 'bg-white/50'
                      )}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
            No image
          </div>
        )}

        {/* Favorite Button */}
        <button
          onClick={handleFavoriteClick}
          className="absolute top-3 right-3 p-2 hover:scale-110 transition-transform"
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart
            className={cn(
              'w-5 h-5',
              isFavorite
                ? 'fill-red-500 text-red-500'
                : 'fill-white/70 text-white stroke-2'
            )}
          />
        </button>
      </div>

      {/* Info Section */}
      <div className="space-y-1">
        {/* Location and Rating */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1 text-sm text-gray-600 min-w-0 flex-1">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{listing.location}</span>
          </div>
          {listing.rating && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <Star className="w-4 h-4 fill-black text-black" />
              <span className="text-sm font-medium">{listing.rating.toFixed(1)}</span>
              {listing.reviewCount && (
                <span className="text-sm text-gray-600">
                  ({listing.reviewCount})
                </span>
              )}
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-gray-900 truncate group-hover:underline">
          {listing.title}
        </h3>

        {/* Host */}
        {listing.hostName && (
          <p className="text-sm text-gray-600 truncate">
            Hosted by {listing.hostName}
          </p>
        )}

        {/* Price */}
        <div className="pt-1">
          <span className="font-semibold text-gray-900">
            ${listing.price.toLocaleString()}
          </span>
          <span className="text-gray-600"> / night</span>
        </div>
      </div>
    </Link>
  )
}

export function ListingCardSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Image Skeleton */}
      <div className="aspect-square rounded-xl bg-gray-200 mb-3" />

      {/* Info Skeleton */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <div className="h-4 bg-gray-200 rounded w-32" />
          <div className="h-4 bg-gray-200 rounded w-12" />
        </div>
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-5 bg-gray-200 rounded w-24 mt-3" />
      </div>
    </div>
  )
}

// Compact list view variant
export function ListingList({
  listings,
  loading = false,
  onFavoriteToggle,
  className,
}: {
  listings: Listing[]
  loading?: boolean
  onFavoriteToggle?: (listingId: string) => void
  className?: string
}) {
  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        {Array.from({ length: 5 }).map((_, index) => (
          <ListingListItemSkeleton key={index} />
        ))}
      </div>
    )
  }

  if (listings.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No listings found</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {listings.map((listing) => (
        <Link
          key={listing.id}
          href={`/listing/${listing.id}`}
          className="flex gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
        >
          {/* Thumbnail */}
          <div className="relative w-32 h-32 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
            {listing.images[0] && (
              <Image
                src={listing.images[0]}
                alt={listing.title}
                fill
                className="object-cover"
                sizes="128px"
              />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate">{listing.title}</h3>
                <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                  <MapPin className="w-4 h-4" />
                  <span>{listing.location}</span>
                </div>
                {listing.hostName && (
                  <p className="text-sm text-gray-600 mt-1">
                    Hosted by {listing.hostName}
                  </p>
                )}
              </div>

              <div className="text-right flex-shrink-0">
                <div className="font-semibold text-lg">
                  ${listing.price.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">/ night</div>
                {listing.rating && (
                  <div className="flex items-center gap-1 mt-2">
                    <Star className="w-4 h-4 fill-black text-black" />
                    <span className="text-sm font-medium">
                      {listing.rating.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

function ListingListItemSkeleton() {
  return (
    <div className="flex gap-4 p-4 rounded-lg border border-gray-200 animate-pulse">
      <div className="w-32 h-32 rounded-lg bg-gray-200 flex-shrink-0" />
      <div className="flex-1 space-y-3">
        <div className="h-6 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-1/3" />
      </div>
      <div className="space-y-2 text-right">
        <div className="h-6 bg-gray-200 rounded w-20" />
        <div className="h-4 bg-gray-200 rounded w-16" />
      </div>
    </div>
  )
}
