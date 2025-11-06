"use client"

import { useState } from "react"
import { Calendar, X, AlertCircle, CheckCircle, CreditCard } from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

interface BookingActionsDialogProps {
  booking: {
    id: string
    checkIn: Date | string
    checkOut: Date | string
    totalPrice: number
    status: string
    listing: {
      title: string
      cancellationPolicy?: string
    }
    guest?: {
      membershipStatus?: string
      loyaltyTier?: string
    }
  }
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "reschedule" | "cancel"
  onSuccess?: () => void
}

export function BookingActionsDialog({
  booking,
  open,
  onOpenChange,
  mode,
  onSuccess,
}: BookingActionsDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [reason, setReason] = useState("")
  const [newCheckIn, setNewCheckIn] = useState("")
  const [newCheckOut, setNewCheckOut] = useState("")
  const [preview, setPreview] = useState<any>(null)

  const checkIn = typeof booking.checkIn === 'string' ? new Date(booking.checkIn) : booking.checkIn
  const checkOut = typeof booking.checkOut === 'string' ? new Date(booking.checkOut) : booking.checkOut

  const hasEnhancedBenefits =
    booking.guest?.membershipStatus === 'ACTIVE' &&
    ['SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'].includes(booking.guest?.loyaltyTier || '')

  const hasFreeReschedule =
    booking.guest?.membershipStatus === 'ACTIVE' &&
    ['GOLD', 'PLATINUM', 'DIAMOND'].includes(booking.guest?.loyaltyTier || '')

  const getCancellationPolicy = () => {
    const policy = booking.listing.cancellationPolicy || 'MODERATE'
    const hoursUntilCheckIn = (checkIn.getTime() - new Date().getTime()) / (1000 * 60 * 60)
    
    let refundInfo = ''
    switch (policy) {
      case 'FLEXIBLE':
        refundInfo = hasEnhancedBenefits
          ? 'Hoàn 100% nếu hủy trước 12 giờ'
          : 'Hoàn 100% nếu hủy trước 24 giờ'
        break
      case 'MODERATE':
        refundInfo = hasEnhancedBenefits
          ? 'Hoàn 100% nếu hủy trước 3 ngày, 75% nếu sau đó'
          : 'Hoàn 100% nếu hủy trước 5 ngày, 50% nếu sau đó'
        break
      case 'STRICT':
        refundInfo = hasEnhancedBenefits
          ? 'Hoàn 100% nếu hủy trước 7 ngày, 50% nếu sau đó'
          : 'Hoàn 100% nếu hủy trước 7 ngày, 0% nếu sau đó'
        break
      case 'SUPER_STRICT':
        refundInfo = hasEnhancedBenefits
          ? 'Hoàn 75% nếu hủy trước 14 ngày, 50% nếu sau đó'
          : 'Hoàn 50% nếu hủy trước 14 ngày, 0% nếu sau đó'
        break
    }

    return { policy, refundInfo, hoursUntilCheckIn }
  }

  const handleCancel = async () => {
    if (!reason.trim()) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập lý do hủy",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/bookings/${booking.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Không thể hủy booking")
      }

      toast({
        title: "Đã hủy booking",
        description: `Hoàn tiền: ${data.refundAmount.toLocaleString("vi-VN")}₫ (${data.refundPercentage}%)${data.membershipBenefitApplied ? ' - Đã áp dụng quyền lợi membership' : ''}`,
      })

      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReschedule = async () => {
    if (!newCheckIn || !newCheckOut) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng chọn ngày mới",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/bookings/${booking.id}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newCheckIn,
          newCheckOut,
          reason,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.conflict) {
          toast({
            title: "Ngày không khả dụng",
            description: "Ngày bạn chọn đã có khách đặt trước",
            variant: "destructive",
          })
        } else if (data.blocked) {
          toast({
            title: "Ngày bị chặn",
            description: "Host đã chặn những ngày này",
            variant: "destructive",
          })
        } else {
          throw new Error(data.error || "Không thể thay đổi ngày")
        }
        return
      }

      // Build success message
      let successMessage = ''
      if (data.isUpgrade) {
        successMessage = `Tăng ${data.newNights - data.oldNights} đêm. Cần thanh toán thêm: ${data.amountToPay.toLocaleString("vi-VN")}₫`
      } else if (data.isDowngrade) {
        if (data.refundAmount > 0) {
          successMessage = `Giảm ${data.oldNights - data.newNights} đêm. Hoàn tiền: ${data.refundAmount.toLocaleString("vi-VN")}₫`
        } else {
          successMessage = `Giảm ${data.oldNights - data.newNights} đêm. Phí thay đổi: ${data.rescheduleFee.toLocaleString("vi-VN")}₫`
        }
      } else {
        successMessage = data.rescheduleFee > 0 
          ? `Phí thay đổi: ${data.rescheduleFee.toLocaleString("vi-VN")}₫` 
          : 'Miễn phí thay đổi'
      }

      if (data.freeReschedule && data.rescheduleFee === 0) {
        successMessage += ' - Quyền lợi membership'
      }

      toast({
        title: "✅ Đã thay đổi ngày",
        description: successMessage,
      })

      // Show payment prompt if needed
      if (data.requiresPayment && data.amountToPay > 0) {
        setTimeout(() => {
          toast({
            title: "💳 Cần thanh toán bổ sung",
            description: `Vui lòng thanh toán ${data.amountToPay.toLocaleString("vi-VN")}₫ để hoàn tất đổi ngày`,
            action: (
              <Button
                size="sm"
                onClick={() => window.location.href = `/payment/${booking.id}/reschedule`}
              >
                Thanh toán ngay
              </Button>
            ),
          })
        }, 2000)
      }

      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const { policy, refundInfo, hoursUntilCheckIn } = getCancellationPolicy()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "cancel" ? "Hủy đặt phòng" : "Thay đổi ngày"}
          </DialogTitle>
          <DialogDescription>
            {booking.listing.title}
          </DialogDescription>
        </DialogHeader>

        {mode === "cancel" ? (
          <div className="space-y-4">
            {hasEnhancedBenefits && (
              <Alert className="border-primary/50 bg-primary/5">
                <CheckCircle className="h-4 w-4 text-primary" />
                <AlertDescription>
                  <span className="font-semibold">Quyền lợi Membership:</span> Bạn được hoàn tiền cao hơn
                </AlertDescription>
              </Alert>
            )}

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold mb-1">
                  Chính sách hủy: {policy}
                </div>
                <div className="text-sm">{refundInfo}</div>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="cancel-reason">Lý do hủy *</Label>
              <Textarea
                id="cancel-reason"
                placeholder="Vui lòng cho chúng tôi biết lý do..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>

            <div className="rounded-lg border p-3 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tổng đã thanh toán:</span>
                <span className="font-semibold">{booking.totalPrice.toLocaleString("vi-VN")}₫</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Số tiền hoàn lại sẽ được tính dựa trên thời gian hủy và chính sách của listing
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {hasFreeReschedule && (
              <Alert className="border-primary/50 bg-primary/5">
                <CheckCircle className="h-4 w-4 text-primary" />
                <AlertDescription>
                  <span className="font-semibold">Quyền lợi Membership:</span> Thay đổi ngày miễn phí
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-muted-foreground mb-1">Ngày hiện tại</div>
                <div className="font-semibold">
                  {format(checkIn, "dd/MM/yyyy", { locale: vi })}
                </div>
                <div className="font-semibold">
                  {format(checkOut, "dd/MM/yyyy", { locale: vi })}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Ngày mới</div>
                <Input
                  type="date"
                  value={newCheckIn}
                  onChange={(e) => setNewCheckIn(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
                <Input
                  type="date"
                  value={newCheckOut}
                  onChange={(e) => setNewCheckOut(e.target.value)}
                  min={newCheckIn || new Date().toISOString().split('T')[0]}
                  className="mt-2"
                />
              </div>
            </div>

            {!hasFreeReschedule && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {hoursUntilCheckIn < 48
                    ? "Phí thay đổi: 10% (dưới 48 giờ)"
                    : hoursUntilCheckIn < 168
                    ? "Phí thay đổi: 5% (dưới 7 ngày)"
                    : "Thay đổi miễn phí (trên 7 ngày)"}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="reschedule-reason">Lý do (tùy chọn)</Label>
              <Textarea
                id="reschedule-reason"
                placeholder="Chia sẻ lý do thay đổi ngày..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Hủy bỏ
          </Button>
          <Button
            variant={mode === "cancel" ? "destructive" : "default"}
            onClick={mode === "cancel" ? handleCancel : handleReschedule}
            disabled={loading}
          >
            {loading ? "Đang xử lý..." : mode === "cancel" ? "Xác nhận hủy" : "Xác nhận thay đổi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
