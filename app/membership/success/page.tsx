"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Crown, Sparkles, Zap, CheckCircle, Calendar, Gift, Map, ShieldCheck } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type MembershipStatusValue = "INACTIVE" | "ACTIVE" | "EXPIRED" | "CANCELLED"
type MembershipBillingCycleValue = "MONTHLY" | "ANNUAL" | null

interface MembershipPlan {
  slug: string
  name: string
  tagline?: string | null
  description?: string | null
  icon?: string | null
  color?: string | null
  badge?: string | null
  monthlyPrice?: number | null
  annualPrice?: number | null
  savings?: number | null
  isPopular?: boolean
  features: string[]
  exclusiveFeatures: string[]
}

interface MembershipInfo {
  status: MembershipStatusValue
  isActive: boolean
  startedAt: string | null
  expiresAt: string | null
  billingCycle: MembershipBillingCycleValue
  features: string[]
  plan: MembershipPlan | null
}

interface MembershipStatusResponse {
  membership: MembershipInfo | null
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
  const [membership, setMembership] = useState<MembershipInfo | null>(null)
  const [loadingMembership, setLoadingMembership] = useState(true)
  const [membershipError, setMembershipError] = useState<string | null>(null)
  const [plan, setPlan] = useState<MembershipPlan | null>(null)
  const [loadingPlan, setLoadingPlan] = useState(true)
  const [planError, setPlanError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    const fetchStatus = async () => {
      try {
        setLoadingMembership(true)
        const response = await fetch("/api/membership/status", {
          signal: controller.signal,
          cache: "no-store",
        })
        if (controller.signal.aborted) return

        if (response.status === 401) {
          setMembership(null)
          setMembershipError("Bạn cần đăng nhập để xem thông tin membership. Vui lòng đăng nhập lại.")
          return
        }

        if (!response.ok) {
          throw new Error("Failed to fetch membership status")
        }

        const data: MembershipStatusResponse = await response.json()
        setMembership(data.membership ?? null)
        setMembershipError(null)
      } catch (error) {
        if (controller.signal.aborted) return
        console.error("Membership status load failed:", error)
        setMembership(null)
        setMembershipError("Không thể tải trạng thái membership. Vui lòng thử lại sau.")
      } finally {
        if (!controller.signal.aborted) {
          setLoadingMembership(false)
        }
      }
    }

    fetchStatus()
    return () => controller.abort()
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    if (membership?.plan) {
      setPlan({
        slug: membership.plan.slug,
        name: membership.plan.name,
        icon: membership.plan.icon ?? null,
        color: membership.plan.color ?? null,
        badge: membership.plan.badge,
        features: membership.plan.features ?? [],
        exclusiveFeatures: membership.plan.exclusiveFeatures ?? [],
      })
      setPlanError(null)
      setLoadingPlan(false)
      return () => controller.abort()
    }

    const planSlug = tier
    if (!planSlug) {
      setLoadingPlan(false)
      return () => controller.abort()
    }

    const fetchPlan = async () => {
      try {
        setLoadingPlan(true)
        const response = await fetch(`/api/membership/plans?slug=${planSlug}`, {
          signal: controller.signal,
          cache: "no-store",
        })
        if (!response.ok) {
          throw new Error("Failed to fetch membership plan")
        }
        const data = await response.json()
        if (!data.plan) {
          throw new Error("Membership plan not found")
        }
        setPlan(data.plan)
        setPlanError(null)
      } catch (error) {
        if (controller.signal.aborted) return
        console.error("Membership plan load failed:", error)
        setPlan(null)
        setPlanError("Không tìm thấy thông tin gói membership. Vui lòng quay lại trang membership để chọn lại.")
      } finally {
        if (!controller.signal.aborted) {
          setLoadingPlan(false)
        }
      }
    }

    fetchPlan()
    return () => controller.abort()
  }, [membership, tier])

  const isLoading = loadingMembership || loadingPlan
  const planName = plan?.name ?? tier.toUpperCase()
  const iconKey = plan?.icon?.toLowerCase() ?? "crown"
  const IconComponent = iconComponents[iconKey] ?? Crown
  const gradient = plan?.color ?? "from-yellow-400 to-yellow-600"
  const billingLabel = membership?.billingCycle
    ? membership.billingCycle === "MONTHLY"
      ? "Hàng tháng"
      : "Hàng năm"
    : billing === "monthly"
      ? "Hàng tháng"
      : "Hàng năm"
  const startedAt = membership?.startedAt ? new Date(membership.startedAt) : null
  const expiresAt = membership?.expiresAt ? new Date(membership.expiresAt) : null
  const isActiveMember = membership?.isActive ?? false
  const statusLabelMap: Record<MembershipStatusValue, string> = {
    ACTIVE: "Đang hoạt động",
    EXPIRED: "Đã hết hạn",
    CANCELLED: "Đã hủy",
    INACTIVE: "Chưa kích hoạt",
  }
  const statusLabel = membership ? statusLabelMap[membership.status] ?? membership.status : "Đang xử lý"
  const errorMessage = membershipError ?? planError

  const combinedFeatures = useMemo(() => {
    const planFeatures = plan?.features ?? []
    const exclusive = plan?.exclusiveFeatures ?? []
    const memberFeatures = membership?.features ?? []
    return Array.from(new Set([...planFeatures, ...exclusive, ...memberFeatures]))
  }, [membership, plan])

  const exclusiveFeatureSet = useMemo(() => {
    return new Set(plan?.exclusiveFeatures ?? [])
  }, [plan])

  const formatDate = (date: Date | null) => {
    if (!date) return "—"
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date)
  }

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
                    <div
                      className={cn(
                        "w-24 h-24 rounded-full bg-gradient-to-br flex items-center justify-center",
                        gradient,
                        isActiveMember ? "animate-pulse" : "opacity-70"
                      )}
                    >
                      {isLoading ? (
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
                  {isLoading ? (
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
                    {isLoading ? (
                      <Skeleton className="h-4 w-4 rounded-full" />
                    ) : (
                      <IconComponent className="h-4 w-4" />
                    )}
                  </div>
                  {isLoading ? (
                    <Skeleton className="h-5 w-40" />
                  ) : (
                    <span className="font-semibold text-lg">{planName} Membership</span>
                  )}
                  <Badge variant={isActiveMember ? "default" : "secondary"}>{statusLabel}</Badge>
                  <Badge variant="outline">{billingLabel}</Badge>
                </div>

                {/* Description */}
                {errorMessage ? (
                  <p className="text-sm text-red-600 max-w-xl mx-auto">{errorMessage}</p>
                ) : (
                  <p className="text-muted-foreground max-w-xl mx-auto">
                    Membership của bạn đã được kích hoạt thành công. Bạn có thể bắt đầu tận hưởng đầy đủ đặc quyền
                    và ưu đãi ngay bây giờ!
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Membership Status */}
            <Card>
              <CardContent className="pt-6 space-y-6">
                <h2 className="text-2xl font-bold text-center">Membership của bạn</h2>
                <div className="grid gap-4 md:grid-cols-3 text-left">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Trạng thái</p>
                    {isLoading ? (
                      <Skeleton className="h-5 w-32" />
                    ) : (
                      <p className="text-lg font-semibold">{statusLabel}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Kích hoạt</p>
                    {isLoading ? (
                      <Skeleton className="h-5 w-32" />
                    ) : (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="font-medium">{formatDate(startedAt)}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Gia hạn / hết hạn</p>
                    {isLoading ? (
                      <Skeleton className="h-5 w-36" />
                    ) : (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="font-medium">{formatDate(expiresAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  {isActiveMember
                    ? "Quyền lợi member đang được áp dụng tự động trên booking, Secret Collection và trải nghiệm dành riêng cho bạn."
                    : "Chúng tôi đang kích hoạt membership của bạn. Vui lòng tải lại trang sau ít phút để cập nhật."}
                </p>
              </CardContent>
            </Card>

            {/* Benefits */}
            <Card>
              <CardContent className="pt-6 space-y-5">
                <h2 className="text-2xl font-bold text-center">Đặc quyền đã mở khóa</h2>
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-4/5" />
                    <Skeleton className="h-5 w-2/3" />
                  </div>
                ) : combinedFeatures.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center">
                    Chưa có đặc quyền nào được ghi nhận. Vui lòng liên hệ hỗ trợ nếu bạn nghĩ đây là lỗi.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {combinedFeatures.map((feature) => (
                      <div key={feature} className="flex items-start gap-3">
                        <div className="mt-1 rounded-full bg-primary/10 text-primary p-1">
                          <CheckCircle className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">{feature}</p>
                          {exclusiveFeatureSet.has(feature) && (
                            <Badge variant="secondary" className="mt-1">
                              Member độc quyền
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* What's Next */}
            <Card>
              <CardContent className="pt-6 space-y-6">
                <h2 className="text-2xl font-bold text-center">Bước tiếp theo</h2>

                <div className="grid md:grid-cols-2 gap-4">
                  <Link href="/collections/secret" className="block">
                    <div className="p-4 rounded-lg border hover:border-primary hover:shadow-md transition-all cursor-pointer h-full">
                      <div className="flex flex-col items-center text-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <Sparkles className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">Secret Collection</h3>
                          <p className="text-sm text-muted-foreground">
                            Truy cập các homestay chỉ dành cho member và ưu đãi riêng.
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>

                  <Link href="/experiences/members" className="block">
                    <div className="p-4 rounded-lg border hover:border-primary hover:shadow-md transition-all cursor-pointer h-full">
                      <div className="flex flex-col items-center text-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                          <Map className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">Workshop & City Tour</h3>
                          <p className="text-sm text-muted-foreground">
                            Đặt chỗ trong các hoạt động độc quyền cho thành viên.
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>

                  <Link href="/profile" className="block">
                    <div className="p-4 rounded-lg border hover:border-primary hover:shadow-md transition-all cursor-pointer h-full">
                      <div className="flex flex-col items-center text-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                          <ShieldCheck className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">Quản lý membership</h3>
                          <p className="text-sm text-muted-foreground">
                            Kiểm tra quyền lợi, lịch gia hạn và lịch sử thanh toán.
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>

                  <Link href="/rewards" className="block">
                    <div className="p-4 rounded-lg border hover:border-primary hover:shadow-md transition-all cursor-pointer h-full">
                      <div className="flex flex-col items-center text-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                          <Gift className="h-6 w-6 text-green-600" />
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
                      Email xác nhận đã được gửi đến hộp thư của bạn với thông tin chi tiết về membership.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <p>
                      Giảm giá và quyền lợi member tự động áp dụng cho mọi booking đủ điều kiện mà không cần nhập mã.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <p>
                      Secret Collection, workshop và city tour đã mở khóa trong tài khoản của bạn ngay lập tức.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <p>
                      {billing === "monthly"
                        ? "Membership sẽ tự động gia hạn hàng tháng. Bạn có thể hủy bất kỳ lúc nào trong phần hồ sơ."
                        : "Membership sẽ tự động gia hạn sau 12 tháng. Bạn có thể hủy bất kỳ lúc nào trong phần hồ sơ."}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <p>
                      Nếu cần hỗ trợ, vui lòng liên hệ{" "}
                      <a href="mailto:support@homestay.vn" className="text-primary hover:underline">
                        support@homestay.vn
                      </a>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => router.push("/collections/secret")}>
                Khám phá Secret Collection
              </Button>
              <Button size="lg" variant="secondary" onClick={() => router.push("/experiences/members")}>
                Workshop & city tour
              </Button>
              <Button size="lg" variant="outline" onClick={() => router.push("/")}>
                Về trang chủ
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
