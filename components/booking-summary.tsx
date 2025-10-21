"use client"

import { Calendar, Users, Star } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

interface BookingSummaryProps {
  listing: {
    id: string
    title: string
    location: string
    price: number
    rating: number
    reviews: number
    image: string
    host: {
      name: string
      avatar: string
    }
    cleaningFee?: number
    serviceFee?: number
  }
  checkIn?: string
  checkOut?: string
  guests?: number
}

export function BookingSummary({ listing, checkIn: propCheckIn, checkOut: propCheckOut, guests: propGuests }: BookingSummaryProps) {
  const fallbackCheckIn = () => {
    const today = new Date()
    return today.toISOString().split("T")[0]
  }

  const fallbackCheckOut = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split("T")[0]
  }

  const checkIn = propCheckIn || fallbackCheckIn()
  const checkOut = propCheckOut || fallbackCheckOut()
  const guests = propGuests ?? 1

  const calculateNights = () => {
    const start = new Date(checkIn)
    const end = new Date(checkOut)
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  }

  const nights = calculateNights()
  const nightlyRate = Number.isFinite(listing.price) ? listing.price : 0
  const subtotal = nightlyRate * nights
  const cleaningFee = listing.cleaningFee ?? 0
  const serviceFee = listing.serviceFee ?? subtotal * 0.1
  const total = subtotal + serviceFee + cleaningFee

  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex space-x-4">
          <img
            src={listing.image || "/placeholder.svg"}
            alt={listing.title}
            className="w-24 h-24 rounded-lg object-cover"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">{listing.title}</h3>
            <p className="text-sm text-muted-foreground truncate">{listing.location}</p>
            <div className="flex items-center space-x-1 mt-1">
              <Star className="h-3 w-3 fill-foreground text-foreground" />
              <span className="text-sm font-semibold">
                {Number.isFinite(listing.rating) ? listing.rating : "--"}
              </span>
              <span className="text-xs text-muted-foreground">({Number.isFinite(listing.reviews) ? listing.reviews : 0})</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Separator />

        {/* Booking Details */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Nhận phòng</span>
            </div>
            <span className="text-sm font-medium">{new Date(checkIn).toLocaleDateString("vi-VN")}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Trả phòng</span>
            </div>
            <span className="text-sm font-medium">{new Date(checkOut).toLocaleDateString("vi-VN")}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Số khách</span>
            </div>
            <span className="text-sm font-medium">{guests} khách</span>
          </div>
        </div>

        <Separator />

        {/* Price Breakdown */}
        <div className="space-y-3">
          <h4 className="font-semibold text-foreground">Chi tiết giá</h4>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {nightlyRate.toLocaleString("vi-VN")}₫ x {nights} đêm
            </span>
            <span className="text-foreground">{subtotal.toLocaleString("vi-VN")}₫</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Phí dịch vụ</span>
            <span className="text-foreground">{serviceFee.toLocaleString("vi-VN")}₫</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Phí vệ sinh</span>
            <span className="text-foreground">{cleaningFee.toLocaleString("vi-VN")}₫</span>
          </div>
        </div>

        <Separator />

        {/* Total */}
        <div className="flex justify-between items-center">
          <span className="font-semibold text-lg text-foreground">Tổng cộng</span>
          <span className="font-bold text-2xl text-foreground">{total.toLocaleString("vi-VN")}₫</span>
        </div>

        {/* Cancellation Policy */}
        <div className="pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold">Chính sách hủy:</span> Miễn phí hủy trong vòng 48 giờ. Sau đó sẽ được hoàn
            50% nếu hủy trước 7 ngày.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
