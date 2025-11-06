"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { format, formatDistanceToNowStrict, startOfMonth, endOfMonth, subMonths, subDays, startOfDay, max, min, differenceInCalendarDays } from "date-fns"
import { vi } from "date-fns/locale"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { HostDashboardLayout } from "@/components/host-dashboard-layout"
import { DashboardStats } from "@/components/dashboard-stats"
import { RevenueChart } from "@/components/revenue-chart"
import { RecentBookingsEnhanced } from "@/components/recent-bookings-enhanced"
import { HostListings } from "@/components/host-listings"
import { HostOnboardingChecklist, HostChecklistItem } from "@/components/host-onboarding-checklist"
import { HostInsights, HostInsight } from "@/components/host-insights"
import { useBooking } from "@/hooks/use-booking"
import { useListings } from "@/hooks/use-listings"

type BookingRecord = {
  id: string
  status: string
  totalPrice?: number | null
  checkIn: string
  checkOut: string
  createdAt?: string
}

type ListingRecord = {
  id: string
  status?: string | null
  rating?: number | null
  averageRating?: number | null
  reviewCount?: number | null
}

const CONFIRMED_STATUSES = new Set(["CONFIRMED", "COMPLETED", "CHECKED_IN", "CHECKED_OUT"])

const asDate = (value: string | Date | undefined): Date | null => {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value)

export default function HostDashboardPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const { getBookings } = useBooking()
  const { getMyListings } = useListings()

  const [isLoading, setIsLoading] = useState(true)
  const [verifyingAccess, setVerifyingAccess] = useState(true)
  const [hostReady, setHostReady] = useState(false)
  const [bookings, setBookings] = useState<BookingRecord[]>([])
  const [listings, setListings] = useState<ListingRecord[]>([])

  const user = session?.user

  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true)
      const [bookingsResponse, listingsResponse] = await Promise.all([
        getBookings("host"),
        getMyListings(),
      ])

      const bookingsData = Array.isArray(bookingsResponse?.bookings)
        ? (bookingsResponse.bookings as BookingRecord[])
        : []

      const listingsData = Array.isArray(listingsResponse)
        ? (listingsResponse as ListingRecord[])
        : Array.isArray((listingsResponse as { listings?: unknown })?.listings)
          ? (((listingsResponse as { listings?: ListingRecord[] }).listings ?? []) as ListingRecord[])
          : []

      setBookings(bookingsData)
      setListings(listingsData)
    } catch (error) {
      console.error("Failed to load host dashboard data", error)
      setBookings([])
      setListings([])
    } finally {
      setIsLoading(false)
    }
  }, [getBookings, getMyListings])

  useEffect(() => {
    if (status === "loading") {
      return
    }

    if (status === "unauthenticated") {
      setHostReady(false)
      setVerifyingAccess(false)
      router.push("/login")
      return
    }

    if (!user) {
      return
    }

    if (user.role === "HOST" || user.isHost) {
      setHostReady(true)
      setVerifyingAccess(false)
      return
    }

    let cancelled = false

    const verifyHostAccess = async () => {
      try {
        setVerifyingAccess(true)
        const response = await fetch("/api/host/profile", { cache: "no-store" })
        if (!response.ok) {
          throw new Error("Không thể kiểm tra trạng thái host.")
        }
        const data = await response.json()
        const isApproved = Boolean(data?.profile) || data?.application?.status === "APPROVED"

        if (isApproved) {
          await update({
            user: {
              ...user,
              role: "HOST",
              isHost: true,
            },
          })
          if (!cancelled) {
            setHostReady(true)
            toast.success("Tài khoản host của bạn đã được kích hoạt.")
          }
        } else if (!cancelled) {
          toast.error("Hồ sơ host của bạn chưa được duyệt. Vui lòng kiểm tra lại sau.")
          router.push("/become-host")
        }
      } catch (error) {
        console.error("Failed to verify host access", error)
        if (!cancelled) {
          toast.error("Không thể xác thực quyền host. Vui lòng thử lại.")
          router.push("/")
        }
      } finally {
        if (!cancelled) {
          setVerifyingAccess(false)
        }
      }
    }

    verifyHostAccess()

    return () => {
      cancelled = true
    }
  }, [status, user, router, update])

  useEffect(() => {
    if (!hostReady) {
      return
    }

    loadDashboardData()
  }, [hostReady, loadDashboardData])

  const stats = useMemo(() => {
    if (!bookings.length) {
      return {
        totalRevenue: 0,
        monthlyBookings: 0,
        totalRevenueChange: 0,
        monthlyBookingsChange: 0,
        averageRating: listings.length ? calculateAverageRating(listings) : undefined,
        occupancyRate: listings.length ? 0 : undefined,
      }
    }

    const now = new Date()
    const monthStart = startOfMonth(now)
    const previousMonthStart = startOfMonth(subMonths(now, 1))
    const previousMonthEnd = endOfMonth(subMonths(now, 1))

    let totalRevenue = 0
    let revenueThisMonth = 0
    let revenuePreviousMonth = 0
    let bookingsThisMonth = 0
    let bookingsPreviousMonth = 0

    bookings.forEach((booking) => {
      const checkIn = asDate(booking.checkIn)
      const createdAt = asDate(booking.createdAt) ?? checkIn
      const isRevenueBooking = booking.totalPrice && CONFIRMED_STATUSES.has(booking.status)

      if (isRevenueBooking) {
        totalRevenue += booking.totalPrice ?? 0
      }

      if (createdAt && createdAt >= monthStart && createdAt <= now) {
        bookingsThisMonth += 1
        if (isRevenueBooking) {
          revenueThisMonth += booking.totalPrice ?? 0
        }
      }

      if (createdAt && createdAt >= previousMonthStart && createdAt <= previousMonthEnd) {
        bookingsPreviousMonth += 1
        if (isRevenueBooking) {
          revenuePreviousMonth += booking.totalPrice ?? 0
        }
      }
    })

    const totalAvailableNights = listings.length * 30
    const occupiedNights = calculateOccupiedNights(bookings, listings.length)
    const occupancyRate = totalAvailableNights > 0 ? Math.min(100, Math.round((occupiedNights / totalAvailableNights) * 100)) : undefined

    return {
      totalRevenue,
      totalRevenueChange: computeDelta(revenueThisMonth, revenuePreviousMonth),
      monthlyBookings: bookingsThisMonth,
      monthlyBookingsChange: computeDelta(bookingsThisMonth, bookingsPreviousMonth),
      averageRating: listings.length ? calculateAverageRating(listings) : undefined,
      averageRatingChange: undefined,
      occupancyRate,
      occupancyRateChange: undefined,
    }
  }, [bookings, listings])

  const revenueSeries = useMemo(() => buildRevenueSeries(bookings), [bookings])

  const insights = useMemo<HostInsight[]>(() => buildInsights(bookings, listings), [bookings, listings])

  const checklistItems = useMemo<HostChecklistItem[]>(() => buildChecklistItems(session, bookings, listings), [session, bookings, listings])

  const layoutMetrics = useMemo(() => {
    const upcoming = bookings.filter((booking) => {
      const checkIn = asDate(booking.checkIn)
      return checkIn ? checkIn >= startOfDay(new Date()) && CONFIRMED_STATUSES.has(booking.status) : false
    }).length

    const activeListings = listings.filter((listing) => listing.status === "ACTIVE").length

    return {
      upcomingBookings: upcoming,
      activeListings,
      unreadMessages: null,
    }
  }, [bookings, listings])

  if (status === "loading" || isLoading || verifyingAccess || !hostReady) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <HostDashboardLayout metrics={layoutMetrics}>
      <div className="space-y-8">
        <header className="space-y-1">
          <h1 className="font-serif text-3xl font-bold text-foreground md:text-4xl">
            Chào mừng trở lại, {session.user.name || "Host"}
          </h1>
          <p className="text-muted-foreground">
            Theo dõi hiệu suất vận hành, kiểm soát booking và tối ưu giá theo thời gian thực.
          </p>
        </header>

        <DashboardStats stats={stats} loading={isLoading} />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <HostOnboardingChecklist items={checklistItems} className="xl:col-span-1" />
          <div className="xl:col-span-2">
            <HostInsights insights={insights} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <RevenueChart data={revenueSeries} loading={isLoading} />
          <RecentBookingsEnhanced type="host" />
        </div>

        <HostListings initialListings={listings} />
      </div>
    </HostDashboardLayout>
  )
}

function computeDelta(current: number, previous: number) {
  if (!previous && current) return 100
  if (!previous && !current) return 0
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) return 0
  return ((current - previous) / previous) * 100
}

function calculateAverageRating(listings: ListingRecord[]) {
  const ratings = listings
    .map((listing) => listing.averageRating ?? listing.rating)
    .filter((rating): rating is number => typeof rating === "number" && !Number.isNaN(rating))

  if (!ratings.length) {
    return undefined
  }

  const sum = ratings.reduce((acc, value) => acc + value, 0)
  return Number((sum / ratings.length).toFixed(2))
}

function calculateOccupiedNights(bookings: BookingRecord[], listingsCount: number) {
  if (!listingsCount) return 0

  const referenceStart = startOfDay(new Date())
  const referenceEnd = addDays(referenceStart, 30)

  return bookings.reduce((acc, booking) => {
    if (!CONFIRMED_STATUSES.has(booking.status)) return acc

    const checkIn = asDate(booking.checkIn)
    const checkOut = asDate(booking.checkOut)
    if (!checkIn || !checkOut) return acc

    const overlapStart = max([checkIn, referenceStart])
    const overlapEnd = min([checkOut, referenceEnd])

    if (!overlapStart || !overlapEnd || overlapEnd <= overlapStart) return acc

    const nights = differenceInCalendarDays(overlapEnd, overlapStart)
    return nights > 0 ? acc + nights : acc
  }, 0)
}

function buildRevenueSeries(bookings: BookingRecord[]) {
  const now = new Date()
  const series = [] as { label: string; revenue: number }[]

  for (let i = 5; i >= 0; i -= 1) {
    const monthDate = subMonths(now, i)
    const monthStart = startOfMonth(monthDate)
    const monthEnd = endOfMonth(monthDate)
    const label = format(monthDate, "'T' M", { locale: vi })

    const revenue = bookings.reduce((acc, booking) => {
      if (!CONFIRMED_STATUSES.has(booking.status)) return acc
      const checkIn = asDate(booking.checkIn)
      if (!checkIn || checkIn < monthStart || checkIn > monthEnd) return acc
      return acc + (booking.totalPrice ?? 0)
    }, 0)

    series.push({ label, revenue })
  }

  return series
}

function buildInsights(bookings: BookingRecord[], listings: ListingRecord[]): HostInsight[] {
  if (!bookings.length && !listings.length) return []

  const now = startOfDay(new Date())
  const sevenDaysAgo = subDays(now, 7)
  const fourteenDaysAgo = subDays(sevenDaysAgo, 7)

  const bookingsLastWeek = bookings.filter((booking) => {
    const createdAt = asDate(booking.createdAt) ?? asDate(booking.checkIn)
    return createdAt ? createdAt > sevenDaysAgo : false
  })

  const bookingsPrevWeek = bookings.filter((booking) => {
    const createdAt = asDate(booking.createdAt) ?? asDate(booking.checkIn)
    if (!createdAt) return false
    return createdAt > fourteenDaysAgo && createdAt <= sevenDaysAgo
  })

  const bookingPaceDelta = computeDelta(bookingsLastWeek.length, bookingsPrevWeek.length)

  const revenueLastWeek = bookingsLastWeek.reduce((acc, booking) => {
    if (!CONFIRMED_STATUSES.has(booking.status)) return acc
    return acc + (booking.totalPrice ?? 0)
  }, 0)

  const revenuePrevWeek = bookingsPrevWeek.reduce((acc, booking) => {
    if (!CONFIRMED_STATUSES.has(booking.status)) return acc
    return acc + (booking.totalPrice ?? 0)
  }, 0)

  const nextCheckIn = bookings
    .filter((booking) => {
      if (!CONFIRMED_STATUSES.has(booking.status)) return false
      const checkIn = asDate(booking.checkIn)
      return checkIn ? checkIn >= now : false
    })
    .sort((a, b) => {
      const aDate = asDate(a.checkIn)?.getTime() ?? 0
      const bDate = asDate(b.checkIn)?.getTime() ?? 0
      return aDate - bDate
    })[0]

  const averageStayLength = (() => {
    const stays = bookings
      .filter((booking) => {
        if (!CONFIRMED_STATUSES.has(booking.status)) return false
        const checkIn = asDate(booking.checkIn)
        const checkOut = asDate(booking.checkOut)
        return Boolean(checkIn && checkOut)
      })
      .map((booking) => {
        const checkIn = asDate(booking.checkIn)!
        const checkOut = asDate(booking.checkOut)!
        return Math.max(1, differenceInCalendarDays(checkOut, checkIn))
      })

    if (!stays.length) return null
    const total = stays.reduce((acc, nights) => acc + nights, 0)
    return total / stays.length
  })()

  const insights: HostInsight[] = []

  insights.push({
    id: "booking-pace",
    title: "Booking pace",
    value: `${bookingsLastWeek.length} đặt phòng/7 ngày`,
    trend: bookingPaceDelta > 0 ? "up" : bookingPaceDelta < 0 ? "down" : "neutral",
    trendLabel:
      bookingsPrevWeek.length === 0 && bookingsLastWeek.length > 0
        ? "Tăng so với tuần trước"
        : `${bookingPaceDelta > 0 ? "+" : ""}${bookingPaceDelta.toFixed(1)}% so với tuần trước`,
    helperText: "Số booking mới trong 7 ngày gần nhất",
  })

  insights.push({
    id: "weekly-revenue",
    title: "Doanh thu 7 ngày",
    value: formatCurrency(revenueLastWeek),
    trend: revenuePrevWeek === 0 && revenueLastWeek === 0 ? "neutral" : revenueLastWeek >= revenuePrevWeek ? "up" : "down",
    trendLabel:
      revenuePrevWeek === 0 && revenueLastWeek > 0
        ? "Doanh thu đầu tiên"
        : `${computeDelta(revenueLastWeek, revenuePrevWeek).toFixed(1)}% so với tuần trước`,
    helperText: "Bao gồm các booking đã xác nhận",
  })

  if (nextCheckIn) {
    const nextCheckInDate = asDate(nextCheckIn.checkIn)!
    insights.push({
      id: "next-check-in",
      title: "Lượt check-in kế tiếp",
      value: format(nextCheckInDate, "dd/MM", { locale: vi }),
      trend: "neutral",
      trendLabel: `Còn ${formatDistanceToNowStrict(nextCheckInDate, { locale: vi })}`,
      helperText: "Chuẩn bị sẵn sàng cho khách tiếp theo",
    })
  }

  insights.push({
    id: "listing-count",
    title: "Listing đang hoạt động",
    value: `${listings.filter((listing) => listing.status === "ACTIVE").length}/${listings.length}`,
    trend: "neutral",
    helperText: "Số lượng listing đã duyệt và đang mở đặt phòng",
  })

  if (averageStayLength) {
    insights.push({
      id: "stay-length",
      title: "Độ dài lưu trú trung bình",
      value: `${averageStayLength.toFixed(1)} đêm`,
      trend: "neutral",
      helperText: "Dựa trên các booking gần đây",
    })
  }

  return insights.slice(0, 4)
}

function buildChecklistItems(
  session: ReturnType<typeof useSession>["data"],
  bookings: BookingRecord[],
  listings: ListingRecord[],
): HostChecklistItem[] {
  const userDetails = session?.user as Record<string, unknown> | undefined
  const phoneValue = typeof userDetails?.phone === "string" ? userDetails.phone : undefined
  const bioValue = typeof userDetails?.bio === "string" ? userDetails.bio : undefined
  const hasProfile = Boolean(phoneValue?.trim() && bioValue?.trim())
  const hasListing = listings.length > 0
  const hasConfirmedBooking = bookings.some((booking) => CONFIRMED_STATUSES.has(booking.status))

  return [
    {
      id: "profile",
      title: "Hoàn thiện hồ sơ host",
      description: "Cập nhật thông tin liên hệ và giới thiệu để tăng tỉ lệ chuyển đổi.",
      status: hasProfile ? "completed" : "pending",
      actionHref: "/host/settings",
      actionLabel: hasProfile ? "Xem lại" : "Cập nhật",
    },
    {
      id: "listing",
      title: "Đăng tải listing đầu tiên",
      description: "Tạo và gửi duyệt listing để bắt đầu nhận booking.",
      status: hasListing ? "completed" : "in_progress",
      actionHref: "/host/listings/new",
      actionLabel: hasListing ? "Quản lý" : "Tạo ngay",
    },
    {
      id: "first-booking",
      title: "Nhận booking đầu tiên",
      description: "Theo dõi bảng điều khiển và phản hồi yêu cầu đặt phòng nhanh chóng.",
      status: hasConfirmedBooking ? "completed" : "pending",
      actionHref: hasConfirmedBooking ? "/host/bookings" : undefined,
      actionLabel: hasConfirmedBooking ? "Xem chi tiết" : undefined,
    },
  ]
}

function addDays(date: Date, amount: number) {
  const cloned = new Date(date)
  cloned.setDate(cloned.getDate() + amount)
  return cloned
}
