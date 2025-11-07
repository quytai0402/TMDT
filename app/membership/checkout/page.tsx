"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Crown, Sparkles, Zap, CreditCard, Building, Wallet, Check, ArrowLeft, Shield, Lock, Loader2, Clock } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { createVietQRUrl, formatTransferReference, getBankTransferInfo } from "@/lib/payments"
import { useSessionRefresh } from "@/hooks/use-session-refresh"

interface MembershipPlan {
  id: string
  slug: string
  name: string
  tagline?: string | null
  description?: string | null
  icon?: string | null
  color?: string | null
  badge?: string | null
  monthlyPrice: number
  annualPrice: number
  savings?: number | null
  isPopular: boolean
  features: string[]
  exclusiveFeatures: string[]
}

const iconComponents: Record<string, React.ComponentType<{ className?: string }>> = {
  sparkles: Sparkles,
  crown: Crown,
  zap: Zap,
}

const resolveSavings = (plan: MembershipPlan | null) => {
  if (!plan) {
    return { savingsAmount: 0, savingsPercent: 0 }
  }
  const yearlyValue = plan.monthlyPrice * 12
  const savingsAmount = Math.max(yearlyValue - plan.annualPrice, 0)
  const savingsPercent = yearlyValue > 0 ? Math.round((savingsAmount / yearlyValue) * 100) : 0
  return { savingsAmount, savingsPercent }
}

export default function MembershipCheckoutPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tier = searchParams.get("tier") || "gold"
  const billing = searchParams.get("billing") || "annually"
  const { status, data: session } = useSession()
  const callbackUrl = `/membership/checkout?tier=${tier}&billing=${billing}`
  const loginUrl = `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
  const refreshSession = useSessionRefresh()
  
  const [paymentMethod, setPaymentMethod] = useState("credit_card")
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [plan, setPlan] = useState<MembershipPlan | null>(null)
  const [loadingPlan, setLoadingPlan] = useState(true)
  const [planError, setPlanError] = useState<string | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    const fetchPlan = async () => {
      try {
        setLoadingPlan(true)
        const response = await fetch(`/api/membership/plans?slug=${tier}`, {
          signal: controller.signal,
          cache: 'no-store',
        })
        if (!response.ok) {
          throw new Error('Failed to fetch membership plan')
        }
        const data = await response.json()
        if (!data.plan) {
          throw new Error('Membership plan not found')
        }
        setPlan(data.plan)
        setPlanError(null)
      } catch (err) {
        if (controller.signal.aborted) return
        console.error('Membership plan fetch error:', err)
        setPlan(null)
        setPlanError('Không tìm thấy gói membership bạn chọn. Vui lòng quay lại và thử lại.')
      } finally {
        if (!controller.signal.aborted) {
          setLoadingPlan(false)
        }
      }
    }

    fetchPlan()
    return () => controller.abort()
  }, [tier])

  const price = plan ? (billing === "monthly" ? plan.monthlyPrice : plan.annualPrice) : 0
  const pricePerMonth = plan ? (billing === "monthly" ? plan.monthlyPrice : Math.round(plan.annualPrice / 12)) : 0
  const { savingsAmount, savingsPercent } = resolveSavings(plan ?? null)
  const iconKey = plan?.icon?.toLowerCase() ?? 'crown'
  const IconComponent = iconComponents[iconKey] ?? Crown
  const gradient = plan?.color ?? 'from-yellow-400 to-yellow-600'
  const planName = plan?.name ?? tier.toUpperCase()
  const bankInfo = getBankTransferInfo()
  const membershipReference = useMemo(() => {
    const userSuffix = session?.user?.id ? session.user.id.slice(-4).toUpperCase() : "GUEST"
    const billingSuffix = billing === "monthly" ? "M" : "Y"
    const base = `${plan?.slug ?? tier}-${billingSuffix}-${userSuffix}`
    return formatTransferReference("MEMBERSHIP", base)
  }, [billing, plan?.slug, session?.user?.id, tier])

  const membershipQrUrl = useMemo(() => {
    if (!price) return null
    return createVietQRUrl(price, membershipReference)
  }, [price, membershipReference])

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const handlePayment = () => {
    if (status !== "authenticated") {
      toast.error("Vui lòng đăng nhập để hoàn tất thanh toán membership.")
      router.push(loginUrl)
      return
    }
    if (!agreeToTerms) {
      alert("Vui lòng đồng ý với điều khoản và điều kiện")
      return
    }
    if (!plan) {
      setPlanError('Vui lòng chọn lại gói membership trước khi thanh toán.')
      return
    }
    setPlanError(null)
    setShowConfirmDialog(true)
  }

  const confirmMembershipPurchase = async () => {
    if (status !== "authenticated") {
      router.push(loginUrl)
      return
    }
    if (!plan) return
    setShowConfirmDialog(false)
    setIsProcessing(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 900))

      const response = await fetch('/api/membership/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planSlug: plan.slug,
          billingCycle: billing,
          paymentMethod,
          referenceCode: membershipReference,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const message = errorData.error ?? 'Không thể kích hoạt membership. Vui lòng thử lại.'
        setPlanError(message)
        toast.error(message)
        return
      }
      const result = await response.json()
      if (result.status === 'PENDING') {
        toast.success('Đã ghi nhận chuyển khoản. Membership sẽ được kích hoạt sau khi xác nhận.')
        await refreshSession()
        router.push(`/membership/success?tier=${plan.slug}&billing=${billing}&status=pending`)
        return
      }
      toast.success('Membership đã được kích hoạt thành công!')
      await refreshSession()
      router.push(`/membership/success?tier=${plan.slug}&billing=${billing}`)
    } catch (error) {
      console.error('Membership payment error:', error)
      const message = 'Có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại.'
      setPlanError(message)
      toast.error(message)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        {status === "loading" && (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {status === "unauthenticated" && (
          <div className="container mx-auto px-4 py-12 max-w-2xl">
            <Card className="border border-dashed border-primary/30 bg-muted/20">
              <CardHeader>
                <CardTitle className="text-2xl">Đăng nhập để mua membership</CardTitle>
                <CardDescription>
                  Bạn cần đăng nhập để tiếp tục mua gói LuxeStay Membership và kích hoạt đặc quyền hội viên.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={() => router.push(loginUrl)} className="w-full">
                  Đăng nhập ngay
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/membership">Xem quyền lợi membership</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {status === "authenticated" && (
          <div className="container mx-auto px-4 py-12">
            {/* Back Button */}
            <Link href="/membership">
              <Button variant="ghost" className="mb-6">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại
              </Button>
            </Link>

            <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {/* Payment Form */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">Thông tin thanh toán</CardTitle>
                    <CardDescription>Chọn phương thức thanh toán phù hợp với bạn</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                  {/* Payment Method Selection */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Phương thức thanh toán</Label>
                    <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                      <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                        <RadioGroupItem value="credit_card" id="credit_card" />
                        <Label htmlFor="credit_card" className="flex items-center gap-2 cursor-pointer flex-1">
                          <CreditCard className="h-5 w-5 text-primary" />
                          <span>Thẻ tín dụng / Thẻ ghi nợ</span>
                        </Label>
                      </div>

                      <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                        <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                        <Label htmlFor="bank_transfer" className="flex items-center gap-2 cursor-pointer flex-1">
                          <Building className="h-5 w-5 text-primary" />
                          <span>Chuyển khoản ngân hàng</span>
                        </Label>
                      </div>

                      <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                        <RadioGroupItem value="e_wallet" id="e_wallet" />
                        <Label htmlFor="e_wallet" className="flex items-center gap-2 cursor-pointer flex-1">
                          <Wallet className="h-5 w-5 text-primary" />
                          <span>Ví điện tử (MoMo, ZaloPay, VNPay)</span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Credit Card Form */}
                  {paymentMethod === "credit_card" && (
                    <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                      <div className="space-y-2">
                        <Label htmlFor="card_number">Số thẻ</Label>
                        <Input
                          id="card_number"
                          placeholder="1234 5678 9012 3456"
                          maxLength={19}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="expiry">Ngày hết hạn</Label>
                          <Input
                            id="expiry"
                            placeholder="MM/YY"
                            maxLength={5}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="cvv">CVV</Label>
                          <Input
                            id="cvv"
                            placeholder="123"
                            maxLength={3}
                            type="password"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="card_name">Tên chủ thẻ</Label>
                        <Input
                          id="card_name"
                          placeholder="NGUYEN VAN A"
                        />
                      </div>

                      <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg text-sm text-blue-900">
                        <Shield className="h-4 w-4" />
                        <span>Thông tin thẻ được mã hóa và bảo mật tuyệt đối</span>
                      </div>
                    </div>
                  )}

                  {/* Bank Transfer Instructions */}
                  {paymentMethod === "bank_transfer" && (
                    <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                        <Clock className="h-4 w-4" />
                        <span>
                          Trạng thái sau khi chuyển khoản:&nbsp;
                          <strong>Chờ xác nhận</strong>
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <p className="text-sm font-medium">Thông tin chuyển khoản:</p>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Ngân hàng:</span>
                          <span className="font-medium">{bankInfo.bankName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Số tài khoản:</span>
                          <span className="font-medium">{bankInfo.accountNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Chủ tài khoản:</span>
                          <span className="font-medium uppercase">{bankInfo.accountName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Nội dung:</span>
                          <span className="font-medium">{membershipReference}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Số tiền:</span>
                          <span className="font-medium">
                            {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price)}
                          </span>
                        </div>
                      </div>

                      {membershipQrUrl && (
                        <div className="flex flex-col md:flex-row md:items-center gap-3">
                          <img
                            src={membershipQrUrl}
                            alt="VietQR chuyển khoản membership"
                            className="h-40 w-40 rounded-lg border bg-white p-2"
                          />
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Quét mã VietQR để điền sẵn thông tin chuyển khoản. Vui lòng kiểm tra kỹ nội dung{" "}
                            <span className="font-semibold text-foreground">{membershipReference}</span> trước khi xác nhận.
                          </p>
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground">
                        * Membership sẽ được kích hoạt trong vòng 24 giờ sau khi LuxeStay nhận được chuyển khoản hợp lệ.
                      </p>
                    </div>
                  )}

                  {/* E-Wallet Options */}
                  {paymentMethod === "e_wallet" && (
                    <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm">Chọn ví điện tử của bạn:</p>
                      <div className="grid grid-cols-3 gap-3">
                        <Button variant="outline" className="h-auto py-4">
                          <div className="text-center">
                            <div className="font-bold text-pink-600">MoMo</div>
                          </div>
                        </Button>
                        <Button variant="outline" className="h-auto py-4">
                          <div className="text-center">
                            <div className="font-bold text-blue-600">ZaloPay</div>
                          </div>
                        </Button>
                        <Button variant="outline" className="h-auto py-4">
                          <div className="text-center">
                            <div className="font-bold text-red-600">VNPay</div>
                          </div>
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Terms Agreement */}
                  <div className="flex items-start space-x-2 pt-4">
                    <Checkbox
                      id="terms"
                      checked={agreeToTerms}
                      onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                    />
                    <label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed">
                      Tôi đồng ý với{" "}
                      <Link href="/terms" className="text-primary hover:underline">
                        Điều khoản dịch vụ
                      </Link>
                      ,{" "}
                      <Link href="/privacy" className="text-primary hover:underline">
                        Chính sách bảo mật
                      </Link>
                      {" "}và{" "}
                      <Link href="/membership/terms" className="text-primary hover:underline">
                        Điều khoản membership
                      </Link>
                    </label>
                  </div>
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handlePayment}
                    disabled={!agreeToTerms || isProcessing || loadingPlan || !plan}
                  >
                    {isProcessing ? (
                      "Đang xử lý..."
                    ) : (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        {paymentMethod === "bank_transfer" ? "Gửi yêu cầu chuyển khoản" : "Thanh toán"} {formatPrice(price)}
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Tóm tắt đơn hàng</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {planError && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                      {planError}
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <div className={cn("inline-flex w-12 h-12 items-center justify-center rounded-lg bg-gradient-to-br shrink-0", gradient)}>
                      {loadingPlan ? (
                        <Skeleton className="h-6 w-6 rounded-md" />
                      ) : (
                        <IconComponent className="h-6 w-6 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      {loadingPlan ? (
                        <div className="space-y-2">
                          <Skeleton className="h-5 w-36" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      ) : (
                        <>
                          <h3 className="font-semibold text-lg">{planName} Membership</h3>
                          {plan?.tagline && (
                            <p className="text-sm text-muted-foreground">{plan.tagline}</p>
                          )}
                          <p className="text-sm text-muted-foreground">
                            {billing === "monthly" ? "Thanh toán hàng tháng" : "Thanh toán hàng năm"}
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {billing === "monthly" ? "Phí hàng tháng" : "Phí hàng năm"}
                      </span>
                      {loadingPlan ? (
                        <Skeleton className="h-4 w-24" />
                      ) : (
                        <span className="font-medium">{formatPrice(price)}</span>
                      )}
                    </div>

                    {billing === "annually" && !loadingPlan && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Giá trị mỗi tháng</span>
                          <span className="font-medium">{formatPrice(pricePerMonth)}</span>
                        </div>
                        {savingsAmount > 0 && (
                          <div className="flex justify-between text-sm text-green-600">
                            <span>Tiết kiệm</span>
                            <span className="font-semibold">
                              {formatPrice(savingsAmount)}
                              {savingsPercent > 0 ? ` (~${savingsPercent}%)` : ""}
                            </span>
                          </div>
                        )}
                      </>
                    )}

                    <Separator />

                    <div className="flex justify-between text-base font-bold">
                      <span>Tổng cộng</span>
                      {loadingPlan ? (
                        <Skeleton className="h-5 w-24" />
                      ) : (
                        <span>{formatPrice(price)}</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 pt-3">
                    <p className="text-sm font-semibold">Quyền lợi chính:</p>
                    {loadingPlan ? (
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                        <Skeleton className="h-4 w-2/3" />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {(plan?.features.slice(0, 3) ?? []).map((feature, index) => (
                          <div key={index} className="flex items-start gap-2 text-sm">
                            <Check className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </div>
                        ))}
                        {(plan?.exclusiveFeatures.slice(0, 2) ?? []).map((feature, index) => (
                          <div key={`exclusive-${index}`} className="flex items-start gap-2 text-sm">
                            <Lock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-center gap-2 p-3 bg-muted rounded-lg">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Thanh toán an toàn & bảo mật</span>
                  </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
      {status === "authenticated" && (
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận thanh toán membership</AlertDialogTitle>
              <AlertDialogDescription>
                {paymentMethod === "bank_transfer"
                  ? "Sau khi bạn chuyển khoản thành công, đội ngũ LuxeStay sẽ kiểm tra giao dịch và kích hoạt đặc quyền trong tối đa 24 giờ làm việc."
                  : `LuxeStay đang giữ chỗ gói ${plan?.name}. Vui lòng xác nhận bạn đã hoàn tất thanh toán ${
                      billing === "monthly" ? "tháng đầu tiên" : "trọn gói 12 tháng"
                    } để kích hoạt đặc quyền.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-3 rounded-md border bg-muted/20 p-4 text-sm">
              <div className="flex items-center justify-between">
                <span>Gói</span>
                <span className="font-medium text-foreground">{plan?.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Kỳ thanh toán</span>
                <span className="font-medium text-foreground">
                  {billing === "monthly" ? "Hàng tháng" : "Hàng năm"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Số tiền</span>
                <span className="font-semibold text-primary">
                  {formatPrice(billing === "monthly" ? plan?.monthlyPrice ?? 0 : plan?.annualPrice ?? 0)}
                </span>
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isProcessing}>Hủy</AlertDialogCancel>
              <AlertDialogAction onClick={confirmMembershipPurchase} disabled={isProcessing}>
                {paymentMethod === "bank_transfer" ? "Tôi đã chuyển khoản" : "Tôi đã thanh toán"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
