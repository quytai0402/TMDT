"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"

import {
  Award,
  Calendar,
  Gift,
  Loader2,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react"

interface LoyaltyData {
  user: {
    id: string
    name: string | null
    image: string | null
    points: number
    tier: string
    totalBookings: number
    totalReviews: number
    memberSince: string
    progressToNextTier: number
    pointsToNextTier: number | null
  }
  currentTier: {
    name: string
    tier: string
    level: number
    minPoints: number
    maxPoints: number | null
    benefits: string[]
    color: string
    nextTier: string | null
    pointsToNext: number | null
    bonusMultiplier: number
  }
  allTiers: Array<{
    name: string
    tier: string
    level: number
    minPoints: number
    maxPoints: number | null
    benefits: string[]
    color: string
  }>
  metrics: {
    bookingsThisYear: number
    freeNightsRemaining: number
    freeNightsUsed: number
    upgradesReceived: number
    eventsAttended: number
    totalSavings: number
  }
  recentActivity: Array<{
    id: string
    title: string
    location?: string | null
    date: string
    points: number
    type?: string
  }>
}

export function GamificationDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [data, setData] = useState<LoyaltyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLoyaltyData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch("/api/loyalty", { cache: "no-store" })
      if (!res.ok) {
        throw new Error("Không thể tải dữ liệu loyalty")
      }
      const loyalty = await res.json()

      const tiers = loyalty.allTiers ?? []
      const currentTierRaw = loyalty.currentTier ?? tiers[0]
      const currentIndex = tiers.findIndex((tier: any) => tier.tier === currentTierRaw?.tier)
      const normalizedIndex = currentIndex >= 0 ? currentIndex : 0
      const nextTier = tiers.find((tier: any) => tier.displayOrder > (currentTierRaw?.displayOrder ?? 0)) ?? null

      const formatted: LoyaltyData = {
        user: {
          id: loyalty.user.id,
          name: loyalty.user.name,
          image: loyalty.user.image,
          points: loyalty.user.points,
          tier: loyalty.user.tier,
          totalBookings: loyalty.user.totalBookings ?? 0,
          totalReviews: loyalty.user.totalReviews ?? 0,
          memberSince: loyalty.user.memberSince,
          progressToNextTier: loyalty.user.progressToNextTier ?? 0,
          pointsToNextTier: loyalty.user.pointsToNextTier ?? null,
        },
        currentTier: {
          name: currentTierRaw?.name ?? "Member",
          tier: currentTierRaw?.tier ?? "BRONZE",
          level: normalizedIndex + 1,
          minPoints: currentTierRaw?.minPoints ?? 0,
          maxPoints: currentTierRaw?.maxPoints ?? null,
          benefits: currentTierRaw?.benefits ?? [],
          color: currentTierRaw?.color ?? "#5b5fc7",
          nextTier: nextTier?.name ?? null,
          pointsToNext: loyalty.user.pointsToNextTier ?? null,
          bonusMultiplier: currentTierRaw?.bonusMultiplier ?? 1,
        },
        allTiers: tiers.map((tier: any, index: number) => ({
          name: tier.name,
          tier: tier.tier,
          level: index + 1,
          minPoints: tier.minPoints ?? 0,
          maxPoints: tier.maxPoints ?? null,
          benefits: tier.benefits ?? [],
          color: tier.color ?? "#6366f1",
        })),
        metrics: {
          bookingsThisYear: loyalty.metrics?.bookingsThisYear ?? 0,
          freeNightsRemaining: loyalty.metrics?.freeNightsRemaining ?? 0,
          freeNightsUsed: loyalty.metrics?.freeNightsUsed ?? 0,
          upgradesReceived: loyalty.metrics?.upgradesReceived ?? 0,
          eventsAttended: loyalty.metrics?.eventsAttended ?? 0,
          totalSavings: loyalty.metrics?.totalSavings ?? 0,
        },
        recentActivity: (loyalty.recentActivity ?? []).map((activity: any) => ({
          id: String(activity.id ?? crypto.randomUUID()),
          title: activity.title ?? "Hoạt động",
          location: activity.location ?? null,
          date: activity.date ?? new Date().toISOString(),
          points: activity.points ?? 0,
          type: activity.type ?? undefined,
        })),
      }

      setData(formatted)
    } catch (err) {
      console.error(err)
      const message = err instanceof Error ? err.message : "Không thể tải dữ liệu loyalty"
      setError(message)
      toast({
        variant: "destructive",
        title: "Không thể tải rewards",
        description: "Vui lòng thử lại sau.",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?redirect=/rewards")
      return
    }

    if (status === "authenticated") {
      void fetchLoyaltyData()
    }
  }, [status, router, fetchLoyaltyData])

  const progressPercent = useMemo(() => {
    if (!data) {
      return 0
    }
    if (data.currentTier.pointsToNext === null) {
      return 100
    }
    if (typeof data.user.progressToNextTier === "number") {
      return Math.round(data.user.progressToNextTier * 100)
    }
    const span = (data.currentTier.maxPoints ?? 0) - data.currentTier.minPoints
    if (span <= 0) return 100
    return Math.min(100, Math.max(0, ((data.user.points - data.currentTier.minPoints) / span) * 100))
  }, [data])

  const nextTierConfig = useMemo(() => {
    if (!data || !data.currentTier.nextTier) {
      return null
    }
    return data.allTiers.find((tier) => tier.name === data.currentTier.nextTier) ?? null
  }, [data])

  if (status === "loading" || loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-3">
          <Sparkles className="mx-auto h-8 w-8 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Rewards hiện chưa khả dụng</h3>
          <p className="text-sm text-muted-foreground">{error ?? "Hệ thống đang bảo trì. Hãy thử lại sau."}</p>
          <Button variant="outline" onClick={fetchLoyaltyData}>Thử lại</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{ background: `linear-gradient(135deg, ${data.currentTier.color} 0%, transparent 100%)` }}
        />
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl">{data.user.points.toLocaleString()} điểm</CardTitle>
              <CardDescription className="text-lg">Hạng {data.currentTier.name}</CardDescription>
            </div>
            <div
              className="h-20 w-20 rounded-full flex items-center justify-center"
              style={{ backgroundColor: data.currentTier.color }}
            >
              <Award className="h-10 w-10 text-white" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.currentTier.nextTier ? (
            <>
              <div className="flex justify-between text-sm">
                <span>{data.currentTier.name}</span>
                <span>{data.currentTier.nextTier}</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
              <p className="text-sm text-muted-foreground">
                Còn {(data.currentTier.pointsToNext ?? data.user.pointsToNextTier ?? 0).toLocaleString("vi-VN")} điểm để lên hạng {data.currentTier.nextTier}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">🎉 Bạn đã đạt hạng cao nhất của LuxeStay!</p>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Booking năm nay
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.metrics.bookingsThisYear}</div>
            <p className="text-xs text-muted-foreground">Tiếp tục đặt phòng để mở khóa thêm đặc quyền</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Star className="h-4 w-4 text-muted-foreground" />
              Đánh giá đã viết
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.user.totalReviews}</div>
            <p className="text-xs text-muted-foreground">Chia sẻ trải nghiệm để nhận điểm thưởng</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Tiết kiệm được
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.metrics.totalSavings.toLocaleString("vi-VN")}₫</div>
            <p className="text-xs text-muted-foreground">Từ giảm giá, nâng hạng và đêm miễn phí</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Gift className="h-4 w-4 text-muted-foreground" />
              Đêm miễn phí còn lại
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.metrics.freeNightsRemaining}/{data.metrics.freeNightsRemaining + data.metrics.freeNightsUsed}
            </div>
            <p className="text-xs text-muted-foreground">Đặt lịch sớm để sử dụng trước khi hết hạn</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="benefits" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-xl">
          <TabsTrigger value="benefits" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> Quyền lợi hiện tại
          </TabsTrigger>
          <TabsTrigger value="tiers" className="flex items-center gap-2">
            <Award className="h-4 w-4" /> Các hạng thành viên
          </TabsTrigger>
        </TabsList>

        <TabsContent value="benefits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quyền lợi hạng {data.currentTier.name}</CardTitle>
              <CardDescription>Những ưu đãi bạn đang được hưởng</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              {data.currentTier.benefits.length > 0 ? (
                data.currentTier.benefits.map((benefit, index) => (
                  <div key={`${benefit}-${index}`} className="flex items-start gap-3 rounded-lg border border-border/60 p-3">
                    <Gift className="h-5 w-5 text-primary mt-0.5" />
                    <span className="text-sm text-foreground">{benefit}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Hạng này chưa có quyền lợi đặc biệt được cấu hình.</p>
              )}
            </CardContent>
          </Card>

          {nextTierConfig && (
            <Card>
              <CardHeader>
                <CardTitle>Chuẩn bị cho hạng {nextTierConfig.name}</CardTitle>
                <CardDescription>Những quyền lợi bạn sẽ mở khóa khi lên hạng</CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                {nextTierConfig.benefits.length > 0 ? (
                  nextTierConfig.benefits.map((benefit, index) => (
                    <div key={`${benefit}-${index}`} className="flex items-start gap-3 rounded-lg border border-dashed border-primary/50 p-3">
                      <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                      <span className="text-sm text-foreground">{benefit}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Hạng kế tiếp đang được cập nhật quyền lợi.</p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tiers" className="space-y-4">
          {data.allTiers.map((tier) => {
            const isCurrent = tier.tier === data.currentTier.tier
            const isUnlocked = data.user.points >= tier.minPoints
            return (
              <Card key={tier.tier} className={isCurrent ? "ring-2 ring-primary" : ""}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-12 w-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: tier.color }}
                      >
                        <Award className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {tier.name}
                          {isCurrent && <Badge>Hạng hiện tại</Badge>}
                          {!isUnlocked && <Badge variant="outline">Chưa mở khóa</Badge>}
                        </CardTitle>
                        <CardDescription>
                          {tier.minPoints.toLocaleString("vi-VN")} điểm
                          {typeof tier.maxPoints === "number" && Number.isFinite(tier.maxPoints)
                            ? ` - ${tier.maxPoints.toLocaleString("vi-VN")} điểm`
                            : ""}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-3">
                  {tier.benefits.length > 0 ? (
                    tier.benefits.map((benefit, index) => (
                      <div key={`${tier.tier}-${index}`} className="flex items-start gap-2 text-sm">
                        <Sparkles className="h-4 w-4 text-primary mt-1" />
                        <span>{benefit}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Hạng này chưa có quyền lợi được định nghĩa.</p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>
      </Tabs>
    </div>
  )
}
