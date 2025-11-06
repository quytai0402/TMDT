'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Skeleton } from '@/components/ui/skeleton'
import { CalendarX, Check, X } from 'lucide-react'
import { format, isBefore, isWithinInterval, parseISO, startOfDay } from 'date-fns'
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
  initialCheckIn?: string
  initialCheckOut?: string
  onClose?: () => void
}

export function AvailabilityCalendar({ listingId, initialCheckIn, initialCheckOut }: AvailabilityCalendarProps) {
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => {
    if (initialCheckIn) {
      try {
        return parseISO(initialCheckIn)
      } catch (error) {
        // ignore parse issues and fallback below
      }
    }
    if (initialCheckOut) {
      try {
        return parseISO(initialCheckOut)
      } catch (error) {
        // ignore parse issues and fallback below
      }
    }
    return new Date()
  })

  useEffect(() => {
    const target = initialCheckIn ?? initialCheckOut
    if (!target) return

    try {
      const parsed = parseISO(target)
      if (!Number.isNaN(parsed.getTime())) {
        setSelectedDate(parsed)
      }
    } catch (error) {
      // ignore parse issues and keep previous state
    }
  }, [initialCheckIn, initialCheckOut])

  useEffect(() => {
    async function fetchAvailability() {
      try {
        const [blockedRes, bookingsRes] = await Promise.all([
          fetch(`/api/listings/${listingId}/blocked-dates`),
          fetch(`/api/listings/${listingId}/bookings?status=CONFIRMED,COMPLETED,PENDING&public=1`),
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
  const today = startOfDay(new Date())

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
    <Card className="mx-auto w-full max-w-[360px] overflow-hidden border border-primary/10 bg-gradient-to-br from-sky-50 via-white to-emerald-50 shadow-lg">
      <CardHeader className="bg-white/80 backdrop-blur-sm pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <CalendarX className="h-5 w-5 text-primary" />
          Kiểm tra phòng trống
        </CardTitle>
        <CardDescription className="text-sm text-slate-600">
          Xem nhanh ngày còn trống và những ngày đã được đặt hoặc tạm khoá.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pb-5 pt-4">
        <div className="rounded-xl border border-white/70 bg-white/90 px-3 pb-3 pt-4 shadow-sm">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            locale={vi}
            disabled={(date) => isBefore(date, today) || isDateBlocked(date)}
            modifiers={{
              blocked: (date) => isDateBlocked(date),
              available: (date) => !isDateBlocked(date) && !isBefore(date, today),
            }}
            modifiersStyles={{
              blocked: {
                backgroundColor: '#fee',
                color: '#b91c1c',
                textDecoration: 'line-through',
                borderRadius: '0.75rem',
              },
              available: {
                backgroundColor: '#ecfdf5',
                color: '#047857',
                borderRadius: '0.75rem',
              },
            }}
            className="mx-auto max-w-[240px] rounded-2xl border-none shadow-none [&_.rdp-day_selected]:bg-primary [&_.rdp-day_selected]:text-primary-foreground"
          />
        </div>

        {selectedDate && selectedDateStatus ? (
          <div className={`rounded-xl border border-transparent bg-white/80 p-4 shadow-sm ${selectedDateStatus.status === 'available' ? 'ring-1 ring-emerald-200' : 'ring-1 ring-red-200'}`}>
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${selectedDateStatus.status === 'available' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                {selectedDateStatus.status === 'available' ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <X className="h-5 w-5" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {format(selectedDate, 'EEEE, dd/MM/yyyy', { locale: vi })}
                </p>
                <p className="text-sm text-slate-600">{selectedDateStatus.reason}</p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="rounded-xl border border-white/80 bg-white/80 p-4 shadow-sm">
          <h4 className="text-sm font-semibold text-slate-900">Chú thích</h4>
          <div className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-lg border border-emerald-100 bg-emerald-50/60 px-3 py-2 text-emerald-700">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
              Còn trống
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-amber-100 bg-amber-50/60 px-3 py-2 text-amber-700">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500" />
              Đã đặt
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-rose-100 bg-rose-50/60 px-3 py-2 text-rose-700">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-rose-500" />
              Bị chặn
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
