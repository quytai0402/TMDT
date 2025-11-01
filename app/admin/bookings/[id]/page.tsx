"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  Calendar,
  CheckCircle2,
  Clock,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  Tag,
  User,
  ArrowLeft,
} from "lucide-react"

import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

type ServiceStatus = "PENDING" | "CONFIRMED" | "COMPLETED"
type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED"

interface AdditionalService {
  id: string
  name: string
  status: ServiceStatus
  totalPrice: number
  quantityLabel?: string | null
  updatedAt?: string | null
}

interface BookingDetail {
  id: string
  status: BookingStatus
  bookingRef?: string
  guestContact: {
    name: string
    email: string | null
    phone: string | null
    guestType: string
  }
  checkIn: string
  checkOut: string
  nights: number
  adults: number
  children: number
  infants: number
  pets: number
  totalPrice: number
  basePrice: number
  cleaningFee: number
  serviceFee: number
  additionalServicesTotal: number
  platformCommission?: number
  hostEarnings?: number
  hostPayoutStatus?: string
  specialRequests?: string | null
  confirmedAt?: string | null
  completedAt?: string | null
  createdAt: string
  updatedAt: string
  listing: {
    id: string
    title: string
    city: string
    address?: string | null
    host: {
      id: string
      name: string | null
      email: string | null
      phone?: string | null
      hostProfile?: {
        availableBalance?: number
      } | null
    }
  }
  conciergePlans?: Array<{
    id: string
    status: string
    createdAt: string
    hostNotes?: string | null
    guestNotes?: string | null
  }>
  additionalServices?: AdditionalService[]
}

const STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING: "Chờ xử lý",
  CONFIRMED: "Đã xác nhận",
  CANCELLED: "Đã hủy",
  COMPLETED: "Hoàn thành",
}

const STATUS_BADGE: Record<BookingStatus, { variant: "secondary" | "default" | "destructive" | "outline"; icon: React.ElementType }> =
  {
    PENDING: { variant: "outline", icon: Clock },
    CONFIRMED: { variant: "default", icon: CheckCircle2 },
    CANCELLED: { variant: "destructive", icon: Clock },
    COMPLETED: { variant: "secondary", icon: Sparkles },
}

const SERVICE_STATUS_LABEL: Record<ServiceStatus, string> = {
  PENDING: "Chờ xử lý",
  CONFIRMED: "Đang thực hiện",
  COMPLETED: "Đã hoàn tất",
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Math.round(value || 0))

const normalizeBookingResponse = (
  raw: any,
  fallback: BookingDetail | null = null,
): BookingDetail => {
  const additionalServices = Array.isArray(raw?.additionalServices)
    ? raw.additionalServices
    : fallback?.additionalServices ?? []

  const conciergePlans = Array.isArray(raw?.conciergePlans)
    ? raw.conciergePlans
    : fallback?.conciergePlans ?? []

  const guestContact = raw?.guestContact ?? fallback?.guestContact ?? {
    name: raw?.contactName ?? fallback?.guestContact?.name ?? "Khách vãng lai",
    email: raw?.contactEmail ?? fallback?.guestContact?.email ?? null,
    phone: raw?.contactPhone ?? fallback?.guestContact?.phone ?? null,
    guestType: raw?.guestType ?? fallback?.guestContact?.guestType ?? "REGISTERED",
  }

  return {
    ...(fallback ?? {}),
    ...raw,
    guestContact,
    additionalServices,
    conciergePlans,
    hostPayoutStatus: raw?.hostPayoutStatus ?? fallback?.hostPayoutStatus ?? "PENDING",
    platformCommission: raw?.platformCommission ?? fallback?.platformCommission ?? 0,
    hostEarnings: raw?.hostEarnings ?? fallback?.hostEarnings ?? 0,
  }
}

export default function AdminBookingDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [booking, setBooking] = useState<BookingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<boolean>(false)

  const bookingId = params?.id

  useEffect(() => {
    const loadBooking = async () => {
      if (!bookingId) return
      try {
        setLoading(true)
        const res = await fetch(`/api/bookings/${bookingId}`, { cache: "no-store" })
        if (!res.ok) {
          if (res.status === 404) {
            setError("Không tìm thấy thông tin đặt phòng.")
          } else {
            setError("Không thể tải thông tin đặt phòng.")
          }
          return
        }
        const data = await res.json()
        setBooking(normalizeBookingResponse(data))
        setError(null)
      } catch (err) {
        console.error("Failed to load booking detail:", err)
        setError("Đã xảy ra lỗi khi tải dữ liệu.")
      } finally {
        setLoading(false)
      }
    }

    void loadBooking()
  }, [bookingId])

  const totals = useMemo(() => {
    if (!booking) return null
    const totals = {
      total: booking.totalPrice ?? 0,
      serviceFee: booking.serviceFee ?? 0,
      base: booking.basePrice ?? 0,
      cleaning: booking.cleaningFee ?? 0,
      services: booking.additionalServicesTotal ?? 0,
      commission: booking.platformCommission ?? booking.serviceFee ?? 0,
      hostShare:
        booking.hostEarnings ??
        Math.max(
          (booking.totalPrice ?? 0) - (booking.platformCommission ?? booking.serviceFee ?? 0),
          0,
        ),
    }
    return totals
  }, [booking])

  const updateStatus = async (status: BookingStatus) => {
    if (!booking) return
    try {
      setActionLoading(true)
      const res = await fetch(`/api/bookings/${booking.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Cập nhật trạng thái thất bại")
      }
      toast.success(`Đã cập nhật trạng thái: ${STATUS_LABEL[status]}`)
      setBooking((prev) => normalizeBookingResponse(data.booking, prev))
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setActionLoading(false)
    }
  }

  const updateServiceStatus = async (service: AdditionalService, status: ServiceStatus) => {
    if (!booking) return
    try {
      setActionLoading(true)
      const res = await fetch(`/api/bookings/${booking.id}/services`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId: service.id, status }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Cập nhật dịch vụ thất bại")
      }
      toast.success(`Đã cập nhật dịch vụ ${service.name} → ${SERVICE_STATUS_LABEL[status]}`)
      setBooking((prev) =>
        prev
          ? {
              ...prev,
              additionalServices: (prev.additionalServices || []).map((item) =>
                item.id === service.id ? { ...item, status } : item,
              ),
            }
          : prev,
      )
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
          Đang tải thông tin đặt phòng...
        </div>
      </AdminLayout>
    )
  }

  if (error || !booking) {
    return (
      <AdminLayout>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
          <p className="text-muted-foreground">{error || "Không tìm thấy thông tin đặt phòng."}</p>
          <Button onClick={() => router.push("/admin/bookings")}>Quay lại danh sách</Button>
        </div>
      </AdminLayout>
    )
  }

  const statusBadge = STATUS_BADGE[booking.status]

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <Button variant="ghost" onClick={() => router.push("/admin/bookings")} className="px-0 text-muted-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
            </Button>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">Đơn đặt phòng #{booking.id.slice(-8).toUpperCase()}</h1>
              <Badge variant={statusBadge.variant} className="flex items-center gap-1">
                <statusBadge.icon className="h-3 w-3" />
                {STATUS_LABEL[booking.status]}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Tạo lúc: {new Date(booking.createdAt).toLocaleString("vi-VN")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {["PENDING", "CONFIRMED"].includes(booking.status) && (
              <Button
                variant="outline"
                size="sm"
                disabled={actionLoading}
                onClick={() => updateStatus("CANCELLED")}
              >
                Hủy đơn
              </Button>
            )}
            {booking.status === "PENDING" && (
              <Button size="sm" disabled={actionLoading} onClick={() => updateStatus("CONFIRMED")}>
                Xác nhận
              </Button>
            )}
            {booking.status === "CONFIRMED" && (
              <Button size="sm" disabled={actionLoading} onClick={() => updateStatus("COMPLETED")}>
                Đánh dấu hoàn thành
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin chuyến đi</CardTitle>
              <CardDescription>{booking.listing.title}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <h3 className="text-sm font-semibold text-muted-foreground">Khách</h3>
                  <div className="mt-2 space-y-2 text-sm">
                    <p className="font-medium">{booking.guestContact.name}</p>
                    {booking.guestContact.email && (
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" /> {booking.guestContact.email}
                      </p>
                    )}
                    {booking.guestContact.phone && (
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" /> {booking.guestContact.phone}
                      </p>
                    )}
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4" /> {booking.adults} người lớn • {booking.children} trẻ em
                    </p>
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <h3 className="text-sm font-semibold text-muted-foreground">Host</h3>
                  <div className="mt-2 space-y-2 text-sm">
                    <p className="font-medium">{booking.listing.host.name || "Host"}</p>
                    {booking.listing.host.email && (
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" /> {booking.listing.host.email}
                      </p>
                    )}
                    {booking.listing.host.phone && (
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" /> {booking.listing.host.phone}
                      </p>
                    )}
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" /> {booking.listing.city}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <h3 className="text-sm font-semibold text-muted-foreground">Thời gian</h3>
                <div className="mt-2 grid gap-4 md:grid-cols-2 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    Check-in: {new Date(booking.checkIn).toLocaleString("vi-VN")}
                  </p>
                  <p className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    Check-out: {new Date(booking.checkOut).toLocaleString("vi-VN")}
                  </p>
                </div>
              </div>

              {booking.specialRequests && (
                <div className="rounded-lg border border-dashed p-4">
                  <h3 className="text-sm font-semibold text-muted-foreground">Yêu cầu đặc biệt</h3>
                  <p className="mt-2 text-sm">{booking.specialRequests}</p>
                </div>
              )}

              {(booking.conciergePlans?.length ?? 0) > 0 && (
                <div className="rounded-lg border p-4">
                  <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-500" />
                    Concierge
                  </h3>
                  <div className="mt-3 space-y-2 text-sm">
                    {booking.conciergePlans?.map((plan) => (
                      <div key={plan.id} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
                        <div>
                          <p className="font-medium">Kế hoạch #{plan.id.slice(-6)}</p>
                          <p className="text-xs text-muted-foreground">
                            Trạng thái: {plan.status}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(plan.createdAt).toLocaleString("vi-VN")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tổng quan tài chính</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Giá phòng ({booking.nights} đêm)</span>
                <span className="font-semibold">{formatCurrency(booking.basePrice)}</span>
              </div>
              {booking.cleaningFee > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Phí vệ sinh</span>
                  <span className="font-semibold">{formatCurrency(booking.cleaningFee)}</span>
                </div>
              )}
              {booking.additionalServicesTotal > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Dịch vụ bổ sung</span>
                  <span className="font-semibold">{formatCurrency(booking.additionalServicesTotal)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Phí nền tảng</span>
                <span className="font-semibold text-orange-600">
                  -{formatCurrency(totals?.commission ?? 0)}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-base font-semibold">
                <span>Tổng thanh toán</span>
                <span>{formatCurrency(totals?.total ?? booking.totalPrice)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Thu nhập host</span>
                <span className="font-semibold text-green-600">{formatCurrency(totals?.hostShare ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Trạng thái ví host</span>
                <Badge variant="outline">{booking.hostPayoutStatus || "PENDING"}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {(booking.additionalServices?.length ?? 0) > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Dịch vụ bổ sung</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {booking.additionalServices?.map((service) => (
                <div
                  key={service.id}
                  className="flex flex-col gap-3 rounded-lg border border-muted/60 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-semibold text-foreground">{service.name}</p>
                    {service.quantityLabel && (
                      <p className="text-xs text-muted-foreground">{service.quantityLabel}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {service.updatedAt
                        ? `Cập nhật: ${new Date(service.updatedAt).toLocaleString("vi-VN")}`
                        : "Vừa tạo"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{SERVICE_STATUS_LABEL[service.status]}</Badge>
                    <span className="text-sm font-semibold text-primary">
                      {formatCurrency(service.totalPrice)}
                    </span>
                    <div className="flex items-center gap-1">
                      {service.status !== "PENDING" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={actionLoading}
                          onClick={() => updateServiceStatus(service, "PENDING")}
                        >
                          Chờ
                        </Button>
                      )}
                      {service.status !== "CONFIRMED" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={actionLoading}
                          onClick={() => updateServiceStatus(service, "CONFIRMED")}
                        >
                          Đang làm
                        </Button>
                      )}
                      {service.status !== "COMPLETED" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={actionLoading}
                          onClick={() => updateServiceStatus(service, "COMPLETED")}
                        >
                          Hoàn tất
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}
