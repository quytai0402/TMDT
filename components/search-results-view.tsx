"use client"

import { useCallback, useEffect, useMemo, useState, useTransition } from "react"
import { usePathname, useRouter } from "next/navigation"
import { ListingCard } from "@/components/listing-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Skeleton } from "@/components/ui/skeleton"
import { Toggle } from "@/components/ui/toggle"
import { useToast } from "@/components/ui/use-toast"
import { Separator } from "@/components/ui/separator"
import {
  Filter,
  MapPin,
  SlidersHorizontal,
  Star,
  Users,
  Map,
  Loader2,
  Sparkles,
  Dog,
  KeyRound,
} from "lucide-react"

interface SearchResultsViewProps {
  initialParams: Record<string, string | string[] | undefined>
}

interface ListingResult {
  id: string
  title: string
  city: string
  country: string
  basePrice: number
  averageRating: number
  images: string[]
  amenities: string[]
  propertyType: string
  maxGuests: number
  bedrooms: number
  host?: {
    name?: string | null
  }
  _count?: {
    reviews: number
  }
}

type SortOption = {
  id: string
  label: string
  sortBy: string
  sortOrder: "asc" | "desc"
}

const sortOptions: SortOption[] = [
  { id: "trending", label: "Phổ biến", sortBy: "totalBookings", sortOrder: "desc" },
  { id: "rating", label: "Đánh giá cao", sortBy: "averageRating", sortOrder: "desc" },
  { id: "price-low", label: "Giá thấp", sortBy: "basePrice", sortOrder: "asc" },
  { id: "price-high", label: "Giá cao", sortBy: "basePrice", sortOrder: "desc" },
  { id: "new", label: "Mới nhất", sortBy: "createdAt", sortOrder: "desc" },
]

const MIN_PRICE = 100_000
const MAX_PRICE = 30_000_000

function parseNumber(value?: string | string[]): number | undefined {
  if (!value) return undefined
  const parsed = Array.isArray(value) ? Number(value[0]) : Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function parseList(value?: string | string[]) {
  if (!value) return [] as string[]
  if (Array.isArray(value)) return value
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function SearchResultsView({ initialParams }: SearchResultsViewProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const [query, setQuery] = useState(() => (typeof initialParams.q === 'string' ? initialParams.q : ''))
  const [city, setCity] = useState(() => (typeof initialParams.city === 'string' ? initialParams.city : ''))
  const [guests, setGuests] = useState(() => parseNumber(initialParams.guests) ?? 2)
  const [priceRange, setPriceRange] = useState<[number, number]>(() => [
    parseNumber(initialParams.minPrice) ?? MIN_PRICE,
    parseNumber(initialParams.maxPrice) ?? Math.min(MAX_PRICE, 5_000_000),
  ])
  const [instantBookable, setInstantBookable] = useState(initialParams.instantBookable === 'true')
  const [allowPets, setAllowPets] = useState(initialParams.allowPets === 'true')
  const [amenities, setAmenities] = useState<string[]>(() => parseList(initialParams.amenities))
  const [experiences, setExperiences] = useState<string[]>(() => parseList(initialParams.experiences))
  const [policies, setPolicies] = useState<string[]>(() => parseList(initialParams.policies))
  const [dateFlex, setDateFlex] = useState(() =>
    typeof initialParams.flexMode === 'string' ? initialParams.flexMode : 'weekends'
  )
  const [tripLength, setTripLength] = useState(() =>
    typeof initialParams.tripLength === 'string' ? initialParams.tripLength : '3-5'
  )
  const [propertyType, setPropertyType] = useState<string | undefined>(() => {
    const raw = typeof initialParams.propertyTypes === 'string' ? initialParams.propertyTypes : undefined
    return raw && raw !== 'ALL' ? raw : undefined
  })
  const initialSortId = typeof initialParams.sort === 'string' ? initialParams.sort : 'trending'
  const [activeSort, setActiveSort] = useState<string>(
    sortOptions.some((option) => option.id === initialSortId) ? initialSortId : 'trending'
  )

  const [listings, setListings] = useState<ListingResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const activeSortOption = useMemo(
    () => sortOptions.find((option) => option.id === activeSort) ?? sortOptions[0],
    [activeSort]
  )

  const buildSearchParams = useCallback(() => {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (city) params.set('city', city)
    if (guests) params.set('guests', String(guests))
    if (priceRange[0] > MIN_PRICE) params.set('minPrice', String(priceRange[0]))
    if (priceRange[1] < MAX_PRICE) params.set('maxPrice', String(priceRange[1]))
    if (instantBookable) params.set('instantBookable', 'true')
    if (allowPets) params.set('allowPets', 'true')
    if (amenities.length > 0) params.set('amenities', amenities.join(','))
    if (experiences.length > 0) params.set('experiences', experiences.join(','))
    if (policies.length > 0) params.set('policies', policies.join(','))
    if (propertyType && propertyType !== 'ALL') params.set('propertyTypes', propertyType)
    if (dateFlex !== 'weekends') params.set('flexMode', dateFlex)
    if (tripLength !== '3-5') params.set('tripLength', tripLength)
    params.set('sortBy', activeSortOption.sortBy)
    params.set('sortOrder', activeSortOption.sortOrder)
    params.set('sort', activeSortOption.id)
    params.set('limit', '24')
    return params
  }, [query, city, guests, priceRange, instantBookable, allowPets, propertyType, activeSortOption, amenities, experiences, policies, dateFlex, tripLength])

  const fetchListings = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = buildSearchParams()
      const response = await fetch(`/api/search?${params.toString()}`, { cache: 'no-store' })
      if (!response.ok) {
        throw new Error('Không thể tải kết quả tìm kiếm')
      }
      const data = await response.json()
      setListings(data.listings ?? [])
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`, { scroll: false })
      })
    } catch (err) {
      console.error(err)
      const message = err instanceof Error ? err.message : 'Đã có lỗi xảy ra'
      setError(message)
      toast({
        variant: 'destructive',
        title: 'Không thể tải kết quả',
        description: message,
      })
    } finally {
      setLoading(false)
    }
  }, [buildSearchParams, pathname, router, toast])

  useEffect(() => {
    fetchListings()
  }, [fetchListings])

  const uniquePropertyTypes = useMemo(() => {
    const types = new Set<string>()
    listings.forEach((listing) => {
      if (listing.propertyType) {
        types.add(listing.propertyType)
      }
    })
    return Array.from(types)
  }, [listings])

  const resultCountLabel = useMemo(() => {
    if (loading) {
      return 'Đang tìm kiếm các homestay phù hợp...'
    }
    if (error) {
      return 'Không thể tải kết quả. Vui lòng thử lại.'
    }
    if (listings.length === 0) {
      return 'Không tìm thấy chỗ nghỉ phù hợp. Hãy thử điều chỉnh bộ lọc.'
    }
    return `Tìm thấy ${listings.length} chỗ nghỉ phù hợp`
  }, [loading, error, listings.length])

  const handleResetFilters = () => {
    setQuery('')
    setCity('')
    setGuests(2)
    setPriceRange([MIN_PRICE, Math.min(MAX_PRICE, 5_000_000)])
    setInstantBookable(false)
    setAllowPets(false)
    setPropertyType(undefined)
    setActiveSort('trending')
  }

  return (
    <div className="space-y-8">
      <Card className="border border-border/60 shadow-sm">
        <div className="p-6 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">{resultCountLabel}</h2>
              <p className="text-muted-foreground text-sm">
                Tinh chỉnh bộ lọc để tìm homestay đúng gu của bạn. Giá hiển thị cho mỗi đêm.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => fetchListings()}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Filter className="h-4 w-4" />}
                Làm mới
              </Button>
              <Button
                variant="ghost"
                className="gap-2"
                onClick={handleResetFilters}
                disabled={loading}
              >
                <Sparkles className="h-4 w-4" />
                Xóa bộ lọc
              </Button>
              <Button
                variant="secondary"
                className="gap-2"
                onClick={() => {
                  const params = buildSearchParams()
                  router.push(`/search/map?${params.toString()}`)
                }}
              >
                <Map className="h-4 w-4" />
                Bản đồ
              </Button>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-4">
            <div className="lg:col-span-1 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Bạn muốn ở đâu?
                </label>
                <Input
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  placeholder="Thành phố, địa điểm..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Số khách
                </label>
                <Input
                  type="number"
                  min={1}
                  max={16}
                  value={guests}
                  onChange={(event) => setGuests(Math.max(1, Number(event.target.value)))}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    Khoảng giá (đ/đêm)
                  </label>
                  <Badge variant="secondary">
                    {priceRange[0].toLocaleString('vi-VN')} - {priceRange[1].toLocaleString('vi-VN')}
                  </Badge>
                </div>
                <Slider
                  min={MIN_PRICE}
                  max={MAX_PRICE}
                  step={100_000}
                  value={priceRange}
                  onValueChange={(value) => setPriceRange([value[0], value[1]])}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Toggle
                  aria-label="Chỉ hiển thị Instant Book"
                  pressed={instantBookable}
                  onPressedChange={() => setInstantBookable((prev) => !prev)}
                  className="justify-start"
                >
                  <KeyRound className="mr-2 h-4 w-4" />
                  Instant book
                </Toggle>
                <Toggle
                  aria-label="Cho phép thú cưng"
                  pressed={allowPets}
                  onPressedChange={() => setAllowPets((prev) => !prev)}
                  className="justify-start"
                >
                  <Dog className="mr-2 h-4 w-4" />
                  Thân thiện thú cưng
                </Toggle>
              </div>
            </div>

            <div className="lg:col-span-3 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Sắp xếp theo:</span>
                {sortOptions.map((option) => (
                  <Button
                    key={option.id}
                    variant={option.id === activeSort ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveSort(option.id)}
                    className="rounded-full"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>

              {uniquePropertyTypes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={!propertyType ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setPropertyType(undefined)}
                  >
                    Tất cả loại chỗ ở
                  </Badge>
                  {uniquePropertyTypes.map((type) => (
                    <Badge
                      key={type}
                      variant={propertyType === type ? 'default' : 'outline'}
                      className="cursor-pointer capitalize"
                      onClick={() => setPropertyType(type)}
                    >
                      {type.replace(/_/g, ' ').toLowerCase()}
                    </Badge>
                  ))}
                </div>
              )}

              <Separator />

              {loading ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <Skeleton key={index} className="h-72 w-full rounded-2xl" />
                  ))}
                </div>
              ) : listings.length === 0 ? (
                <Card className="p-12 text-center text-muted-foreground">
                  Rất tiếc, không có kết quả phù hợp với các bộ lọc hiện tại.
                </Card>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {listings.map((listing) => (
                    <ListingCard
                      key={listing.id}
                      id={listing.id}
                      title={listing.title}
                      location={`${listing.city}, ${listing.country}`}
                      price={listing.basePrice}
                      rating={Number.isFinite(listing.averageRating) ? listing.averageRating : 0}
                      reviews={listing._count?.reviews ?? 0}
                      image={listing.images?.[0] || '/placeholder.svg'}
                      host={listing.host?.name || 'Host'}
                      guests={listing.maxGuests}
                      bedrooms={listing.bedrooms}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {isPending && (
        <div className="fixed bottom-6 right-6 bg-background/90 backdrop-blur-md border shadow-lg px-4 py-2 rounded-full flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm">Đang cập nhật kết quả...</span>
        </div>
      )}
    </div>
  )
}
