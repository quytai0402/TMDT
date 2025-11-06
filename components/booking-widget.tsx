"use client"

import { useEffect, useMemo, useState } from "react"
import { Star, Users, CreditCard, Calendar, TicketPercent } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { SplitPaymentModal } from "@/components/split-payment-modal"
import { InstallmentPaymentModal } from "@/components/installment-payment-modal"
import { ServicesSelection, type SelectedServiceSummary } from "@/components/services-selection"
import { AvailabilityCalendar } from "@/components/availability-calendar"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuthModal } from "@/hooks/use-auth-modal"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { getLoyaltyDiscountConfig } from "@/lib/loyalty-discounts"

interface BookingWidgetProps {
  listingId: string
  price: number
  rating: number
  reviews: number
  instantBookable?: boolean
  cleaningFee?: number
}

const MEMBERSHIP_PERKS: Record<string, string[]> = {
  diamond: [
    "Giảm 15% cho mọi booking",
    "Concierge cá nhân hoá",
    "Ưu tiên check-in/out linh hoạt",
    "Tặng 3 đêm miễn phí mỗi năm",
    "Giảm 15% cho dịch vụ bổ sung",
    "Trải nghiệm partner cao cấp",
    "Miễn phí đổi lịch không giới hạn",
  ],
  "luxe-platinum": [
    "Giảm 12% cho mọi booking",
    "Concierge cá nhân hoá",
    "Ưu tiên check-in/out linh hoạt",
    "Giảm 15% cho dịch vụ bổ sung",
  ],
  "luxe-gold": [
    "Giảm 10% cho mọi booking",
    "Priority concierge 24/7",
    "Giảm 10% cho dịch vụ bổ sung",
  ],
}

export function BookingWidget({ listingId, price, rating, reviews, instantBookable = true, cleaningFee = 0 }: BookingWidgetProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const { toast } = useToast()
  const authModal = useAuthModal()
  const [checkIn, setCheckIn] = useState("")
  const [checkOut, setCheckOut] = useState("")
  const [guests, setGuests] = useState(1)
  const [showSplitPayment, setShowSplitPayment] = useState(false)
  const [showInstallment, setShowInstallment] = useState(false)
  const [servicesTotal, setServicesTotal] = useState(0)
  const [selectedServices, setSelectedServices] = useState<SelectedServiceSummary[]>([])
  const [showServices, setShowServices] = useState(false)
  const [showAvailability, setShowAvailability] = useState(false)
  const [couponCode, setCouponCode] = useState("")
  const [pendingCoupon, setPendingCoupon] = useState<string | null>(null)

  const sessionUser = session?.user
  const membershipStatus = sessionUser?.membershipStatus ?? null
  const loyaltyTier = sessionUser?.membership?.toUpperCase() ?? null
  const plan = sessionUser?.membershipPlan ?? null
  const planDiscountRate = plan?.discountRate ?? 0
  const loyaltyConfig = getLoyaltyDiscountConfig(loyaltyTier)
  const loyaltyDiscountRate = loyaltyConfig.rate
  const hasPlanBenefit = planDiscountRate > 0
  const hasLoyaltyBenefit = loyaltyDiscountRate > 0
  const appliedDiscountRate = hasPlanBenefit ? planDiscountRate : loyaltyDiscountRate
  const appliedServicesDiscount = hasPlanBenefit
    ? Boolean(plan?.applyDiscountToServices)
    : loyaltyConfig.applyToServices
  const membershipActive = hasPlanBenefit
    ? membershipStatus !== "INACTIVE" && membershipStatus !== "CANCELLED" && membershipStatus !== "EXPIRED"
    : hasLoyaltyBenefit
  const membershipLabel = plan?.name ?? loyaltyConfig.label
  const perkKeyCandidates = [
    plan?.slug?.toLowerCase(),
    loyaltyTier?.toLowerCase(),
  ].filter(Boolean) as string[]
  const membershipPerks = perkKeyCandidates.map((key) => MEMBERSHIP_PERKS[key]).find((perks) => Array.isArray(perks)) ?? null

  const ensureFutureCheckout = (newCheckIn: string) => {
    if (!newCheckIn) return
    if (!checkOut || checkOut <= newCheckIn) {
      const nextDay = new Date(newCheckIn)
      nextDay.setDate(nextDay.getDate() + 1)
      setCheckOut(formatForInput(nextDay))
    }
  }

  const formatForInput = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  useEffect(() => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    const todayInput = formatForInput(today)
    const tomorrowInput = formatForInput(tomorrow)
    setCheckIn((prev) => prev || todayInput)
    setCheckOut((prev) => {
      if (!prev) return tomorrowInput
      return prev <= todayInput ? tomorrowInput : prev
    })
  }, [])

  const todayInput = useMemo(() => formatForInput(new Date()), [])

  const minCheckout = useMemo(() => {
    if (!checkIn) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      return formatForInput(tomorrow)
    }
    const nextDay = new Date(checkIn)
    nextDay.setDate(nextDay.getDate() + 1)
    return formatForInput(nextDay)
  }, [checkIn])

  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0
    const start = new Date(checkIn)
    const end = new Date(checkOut)
    const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    return nights > 0 ? nights : 0
  }

  const nights = calculateNights()
  const subtotal = price * nights
  const serviceFee = (subtotal + servicesTotal) * 0.1
  const totalBeforeDiscount = subtotal + servicesTotal + serviceFee + cleaningFee
  const discountBase =
    membershipActive && appliedDiscountRate > 0
      ? subtotal + (appliedServicesDiscount ? servicesTotal : 0)
      : 0
  const membershipDiscountAmount =
    discountBase > 0 ? Math.round((discountBase * appliedDiscountRate) / 100) : 0
  const total = Math.max(0, totalBeforeDiscount - membershipDiscountAmount)

  const handleCouponAttach = () => {
    const normalized = couponCode.trim().toUpperCase()
    if (!normalized) {
      toast({
        title: "Mã chưa hợp lệ",
        description: "Vui lòng nhập mã ưu đãi trước khi lưu.",
        variant: "destructive",
      })
      return
    }

    setPendingCoupon(normalized)
    toast({
      title: "Đã lưu mã ưu đãi",
      description: "Mã sẽ được chuyển sang bước tạo đơn để áp dụng nhanh.",
    })
  }

  const handleServicesChange = (totalPrice: number, services: SelectedServiceSummary[]) => {
    setServicesTotal(totalPrice)
    setSelectedServices(services)
  }

  const handleBooking = () => {
    if (!checkIn || !checkOut) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng chọn ngày nhận và trả phòng",
        variant: "destructive",
      })
      return
    }

    if (nights <= 0) {
      toast({
        title: "Ngày không hợp lệ",
        description: "Ngày trả phòng phải sau ngày nhận phòng",
        variant: "destructive",
      })
      return
    }

    const params = new URLSearchParams({
      checkIn,
      checkOut,
      guests: guests.toString(),
    })

    if (selectedServices.length > 0) {
      params.set("services", encodeURIComponent(JSON.stringify(selectedServices)))
      params.set("servicesTotal", servicesTotal.toString())
    }

    if (pendingCoupon) {
      params.set("coupon", pendingCoupon)
    }

    toast({
      title: "Tiếp tục tới bước thanh toán",
      description: "Vui lòng hoàn tất thông tin khách và thanh toán để xác nhận đặt phòng.",
    })

    router.push(`/booking/${listingId}?${params.toString()}`)
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-foreground">{price.toLocaleString("vi-VN")}₫</span>
            <span className="text-muted-foreground"> / đêm</span>
          </div>
          <div className="flex items-center space-x-1">
            <Star className="h-4 w-4 fill-foreground text-foreground" />
            <span className="font-semibold">{rating}</span>
            <span className="text-sm text-muted-foreground">({reviews})</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {membershipActive && membershipLabel ? (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="border-emerald-200 bg-white/80 text-emerald-700">
                {membershipLabel}
              </Badge>
              {appliedDiscountRate > 0 ? (
                <span className="text-sm font-semibold text-emerald-700">-{Math.round(appliedDiscountRate)}%</span>
              ) : null}
            </div>
            <p className="text-xs text-emerald-800">
              Đã áp dụng ưu đãi thành viên cho giá phòng{appliedServicesDiscount ? " và dịch vụ bổ sung" : ""}.
              Bạn tiết kiệm {membershipDiscountAmount.toLocaleString("vi-VN")}₫ so với giá niêm yết.
            </p>
            {membershipPerks ? (
              <ul className="text-xs text-emerald-900 ml-4 list-disc space-y-1">
                {membershipPerks.map((perk) => (
                  <li key={perk}>{perk}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-2">
          <div className="border border-border rounded-lg p-3">
            <label className="text-xs font-semibold text-foreground block mb-1">Nhận phòng</label>
            <input
              type="date"
              value={checkIn}
              min={todayInput}
              max={new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString().split("T")[0]}
              onChange={(event) => {
                const nextValue = event.target.value
                setCheckIn(nextValue)
                ensureFutureCheckout(nextValue)
              }}
              className="w-full text-sm text-foreground bg-transparent border-none outline-none"
            />
          </div>
          <div className="border border-border rounded-lg p-3">
            <label className="text-xs font-semibold text-foreground block mb-1">Trả phòng</label>
            <input
              type="date"
              value={checkOut}
              min={minCheckout}
              max={new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString().split("T")[0]}
              onChange={(event) => {
                const value = event.target.value
                setCheckOut(value < minCheckout ? minCheckout : value)
              }}
              className="w-full text-sm text-foreground bg-transparent border-none outline-none"
            />
          </div>
        </div>

        <div className="border border-border rounded-lg p-3">
          <label className="text-xs font-semibold text-foreground block mb-1">Số khách</label>
          <input
            type="number"
            value={guests}
            onChange={(event) => setGuests(Number(event.target.value))}
            min="1"
            className="w-full text-sm text-foreground bg-transparent border-none outline-none"
          />
        </div>

        {!session?.user && (
          <div className="rounded-lg bg-muted/40 border border-dashed border-border p-3 text-xs text-muted-foreground">
            <span>Đăng nhập để tự động điền thông tin và nhận ưu đãi dành cho thành viên.</span>
            <Button type="button" variant="link" className="h-auto px-0 ml-2 text-primary" onClick={authModal.openLogin}>
              Đăng nhập
            </Button>
          </div>
        )}

        <Button variant="outline" onClick={() => setShowAvailability(true)} className="w-full border-primary text-primary hover:bg-primary/10">
          <Calendar className="h-4 w-4 mr-2" />
          Kiểm tra phòng trống
        </Button>

        <Button onClick={handleBooking} disabled={!checkIn || !checkOut || nights <= 0} className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-6">
          {instantBookable ? "Đặt phòng" : "Yêu cầu đặt phòng"}
        </Button>

        {nights > 0 && (
          <div className="space-y-3">
            <Button variant="outline" className="w-full" onClick={() => setShowServices(true)}>
              <span className="flex-1 text-left">
                Thêm dịch vụ
                {selectedServices.length > 0 && <span className="ml-2 text-primary">({selectedServices.length} đã chọn)</span>}
              </span>
            </Button>

            {selectedServices.length > 0 && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-primary">Dịch vụ đã chọn</p>
                  <p className="text-sm font-semibold text-primary">{servicesTotal.toLocaleString("vi-VN")}₫</p>
                </div>
                <div className="space-y-2">
                  {selectedServices.map((service) => (
                    <div key={service.id} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {service.name}
                        {service.quantityLabel ? ` · ${service.quantityLabel}` : ""}
                      </span>
                      <span className="text-foreground font-medium">{service.totalPrice.toLocaleString("vi-VN")}₫</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {nights > 0 && total > 0 && (
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => setShowSplitPayment(true)} className="w-full" size="sm">
              <Users className="h-4 w-4 mr-2" />
              Chia tiền
            </Button>
            <Button variant="outline" onClick={() => setShowInstallment(true)} className="w-full" size="sm">
              <CreditCard className="h-4 w-4 mr-2" />
              Trả góp
            </Button>
          </div>
        )}

        {nights > 0 && (
          <div className="space-y-3 pt-4 border-t border-border">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {price.toLocaleString("vi-VN")}₫ x {nights} đêm
              </span>
              <span className="text-foreground">{subtotal.toLocaleString("vi-VN")}₫</span>
            </div>
            {servicesTotal > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Dịch vụ bổ sung ({selectedServices.length})</span>
                <span className="text-foreground">{servicesTotal.toLocaleString("vi-VN")}₫</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Phí dịch vụ</span>
              <span className="text-foreground">{serviceFee.toLocaleString("vi-VN")}₫</span>
            </div>
            {cleaningFee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Phí vệ sinh</span>
                <span className="text-foreground">{cleaningFee.toLocaleString("vi-VN")}₫</span>
              </div>
            )}
            {membershipActive && membershipDiscountAmount > 0 && (
              <div className="flex justify-between text-sm font-semibold text-emerald-600">
                <span>Ưu đãi {membershipLabel ?? "thành viên"}</span>
                <span>-{membershipDiscountAmount.toLocaleString("vi-VN")}₫</span>
              </div>
            )}
            <div className="flex justify-between font-semibold pt-3 border-t border-border">
              <span className="text-foreground">Tổng cộng</span>
              <span className="text-foreground">{total.toLocaleString("vi-VN")}₫</span>
            </div>
            {membershipActive && membershipDiscountAmount > 0 && (
              <p className="text-xs text-muted-foreground">
                Đã bao gồm ưu đãi {membershipLabel ?? "thành viên"} trị giá {membershipDiscountAmount.toLocaleString("vi-VN")}₫.
              </p>
            )}
          </div>
        )}

        <div className="rounded-xl border border-dashed border-border/60 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <TicketPercent className="h-4 w-4 text-primary" />
            <span>Mã ưu đãi</span>
          </div>
          <Input
            value={couponCode}
            onChange={(event) => setCouponCode(event.target.value)}
            placeholder="NHAPMA"
            className="uppercase tracking-wide"
          />
          <Button type="button" variant="outline" className="w-full" onClick={handleCouponAttach}>
            Lưu mã để áp dụng ở bước tiếp theo
          </Button>
          {pendingCoupon ? (
            <p className="text-xs text-muted-foreground">
              Mã <span className="font-semibold text-foreground">{pendingCoupon}</span> sẽ tự động được mang sang bước tạo đơn.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">Bạn có thể nhập mã thành viên hoặc voucher để tiết kiệm hơn.</p>
          )}
        </div>
      </CardContent>

      <SplitPaymentModal open={showSplitPayment} onOpenChange={setShowSplitPayment} totalAmount={total} bookingId="BOOK123" />

      <InstallmentPaymentModal
        open={showInstallment}
        onOpenChange={setShowInstallment}
        totalAmount={total}
        bookingDate={checkIn ? new Date(checkIn) : new Date()}
      />

      <Dialog open={showAvailability} onOpenChange={setShowAvailability}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Lịch phòng trống</DialogTitle>
            <DialogDescription>Kiểm tra nhanh tình trạng phòng để điều chỉnh kế hoạch phù hợp.</DialogDescription>
          </DialogHeader>
          <AvailabilityCalendar
            listingId={listingId}
            initialCheckIn={checkIn}
            initialCheckOut={checkOut}
            onClose={() => setShowAvailability(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showServices} onOpenChange={setShowServices}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chọn dịch vụ bổ sung</DialogTitle>
            <DialogDescription>
              Concierge sẽ chuẩn bị trước các tiện nghi và dịch vụ bạn chọn để đảm bảo trải nghiệm hoàn hảo.
            </DialogDescription>
          </DialogHeader>

          <ServicesSelection nights={nights} guests={guests} value={selectedServices} onServicesChange={handleServicesChange} />

          <DialogFooter>
            <div className="flex w-full items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Tổng dịch vụ: <span className="font-semibold text-primary">{servicesTotal.toLocaleString("vi-VN")}₫</span>
              </p>
              <Button onClick={() => setShowServices(false)}>Hoàn tất</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
