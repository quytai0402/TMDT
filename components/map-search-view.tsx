'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { 
  MapPin, 
  Search, 
  SlidersHorizontal, 
  Circle,
  Heart,
  Star
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'

interface SearchResult {
  id: string
  title: string
  location: string
  price: number
  rating: number
  reviews: number
  image: string
  latitude: number
  longitude: number
  propertyType: string
  amenities: string[]
}

export function MapSearchView() {
  const router = useRouter()
  const { toast } = useToast()
  const [searchRadius, setSearchRadius] = useState(5)
  const [priceRange, setPriceRange] = useState<[number, number]>([500000, 5000000])
  const [showFilters, setShowFilters] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams({
          limit: '30',
          sortBy: 'averageRating',
          sortOrder: 'desc',
        })
        const response = await fetch(`/api/search?${params.toString()}`, { cache: 'no-store' })
        if (!response.ok) {
          throw new Error('Không thể tải kết quả bản đồ')
        }
        const data = await response.json()
        const mapped: SearchResult[] = (data.listings ?? [])
          .filter((listing: any) => typeof listing.latitude === 'number' && typeof listing.longitude === 'number')
          .map((listing: any) => ({
            id: listing.id,
            title: listing.title,
            location: `${listing.city}, ${listing.country}`,
            price: listing.basePrice,
            rating: listing.averageRating ?? 0,
            reviews: listing._count?.reviews ?? 0,
            image: listing.images?.[0] ?? '/placeholder.svg',
            latitude: listing.latitude,
            longitude: listing.longitude,
            propertyType: listing.propertyType,
            amenities: listing.amenities ?? [],
          }))
        setResults(mapped)
      } catch (error) {
        console.error(error)
        toast({
          variant: 'destructive',
          title: 'Không thể tải bản đồ',
          description: 'Vui lòng thử lại sau.',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [toast])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
  }

  return (
    <div className="flex h-screen">
      {/* Left Panel - Search Results */}
      <div className="w-full md:w-2/5 overflow-y-auto bg-background border-r">
        {/* Search Header */}
        <div className="sticky top-0 z-10 bg-background border-b p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm địa điểm..."
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? 'bg-primary text-white' : ''}
            >
              <SlidersHorizontal className="w-5 h-5" />
            </Button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <Card className="p-4 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">
                    Bán kính tìm kiếm
                  </label>
                  <Badge variant="secondary">{searchRadius} km</Badge>
                </div>
                <Slider
                  value={[searchRadius]}
                  onValueChange={(v) => setSearchRadius(v[0])}
                  min={1}
                  max={20}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">
                    Khoảng giá
                  </label>
                  <Badge variant="secondary">
                    {formatCurrency(priceRange[0])} - {formatCurrency(priceRange[1])}
                  </Badge>
                </div>
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  min={100000}
                  max={10000000}
                  step={100000}
                  className="w-full"
                />
              </div>
            </Card>
          )}

          <div className="text-sm text-muted-foreground">
            {loading
              ? 'Đang tải các chỗ nghỉ nổi bật...'
              : `Tìm thấy ${results.length} chỗ nghỉ trong bán kính ${searchRadius}km`}
          </div>
        </div>

        {/* Results List */}
        <div className="p-4 space-y-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="h-36 animate-pulse bg-muted/40" />
            ))
          ) : results.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              Không có chỗ nghỉ nào trong khu vực này. Hãy mở rộng bán kính tìm kiếm.
            </Card>
          ) : (
            results.map((result) => (
              <Card
                key={result.id}
                className={`overflow-hidden transition-all hover:shadow-lg cursor-pointer ${
                  hoveredId === result.id ? 'ring-2 ring-primary' : ''
                }`}
                onMouseEnter={() => setHoveredId(result.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => router.push(`/listing/${result.id}`)}
              >
              <div className="flex gap-4">
                <div className="relative w-40 h-40 flex-shrink-0">
                  <img
                    src={result.image}
                    alt={result.title}
                    className="w-full h-full object-cover"
                  />
                  <button className="absolute top-2 right-2 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition-colors">
                    <Heart className="w-5 h-5" />
                  </button>
                  <Badge className="absolute bottom-2 left-2">
                    {result.propertyType}
                  </Badge>
                </div>

                <div className="flex-1 p-4 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold line-clamp-2">
                      {result.title}
                    </h3>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold text-sm">{result.rating}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{result.location}</span>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {result.amenities.slice(0, 3).map((amenity) => (
                      <Badge key={amenity} variant="outline" className="text-xs">
                        {amenity}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-lg font-bold text-primary">
                        {formatCurrency(result.price)}
                      </span>
                      <span className="text-sm text-muted-foreground">/đêm</span>
                    </div>
                    <Link href={`/listing/${result.id}`}>
                      <Button size="sm">Xem chi tiết</Button>
                    </Link>
                  </div>
                </div>
              </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Right Panel - Interactive Map */}
      <div className="hidden md:block w-3/5 relative">
        <div className="h-full bg-gradient-to-br from-blue-50 via-green-50 to-blue-100 relative overflow-hidden"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        >
          {/* Search Radius Circle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div
              className="rounded-full border-4 border-primary/30 bg-primary/5"
              style={{
                width: `${searchRadius * 40}px`,
                height: `${searchRadius * 40}px`,
              }}
            />
            <Circle className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-primary fill-primary" />
          </div>

          {/* Map Pins */}
          {results.map((result, index) => (
            <div
              key={result.id}
              className="absolute transition-all duration-300"
              style={{
                left: `${40 + index * 10}%`,
                top: `${40 + (index % 2 === 0 ? 5 : -10)}%`,
                transform: hoveredId === result.id ? 'scale(1.2)' : 'scale(1)',
                zIndex: hoveredId === result.id ? 20 : 10,
              }}
            >
              <button
                onClick={() => setHoveredId(result.id)}
                className={`transition-all ${
                  hoveredId === result.id
                    ? 'shadow-xl'
                    : 'shadow-lg'
                }`}
              >
                <div
                  className={`px-3 py-1.5 rounded-full font-semibold text-sm ${
                    hoveredId === result.id
                      ? 'bg-primary text-white scale-110'
                      : 'bg-white text-foreground'
                  }`}
                >
                  {formatCurrency(result.price)}
                </div>
                <div className="absolute left-1/2 -translate-x-1/2 top-full">
                  <div className={`w-0 h-0 border-l-6 border-l-transparent border-r-6 border-r-transparent border-t-6 ${
                    hoveredId === result.id ? 'border-t-primary' : 'border-t-white'
                  }`} />
                </div>
              </button>
            </div>
          ))}

          {/* Legend */}
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur rounded-lg p-3 shadow-lg">
            <div className="text-xs font-semibold mb-2">Chú thích</div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <Circle className="w-3 h-3 text-primary fill-primary" />
                <span>Vị trí của bạn</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full border-2 border-primary/30 bg-primary/5" />
                <span>Bán kính {searchRadius}km</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3 h-3 text-primary" />
                <span>Chỗ nghỉ</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
