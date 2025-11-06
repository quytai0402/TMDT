"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Loader2, RefreshCw } from "lucide-react"
import {
  addDays,
  differenceInCalendarDays,
  endOfMonth,
  format,
  formatDistanceToNowStrict,
  max,
  min,
  startOfDay,
  startOfMonth,
  subDays,
  subMonths,
} from "date-fns"
import { vi } from "date-fns/locale"

import { HostLayout } from "@/components/host-layout"
import { Button } from "@/components/ui/button"
import { DashboardStats } from "@/components/dashboard-stats"
import { RevenueChart } from "@/components/revenue-chart"
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
  const series: { label: string; revenue: number }[] = []

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

  const insights: HostInsight[] = []

  insights.push({
    id: "booking-pace",
    title: "Booking pace",
    value: `${bookingsLastWeek.length} đặt phòng/7 ngày`,
    trend: (bookingPaceDelta > 0 ? "up" : bookingPaceDelta < 0 ? "down" : "neutral") as HostInsight["trend"],
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
    trend: (revenuePrevWeek === 0 && revenueLastWeek === 0 ? "neutral" : revenueLastWeek >= revenuePrevWeek ? "up" : "down") as HostInsight["trend"],
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
  trend: "neutral" as HostInsight["trend"],
      trendLabel: `Còn ${formatDistanceToNowStrict(nextCheckInDate, { locale: vi })}`,
      helperText: "Chuẩn bị sẵn sàng cho khách tiếp theo",
    })
  }

  insights.push({
    id: "listing-count",
    title: "Listing đang hoạt động",
    value: `${listings.filter((listing) => listing.status === "ACTIVE").length}/${listings.length}`,
  trend: "neutral" as HostInsight["trend"],
    helperText: "Số lượng listing đã duyệt và đang mở đặt phòng",
  })

  return insights.slice(0, 4)
}

export default function HostAnalyticsPage() {
  const { getBookings } = useBooking()
  const { getMyListings } = useListings()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [bookings, setBookings] = useState<BookingRecord[]>([])
  const [listings, setListings] = useState<ListingRecord[]>([])

  const loadAnalytics = useCallback(async () => {
    try {
      setRefreshing(true)
      const [bookingResponse, listingResponse] = await Promise.all([
        getBookings("host"),
        getMyListings(),
      ])

      const bookingsData = Array.isArray(bookingResponse?.bookings)
        ? (bookingResponse.bookings as BookingRecord[])
        : []

      const listingsData = Array.isArray(listingResponse)
        ? (listingResponse as ListingRecord[])
        : Array.isArray((listingResponse as { listings?: unknown })?.listings)
          ? (((listingResponse as { listings?: ListingRecord[] }).listings ?? []) as ListingRecord[])
          : []

      setBookings(bookingsData)
      setListings(listingsData)
    } catch (error) {
      console.error("Failed to load analytics data", error)
      setBookings([])
      setListings([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [getBookings, getMyListings])

  useEffect(() => {
    void loadAnalytics()
  }, [loadAnalytics])

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
  const insights = useMemo(() => buildInsights(bookings, listings), [bookings, listings])

  return (
    <HostLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Phân tích & Thống kê</h1>
            <p className="text-muted-foreground">Tổng hợp dữ liệu booking và hiệu suất thực tế của bạn.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => void loadAnalytics()} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Đang cập nhật" : "Làm mới"}
          </Button>
        </div>

        {loading ? (
          <div className="flex h-[280px] items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            <span>Đang tải dữ liệu phân tích...</span>
          </div>
        ) : (
          <div className="space-y-6">
            <DashboardStats stats={stats} loading={refreshing} />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <RevenueChart data={revenueSeries} loading={refreshing} />
              <HostInsights insights={insights} />
            </div>
          </div>
        )}
      </div>
    </HostLayout>
  )
}
