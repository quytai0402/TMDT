"use client"

import { useEffect, useMemo, useState } from "react"
import { GuideDashboardLayout } from "@/components/guide-dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import {
  CalendarDays,
  CheckCircle2,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RefreshCcw,
  Timer,
  Users,
} from "lucide-react"

import type { GuideNavMetrics } from "@/components/guide-dashboard-layout"

const statusLabel: Record<string, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã hủy",
  DECLINED: "Bị từ chối",
  EXPIRED: "Hết hạn",
}

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  PENDING: "outline",
  CONFIRMED: "default",
  COMPLETED: "secondary",
  CANCELLED: "destructive",
  DECLINED: "destructive",
  EXPIRED: "outline",
}

const formatCurrency = (value: number, currency = "VND") =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency, maximumFractionDigits: 0 }).format(value)

const formatDate = (value: Date | string | null | undefined) =>
  value ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(new Date(value)) : "--"

type GuideBooking = {
  id: string
  date: string | null
  timeSlot: string | null
  numberOfGuests: number
  status: string
  pricePerPerson: number | null
  totalPrice: number | null
  currency: string
  paid: boolean
  createdAt: string
  updatedAt: string
  experience: {
    id: string
    title: string
    city: string
    image: string | null
  }
  guest: {
    id: string
    name: string | null
    email: string | null
    phone: string | null
    image: string | null
  }
}

type GuideBookingsResponse = {
  bookings: GuideBooking[]
  stats: {
    counts: Record<string, number>
    grossRevenue: number
    netRevenue: number
    outstandingBalance: number
    averageBookingValue: number
    upcomingCount: number
  }
  calendar: Array<{
    id: string
    title: string
    date: string | null
    status: string
    guests: number
    city: string
    timeSlot: string | null
  }>
  navMetrics: GuideNavMetrics
}

export default function GuideBookingsPage() {
  const [data, setData] = useState<GuideBookingsResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const loadBookings = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/guide/bookings", { cache: "no-store" })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: "Không thể tải danh sách" }))
        throw new Error(payload.error || "Không thể tải lịch booking")
      }
      const payload = (await response.json()) as GuideBookingsResponse
      setData(payload)
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadBookings()
  }, [])

  const navMetrics = data?.navMetrics

  const statusSummary = useMemo(() => {
    if (!data) return []
    return Object.entries(data.stats.counts)
      .filter(([status]) => status !== "EXPIRED")
      .map(([status, count]) => ({ status, count }))
  }, [data])

  return (
    <GuideDashboardLayout metrics={navMetrics}>
      <div className="space-y-8">
        <section className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold md:text-4xl">Lịch & Booking</h1>
            <p className="text-sm text-muted-foreground">Theo dõi toàn bộ yêu cầu và lịch trải nghiệm đang mở.</p>
          </div>
          <Button variant="outline" onClick={() => void loadBookings()} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
            Tải lại
          </Button>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Booking đang chờ</CardTitle>
              <CardDescription className="text-2xl font-semibold text-foreground">
                {data?.stats.counts.PENDING ?? 0}
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Lịch sắp diễn ra</CardTitle>
              <CardDescription className="text-2xl font-semibold text-foreground">
                {data?.stats.upcomingCount ?? 0}
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Doanh thu đã xác nhận</CardTitle>
              <CardDescription className="text-2xl font-semibold text-foreground">
                {formatCurrency(data?.stats.netRevenue ?? 0)}
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Công nợ chưa thanh toán</CardTitle>
              <CardDescription className="text-2xl font-semibold text-foreground">
                {formatCurrency(data?.stats.outstandingBalance ?? 0)}
              </CardDescription>
            </CardHeader>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Chi tiết booking</CardTitle>
              <CardDescription>Danh sách booking gần nhất từ khách của bạn</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex h-[300px] items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : data && data.bookings.length > 0 ? (
                <ScrollArea className="h-[420px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Trải nghiệm</TableHead>
                        <TableHead>Ngày diễn ra</TableHead>
                        <TableHead>Khách tham gia</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead className="text-right">Tổng tiền</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.bookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="text-sm font-semibold text-foreground">{booking.experience.title}</p>
                              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                {booking.experience.city}
                              </p>
                              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                <CalendarDays className="h-3 w-3" />
                                Tạo lúc {formatDate(booking.createdAt)}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <p className="font-medium text-foreground">{formatDate(booking.date)}</p>
                              {booking.timeSlot ? <p>{booking.timeSlot}</p> : null}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <p className="flex items-center gap-1">
                                <Users className="h-3 w-3" /> {booking.numberOfGuests} khách
                              </p>
                              <p className="flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" /> {booking.guest.name || booking.guest.email || "Ẩn danh"}
                              </p>
                              {booking.guest.email ? (
                                <p className="flex items-center gap-1 text-xs">
                                  <Mail className="h-3 w-3" /> {booking.guest.email}
                                </p>
                              ) : null}
                              {booking.guest.phone ? (
                                <p className="flex items-center gap-1 text-xs">
                                  <Phone className="h-3 w-3" /> {booking.guest.phone}
                                </p>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusVariant[booking.status] ?? "outline"}>
                              {statusLabel[booking.status] ?? booking.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-sm font-semibold text-foreground">
                            {booking.totalPrice ? formatCurrency(booking.totalPrice, booking.currency) : "--"}
                            <p className="text-xs text-muted-foreground">
                              {booking.paid ? "Đã thanh toán" : "Chưa thanh toán"}
                            </p>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              ) : (
                <div className="flex h-[320px] flex-col items-center justify-center gap-3 text-center text-muted-foreground">
                  <Timer className="h-10 w-10 text-primary" />
                  <div>
                    <p className="font-semibold text-foreground">Chưa có booking nào</p>
                    <p className="text-sm">
                      Khi khách đặt lịch trải nghiệm, chi tiết sẽ hiển thị tại đây để bạn xác nhận và quản lý.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Thống kê nhanh</CardTitle>
              <CardDescription>Trạng thái booking và tiến độ xử lý</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {statusSummary.map((item) => (
                  <div key={item.status} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Badge variant={statusVariant[item.status] ?? "outline"}>{statusLabel[item.status] ?? item.status}</Badge>
                      <span className="text-xs text-muted-foreground">{item.count} booking</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{item.count}</span>
                  </div>
                ))}
              </div>

              <div className="rounded-lg border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">Lưu ý nhắc nhở</p>
                <ul className="mt-2 space-y-2 text-xs">
                  <li>• Xác nhận booking chờ trong vòng 12 giờ để tránh bị hủy tự động.</li>
                  <li>• Cập nhật trạng thái sau mỗi lịch để hệ thống ghi nhận doanh thu.</li>
                  <li>• Đảm bảo khách đã thanh toán trước khi cho trải nghiệm bắt đầu.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <Card>
            <CardHeader>
              <CardTitle>Lịch sắp diễn ra</CardTitle>
              <CardDescription>8 sự kiện gần nhất cần chuẩn bị</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex h-40 items-center justify-center text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : data && data.calendar.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {data.calendar.map((item) => (
                    <div key={item.id} className="rounded-lg border p-4 shadow-sm">
                      <p className="text-sm font-semibold text-foreground">{item.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.city}</p>
                      <p className="mt-2 text-sm">{formatDate(item.date)}</p>
                      {item.timeSlot ? <p className="text-xs text-muted-foreground">{item.timeSlot}</p> : null}
                      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{item.guests} khách</span>
                        <Badge variant={statusVariant[item.status] ?? "outline"}>{statusLabel[item.status] ?? item.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Chưa có lịch nào trong thời gian tới.</p>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </GuideDashboardLayout>
  )
}
