"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Crown, Sparkles, Zap, Star, Heart, Calendar, Gift, Users, Lock } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

type BillingCycle = "monthly" | "annually"

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
  heart: Heart,
  star: Star,
}

export function MembershipPricing() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("annually")
  const [plans, setPlans] = useState<MembershipPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const controller = new AbortController()

    const fetchPlans = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/membership/plans', {
          signal: controller.signal,
          cache: 'no-store',
        })
        if (!response.ok) {
          throw new Error('Failed to fetch membership plans')
        }
        const data = await response.json()
        setPlans(data.plans ?? [])
        setError(null)
      } catch (err) {
        if (controller.signal.aborted) return
        console.error('Fetch membership plans error:', err)
        setError('Không thể tải gói membership. Vui lòng thử lại sau.')
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    fetchPlans()
    return () => controller.abort()
  }, [])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  const handleSubscribe = (tierId: string) => {
    // Redirect to payment page with membership tier and billing cycle
    router.push(`/membership/checkout?tier=${tierId}&billing=${billingCycle}`)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
          <Crown className="h-4 w-4" />
          <span className="text-sm font-medium">Premium Membership</span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Chọn gói thành viên phù hợp</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Trải nghiệm nghỉ dưỡng đẳng cấp với ưu đãi độc quyền, dịch vụ cá nhân hóa và quyền lợi vượt trội
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant={billingCycle === "monthly" ? "default" : "outline"}
          onClick={() => setBillingCycle("monthly")}
          className="min-w-[120px]"
        >
          Theo tháng
        </Button>
        <Button
          variant={billingCycle === "annually" ? "default" : "outline"}
          onClick={() => setBillingCycle("annually")}
          className="min-w-[120px]"
        >
          Theo năm
        </Button>
        {billingCycle === "annually" && (
          <Badge variant="secondary" className="ml-2">
            <Gift className="h-3 w-3 mr-1" />
            Tiết kiệm đến 20%
          </Badge>
        )}
      </div>

      {error && !loading && (
        <div className="max-w-3xl mx-auto text-center text-sm text-red-600 bg-red-50 border border-red-200 rounded-md py-3 px-4">
          {error}
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <Card key={`plan-skeleton-${index}`} className="relative overflow-hidden">
              <CardHeader>
                <Skeleton className="h-12 w-12 rounded-lg mb-4" />
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-52 mt-2" />
                <div className="pt-4 space-y-2">
                  <Skeleton className="h-8 w-36" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 5 }).map((__, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))
        ) : plans.length === 0 ? (
          <div className="md:col-span-3 text-center text-muted-foreground">
            Hiện chưa có gói membership khả dụng. Vui lòng quay lại sau.
          </div>
        ) : (
          plans.map((plan) => {
            const iconKey = plan.icon?.toLowerCase() ?? ''
            const IconComponent = iconComponents[iconKey] ?? Sparkles
            const gradient = plan.color ?? 'from-slate-400 to-slate-600'
            const pricePerMonth = billingCycle === "monthly" ? plan.monthlyPrice : Math.round(plan.annualPrice / 12)
            const savings = plan.savings ?? Math.max(plan.monthlyPrice * 12 - plan.annualPrice, 0)

            return (
              <Card
                key={plan.id}
                className={cn(
                  "relative overflow-hidden transition-all duration-300 hover:shadow-xl",
                  plan.isPopular && "border-primary shadow-lg scale-105"
                )}
              >
                {plan.badge && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-primary">{plan.badge}</Badge>
                  </div>
                )}

                <CardHeader>
                  <div className={cn("inline-flex w-12 h-12 items-center justify-center rounded-lg bg-gradient-to-br mb-4", gradient)}>
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>

                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  {(plan.tagline ?? plan.description) && (
                    <CardDescription className="text-base">
                      {plan.tagline ?? plan.description}
                    </CardDescription>
                  )}

                  <div className="pt-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">{formatPrice(pricePerMonth)}</span>
                      <span className="text-muted-foreground">/tháng</span>
                    </div>
                    {billingCycle === "annually" && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Thanh toán {formatPrice(plan.annualPrice)} mỗi năm
                      </p>
                    )}
                    {billingCycle === "annually" && savings > 0 && (
                      <p className="text-sm text-green-600 font-medium mt-1">
                        Tiết kiệm {formatPrice(savings)}/năm
                      </p>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {plan.exclusiveFeatures.length > 0 && (
                    <div className="space-y-3 pt-3 border-t">
                      <div className="flex items-center gap-2 text-primary font-medium">
                        <Lock className="h-4 w-4" />
                        <span className="text-sm">Đặc quyền độc quyền</span>
                      </div>
                      {plan.exclusiveFeatures.map((feature, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <Star className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                          <span className="text-sm font-medium">{feature}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    onClick={() => handleSubscribe(plan.slug)}
                  >
                    Chọn gói {plan.name}
                  </Button>
                </CardFooter>
              </Card>
            )
          })
        )}
      </div>

      {/* Benefits Comparison */}
      <div className="mt-16 space-y-6">
        <h2 className="text-2xl font-bold text-center">So sánh quyền lợi chi tiết</h2>
        
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Value Benefits */}
          <Card>
            <CardHeader>
              <Heart className="h-8 w-8 text-red-500 mb-2" />
              <CardTitle>Tiết kiệm & Ưu đãi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between items-center">
                <span>Giảm giá booking</span>
                <div className="flex gap-2">
                  <Badge variant="outline">5%</Badge>
                  <Badge variant="outline">10%</Badge>
                  <Badge variant="outline">15%</Badge>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Đêm miễn phí/năm</span>
                <div className="flex gap-2">
                  <Badge variant="outline">0</Badge>
                  <Badge variant="outline">2</Badge>
                  <Badge variant="outline">4</Badge>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Welcome gift</span>
                <div className="flex gap-2">
                  <span className="text-muted-foreground">-</span>
                  <Check className="h-5 w-5 text-green-600" />
                  <Check className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Experience Benefits */}
          <Card>
            <CardHeader>
              <Calendar className="h-8 w-8 text-blue-500 mb-2" />
              <CardTitle>Trải nghiệm</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between items-center">
                <span>Room upgrade</span>
                <div className="flex gap-2">
                  <span className="text-muted-foreground">-</span>
                  <span className="text-muted-foreground text-xs">Nếu có</span>
                  <Check className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Late checkout</span>
                <div className="flex gap-2">
                  <span className="text-muted-foreground">-</span>
                  <Check className="h-5 w-5 text-green-600" />
                  <Check className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Concierge service</span>
                <div className="flex gap-2">
                  <span className="text-muted-foreground">-</span>
                  <span className="text-muted-foreground">-</span>
                  <Check className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Access Benefits */}
          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-purple-500 mb-2" />
              <CardTitle>Quyền truy cập</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between items-center">
                <span>Secret listings</span>
                <div className="flex gap-2">
                  <span className="text-muted-foreground">-</span>
                  <Badge variant="outline">50+</Badge>
                  <Badge variant="outline">100+</Badge>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Member events</span>
                <div className="flex gap-2">
                  <span className="text-muted-foreground">-</span>
                  <Check className="h-5 w-5 text-green-600" />
                  <Badge variant="secondary">VIP</Badge>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Tích điểm</span>
                <div className="flex gap-2">
                  <Badge variant="outline">x1.5</Badge>
                  <Badge variant="outline">x2</Badge>
                  <Badge variant="outline">x3</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <Card className="bg-gradient-to-br from-primary/10 to-purple-500/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-bold">Chưa chắc chắn?</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Hãy bắt đầu với gói Silver và nâng cấp bất kỳ lúc nào. Hoặc liên hệ với đội ngũ tư vấn để tìm gói phù hợp nhất với bạn.
            </p>
            <div className="flex justify-center gap-4 pt-2">
              <Button variant="outline" size="lg">
                So sánh chi tiết
              </Button>
              <Button size="lg">
                Liên hệ tư vấn
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
