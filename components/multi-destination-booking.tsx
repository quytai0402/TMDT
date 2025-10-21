"use client"

import { useState } from "react"
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
  DollarSign
} from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface Destination {
  id: string
  location: string
  checkIn?: Date
  checkOut?: Date
  listing?: {
    id: string
    title: string
    image: string
    price: number
    rating: number
  }
  guests: number
}

export function MultiDestinationBooking() {
  const [destinations, setDestinations] = useState<Destination[]>([
    {
      id: "1",
      location: "Đà Lạt",
      checkIn: new Date(2025, 9, 15),
      checkOut: new Date(2025, 9, 18),
      guests: 2,
      listing: {
        id: "1",
        title: "Villa Đà Lạt View Đẹp",
        image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400",
        price: 2500000,
        rating: 4.9,
      }
    },
    {
      id: "2",
      location: "Nha Trang",
      checkIn: new Date(2025, 9, 18),
      checkOut: new Date(2025, 9, 22),
      guests: 2,
      listing: {
        id: "2",
        title: "Căn hộ view biển Nha Trang",
        image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400",
        price: 1800000,
        rating: 4.8,
      }
    },
  ])

  const addDestination = () => {
    const lastDestination = destinations[destinations.length - 1]
    const newDestination: Destination = {
      id: Date.now().toString(),
      location: "",
      checkIn: lastDestination?.checkOut,
      guests: lastDestination?.guests || 2,
    }
    setDestinations([...destinations, newDestination])
  }

  const removeDestination = (id: string) => {
    if (destinations.length > 1) {
      setDestinations(destinations.filter(dest => dest.id !== id))
    }
  }

  const totalCost = destinations.reduce((sum, dest) => {
    if (dest.listing && dest.checkIn && dest.checkOut) {
      const nights = Math.ceil(
        (dest.checkOut.getTime() - dest.checkIn.getTime()) / (1000 * 60 * 60 * 24)
      )
      return sum + dest.listing.price * nights
    }
    return sum
  }, 0)

  const totalNights = destinations.reduce((sum, dest) => {
    if (dest.checkIn && dest.checkOut) {
      return sum + Math.ceil(
        (dest.checkOut.getTime() - dest.checkIn.getTime()) / (1000 * 60 * 60 * 24)
      )
    }
    return sum
  }, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Đặt nhiều điểm đến</h2>
          <p className="text-muted-foreground">
            Lập kế hoạch cho chuyến đi đa điểm của bạn
          </p>
        </div>
        <Button onClick={addDestination}>
          <Plus className="w-4 h-4 mr-2" />
          Thêm điểm đến
        </Button>
      </div>

      {/* Destinations */}
      <div className="space-y-4">
        {destinations.map((destination, index) => (
          <Card key={destination.id} className="p-6">
            <div className="flex items-start space-x-4">
              {/* Step Number */}
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  {index + 1}
                </div>
                {index < destinations.length - 1 && (
                  <div className="w-[2px] h-12 bg-border mx-auto mt-4" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 space-y-4">
                {/* Location Input */}
                <div>
                  <label className="text-sm font-medium mb-2 flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    Điểm đến {index + 1}
                  </label>
                  <Input
                    placeholder="Nhập địa điểm (VD: Đà Lạt, Nha Trang...)"
                    value={destination.location}
                    onChange={(e) => {
                      const updated = [...destinations]
                      updated[index].location = e.target.value
                      setDestinations(updated)
                    }}
                  />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Check-in
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !destination.checkIn && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {destination.checkIn ? (
                            format(destination.checkIn, "dd/MM/yyyy", { locale: vi })
                          ) : (
                            <span>Chọn ngày</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={destination.checkIn}
                          onSelect={(date) => {
                            const updated = [...destinations]
                            updated[index].checkIn = date
                            setDestinations(updated)
                          }}
                          locale={vi}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Check-out
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !destination.checkOut && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {destination.checkOut ? (
                            format(destination.checkOut, "dd/MM/yyyy", { locale: vi })
                          ) : (
                            <span>Chọn ngày</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={destination.checkOut}
                          onSelect={(date) => {
                            const updated = [...destinations]
                            updated[index].checkOut = date
                            setDestinations(updated)
                          }}
                          locale={vi}
                          disabled={(date) =>
                            destination.checkIn ? date <= destination.checkIn : false
                          }
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Guests */}
                <div>
                  <label className="text-sm font-medium mb-2 flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    Số khách
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={destination.guests}
                    onChange={(e) => {
                      const updated = [...destinations]
                      updated[index].guests = parseInt(e.target.value) || 1
                      setDestinations(updated)
                    }}
                  />
                </div>

                {/* Selected Listing */}
                {destination.listing && (
                  <Card className="p-4 bg-muted/50">
                    <div className="flex items-start space-x-4">
                      <img
                        src={destination.listing.image}
                        alt={destination.listing.title}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">
                          {destination.listing.title}
                        </h4>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
                          <Badge variant="secondary">
                            ⭐ {destination.listing.rating}
                          </Badge>
                          {destination.checkIn && destination.checkOut && (
                            <Badge variant="outline">
                              {Math.ceil(
                                (destination.checkOut.getTime() - destination.checkIn.getTime()) /
                                (1000 * 60 * 60 * 24)
                              )} đêm
                            </Badge>
                          )}
                        </div>
                        <p className="font-semibold text-primary">
                          {destination.listing.price.toLocaleString("vi-VN")}₫ / đêm
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Thay đổi
                      </Button>
                    </div>
                  </Card>
                )}

                {/* Search Listings Button */}
                {!destination.listing && destination.location && (
                  <Button variant="outline" className="w-full">
                    <Home className="w-4 h-4 mr-2" />
                    Tìm chỗ nghỉ tại {destination.location}
                  </Button>
                )}
              </div>

              {/* Remove Button */}
              {destinations.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeDestination(destination.id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Summary */}
      <Card className="p-6 bg-gradient-to-r from-primary/10 to-blue-500/10">
        <h3 className="font-semibold text-lg mb-4">Tóm tắt chuyến đi</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Điểm đến</div>
            <div className="text-2xl font-bold">{destinations.length}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Tổng đêm</div>
            <div className="text-2xl font-bold">{totalNights}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Số khách</div>
            <div className="text-2xl font-bold">{destinations[0]?.guests || 0}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Tổng chi phí</div>
            <div className="text-2xl font-bold text-primary">
              {totalCost.toLocaleString("vi-VN")}₫
            </div>
          </div>
        </div>
        <Button className="w-full" size="lg">
          <DollarSign className="w-4 h-4 mr-2" />
          Tiếp tục đặt phòng
        </Button>
      </Card>
    </div>
  )
}
