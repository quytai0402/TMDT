"use client"

import { useEffect, useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  MapPin,
  Plus,
  Calendar as CalendarIcon,
  Home,
  Users,
  Trash2,
  ArrowRight,
  DollarSign,
} from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Link from "next/link"
import { DESTINATIONS } from "@/data/destinations"

export type ListingPreview = {
  id: string
  title: string
  image?: string | null
  price?: number | null
  rating?: number | null
}

export type TripStop = {
  id: string
  destinationSlug: string
  checkIn?: Date
  checkOut?: Date
  guests: number
  listing?: ListingPreview
}

interface MultiDestinationBookingProps {
  initialStops?: TripStop[]
}

const DEFAULT_RATING = 4.8

const addDays = (date: Date, days: number) => {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

const buildListingPreview = (slug: string): ListingPreview | undefined => {
  const destination = DESTINATIONS.find((item) => item.slug === slug)
  if (!destination) return undefined
  const stay = destination.stays[0]
  if (!stay) {
    return {
      id: slug,
      title: destination.name,
      image: destination.heroImage,
      price: destination.avgPrice,
      rating: DEFAULT_RATING,
    }
  }

    return {
      id: stay.slug,
      title: stay.title,
      image: stay.images[0] ?? destination.heroImage,
      price: stay.pricePerNight,
      rating: DEFAULT_RATING,
    }
}

const normalizeStops = (stops?: TripStop[]): TripStop[] => {
  if (!Array.isArray(stops)) return []
  return stops.map((stop, index) => {
    const checkIn = stop.checkIn instanceof Date
      ? stop.checkIn
      : stop.checkIn
        ? new Date(stop.checkIn)
        : undefined
    const checkOut = stop.checkOut instanceof Date
      ? stop.checkOut
      : stop.checkOut
        ? new Date(stop.checkOut)
        : undefined

    return {
      id: typeof stop.id === "string" && stop.id ? stop.id : `stop-${index}`,
      destinationSlug: stop.destinationSlug || `slug-${index}`,
      checkIn,
      checkOut,
      guests: Math.max(1, Number.isFinite(stop.guests) ? Number(stop.guests) : 1),
      listing: stop.listing,
    }
  })
}

export function MultiDestinationBooking({ initialStops }: MultiDestinationBookingProps) {
  const destinationOptions = useMemo(
    () =>
      DESTINATIONS.map((destination) => ({
        slug: destination.slug,
        name: destination.name,
        heroImage: destination.heroImage,
        avgPrice: destination.avgPrice,
      })),
    []
  )

  const destinationMap = useMemo(
    () => new Map(destinationOptions.map((item) => [item.slug, item])),
    [destinationOptions]
  )

  const [destinations, setDestinations] = useState<TripStop[]>(() => normalizeStops(initialStops))

  useEffect(() => {
    setDestinations(normalizeStops(initialStops))
  }, [initialStops])

  const addDestination = () => {
    const lastStop = destinations[destinations.length - 1]
    const fallback = destinationOptions[destinations.length % destinationOptions.length]
    const newStop: TripStop = {
      id: `${fallback.slug}-${Date.now()}`,
      destinationSlug: fallback.slug,
      checkIn: lastStop?.checkOut ? addDays(lastStop.checkOut, 1) : undefined,
      checkOut: lastStop?.checkOut ? addDays(lastStop.checkOut, 3) : undefined,
      guests: lastStop?.guests ?? 2,
      listing: buildListingPreview(fallback.slug),
    }
    setDestinations((prev) => [...prev, newStop])
  }

  const removeDestination = (id: string) => {
    setDestinations((prev) => prev.filter((stop) => stop.id !== id))
  }

  const totalCost = destinations.reduce((sum, stop) => {
    if (!stop.listing || typeof stop.listing.price !== "number" || !stop.checkIn || !stop.checkOut) {
      return sum
    }
    const nights = Math.max(
      1,
      Math.ceil((stop.checkOut.getTime() - stop.checkIn.getTime()) / (1000 * 60 * 60 * 24))
    )
    return sum + stop.listing.price * nights
  }, 0)

  const totalNights = destinations.reduce((sum, stop) => {
    if (!stop.checkIn || !stop.checkOut) return sum
    return (
      sum +
      Math.max(
        1,
        Math.ceil((stop.checkOut.getTime() - stop.checkIn.getTime()) / (1000 * 60 * 60 * 24))
      )
    )
  }, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Đặt nhiều điểm đến</h2>
          <p className="text-muted-foreground">
            Lập kế hoạch cho hành trình xuyên Việt với các điểm đến đã tuyển chọn sẵn.
          </p>
        </div>
        <Button onClick={addDestination}>
          <Plus className="w-4 h-4 mr-2" />
          Thêm điểm đến
        </Button>
      </div>

      <div className="space-y-4">
        {destinations.length === 0 && (
          <Card className="p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Chưa có điểm đến nào trong planner. Thêm điểm dừng để bắt đầu xây dựng hành trình nhiều thành phố.
            </p>
          </Card>
        )}

        {destinations.map((stop, index) => {
          const destinationInfo = destinationMap.get(stop.destinationSlug)
          return (
            <Card key={stop.id} className="p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  {index < destinations.length - 1 && (
                    <div className="w-[2px] h-12 bg-border mx-auto mt-4" />
                  )}
                </div>

                <div className="flex-1 space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      Điểm đến {index + 1}
                    </label>
                    <Select
                      value={stop.destinationSlug}
                      onValueChange={(value) => {
                        setDestinations((prev) => {
                          const next = [...prev]
                          const draft = { ...next[index], destinationSlug: value, listing: buildListingPreview(value) }
                          next[index] = draft
                          return next
                        })
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn điểm đến" />
                      </SelectTrigger>
                      <SelectContent>
                        {destinationOptions.map((option) => (
                          <SelectItem key={option.slug} value={option.slug}>
                            {option.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Check-in</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !stop.checkIn && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {stop.checkIn ? (
                              format(stop.checkIn, "dd/MM/yyyy", { locale: vi })
                            ) : (
                              <span>Chọn ngày</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={stop.checkIn}
                            onSelect={(date) => {
                              setDestinations((prev) => {
                                const next = [...prev]
                                next[index] = { ...next[index], checkIn: date ?? undefined }
                                return next
                              })
                            }}
                            locale={vi}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Check-out</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !stop.checkOut && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {stop.checkOut ? (
                              format(stop.checkOut, "dd/MM/yyyy", { locale: vi })
                            ) : (
                              <span>Chọn ngày</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={stop.checkOut}
                            onSelect={(date) => {
                              setDestinations((prev) => {
                                const next = [...prev]
                                next[index] = { ...next[index], checkOut: date ?? undefined }
                                return next
                              })
                            }}
                            locale={vi}
                            disabled={(date) => (stop.checkIn ? date <= stop.checkIn : false)}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      Số khách
                    </label>
                    <Input
                      type="number"
                      min={1}
                      value={stop.guests}
                      onChange={(event) => {
                        const value = Number(event.target.value) || 1
                        setDestinations((prev) => {
                          const next = [...prev]
                          next[index] = { ...next[index], guests: Math.max(1, value) }
                          return next
                        })
                      }}
                    />
                  </div>

                  {stop.listing && (
                    <Card className="p-4 bg-muted/40">
                      <div className="flex items-start gap-4">
                        <img
                          src={stop.listing.image ?? "/placeholder.svg"}
                          alt={stop.listing.title}
                          className="w-20 h-20 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">{stop.listing.title}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            {typeof stop.listing.rating === "number" && stop.listing.rating > 0 ? (
                              <Badge variant="secondary">⭐ {stop.listing.rating.toFixed(1)}</Badge>
                            ) : null}
                            {destinationInfo && <Badge variant="outline">{destinationInfo.name}</Badge>}
                            {stop.checkIn && stop.checkOut && (
                              <Badge variant="outline">
                                {Math.max(
                                  1,
                                  Math.ceil(
                                    (stop.checkOut.getTime() - stop.checkIn.getTime()) /
                                      (1000 * 60 * 60 * 24)
                                  )
                                )}{" "}
                                đêm
                              </Badge>
                            )}
                          </div>
                          <p className="font-semibold text-primary">
                            {typeof stop.listing.price === "number" && stop.listing.price > 0
                              ? `${stop.listing.price.toLocaleString("vi-VN")}₫ / đêm`
                              : "Đang cập nhật giá"}
                          </p>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/search?city=${encodeURIComponent(destinationInfo?.name ?? "")}`}>
                            Xem thêm
                          </Link>
                        </Button>
                      </div>
                    </Card>
                  )}
                </div>

                {destinations.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDestination(stop.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      <Card className="p-6 bg-gradient-to-r from-primary/10 to-blue-500/10">
        <h3 className="font-semibold text-lg mb-4">Tóm tắt chuyến đi</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Điểm đến</div>
            <div className="text-2xl font-bold">{destinations.length}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Tổng đêm lưu trú</div>
            <div className="text-2xl font-bold">{totalNights}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Số khách</div>
            <div className="text-2xl font-bold">
              {destinations.reduce((sum, stop) => sum + stop.guests, 0)}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Ước tính chi phí</div>
            <div className="text-2xl font-bold text-primary">
              {totalCost.toLocaleString("vi-VN")}₫
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {destinationOptions.map((option) => (
            <Badge key={option.slug} variant="outline">
              {option.name}
            </Badge>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <Button asChild size="lg" className="bg-primary">
            <Link href="/search">
              <Home className="w-4 h-4 mr-2" />
              Khám phá chỗ nghỉ tương ứng
            </Link>
          </Button>
          <Button variant="secondary" size="lg">
            <DollarSign className="w-4 h-4 mr-2" />
            Nhờ concierge tối ưu chi phí
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Gợi ý tiếp theo</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Đồng bộ lịch check-in / check-out</p>
              <p className="text-sm text-muted-foreground">
                Tự động đề xuất thời gian di chuyển giữa các điểm đến.
              </p>
            </div>
            <Button variant="outline" size="sm">
              Tự động sắp xếp
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Chia sẻ kế hoạch cho bạn đồng hành</p>
              <p className="text-sm text-muted-foreground">
                Gửi link xem và chỉnh sửa kế hoạch tới nhóm của bạn.
              </p>
            </div>
            <Button variant="ghost" size="sm">
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
