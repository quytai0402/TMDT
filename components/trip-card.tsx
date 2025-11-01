"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Calendar, Users, MapPin, MessageCircle, FileText } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

type TripCardProps = {
  trip: {
    id: string
    listing: {
      id: string
      title: string
      city: string
      state?: string | null
      images: string[]
      host?: {
        id: string
        name: string | null
      }
    }
    host?: {
      id: string
      name: string | null
      image: string | null
    }
    checkIn: string
    checkOut: string
    adults: number
    children: number
    infants: number
    pets: number
    totalPrice: number
    status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "DECLINED" | "EXPIRED"
    canReview?: boolean
    hasReview?: boolean
    reviewUrl?: string | null
    review?: {
      id: string
    } | null
  }
}

const statusLabel: Record<TripCardProps["trip"]["status"], string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  COMPLETED: "Đã hoàn thành",
  CANCELLED: "Đã hủy",
  DECLINED: "Bị từ chối",
  EXPIRED: "Hết hiệu lực",
}

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
})

export function TripCard({ trip }: TripCardProps) {
  const router = useRouter()
  const [isMessaging, setIsMessaging] = useState(false)
  const [isPending, startTransition] = useTransition()

  const listingImage = trip.listing.images?.[0] ?? "/placeholder.svg"
  const bookingCode = useMemo(() => trip.id.slice(-8).toUpperCase(), [trip.id])
  const guests =
    (trip.adults ?? 0) + (trip.children ?? 0) + (trip.infants ?? 0) + (trip.pets ?? 0)
  const totalAmount = currencyFormatter.format(trip.totalPrice ?? 0)
  const locationLabel = [trip.listing.city, trip.listing.state].filter(Boolean).join(", ")
  const hostId = trip.host?.id ?? trip.listing.host?.id
  const hostName = trip.host?.name ?? trip.listing.host?.name ?? "Chủ nhà"
  const canReview = Boolean(trip.canReview)
  const hasReview = Boolean(trip.hasReview ?? (trip.review && trip.review.id))
  const reviewUrl = canReview ? (trip.reviewUrl || `/trips/${trip.id}/review`) : null

  const handleMessageHost = () => {
    if (!hostId) {
      router.push("/messages")
      return
    }

    setIsMessaging(true)
    startTransition(async () => {
      try {
        const response = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            participantId: hostId,
            listingId: trip.listing.id,
          }),
        })

        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || "Không thể tạo cuộc trò chuyện")
        }

        const conversationId =
          data.conversation?.id ??
          data.conversation?.conversationId ??
          undefined

        router.push(
          conversationId
            ? `/messages?conversation=${conversationId}`
            : `/messages`
        )
      } catch (error) {
        console.error("Failed to open conversation:", error)
        router.push("/messages")
      } finally {
        setIsMessaging(false)
      }
    })
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <Link href={`/listing/${trip.listing.id}`} className="flex-shrink-0">
            <img
              src={listingImage}
              alt={trip.listing.title}
              className="w-full md:w-64 h-48 rounded-lg object-cover hover:opacity-90 transition-opacity"
            />
          </Link>

          <div className="flex-1 space-y-4">
            <div>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <Link href={`/listing/${trip.listing.id}`}>
                    <h3 className="font-semibold text-xl text-foreground hover:text-primary transition-colors">
                      {trip.listing.title}
                    </h3>
                  </Link>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <MapPin className="h-4 w-4" />
                    <span>{locationLabel}</span>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  {statusLabel[trip.status] ?? "Đang xử lý"}
                </span>
              </div>

              <p className="text-sm text-muted-foreground">Chủ nhà: {hostName}</p>
              <p className="text-xs text-muted-foreground mt-1">Mã đặt phòng: {bookingCode}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Calendar className="h-4 w-4" />
                  <span>Nhận phòng</span>
                </div>
                <p className="font-medium text-foreground">
                  {new Date(trip.checkIn).toLocaleDateString("vi-VN")}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Calendar className="h-4 w-4" />
                  <span>Trả phòng</span>
                </div>
                <p className="font-medium text-foreground">
                  {new Date(trip.checkOut).toLocaleDateString("vi-VN")}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Users className="h-4 w-4" />
                  <span>Số khách</span>
                </div>
                <p className="font-medium text-foreground">{guests} khách</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-4 border-t border-border">
              <div>
                <span className="text-sm text-muted-foreground">Tổng thanh toán: </span>
                <span className="font-bold text-lg text-foreground">{totalAmount}</span>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/trips/${trip.id}`}>
                    <FileText className="mr-2 h-4 w-4" />
                    Chi tiết
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMessageHost}
                  disabled={isMessaging || isPending}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  {isMessaging || isPending ? "Đang mở chat..." : "Nhắn tin"}
                </Button>
                {canReview && reviewUrl ? (
                  <Button size="sm" className="bg-primary hover:bg-primary-hover" asChild>
                    <Link href={reviewUrl}>Đánh giá</Link>
                  </Button>
                ) : null}
                {!canReview && hasReview && trip.status === "COMPLETED" ? (
                  <Button size="sm" variant="outline" disabled>
                    Đã đánh giá
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
