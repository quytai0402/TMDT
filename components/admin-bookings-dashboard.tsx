"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  Calendar,
  Phone,
  Mail,
  User,
  Search,
  Download,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  Sparkles,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface ServiceRequest {
  id: string
  name: string
  status: ServiceStatus
  quantity?: number | null
  quantityLabel?: string | null
  totalPrice: number
  updatedAt?: string | null
}

type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED"
type ServiceStatus = "PENDING" | "CONFIRMED" | "COMPLETED"

interface Booking {
  id: string
  bookingRef: string
  guestName: string
  guestPhone: string
  guestEmail: string
  listingTitle: string
  listingCity: string
  checkIn: string
  checkOut: string
  guests: number
  nights: number
  total: number
  status: BookingStatus
  paymentMethod: string
  createdAt: string
  isGuestBooking: boolean
  guestHistory?: {
    totalBookings: number
    totalSpent: number
  } | null
  additionalServices: ServiceRequest[]
}

const statusConfig: Record<BookingStatus, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  CONFIRMED: { label: "Đã xác nhận", color: "bg-green-600", icon: CheckCircle2 },
  PENDING: { label: "Chờ xử lý", color: "bg-yellow-600", icon: Clock },
  CANCELLED: { label: "Đã hủy", color: "bg-red-600", icon: XCircle },
  COMPLETED: { label: "Hoàn thành", color: "bg-blue-600", icon: CheckCircle2 },
}

const serviceStatusConfig: Record<ServiceStatus, { label: string; variant: "secondary" | "outline" | "default" }> = {
  PENDING: { label: "Chờ xử lý", variant: "outline" },
  CONFIRMED: { label: "Đang thực hiện", variant: "secondary" },
  COMPLETED: { label: "Đã hoàn thành", variant: "default" },
}

const mapBooking = (raw: any): Booking => {
  const status = (raw.status || "PENDING").toString().toUpperCase() as BookingStatus
  const services = Array.isArray(raw.additionalServices)
    ? raw.additionalServices.map((service: any) => ({
        id: service.id,
        name: service.name,
        status: (service.status || "PENDING").toString().toUpperCase() as ServiceStatus,
        quantity: service.quantity ?? null,
        quantityLabel: service.quantityLabel ?? null,
        totalPrice: Number(service.totalPrice) || 0,
        updatedAt: service.updatedAt ?? null,
      }))
    : []

  const guestsCount = raw.guests ??
    (raw.adults || 0) +
    (raw.children || 0) +
    (raw.infants || 0)

  return {
    id: raw.id,
    bookingRef: raw.bookingRef || (typeof raw.id === "string" ? raw.id.slice(-8).toUpperCase() : ""),
    guestName: raw.guestName || raw.guest?.name || "Khách vãng lai",
    guestPhone: raw.guestPhone || raw.guest?.phone || "",
    guestEmail: raw.guestEmail || raw.guest?.email || "",
    listingTitle: raw.listing?.title || "—",
    listingCity: raw.listing?.city || "",
    checkIn: raw.checkIn,
    checkOut: raw.checkOut,
    guests: guestsCount,
    nights: raw.nights || 0,
    total: Number(raw.total ?? raw.totalPrice ?? 0),
    status,
    paymentMethod: raw.payment?.paymentMethod || "N/A",
    createdAt: raw.createdAt,
    isGuestBooking: Boolean(raw.isGuestBooking ?? raw.guestType === "WALK_IN"),
    guestHistory: raw.guestHistory || null,
    additionalServices: services,
  }
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN").format(Math.round(value))

export function AdminBookingsDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "ALL">("ALL")
  const [serviceFilter, setServiceFilter] = useState<"all" | "with" | "without">("all")
  const [serviceStatusFilter, setServiceStatusFilter] = useState<"ALL" | ServiceStatus>("ALL")
  const [serviceUpdating, setServiceUpdating] = useState<Record<string, boolean>>({})

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ page: "1", limit: "100" })
      if (statusFilter !== "ALL") params.set("status", statusFilter)
      if (serviceFilter) params.set("hasServices", serviceFilter)
      if (serviceStatusFilter !== "ALL") params.set("serviceStatus", serviceStatusFilter)

      const response = await fetch(`/api/admin/bookings?${params.toString()}`, {
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch bookings")
      }

      const data = await response.json()
      const mapped = Array.isArray(data.bookings) ? data.bookings.map(mapBooking) : []
      setBookings(mapped)
    } catch (error) {
      console.error("Error fetching bookings:", error)
      setBookings([])
    } finally {
      setLoading(false)
    }
  }, [serviceFilter, serviceStatusFilter, statusFilter])

  useEffect(() => {
    void fetchBookings()
  }, [fetchBookings])

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const matchesSearch =
        booking.bookingRef.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.guestPhone.includes(searchTerm) ||
        booking.guestEmail.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === "ALL" || booking.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [bookings, searchTerm, statusFilter])

  const stats = useMemo(() => {
    const confirmed = filteredBookings.filter((booking) => booking.status === "CONFIRMED")
    const pending = filteredBookings.filter((booking) => booking.status === "PENDING")
    const revenue = filteredBookings
      .filter((booking) => booking.status === "CONFIRMED" || booking.status === "COMPLETED")
      .reduce((sum, booking) => sum + booking.total, 0)

    return {
      totalBookings: filteredBookings.length,
      confirmed: confirmed.length,
      pending: pending.length,
      totalRevenue: revenue,
    }
  }, [filteredBookings])

  const serviceMetrics = useMemo(() => {
    const totals = filteredBookings.reduce(
      (acc, booking) => {
        acc.total += booking.additionalServices.length
        acc.pending += booking.additionalServices.filter((service) => service.status === 'PENDING').length
        acc.confirmed += booking.additionalServices.filter((service) => service.status === 'CONFIRMED').length
        acc.completed += booking.additionalServices.filter((service) => service.status === 'COMPLETED').length
        return acc
      },
      { total: 0, pending: 0, confirmed: 0, completed: 0 },
    )
    return totals
  }, [filteredBookings])

  const handleServiceStatusChange = async (bookingId: string, serviceId: string, status: ServiceStatus) => {
    const key = `${bookingId}:${serviceId}`
    setServiceUpdating((prev) => ({ ...prev, [key]: true }))
    try {
      const response = await fetch(`/api/bookings/${bookingId}/services`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId, status }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update service')
      }

      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === bookingId ? mapBooking(data.booking) : booking,
        ),
      )
    } catch (error) {
      console.error('Failed to update service status:', error)
    } finally {
      setServiceUpdating((prev) => ({ ...prev, [key]: false }))
    }
  }

  const handleBookingStatusChange = async (bookingId: string, status: BookingStatus) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update booking status')
      }

      const updated = data?.booking ? mapBooking(data.booking) : null

      setBookings((prev) =>
        prev.map((booking) => {
          if (booking.id !== bookingId) return booking
          return updated ?? { ...booking, status }
        }),
      )
    } catch (error) {
      console.error('Failed to update booking status:', error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Đang tải dữ liệu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Tổng đặt phòng</p>
              <p className="text-2xl font-bold">{stats.totalBookings}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Đã xác nhận</p>
              <p className="text-2xl font-bold">{stats.confirmed}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Chờ xử lý</p>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Doanh thu</p>
              <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}₫</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Dịch vụ bổ sung</p>
              <p className="text-2xl font-bold">{serviceMetrics.pending}</p>
              <p className="text-xs text-muted-foreground">{serviceMetrics.total} dịch vụ • {serviceMetrics.confirmed} đang làm</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-orange-500" />
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo mã đặt phòng, tên, SĐT, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {(["ALL", "CONFIRMED", "PENDING", "CANCELLED", "COMPLETED"] as const).map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  onClick={() => setStatusFilter(status === 'ALL' ? 'ALL' : status)}
                  size="sm"
                >
                  {status === 'ALL' ? 'Tất cả' : statusConfig[status].label}
                </Button>
              ))}
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Xuất Excel
              </Button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
            <div className="flex gap-2 flex-wrap">
              {([
                { value: 'all', label: 'Tất cả dịch vụ' },
                { value: 'with', label: 'Có dịch vụ' },
                { value: 'without', label: 'Không có dịch vụ' },
              ] as const).map((option) => (
                <Button
                  key={option.value}
                  size="sm"
                  variant={serviceFilter === option.value ? 'default' : 'outline'}
                  onClick={() => setServiceFilter(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap">
              {([
                { value: 'ALL', label: 'Trạng thái dịch vụ' },
                { value: 'PENDING', label: 'Chờ xử lý' },
                { value: 'CONFIRMED', label: 'Đang thực hiện' },
                { value: 'COMPLETED', label: 'Đã hoàn thành' },
              ] as const).map((option) => (
                <Button
                  key={option.value}
                  size="sm"
                  variant={serviceStatusFilter === option.value ? 'default' : 'outline'}
                  onClick={() => setServiceStatusFilter(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã đặt phòng</TableHead>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Liên hệ</TableHead>
              <TableHead>Phòng</TableHead>
              <TableHead>Check-in/out</TableHead>
              <TableHead>Khách</TableHead>
              <TableHead>Tổng tiền</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Dịch vụ bổ sung</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBookings.map((booking) => {
              const StatusIcon = statusConfig[booking.status].icon
              return (
                <TableRow key={booking.id}>
                  <TableCell className="font-semibold">{booking.bookingRef}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{booking.guestName}</span>
                      {booking.isGuestBooking && (
                        <Badge variant="outline" className="w-fit text-[10px] px-2 py-0 border-orange-200 text-orange-600 bg-orange-50">
                          Khách vãng lai
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                      {booking.guestPhone && (
                        <span className="flex items-center gap-2">
                          <Phone className="w-3 h-3" /> {booking.guestPhone}
                        </span>
                      )}
                      {booking.guestEmail && (
                        <span className="flex items-center gap-2">
                          <Mail className="w-3 h-3" /> {booking.guestEmail}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{booking.listingTitle}</span>
                      <span className="text-xs text-muted-foreground">{booking.listingCity}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-sm">
                      <span>{new Date(booking.checkIn).toLocaleDateString('vi-VN')}</span>
                      <span>{new Date(booking.checkOut).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>{booking.guests}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">{formatCurrency(booking.total)}₫</TableCell>
                  <TableCell>
                    <Badge className={`flex items-center gap-2 ${statusConfig[booking.status].color} text-white`}>
                      <StatusIcon className="w-3 h-3" />
                      {statusConfig[booking.status].label}
                    </Badge>
                    {booking.status === "PENDING" && (
                      <Button
                        size="sm"
                        variant="link"
                        className="px-0 text-primary"
                        onClick={() => handleBookingStatusChange(booking.id, "CONFIRMED")}
                      >
                        Xác nhận nhanh
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    {booking.additionalServices.length ? (
                      <div className="space-y-2">
                        {booking.additionalServices.map((service) => {
                          const key = `${booking.id}:${service.id}`
                          return (
                            <div
                              key={service.id}
                              className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                            >
                              <div>
                                <p className="text-sm font-medium text-slate-900">{service.name}</p>
                                {service.quantityLabel && (
                                  <p className="text-xs text-muted-foreground">{service.quantityLabel}</p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                  {service.updatedAt
                                    ? `Cập nhật ${new Date(service.updatedAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}`
                                    : 'Vừa yêu cầu'}
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <Badge variant={serviceStatusConfig[service.status].variant} className="text-xs">
                                  {serviceStatusConfig[service.status].label}
                                </Badge>
                                <div className="flex gap-1">
                                  {service.status !== 'PENDING' && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      disabled={serviceUpdating[key]}
                                      onClick={() => handleServiceStatusChange(booking.id, service.id, 'PENDING')}
                                    >
                                      Chờ
                                    </Button>
                                  )}
                                  {service.status !== 'CONFIRMED' && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      disabled={serviceUpdating[key]}
                                      onClick={() => handleServiceStatusChange(booking.id, service.id, 'CONFIRMED')}
                                    >
                                      Đang làm
                                    </Button>
                                  )}
                                  {service.status !== 'COMPLETED' && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      disabled={serviceUpdating[key]}
                                      onClick={() => handleServiceStatusChange(booking.id, service.id, 'COMPLETED')}
                                    >
                                      Hoàn tất
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Không có</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/bookings/${booking.id}`}>
                        Chi tiết
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
