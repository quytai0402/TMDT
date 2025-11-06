"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, CheckCircle2, Loader2, Lock, Shield, Sparkles, TicketPercent } from "lucide-react"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BookingSummary } from "@/components/booking-summary"
import { GuestInfoForm, type GuestInfo, type LoyaltyLookupResult } from "@/components/guest-info-form"
import { PaymentMethods } from "@/components/payment-methods"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

type StepStatus = "completed" | "current" | "upcoming"

interface CheckoutStep {
  id: number
  title: string
  description: string
  status: StepStatus
}

type PromotionEntry = {
  type?: string
  code?: string
  name?: string
  amount?: number
  rate?: number
  plan?: {
    name?: string
  }
  appliesToServices?: boolean
  [key: string]: unknown
}

const buildStepClasses = (status: StepStatus) => {
  if (status === "completed") {
    return "border-primary bg-primary text-primary-foreground"
  }
  if (status === "current") {
    return "border-primary text-primary"
  }
  return "border-muted-foreground text-muted-foreground"
}

const emptyGuestInfo: GuestInfo = {
  fullName: "",
  phone: "",
  email: "",
  specialRequests: "",
}

export default function CheckoutPage() {
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [acceptTerms, setAcceptTerms] = useState(false)
  const [acceptCancellation, setAcceptCancellation] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [guestInfo, setGuestInfo] = useState<GuestInfo>(emptyGuestInfo)
  const [loyaltyInfo, setLoyaltyInfo] = useState<LoyaltyLookupResult | null>(null)
  const [bookingData, setBookingData] = useState<any>(null)
  const [bookingReady, setBookingReady] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [couponCode, setCouponCode] = useState("")
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false)
  const [isRemovingCoupon, setIsRemovingCoupon] = useState(false)

  useEffect(() => {
    const fetchBookingData = async () => {
      const bookingId = searchParams.get("bookingId")

      if (!bookingId) {
        setError("Thiếu thông tin đặt phòng")
        setLoading(false)
        return
      }

      try {
        const res = await fetch(`/api/bookings/${bookingId}`)

        if (!res.ok) {
          throw new Error("Không thể tải thông tin đặt phòng")
        }

        const data = await res.json()
        setBookingData(data)
        setGuestInfo({
          fullName: data.contactName || data.guestContact?.name || "",
          phone: data.contactPhone || data.guestContact?.phone || "",
          email: data.contactEmail || data.guestContact?.email || "",
          specialRequests: data.specialRequests || "",
        })

        const checkoutMeta = data.metadata?.checkoutAcknowledgements
        const hasTerms = Boolean(checkoutMeta?.termsAccepted)
        const hasCancellation = Boolean(checkoutMeta?.cancellationAccepted)

        setAcceptTerms(hasTerms)
        setAcceptCancellation(hasCancellation)
        setBookingReady(hasTerms && hasCancellation)
      } catch (err: any) {
        setError(err?.message || "Đã xảy ra lỗi")
      } finally {
        setLoading(false)
      }
    }

    fetchBookingData()
  }, [searchParams])

  const guestInfoCompleted = useMemo(() => {
    return Boolean(
      guestInfo.fullName.trim() &&
        guestInfo.phone.trim() &&
        guestInfo.email.trim()
    )
  }, [guestInfo])

  const steps: CheckoutStep[] = useMemo(() => {
    return [
      {
        id: 1,
        title: "Bước 1 · Kiểm tra đơn",
        description: "Xem lại thông tin lịch ở cột bên phải",
        status: "completed",
      },
      {
        id: 2,
        title: "Bước 2 · Điền thông tin",
        description: guestInfoCompleted
          ? "Thông tin liên hệ đã đầy đủ"
          : "Cung cấp họ tên, email và số điện thoại",
        status: guestInfoCompleted ? "completed" : "current",
      },
      {
        id: 3,
        title: "Bước 3 · Xác nhận đặt phòng",
        description: bookingReady
          ? "Đã lưu và sẵn sàng thanh toán"
          : "Lưu thông tin trước khi chọn phương thức thanh toán",
        status: bookingReady ? "completed" : guestInfoCompleted ? "current" : "upcoming",
      },
    ]
  }, [guestInfoCompleted, bookingReady])

  const bookingCode = useMemo(() => {
    if (!bookingData?.id) {
      return undefined
    }
    return bookingData.id.slice(-8).toUpperCase()
  }, [bookingData?.id])

  const appliedPromotions = useMemo(() => {
    if (!bookingData?.appliedPromotions) {
      return [] as PromotionEntry[]
    }

    if (Array.isArray(bookingData.appliedPromotions)) {
      return bookingData.appliedPromotions.filter((entry): entry is PromotionEntry =>
        Boolean(entry) && typeof entry === "object"
      )
    }

    return [] as PromotionEntry[]
  }, [bookingData?.appliedPromotions])

  const membershipPromotion = useMemo(() => {
    return appliedPromotions.find((entry) => entry.type === "MEMBERSHIP") ?? null
  }, [appliedPromotions])

  const couponPromotion = useMemo(() => {
    return appliedPromotions.find((entry) => entry.type === "PROMOTION") ?? null
  }, [appliedPromotions])

  const membershipDiscountAmount = useMemo(() => {
    return Math.round(bookingData?.membershipDiscount ?? 0)
  }, [bookingData?.membershipDiscount])

  const promotionDiscountAmount = useMemo(() => {
    return Math.round(bookingData?.promotionDiscount ?? 0)
  }, [bookingData?.promotionDiscount])

  const discountBreakdown = useMemo(() => {
    const items: Array<{ label: string; amount: number }> = []

    if (appliedPromotions.length > 0) {
      appliedPromotions.forEach((entry) => {
        if (!entry || typeof entry !== "object") {
          return
        }
        const rawAmount = Number(entry.amount ?? 0)
        if (!Number.isFinite(rawAmount) || Math.round(rawAmount) <= 0) {
          return
        }

        const amount = Math.round(rawAmount)
        if (entry.type === "MEMBERSHIP") {
          const planName = entry.plan?.name ? ` ${entry.plan.name}` : ""
          const rateSuffix = typeof entry.rate === "number" && entry.rate > 0 ? ` (-${Math.round(entry.rate)}%)` : ""
          items.push({
            label: `Ưu đãi thành viên${planName}${rateSuffix}`.trim(),
            amount,
          })
        } else if (entry.type === "PROMOTION") {
          const label = entry.name || (entry.code ? `Mã ưu đãi ${entry.code}` : "Khuyến mãi")
          items.push({ label, amount })
        }
      })
    }

    if (items.length === 0) {
      if (membershipDiscountAmount > 0) {
        items.push({ label: "Ưu đãi hội viên", amount: membershipDiscountAmount })
      }
      if (promotionDiscountAmount > 0) {
        items.push({ label: "Khuyến mãi", amount: promotionDiscountAmount })
      }
    }

    return items
  }, [appliedPromotions, membershipDiscountAmount, promotionDiscountAmount])

  const handleConfirmBooking = async () => {
    if (!bookingData) {
      toast({
        title: "Không tìm thấy đặt phòng",
        description: "Vui lòng tải lại trang và thử lại.",
        variant: "destructive",
      })
      return
    }

    if (!guestInfoCompleted) {
      toast({
        title: "Thiếu thông tin bắt buộc",
        description: "Vui lòng điền đầy đủ họ tên, số điện thoại và email.",
        variant: "destructive",
      })
      return
    }

    if (!acceptTerms || !acceptCancellation) {
      toast({
        title: "Chưa xác nhận điều khoản",
        description: "Bạn cần đồng ý với điều khoản và chính sách hủy phòng trước khi tiếp tục.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      const response = await fetch(`/api/bookings/${bookingData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactName: guestInfo.fullName.trim(),
          contactPhone: guestInfo.phone.trim(),
          contactEmail: guestInfo.email.trim(),
          specialRequests: guestInfo.specialRequests ?? "",
          acceptTerms,
          acceptCancellation,
          loyaltySnapshot: loyaltyInfo
            ? {
                memberTier: loyaltyInfo.memberTier,
                discount: loyaltyInfo.discount,
                totalBookings: loyaltyInfo.totalBookings,
                totalSpent: loyaltyInfo.totalSpent,
                perks: loyaltyInfo.perks,
                nextTier: loyaltyInfo.nextTier,
              }
            : undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || "Không thể cập nhật thông tin đặt phòng")
      }

      setBookingData(data)
      setBookingReady(true)
      setGuestInfo((prev) => ({
        ...prev,
        fullName: data.contactName || prev.fullName,
        phone: data.contactPhone || prev.phone,
        email: data.contactEmail || prev.email,
        specialRequests: data.specialRequests || prev.specialRequests || "",
      }))

      toast({
        title: "Đã lưu thông tin đặt phòng",
        description: "Bạn có thể tiếp tục lựa chọn phương thức thanh toán.",
      })
    } catch (err: any) {
      toast({
        title: "Không thể xác nhận",
        description: err?.message || "Vui lòng thử lại sau.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleApplyCoupon = async () => {
    if (!bookingData?.id) {
      toast({
        title: "Chưa có đơn đặt phòng",
        description: "Vui lòng kiểm tra lại thông tin đặt phòng trước khi áp dụng mã.",
        variant: "destructive",
      })
      return
    }

    const normalizedCode = couponCode.trim().toUpperCase()
    if (!normalizedCode) {
      toast({
        title: "Chưa nhập mã",
        description: "Vui lòng nhập mã ưu đãi trước khi áp dụng.",
      })
      return
    }

    setIsApplyingCoupon(true)
    try {
      const response = await fetch(`/api/bookings/${bookingData.id}/promotions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: normalizedCode }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || "Không thể áp dụng mã ưu đãi")
      }

      setBookingData(data)
      setCouponCode("")
      toast({
        title: "Đã áp dụng mã ưu đãi",
        description: `Mã ${normalizedCode} đã được áp dụng thành công.`,
      })
    } catch (error: any) {
      toast({
        title: "Không thể áp dụng mã",
        description: error?.message || "Vui lòng thử lại với mã khác.",
        variant: "destructive",
      })
    } finally {
      setIsApplyingCoupon(false)
    }
  }

  const handleRemoveCoupon = async () => {
    if (!bookingData?.id) {
      return
    }

    setIsRemovingCoupon(true)
    try {
      const response = await fetch(`/api/bookings/${bookingData.id}/promotions`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || "Không thể gỡ mã ưu đãi")
      }

      setBookingData(data)
      toast({
        title: "Đã gỡ mã ưu đãi",
        description: "Thông tin giá đã được cập nhật lại.",
      })
    } catch (error: any) {
      toast({
        title: "Không thể gỡ mã",
        description: error?.message || "Vui lòng thử lại sau.",
        variant: "destructive",
      })
    } finally {
      setIsRemovingCoupon(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>Đang tải thông tin đặt phòng...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (error || !bookingData) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Alert variant="destructive" className="max-w-md">
            <AlertDescription>{error || "Không tìm thấy thông tin đặt phòng"}</AlertDescription>
          </Alert>
        </main>
        <Footer />
      </div>
    )
  }

  const additionalServices = Array.isArray(bookingData.additionalServices)
    ? bookingData.additionalServices
    : []
  const servicesTotal = bookingData.additionalServicesTotal ?? 0
  const amountDue = bookingData.totalPrice ?? 0
  const totalGuests = bookingData.adults + (bookingData.children || 0)
  const locationParts = [bookingData.listing.city, bookingData.listing.state].filter(Boolean)
  const listingLocation = locationParts.length > 0 ? locationParts.join(", ") : bookingData.listing.city ?? "Việt Nam"

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8 py-8">
          <Link href={`/listing/${bookingData.listing.id}`}>
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại
            </Button>
          </Link>

          <div className="mb-8 space-y-3">
            <div>
              <h1 className="font-serif text-3xl font-bold text-foreground">Xác nhận và thanh toán</h1>
              <p className="text-muted-foreground">Hoàn tất các bước để yêu cầu đặt phòng của bạn sẵn sàng thanh toán.</p>
            </div>

            <div className="rounded-xl border border-border bg-background/60 p-4 shadow-sm">
              <div className="grid gap-4 sm:grid-cols-3">
                {steps.map((step) => {
                  const circleClasses = `flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold ${buildStepClasses(step.status)}`

                  return (
                    <div key={step.id} className="flex items-start space-x-3">
                      <div className={circleClasses}>
                        {step.status === "completed" ? <CheckCircle2 className="h-5 w-5" /> : step.id}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground">{step.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 leading-snug">{step.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <GuestInfoForm
                onInfoChange={setGuestInfo}
                initialInfo={guestInfo}
                onLoyaltyInfoChange={setLoyaltyInfo}
              />

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Ưu đãi &amp; Mã coupon</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Nhập mã ưu đãi của bạn hoặc kiểm tra mã đã được áp dụng.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {couponPromotion ? (
                    <div className="rounded-lg border border-green-200 bg-green-50/80 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="flex items-center gap-2 text-sm font-semibold text-green-700">
                            <TicketPercent className="h-4 w-4" />
                            <span>Mã {couponPromotion.code ?? "ưu đãi"}</span>
                          </div>
                          <p className="mt-1 text-sm text-green-700">
                            Giảm {Number(couponPromotion.amount ?? promotionDiscountAmount).toLocaleString("vi-VN")}₫ cho đơn này.
                          </p>
                          {couponPromotion.name ? (
                            <p className="text-xs text-green-600">{couponPromotion.name}</p>
                          ) : null}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRemoveCoupon}
                          disabled={isRemovingCoupon}
                        >
                          {isRemovingCoupon ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                          Gỡ mã
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="relative">
                        <TicketPercent className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          value={couponCode}
                          onChange={(event) => setCouponCode(event.target.value)}
                          placeholder="Nhập mã ưu đãi"
                          className="pl-9 h-11 uppercase tracking-wide"
                        />
                      </div>
                      <Button className="w-full" onClick={handleApplyCoupon} disabled={isApplyingCoupon}>
                        {isApplyingCoupon ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {isApplyingCoupon ? "Đang áp dụng..." : "Áp dụng mã"}
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Mỗi đơn chỉ có thể sử dụng một mã ưu đãi tại cùng một thời điểm.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Điều khoản và chính sách</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Xác nhận giúp chúng tôi lưu thông tin liên hệ để host có thể xử lý yêu cầu đặt phòng.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="terms"
                      checked={acceptTerms}
                      onCheckedChange={(checked) => setAcceptTerms(Boolean(checked))}
                    />
                    <label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                      Tôi đồng ý với{" "}
                      <Link href="/terms" className="text-primary underline">
                        Điều khoản sử dụng
                      </Link>{" "}
                      và{" "}
                      <Link href="/privacy" className="text-primary underline">
                        Chính sách bảo mật
                      </Link>{" "}
                      của Homestay Booking.
                    </label>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="cancellation"
                      checked={acceptCancellation}
                      onCheckedChange={(checked) => setAcceptCancellation(Boolean(checked))}
                    />
                    <label htmlFor="cancellation" className="text-sm leading-relaxed cursor-pointer">
                      Tôi đã đọc và hiểu{" "}
                      <Link href="/cancellation-policy" className="text-primary underline">
                        Chính sách hủy phòng
                      </Link>. Hủy miễn phí trước 48 giờ, sau đó hoàn 50% nếu hủy trước 24 giờ.
                    </label>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Bước 3 · Xác nhận đặt phòng</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Lưu thông tin liên hệ để hoàn tất yêu cầu đặt phòng trước khi chuyển sang thanh toán.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!guestInfoCompleted && (
                    <Alert className="bg-amber-50 border-amber-200 text-amber-800">
                      <AlertDescription>
                        Vui lòng điền đầy đủ họ tên, số điện thoại và email để tiếp tục.
                      </AlertDescription>
                    </Alert>
                  )}

                  {bookingReady && (
                    <Alert className="bg-green-50 border-green-200 text-green-700">
                      <AlertDescription>
                        Thông tin liên hệ đã được lưu. Bạn có thể chọn phương thức thanh toán bên dưới.
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    className="w-full py-6 text-lg"
                    onClick={handleConfirmBooking}
                    disabled={isProcessing || !guestInfoCompleted || !acceptTerms || !acceptCancellation}
                  >
                    {isProcessing ? (
                      <>
                        <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Đang lưu thông tin...
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-5 w-5" />
                        Xác nhận & lưu thông tin
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <PaymentMethods
                bookingId={bookingData.id}
                amount={amountDue}
                bookingCode={bookingCode}
                disabled={!bookingReady}
              />

              <Alert className="bg-green-50 border-green-200">
                <Shield className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-sm text-green-700">
                  <div className="space-y-1">
                    <p className="font-medium">Thanh toán an toàn với Homestay Booking</p>
                    <ul className="ml-4 list-disc text-xs space-y-0.5">
                      <li>Mã hóa SSL 256-bit</li>
                      <li>Tuân thủ chuẩn PCI DSS</li>
                      <li>Không lưu trữ thông tin thẻ</li>
                      <li>Hoàn tiền nếu phát sinh sự cố</li>
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            </div>

            <div className="lg:col-span-1 space-y-4">
              <BookingSummary
                listing={{
                  id: bookingData.listing.id,
                  title: bookingData.listing.title,
                  location: listingLocation,
                  price: bookingData.basePrice / Math.max(1, bookingData.nights),
                  image: bookingData.listing.images?.[0] || "",
                  rating: bookingData.listing.averageRating,
                  reviews: bookingData.listing.totalReviews,
                  host: {
                    name: bookingData.listing.host.name,
                    avatar: bookingData.listing.host.image,
                  },
                  cleaningFee: bookingData.cleaningFee,
                  serviceFee: bookingData.serviceFee,
                }}
                checkIn={new Date(bookingData.checkIn).toISOString().split("T")[0]}
                checkOut={new Date(bookingData.checkOut).toISOString().split("T")[0]}
                guests={totalGuests}
                additionalServices={additionalServices}
                additionalServicesTotal={servicesTotal}
                discounts={discountBreakdown}
                totalOverride={amountDue}
              />

              {membershipPromotion ? (
                <Alert className="bg-purple-50 border-purple-200 text-purple-700">
                  <Sparkles className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="border-purple-200 bg-white/70 text-purple-700">
                          {membershipPromotion.plan?.name ?? "Ưu đãi thành viên"}
                        </Badge>
                        {typeof membershipPromotion.rate === "number" && membershipPromotion.rate > 0 ? (
                          <span className="text-xs font-semibold uppercase tracking-wide">-{Math.round(membershipPromotion.rate)}%</span>
                        ) : null}
                      </div>
                      <p>
                        Thành viên được giảm {membershipDiscountAmount.toLocaleString("vi-VN")}₫ cho đơn này
                        {membershipPromotion.appliesToServices ? " (áp dụng cả cho dịch vụ bổ sung)" : ""}.
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              ) : null}

              {bookingCode && (
                <Card className="p-4">
                  <div className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">Mã đặt phòng: </span>
                    {bookingCode}
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
