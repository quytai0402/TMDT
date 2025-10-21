'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { CalendarX, Check, X } from 'lucide-react'
import { format, isSameDay, isWithinInterval, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'

interface BlockedDate {
  id: string
  startDate: string
  endDate: string
  reason?: string
}

interface Booking {
  id: string
  checkIn: string
  checkOut: string
  status: string
}

interface AvailabilityCalendarProps {
  listingId: string
}

export function AvailabilityCalendar({ listingId }: AvailabilityCalendarProps) {
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  useEffect(() => {
    async function fetchAvailability() {
      try {
        const [blockedRes, bookingsRes] = await Promise.all([
          fetch(`/api/listings/${listingId}/blocked-dates`),
          fetch(`/api/listings/${listingId}/bookings?status=CONFIRMED,PENDING`),
        ])

        if (blockedRes.ok) {
          const blocked = await blockedRes.json()
          setBlockedDates(blocked)
        }

        if (bookingsRes.ok) {
          const bookingsData = await bookingsRes.json()
          setBookings(bookingsData)
        }
      } catch (error) {
        console.error('Error fetching availability:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAvailability()
  }, [listingId])

  const isDateBlocked = (date: Date) => {
    // Check blocked dates
    const isBlocked = blockedDates.some(blocked => {
      const start = parseISO(blocked.startDate)
      const end = parseISO(blocked.endDate)
      return isWithinInterval(date, { start, end })
    })

    // Check bookings
    const isBooked = bookings.some(booking => {
      const start = parseISO(booking.checkIn)
      const end = parseISO(booking.checkOut)
      return isWithinInterval(date, { start, end })
    })

    return isBlocked || isBooked
  }

  const getDateStatus = (date: Date) => {
    // Find blocked date
    const blocked = blockedDates.find(blocked => {
      const start = parseISO(blocked.startDate)
      const end = parseISO(blocked.endDate)
      return isWithinInterval(date, { start, end })
    })

    if (blocked) {
      return {
        status: 'blocked',
        reason: blocked.reason || 'Chủ nhà không cho thuê',
        color: 'bg-red-100 border-red-300',
      }
    }

    // Find booking
    const booking = bookings.find(booking => {
      const start = parseISO(booking.checkIn)
      const end = parseISO(booking.checkOut)
      return isWithinInterval(date, { start, end })
    })

    if (booking) {
      return {
        status: 'booked',
        reason: `Đã được đặt (${booking.status})`,
        color: 'bg-orange-100 border-orange-300',
      }
    }

    return {
      status: 'available',
      reason: 'Còn trống',
      color: 'bg-green-100 border-green-300',
    }
  }

  const selectedDateStatus = selectedDate ? getDateStatus(selectedDate) : null

  // Get upcoming blocked/booked periods
  const upcomingUnavailable = [
    ...blockedDates.map(b => ({
      type: 'blocked' as const,
      start: parseISO(b.startDate),
      end: parseISO(b.endDate),
      reason: b.reason,
    })),
    ...bookings.map(b => ({
      type: 'booked' as const,
      start: parseISO(b.checkIn),
      end: parseISO(b.checkOut),
      reason: `Booking ${b.status}`,
    })),
  ]
    .filter(item => item.end >= new Date())
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .slice(0, 5)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Kiểm tra phòng trống</CardTitle>
          <CardDescription>Đang tải...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarX className="h-5 w-5" />
          Kiểm tra phòng trống
        </CardTitle>
        <CardDescription>
          Xem lịch trống và các ngày đã được đặt hoặc bị chặn
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Calendar */}
        <div className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            locale={vi}
            disabled={(date) => date < new Date() || isDateBlocked(date)}
            modifiers={{
              blocked: (date) => isDateBlocked(date),
              available: (date) => !isDateBlocked(date) && date >= new Date(),
            }}
            modifiersStyles={{
              blocked: {
                backgroundColor: '#fee',
                color: '#c00',
                textDecoration: 'line-through',
              },
              available: {
                backgroundColor: '#efe',
              },
            }}
            className="rounded-md border"
          />
        </div>

        {/* Selected Date Status */}
        {selectedDate && selectedDateStatus && (
          <div
            className={`p-4 rounded-lg border-2 ${selectedDateStatus.color}`}
          >
            <div className="flex items-center gap-2 mb-2">
              {selectedDateStatus.status === 'available' ? (
                <Check className="h-5 w-5 text-green-600" />
              ) : (
                <X className="h-5 w-5 text-red-600" />
              )}
              <span className="font-semibold">
                {format(selectedDate, 'dd/MM/yyyy', { locale: vi })}
              </span>
            </div>
            <p className="text-sm text-gray-700">{selectedDateStatus.reason}</p>
          </div>
        )}

        {/* Legend */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Chú thích:</h4>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-100 border border-green-300" />
              <span>Còn trống</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-orange-100 border border-orange-300" />
              <span>Đã đặt</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-100 border border-red-300" />
              <span>Bị chặn</span>
            </div>
          </div>
        </div>

        {/* Upcoming Unavailable Periods */}
        {upcomingUnavailable.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Các khoảng thời gian sắp tới:</h4>
            <div className="space-y-2">
              {upcomingUnavailable.map((item, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg bg-gray-50 border text-sm"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">
                      {format(item.start, 'dd/MM/yyyy', { locale: vi })} -{' '}
                      {format(item.end, 'dd/MM/yyyy', { locale: vi })}
                    </span>
                    <Badge variant={item.type === 'blocked' ? 'destructive' : 'secondary'}>
                      {item.type === 'blocked' ? 'Bị chặn' : 'Đã đặt'}
                    </Badge>
                  </div>
                  {item.reason && (
                    <p className="text-xs text-gray-600">{item.reason}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
