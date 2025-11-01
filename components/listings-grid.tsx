"use client"

import { ListingCard } from "./listing-card"
import { Button } from "@/components/ui/button"
import { useState, useEffect, useCallback } from "react"
import { Loader2, Home } from "lucide-react"
import { EmptyState, DatabaseErrorFallback } from "./database-error-fallback"
import { useListingFilters } from "@/hooks/use-listing-filters"

interface Listing {
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

export function ListingsGrid() {
  const [displayCount, setDisplayCount] = useState(8)
  const [isLoading, setIsLoading] = useState(true)
  const [isFetching, setIsFetching] = useState(false)
  const [listings, setListings] = useState<Listing[]>([])
  const [hasError, setHasError] = useState(false)
  const { category } = useListingFilters()

  const fetchListings = useCallback(async (selectedCategory: string) => {
    setIsLoading(true)
    setHasError(false)

    try {
      const params = new URLSearchParams({ limit: '50' })
      if (selectedCategory && selectedCategory !== 'trending') {
        params.set('category', selectedCategory)
      }

      const response = await fetch(`/api/listings?${params.toString()}`)
      
      if (response.ok) {
        const data = await response.json()
        
        if (Array.isArray(data) && data.length > 0) {
          const formattedListings = data.map((listing: any) => ({
            id: listing.id,
            title: listing.title,
            location: `${listing.city}, ${listing.country}`,
            price: listing.basePrice,
            rating: listing.avgRating || 4.5,
            reviews: listing._count?.reviews || 0,
            image: listing.images?.[0] || `https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&h=400&fit=crop`,
            host: listing.host?.name || 'Host',
            guests: listing.maxGuests,
            bedrooms: listing.bedrooms,
            featured: listing.featured || false,
            isSecret: Boolean(listing.isSecret),
          }))
          
          setListings(formattedListings)
          setHasError(false)
        } else {
          // Empty response
          setListings([])
          setHasError(false)
        }
      } else {
        // API error
        setHasError(true)
        setListings([])
      }
    } catch (error) {
      console.error('Failed to fetch listings:', error)
      setHasError(true)
      setListings([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchListings(category)
  }, [category, fetchListings])

  useEffect(() => {
    setDisplayCount(8)
  }, [category])

  const handleLoadMore = () => {
    setIsFetching(true)
    setTimeout(() => {
      setDisplayCount((prev) => prev + 4)
      setIsFetching(false)
    }, 500)
  }

  // Loading state
  if (isLoading) {
    return (
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mb-10">
            <h2 className="font-serif text-4xl font-bold text-foreground mb-3">Nơi ở được yêu thích</h2>
            <p className="text-lg text-muted-foreground">
              Khám phá những homestay được đánh giá cao nhất từ khắp Việt Nam
            </p>
          </div>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">Đang tải dữ liệu...</p>
            </div>
          </div>
        </div>
      </section>
    )
  }

  // Error state
  if (hasError) {
    return (
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mb-10">
            <h2 className="font-serif text-4xl font-bold text-foreground mb-3">Nơi ở được yêu thích</h2>
            <p className="text-lg text-muted-foreground">
              Khám phá những homestay được đánh giá cao nhất từ khắp Việt Nam
            </p>
          </div>
          <DatabaseErrorFallback 
            onRetry={() => fetchListings(category)}
            message="Không thể tải danh sách chỗ ở"
          />
        </div>
      </section>
    )
  }

  // Empty state
  if (listings.length === 0) {
    return (
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mb-10">
            <h2 className="font-serif text-4xl font-bold text-foreground mb-3">Nơi ở được yêu thích</h2>
            <p className="text-lg text-muted-foreground">
              Khám phá những homestay được đánh giá cao nhất từ khắp Việt Nam
            </p>
          </div>
          <EmptyState
            icon={Home}
            title="Chưa có chỗ ở nào"
          description="Hiện tại chưa có chỗ ở nào được đăng tải. Vui lòng đăng ký làm chủ nhà để thêm chỗ ở của bạn."
          action={{
            label: "Trở thành chủ nhà",
            onClick: () => window.location.href = '/become-host'
          }}
        />
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="mb-10">
          <h2 className="font-serif text-4xl font-bold text-foreground mb-3">Nơi ở được yêu thích</h2>
          <p className="text-lg text-muted-foreground">
            Khám phá những homestay được đánh giá cao nhất từ khắp Việt Nam
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
          {listings.slice(0, displayCount).map((listing) => (
            <ListingCard key={listing.id} {...listing} />
          ))}
        </div>

        {displayCount < listings.length && (
          <div className="mt-12 text-center">
            <Button
              onClick={handleLoadMore}
              disabled={isFetching}
              size="lg"
              variant="outline"
              className="min-w-[200px] bg-transparent"
            >
              {isFetching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang tải...
                </>
              ) : (
                "Xem thêm"
              )}
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
