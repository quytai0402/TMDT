'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { useBooking } from '@/hooks/use-booking'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Calendar, MapPin, Users, MessageSquare } from 'lucide-react'
import Link from 'next/link'

interface RecentBookingsProps {
  type: 'guest' | 'host'
  limit?: number
}

interface BookingSummary {
  id: string
  status: string
  checkIn: string
  checkOut: string
  adults: number
  totalPrice: number
  contactName?: string | null
  contactPhone?: string | null
  guestType?: 'REGISTERED' | 'WALK_IN'
  listing: {
    id: string
    title: string
    images: string[]
    city: string
    country: string
    propertyType: string
  } | null
  guest?: {
    name?: string | null
    image?: string | null
  } | null
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  CHECKED_IN: 'bg-green-100 text-green-800',
  CHECKED_OUT: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
  COMPLETED: 'bg-purple-100 text-purple-800',
}

const statusLabels: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  CHECKED_IN: 'Đã nhận phòng',
  CHECKED_OUT: 'Đã trả phòng',
  CANCELLED: 'Đã hủy',
  COMPLETED: 'Hoàn thành',
}

export function RecentBookingsEnhanced({ type, limit = 5 }: RecentBookingsProps) {
  const { getBookings, loading } = useBooking()
  const [bookings, setBookings] = useState<BookingSummary[]>([])

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const data = await getBookings(type)
        const nextBookings = Array.isArray(data?.bookings)
          ? (data.bookings as BookingSummary[]).slice(0, limit)
          : []
        setBookings(nextBookings)
      } catch (err) {
        console.error('Failed to fetch bookings:', err)
      }
    }

    fetchBookings()
  }, [type, limit, getBookings])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Đặt phòng gần đây</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (bookings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Đặt phòng gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Chưa có đặt phòng nào
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Đặt phòng gần đây</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {bookings.map((booking) => (
          <div
            key={booking.id}
            className="flex gap-4 p-4 border rounded-lg hover:border-primary transition-colors"
          >
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold">{booking.listing?.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <MapPin className="h-4 w-4" />
                    <span>{booking.listing?.city}</span>
                  </div>
                </div>
                <Badge className={statusColors[booking.status] ?? 'bg-gray-100 text-gray-800'}>
                  {statusLabels[booking.status] ?? booking.status}
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {format(new Date(booking.checkIn), 'dd/MM', { locale: vi })}
                    {' - '}
                    {format(new Date(booking.checkOut), 'dd/MM/yyyy', { locale: vi })}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{booking.adults} khách</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                {type === 'host' ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={booking.guest?.image} />
                      <AvatarFallback>{booking.guest?.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm">
                        {booking.guest?.name || booking.contactName || 'Khách vãng lai'}
                      </span>
                      {booking.guestType === 'WALK_IN' && (
                        <Badge variant="outline" className="w-fit text-[10px] px-2 py-0 border-orange-200 text-orange-600 bg-orange-50">
                          Khách vãng lai
                        </Badge>
                      )}
                      {booking.contactPhone && (
                        <span className="text-xs text-muted-foreground">{booking.contactPhone}</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm font-semibold">
                    {booking.totalPrice.toLocaleString('vi-VN')}₫
                  </div>
                )}

                <div className="flex gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/trips/${booking.id}`}>
                      Chi tiết
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="ghost">
                    <Link href="/messages">
                      <MessageSquare className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}

        <Button asChild variant="outline" className="w-full">
          <Link href={type === 'host' ? '/host/bookings' : '/trips'}>
            Xem tất cả
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
