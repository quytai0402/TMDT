"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  DollarSign,
  Home,
  Loader2,
  Shield,
  TrendingUp,
  Users,
} from "lucide-react"

import { AdminLayout } from "@/components/admin-layout"
import { UserManagement } from "@/components/admin-user-management"
import { ListingModeration } from "@/components/admin-listing-moderation"
import { DisputeResolution } from "@/components/admin-dispute-resolution"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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

export default function AdminDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null)
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [alertStats, setAlertStats] = useState<{ pendingListings: number; openDisputes: number }>({
    pendingListings: 0,
    openDisputes: 0,
  })

  useEffect(() => {
    const controller = new AbortController()

    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)

        const [analyticsRes, listingsRes, usersRes, bookingsRes, pendingListingsRes, disputesRes] =
          await Promise.all([
            fetch("/api/admin/analytics?period=30", { cache: "no-store", signal: controller.signal }),
            fetch("/api/admin/listings?limit=5&page=1&status=all", { cache: "no-store", signal: controller.signal }),
            fetch("/api/admin/users?limit=5&type=all", { cache: "no-store", signal: controller.signal }),
            fetch("/api/admin/bookings?limit=5&page=1", { cache: "no-store", signal: controller.signal }),
            fetch("/api/admin/listings?limit=1&page=1&status=PENDING", { cache: "no-store", signal: controller.signal }),
            fetch("/api/admin/disputes?limit=1&page=1&status=OPEN", { cache: "no-store", signal: controller.signal }),
          ])

        if (!analyticsRes.ok) throw new Error("Không thể tải thống kê")

        const analyticsData: AnalyticsResponse = await analyticsRes.json()
        setAnalytics(analyticsData)

        const recentActivities: ActivityItem[] = []

        if (usersRes.ok) {
          const data = await usersRes.json()
          for (const user of data.users ?? []) {
            recentActivities.push({
              id: `user-${user.id}`,
              type: "user",
              title: user.name || "Tài khoản mới",
              description: `Đăng ký với email ${user.email}`,
              timestamp: user.createdAt,
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
              timestamp: listing.createdAt || listing.updatedAt,
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
              description: `Tổng ${booking.totalPrice?.toLocaleString("vi-VN")}₫ • ${booking.status}`,
              timestamp: booking.createdAt,
            })
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

        const pendingCount = typeof pendingPayload?.pagination?.totalCount === "number" ? pendingPayload.pagination.totalCount : 0
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
    const list: Array<{ title: string; description: string; variant: "warning" | "danger" | "info" }> = []

    if (alertStats.pendingListings > 0) {
      list.push({
        title: `${alertStats.pendingListings.toLocaleString("vi-VN")} listing đang chờ duyệt`,
        description: "Kiểm tra mục Duyệt listing để xử lý các yêu cầu mới.",
        variant: "warning",
      })
    }

    if (alertStats.openDisputes > 0) {
      list.push({
        title: `${alertStats.openDisputes.toLocaleString("vi-VN")} tranh chấp đang mở`,
        description: "Xem chi tiết tại tab Tranh chấp để đảm bảo SLA 24h.",
        variant: "danger",
      })
    }

    if (analytics?.growth.bookings.growth && analytics.growth.bookings.growth > 20) {
      list.push({
        title: "Booking tăng trưởng mạnh",
        description: `Tăng ${analytics.growth.bookings.growth}% trong ${analytics.growth.period} ngày qua.`,
        variant: "info",
      })
    }

    return list
  }, [alertStats, analytics])

  const alertCount = alerts.length

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Bảng điều khiển</h1>
            <p className="text-sm text-muted-foreground">
              Toàn cảnh hiệu suất nền tảng và các tác vụ cần ưu tiên.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-green-100 text-green-700 px-3 py-1">
              <span className="mr-2 inline-flex h-2 w-2 rounded-full bg-green-600" />
              Hệ thống ổn định
            </Badge>
            <Button variant="outline">
              <Shield className="mr-2 h-4 w-4" />
              Cảnh báo ({alertCount})
            </Button>
          </div>
        </div>

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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Tổng người dùng</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">{analytics.overview.totalUsers.toLocaleString("vi-VN")}</div>
                  <p className="text-xs text-muted-foreground">
                    +{analytics.growth.users.new.toLocaleString("vi-VN")} trong {analytics.growth.period} ngày •{" "}
                    {analytics.growth.users.growth.toFixed(1)}%
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Listings hoạt động</CardTitle>
                  <Home className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">{analytics.overview.activeListings.toLocaleString("vi-VN")}</div>
                  <p className="text-xs text-muted-foreground">
                    Tổng {analytics.overview.totalListings.toLocaleString("vi-VN")} listings
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Doanh thu 30 ngày</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">{formatCurrency(analytics.revenue.total)}</div>
                  <p className="text-xs text-muted-foreground">
                    Booking hoàn tất: {analytics.overview.completedBookings.toLocaleString("vi-VN")}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Booking</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">{analytics.overview.totalBookings.toLocaleString("vi-VN")}</div>
                  <p className="text-xs text-muted-foreground">
                    +{analytics.growth.bookings.new.toLocaleString("vi-VN")} • {analytics.growth.bookings.growth.toFixed(1)}%
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Hoạt động gần đây</CardTitle>
                  <CardDescription>Các sự kiện mới nhất từ người dùng, listings và booking</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {activities.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Chưa có hoạt động nào trong 24 giờ qua.</p>
                  ) : (
                    activities.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 rounded-lg border border-muted p-3">
                        <Badge variant="secondary">
                          {activity.type === "user"
                            ? "Người dùng"
                            : activity.type === "listing"
                            ? "Chỗ nghỉ"
                            : "Đặt phòng"}
                        </Badge>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.title}</p>
                          <p className="text-xs text-muted-foreground">{activity.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
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
                  <CardTitle>Cảnh báo hệ thống</CardTitle>
                  <CardDescription>Ưu tiên xử lý các mục sau để đảm bảo SLA.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {alerts.length === 0 ? (
                    <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                      <CheckCircle2 className="h-5 w-5" />
                      <span>Không có cảnh báo nào. Hệ thống đang hoạt động ổn định.</span>
                    </div>
                  ) : (
                    alerts.map((alert, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between rounded-lg border p-3 ${
                          alert.variant === "danger"
                            ? "border-red-200 bg-red-50 text-red-700"
                            : alert.variant === "warning"
                            ? "border-amber-200 bg-amber-50 text-amber-700"
                            : "border-blue-200 bg-blue-50 text-blue-700"
                        }`}
                      >
                        <div>
                          <p className="text-sm font-semibold">{alert.title}</p>
                          <p className="text-xs">{alert.description}</p>
                        </div>
                        <ArrowUpRight className="h-4 w-4" />
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Người dùng
            </TabsTrigger>
            <TabsTrigger value="listings" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Listings
            </TabsTrigger>
            <TabsTrigger value="disputes" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Tranh chấp
            </TabsTrigger>
          </TabsList>
          <TabsContent value="users">
            <UserManagement />
          </TabsContent>
          <TabsContent value="listings">
            <ListingModeration />
          </TabsContent>
          <TabsContent value="disputes">
            <DisputeResolution />
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle>Thao tác nhanh</CardTitle>
            <CardDescription>Đi tới các module quản trị chính</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-5">
              <Button variant="outline" className="h-auto p-4 flex flex-col items-start" onClick={() => router.push("/admin/users")}>
                <Users className="h-5 w-5 mb-2" />
                <span className="font-semibold mb-1">Quản lý người dùng</span>
                <span className="text-xs text-muted-foreground">Phê duyệt host, đặt lại quyền</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-start" onClick={() => router.push("/admin/listings")}>
                <Home className="h-5 w-5 mb-2" />
                <span className="font-semibold mb-1">Danh sách listing</span>
                <span className="text-xs text-muted-foreground">Kiểm duyệt & cập nhật</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-start" onClick={() => router.push("/admin/revenue")}>
                <DollarSign className="h-5 w-5 mb-2" />
                <span className="font-semibold mb-1">Báo cáo doanh thu</span>
                <span className="text-xs text-muted-foreground">Theo dõi hiệu suất tài chính</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-start" onClick={() => router.push("/admin/reports")}>
                <TrendingUp className="h-5 w-5 mb-2" />
                <span className="font-semibold mb-1">Báo cáo nâng cao</span>
                <span className="text-xs text-muted-foreground">Phân tích chuyên sâu</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-start" onClick={() => router.push("/admin/support")}>
                <Shield className="h-5 w-5 mb-2" />
                <span className="font-semibold mb-1">Hỗ trợ trực tuyến</span>
                <span className="text-xs text-muted-foreground">Theo dõi live chat & ticket</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value)
}
