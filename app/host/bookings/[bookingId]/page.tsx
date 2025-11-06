'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CalendarDays, Clock, Mail, MapPin, Phone, Sparkles, User } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { HostLayout } from '@/components/host-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { useBooking } from '@/hooks/use-booking'

interface ServiceRequest {
  id: string
  name: string
  status: ServiceStatus
  quantityLabel?: string | null
  totalPrice: number
  updatedAt?: string | null
}

interface ConciergePlan {
  id: string
  title: string
  status: string
  scheduledDate?: string | null
  notes?: string | null
  assignedTo?: string | null
}

type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | string

type ServiceStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED'

type PaymentStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'REFUNDED' | string

interface BookingDetail {
  id: string
  bookingRef: string
  status: BookingStatus
  listing: {
    title: string
    city?: string
    address?: string | null
  }
  checkIn: string
  checkOut: string
  nights: number
  guests: number
  total: number
  specialRequests?: string | null
  guestContact: {
    name: string
    email?: string | null
    phone?: string | null
  }
  payment: {
    status: PaymentStatus
    amountPaid: number
    method?: string | null
    transactionId?: string | null
  } | null
  additionalServices: ServiceRequest[]
  conciergePlans: ConciergePlan[]
  createdAt?: string | null
  updatedAt?: string | null
}

const bookingStatusLabels: Record<string, { label: string; className: string }> = {
  PENDING: {
    label: 'Chờ xác nhận',
    className: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  CONFIRMED: {
    label: 'Đã xác nhận',
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  COMPLETED: {
    label: 'Hoàn thành',
    className: 'bg-sky-100 text-sky-700 border-sky-200',
  },
  CANCELLED: {
    label: 'Đã huỷ',
    className: 'bg-rose-100 text-rose-700 border-rose-200',
  },
}

const paymentStatusLabels: Record<string, { label: string; className: string }> = {
  PENDING: {
    label: 'Chưa thanh toán',
    className: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  PROCESSING: {
    label: 'Đang xử lý',
    className: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  PAID: {
    label: 'Đã thanh toán',
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  REFUNDED: {
    label: 'Đã hoàn tiền',
    className: 'bg-sky-100 text-sky-700 border-sky-200',
  },
  FAILED: {
    label: 'Thanh toán thất bại',
    className: 'bg-rose-100 text-rose-700 border-rose-200',
  },
}

const serviceStatusLabels: Record<ServiceStatus, string> = {
  PENDING: 'Chờ xử lý',
  CONFIRMED: 'Đang thực hiện',
  COMPLETED: 'Hoàn thành',
}

const formatDate = (value?: string | null, fallback: string = '—') => {
  if (!value) return fallback

  try {
    return format(new Date(value), "dd/MM/yyyy", { locale: vi })
  } catch (error) {
    return fallback
  }
}

const formatDateTime = (value?: string | null, fallback: string = '—') => {
  if (!value) return fallback
  try {
    return format(new Date(value), "dd/MM/yyyy HH:mm", { locale: vi })
  } catch (error) {
    return fallback
  }
}

const mapService = (service: any): ServiceRequest => ({
  id: service.id,
  name: service.name || 'Dịch vụ bổ sung',
  status: (service.status || 'PENDING').toUpperCase() as ServiceStatus,
  quantityLabel: service.quantityLabel ?? null,
  totalPrice: Number(service.totalPrice) || 0,
  updatedAt: service.updatedAt ?? null,
})

const mapConciergePlan = (plan: any): ConciergePlan => ({
  id: plan.id,
  title: plan.title || 'Kế hoạch concierge',
  status: (plan.status || 'PENDING').toUpperCase(),
  scheduledDate: plan.scheduledDate ?? plan.startDate ?? null,
  notes: plan.notes ?? plan.summary ?? null,
  assignedTo: plan.agent?.name || plan.assignedAgent?.name || plan.assignedTo?.name || null,
})

const mapBookingDetail = (raw: any): BookingDetail => {
  const listing = raw.listing ?? {}
  const guestContact = raw.guestContact ?? {}
  const guest = raw.guest ?? {}
  const payment = raw.payment ?? null

  const guestsCount = typeof raw.guests === 'number'
    ? raw.guests
    : (raw.adults || 0) + (raw.children || 0) + (raw.infants || 0)

  return {
    id: raw.id,
    bookingRef: raw.bookingRef || raw.code || raw.id?.slice?.(-8)?.toUpperCase?.() || 'N/A',
    status: (raw.status || 'PENDING').toUpperCase(),
    listing: {
      title: listing.title || '—',
      city: listing.city || listing.region || undefined,
      address: listing.addressLine1 || listing.fullAddress || listing.street || null,
    },
    checkIn: raw.checkIn,
    checkOut: raw.checkOut,
    nights: raw.nights || raw.duration || 0,
    guests: guestsCount,
    total: Number(raw.total ?? raw.totalPrice ?? raw.price ?? 0),
    specialRequests: raw.specialRequests || raw.metadata?.checkoutNotes || null,
    guestContact: {
      name: guestContact.name || guest.name || 'Khách vãng lai',
      email: guestContact.email || guest.email || null,
      phone: guestContact.phone || guest.phone || null,
    },
    payment: payment
      ? {
          status: (payment.status || 'PENDING').toUpperCase(),
          amountPaid: Number(payment.amountPaid ?? payment.amount ?? payment.total ?? 0),
          method: payment.method || payment.provider || null,
          transactionId: payment.transactionId || payment.reference || payment.paymentCode || null,
        }
      : null,
    additionalServices: Array.isArray(raw.additionalServices) ? raw.additionalServices.map(mapService) : [],
    conciergePlans: Array.isArray(raw.conciergePlans) ? raw.conciergePlans.map(mapConciergePlan) : [],
    createdAt: raw.createdAt ?? null,
    updatedAt: raw.updatedAt ?? null,
  }
}

export default function HostBookingDetailPage({ params }: { params: { bookingId: string } }) {
  const router = useRouter()
  const { getBooking, updateBookingStatus, updateServiceStatus } = useBooking()
  const [booking, setBooking] = useState<BookingDetail | null>(null)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusLoading, setStatusLoading] = useState(false)
  const [serviceLoading, setServiceLoading] = useState<string | null>(null)

  const loadBooking = useCallback(async () => {
    try {
      setFetching(true)
      setError(null)

      const result = await getBooking(params.bookingId)
      const payload = result?.booking ?? result

      if (!payload) {
        throw new Error('Không tìm thấy thông tin đặt phòng.')
      }

      setBooking(mapBookingDetail(payload))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tải đơn đặt phòng.'
      setError(message)
    } finally {
      setFetching(false)
    }
  }, [getBooking, params.bookingId])

  useEffect(() => {
    void loadBooking()
  }, [loadBooking])

  const bookingStatus = useMemo(() => {
    if (!booking) return null
    return bookingStatusLabels[booking.status] ?? {
      label: booking.status,
      className: 'bg-slate-100 text-slate-700 border-slate-200',
    }
  }, [booking])

  const paymentStatus = useMemo(() => {
    if (!booking?.payment) return null
    return paymentStatusLabels[booking.payment.status] ?? {
      label: booking.payment.status,
      className: 'bg-slate-100 text-slate-700 border-slate-200',
    }
  }, [booking])

  const handleStatusChange = async (nextStatus: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED') => {
    if (!booking) return

    try {
      setStatusLoading(true)
      const result = await updateBookingStatus(booking.id, nextStatus)
      const payload = result?.booking ?? result

      if (!payload) {
        throw new Error('Không thể cập nhật trạng thái đơn đặt phòng.')
      }

      setBooking(mapBookingDetail(payload))
      toast.success('Đã cập nhật trạng thái đặt phòng.')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể cập nhật trạng thái.'
      toast.error(message)
    } finally {
      setStatusLoading(false)
    }
  }

  const handleServiceStatusChange = async (serviceId: string, nextStatus: ServiceStatus) => {
    if (!booking) return

    try {
      setServiceLoading(serviceId)
      const result = await updateServiceStatus(booking.id, serviceId, nextStatus)
      const payload = result?.booking ?? result

      if (!payload) {
        setBooking((prev) =>
          prev
            ? {
                ...prev,
                additionalServices: prev.additionalServices.map((service) =>
                  service.id === serviceId ? { ...service, status: nextStatus } : service,
                ),
              }
            : prev,
        )
      } else {
        setBooking(mapBookingDetail(payload))
      }

      toast.success('Đã cập nhật dịch vụ bổ sung.')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể cập nhật dịch vụ.'
      toast.error(message)
    } finally {
      setServiceLoading(null)
    }
  }

  return (
    <HostLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="hidden items-center gap-2 border border-border sm:flex"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </Button>
            <div>
              <h1 className="font-serif text-3xl font-bold text-foreground">Chi tiết đơn đặt phòng</h1>
              {booking?.bookingRef ? (
                <p className="text-sm text-muted-foreground">Mã đơn: {booking.bookingRef}</p>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {bookingStatus ? (
              <Badge variant="outline" className={`border ${bookingStatus.className}`}>
                {bookingStatus.label}
              </Badge>
            ) : null}
            {booking?.payment && paymentStatus ? (
              <Badge variant="outline" className={`border ${paymentStatus.className}`}>
                {paymentStatus.label}
              </Badge>
            ) : null}
          </div>
        </div>

        {fetching ? (
          <Card className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </Card>
        ) : error ? (
          <Card className="p-6">
            <div className="space-y-4 text-center">
              <p className="text-lg font-semibold">Không thể tải đơn đặt phòng</p>
              <p className="text-sm text-muted-foreground">{error}</p>
              <div className="flex justify-center gap-2">
                <Button variant="outline" onClick={() => router.push('/host/bookings')}>
                  Quay về danh sách
                </Button>
                <Button onClick={() => void loadBooking()}>Thử lại</Button>
              </div>
            </div>
          </Card>
        ) : booking ? (
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-6">
              <Card className="overflow-hidden border border-border/80">
                <CardHeader className="space-y-1 bg-muted/40">
                  <CardTitle className="text-lg font-semibold">Thông tin chuyến đi</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(booking.checkIn)} → {formatDate(booking.checkOut)} · {booking.nights} đêm · {booking.guests} khách
                  </p>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <CalendarDays className="h-4 w-4 text-primary" /> Check-in
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(booking.checkIn, '—')}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Clock className="h-4 w-4 text-primary" /> Check-out
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(booking.checkOut, '—')}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-foreground">Thông tin listing</p>
                    <div className="flex items-start gap-3 text-sm text-muted-foreground">
                      <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                      <div>
                        <p className="font-medium text-foreground">{booking.listing.title}</p>
                        {booking.listing.address ? <p>{booking.listing.address}</p> : null}
                        {booking.listing.city ? <p>{booking.listing.city}</p> : null}
                      </div>
                    </div>
                  </div>

                  {booking.specialRequests ? (
                    <div className="space-y-3">
                      <Separator />
                      <div>
                        <p className="text-sm font-semibold text-foreground">Ghi chú từ khách</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-line">
                          {booking.specialRequests}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <Card className="border border-border/80">
                <CardHeader className="bg-muted/40">
                  <CardTitle className="text-lg font-semibold">Khách & liên hệ</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{booking.guestContact.name}</p>
                      <p className="text-muted-foreground">{booking.guests} khách · {booking.nights} đêm</p>
                    </div>
                  </div>

                  {booking.guestContact.phone ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{booking.guestContact.phone}</span>
                    </div>
                  ) : null}

                  {booking.guestContact.email ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>{booking.guestContact.email}</span>
                    </div>
                  ) : null}

                  {booking.payment ? (
                    <div className="rounded-lg border border-border/60 bg-muted/30 p-4 text-sm">
                      <p className="font-semibold text-foreground">Thanh toán</p>
                      <p className="mt-2 text-muted-foreground">
                        Số tiền: <strong className="text-foreground">{booking.payment.amountPaid.toLocaleString('vi-VN')}₫</strong>
                      </p>
                      {booking.payment.method ? (
                        <p className="text-muted-foreground">Phương thức: {booking.payment.method}</p>
                      ) : null}
                      {booking.payment.transactionId ? (
                        <p className="text-muted-foreground">Mã giao dịch: {booking.payment.transactionId}</p>
                      ) : null}
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              {booking.additionalServices.length > 0 ? (
                <Card className="border border-border/80">
                  <CardHeader className="bg-muted/40">
                    <CardTitle className="text-lg font-semibold">Dịch vụ bổ sung</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6">
                    {booking.additionalServices.map((service) => (
                      <div
                        key={service.id}
                        className="rounded-xl border border-border/60 bg-background/80 p-4 shadow-sm"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="font-medium text-foreground">{service.name}</p>
                            {service.quantityLabel ? (
                              <p className="text-sm text-muted-foreground">{service.quantityLabel}</p>
                            ) : null}
                          </div>
                          <Badge variant="outline" className="border bg-white/70 text-xs">
                            {serviceStatusLabels[service.status]}
                          </Badge>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          <span>Tổng: {service.totalPrice.toLocaleString('vi-VN')}₫</span>
                          {service.updatedAt ? <span>Cập nhật: {formatDateTime(service.updatedAt)}</span> : null}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {(['PENDING', 'CONFIRMED', 'COMPLETED'] as ServiceStatus[]).map((statusOption) => (
                            service.status === statusOption ? null : (
                              <Button
                                key={statusOption}
                                size="sm"
                                variant="outline"
                                disabled={serviceLoading === service.id}
                                onClick={() => handleServiceStatusChange(service.id, statusOption)}
                              >
                                {serviceLoading === service.id && (
                                  <span className="mr-2 inline-flex h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                )}
                                {serviceStatusLabels[statusOption]}
                              </Button>
                            )
                          ))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ) : null}

              {booking.conciergePlans.length > 0 ? (
                <Card className="border border-border/80">
                  <CardHeader className="bg-muted/40">
                    <CardTitle className="text-lg font-semibold">Concierge & trải nghiệm</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6">
                    {booking.conciergePlans.map((plan) => (
                      <div key={plan.id} className="rounded-xl border border-border/60 bg-background/80 p-4 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                            <Sparkles className="h-4 w-4" />
                            {plan.title}
                          </div>
                          <Badge variant="outline" className="border bg-white/80">
                            {plan.status}
                          </Badge>
                        </div>
                        <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                          {plan.scheduledDate ? (
                            <p>Thời gian: {formatDateTime(plan.scheduledDate)}</p>
                          ) : null}
                          {plan.assignedTo ? <p>Phụ trách: {plan.assignedTo}</p> : null}
                          {plan.notes ? <p className="whitespace-pre-line">{plan.notes}</p> : null}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ) : null}
            </div>

            <div className="space-y-6">
              <Card className="border border-border/80">
                <CardHeader className="bg-muted/40">
                  <CardTitle className="text-lg font-semibold">Thao tác nhanh</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  {booking.status === 'PENDING' ? (
                    <Button
                      className="w-full"
                      disabled={statusLoading}
                      onClick={() => handleStatusChange('CONFIRMED')}
                    >
                      {statusLoading ? 'Đang cập nhật...' : 'Xác nhận đơn đặt phòng'}
                    </Button>
                  ) : null}

                  {booking.status === 'CONFIRMED' ? (
                    <Button
                      className="w-full"
                      variant="outline"
                      disabled={statusLoading}
                      onClick={() => handleStatusChange('COMPLETED')}
                    >
                      {statusLoading ? 'Đang cập nhật...' : 'Đánh dấu đã hoàn thành'}
                    </Button>
                  ) : null}

                  {booking.status !== 'CANCELLED' ? (
                    <Button
                      className="w-full"
                      variant="ghost"
                      disabled={statusLoading}
                      onClick={() => handleStatusChange('CANCELLED')}
                    >
                      {statusLoading ? 'Đang cập nhật...' : 'Huỷ đơn này'}
                    </Button>
                  ) : null}

                  <Separator className="my-4" />

                  <Button variant="link" className="w-full" asChild>
                    <Link href="/host/bookings">Quay về danh sách đặt phòng</Link>
                  </Button>
                </CardContent>
              </Card>

              {booking.createdAt || booking.updatedAt ? (
                <Card className="border border-border/80">
                  <CardHeader className="bg-muted/40">
                    <CardTitle className="text-lg font-semibold">Lịch sử</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-6 text-sm text-muted-foreground">
                    {booking.createdAt ? <p>Khởi tạo: {formatDateTime(booking.createdAt)}</p> : null}
                    {booking.updatedAt ? <p>Cập nhật gần nhất: {formatDateTime(booking.updatedAt)}</p> : null}
                  </CardContent>
                </Card>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </HostLayout>
  )
}
