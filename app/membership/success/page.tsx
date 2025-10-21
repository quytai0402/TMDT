"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Crown, Sparkles, Zap, CheckCircle, Calendar, Gift, Mail } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

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

export default function MembershipSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tier = searchParams.get("tier") || "gold"
  const billing = searchParams.get("billing") || "annually"
  const [plan, setPlan] = useState<MembershipPlan | null>(null)
  const [loadingPlan, setLoadingPlan] = useState(true)
  const [planError, setPlanError] = useState<string | null>(null)

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
      } catch (error) {
        if (controller.signal.aborted) return
        console.error('Membership plan load failed:', error)
        setPlan(null)
        setPlanError('Không tìm thấy thông tin gói membership. Vui lòng quay lại trang membership để chọn lại.')
      } finally {
        if (!controller.signal.aborted) {
          setLoadingPlan(false)
        }
      }
    }

    fetchPlan()
    return () => controller.abort()
  }, [tier])

  const planName = plan?.name ?? tier.toUpperCase()
  const iconKey = plan?.icon?.toLowerCase() ?? 'crown'
  const IconComponent = iconComponents[iconKey] ?? Crown
  const gradient = plan?.color ?? 'from-yellow-400 to-yellow-600'
  const billingLabel = billing === "monthly" ? "Hàng tháng" : "Hàng năm"

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto space-y-8">
            {/* Success Message */}
            <Card className="text-center overflow-hidden">
              <CardContent className="pt-12 pb-8 space-y-6">
                {/* Success Icon */}
                <div className="flex justify-center">
                  <div className="relative">
                    <div className={cn("w-24 h-24 rounded-full bg-gradient-to-br flex items-center justify-center animate-pulse", gradient)}>
                      {loadingPlan ? (
                        <Skeleton className="h-8 w-8 rounded-full" />
                      ) : (
                        <IconComponent className="h-8 w-8 text-white" />
                      )}
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center border-4 border-white">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>

                {/* Congratulations */}
                <div className="space-y-2">
                  <h1 className="text-4xl font-bold">Chúc mừng! 🎉</h1>
                  {loadingPlan ? (
                    <Skeleton className="h-6 w-64 mx-auto" />
                  ) : (
                    <p className="text-xl text-muted-foreground">
                      Bạn đã trở thành <span className="font-bold text-foreground">{planName} Member</span>
                    </p>
                  )}
                </div>

                {/* Membership Badge */}
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-primary/10 rounded-full">
                  <div className={cn("w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center text-white", gradient)}>
                    {loadingPlan ? (
                      <Skeleton className="h-4 w-4 rounded-full" />
                    ) : (
                      <IconComponent className="h-4 w-4" />
                    )}
                  </div>
                  {loadingPlan ? (
                    <Skeleton className="h-5 w-40" />
                  ) : (
                    <span className="font-semibold text-lg">{planName} Membership</span>
                  )}
                  <Badge variant="secondary">{billingLabel}</Badge>
                </div>

                {/* Description */}
                {planError ? (
                  <p className="text-sm text-red-600 max-w-xl mx-auto">{planError}</p>
                ) : (
                  <p className="text-muted-foreground max-w-xl mx-auto">
                    Membership của bạn đã được kích hoạt thành công. Bạn có thể bắt đầu trải nghiệm các đặc quyền và ưu đãi ngay bây giờ!
                  </p>
                )}
              </CardContent>
            </Card>

            {/* What's Next */}
            <Card>
              <CardContent className="pt-6 space-y-6">
                <h2 className="text-2xl font-bold text-center">Bước tiếp theo</h2>

                <div className="grid md:grid-cols-3 gap-4">
                  <Link href="/" className="block">
                    <div className="p-4 rounded-lg border hover:border-primary hover:shadow-md transition-all cursor-pointer h-full">
                      <div className="flex flex-col items-center text-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <Gift className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">Khám phá ngay</h3>
                          <p className="text-sm text-muted-foreground">
                            Tìm homestay và nhận ưu đãi member
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>

                  <Link href="/profile" className="block">
                    <div className="p-4 rounded-lg border hover:border-primary hover:shadow-md transition-all cursor-pointer h-full">
                      <div className="flex flex-col items-center text-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                          <Calendar className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">Xem membership</h3>
                          <p className="text-sm text-muted-foreground">
                            Kiểm tra quyền lợi và thông tin
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>

                  <Link href="/rewards" className="block">
                    <div className="p-4 rounded-lg border hover:border-primary hover:shadow-md transition-all cursor-pointer h-full">
                      <div className="flex flex-col items-center text-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                          <Mail className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">Rewards của bạn</h3>
                          <p className="text-sm text-muted-foreground">
                            Xem điểm và phần thưởng
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Important Info */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <h3 className="font-semibold text-lg">Thông tin quan trọng</h3>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <p>
                      Email xác nhận đã được gửi đến hộp thư của bạn với thông tin chi tiết về membership
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <p>
                      Ưu đãi member sẽ được tự động áp dụng khi bạn đặt phòng
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <p>
                      {billing === "monthly" 
                        ? "Membership sẽ tự động gia hạn hàng tháng. Bạn có thể hủy bất kỳ lúc nào."
                        : "Membership sẽ tự động gia hạn sau 12 tháng. Bạn có thể hủy bất kỳ lúc nào."}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <p>
                      Nếu cần hỗ trợ, vui lòng liên hệ <a href="mailto:support@homestay.vn" className="text-primary hover:underline">support@homestay.vn</a>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => router.push("/")}>
                Khám phá homestays
              </Button>
              <Button size="lg" variant="outline" onClick={() => router.push("/profile")}>
                Xem hồ sơ của tôi
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
