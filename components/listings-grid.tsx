"use client"

import { ListingCard } from "./listing-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect, useCallback, useMemo } from "react"
import { Loader2, Home, Lock } from "lucide-react"
import { EmptyState, DatabaseErrorFallback } from "./database-error-fallback"
import { useListingFilters } from "@/hooks/use-listing-filters"
import { useMembershipAccess } from "@/hooks/use-membership-access"
import { useAuthModal } from "@/hooks/use-auth-modal"
import { useRouter } from "next/navigation"

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

const CATEGORY_COPY = {
  trending: {
    title: "Nơi ở được yêu thích",
    description: "Khám phá những homestay được đánh giá cao nhất từ khắp Việt Nam.",
    highlight: "Miễn phí cho mọi tài khoản.",
    requiresMembership: false,
  },
  luxury: {
    title: "Bộ sưu tập sang trọng",
    description: "Lọc các biệt thự, resort 5★ và dịch vụ cao cấp có hướng dẫn viên riêng.",
    highlight: "Chỉ mở cho hội viên Gold trở lên.",
    requiresMembership: true,
  },
  beach: {
    title: "Trải nghiệm ven biển",
    description: "Những căn homestay sát biển kèm tiện nghi hồ bơi và BBQ.",
    highlight: "Cập nhật theo thời tiết và mùa cao điểm.",
    requiresMembership: false,
  },
  mountain: {
    title: "Nghỉ dưỡng trên núi",
    description: "Nhà gỗ, cabin kính và resort giữa thiên nhiên mát lạnh.",
    highlight: "Tập trung các điểm đến Đà Lạt, Sa Pa, Mộc Châu.",
    requiresMembership: false,
  },
  countryside: {
    title: "Chậm lại ở nông thôn",
    description: "Farmstay, bungalow với trải nghiệm bản địa và đặc sản vùng miền.",
    highlight: "Lý tưởng cho gia đình và nhóm bạn.",
    requiresMembership: false,
  },
  city: {
    title: "Khám phá thành phố",
    description: "Căn hộ trung tâm, dễ dàng di chuyển làm việc và giải trí.",
    highlight: "Đã lọc theo đánh giá check-in nhanh.",
    requiresMembership: false,
  },
  villa: {
    title: "Villa riêng tư",
    description: "Không gian có hồ bơi, phòng giải trí và quản gia tại chỗ.",
    highlight: "Ưu tiên hội viên, bao gồm quà tặng nhận phòng.",
    requiresMembership: true,
  },
  favorite: {
    title: "Danh sách yêu thích bí mật",
    description: "Top homestay có điểm giữ chỗ cao, chỉ hiển thị cho hội viên.",
    highlight: "Đồng bộ wishlist giữa web/app.",
    requiresMembership: true,
  },
} as const

const DEFAULT_CATEGORY_CONTENT = CATEGORY_COPY.trending

export function ListingsGrid() {
  const [displayCount, setDisplayCount] = useState(8)
  const [isLoading, setIsLoading] = useState(true)
  const [isFetching, setIsFetching] = useState(false)
  const [listings, setListings] = useState<Listing[]>([])
  const [hasError, setHasError] = useState(false)
  const { category, setCategory } = useListingFilters()
  const { hasMembership, isAuthenticated } = useMembershipAccess()
  const authModal = useAuthModal()
  const router = useRouter()

  const categoryConfig = useMemo(() => {
    return CATEGORY_COPY[category as keyof typeof CATEGORY_COPY] ?? DEFAULT_CATEGORY_CONTENT
  }, [category])

  const gatingActive = categoryConfig.requiresMembership && !hasMembership

  const fetchListings = useCallback(async (selectedCategory: string) => {
    setIsLoading(true)
    setHasError(false)

    try {
      // Optimize: Only fetch 12 items for initial load (display 8, reserve 4 for "load more")
      const params = new URLSearchParams({ limit: '12' })
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
    if (gatingActive) {
      setIsLoading(false)
      setListings([])
      setHasError(false)
      return
    }
    fetchListings(category)
  }, [category, gatingActive, fetchListings])

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

  const SectionHeading = () => (
    <div className="mb-10">
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <h2 className="font-serif text-4xl font-bold text-foreground">{categoryConfig.title}</h2>
        <Badge variant={categoryConfig.requiresMembership ? "default" : "secondary"} className="uppercase text-[11px]">
          {categoryConfig.requiresMembership ? "Membership" : "Free"}
        </Badge>
      </div>
      <p className="text-lg text-muted-foreground">{categoryConfig.description}</p>
      {categoryConfig.highlight && (
        <p className="mt-2 text-sm font-semibold text-primary">{categoryConfig.highlight}</p>
      )}
    </div>
  )

  // Loading state
  if (isLoading && !gatingActive) {
    return (
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <SectionHeading />
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

  if (gatingActive) {
    return (
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <SectionHeading />
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg lg:flex lg:items-center lg:justify-between lg:gap-10">
            <div className="space-y-4 max-w-2xl">
              <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50/70">
                <Lock className="h-3.5 w-3.5" />
                Nội dung dành cho hội viên
              </Badge>
              <p className="text-base text-slate-600">
                Danh mục này chỉ dành cho tài khoản đã đăng ký membership đang hoạt động. Nâng cấp để xem toàn bộ homestay bí mật,
                giá ưu đãi và dịch vụ tặng kèm.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                {!isAuthenticated ? (
                  <>
                    <Button size="lg" className="rounded-xl" onClick={() => authModal.openLogin()}>
                      Đăng nhập để mở khóa
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => router.push("/membership?ref=category-lock")}
                    >
                      Tìm hiểu membership
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="lg"
                      className="rounded-xl"
                      onClick={() => router.push("/membership?ref=category-lock")}
                    >
                      Nâng cấp membership
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => setCategory("trending")}
                    >
                      Xem danh mục miễn phí
                    </Button>
                  </>
                )}
              </div>
            </div>
            <div className="mt-8 w-full max-w-sm rounded-2xl border border-slate-100 bg-slate-50/60 p-6 text-sm text-slate-600 lg:mt-0">
              <p className="font-semibold text-slate-900 mb-3">Quyền lợi hội viên</p>
              <ul className="space-y-2">
                <li>• Bộ sưu tập bí mật và villa hạng sang</li>
                <li>• Ưu tiên giữ chỗ & check-in linh hoạt</li>
                <li>• Concierge lên lịch trải nghiệm đi kèm</li>
              </ul>
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
          <SectionHeading />
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
          <SectionHeading />
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
        <SectionHeading />

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
