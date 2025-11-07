"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RefreshCcw,
  Search,
  Users,
  XCircle,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"

import { formatTransferReference } from "@/lib/payments"

type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "DECLINED" | "EXPIRED"

type ProviderInfo = {
  id: string
  name: string | null
  email: string | null
}

type GuideProfileInfo = {
  id: string
  userId: string
  displayName: string | null
  user: ProviderInfo | null
}

type MembershipPlanInfo = {
  id: string
  slug: string
  name: string
}

type ExperienceInfo = {
  id: string
  title: string
  city: string | null
  state: string | null
  image: string | null
  hostId: string | null
  host: ProviderInfo | null
  guideProfile: GuideProfileInfo | null
}

type GuestInfo = {
  id: string
  name: string | null
  email: string | null
  phone: string | null
}

type AdminGuideServiceBooking = {
  id: string
  experienceId: string
  guestId: string
  date: string | null
  timeSlot: string | null
  numberOfGuests: number
  pricePerPerson: number
  totalPrice: number
  currency: string
  discountRate: number
  discountAmount: number
  status: BookingStatus
  paid: boolean
  createdAt: string
  updatedAt: string
  referenceCode: string
  membershipPlan: MembershipPlanInfo | null
  membershipPlanSnapshot: unknown
  experience: ExperienceInfo | null
  guest: GuestInfo | null
}

type SummaryResponse = {
  total: number
  counts: Record<BookingStatus, number>
  grossRevenue: number
  outstanding: number
  paidCount: number
}

type Pagination = {
  page: number
  limit: number
  totalCount: number
  totalPages: number
}

type GuideServicesResponse = {
  bookings: AdminGuideServiceBooking[]
  pagination: Pagination
  summary: SummaryResponse
}

const STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  CANCELLED: "Đã hủy",
  COMPLETED: "Hoàn tất",
  DECLINED: "Từ chối",
  EXPIRED: "Quá hạn",
}

const STATUS_BADGE_VARIANT: Record<BookingStatus, "default" | "secondary" | "outline" | "destructive"> = {
  PENDING: "outline",
  CONFIRMED: "default",
  CANCELLED: "destructive",
  COMPLETED: "secondary",
  DECLINED: "destructive",
  EXPIRED: "outline",
}

type StatusAction = {
  label: string
  target: BookingStatus
  variant?: "default" | "secondary" | "outline" | "destructive"
}

const STATUS_ACTIONS: Record<BookingStatus, StatusAction[]> = {
  PENDING: [
    { label: "Xác nhận", target: "CONFIRMED" },
    { label: "Từ chối", target: "DECLINED", variant: "outline" },
  ],
  CONFIRMED: [
    { label: "Hoàn tất", target: "COMPLETED" },
    { label: "Hủy", target: "CANCELLED", variant: "secondary" },
  ],
  COMPLETED: [
    { label: "Khôi phục xác nhận", target: "CONFIRMED", variant: "outline" },
  ],
  CANCELLED: [
    { label: "Mở lại", target: "PENDING", variant: "outline" },
  ],
  DECLINED: [
    { label: "Mở lại", target: "PENDING", variant: "outline" },
  ],
  EXPIRED: [
    { label: "Khôi phục", target: "PENDING", variant: "outline" },
  ],
}

const getMembershipPlanName = (booking: AdminGuideServiceBooking) => {
  if (booking.membershipPlan?.name) {
    return booking.membershipPlan.name
  }

  if (booking.membershipPlanSnapshot && typeof booking.membershipPlanSnapshot === "object") {
    const snapshot = booking.membershipPlanSnapshot as { name?: unknown }
    if (typeof snapshot.name === "string" && snapshot.name.trim().length > 0) {
      return snapshot.name
    }
  }

  return null
}

const formatCurrency = (value: number, currency = "VND") =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "VND" ? 0 : 2,
  }).format(value)

const formatDate = (value: string | null) =>
  value ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(new Date(value)) : "--"

const formatDateTime = (value: string | null) =>
  value ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "--"

const formatReference = (id: string) => formatTransferReference("EXPERIENCE", id.slice(-8).toUpperCase())

const STATUS_FILTERS: Array<{ label: string; value: BookingStatus | "ALL" }> = [
  { label: "Tất cả", value: "ALL" },
  { label: STATUS_LABELS.PENDING, value: "PENDING" },
  { label: STATUS_LABELS.CONFIRMED, value: "CONFIRMED" },
  { label: STATUS_LABELS.COMPLETED, value: "COMPLETED" },
  { label: STATUS_LABELS.CANCELLED, value: "CANCELLED" },
  { label: STATUS_LABELS.DECLINED, value: "DECLINED" },
  { label: STATUS_LABELS.EXPIRED, value: "EXPIRED" },
]

export function AdminGuideServicesDashboard() {
  const [bookings, setBookings] = useState<AdminGuideServiceBooking[]>([])
  const [summary, setSummary] = useState<SummaryResponse | null>(null)
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "ALL">("PENDING")
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [rowLoading, setRowLoading] = useState<Record<string, boolean>>({})

  const page = pagination?.page ?? 1
  const totalPages = pagination?.totalPages ?? 1

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(searchTerm.trim()), 400)
    return () => window.clearTimeout(timeout)
  }, [searchTerm])

  const loadBookings = useCallback(async (pageParam = 1) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ limit: "25", page: pageParam.toString() })
      if (statusFilter !== "ALL") {
        params.set("status", statusFilter)
      }
      if (debouncedSearch) {
        params.set("search", debouncedSearch)
      }

      const response = await fetch(`/api/admin/guide-services?${params.toString()}`, {
        cache: "no-store",
        credentials: "include",
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: "Không thể tải danh sách" }))
        if (response.status === 401) {
          throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để truy cập trang quản trị.")
        }
        if (response.status === 403) {
          throw new Error("Tài khoản của bạn không có quyền xem mục Dịch vụ HDV.")
        }
        throw new Error(payload.error || "Không thể tải danh sách booking trải nghiệm")
      }

      const payload = (await response.json()) as GuideServicesResponse
      setBookings(Array.isArray(payload.bookings) ? payload.bookings : [])
      setSummary(payload.summary)
      setPagination(payload.pagination)
    } catch (error) {
      console.error("Load guide services failed:", error)
      toast.error((error as Error).message)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, debouncedSearch])

  useEffect(() => {
    void loadBookings(1)
  }, [loadBookings])

  const refresh = useCallback(() => {
    void loadBookings(page)
  }, [loadBookings, page])

  const updateStatus = async (bookingId: string, nextStatus: BookingStatus) => {
    setRowLoading((prev) => ({ ...prev, [bookingId]: true }))
    try {
      const response = await fetch("/api/admin/guide-services", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, status: nextStatus }),
        credentials: "include",
      })

      const payload = await response.json().catch(() => ({ error: "Không thể cập nhật booking" }))
      if (!response.ok) {
        throw new Error(payload.error || "Không thể cập nhật trạng thái booking")
      }

      toast.success("Đã cập nhật trạng thái booking")
      void loadBookings(page)
    } catch (error) {
      console.error("Update booking status failed:", error)
      toast.error((error as Error).message)
    } finally {
      setRowLoading((prev) => ({ ...prev, [bookingId]: false }))
    }
  }

  const togglePaid = async (bookingId: string, paid: boolean) => {
    setRowLoading((prev) => ({ ...prev, [bookingId]: true }))
    try {
      const response = await fetch("/api/admin/guide-services", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, paid }),
        credentials: "include",
      })

      const payload = await response.json().catch(() => ({ error: "Không thể cập nhật thanh toán" }))
      if (!response.ok) {
        throw new Error(payload.error || "Không thể cập nhật trạng thái thanh toán")
      }

      toast.success(paid ? "Đã đánh dấu đã thanh toán" : "Đã bỏ đánh dấu thanh toán")
      void loadBookings(page)
    } catch (error) {
      console.error("Update payment status failed:", error)
      toast.error((error as Error).message)
    } finally {
      setRowLoading((prev) => ({ ...prev, [bookingId]: false }))
    }
  }

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 1 || pagination && nextPage > pagination.totalPages) return
    void loadBookings(nextPage)
  }

  const summaryCards = useMemo(() => {
    if (!summary) return []
    const pending = summary.counts?.PENDING ?? 0
    const confirmed = summary.counts?.CONFIRMED ?? 0
    const completed = summary.counts?.COMPLETED ?? 0
    const outstanding = summary.outstanding ?? 0
    const gross = summary.grossRevenue ?? 0
    const paidCount = summary.paidCount ?? 0

    return [
      {
        title: "Booking chờ xử lý",
        value: pending.toLocaleString("vi-VN"),
        description: "Cần admin xác nhận",
        icon: Clock,
      },
      {
        title: "Booking đã xác nhận",
        value: confirmed.toLocaleString("vi-VN"),
        description: "Đang chờ thực hiện",
        icon: CheckCircle2,
      },
      {
        title: "Đã thanh toán",
        value: paidCount.toLocaleString("vi-VN"),
        description: "Booking đã ghi nhận chi trả",
        icon: CheckCircle2,
      },
      {
        title: "Công nợ chưa chi",
        value: formatCurrency(outstanding, "VND"),
        description: "Cần chuyển cho HDV",
        icon: XCircle,
      },
      {
        title: "Doanh thu gộp",
        value: formatCurrency(gross, "VND"),
        description: "Tổng giá trị booking",
        icon: Users,
      },
      {
        title: "Tổng booking",
        value: summary.total.toLocaleString("vi-VN"),
        description: "Theo bộ lọc hiện tại",
        icon: CalendarDays,
      },
    ]
  }, [summary])

  const isRowLoading = (bookingId: string) => Boolean(rowLoading[bookingId])

  return (
    <Card className="border-muted/60">
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Dịch vụ HDV</CardTitle>
            <CardDescription>
              Theo dõi và xử lý booking trải nghiệm từ khách hàng. Đánh dấu thanh toán để HDV có thể rút tiền.
            </CardDescription>
          </div>
          <Button variant="outline" onClick={refresh} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
            Tải lại
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {summaryCards.map((card, index) => {
            const Icon = card.icon
            return (
              <div key={index} className="rounded-lg border border-muted/60 bg-muted/20 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                    <p className="text-2xl font-semibold text-foreground">{card.value}</p>
                  </div>
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{card.description}</p>
              </div>
            )
          })}
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Select value={statusFilter} onValueChange={(value: BookingStatus | "ALL") => setStatusFilter(value)}>
            <SelectTrigger className="w-full md:w-60">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTERS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Tìm khách, trải nghiệm hoặc mã booking"
              className="pl-10"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-muted/40">
          {loading ? (
            <div className="flex h-48 items-center justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
              <Clock className="h-6 w-6" />
              <p>Không có booking nào phù hợp với bộ lọc hiện tại.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trải nghiệm</TableHead>
                  <TableHead>Khách</TableHead>
                  <TableHead>Lịch trình</TableHead>
                  <TableHead>Thanh toán</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="w-[180px] text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => {
                  const membershipPlanName = getMembershipPlanName(booking)
                  const hasDiscount = booking.discountAmount > 0 && booking.discountRate > 0

                  return (
                    <TableRow key={booking.id} className={isRowLoading(booking.id) ? "opacity-60" : undefined}>
                    <TableCell className="align-top">
                      <div className="space-y-1">
                        <p className="font-semibold text-foreground">{booking.experience?.title ?? "—"}</p>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {booking.experience?.city || "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Mã tham chiếu: <span className="font-medium text-foreground">{booking.referenceCode || formatReference(booking.id)}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          HDV: {booking.experience?.guideProfile?.displayName || booking.experience?.host?.name || "Chưa cập nhật"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <p className="flex items-center gap-1 text-sm font-medium text-foreground">
                          <Users className="h-3 w-3" /> {booking.guest?.name || booking.guest?.email || "Khách LuxeStay"}
                        </p>
                        {booking.guest?.email ? (
                          <p className="flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {booking.guest.email}
                          </p>
                        ) : null}
                        {booking.guest?.phone ? (
                          <p className="flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {booking.guest.phone}
                          </p>
                        ) : null}
                        <p>Đặt lúc: {formatDateTime(booking.createdAt)}</p>
                      </div>
                    </TableCell>
                    <TableCell className="align-top text-sm text-muted-foreground">
                      <div className="space-y-1">
                        <p className="flex items-center gap-1 text-foreground">
                          <CalendarDays className="h-3 w-3" /> {formatDate(booking.date)}
                        </p>
                        {booking.timeSlot ? <p>Khung giờ: {booking.timeSlot}</p> : null}
                        <p>Số khách: {booking.numberOfGuests}</p>
                      </div>
                    </TableCell>
                    <TableCell className="align-top text-sm">
                      <div className="space-y-1">
                        <p className="font-semibold text-foreground">{formatCurrency(booking.totalPrice, booking.currency)}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(booking.pricePerPerson, booking.currency)} / khách
                        </p>
                        {hasDiscount ? (
                          <p className="text-xs text-emerald-600">
                            Ưu đãi {membershipPlanName ?? "hội viên"}: -
                            {formatCurrency(booking.discountAmount, booking.currency)} ({booking.discountRate}%)
                          </p>
                        ) : null}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Switch
                            checked={booking.paid}
                            onCheckedChange={(checked) => togglePaid(booking.id, checked)}
                            disabled={isRowLoading(booking.id)}
                            aria-label="Đánh dấu đã thanh toán"
                          />
                          <span>{booking.paid ? "Đã chi cho HDV" : "Chưa chi cho HDV"}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <Badge variant={STATUS_BADGE_VARIANT[booking.status] ?? "outline"}>
                        {STATUS_LABELS[booking.status] ?? booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="align-top text-right text-xs">
                      <div className="flex flex-col items-end gap-2">
                        {STATUS_ACTIONS[booking.status]?.map((action) => (
                          <Button
                            key={`${booking.id}-${action.target}`}
                            size="sm"
                            variant={action.variant ?? "default"}
                            disabled={isRowLoading(booking.id)}
                            onClick={() => updateStatus(booking.id, action.target)}
                          >
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="flex flex-col items-center justify-between gap-3 pt-2 text-sm text-muted-foreground md:flex-row">
          <div>
            Trang {page}/{totalPages} • {pagination?.totalCount?.toLocaleString("vi-VN") ?? 0} booking
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => handlePageChange(page - 1)}>
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => handlePageChange(page + 1)}
            >
              Tiếp
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
