"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Calendar, Users, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { createVietQRUrl, formatTransferReference, getBankTransferInfo } from "@/lib/payments"

interface ExperienceBookingWidgetProps {
  experienceId: string
  pricePerPerson: number
  currency?: string
  minGuests: number
  maxGuests: number
  defaultTimeSlot?: string
  membershipPlan?: {
    id?: string
    slug: string
    name: string
    discountRate: number
    experienceDiscountRate?: number
  } | null
  membershipStatus?: string | null
}

export function ExperienceBookingWidget({
  experienceId,
  pricePerPerson,
  currency = "VND",
  minGuests,
  maxGuests,
  defaultTimeSlot = "",
  membershipPlan = null,
  membershipStatus = null,
}: ExperienceBookingWidgetProps) {
  const today = new Date().toISOString().split("T")[0]
  const [date, setDate] = useState<string>(today)
  const [timeSlot, setTimeSlot] = useState<string>(defaultTimeSlot)
  const [guests, setGuests] = useState<number>(Math.max(minGuests, 1))
  const [submitting, setSubmitting] = useState(false)
  const [bookingInfo, setBookingInfo] = useState<{
    id: string
    status: string
    date: string
    numberOfGuests: number
    totalPrice: number
    currency: string
    discountRate?: number
    discountAmount?: number
    membershipPlan?: { id?: string | null; slug?: string | null; name?: string | null } | null
  } | null>(null)
  const [confirmingPayment, setConfirmingPayment] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const formatter = useMemo(
    () =>
      new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
      }),
    [currency]
  )

  const normalizedStatus = membershipStatus?.toUpperCase() ?? null
  const membershipActive =
    membershipPlan && normalizedStatus
      ? !["INACTIVE", "CANCELLED", "EXPIRED"].includes(normalizedStatus)
      : Boolean(membershipPlan)
  const planExperienceDiscount = membershipPlan?.experienceDiscountRate ?? 0
  const planBookingDiscount = membershipPlan?.discountRate ?? 0
  const appliedDiscountRate = membershipActive ? Math.max(planExperienceDiscount || 0, planBookingDiscount || 0) : 0

  const basePrice = Math.max(guests, minGuests) * pricePerPerson
  const rawDiscountPreview = appliedDiscountRate > 0 ? (basePrice * appliedDiscountRate) / 100 : 0
  const previewDiscountAmount =
    appliedDiscountRate > 0
      ? currency === "VND"
        ? Math.round(rawDiscountPreview)
        : Number(rawDiscountPreview.toFixed(2))
      : 0
  const estimatedTotal = Math.max(0, basePrice - previewDiscountAmount)
  
  const handleSubmit = async () => {
    if (!date) {
      toast({
        variant: "destructive",
        title: "Chưa chọn ngày",
        description: "Vui lòng chọn ngày diễn ra trải nghiệm.",
      })
      return
    }

    if (guests < minGuests || guests > maxGuests) {
      toast({
        variant: "destructive",
        title: "Số lượng khách không hợp lệ",
        description: `Vui lòng chọn từ ${minGuests} đến ${maxGuests} khách.`,
      })
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/experiences/${experienceId}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          numberOfGuests: guests,
          timeSlot: timeSlot || undefined,
        }),
      })

      if (response.status === 401) {
        toast({
          variant: "destructive",
          title: "Cần đăng nhập",
          description: "Vui lòng đăng nhập để đặt và thanh toán trải nghiệm.",
        })
        return
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error?.error || "Không thể tạo đơn đặt trải nghiệm.")
      }

      const result = await response.json()
      setBookingInfo(result.booking)

      toast({
        title: "Đã tạo hướng dẫn thanh toán",
        description: "Quét mã hoặc chuyển khoản theo thông tin bên dưới, rồi bấm Đặt ngay để hoàn tất.",
      })
    } catch (error) {
      console.error(error)
      toast({
        variant: "destructive",
        title: "Đặt trải nghiệm thất bại",
        description: error instanceof Error ? error.message : "Vui lòng thử lại sau.",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handlePaymentConfirmation = async () => {
    if (!bookingInfo) return
    setConfirmingPayment(true)
    try {
      const response = await fetch(
        `/api/experience-bookings/${bookingInfo.id}/confirm-payment`,
        {
          method: "POST",
        },
      )

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error?.error || "Không thể xác nhận thanh toán.")
      }

      toast({
        title: "Đã gửi thông tin cho concierge",
        description: "Chúng tôi sẽ thông báo ngay khi hướng dẫn viên phản hồi.",
      })

      router.push(`/experiences/bookings/${bookingInfo.id}/success`)
    } catch (error) {
      console.error("Experience payment confirmation error:", error)
      toast({
        variant: "destructive",
        title: "Xác nhận thanh toán thất bại",
        description:
          error instanceof Error ? error.message : "Vui lòng thử lại sau.",
      })
    } finally {
      setConfirmingPayment(false)
    }
  }

  return (
    <Card className="sticky top-24 border border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-baseline gap-1">
          <span className="text-3xl font-bold">
            {formatter.format(Number.isFinite(pricePerPerson) ? pricePerPerson : 0)}
          </span>
          <span className="text-sm text-muted-foreground">/người</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="experience-date" className="text-sm font-medium">
            Chọn ngày
          </Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="experience-date"
              type="date"
              value={date}
              min={today}
              onChange={(event) => setDate(event.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="experience-time" className="text-sm font-medium">
            Giờ bắt đầu (tùy chọn)
          </Label>
          <Input
            id="experience-time"
            placeholder="Ví dụ: 09:00"
            value={timeSlot}
            onChange={(event) => setTimeSlot(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="experience-guests" className="text-sm font-medium">
            Số khách
          </Label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="experience-guests"
              type="number"
              min={minGuests}
              max={maxGuests}
              value={guests}
              onChange={(event) => setGuests(Number(event.target.value))}
              className="pl-10"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Tối thiểu {minGuests} khách • Tối đa {maxGuests} khách
          </p>
        </div>

        <Separator />

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>
              {formatter.format(Number.isFinite(pricePerPerson) ? pricePerPerson : 0)} x {guests} khách
            </span>
            <span>{formatter.format(basePrice)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Phí dịch vụ</span>
            <span>0₫</span>
          </div>
          {membershipActive && appliedDiscountRate > 0 ? (
            <div className="flex justify-between text-emerald-600">
              <span>
                Ưu đãi {membershipPlan?.name ?? "hội viên"} ({appliedDiscountRate}%)
              </span>
              <span>-{formatter.format(previewDiscountAmount)}</span>
            </div>
          ) : null}
        </div>

        <Separator />

        <div className="flex justify-between font-semibold">
          <span>Tổng cộng</span>
          <span>{formatter.format(membershipActive && appliedDiscountRate > 0 ? estimatedTotal : basePrice)}</span>
        </div>

        <Button className="w-full" size="lg" onClick={handleSubmit} disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Đang xử lý...
            </>
          ) : bookingInfo ? (
            "Tạo lại mã thanh toán"
          ) : (
            "Thanh toán"
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Thực hiện bước thanh toán để hiển thị mã QR và thông tin chuyển khoản.
        </p>

        {bookingInfo &&
          (() => {
            const reference = formatTransferReference(
              "EXPERIENCE",
              bookingInfo.id.slice(-8).toUpperCase(),
            )
            const bank = getBankTransferInfo()
            return (
              <div className="space-y-4 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4 text-sm">
                <div className="flex items-center justify-between">
                  <span>Mã tham chiếu</span>
                  <span className="font-semibold text-primary">{reference}</span>
                </div>
                <div className="grid gap-2 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Ngân hàng</span>
                    <span className="font-medium text-foreground">
                      {bank.bankName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Số tài khoản</span>
                    <span className="font-medium text-foreground">
                      {bank.accountNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Chủ tài khoản</span>
                    <span className="font-medium text-foreground uppercase">
                      {bank.accountName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tổng thanh toán</span>
                    <span className="font-medium text-foreground">
                      {formatter.format(bookingInfo.totalPrice)}
                    </span>
                  </div>
                  {bookingInfo.discountAmount && bookingInfo.discountAmount > 0 ? (
                    <div className="flex justify-between text-emerald-600">
                      <span>
                        Ưu đãi {bookingInfo.membershipPlan?.name ?? membershipPlan?.name ?? "hội viên"}
                        {bookingInfo.discountRate && bookingInfo.discountRate > 0 ? ` (${bookingInfo.discountRate}%)` : ""}
                      </span>
                      <span>-{formatter.format(bookingInfo.discountAmount)}</span>
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-col items-center gap-2 rounded-md bg-white/70 p-3">
                  <img
                    src={createVietQRUrl(bookingInfo.totalPrice, reference)}
                    alt="Mã VietQR thanh toán trải nghiệm"
                    className="h-36 w-36 rounded-md border border-border bg-white p-2"
                  />
                  <p className="text-[11px] text-muted-foreground text-center">
                    Quét VietQR hoặc chuyển khoản thủ công với nội dung trên để
                    giữ chỗ. Concierge sẽ xác nhận trong vòng 30 phút.
                  </p>
                </div>

                <div className="space-y-2">
                  <Button
                    className="w-full"
                    onClick={handlePaymentConfirmation}
                    disabled={confirmingPayment}
                  >
                    {confirmingPayment ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Đang gửi thông tin...
                      </>
                    ) : (
                      "Đặt ngay"
                    )}
                  </Button>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => router.push("/concierge")}
                  >
                    Liên hệ concierge
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground text-center">
                  Sau khi bấm “Đặt ngay”, hướng dẫn viên và concierge sẽ nhận được thông báo để xác nhận lịch trình cho bạn.
                </p>
              </div>
            )
          })()}
      </CardContent>
    </Card>
  )
}
