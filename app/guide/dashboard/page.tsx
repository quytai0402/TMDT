"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2, TrendingUp, CalendarDays, Wallet, Star, Users } from "lucide-react"

import { GuideDashboardLayout } from "@/components/guide-dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type GuideDashboardResponse = {
  profile: {
    id: string
    displayName: string
    tagline?: string | null
    status: string
    subscriptionStatus: string
    subscriptionExpires: string | null
    monthlyFee: number
    adminCommissionRate: number
    averageRating: number
    totalReviews: number
  }
  metrics: {
    experiences: number
    pendingBookings: number
    upcomingExperiences: number
    grossRevenue: number
    netRevenue: number
    grossRevenueMonth: number
    netRevenueMonth: number
    monthlyBookings: number
    averageRating: number
    totalReviews: number
    subscriptionStatus: string
    subscriptionExpires: string | null
  }
  experiences: Array<{
    id: string
    title: string
    status: string
    price: number
    currency: string
    averageRating: number
    totalBookings: number
    featured: boolean
    city: string
    createdAt: string
  }>
  bookings: Array<{
    id: string
    status: string
    totalPrice: number
    currency: string
    date: string
    numberOfGuests: number
    experience: {
      id: string
      title: string
    }
    guest: {
      id: string
      name: string | null
      email: string | null
    }
    createdAt: string
  }>
  recentReviews: Array<{
    id: string
    rating: number
    content: string
    createdAt: string
    author: {
      id: string
      name: string | null
    }
    experience: {
      id: string
      title: string
    }
  }>
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value)

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value))

const STATUS_COLORS: Record<string, string> = {
  APPROVED: "bg-emerald-100 text-emerald-700",
  PENDING: "bg-amber-100 text-amber-700",
  REJECTED: "bg-rose-100 text-rose-700",
  NEEDS_REVISION: "bg-amber-100 text-amber-700",
  ACTIVE: "bg-emerald-100 text-emerald-700",
  INACTIVE: "bg-gray-100 text-gray-600",
  PAST_DUE: "bg-amber-100 text-amber-700",
  CANCELLED: "bg-rose-100 text-rose-700",
}

export default function GuideDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<GuideDashboardResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    const load = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/guide/dashboard", {
          cache: "no-store",
          signal: controller.signal,
        })

        if (!response.ok) {
          const payload = await response.json().catch(() => ({ error: "Không thể tải dữ liệu" }))
          throw new Error(payload.error || "Không thể tải dữ liệu")
        }

        const payload = (await response.json()) as GuideDashboardResponse
        setData(payload)
      } catch (err) {
        if ((err as Error).name === "AbortError") return
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }

    void load()
    return () => controller.abort()
  }, [])

  const layoutMetrics = useMemo(() => {
    if (!data) return undefined
    return {
      upcomingExperiences: data.metrics.upcomingExperiences,
      pendingBookings: data.metrics.pendingBookings,
      rating: data.metrics.averageRating,
    }
  }, [data])

  if (loading) {
    return (
      <GuideDashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </GuideDashboardLayout>
    )
  }

  if (error) {
    return (
      <GuideDashboardLayout>
        <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-3 text-center">
          <p className="text-lg font-semibold text-foreground">Không thể tải dữ liệu dashboard</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Thử lại
          </Button>
        </div>
      </GuideDashboardLayout>
    )
  }

  if (!data) {
    return (
      <GuideDashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-sm text-muted-foreground">Không có dữ liệu để hiển thị.</p>
        </div>
      </GuideDashboardLayout>
    )
  }

  const { profile, metrics, experiences, bookings, recentReviews } = data

  return (
    <GuideDashboardLayout metrics={layoutMetrics}>
      <div className="space-y-8">
        <section className="space-y-3">
          <h1 className="font-serif text-3xl font-bold text-foreground md:text-4xl">
            Chào mừng trở lại, {profile.displayName}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={cn("text-xs", STATUS_COLORS[profile.status] ?? "bg-slate-100 text-slate-700")}>Hồ sơ: {profile.status}</Badge>
            <Badge variant="outline" className={cn("text-xs", STATUS_COLORS[profile.subscriptionStatus] ?? "bg-slate-100 text-slate-700")}>Gói: {profile.subscriptionStatus}</Badge>
            <span className="text-sm text-muted-foreground">
              Hoa hồng LuxeStay: {(profile.adminCommissionRate * 100).toFixed(0)}% • Phí thành viên {formatCurrency(profile.monthlyFee)}/tháng
            </span>
          </div>
          {profile.tagline ? <p className="text-sm text-muted-foreground">{profile.tagline}</p> : null}
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Doanh thu tháng</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-foreground">{formatCurrency(metrics.netRevenueMonth)}</div>
              <p className="text-xs text-muted-foreground">Gross {formatCurrency(metrics.grossRevenueMonth)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Booking đang chờ</CardTitle>
              <CalendarDays className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-foreground">{metrics.pendingBookings}</div>
              <p className="text-xs text-muted-foreground">{metrics.monthlyBookings} booking trong tháng</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Rating trung bình</CardTitle>
              <Star className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-foreground">{metrics.averageRating?.toFixed(2) ?? "--"}</div>
              <p className="text-xs text-muted-foreground">{metrics.totalReviews} đánh giá</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Trải nghiệm đang hoạt động</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-foreground">{metrics.experiences}</div>
              <p className="text-xs text-muted-foreground">{metrics.upcomingExperiences} lịch sắp diễn ra</p>
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="border border-primary/10">
            <CardHeader>
              <CardTitle>Lịch sắp diễn ra</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {bookings.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa có lịch nào trong thời gian tới.</p>
              ) : (
                bookings.map((booking) => (
                  <div key={booking.id} className="rounded-xl border border-muted/50 bg-white/70 p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">{booking.experience.title}</h4>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(booking.date)} • {booking.numberOfGuests} khách • {formatCurrency(booking.totalPrice)}
                        </p>
                      </div>
                      <Badge variant="outline" className={cn("text-xs", STATUS_COLORS[booking.status] ?? "bg-slate-100 text-slate-700")}>{booking.status}</Badge>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Khách: {booking.guest.name || booking.guest.email || "Ẩn danh"}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Trải nghiệm nổi bật</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {experiences.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Bạn chưa có trải nghiệm nào. Hãy tạo trải nghiệm đầu tiên để tiếp cận khách hàng!
                  <Button className="mt-3" onClick={() => window.location.assign("/guide/experiences/new")}>Tạo trải nghiệm</Button>
                </div>
              ) : (
                experiences.slice(0, 5).map((experience) => (
                  <div key={experience.id} className="rounded-xl border border-muted/40 bg-white/60 p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">{experience.title}</h4>
                        <p className="text-xs text-muted-foreground">{experience.city} • {formatCurrency(experience.price)} • {experience.totalBookings} booking</p>
                      </div>
                      {experience.featured ? <Badge variant="outline">Featured</Badge> : null}
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <Star className="h-3.5 w-3.5 text-amber-500" /> {experience.averageRating?.toFixed(2) ?? "--"}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Đánh giá mới nhất</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentReviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa có đánh giá nào gần đây.</p>
              ) : (
                recentReviews.slice(0, 4).map((review) => (
                  <div key={review.id} className="rounded-xl border border-muted/40 bg-white/70 p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Star className="h-4 w-4 text-amber-500" /> {review.rating.toFixed(1)}
                      </div>
                      <span className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</span>
                    </div>
                    <p className="mt-2 text-sm text-foreground">{review.content}</p>
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{review.author.name || "Khách LuxeStay"}</span>
                      <span>{review.experience.title}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tổng quan doanh thu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Gross lifetime</span>
                <span className="font-semibold text-foreground">{formatCurrency(metrics.grossRevenue)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Net lifetime (sau phí)</span>
                <span className="font-semibold text-foreground">{formatCurrency(metrics.netRevenue)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Phí LuxeStay (10%)</span>
                <span className="font-semibold text-rose-500">{formatCurrency(metrics.grossRevenue - metrics.netRevenue)}</span>
              </div>
              <div className="mt-4 rounded-lg border border-dashed bg-muted/40 p-4 text-xs">
                <p className="font-semibold text-foreground">Cần hỗ trợ tối ưu doanh thu?</p>
                <p className="mt-2 text-muted-foreground">Liên hệ concierge hoặc Account Manager để được tư vấn chiến lược giá và lịch trình.</p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </GuideDashboardLayout>
  )
}
