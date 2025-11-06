"use client"

import { useEffect, useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { 
  Car,
  MapPin,
  Calendar as CalendarIcon,
  Users,
  Clock,
  Plane,
  Info,
  Check,
  Phone,
  Loader2
} from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { useConciergeContext } from "@/components/concierge-context-provider"

interface TransportOption {
  id: string
  type: "airport" | "car-rental" | "taxi" | "tour"
  name: string
  description: string
  vehicle: string
  capacity: number
  price: number
  duration: string
  icon: any
  features: string[]
}

export function TransportationBooking() {
  const { toast } = useToast()
  const { context } = useConciergeContext()
  const [selectedTransport, setSelectedTransport] = useState<string | null>(null)
  const [pickupDate, setPickupDate] = useState<Date>()
  const [pickupTime, setPickupTime] = useState("09:00")
  const [pickupLocation, setPickupLocation] = useState("")
  const [dropoffLocation, setDropoffLocation] = useState("")
  const [passengers, setPassengers] = useState(2)
  const [notes, setNotes] = useState("")
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [bookingLoading, setBookingLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const transportOptions: TransportOption[] = [
    {
      id: "airport-pickup",
      type: "airport",
      name: "Đưa đón sân bay",
      description: "Dịch vụ đưa đón sân bay 2 chiều",
      vehicle: "Sedan 4 chỗ (Toyota Vios hoặc tương đương)",
      capacity: 4,
      price: 500000,
      duration: "45 phút",
      icon: Plane,
      features: [
        "Tài xế chuyên nghiệp",
        "Xe đời mới, có điều hòa",
        "Nước uống miễn phí",
        "Theo dõi chuyến bay",
        "Đón tận cửa",
      ],
    },
    {
      id: "car-rental",
      type: "car-rental",
      name: "Thuê xe tự lái",
      description: "Thuê xe theo ngày với giá ưu đãi",
      vehicle: "Toyota Vios hoặc Honda City",
      capacity: 5,
      price: 800000,
      duration: "Cả ngày",
      icon: Car,
      features: [
        "Xe đời mới (2022-2024)",
        "Bảo hiểm đầy đủ",
        "Xăng đầy bình",
        "Không giới hạn km",
        "Giao nhận tại chỗ nghỉ",
      ],
    },
    {
      id: "taxi-booking",
      type: "taxi",
      name: "Đặt taxi",
      description: "Gọi taxi đi bất kỳ đâu trong thành phố",
      vehicle: "Taxi 4-7 chỗ",
      capacity: 7,
      price: 15000,
      duration: "Theo km",
      icon: Car,
      features: [
        "Tính giá theo km",
        "Có hóa đơn",
        "Tài xế địa phương",
        "Đón nhanh chóng",
        "Thanh toán linh hoạt",
      ],
    },
    {
      id: "city-tour",
      type: "tour",
      name: "Tour tham quan",
      description: "Xe + hướng dẫn viên cho nhóm",
      vehicle: "Van 16 chỗ hoặc xe bus",
      capacity: 16,
      price: 1200000,
      duration: "8 giờ",
      icon: Users,
      features: [
        "Hướng dẫn viên tiếng Việt",
        "Lịch trình linh hoạt",
        "Bao vé tham quan",
        "Ăn trưa tại nhà hàng",
        "Nước uống suốt tour",
      ],
    },
  ]

  const selectedOption = transportOptions.find(t => t.id === selectedTransport)
  const contextKey = useMemo(() => JSON.stringify(context ?? {}), [context])

  useEffect(() => {
    let cancelled = false

    const resolveBooking = async () => {
      try {
        if (context?.bookingId) {
          if (!cancelled) {
            setBookingId(context.bookingId)
            setBookingLoading(false)
          }
          return
        }

        const params = new URLSearchParams({ includeLatestBooking: "true" })
        const response = await fetch(`/api/concierge/context?${params.toString()}`, {
          cache: 'no-store',
        })

        if (!response.ok) {
          throw new Error('Không thể lấy thông tin đặt phòng gần nhất')
        }

        const data = await response.json() as { latestBooking?: { id?: string } }
        if (!cancelled) {
          setBookingId(data.latestBooking?.id ?? null)
        }
      } catch (error) {
        console.error('Failed to resolve booking context for transport:', error)
        if (!cancelled) {
          setBookingId(null)
        }
      } finally {
        if (!cancelled) {
          setBookingLoading(false)
        }
      }
    }

    void resolveBooking()

    return () => {
      cancelled = true
    }
  }, [contextKey])

  const handleBooking = async () => {
    if (!selectedOption) {
      toast({ variant: "destructive", title: "Chọn dịch vụ", description: "Vui lòng chọn loại xe trước khi xác nhận." })
      return
    }

    if (!bookingId) {
      toast({ variant: "destructive", title: "Chưa có chuyến đi", description: "Bạn cần có chuyến đi đang hoạt động để thêm dịch vụ. Concierge có thể hỗ trợ khi bạn đã đặt phòng." })
      return
    }

    setIsSubmitting(true)

    try {
      const pickupDateIso = pickupDate ? pickupDate.toISOString() : undefined
      const quantityLabelParts: string[] = []
      if (passengers) quantityLabelParts.push(`${passengers} khách`)
      if (pickupDateIso) {
        const readable = pickupDate ? format(pickupDate, "dd/MM/yyyy", { locale: vi }) : ""
        quantityLabelParts.push(`${readable} • ${pickupTime}`)
      }

      const payload = {
        catalogId: selectedOption.id,
        name: selectedOption.name,
        type: selectedOption.type,
        price: selectedOption.price,
        currency: "VND",
        quantityLabel: quantityLabelParts.join(" • ") || undefined,
        notes: notes || undefined,
        scheduledFor: pickupDateIso,
        pickup: {
          location: pickupLocation || undefined,
          time: pickupTime,
          date: pickupDateIso,
        },
        dropoffLocation: dropoffLocation || undefined,
        planner: {
          type: "activity" as const,
          date: pickupDateIso,
          time: pickupTime,
          location: dropoffLocation || pickupLocation || undefined,
          notes: notes || undefined,
        },
        metadata: {
          passengers,
          duration: selectedOption.duration,
          vehicle: selectedOption.vehicle,
        },
      }

      const response = await fetch(`/api/bookings/${bookingId}/services`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}))
        throw new Error(errorBody.error || "Không thể tạo yêu cầu concierge")
      }

      toast({
        title: "Đã gửi concierge",
        description: "Concierge đang xử lý yêu cầu đặt xe của bạn. Chúng tôi sẽ liên hệ xác nhận trong ít phút.",
      })

      setSelectedTransport(null)
      setPickupDate(undefined)
      setPickupTime("09:00")
      setPickupLocation("")
      setDropoffLocation("")
      setPassengers(2)
      setNotes("")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Đặt xe không thành công",
        description: error instanceof Error ? error.message : "Vui lòng thử lại sau ít phút",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Đặt xe & vận chuyển</h2>
        <p className="text-muted-foreground">
          Dịch vụ di chuyển tiện lợi cho chuyến đi của bạn
        </p>
        {!bookingLoading && !bookingId && (
          <p className="text-sm text-amber-600 mt-2">
            Bạn chưa có chuyến đi nào để gắn dịch vụ. Concierge sẽ lưu yêu cầu khi bạn có đặt phòng đang hoạt động.
          </p>
        )}
      </div>

      {/* Transport Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {transportOptions.map(option => {
          const Icon = option.icon
          const isSelected = selectedTransport === option.id
          
          return (
            <Card
              key={option.id}
              className={cn(
                "p-6 cursor-pointer transition-all hover:shadow-lg",
                isSelected && "ring-2 ring-primary bg-primary/5"
              )}
              onClick={() => setSelectedTransport(option.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-3">
                  <div className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center",
                    isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{option.name}</h3>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Car className="w-4 h-4" />
                  <span>{option.vehicle}</span>
                </div>
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>Tối đa {option.capacity} người</span>
                </div>
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{option.duration}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <p className="text-xs text-muted-foreground">Giá từ</p>
                  <p className="text-xl font-bold text-primary">
                    {option.price.toLocaleString("vi-VN")}₫
                  </p>
                </div>
                {isSelected && (
                  <Badge>Đã chọn</Badge>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {/* Booking Form */}
      {selectedOption && (
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4">Thông tin đặt xe</h3>
          
          <div className="space-y-4">
            {/* Date & Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Ngày đón</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal mt-2",
                        !pickupDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {pickupDate ? format(pickupDate, "dd/MM/yyyy", { locale: vi }) : "Chọn ngày"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={pickupDate}
                      onSelect={setPickupDate}
                      locale={vi}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>Giờ đón</Label>
                <Input
                  type="time"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>

            {/* Locations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Điểm đón</Label>
                <div className="relative mt-2">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="VD: Sân bay Tân Sơn Nhất"
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label>Điểm đến</Label>
                <div className="relative mt-2">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="VD: Khách sạn ABC"
                    value={dropoffLocation}
                    onChange={(e) => setDropoffLocation(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Passengers */}
            <div>
              <Label>Số hành khách</Label>
              <Input
                type="number"
                min="1"
                max={selectedOption.capacity}
                value={passengers}
                onChange={(e) => setPassengers(parseInt(e.target.value))}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Tối đa {selectedOption.capacity} người
              </p>
            </div>

            {/* Notes */}
            <div>
              <Label>Ghi chú (không bắt buộc)</Label>
              <Textarea
                placeholder="VD: Có 2 vali lớn, cần ghế trẻ em..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-2"
                rows={3}
              />
            </div>

            {/* Features */}
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Info className="w-4 h-4 text-primary" />
                <p className="font-medium text-sm">Bao gồm:</p>
              </div>
              <ul className="space-y-2">
                {selectedOption.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center space-x-2 text-sm">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Price Summary */}
            <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Phí dịch vụ</span>
                <span className="font-medium">{selectedOption.price.toLocaleString("vi-VN")}₫</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="font-semibold">Tổng cộng</span>
                <span className="text-xl font-bold text-primary">
                  {selectedOption.price.toLocaleString("vi-VN")}₫
                </span>
              </div>
            </div>

            {/* Submit */}
            <Button className="w-full" size="lg" onClick={handleBooking} disabled={isSubmitting || bookingLoading}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang gửi concierge...
                </>
              ) : (
                <>
                  <Car className="w-4 h-4 mr-2" />
                  Xác nhận đặt xe
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Chúng tôi sẽ liên hệ xác nhận trong vòng 5-10 phút
            </p>
          </div>
        </Card>
      )}

      {/* Contact */}
      <Card className="p-6 bg-gradient-to-r from-primary/10 to-blue-500/10">
        <h3 className="font-semibold mb-3">Cần hỗ trợ?</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Liên hệ concierge 24/7 để được tư vấn và đặt xe nhanh chóng
        </p>
        <div className="flex items-center space-x-3">
          <Button variant="outline" className="flex-1">
            <Car className="w-4 h-4 mr-2" />
            Chat với concierge
          </Button>
          <Button variant="outline">
            <Phone className="w-4 h-4 mr-2" />
            Hotline
          </Button>
        </div>
      </Card>
    </div>
  )
}
