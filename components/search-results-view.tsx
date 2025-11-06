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
  Search,
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

const DEFAULT_PROPERTY_TYPES = [
  "APARTMENT",
  "VILLA",
  "HOUSE",
  "BUNGALOW",
  "CABIN",
  "CONDO",
  "TOWNHOUSE",
  "STUDIO",
  "LOFT",
  "TINY_HOME",
]

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  APARTMENT: "Apartment",
  VILLA: "Villa",
  HOUSE: "House",
  BUNGALOW: "Bungalow",
  CABIN: "Cabin",
  CONDO: "Condo",
  TOWNHOUSE: "Townhouse",
  STUDIO: "Studio",
  LOFT: "Loft",
  TINY_HOME: "Tiny home",
}

const formatPropertyType = (value: string | undefined) => {
  if (!value) return ""
  const normalized = value.toUpperCase()
  if (PROPERTY_TYPE_LABELS[normalized]) {
    return PROPERTY_TYPE_LABELS[normalized]
  }
  return normalized.replace(/[_\-]+/g, " ")
    .toLowerCase()
    .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase())
}

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
  const [guests, setGuests] = useState<number | null>(() => {
    const initialGuests = parseNumber(initialParams.guests)
    return typeof initialGuests === 'number' && Number.isFinite(initialGuests) ? initialGuests : null
  })
  const [priceRange, setPriceRange] = useState<[number, number]>(() => {
    const minValue = parseNumber(initialParams.minPrice)
    const maxValue = parseNumber(initialParams.maxPrice)

    const resolvedMin = typeof minValue === 'number' && Number.isFinite(minValue) ? minValue : MIN_PRICE
    let resolvedMax = typeof maxValue === 'number' && Number.isFinite(maxValue) ? maxValue : MAX_PRICE

    if (resolvedMax < resolvedMin) {
      resolvedMax = resolvedMin
    }

    return [resolvedMin, resolvedMax]
  })
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
  const [flexMonth, setFlexMonth] = useState<string>(() =>
    typeof initialParams.month === 'string' ? initialParams.month : ''
  )
  const [flexDuration, setFlexDuration] = useState<string>(() =>
    typeof initialParams.duration === 'string' ? initialParams.duration : ''
  )
  const [flexRegion, setFlexRegion] = useState<string>(() =>
    typeof initialParams.region === 'string' ? initialParams.region : ''
  )
  const [propertyType, setPropertyType] = useState<string | undefined>(() => {
    const raw = typeof initialParams.propertyTypes === 'string' ? initialParams.propertyTypes : undefined
    return raw && raw !== 'ALL' ? raw : undefined
  })
  const [propertyTypeOptions, setPropertyTypeOptions] = useState<string[]>(() => {
    const seeded = new Set(DEFAULT_PROPERTY_TYPES)
    if (propertyType) {
      seeded.add(propertyType)
    }
    return Array.from(seeded)
  })
  const initialSortId = typeof initialParams.sort === 'string' ? initialParams.sort : 'trending'
  const [activeSort, setActiveSort] = useState<string>(
    sortOptions.some((option) => option.id === initialSortId) ? initialSortId : 'trending'
  )

  const [listings, setListings] = useState<ListingResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fallbackApplied, setFallbackApplied] = useState(false)
  const [fallbackSource, setFallbackSource] = useState<string | null>(null)

  const activeSortOption = useMemo(
    () => sortOptions.find((option) => option.id === activeSort) ?? sortOptions[0],
    [activeSort]
  )

  useEffect(() => {
    if (listings.length === 0) {
      return
    }
    setPropertyTypeOptions((prev) => {
      const merged = new Set(prev)
      listings.forEach((listing) => {
        if (listing.propertyType) {
          merged.add(listing.propertyType)
        }
      })
      return Array.from(merged)
    })
  }, [listings])

  const buildSearchParams = useCallback(() => {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (city) params.set('city', city)
    if (guests !== null) params.set('guests', String(guests))
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
    if (flexMonth) params.set('month', flexMonth)
    if (flexDuration) params.set('duration', flexDuration)
    if (flexRegion) params.set('region', flexRegion)
    if (flexMonth || flexDuration || flexRegion) params.set('flexible', 'true')
    params.set('sortBy', activeSortOption.sortBy)
    params.set('sortOrder', activeSortOption.sortOrder)
    params.set('sort', activeSortOption.id)
    params.set('limit', '24')
    return params
  }, [
    query,
    city,
    guests,
    priceRange,
    instantBookable,
    allowPets,
    propertyType,
    activeSortOption,
    amenities,
    experiences,
    policies,
    dateFlex,
    tripLength,
    flexMonth,
    flexDuration,
    flexRegion,
  ])

  const fetchListings = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      setFallbackApplied(false)
      setFallbackSource(null)
      const params = buildSearchParams()
      const response = await fetch(`/api/search?${params.toString()}`, { cache: 'no-store' })
      if (!response.ok) {
        throw new Error('Không thể tải kết quả tìm kiếm')
      }
      let data = await response.json()
      let usedFallback = false
      const originalTerm = params.get('q')?.trim() ?? ""
      if ((data.listings?.length ?? 0) === 0 && originalTerm.length > 0) {
        const fallbackParams = new URLSearchParams(params)
        fallbackParams.delete('q')
        const fallbackResponse = await fetch(`/api/search?${fallbackParams.toString()}`, { cache: 'no-store' })
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json()
          if ((fallbackData.listings?.length ?? 0) > 0) {
            data = fallbackData
            usedFallback = true
          }
        }
      }
      setListings(data.listings ?? [])
      setFallbackApplied(usedFallback)
      setFallbackSource(usedFallback ? originalTerm : null)
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

  const helperText = useMemo(() => {
    if (fallbackApplied && fallbackSource) {
      return `Không tìm thấy kết quả cho “${fallbackSource}”. Hiển thị đề xuất thịnh hành để bạn tham khảo thêm.`
    }
    return 'Tinh chỉnh bộ lọc để tìm homestay đúng gu của bạn. Giá hiển thị cho mỗi đêm.'
  }, [fallbackApplied, fallbackSource])

  const handleResetFilters = () => {
    setQuery('')
    setCity('')
    setGuests(() => {
      const initialGuests = parseNumber(initialParams.guests)
      return typeof initialGuests === 'number' && Number.isFinite(initialGuests) ? initialGuests : null
    })
    setPriceRange([MIN_PRICE, MAX_PRICE])
    setInstantBookable(false)
    setAllowPets(false)
    setPropertyType(undefined)
    setActiveSort('trending')
    setAmenities([])
    setExperiences([])
    setPolicies([])
    setDateFlex('weekends')
    setTripLength('3-5')
    setFlexMonth('')
    setFlexDuration('')
    setFlexRegion('')
    setPropertyTypeOptions((prev) => {
      const seeded = new Set(DEFAULT_PROPERTY_TYPES)
      prev.forEach((type) => seeded.add(type))
      return Array.from(seeded)
    })
  }

  return (
    <div className="space-y-8">
      <Card className="border border-border/60 shadow-sm">
        <div className="p-6 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">{resultCountLabel}</h2>
              <p className="text-muted-foreground text-sm">
                {helperText}
              </p>
              {fallbackApplied && (
                <Badge variant="secondary" className="mt-2 bg-amber-100 text-amber-900">
                  Đã bật gợi ý thay thế
                </Badge>
              )}
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
                  <Search className="h-4 w-4" />
                  Bạn muốn tìm gì?
                </label>
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Từ khóa, phong cách, tiện nghi..."
                />
              </div>

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
                  value={guests ?? ''}
                  onChange={(event) => {
                    const { value } = event.target

                    if (value === '') {
                      setGuests(null)
                      return
                    }

                    const numericValue = Number(value)

                    if (!Number.isFinite(numericValue)) {
                      return
                    }

                    const clamped = Math.min(16, Math.max(1, Math.floor(numericValue)))
                    setGuests(clamped)
                  }}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    Khoảng giá (đ/đêm)
                  </label>
                  <Badge variant="secondary">
                    {priceRange[0].toLocaleString('vi-VN')} -{' '}
                    {priceRange[1] >= MAX_PRICE
                      ? 'Không giới hạn'
                      : priceRange[1].toLocaleString('vi-VN')}
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

              {propertyTypeOptions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setPropertyType(undefined)}
                    className={`rounded-full border px-4 py-1.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                      propertyType
                        ? 'border-border bg-muted text-muted-foreground hover:bg-muted/80'
                        : 'border-primary/60 bg-primary text-primary-foreground shadow'
                    }`}
                  >
                    Tất cả chỗ ở
                  </button>
                  {propertyTypeOptions
                    .sort((a, b) => formatPropertyType(a).localeCompare(formatPropertyType(b), 'vi'))
                    .map((type) => {
                      const isActive = propertyType === type
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setPropertyType(type)}
                          className={`rounded-full border px-4 py-1.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                            isActive
                              ? 'border-primary/60 bg-primary text-primary-foreground shadow'
                              : 'border-border bg-white text-muted-foreground hover:border-primary/40 hover:text-foreground'
                          }`}
                        >
                          {formatPropertyType(type)}
                        </button>
                      )
                    })}
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
