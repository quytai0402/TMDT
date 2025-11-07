"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowUpRight,
  CheckCircle2,
  DollarSign,
  Home,
  Loader2,
  LogIn,
  Shield,
  TrendingUp,
  Users,
  UserPlus,
  Wallet,
} from "lucide-react"

import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type AnalyticsResponse = {
  overview: {
    totalUsers: number
    totalHosts: number
    totalListings: number
    activeListings: number
    totalBookings: number
    completedBookings: number
    totalRevenue: number
  }
  growth: {
    period: number
    users: { new: number; growth: number }
    listings: { new: number; growth: number }
    bookings: { new: number; growth: number }
  }
  revenue: {
    total: number
    byDay: Array<{ date: string; revenue: number; transactions: number }>
  }
}

type ActivityItem = {
  id: string
  type: "user" | "listing" | "booking"
  title: string
  description: string
  timestamp: string
}

type AdminUser = {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  role?: string | null
  loyaltyPoints?: number | null
  loyaltyTier?: string | null
  createdAt?: string | null
  lastBookingAt?: string | null
  lastCheckIn?: string | null
  lastListingTitle?: string | null
  lastListingCity?: string | null
  bookingsCount?: number | null
  totalSpent?: number | null
  _count?: {
    listings?: number
    bookingsAsGuest?: number
    bookingsAsHost?: number
  }
}

type UserMetrics = {
  totalUsers: number
  hosts: number
  guests: number
  admins: number
  walkInGuests: number
  walkInBookings: number
}

type PayoutSummary = {
  total: number
  pending: { count: number; amount: number }
  approved: { count: number; amount: number }
  paid: { count: number; amount: number }
  rejected: { count: number; amount: number }
}

type AdminPayoutPreview = {
  id: string
  amount: number
  status: "PENDING" | "APPROVED" | "PAID" | "REJECTED"
  requestedAt: string
  host: {
    id: string
    name?: string | null
    email?: string | null
  }
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null)
  const [userMetrics, setUserMetrics] = useState<UserMetrics | null>(null)
  const [recentUsers, setRecentUsers] = useState<AdminUser[]>([])
  const [walkInPreview, setWalkInPreview] = useState<AdminUser[]>([])
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [alertStats, setAlertStats] = useState<{ pendingListings: number; openDisputes: number }>({
    pendingListings: 0,
    openDisputes: 0,
  })
  const [payoutSummary, setPayoutSummary] = useState<PayoutSummary | null>(null)
  const [recentPayouts, setRecentPayouts] = useState<AdminPayoutPreview[]>([])

  useEffect(() => {
    const controller = new AbortController()

    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)

        const [
          analyticsRes,
          listingsRes,
          usersRes,
          bookingsRes,
          pendingListingsRes,
          disputesRes,
          walkInRes,
          payoutsRes,
        ] = await Promise.all([
          fetch("/api/admin/analytics?period=30", { cache: "no-store", signal: controller.signal }),
          fetch("/api/admin/listings?limit=5&page=1&status=all", { cache: "no-store", signal: controller.signal }),
          fetch("/api/admin/users?limit=8&type=all&metrics=true", { cache: "no-store", signal: controller.signal }),
          fetch("/api/admin/bookings?limit=8&page=1", { cache: "no-store", signal: controller.signal }),
          fetch("/api/admin/listings?limit=1&page=1&status=PENDING", { cache: "no-store", signal: controller.signal }),
          fetch("/api/admin/disputes?limit=1&page=1&status=OPEN", { cache: "no-store", signal: controller.signal }),
          fetch("/api/admin/users?limit=4&type=walkin", { cache: "no-store", signal: controller.signal }),
          fetch("/api/admin/payouts?summary=true", { cache: "no-store", signal: controller.signal }),
        ])

        if (!analyticsRes.ok) throw new Error("Không thể tải thống kê")

        const analyticsData: AnalyticsResponse = await analyticsRes.json()
        setAnalytics(analyticsData)

        const recentActivities: ActivityItem[] = []

        if (usersRes.ok) {
          const data = await usersRes.json()
          const users: AdminUser[] = Array.isArray(data.users) ? data.users : []
          setRecentUsers(users)
          if (data.metrics) {
            setUserMetrics({
              totalUsers: data.metrics.totalUsers ?? 0,
              hosts: data.metrics.hosts ?? 0,
              guests: data.metrics.guests ?? 0,
              admins: data.metrics.admins ?? 0,
              walkInGuests: data.metrics.walkInGuests ?? 0,
              walkInBookings: data.metrics.walkInBookings ?? 0,
            })
          }

          for (const user of users.slice(0, 5)) {
            recentActivities.push({
              id: `user-${user.id}`,
              type: "user",
              title: user.name || "Tài khoản mới",
              description: `Đăng ký với email ${user.email}`,
              timestamp: user.createdAt ?? new Date().toISOString(),
            })
          }
        }

        if (listingsRes.ok) {
          const data = await listingsRes.json()
          for (const listing of data.listings ?? []) {
            recentActivities.push({
              id: `listing-${listing.id}`,
              type: "listing",
              title: listing.title,
              description: `Host ${listing.host?.name || "không rõ"} • ${listing.status}`,
              timestamp: listing.createdAt || listing.updatedAt || new Date().toISOString(),
            })
          }
        }

        if (bookingsRes.ok) {
          const data = await bookingsRes.json()
          for (const booking of data.bookings ?? []) {
            recentActivities.push({
              id: `booking-${booking.id}`,
              type: "booking",
              title: booking.listing?.title || "Đặt phòng mới",
              description: `Tổng ${formatCurrency(Number(booking.totalPrice) || 0)} • ${booking.status}`,
              timestamp: booking.createdAt || new Date().toISOString(),
            })
          }
        }

        if (walkInRes.ok) {
          const walkInData = await walkInRes.json()
          setWalkInPreview(Array.isArray(walkInData.users) ? walkInData.users : [])
        }

        if (payoutsRes.ok) {
          const payoutData = await payoutsRes.json()
          if (payoutData?.summary) {
            setPayoutSummary(payoutData.summary as PayoutSummary)
          }
          if (Array.isArray(payoutData?.latest)) {
            setRecentPayouts(payoutData.latest as AdminPayoutPreview[])
          }
        }

        recentActivities.sort((a, b) => {
          const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0
          const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0
          return dateB - dateA
        })
        setActivities(recentActivities.slice(0, 8))

        const pendingPayload = pendingListingsRes.ok ? await pendingListingsRes.json() : null
        const disputesPayload = disputesRes.ok ? await disputesRes.json() : null

        const pendingCount =
          typeof pendingPayload?.pagination?.totalCount === "number"
            ? pendingPayload.pagination.totalCount
            : 0
        const disputesCount =
          typeof disputesPayload?.pagination?.total === "number"
            ? disputesPayload.pagination.total
            : typeof disputesPayload?.pagination?.totalCount === "number"
              ? disputesPayload.pagination.totalCount
              : 0

        setAlertStats({
          pendingListings: pendingCount,
          openDisputes: disputesCount,
        })
      } catch (err) {
        if ((err as Error).name === "AbortError") return
        console.error("Failed to load admin dashboard:", err)
        setError("Không thể tải dữ liệu dashboard. Vui lòng thử lại sau.")
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
    return () => controller.abort()
  }, [])

  const alerts = useMemo(() => {
    const list: Array<{ title: string; description: string; tone: "info" | "warning" | "danger" }> = []

    if (alertStats.pendingListings > 0) {
      list.push({
        title: `${formatNumber(alertStats.pendingListings)} listing đang chờ duyệt`,
        description: "Kiểm tra mục Duyệt listing để xử lý các yêu cầu mới.",
        tone: "warning",
      })
    }

    if (alertStats.openDisputes > 0) {
      list.push({
        title: `${formatNumber(alertStats.openDisputes)} tranh chấp đang mở`,
        description: "Xem chi tiết tại module Tranh chấp để đảm bảo SLA 24h.",
        tone: "danger",
      })
    }

    if (analytics?.growth.bookings.growth && analytics.growth.bookings.growth > 20) {
      list.push({
        title: "Booking tăng trưởng mạnh",
        description: `Tăng ${formatPercent(analytics.growth.bookings.growth)} trong ${analytics.growth.period} ngày qua.`,
        tone: "info",
      })
    }

    return list
  }, [alertStats, analytics])

  const statCards = useMemo(() => {
    if (!analytics) return []

    return [
      {
        title: "Tổng người dùng",
        value: formatNumber(analytics.overview.totalUsers),
        hint: `+${formatNumber(analytics.growth.users.new)} trong ${analytics.growth.period} ngày • ${formatPercent(analytics.growth.users.growth)}`,
        icon: Users,
        accent: "from-primary/10 via-primary/5 to-white text-primary-700 border-primary/20",
      },
      {
        title: "Listings hoạt động",
        value: formatNumber(analytics.overview.activeListings),
        hint: `Tổng ${formatNumber(analytics.overview.totalListings)} listings`,
        icon: Home,
        accent: "from-emerald-100/50 via-white to-white text-emerald-700 border-emerald-200/60",
      },
      {
        title: "Doanh thu 30 ngày",
        value: formatCurrency(analytics.revenue.total),
        hint: `Booking hoàn tất: ${formatNumber(analytics.overview.completedBookings)}`,
        icon: DollarSign,
        accent: "from-amber-100/60 via-white to-white text-amber-700 border-amber-200/70",
      },
      {
        title: "Tổng booking",
        value: formatNumber(analytics.overview.totalBookings),
        hint: `+${formatNumber(analytics.growth.bookings.new)} • ${formatPercent(analytics.growth.bookings.growth)}`,
        icon: TrendingUp,
        accent: "from-sky-100/60 via-white to-white text-sky-700 border-sky-200/70",
      },
    ]
  }, [analytics])

  const userSegments = useMemo(() => {
    if (!userMetrics) return []
    return [
      {
        label: "Khách đăng ký",
        value: userMetrics.guests,
        descriptor: "Tài khoản",
        badgeClass: "bg-sky-100 text-sky-700",
        action: () => router.push("/admin/users?type=guest"),
      },
      {
        label: "Chủ nhà",
        value: userMetrics.hosts,
        descriptor: "Đối tác",
        badgeClass: "bg-emerald-100 text-emerald-700",
        action: () => router.push("/admin/users?type=host"),
      },
      {
        label: "Quản trị",
        value: userMetrics.admins,
        descriptor: "Nhân sự",
        badgeClass: "bg-purple-100 text-purple-700",
        action: () => router.push("/admin/users?type=admin"),
      },
      {
        label: "Khách vãng lai",
        value: userMetrics.walkInGuests,
        descriptor: `${formatNumber(userMetrics.walkInBookings)} lượt đặt`,
        badgeClass: "bg-orange-100 text-orange-700",
        action: () => router.push("/admin/users?type=walkin"),
      },
    ]
  }, [router, userMetrics])

  return (
    <AdminLayout>
      <div className="space-y-8">
        <section className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">Bảng điều khiển</p>
              <h1 className="text-3xl font-bold text-primary-900 md:text-4xl">Toàn cảnh hoạt động LuxeStay</h1>
              <p className="text-sm text-primary-700/80 md:text-base">
                {analytics
                  ? `30 ngày qua ghi nhận ${formatNumber(analytics.overview.totalBookings)} booking, doanh thu ${formatCurrency(
                      analytics.revenue.total,
                    )}, ${formatNumber(analytics.growth.users.new)} thành viên mới.`
                  : "Theo dõi booking, doanh thu và thành viên mới nhất."}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="flex items-center gap-2 rounded-full bg-green-100 px-4 py-1 text-green-700">
                <span className="inline-flex h-2 w-2 rounded-full bg-green-500" />
                Hệ thống ổn định
              </Badge>
              <Button variant="outline" onClick={() => router.push("/admin/security")}>
                <Shield className="mr-2 h-4 w-4" />
                Trung tâm cảnh báo
              </Button>
            </div>
          </div>
        </section>

        {error ? (
          <Card>
            <CardHeader>
              <CardTitle>Lỗi tải dữ liệu</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => window.location.reload()} variant="outline">
                Thử lại
              </Button>
            </CardContent>
          </Card>
        ) : loading || !analytics ? (
          <Card>
            <CardContent className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {statCards.map((card) => {
                const Icon = card.icon
                return (
                  <Card key={card.title} className={`overflow-hidden border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md`}>
                    <CardContent className="relative space-y-4 p-6">
                      <div className={`absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br ${card.accent}`} />
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{card.title}</p>
                          <p className="text-3xl font-bold text-foreground">{card.value}</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/70 shadow-inner">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{card.hint}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </section>

            <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
              <Card>
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle>Phân bổ người dùng</CardTitle>
                    <CardDescription>Nhấp để mở module quản lý tương ứng.</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => router.push("/admin/users")}>
                    Xem tất cả <ArrowUpRight className="ml-1 h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  {userSegments.length ? (
                    userSegments.map((segment) => (
                      <button
                        key={segment.label}
                        onClick={segment.action}
                        className="flex flex-col items-start gap-2 rounded-xl border border-muted bg-muted/40 p-4 text-left transition hover:border-primary/40 hover:bg-primary/5"
                      >
                        <Badge variant="outline" className={`border-transparent ${segment.badgeClass}`}>
                          {segment.label}
                        </Badge>
                        <div className="text-2xl font-semibold text-foreground">
                          {formatNumber(segment.value)}
                        </div>
                        <p className="text-xs text-muted-foreground">{segment.descriptor}</p>
                      </button>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Chưa có dữ liệu người dùng.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cảnh báo nhanh</CardTitle>
                  <CardDescription>Ưu tiên xử lý để đảm bảo SLA.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {alerts.length === 0 ? (
                    <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                      <CheckCircle2 className="h-5 w-5" />
                      <span>Không có cảnh báo. Toàn bộ hệ thống ổn định.</span>
                    </div>
                  ) : (
                    alerts.map((alert, index) => (
                      <div
                        key={index}
                        className={`flex items-start justify-between gap-3 rounded-lg border p-3 text-sm ${
                          alert.tone === "danger"
                            ? "border-red-200 bg-red-50 text-red-700"
                            : alert.tone === "warning"
                              ? "border-amber-200 bg-amber-50 text-amber-700"
                              : "border-blue-200 bg-blue-50 text-blue-700"
                        }`}
                      >
                        <div>
                          <p className="font-semibold">{alert.title}</p>
                          <p className="text-xs">{alert.description}</p>
                        </div>
                        <ArrowUpRight className="mt-1 h-4 w-4 flex-shrink-0" />
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
              <Card>
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle>Yêu cầu rút tiền</CardTitle>
                    <CardDescription>Tổng quan trạng thái theo thời gian thực.</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => router.push("/admin/payouts")}>
                    Quản lý <ArrowUpRight className="ml-1 h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      { label: "Chờ duyệt", data: payoutSummary?.pending, tone: "text-amber-600", border: "border-amber-200 bg-amber-50/60" },
                      { label: "Đã duyệt", data: payoutSummary?.approved, tone: "text-blue-600", border: "border-blue-200 bg-blue-50/60" },
                      { label: "Đã thanh toán", data: payoutSummary?.paid, tone: "text-emerald-600", border: "border-emerald-200 bg-emerald-50/60" },
                      { label: "Từ chối", data: payoutSummary?.rejected, tone: "text-red-600", border: "border-red-200 bg-red-50/70" },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className={`rounded-xl border px-4 py-3 ${item.border} flex flex-col gap-1`}
                      >
                        <p className="text-xs font-semibold text-muted-foreground">{item.label}</p>
                        <p className={`text-2xl font-bold ${item.tone}`}>
                          {formatNumber(item.data?.count ?? 0)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ≈ {formatCurrency(item.data?.amount ?? 0)}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary shadow-inner">
                        <Wallet className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Đang chờ giải ngân</p>
                        <p className="text-lg font-semibold text-primary">
                          {formatCurrency(payoutSummary?.pending.amount ?? 0)}
                        </p>
                      </div>
                      <div className="ml-auto">
                        <p className="text-xs text-muted-foreground">Đã chi trả</p>
                        <p className="text-base font-semibold text-emerald-600">
                          {formatCurrency(payoutSummary?.paid.amount ?? 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle>Yêu cầu gần nhất</CardTitle>
                    <CardDescription>4 giao dịch mới nhất từ host & hướng dẫn viên.</CardDescription>
                  </div>
                  <Badge variant="outline" className="border-muted text-muted-foreground">
                    Tổng {formatNumber(payoutSummary?.total ?? 0)}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recentPayouts.slice(0, 4).map((payout) => (
                    <div
                      key={payout.id}
                      className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-white/80 p-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {payout.host.name || payout.host.email || "Host không tên"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(payout.requestedAt).toLocaleString("vi-VN")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">{formatCurrency(payout.amount)}</p>
                        <Badge
                          variant="outline"
                          className={
                            payout.status === "PENDING"
                              ? "border-amber-200 bg-amber-50 text-amber-700"
                              : payout.status === "APPROVED"
                                ? "border-blue-200 bg-blue-50 text-blue-700"
                                : payout.status === "PAID"
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : "border-red-200 bg-red-50 text-red-700"
                          }
                        >
                          {payout.status === "PENDING"
                            ? "Chờ duyệt"
                            : payout.status === "APPROVED"
                              ? "Đã duyệt"
                              : payout.status === "PAID"
                                ? "Đã thanh toán"
                                : "Từ chối"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {recentPayouts.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Chưa có yêu cầu nào.</p>
                  ) : null}
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle>Thành viên mới</CardTitle>
                    <CardDescription>4 tài khoản đăng ký gần nhất.</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => router.push("/admin/users?sort=newest")}>
                    Quản lý <ArrowUpRight className="ml-1 h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentUsers.slice(0, 4).map((user) => {
                    const initials = user.name?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? "U"
                    const bookings =
                      (user._count?.bookingsAsGuest ?? 0) + (user._count?.bookingsAsHost ?? 0)
                    return (
                      <div
                        key={user.id}
                        className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-white p-4 shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.image || undefined} />
                            <AvatarFallback>{initials}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{user.name || "Chưa đặt tên"}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                              {user.loyaltyTier ? (
                                <Badge variant="outline" className="border-purple-200 bg-purple-50 text-purple-700">
                                  {user.loyaltyTier} · {formatNumber(user.loyaltyPoints ?? 0)} điểm
                                </Badge>
                              ) : null}
                              <span>Gia nhập: {user.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN") : "—"}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          <p className="font-semibold text-foreground">{formatNumber(bookings)} bookings</p>
                          <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/users?search=${encodeURIComponent(user.email || "")}`)}>
                            Xem
                            <ArrowUpRight className="ml-1 h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                  {recentUsers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Chưa có thành viên mới.</p>
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle>Khách vãng lai nổi bật</CardTitle>
                    <CardDescription>
                      Theo dõi khách đặt phòng trực tiếp để đề xuất đăng ký tài khoản.
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => router.push("/admin/users?type=walkin")}>
                    Danh sách <ArrowUpRight className="ml-1 h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {walkInPreview.length ? (
                    walkInPreview.map((guest) => (
                      <div key={guest.id} className="flex items-start justify-between gap-4 rounded-xl border border-orange-200/60 bg-orange-50/40 p-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="border-orange-200 bg-orange-100 text-orange-700">
                              Khách vãng lai
                            </Badge>
                            <span className="text-sm font-semibold text-foreground">
                              {guest.name || "Khách không tên"}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {guest.lastListingTitle
                              ? `${guest.lastListingTitle}${guest.lastListingCity ? ` • ${guest.lastListingCity}` : ""}`
                              : "Chưa có thông tin chỗ nghỉ"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Lần gần nhất:{" "}
                            {guest.lastCheckIn
                              ? new Date(guest.lastCheckIn).toLocaleDateString("vi-VN")
                              : guest.lastBookingAt
                                ? new Date(guest.lastBookingAt).toLocaleDateString("vi-VN")
                                : "—"}
                          </p>
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          <p className="font-semibold text-foreground">
                            {formatCurrency(guest.totalSpent ?? 0)}
                          </p>
                          <p>{formatNumber(guest.bookingsCount ?? 0)} lượt đặt</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-1 text-orange-600"
                            onClick={() => router.push("/admin/bookings?filter=walkin")}
                          >
                            Liên hệ
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-3 rounded-lg border border-dashed border-orange-200 p-4 text-sm text-muted-foreground">
                      <LogIn className="h-4 w-4 text-orange-500" />
                      Chưa ghi nhận đặt phòng vãng lai gần đây.
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
              <Card className="h-full">
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle>Hoạt động gần đây</CardTitle>
                    <CardDescription>Các sự kiện nổi bật từ booking, listing và thành viên.</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => router.push("/admin/reports")}>
                    Nhật ký hệ thống <ArrowUpRight className="ml-1 h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {activities.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Chưa có hoạt động mới trong 24 giờ qua.</p>
                  ) : (
                    activities.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/30 p-3 transition hover:border-primary/40"
                      >
                        <Badge variant="outline" className="flex-shrink-0 border-transparent bg-white/80 text-muted-foreground">
                          {activity.type === "user"
                            ? "Người dùng"
                            : activity.type === "listing"
                              ? "Chỗ nghỉ"
                              : "Đặt phòng"}
                        </Badge>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{activity.title}</p>
                          <p className="text-xs text-muted-foreground">{activity.description}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {activity.timestamp ? new Date(activity.timestamp).toLocaleString("vi-VN") : "—"}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tác vụ vận hành</CardTitle>
                  <CardDescription>Các module được sử dụng thường xuyên.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  {quickActions.map((action) => (
                    <button
                      key={action.label}
                      onClick={() => router.push(action.href)}
                      className="flex items-center justify-between gap-3 rounded-xl border border-muted bg-white px-4 py-3 text-left transition hover:border-primary/50 hover:bg-primary/5"
                    >
                      <div>
                        <p className="text-sm font-semibold text-foreground">{action.label}</p>
                        <p className="text-xs text-muted-foreground">{action.description}</p>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
                </CardContent>
              </Card>
            </section>
          </>
        )}
      </div>
    </AdminLayout>
  )
}

const quickActions = [
  {
    label: "Quản lý người dùng",
    description: "Phê duyệt host, đặt lại quyền",
    href: "/admin/users",
  },
  {
    label: "Danh sách listing",
    description: "Kiểm duyệt & cập nhật chỗ nghỉ",
    href: "/admin/listings",
  },
  {
    label: "Đặt phòng & dịch vụ",
    description: "Theo dõi booking và dịch vụ bổ sung",
    href: "/admin/bookings",
  },
  {
    label: "Doanh thu & báo cáo",
    description: "Xem hiệu suất tài chính toàn nền tảng",
    href: "/admin/revenue",
  },
  {
    label: "Cài đặt hệ thống",
    description: "Tùy chỉnh thông tin, thông báo, thanh toán",
    href: "/admin/settings",
  },
]

function formatNumber(value?: number | null) {
  if (!value) return "0"
  return new Intl.NumberFormat("vi-VN").format(value)
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value)
}

function formatPercent(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) return "0%"
  const sign = value > 0 ? "+" : ""
  return `${sign}${value.toFixed(1)}%`
}
