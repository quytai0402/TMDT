"use client"

import { useMemo, useState } from "react"
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
}

export function ExperienceBookingWidget({
  experienceId,
  pricePerPerson,
  currency = "VND",
  minGuests,
  maxGuests,
  defaultTimeSlot = "",
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
  } | null>(null)
  const { toast } = useToast()

  const formatter = useMemo(
    () =>
      new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
      }),
    [currency]
  )

  const totalPrice = Math.max(guests, minGuests) * pricePerPerson
  
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
        title: "Đặt trải nghiệm thành công!",
        description: "Hoàn tất thanh toán theo hướng dẫn để giữ chỗ.",
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
            <span>{formatter.format(totalPrice)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Phí dịch vụ</span>
            <span>0₫</span>
          </div>
        </div>

        <Separator />

        <div className="flex justify-between font-semibold">
          <span>Tổng cộng</span>
          <span>{formatter.format(totalPrice)}</span>
        </div>

        <Button className="w-full" size="lg" onClick={handleSubmit} disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Đang xử lý...
            </>
          ) : (
            "Đặt ngay"
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">Bạn chưa bị trừ tiền</p>

        {bookingInfo && (
          (() => {
            const reference = formatTransferReference("EXPERIENCE", bookingInfo.id.slice(-8).toUpperCase())
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
                <span className="font-medium text-foreground">{bank.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span>Số tài khoản</span>
                <span className="font-medium text-foreground">{bank.accountNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Chủ tài khoản</span>
                <span className="font-medium text-foreground uppercase">{bank.accountName}</span>
              </div>
              <div className="flex justify-between">
                <span>Tổng thanh toán</span>
                <span className="font-medium text-foreground">{formatter.format(bookingInfo.totalPrice)}</span>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2 rounded-md bg-white/70 p-3">
              <img
                src={createVietQRUrl(bookingInfo.totalPrice, reference)}
                alt="Mã VietQR thanh toán trải nghiệm"
                className="h-36 w-36 rounded-md border border-border bg-white p-2"
              />
              <p className="text-[11px] text-muted-foreground text-center">
                Quét VietQR hoặc chuyển khoản thủ công với nội dung trên để giữ chỗ. Concierge sẽ xác nhận trong vòng 30 phút.
              </p>
            </div>
          </div>
            )
          })()
        )}
      </CardContent>
    </Card>
  )
}
