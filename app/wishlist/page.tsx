'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useWishlist } from '@/hooks/use-wishlist'
import { ListingCard } from '@/components/listing-card'
import { Button } from '@/components/ui/button'
import { Heart, Loader2, Home, Sparkles, Grid3x3, List } from 'lucide-react'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Listing {
  id: string
  title: string
  description: string
  propertyType: string
  basePrice?: number
  pricePerNight?: number
  currency?: string
  images: string[]
  city: string
  country: string
  host: {
    id: string
    name: string | null
    image: string | null
  }
}

export default function WishlistPage() {
  const { data: session, status } = useSession()
  const { getWishlist, loading } = useWishlist()
  const [listings, setListings] = useState<Listing[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const loadWishlist = useCallback(async () => {
    try {
      const data = await getWishlist()
      const normalized = Array.isArray(data)
        ? data.map((item: any) => ({
            ...item,
            basePrice: item?.basePrice ?? item?.pricePerNight ?? 0,
            currency: item?.currency ?? "VND",
          }))
        : []

      setListings(normalized)
    } catch (error) {
      console.error('Error loading wishlist:', error)
    }
  }, [getWishlist])

  useEffect(() => {
    if (session?.user) {
      void loadWishlist()
    }
  }, [session, loadWishlist])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 bg-gradient-to-b from-pink-50 to-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-6">
              <Skeleton className="h-12 w-64" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-80 rounded-xl" />
                ))}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 bg-gradient-to-b from-pink-50 to-white flex items-center justify-center">
          <Card className="max-w-md mx-4 p-8 text-center space-y-6 shadow-xl">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-pink-100 to-red-100 rounded-full flex items-center justify-center">
              <Heart className="h-10 w-10 text-red-500" />
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent">
                Đăng nhập để xem danh sách yêu thích
              </h1>
              <p className="text-muted-foreground">
                Đăng nhập để lưu và xem các chỗ ở yêu thích của bạn
              </p>
            </div>
            <Button asChild size="lg" className="w-full">
              <Link href="/login">Đăng nhập ngay</Link>
            </Button>
          </Card>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 bg-gradient-to-b from-pink-50 to-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Heart className="h-8 w-8 text-white fill-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent">
                    Danh sách yêu thích
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    {listings.length} chỗ ở đã lưu
                  </p>
                </div>
              </div>
              
              {/* View Mode Toggle */}
              <div className="flex gap-2 bg-white rounded-lg p-1 shadow-sm border">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                <p className="text-muted-foreground">Đang tải danh sách yêu thích...</p>
              </div>
            </div>
          ) : listings.length === 0 ? (
            <Card className="text-center py-20 shadow-xl">
              <div className="space-y-6 max-w-md mx-auto">
                <div className="mx-auto w-32 h-32 bg-gradient-to-br from-pink-100 to-red-100 rounded-full flex items-center justify-center">
                  <Heart className="h-16 w-16 text-pink-400" />
                </div>
                <div className="space-y-3">
                  <h2 className="text-3xl font-bold text-gray-900">
                    Chưa có chỗ ở yêu thích
                  </h2>
                  <p className="text-muted-foreground text-lg">
                    Khi bạn tìm thấy một chỗ ở yêu thích, hãy nhấn vào biểu tượng trái tim để lưu lại
                  </p>
                </div>
                <Button asChild size="lg" className="mt-4">
                  <Link href="/">
                    <Sparkles className="mr-2 h-5 w-5" />
                    Khám phá chỗ ở
                  </Link>
                </Button>
              </div>
            </Card>
          ) : (
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
              : "space-y-4"
            }>
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  id={listing.id}
                  title={listing.title}
                  location={`${listing.city}, ${listing.country}`}
                  price={listing.basePrice ?? listing.pricePerNight ?? 0}
                  rating={4.5}
                  reviews={0}
                  image={listing.images[0]}
                  host={listing.host.name || 'Host'}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}
