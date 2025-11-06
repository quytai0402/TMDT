"use client"

import { useEffect, useMemo, useState } from "react"
import { GuideDashboardLayout } from "@/components/guide-dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { Banknote, Loader2, PiggyBank, RefreshCcw, TrendingUp, Wallet } from "lucide-react"

import type { GuideNavMetrics } from "@/components/guide-dashboard-layout"

type GuideEarningsResponse = {
  summary: {
    lifetimeGross: number
    lifetimeNet: number
    outstandingBalance: number
    last30DaysGross: number
    last30DaysNet: number
    totalBookings: number
    totalPayouts: number
  }
  monthly: Array<{
    month: string
    gross: number
    net: number
    bookingCount: number
  }>
  transactions: Array<{
    id: string
    date: string | null
    status: string
    totalPrice: number | null
    currency: string
    paid: boolean
    experience: { id: string; title: string }
    guest: { id: string; name: string | null; email: string | null }
  }>
  navMetrics: GuideNavMetrics
}

const formatCurrency = (value: number, currency = "VND") =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency, maximumFractionDigits: 0 }).format(value)

const formatDate = (value: string | null) =>
  value ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(new Date(value)) : "--"

const statusBadgeVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  CONFIRMED: "default",
  COMPLETED: "secondary",
  PENDING: "outline",
  CANCELLED: "destructive",
  DECLINED: "destructive",
  EXPIRED: "outline",
}

const statusLabel: Record<string, string> = {
  CONFIRMED: "Đã xác nhận",
  COMPLETED: "Hoàn tất",
  PENDING: "Đang chờ",
  CANCELLED: "Huỷ",
  DECLINED: "Từ chối",
  EXPIRED: "Hết hạn",
}

export default function GuideEarningsPage() {
  const [data, setData] = useState<GuideEarningsResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const loadEarnings = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/guide/earnings", { cache: "no-store" })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: "Không thể tải dữ liệu" }))
        throw new Error(payload.error || "Không thể tải báo cáo doanh thu")
      }
      const payload = (await response.json()) as GuideEarningsResponse
      setData(payload)
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadEarnings()
  }, [])

  const navMetrics = data?.navMetrics

  const averageNetPerBooking = useMemo(() => {
    if (!data) return 0
    if (data.summary.totalBookings === 0) return 0
    return data.summary.lifetimeNet / data.summary.totalBookings
  }, [data])

  const efficiencyPercent = useMemo(() => {
    if (!data || !data.summary.lifetimeGross) return null
    if (data.summary.lifetimeGross === 0) return null
    return Math.round((data.summary.lifetimeNet / data.summary.lifetimeGross) * 100)
  }, [data])

  return (
    <GuideDashboardLayout metrics={navMetrics}>
      <div className="space-y-8">
        <section className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold md:text-4xl">Báo cáo doanh thu</h1>
            <p className="text-sm text-muted-foreground">Theo dõi doanh thu, công nợ và xu hướng tăng trưởng.</p>
          </div>
          <Button variant="outline" onClick={() => void loadEarnings()} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
            Tải lại
          </Button>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Doanh thu tích luỹ (net)</CardTitle>
              <CardDescription className="text-2xl font-semibold text-foreground">
                {formatCurrency(data?.summary.lifetimeNet ?? 0)}
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Doanh thu 30 ngày gần nhất</CardTitle>
              <CardDescription className="text-2xl font-semibold text-foreground">
                {formatCurrency(data?.summary.last30DaysNet ?? 0)}
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Công nợ còn lại</CardTitle>
              <CardDescription className="text-2xl font-semibold text-foreground">
                {formatCurrency(data?.summary.outstandingBalance ?? 0)}
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Giá trị net / booking</CardTitle>
              <CardDescription className="text-2xl font-semibold text-foreground">
                {formatCurrency(averageNetPerBooking)}
              </CardDescription>
            </CardHeader>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Xu hướng 6 tháng gần nhất</CardTitle>
              <CardDescription>Doanh thu gross và net theo từng tháng</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex h-48 items-center justify-center text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : data && data.monthly.length > 0 ? (
                <div className="grid gap-3">
                  {data.monthly.map((item) => (
                    <div key={item.month} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{item.month}</p>
                        <p className="text-xs text-muted-foreground">{item.bookingCount} booking</p>
                      </div>
                      <div className="text-right text-sm">
                        <p>Gross: {formatCurrency(item.gross)}</p>
                        <p className="text-muted-foreground">Net: {formatCurrency(item.net)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Chưa có dữ liệu doanh thu.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tổng quan tài chính</CardTitle>
              <CardDescription>Chỉ số quan trọng bạn cần theo dõi</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span>Gross lifetime</span>
                </div>
                <span className="font-semibold text-foreground">{formatCurrency(data?.summary.lifetimeGross ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <PiggyBank className="h-4 w-4 text-amber-500" />
                  <span>Payouts đã chuyển</span>
                </div>
                <span className="font-semibold text-foreground">{formatCurrency(data?.summary.totalPayouts ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-emerald-500" />
                  <span>Net chưa rút</span>
                </div>
                <span className="font-semibold text-foreground">
                  {formatCurrency((data?.summary.lifetimeNet ?? 0) - (data?.summary.totalPayouts ?? 0))}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-dashed p-3">
                <div className="flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-primary" />
                  <span>Capital efficiency</span>
                </div>
                <span className="font-semibold text-foreground">
                  {typeof efficiencyPercent === "number" ? `${efficiencyPercent}%` : "--"}
                </span>
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <Card>
            <CardHeader>
              <CardTitle>Booking & giao dịch gần đây</CardTitle>
              <CardDescription>Top 40 booking mới nhất dùng để đối soát</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex h-48 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : data && data.transactions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ngày diễn ra</TableHead>
                      <TableHead>Trải nghiệm</TableHead>
                      <TableHead>Khách</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Tổng (gross)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.transactions.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{formatDate(item.date)}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-foreground">{item.experience.title}</p>
                            <p className="text-xs text-muted-foreground">#{item.id.slice(-6)}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            <p>{item.guest.name || item.guest.email || "Ẩn danh"}</p>
                            {item.guest.email ? <p className="text-xs">{item.guest.email}</p> : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusBadgeVariant[item.status] ?? "outline"}>
                            {statusLabel[item.status] ?? item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm font-semibold text-foreground">
                          {item.totalPrice ? formatCurrency(item.totalPrice, item.currency) : "--"}
                          <p className="text-xs text-muted-foreground">{item.paid ? "Đã thanh toán" : "Chưa thanh toán"}</p>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-6 text-center text-sm text-muted-foreground">Chưa có booking nào.</div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </GuideDashboardLayout>
  )
}
