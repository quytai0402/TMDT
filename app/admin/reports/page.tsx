"use client"

import { useEffect, useMemo, useState } from "react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Download, TrendingUp, TrendingDown } from "lucide-react"

import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"

type SummaryResponse = {
  cards: {
    revenue: { current: number; previous: number; growth: number }
    bookings: { current: number; previous: number; growth: number }
    newUsers: { current: number; previous: number; growth: number }
    completionRate: { current: number; previous: number; growth: number }
  }
  revenueSeries: Array<{ label: string; revenue: number; bookings: number }>
  propertyDistribution: Array<{ name: string; value: number }>
}

type FinanceResponse = {
  revenue: {
    total: number
    today: number
    month: number
    commission: number
    todayCommission?: number
    monthCommission?: number
    net: number
  }
  bookings: {
    monthTotal: number
    yearTotal: number
    avgBookingValue: number
    chartByDay: Array<{ day: number; revenue: number }>
    chartByMonth: Array<{ month: number; revenue: number; bookings: number }>
  }
  topListings: Array<{ id: string; title: string; city: string; revenue: number; bookings: number }>
  payoutRequests: Array<{
    id: string
    hostId: string
    amount: number
    requestedAt: string
    status: string
    host: { id: string; name: string | null; email: string | null }
  }>
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8B5CF6", "#EC4899"]

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Math.round(value))

const formatNumber = (value: number) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(Math.round(value))

const formatPercent = (value: number) =>
  `${value > 0 ? "+" : ""}${value.toFixed(1).replace(/\.0$/, "")}%`

export default function AdminReportsPage() {
  const [summary, setSummary] = useState<SummaryResponse | null>(null)
  const [finance, setFinance] = useState<FinanceResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        const [summaryRes, financeRes] = await Promise.all([
          fetch("/api/admin/reports/summary", { cache: "no-store", signal: controller.signal }),
          fetch("/api/admin/finance", { cache: "no-store", signal: controller.signal }),
        ])

        if (!summaryRes.ok) {
          throw new Error("Không thể tải dữ liệu tổng quan")
        }

        if (!financeRes.ok) {
          throw new Error("Không thể tải dữ liệu tài chính")
        }

        const summaryData: SummaryResponse = await summaryRes.json()
        const financeData: FinanceResponse = await financeRes.json()

        setSummary(summaryData)
        setFinance(financeData)
      } catch (err) {
        if ((err as Error).name === "AbortError") return
        console.error("Admin reports error:", err)
        setError((err as Error).message || "Không thể tải dữ liệu báo cáo")
      } finally {
        setLoading(false)
      }
    }

    void loadData()
    return () => controller.abort()
  }, [])

  const revenueChartData = useMemo(() => {
    if (!summary) return []
    return summary.revenueSeries.map((item) => ({
      name: item.label,
      revenue: Math.round(item.revenue),
      bookings: item.bookings,
    }))
  }, [summary])

  const bookingChartData = useMemo(() => {
    if (!finance) return []
    return finance.bookings.chartByMonth.map((item) => ({
      name: `T${item.month}`,
      revenue: Math.round(item.revenue),
      bookings: item.bookings,
    }))
  }, [finance])

  const categoryChartData = useMemo(() => {
    if (!summary) return []
    const total = summary.propertyDistribution.reduce((sum, item) => sum + item.value, 0)
    return summary.propertyDistribution.map((item) => ({
      ...item,
      percent: total > 0 ? (item.value / total) * 100 : 0,
    }))
  }, [summary])

  const statCards = useMemo(() => {
    if (!summary) return []
    return [
      {
        title: "Doanh thu tháng này",
        value: formatCurrency(summary.cards.revenue.current),
        change: summary.cards.revenue.growth,
        positive: summary.cards.revenue.growth >= 0,
      },
      {
        title: "Đặt phòng hoàn tất",
        value: formatNumber(summary.cards.bookings.current),
        change: summary.cards.bookings.growth,
        positive: summary.cards.bookings.growth >= 0,
      },
      {
        title: "Người dùng mới",
        value: formatNumber(summary.cards.newUsers.current),
        change: summary.cards.newUsers.growth,
        positive: summary.cards.newUsers.growth >= 0,
      },
      {
        title: "Tỷ lệ hoàn thành",
        value: `${summary.cards.completionRate.current.toFixed(1)}%`,
        change: summary.cards.completionRate.growth,
        positive: summary.cards.completionRate.growth >= 0,
      },
    ]
  }, [summary])

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
          Đang tải dữ liệu báo cáo...
        </div>
      </AdminLayout>
    )
  }

  if (error || !summary || !finance) {
    return (
      <AdminLayout>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
          <p className="text-muted-foreground">{error || "Không thể tải dữ liệu báo cáo."}</p>
          <Button onClick={() => window.location.reload()}>Thử lại</Button>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Báo cáo & Thống kê</h1>
            <p className="mt-2 text-muted-foreground">Phân tích chi tiết về hoạt động nền tảng</p>
          </div>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Xuất báo cáo
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => (
            <Card key={card.title}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p
                  className={`mt-1 flex items-center gap-1 text-xs ${
                    card.positive ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {card.positive ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {formatPercent(card.change)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="revenue" className="space-y-4">
          <TabsList>
            <TabsTrigger value="revenue">Doanh thu</TabsTrigger>
            <TabsTrigger value="bookings">Đặt phòng</TabsTrigger>
            <TabsTrigger value="categories">Danh mục</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Doanh thu 6 tháng gần đây</CardTitle>
                <CardDescription>Phần trăm dựa trên phí nền tảng thu được</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `${Math.round(value / 1_000_000)}M`} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#6366F1"
                      strokeWidth={2}
                      name="Doanh thu (VNĐ)"
                    />
                    <Line
                      type="monotone"
                      dataKey="bookings"
                      stroke="#22C55E"
                      strokeWidth={2}
                      name="Số booking"
                      yAxisId={1}
                    />
                    <YAxis
                      yAxisId={1}
                      orientation="right"
                      tickFormatter={(value) => `${value}`}
                      allowDecimals={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Số lượng đặt phòng theo tháng</CardTitle>
                <CardDescription>Cập nhật theo 12 tháng gần nhất</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={bookingChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="bookings" fill="#22C55E" name="Booking" />
                    <Bar dataKey="revenue" fill="#6366F1" name="Doanh thu (VNĐ)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Phân bố theo loại hình chỗ nghỉ</CardTitle>
                <CardDescription>Dựa trên các listing đang hoạt động</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      dataKey="value"
                      label={({ name, percent }: { name: string; percent?: number }) =>
                        `${name} ${(percent ?? 0).toFixed(0)}%`
                      }
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string, entry) => [
                        `${value} listing`,
                        name,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Top listing theo doanh thu</CardTitle>
              <CardDescription>6 listing có doanh thu cao nhất năm nay</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {finance.topListings.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa có dữ liệu đủ để thống kê.</p>
              ) : (
                finance.topListings.map((listing) => (
                  <div
                    key={listing.id}
                    className="flex items-center justify-between rounded-lg border border-muted/40 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">{listing.title}</p>
                      <p className="text-xs text-muted-foreground">{listing.city}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-semibold text-foreground">{formatCurrency(listing.revenue)}</p>
                      <p className="text-xs text-muted-foreground">
                        {listing.bookings} booking
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Yêu cầu rút tiền đang chờ</CardTitle>
              <CardDescription>Đang chờ duyệt hoặc thanh toán</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {finance.payoutRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground">Không có yêu cầu nào đang chờ.</p>
              ) : (
                finance.payoutRequests.map((payout) => (
                  <div
                    key={payout.id}
                    className="flex items-center justify-between rounded-lg border border-muted/40 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {payout.host.name || payout.host.email || "Host"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Gửi {new Date(payout.requestedAt).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-semibold text-foreground">{formatCurrency(payout.amount)}</p>
                      <p className="text-xs text-muted-foreground">{payout.status}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
