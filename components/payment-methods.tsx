"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CreditCard, Smartphone, Building2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface PaymentMethodsProps {
  bookingId?: string
  amount?: number
  bookingCode?: string
  disabled?: boolean
}

export function PaymentMethods({ bookingId, amount, bookingCode, disabled = false }: PaymentMethodsProps) {
  const [paymentMethod, setPaymentMethod] = useState("vnpay")
  const [isProcessing, setIsProcessing] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handlePayment = async () => {
    if (disabled || !bookingId) {
      toast({
        title: "Chưa sẵn sàng thanh toán",
        description: "Vui lòng hoàn tất các bước bên trên trước khi thanh toán.",
      })
      return
    }

    setIsProcessing(true)

    try {
      const response = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          paymentMethod,
          amount: amount || 0,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Tạo thanh toán thất bại")
      }

      // Redirect to payment gateway
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl
      } else {
        // For other payment methods
        router.push(`/booking/success?bookingId=${bookingId}`)
      }
    } catch (error: any) {
      toast({
        title: "Lỗi thanh toán",
        description: error.message || "Có lỗi xảy ra khi xử lý thanh toán",
        variant: "destructive",
      })
      setIsProcessing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Phương thức thanh toán</CardTitle>
        {bookingCode && (
          <p className="text-sm text-muted-foreground">
            Mã đặt phòng của bạn: <span className="font-semibold text-foreground">{bookingCode}</span>
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {disabled && (
          <div className="rounded-lg border border-dashed border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            Hoàn tất thông tin khách và nhấn <span className="font-semibold">"Xác nhận &amp; tạo đơn đặt phòng"</span> trước khi chọn phương thức thanh toán.
          </div>
        )}

        <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
          {/* Credit Card */}
          <div className="flex items-start space-x-3 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="card" id="card" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="card" className="flex items-center space-x-2 cursor-pointer">
                <CreditCard className="h-5 w-5" />
                <span className="font-semibold">Thẻ tín dụng / Thẻ ghi nợ</span>
              </Label>
              {paymentMethod === "card" && (
                <div className="mt-4 space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">Số thẻ</Label>
                    <Input id="cardNumber" placeholder="1234 5678 9012 3456" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="expiry">Ngày hết hạn</Label>
                      <Input id="expiry" placeholder="MM/YY" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cvv">CVV</Label>
                      <Input id="cvv" placeholder="123" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* E-Wallet */}
          <div className="flex items-start space-x-3 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="vnpay" id="vnpay" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="vnpay" className="flex items-center space-x-2 cursor-pointer">
                <Smartphone className="h-5 w-5" />
                <span className="font-semibold">VNPay</span>
              </Label>
              <p className="text-sm text-muted-foreground mt-1">Thanh toán qua VNPay</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="momo" id="momo" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="momo" className="flex items-center space-x-2 cursor-pointer">
                <Smartphone className="h-5 w-5" />
                <span className="font-semibold">Momo</span>
              </Label>
              <p className="text-sm text-muted-foreground mt-1">Thanh toán qua ví Momo</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="zalopay" id="zalopay" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="zalopay" className="flex items-center space-x-2 cursor-pointer">
                <Smartphone className="h-5 w-5" />
                <span className="font-semibold">ZaloPay</span>
              </Label>
              <p className="text-sm text-muted-foreground mt-1">Thanh toán qua ví ZaloPay</p>
            </div>
          </div>

          {/* Bank Transfer */}
          <div className="flex items-start space-x-3 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="bank" id="bank" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="bank" className="flex items-center space-x-2 cursor-pointer">
                <Building2 className="h-5 w-5" />
                <span className="font-semibold">Chuyển khoản ngân hàng</span>
              </Label>
              {paymentMethod === "bank" && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Thông tin chuyển khoản sẽ được gửi qua email</p>
                </div>
              )}
            </div>
          </div>
        </RadioGroup>

        <div className="pt-4 border-t border-border">
          <Button 
            className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-6 text-lg"
            onClick={handlePayment}
            disabled={isProcessing || disabled}
          >
            {isProcessing ? "Đang xử lý..." : "Xác nhận và thanh toán"}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-3">
            Bằng cách nhấn nút trên, bạn đồng ý với{" "}
            <a href="/terms" className="underline hover:text-foreground">
              Điều khoản dịch vụ
            </a>{" "}
            và{" "}
            <a href="/privacy" className="underline hover:text-foreground">
              Chính sách bảo mật
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
