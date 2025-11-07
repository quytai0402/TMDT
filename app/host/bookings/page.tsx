'use client'

import { useEffect, useMemo, useState } from 'react'
import { Calendar, CheckCircle2, Clock, MapPin, Sparkles } from 'lucide-react'

import { HostLayout } from '@/components/host-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useBooking } from '@/hooks/use-booking'

interface ServiceRequest {
  id: string
  name: string
  status: ServiceStatus
  quantityLabel?: string | null
  totalPrice: number
  updatedAt?: string | null
}

type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
type ServiceStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED'

interface Booking {
  id: string
  bookingRef: string
  transferReference?: string | null
  paymentStatus?: string | null
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
  additionalServices: ServiceRequest[]
}

const mapBooking = (raw: any): Booking => {
  const services = Array.isArray(raw.additionalServices)
    ? raw.additionalServices.map((service: any) => ({
        id: service.id,
        name: service.name,
        status: (service.status || 'PENDING').toUpperCase() as ServiceStatus,
        quantityLabel: service.quantityLabel ?? null,
        totalPrice: Number(service.totalPrice) || 0,
        updatedAt: service.updatedAt ?? null,
      }))
    : []

  return {
    id: raw.id,
    bookingRef: raw.bookingRef || raw.id.slice(-8).toUpperCase(),
    transferReference: raw.transferReference ?? null,
    paymentStatus: raw.paymentStatus ?? null,
    guestName: raw.guestName || raw.guest?.name || 'Khách vãng lai',
    guestPhone: raw.guestPhone || raw.guest?.phone || '',
    guestEmail: raw.guestEmail || raw.guest?.email || '',
    listingTitle: raw.listing?.title || '—',
    listingCity: raw.listing?.city || '',
    checkIn: raw.checkIn,
    checkOut: raw.checkOut,
    guests:
      raw.guests ??
      (raw.adults || 0) + (raw.children || 0) + (raw.infants || 0),
    nights: raw.nights || 0,
    total: Number(raw.total ?? raw.totalPrice ?? 0),
    status: (raw.status || 'PENDING').toUpperCase() as BookingStatus,
    additionalServices: services,
  }
}

const serviceStatusLabels: Record<ServiceStatus, string> = {
  PENDING: 'Chờ xử lý',
  CONFIRMED: 'Đang thực hiện',
  COMPLETED: 'Hoàn thành',
}

export default function HostBookingsPage() {
  const { getBookings, updateBookingStatus, updateServiceStatus, loading } = useBooking()
  const [bookings, setBookings] = useState<Booking[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getBookings('host')
        const mapped = Array.isArray(data?.bookings) ? data.bookings.map(mapBooking) : []
        setBookings(mapped)
      } catch (error) {
        console.error('Failed to load bookings:', error)
        setBookings([])
      }
    }

    void load()
  }, [getBookings])

  const stats = useMemo(() => {
    const pending = bookings.filter((booking) => booking.status === 'PENDING').length
    const confirmed = bookings.filter((booking) => booking.status === 'CONFIRMED').length
    const servicePending = bookings.reduce(
      (sum, booking) =>
        sum + booking.additionalServices.filter((service) => service.status === 'PENDING').length,
      0,
    )

    return { total: bookings.length, pending, confirmed, servicePending }
  }, [bookings])

  const metrics = useMemo(
    () => ({
      upcomingBookings: stats.pending + stats.confirmed,
    }),
    [stats],
  )

  const handleServiceStatusChange = async (bookingId: string, serviceId: string, status: ServiceStatus) => {
    try {
      const result = await updateServiceStatus(bookingId, serviceId, status)
      const updated = result?.booking ? mapBooking(result.booking) : null

      setBookings((prev) =>
        prev.map((booking) => {
          if (booking.id !== bookingId) return booking
          if (!updated) {
            return {
              ...booking,
              additionalServices: booking.additionalServices.map((service) =>
                service.id === serviceId ? { ...service, status } : service,
              ),
            }
          }
          return updated
        }),
      )
    } catch (error) {
      console.error('Failed to update service:', error)
    }
  }

  return (
    <HostLayout metrics={metrics}>
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-2">Quản lý đặt phòng</h1>
          <p className="text-muted-foreground">
            Xác nhận đặt phòng và theo dõi các dịch vụ bổ sung mà khách đã yêu cầu.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tổng đặt phòng</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Đang chờ xử lý</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Đã xác nhận</p>
                <p className="text-2xl font-bold">{stats.confirmed}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Dịch vụ đang chờ</p>
                <p className="text-2xl font-bold">{stats.servicePending}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                <Sparkles className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          {loading ? (
            <Card className="p-6">
              <p className="text-muted-foreground">Đang tải danh sách...</p>
            </Card>
          ) : bookings.length === 0 ? (
            <Card className="p-6">
              <p className="text-muted-foreground">Hiện chưa có đặt phòng nào.</p>
            </Card>
          ) : (
            bookings.map((booking) => (
              <Card key={booking.id} className="border border-border bg-white/90">
                <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="text-lg">{booking.listingTitle}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" /> {booking.listingCity}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground md:flex-nowrap md:gap-4">
                    <span>
                      Mã đơn: <strong>{booking.bookingRef}</strong>
                    </span>
                    <span>
                      {new Date(booking.checkIn).toLocaleDateString('vi-VN')} →{' '}
                      {new Date(booking.checkOut).toLocaleDateString('vi-VN')}
                    </span>
                    <Badge variant={booking.status === 'PENDING' ? 'outline' : 'default'}>
                      {booking.status === 'PENDING'
                        ? 'Chờ xác nhận'
                        : booking.status === 'CONFIRMED'
                        ? 'Đã xác nhận'
                        : booking.status === 'COMPLETED'
                        ? 'Hoàn thành'
                        : 'Đã hủy'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Khách hàng</p>
                      <p className="font-medium">{booking.guestName}</p>
                      {booking.guestPhone && <p className="text-muted-foreground">{booking.guestPhone}</p>}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Số khách</p>
                      <p className="font-medium">
                        {booking.guests} khách / {booking.nights} đêm
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Tổng tiền</p>
                      <p className="font-semibold">{booking.total.toLocaleString('vi-VN')}₫</p>
                    </div>
                  </div>

                  {booking.transferReference && (
                    <p className="text-xs font-mono text-muted-foreground">
                      Mã tham chiếu: {booking.transferReference}
                    </p>
                  )}

                  {booking.status === 'PENDING' && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                      LuxeStay sẽ xác nhận đơn sau khi kiểm tra thanh toán. Bạn sẽ nhận thông báo ngay khi hoàn tất.
                    </div>
                  )}

                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold">Dịch vụ bổ sung</h3>

                    {booking.additionalServices.length ? (
                      <div className="grid gap-3 md:grid-cols-2">
                        {booking.additionalServices.map((service) => (
                          <div
                            key={service.id}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium text-slate-900">{service.name}</p>
                                {service.quantityLabel && (
                                  <p className="text-xs text-muted-foreground">{service.quantityLabel}</p>
                                )}
                              </div>
                              <Badge
                                variant={
                                  service.status === 'PENDING'
                                    ? 'outline'
                                    : service.status === 'CONFIRMED'
                                    ? 'secondary'
                                    : 'default'
                                }
                              >
                                {serviceStatusLabels[service.status]}
                              </Badge>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {service.status !== 'PENDING' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleServiceStatusChange(booking.id, service.id, 'PENDING')}
                                >
                                  Chờ xử lý
                                </Button>
                              )}
                              {service.status !== 'CONFIRMED' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleServiceStatusChange(booking.id, service.id, 'CONFIRMED')}
                                >
                                  Đang làm
                                </Button>
                              )}
                              {service.status !== 'COMPLETED' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleServiceStatusChange(booking.id, service.id, 'COMPLETED')}
                                >
                                  Hoàn tất
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Chưa có dịch vụ bổ sung nào.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </HostLayout>
  )
}
