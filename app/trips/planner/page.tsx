"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  Map as MapIcon,
  Heart,
  Backpack,
  DollarSign,
  Users,
  Plus,
  Download,
  Share2,
  Clock
} from "lucide-react"
import { TripItineraryBuilder } from "@/components/trip-itinerary-builder"
import { MultiDestinationBooking, type TripStop } from "@/components/multi-destination-booking"
import { TripInspirationBoard, type InspirationCard } from "@/components/trip-inspiration-board"
import { TripPackingList, type PackingItem } from "@/components/trip-packing-list"
import { TripBudgetTracker, type BudgetItem } from "@/components/trip-budget-tracker"
import { SharedTripPlanning, type TripMember } from "@/components/shared-trip-planning"
import { DESTINATIONS } from "@/data/destinations"
import { useToast } from "@/components/ui/use-toast"

interface PlannerTrip {
  id: string
  status: string
  checkIn: string
  checkOut: string
  nights: number
  listing: {
    id: string
    title: string
    city: string
    state?: string | null
    country?: string | null
    image?: string | null
  }
  services?: any[]
  servicesTotal?: number
  plannerItems?: any[]
  membershipTier?: string | null
}

interface PlannerResponse {
  trips: PlannerTrip[]
  summary: {
    totalTrips: number
    totalDestinations: number
    totalPlannerItems: number
    totalServices: number
    totalServiceValue: number
    readiness: number
  }
  suggestedActiveTripId: string | null
}

interface PlannerSuggestionResponse {
  suggestions?: Array<{
    id: string
    title: string
    type: "accommodation" | "dining" | "activity" | "shopping" | "sightseeing"
    location: string
    notes?: string | null
    time?: string | null
    dayOffset?: number | null
    distanceKm?: number | null
  }>
}

const DEFAULT_HERO_IMAGE = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200"
const MEMBERSHIP_MIN_TIER = "SILVER"
const MEMBERSHIP_ORDER = ["BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND"] as const

const membershipQualifies = (tier: string | null | undefined) => {
  if (!tier) return false
  const normalized = tier.toUpperCase()
  const requiredIndex = MEMBERSHIP_ORDER.indexOf(MEMBERSHIP_MIN_TIER)
  const currentIndex = MEMBERSHIP_ORDER.indexOf(normalized as typeof MEMBERSHIP_ORDER[number])
  if (currentIndex === -1) return false
  return currentIndex >= requiredIndex
}

const SERVICE_PAID_STATUSES = new Set(["CONFIRMED", "COMPLETED", "PAID"])

const mapServiceCategory = (rawType: unknown): string => {
  if (typeof rawType !== "string") return "misc"
  const type = rawType.toLowerCase()
  if (type.includes("stay") || type.includes("room") || type.includes("accommodation")) return "accommodation"
  if (type.includes("food") || type.includes("dining") || type.includes("meal") || type.includes("restaurant")) return "food"
  if (type.includes("transport") || type.includes("transfer") || type.includes("car") || type.includes("airport")) return "transport"
  if (type.includes("shop")) return "shopping"
  if (type.includes("tour") || type.includes("activity") || type.includes("experience") || type.includes("sight")) return "activities"
  return "misc"
}

const mapPlannerCategory = (rawType: unknown): string => {
  if (typeof rawType !== "string") return "misc"
  switch (rawType) {
    case "accommodation":
      return "accommodation"
    case "dining":
      return "food"
    case "shopping":
      return "shopping"
    case "sightseeing":
    case "activity":
      return "activities"
    default:
      return "misc"
  }
}

const buildBudgetItems = (trip: PlannerTrip | null): BudgetItem[] => {
  if (!trip) return []
  const items: BudgetItem[] = []
  const linkedServiceIds = new Set<string>()

  (trip.services ?? []).forEach((service: any, index: number) => {
    const rawCost = typeof service?.totalPrice === "number" ? service.totalPrice : Number(service?.totalPrice)
    const cost = Number.isFinite(rawCost) ? Number(rawCost) : 0
    if (cost <= 0) return

    const status = typeof service?.status === "string" ? service.status.toUpperCase() : "PENDING"
    const category = mapServiceCategory(service?.type)
    const id = typeof service?.id === "string" ? service.id : `service-${index}`

    linkedServiceIds.add(id)

    items.push({
      id,
      category,
      name: typeof service?.name === "string" ? service.name : "Dịch vụ concierge",
      planned: cost,
      spent: SERVICE_PAID_STATUSES.has(status) ? cost : 0,
      currency: typeof service?.currency === "string" ? service.currency : undefined,
    })
  })

  (trip.plannerItems ?? []).forEach((item: any, index: number) => {
    const rawCost = typeof item?.cost === "number" ? item.cost : Number(item?.cost)
    if (!Number.isFinite(rawCost) || Number(rawCost) <= 0) return

    const serviceRef = typeof item?.serviceRef === "string" ? item.serviceRef : undefined
    if (serviceRef && linkedServiceIds.has(serviceRef)) {
      return
    }

    const status = typeof item?.status === "string" ? item.status.toUpperCase() : "PLANNED"
    const category = mapPlannerCategory(item?.type)
    const id = typeof item?.id === "string" ? item.id : `planner-${index}`

    items.push({
      id,
      category,
      name: typeof item?.title === "string" ? item.title : "Hoạt động concierge",
      planned: Number(rawCost),
      spent: SERVICE_PAID_STATUSES.has(status) ? Number(rawCost) : 0,
      currency: typeof item?.currency === "string" ? item.currency : undefined,
    })
  })

  return items
}

const normalizeText = (value: string | null | undefined) => {
  if (!value) return ""
  return value
}

const pushUniquePackingItem = (map: Map<string, PackingItem>, item: PackingItem) => {
  const key = item.item.trim().toLowerCase()
  if (!key || map.has(key)) return
  map.set(key, item)
}

const buildPackingItems = (trip: PlannerTrip | null): PackingItem[] => {
  if (!trip) return []
  const items = new Map<string, PackingItem>()

  const destinationLabel = [trip.listing?.city, trip.listing?.country].filter(Boolean).join(", ") || "điểm đến"

  pushUniquePackingItem(items, {
    id: "documents-booking",
    category: "documents",
    item: `Giấy tờ tuỳ thân và xác nhận đặt chỗ tại ${normalizeText(trip.listing?.title)}`.trim(),
    quantity: 1,
    packed: false,
  })

  pushUniquePackingItem(items, {
    id: "payment-methods",
    category: "documents",
    item: "Thẻ tín dụng hoặc tiền mặt cho chi phí concierge",
    quantity: 1,
    packed: false,
  })

  pushUniquePackingItem(items, {
    id: "clothing-weather",
    category: "clothing",
    item: `Trang phục phù hợp với thời tiết ${destinationLabel}`,
    quantity: 1,
    packed: false,
  })

  pushUniquePackingItem(items, {
    id: "electronics-charger",
    category: "electronics",
    item: "Sạc điện thoại và pin dự phòng",
    quantity: 1,
    packed: false,
  })

  if ((trip.services ?? []).some((service: any) => typeof service?.type === "string" && service.type.includes("spa"))) {
    pushUniquePackingItem(items, {
      id: "spa-outfit",
      category: "clothing",
      item: "Trang phục nhẹ cho dịch vụ spa/relax",
      quantity: 1,
      packed: false,
    })
  }

  (trip.services ?? []).forEach((service: any, index: number) => {
    const serviceName = typeof service?.name === "string" ? service.name : "dịch vụ concierge"
    const serviceId = typeof service?.id === "string" ? service.id : `service-${index}`
    const type = typeof service?.type === "string" ? service.type.toLowerCase() : ""

    pushUniquePackingItem(items, {
      id: `service-${serviceId}`,
      category: "misc",
      item: `Chuẩn bị cho ${serviceName}`,
      quantity: 1,
      packed: false,
    })

    if (type.includes("transport") || type.includes("transfer") || type.includes("airport")) {
      pushUniquePackingItem(items, {
        id: `travel-docs-${serviceId}`,
        category: "documents",
        item: `Thông tin chuyến đi/xe cho ${serviceName}`,
        quantity: 1,
        packed: false,
      })
    }
  })

  (trip.plannerItems ?? []).forEach((planner: any, index: number) => {
    const title = typeof planner?.title === "string" ? planner.title : null
    if (!title) return
    if (typeof planner?.suggestionId === "string") {
      pushUniquePackingItem(items, {
        id: `suggestion-${planner.suggestionId}`,
        category: "misc",
        item: `Chuẩn bị cho hoạt động "${title}"`,
        quantity: 1,
        packed: false,
      })
      return
    }

    pushUniquePackingItem(items, {
      id: `planner-${index}`,
      category: mapPlannerCategory(planner?.type),
      item: `Ghi chú cho "${title}"`,
      quantity: 1,
      packed: false,
    })
  })

  return Array.from(items.values())
}

const slugify = (value?: string | null) => {
  if (!value) return "destination"
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 50) || "destination"
}

const buildDestinationStops = (trips: PlannerTrip[] | undefined): TripStop[] => {
  if (!Array.isArray(trips)) return []
  return trips.map((trip, index) => {
    const checkIn = trip.checkIn ? new Date(trip.checkIn) : undefined
    const checkOut = trip.checkOut ? new Date(trip.checkOut) : undefined
    const destinationSlug = slugify(trip.listing?.city ?? trip.listing?.title ?? trip.id)

    return {
      id: trip.id ?? `trip-${index}`,
      destinationSlug,
      checkIn,
      checkOut,
      guests: 2,
      listing: trip.listing
        ? {
            id: trip.listing.id ?? destinationSlug,
            title: trip.listing.title ?? trip.listing.city ?? "Chỗ nghỉ LuxeStay",
            image: trip.listing.image ?? null,
            price: undefined,
            rating: null,
          }
        : undefined,
    }
  })
}

const buildInspirationCards = (
  suggestions: PlannerSuggestionResponse["suggestions"],
  trip: PlannerTrip | null,
): InspirationCard[] => {
  if (!Array.isArray(suggestions) || !suggestions.length) return []
  const baseImage = trip?.listing?.image ?? DEFAULT_HERO_IMAGE
  const defaultLocation = [trip?.listing?.city, trip?.listing?.country].filter(Boolean).join(", ") || "Đang cập nhật"

  return suggestions.map((suggestion, index) => ({
    id: suggestion?.id ?? `suggestion-${index}`,
    image: baseImage,
    title: suggestion?.title ?? `Gợi ý concierge ${index + 1}`,
    location: suggestion?.location || defaultLocation,
    category: suggestion?.type ?? "activity",
    saved: false,
    notes: suggestion?.notes ?? undefined,
  }))
}

const buildSharedMembers = (user: { id?: string | null; name?: string | null; email?: string | null; image?: string | null } | undefined, trip: PlannerTrip | null): TripMember[] => {
  if (!user?.email) return []
  return [
    {
      id: user.id ?? user.email,
      name: user.name ?? user.email.split("@")[0] ?? "Bạn",
      email: user.email,
      avatar: user.image ?? undefined,
      role: "owner",
      status: "active",
      joinedAt: trip?.checkIn ?? new Date().toISOString(),
    },
  ]
}

export default function TripPlanningHubPage() {
  const { data: session, status } = useSession()
  const [plannerData, setPlannerData] = useState<PlannerResponse | null>(null)
  const [activeTripId, setActiveTripId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<PlannerSuggestionResponse["suggestions"]>([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const { toast } = useToast()
  const sessionTier = session?.user?.membership?.toUpperCase() ?? null
  const meetsRequirement = membershipQualifies(sessionTier)

  useEffect(() => {
    if (status === "authenticated" && !meetsRequirement) {
      setPlannerData(null)
      setActiveTripId(null)
      setLoading(false)
    }
    if (status === "unauthenticated") {
      setLoading(false)
    }
  }, [status, meetsRequirement])

  const loadPlanner = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = Boolean(options?.silent)
      if (!silent) {
        setLoading(true)
      }

      try {
        const response = await fetch('/api/trips/planner', { cache: 'no-store' })
        if (response.status === 401) {
          throw new Error('Bạn cần đăng nhập để xem planner')
        }
        if (!response.ok) {
          throw new Error('Không thể tải dữ liệu planner')
        }

        const data = (await response.json()) as PlannerResponse
        setPlannerData(data)
        setActiveTripId((previous) => {
          if (previous && data.trips.some((trip) => trip.id === previous)) {
            return previous
          }
          return data.suggestedActiveTripId ?? data.trips?.[0]?.id ?? null
        })
        setError(null)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định'
        if (silent) {
          toast({
            variant: 'destructive',
            title: 'Không thể cập nhật planner',
            description: message,
          })
        } else {
          setError(message)
        }
      } finally {
        if (!silent) {
          setLoading(false)
        }
      }
    },
    [toast],
  )

  useEffect(() => {
    if (status === "loading") return
    if (!meetsRequirement) return
    void loadPlanner()
  }, [loadPlanner, meetsRequirement, status])

  const activeTrip = useMemo(() => {
    if (!plannerData) return null
    return plannerData.trips.find((trip) => trip.id === activeTripId) ?? plannerData.trips[0] ?? null
  }, [plannerData, activeTripId])

  const hasTrips = Boolean(plannerData?.trips?.length)

  useEffect(() => {
    if (!activeTrip?.id || !meetsRequirement) {
      setSuggestions([])
      return
    }

    let cancelled = false

    const fetchSuggestions = async () => {
      try {
        setSuggestionsLoading(true)
        const response = await fetch(
          `/api/trips/planner/suggestions?bookingId=${encodeURIComponent(activeTrip.id)}`,
          { cache: 'no-store' },
        )

        if (!response.ok) {
          const errorBody = await response.json().catch(() => null)
          throw new Error(errorBody?.error ?? 'Không thể tải gợi ý concierge')
        }

        const data = (await response.json()) as PlannerSuggestionResponse
        if (!cancelled) {
          setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : [])
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định'
          setSuggestions([])
          toast({
            variant: 'destructive',
            title: 'Không thể tải gợi ý concierge',
            description: message,
          })
        }
      } finally {
        if (!cancelled) {
          setSuggestionsLoading(false)
        }
      }
    }

    void fetchSuggestions()

    return () => {
      cancelled = true
    }
  }, [activeTrip?.id, toast, meetsRequirement])

  const selectedDestinations = useMemo(() => {
    if (!activeTrip?.listing?.city) {
      return []
    }

    const cityName = activeTrip.listing.city.toLowerCase()
    return DESTINATIONS.filter((destination) => destination.name.toLowerCase().includes(cityName)).slice(0, 3)
  }, [activeTrip])

  const tripInfo = useMemo(() => {
    if (!activeTrip) {
      return null
    }

    const destinations = [activeTrip.listing.city, activeTrip.listing.country]
      .filter(Boolean)
      .map((value) => String(value))

    const extraDestinations = selectedDestinations.map((destination) => destination.name)

    const uniqueDestinations = Array.from(new Set([...destinations, ...extraDestinations]))

    return {
      name: `Kế hoạch ${activeTrip.listing.title}`,
      startDate: new Date(activeTrip.checkIn).toLocaleDateString('vi-VN'),
      endDate: new Date(activeTrip.checkOut).toLocaleDateString('vi-VN'),
      destinations: uniqueDestinations,
      members: 4,
      status: (activeTrip.status || 'planning').toLowerCase() as 'planning' | 'upcoming' | 'ongoing' | 'completed',
    }
  }, [activeTrip, selectedDestinations])

  const quickStats = useMemo(() => {
    if (!plannerData || !activeTrip) {
      return {
        activities: 0,
        ideas: 0,
        budget: 0,
        readiness: 0,
        heroImage: DEFAULT_HERO_IMAGE,
      }
    }

    return {
      activities: activeTrip.plannerItems?.length ?? 0,
      ideas: plannerData.summary.totalPlannerItems,
      budget: activeTrip.servicesTotal ?? plannerData.summary.totalServiceValue,
      readiness: plannerData.summary.readiness,
      heroImage: activeTrip.listing.image ?? selectedDestinations[0]?.heroImage ?? DEFAULT_HERO_IMAGE,
    }
  }, [activeTrip, plannerData, selectedDestinations])

  const itineraryItems = useMemo(() => {
    if (!activeTrip?.plannerItems) return []
    return activeTrip.plannerItems.map((item: any, index: number) => ({
      id: String(item.id ?? `planner-${index}`),
      day: Number.isFinite(Number(item.day)) ? Number(item.day) : 1,
      time: typeof item.time === 'string' && item.time ? item.time : '10:00',
      type: ['accommodation', 'dining', 'activity', 'shopping', 'sightseeing'].includes(item.type)
        ? item.type
        : 'activity',
      title: item.title ?? 'Hoạt động concierge',
      location: item.location ?? activeTrip.listing.city ?? 'Địa điểm đang cập nhật',
      notes: item.notes ?? undefined,
      duration: item.duration ?? undefined,
      cost: typeof item.cost === 'number' ? item.cost : undefined,
      suggestionId: typeof item.suggestionId === 'string' ? item.suggestionId : undefined,
    }))
  }, [activeTrip])

  const budgetItems = useMemo(() => buildBudgetItems(activeTrip ?? null), [activeTrip])
  const packingItems = useMemo(() => buildPackingItems(activeTrip ?? null), [activeTrip])
  const inspirationCards = useMemo(
    () => buildInspirationCards(suggestions ?? [], activeTrip ?? null),
    [suggestions, activeTrip],
  )
  const destinationStops = useMemo(() => buildDestinationStops(plannerData?.trips), [plannerData?.trips])
  const sharedMembers = useMemo(
    () => buildSharedMembers(session?.user, activeTrip ?? null),
    [session?.user, activeTrip],
  )

  if (!tripInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md p-8 text-center space-y-4">
          <h2 className="text-xl font-semibold">Không thể hiển thị planner</h2>
          <p className="text-muted-foreground">
            Chúng tôi không lấy được thông tin chuyến đi hiện tại. Vui lòng chọn lại chuyến đi hoặc làm mới trang.
          </p>
          <div className="flex justify-center gap-2">
            <Button onClick={() => void loadPlanner()}>Tải lại dữ liệu</Button>
            <Button variant="outline" asChild>
              <Link href="/trips">Về danh sách chuyến đi</Link>
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Đang tải planner của bạn...</p>
        </div>
      </div>
    )
  }

  if (status !== "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md p-8 text-center space-y-4">
          <h2 className="text-xl font-semibold">Bạn cần đăng nhập</h2>
          <p className="text-muted-foreground">Đăng nhập để truy cập planner và đồng bộ chuyến đi của bạn.</p>
          <div className="flex justify-center">
            <Button asChild>
              <Link href="/login">Đăng nhập</Link>
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (!meetsRequirement) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto max-w-3xl px-4 py-12">
          <Card className="rounded-2xl border border-primary/20 bg-white/95 p-10 text-center shadow-xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Clock className="h-8 w-8" />
            </div>
            <h1 className="mt-6 text-2xl font-semibold text-foreground">Planner dành cho thành viên Bạc trở lên</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Trip Planner giúp bạn lên lịch hoạt động, chia sẻ với nhóm và nhận gợi ý concierge. Nâng cấp membership để mở khoá ngay.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild className="px-6">
                <Link href="/membership">Xem gói membership</Link>
              </Button>
              <Button asChild variant="outline" className="px-6">
                <Link href="/rewards">Tích điểm LuxeStay Rewards</Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md p-8 text-center space-y-4">
          <h2 className="text-xl font-semibold">Không thể tải planner</h2>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => location.reload()}>Thử lại</Button>
        </Card>
      </div>
    )
  }

  if (!hasTrips) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto py-12 px-4 max-w-3xl">
          <Card className="p-10 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Calendar className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold">Planner của bạn đang trống</h1>
            <p className="text-muted-foreground">
              Khi bạn có một lịch đặt phòng hợp lệ, planner sẽ hiển thị các hoạt động trong khoảng check-in tới check-out.
              Bạn có thể bắt đầu bằng cách đặt homestay mới hoặc xem lại các chuyến đi đã hoàn tất.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild>
                <Link href="/search">Khám phá homestay</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/trips">Xem đặt phòng</Link>
              </Button>
            </div>
          </Card>

          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Hoạt động</div>
              <div className="text-2xl font-bold">0</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Ý tưởng</div>
              <div className="text-2xl font-bold">0</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Ngân sách</div>
              <div className="text-2xl font-bold">0₫</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Đã chuẩn bị</div>
              <div className="text-2xl font-bold">0%</div>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!tripInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md p-8 text-center space-y-4">
          <h2 className="text-xl font-semibold">Không thể hiển thị planner</h2>
          <p className="text-muted-foreground">
            Chúng tôi chưa thể đồng bộ dữ liệu chuyến đi. Vui lòng thử tải lại trang.
          </p>
          <div className="flex justify-center gap-2">
            <Button onClick={() => void loadPlanner()}>Tải lại</Button>
            <Button variant="outline" asChild>
              <Link href="/trips">Về danh sách chuyến đi</Link>
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        {/* Hero Section */}
        <div className="relative mb-8 rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-blue-600/90 z-10" />
          <img
            src={quickStats.heroImage}
            alt="Trip planning"
            className="w-full h-64 object-cover"
          />
          <div className="absolute inset-0 z-20 flex items-center">
            <div className="container mx-auto px-8">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Badge className="mb-4 bg-white/20 backdrop-blur-sm">
                    {tripInfo.status === "planning" && "🗓️ Đang lên kế hoạch"}
                    {tripInfo.status === "upcoming" && "⏰ Sắp diễn ra"}
                    {tripInfo.status === "ongoing" && "✈️ Đang diễn ra"}
                    {tripInfo.status === "completed" && "✅ Đã hoàn thành"}
                  </Badge>
                  <h1 className="text-4xl font-bold text-white mb-3">
                    {tripInfo.name}
                  </h1>
                  <div className="flex items-center space-x-6 text-white/90">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-5 h-5" />
                      <span>{tripInfo.startDate} - {tripInfo.endDate}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapIcon className="w-5 h-5" />
                      <span>{tripInfo.destinations.join(", ")}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="w-5 h-5" />
                      <span>{tripInfo.members} thành viên</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Button variant="outline" className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20">
                    <Share2 className="w-4 h-4 mr-2" />
                    Chia sẻ
                  </Button>
                  <Button className="bg-white text-primary hover:bg-white/90">
                    <Download className="w-4 h-4 mr-2" />
                    Xuất PDF
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{quickStats.activities}</p>
                <p className="text-sm text-muted-foreground">Hoạt động</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                <Heart className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{quickStats.ideas}</p>
                <p className="text-sm text-muted-foreground">Ý tưởng</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {quickStats.budget.toLocaleString("vi-VN", {
                    style: "currency",
                    currency: "VND",
                    maximumFractionDigits: 0,
                  })}
                </p>
                <p className="text-sm text-muted-foreground">Ngân sách</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                <Backpack className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{quickStats.readiness}%</p>
                <p className="text-sm text-muted-foreground">Đã chuẩn bị</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="itinerary" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 h-auto">
            <TabsTrigger value="itinerary" className="flex items-center space-x-2 py-3">
              <Calendar className="w-4 h-4" />
              <span>Lịch trình</span>
            </TabsTrigger>
            <TabsTrigger value="destinations" className="flex items-center space-x-2 py-3">
              <MapIcon className="w-4 h-4" />
              <span>Điểm đến</span>
            </TabsTrigger>
            <TabsTrigger value="inspiration" className="flex items-center space-x-2 py-3">
              <Heart className="w-4 h-4" />
              <span>Ý tưởng</span>
            </TabsTrigger>
            <TabsTrigger value="packing" className="flex items-center space-x-2 py-3">
              <Backpack className="w-4 h-4" />
              <span>Đồ đạc</span>
            </TabsTrigger>
            <TabsTrigger value="budget" className="flex items-center space-x-2 py-3">
              <DollarSign className="w-4 h-4" />
              <span>Ngân sách</span>
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center space-x-2 py-3">
              <Users className="w-4 h-4" />
              <span>Nhóm</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="itinerary">
            <TripItineraryBuilder
              bookingId={activeTrip?.id}
              items={itineraryItems}
              defaultDays={Math.max(1, activeTrip?.nights ?? 3)}
              maxDays={Math.max(1, activeTrip?.nights ?? 0)}
              tripStart={activeTrip?.checkIn ?? null}
              tripEnd={activeTrip?.checkOut ?? null}
              suggestions={suggestions ?? []}
              suggestionsLoading={suggestionsLoading}
              onRefresh={loadPlanner}
            />
          </TabsContent>

          <TabsContent value="destinations">
            <MultiDestinationBooking initialStops={destinationStops} />
          </TabsContent>

          <TabsContent value="inspiration">
            <TripInspirationBoard
              initialItems={inspirationCards}
              listingName={activeTrip?.listing?.title ?? null}
              loading={suggestionsLoading}
            />
          </TabsContent>

          <TabsContent value="packing">
            <TripPackingList initialItems={packingItems} />
          </TabsContent>

          <TabsContent value="budget">
            <TripBudgetTracker items={budgetItems} />
          </TabsContent>

          <TabsContent value="team">
            <SharedTripPlanning
              bookingId={activeTrip?.id ?? null}
              initialMembers={sharedMembers}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
