'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CalendarIcon, Users, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { useBooking } from '@/hooks/use-booking'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface BookingWidgetEnhancedProps {
  listingId: string
  pricePerNight: number
  maxGuests: number
  cleaningFee?: number
  serviceFee?: number
  bookedDates?: Date[]
}

export function BookingWidgetEnhanced({
  listingId,
  pricePerNight,
  maxGuests,
  cleaningFee = 0,
  serviceFee = 0,
  bookedDates = [],
}: BookingWidgetEnhancedProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const { createBooking, loading, error } = useBooking()

  const [checkIn, setCheckIn] = useState<Date>()
  const [checkOut, setCheckOut] = useState<Date>()
  const [adults, setAdults] = useState(2)
  const [children, setChildren] = useState(0)
  const [infants, setInfants] = useState(0)

  const totalGuests = adults + children

  // Calculate number of nights
  const nights = checkIn && checkOut 
    ? Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
    : 0

  // Calculate totals
  const subtotal = pricePerNight * nights
  const total = subtotal + cleaningFee + serviceFee

  const isDateBooked = (date: Date) => {
    return bookedDates.some(
      bookedDate => date.toDateString() === bookedDate.toDateString()
    )
  }

  const handleReserve = async () => {
    if (!session) {
      router.push('/login?callbackUrl=' + encodeURIComponent(window.location.pathname))
      return
    }

    if (!checkIn || !checkOut) {
      return
    }

    try {
      const booking = await createBooking({
        listingId,
        checkIn: format(checkIn, 'yyyy-MM-dd'),
        checkOut: format(checkOut, 'yyyy-MM-dd'),
        adults,
        children,
        infants,
      })

      // Redirect to payment
      router.push(`/booking/${booking.id}`)
    } catch (err) {
      console.error('Booking failed:', err)
    }
  }

  return (
    <Card className="sticky top-24">
      <CardHeader>
        <CardTitle className="flex items-baseline justify-between">
          <div>
            <span className="text-2xl font-bold">{pricePerNight.toLocaleString('vi-VN')}₫</span>
            <span className="text-sm font-normal text-muted-foreground ml-1">/ đêm</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Date Selection */}
        <div className="grid grid-cols-2 gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !checkIn && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {checkIn ? format(checkIn, 'dd/MM', { locale: vi }) : 'Nhận phòng'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={checkIn}
                onSelect={setCheckIn}
                disabled={(date) => date < new Date() || isDateBooked(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !checkOut && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {checkOut ? format(checkOut, 'dd/MM', { locale: vi }) : 'Trả phòng'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={checkOut}
                onSelect={setCheckOut}
                disabled={(date) => {
                  if (checkIn) {
                    return date <= checkIn || isDateBooked(date)
                  }
                  return date < new Date() || isDateBooked(date)
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Guest Selection */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal"
            >
              <Users className="mr-2 h-4 w-4" />
              {totalGuests} khách {infants > 0 && `+ ${infants} em bé`}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">Người lớn</div>
                  <div className="text-sm text-gray-500">Từ 13 tuổi trở lên</div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setAdults(Math.max(1, adults - 1))}
                    disabled={adults <= 1}
                  >
                    -
                  </Button>
                  <span className="w-8 text-center">{adults}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setAdults(Math.min(maxGuests - children, adults + 1))}
                    disabled={totalGuests >= maxGuests}
                  >
                    +
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">Trẻ em</div>
                  <div className="text-sm text-gray-500">Từ 2-12 tuổi</div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setChildren(Math.max(0, children - 1))}
                    disabled={children <= 0}
                  >
                    -
                  </Button>
                  <span className="w-8 text-center">{children}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setChildren(Math.min(maxGuests - adults, children + 1))}
                    disabled={totalGuests >= maxGuests}
                  >
                    +
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">Em bé</div>
                  <div className="text-sm text-gray-500">Dưới 2 tuổi</div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setInfants(Math.max(0, infants - 1))}
                    disabled={infants <= 0}
                  >
                    -
                  </Button>
                  <span className="w-8 text-center">{infants}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setInfants(Math.min(5, infants + 1))}
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Reserve Button */}
        <Button
          className="w-full"
          size="lg"
          onClick={handleReserve}
          disabled={!checkIn || !checkOut || totalGuests > maxGuests || loading}
        >
          {loading ? 'Đang xử lý...' : 'Đặt phòng'}
        </Button>

        {/* Price Breakdown */}
        {nights > 0 && (
          <>
            <Separator />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {pricePerNight.toLocaleString('vi-VN')}₫ x {nights} đêm
                </span>
                <span>{subtotal.toLocaleString('vi-VN')}₫</span>
              </div>
              {cleaningFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phí dọn dẹp</span>
                  <span>{cleaningFee.toLocaleString('vi-VN')}₫</span>
                </div>
              )}
              {serviceFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phí dịch vụ</span>
                  <span>{serviceFee.toLocaleString('vi-VN')}₫</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold text-base">
                <span>Tổng cộng</span>
                <span>{total.toLocaleString('vi-VN')}₫</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
