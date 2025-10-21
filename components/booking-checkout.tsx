"use client"

import { useMemo, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { BookingSummary } from "@/components/booking-summary"
import { GuestInfoForm, GuestInfo } from "@/components/guest-info-form"
import { PaymentMethods } from "@/components/payment-methods"
import { useToast } from "@/hooks/use-toast"
import { useAuthModal } from "@/hooks/use-auth-modal"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface HostInfo {
  name?: string | null
  image?: string | null
}

interface ListingCheckoutData {
  id: string
  title: string
  basePrice: number
  cleaningFee?: number
  serviceFee?: number
  city?: string | null
  state?: string | null
  country?: string | null
  images?: string[] | null
  averageRating?: number | null
  reviews?: { id: string }[]
  reviewsCount?: number
  host?: HostInfo | null
}

interface BookingCheckoutProps {
  listing: ListingCheckoutData
  initialCheckIn?: string
  initialCheckOut?: string
  initialGuests?: number
}

type StepStatus = "completed" | "current" | "upcoming"

interface CheckoutStep {
  id: number
  title: string
  description: string
  status: StepStatus
}

const formatForInput = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const toISODate = (value: string) => {
  const [year, month, day] = value.split("-").map(Number)
  const date = new Date(year, (month ?? 1) - 1, day, 12, 0, 0)
  return date.toISOString()
}

const calculateNights = (checkIn: string, checkOut: string) => {
  const start = new Date(checkIn)
  const end = new Date(checkOut)
  const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : 0
}

export function BookingCheckout({
  listing,
  initialCheckIn,
  initialCheckOut,
  initialGuests,
}: BookingCheckoutProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const authModal = useAuthModal()

  const today = new Date()
  const defaultCheckIn = initialCheckIn || formatForInput(today)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const defaultCheckOut = initialCheckOut || formatForInput(tomorrow)

  const [checkIn, setCheckIn] = useState(defaultCheckIn)
  const [checkOut, setCheckOut] = useState(defaultCheckOut)
  const [guests, setGuests] = useState(initialGuests ?? 1)
  const [guestInfo, setGuestInfo] = useState<GuestInfo>({
    fullName: "",
    phone: "",
    email: "",
    specialRequests: "",
  })
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookingCode, setBookingCode] = useState<string | null>(null)
  const paymentSectionRef = useRef<HTMLDivElement | null>(null)

  const summaryListing = useMemo(() => {
    const locationParts = [listing.city, listing.state, listing.country].filter(Boolean)
    const location = locationParts.length > 0 ? locationParts.join(", ") : "Việt Nam"

    const basePrice = typeof listing.basePrice === "number" ? listing.basePrice : 0

    return {
      id: listing.id,
      title: listing.title,
      location,
      price: basePrice,
      rating: listing.averageRating ?? 4.8,
      reviews: listing.reviewsCount ?? listing.reviews?.length ?? 0,
      image: listing.images?.[0] || "/placeholder.svg",
      host: {
        name: listing.host?.name ?? "Host",
        avatar: listing.host?.image ?? "/placeholder.svg",
      },
      cleaningFee: listing.cleaningFee ?? 0,
      serviceFee: listing.serviceFee ?? undefined,
    }
  }, [listing])

  const nights = calculateNights(checkIn, checkOut)
  const nightlyRate = typeof listing.basePrice === "number" ? listing.basePrice : 0
  const subtotal = nightlyRate * nights
  const cleaningFee = listing.cleaningFee ?? 0
  const serviceFee = listing.serviceFee ?? subtotal * 0.1
  const totalAmount = subtotal + cleaningFee + serviceFee
  const tripInfoValid = nights > 0
  const guestInfoCompleted = Boolean(
    guestInfo.fullName.trim() &&
    guestInfo.phone.trim() &&
    guestInfo.email.trim()
  )
  const bookingCreated = Boolean(bookingId)

  const steps = useMemo<CheckoutStep[]>(() => {
    const step1Status: StepStatus = tripInfoValid ? "completed" : "current"
    let step2Status: StepStatus = "upcoming"

    if (tripInfoValid) {
      step2Status = bookingCreated ? "completed" : "current"
    }

    const step3Status: StepStatus = bookingCreated ? "current" : "upcoming"

    return [
      {
        id: 1,
        title: "Thông tin chuyến đi",
        description: "Chọn ngày nhận - trả phòng và số khách",
        status: step1Status,
      },
      {
        id: 2,
        title: "Thông tin khách hàng",
        description: "Liên hệ, số điện thoại và ghi chú cho chủ nhà",
        status: !tripInfoValid ? "upcoming" : step2Status,
      },
      {
        id: 3,
        title: "Thanh toán",
        description: "Chọn phương thức và hoàn tất thanh toán",
        status: step3Status,
      },
    ]
  }, [tripInfoValid, bookingCreated])

  const handleCheckInChange = (value: string) => {
    setCheckIn(value)

    if (!value) {
      return
    }

    const checkInDate = new Date(value)
    const currentCheckout = new Date(checkOut)

    if (!checkOut || !(currentCheckout instanceof Date) || currentCheckout <= checkInDate) {
      const next = new Date(checkInDate)
      next.setDate(next.getDate() + 1)
      setCheckOut(formatForInput(next))
    }
  }

  const canCreateBooking = tripInfoValid && guestInfoCompleted
  const confirmButtonLabel = isSubmitting
    ? "Đang tạo đặt phòng..."
    : bookingCreated
      ? "Tạo lại đơn đặt phòng"
      : "Xác nhận & tạo đơn đặt phòng"

  const handleCreateBooking = async () => {
    if (!checkIn || !checkOut || nights <= 0) {
      toast({
        title: "Ngày đặt phòng chưa hợp lệ",
        description: "Vui lòng kiểm tra lại ngày nhận và trả phòng.",
        variant: "destructive",
      })
      return
    }

    if (!guestInfo.fullName.trim() || !guestInfo.phone.trim() || !guestInfo.email.trim()) {
      toast({
        title: "Thiếu thông tin liên hệ",
        description: "Vui lòng cung cấp đầy đủ họ tên, số điện thoại và email để tiếp tục.",
        variant: "destructive",
      })
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestInfo.email.trim())) {
      toast({
        title: "Email chưa hợp lệ",
        description: "Vui lòng kiểm tra lại địa chỉ email.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing.id,
          checkIn: toISODate(checkIn),
          checkOut: toISODate(checkOut),
          adults: guests,
          children: 0,
          infants: 0,
          pets: 0,
          specialRequests: guestInfo.specialRequests,
          guestName: guestInfo.fullName.trim(),
          guestPhone: guestInfo.phone.trim(),
          guestEmail: guestInfo.email.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data?.conflict) {
          const formatter = new Intl.DateTimeFormat("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
          const conflictRange = `${formatter.format(new Date(data.conflict.checkIn))} - ${formatter.format(
            new Date(data.conflict.checkOut),
          )}`
          throw new Error(`${data.error || "Khoảng thời gian đã kín."} (${conflictRange})`)
        }

        if (data?.blocked) {
          const formatter = new Intl.DateTimeFormat("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
          const blockedRange = `${formatter.format(new Date(data.blocked.startDate))} - ${formatter.format(
            new Date(data.blocked.endDate),
          )}`
          throw new Error(`${data.error || "Khoảng thời gian đã bị chặn."} (${blockedRange})`)
        }

        throw new Error(data?.error || "Không thể tạo đặt phòng.")
      }

      const booking = data.booking || data
      setBookingId(booking.id)
      setBookingCode(booking.id?.slice(-8).toUpperCase?.() || null)

      // Award loyalty points & quests for logged-in users (async)
      if (session?.user) {
        import("@/lib/rewards").then(({ awardBookingPoints }) => {
          awardBookingPoints(booking.id, false).catch((err) =>
            console.error("Failed to award booking points:", err),
          )
        })

        import("@/lib/quests").then(({ trackBookingQuest }) => {
          trackBookingQuest(booking.id, false).catch((err) =>
            console.error("Failed to track booking quest:", err),
          )
        })
      }

      toast({
        title: "Đã tạo đơn đặt phòng",
        description: "Bạn có thể tiếp tục lựa chọn phương thức thanh toán để hoàn tất.",
      })

      setTimeout(() => {
        paymentSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 400)
    } catch (error: any) {
      console.error("Create booking error:", error)
      toast({
        title: "Không thể tạo đặt phòng",
        description: error.message || "Vui lòng thử lại sau.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-border bg-background/60 p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
          {steps.map((step, index) => {
            const isCompleted = step.status === "completed"
            const isCurrent = step.status === "current"
            const circleClasses = [
              "flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
              isCompleted
                ? "border-primary bg-primary text-primary-foreground"
                : isCurrent
                  ? "border-primary text-primary"
                  : "border-muted-foreground text-muted-foreground",
            ].join(" ")
            const titleClasses = [
              "text-sm font-semibold",
              isCompleted
                ? "text-foreground"
                : isCurrent
                  ? "text-primary"
                  : "text-muted-foreground",
            ].join(" ")

            return (
              <div key={step.id} className="flex flex-1 items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className={circleClasses}>{step.id}</div>
                  <div className="space-y-1">
                    <p className={titleClasses}>{step.title}</p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && <div className="hidden lg:block h-px flex-1 bg-border" />}
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Bước 1 · Thông tin chuyến đi</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Điều chỉnh ngày nhận - trả phòng và số khách trước khi tiếp tục.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="checkIn">Nhận phòng</Label>
                  <Input
                    id="checkIn"
                    type="date"
                    value={checkIn}
                    min={formatForInput(new Date())}
                    onChange={(e) => handleCheckInChange(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="checkOut">Trả phòng</Label>
                  <Input
                    id="checkOut"
                    type="date"
                    value={checkOut}
                    min={checkIn}
                    onChange={(e) => setCheckOut(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="guests">Số khách</Label>
                <Input
                  id="guests"
                  type="number"
                  min={1}
                  value={guests}
                  onChange={(e) => setGuests(Math.max(1, Number(e.target.value)))}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Bạn có thể điều chỉnh thông tin trên nếu kế hoạch thay đổi trước khi thanh toán.
              </p>

              {!tripInfoValid && (
                <Alert className="bg-amber-50 border-amber-200 text-amber-800">
                  <AlertDescription>
                    Ngày trả phòng phải sau ngày nhận phòng. Vui lòng chọn lại để tiếp tục.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <GuestInfoForm
            onInfoChange={setGuestInfo}
            onLoginClick={authModal.openLogin}
            titlePrefix="Bước 2 ·"
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Bước 3 · Xác nhận đặt phòng</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Lưu thông tin liên hệ để tạo yêu cầu đặt phòng trước khi chuyển sang thanh toán.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {!guestInfoCompleted && (
                <Alert className="bg-amber-50 border-amber-200 text-amber-800">
                  <AlertDescription>
                    Vui lòng điền đầy đủ họ tên, số điện thoại và email để tạo đơn đặt phòng.
                  </AlertDescription>
                </Alert>
              )}
              <Button
                type="button"
                className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-6 text-lg"
                onClick={handleCreateBooking}
                disabled={isSubmitting || !canCreateBooking}
              >
                {confirmButtonLabel}
              </Button>

              {bookingId ? (
                <Alert className="bg-green-50 border-green-200">
                  <AlertDescription className="text-sm text-green-700">
                    Đặt phòng đã được tạo thành công.
                    {bookingCode && (
                      <>
                        {" "}
                        Mã đặt phòng:{" "}
                        <span className="font-semibold text-green-900">{bookingCode}</span>.
                      </>
                    )}{" "}
                    Tiếp tục thanh toán để hoàn tất.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertDescription className="text-sm text-blue-700">
                    Vui lòng hoàn tất thông tin khách và xác nhận đặt phòng trước khi thanh toán.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <div id="payment-section" ref={paymentSectionRef} className="scroll-mt-24">
            <PaymentMethods
              bookingId={bookingId ?? undefined}
              amount={totalAmount}
              bookingCode={bookingCode ?? undefined}
              disabled={!bookingCreated}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="sticky top-24 space-y-4">
            <BookingSummary
              listing={summaryListing}
              checkIn={checkIn}
              checkOut={checkOut}
              guests={guests}
            />
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Chi tiết chi phí</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Tiền phòng</span>
                  <span>{subtotal.toLocaleString("vi-VN")}₫</span>
                </div>
                <div className="flex justify-between">
                  <span>Phí dọn dẹp</span>
                  <span>{cleaningFee.toLocaleString("vi-VN")}₫</span>
                </div>
                <div className="flex justify-between">
                  <span>Phí dịch vụ</span>
                  <span>{serviceFee.toLocaleString("vi-VN")}₫</span>
                </div>
                <div className="flex justify-between font-semibold border-t border-border pt-2">
                  <span>Tổng cộng</span>
                  <span>{totalAmount.toLocaleString("vi-VN")}₫</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
