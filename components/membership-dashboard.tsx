'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Crown,
  Calendar,
  Star,
  Gift,
  TrendingUp,
  Clock,
  CheckCircle2,
  Lock,
  Sparkles,
  Zap,
  Award,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface MembershipStatusResponse {
  user: {
    id: string
    name: string | null
    loyaltyPoints: number
    joinDate: string
  }
  currentTier: {
    tier: string
    name: string
    minPoints: number
    maxPoints: number | null
    benefits: string[]
    bonusMultiplier: number
    pointsToNextTier: number | null
    nextTier: string | null
  } | null
  metrics: {
    bookingsThisYear: number
    freeNightsUsed: number
    freeNightsRemaining: number
    upgradesReceived: number
    eventsAttended: number
    totalSavings: number
  }
  tiers: Array<{
    tier: string
    name: string
    minPoints: number
    maxPoints: number | null
    benefits: string[]
  }>
  membership: {
    status: string
    isActive: boolean
    startedAt: string | null
    expiresAt: string | null
    billingCycle: string | null
    features: string[]
    plan: {
      slug: string
      name: string
      color: string | null
      icon: string | null
      features: string[]
      exclusiveFeatures: string[]
    } | null
  } | null
}

const benefitIconMap: Array<{ keyword: string; icon: React.ReactNode }> = [
  { keyword: 'giảm giá', icon: <TrendingUp className="h-5 w-5" /> },
  { keyword: 'đêm', icon: <Calendar className="h-5 w-5" /> },
  { keyword: 'nâng hạng', icon: <Star className="h-5 w-5" /> },
  { keyword: 'quà', icon: <Gift className="h-5 w-5" /> },
  { keyword: 'concierge', icon: <Zap className="h-5 w-5" /> },
  { keyword: 'độc quyền', icon: <Lock className="h-5 w-5" /> },
]

function getBenefitIcon(benefit: string) {
  const lower = benefit.toLowerCase()
  const matched = benefitIconMap.find(({ keyword }) => lower.includes(keyword))
  return matched?.icon ?? <Sparkles className="h-5 w-5" />
}

const tierColorMap: Record<string, string> = {
  BRONZE: 'from-amber-200 to-amber-400',
  SILVER: 'from-gray-300 to-gray-500',
  GOLD: 'from-yellow-300 to-yellow-500',
  PLATINUM: 'from-slate-200 via-slate-400 to-slate-600',
  DIAMOND: 'from-purple-400 via-pink-500 to-blue-500',
}

export function MembershipDashboard() {
  const [status, setStatus] = useState<MembershipStatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const fetchStatus = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/membership/status')
        if (!response.ok) {
          throw new Error('Unable to load membership information')
        }
        const data = (await response.json()) as MembershipStatusResponse
        if (mounted) {
          setStatus(data)
          setError(null)
        }
      } catch (err) {
        console.error(err)
        if (mounted) {
          setError('Không thể tải thông tin membership. Vui lòng thử lại sau.')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchStatus()
    return () => {
      mounted = false
    }
  }, [])

  const currentTier = status?.currentTier
  const membership = status?.membership
  const userPoints = status?.user.loyaltyPoints ?? 0
  const minPoints = currentTier?.minPoints ?? 0
  const maxPoints = currentTier?.maxPoints ?? null

  const tierProgress = useMemo(() => {
    if (!currentTier || maxPoints === null || maxPoints <= minPoints) {
      return 100
    }
    const progress = ((userPoints - minPoints) / (maxPoints - minPoints)) * 100
    return Math.min(Math.max(progress, 0), 100)
  }, [currentTier, userPoints, minPoints, maxPoints])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-36 w-full" />
        <div className="grid md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error || !status || !currentTier) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          {error || 'Không tìm thấy thông tin membership.'}
        </CardContent>
      </Card>
    )
  }

  const tierGradient = tierColorMap[currentTier.tier as keyof typeof tierColorMap] ?? 'from-gray-200 to-gray-400'
  const nextTierName = currentTier.nextTier
  const activeBenefits = currentTier.benefits
  const nextTier = status.tiers.find((tier) => tier.name === nextTierName)

  const membershipPlan = membership?.plan
  const membershipStatus = membership?.status ?? 'INACTIVE'
  const billingCycleLabel = membership?.billingCycle === 'MONTHLY' ? 'Hàng tháng' : membership?.billingCycle === 'ANNUAL' ? 'Hàng năm' : null
  const membershipFeatures = membership
    ? Array.from(
        new Set([
          ...(membershipPlan?.features ?? []),
          ...(membershipPlan?.exclusiveFeatures ?? []),
          ...(membership.features ?? []),
        ])
      )
    : []
  const exclusiveFeatureSet = new Set(membershipPlan?.exclusiveFeatures ?? [])
  const membershipStart = membership?.startedAt ? new Date(membership.startedAt) : null
  const membershipExpiry = membership?.expiresAt ? new Date(membership.expiresAt) : null

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-primary/10 to-purple-500/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${tierGradient} flex items-center justify-center`}>
                <Crown className="h-8 w-8 text-white" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold">{currentTier.name} Member</h2>
                  <Badge variant="secondary" className="text-xs">
                    Active
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Tích lũy {userPoints.toLocaleString('vi-VN')} điểm kể từ {new Date(status.user.joinDate).toLocaleDateString('vi-VN')}
                </p>
                {nextTierName && currentTier.pointsToNextTier !== null && (
                  <p className="text-sm text-muted-foreground">
                    Còn {currentTier.pointsToNextTier.toLocaleString('vi-VN')} điểm để lên {nextTierName}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Tổng tiết kiệm năm nay</p>
                <p className="text-3xl font-bold text-green-600">
                  {status.metrics.totalSavings.toLocaleString('vi-VN')}₫
                </p>
              </div>
              <Button>Gia hạn ngay</Button>
            </div>
      </div>
    </CardContent>
  </Card>

      {membership ? (
        <Card className="border-primary/20 bg-white/80">
          <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-xl">{membershipPlan?.name ?? 'Membership của bạn'}</CardTitle>
              <CardDescription>
                {membershipPlan?.name
                  ? 'Đặc quyền được kích hoạt tự động cho mọi đặt phòng đủ điều kiện.'
                  : 'Quyền lợi membership sẽ hiển thị tại đây khi bạn đăng ký.'}
              </CardDescription>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Badge variant={membership.isActive ? 'default' : 'outline'}>{membershipStatus}</Badge>
                {billingCycleLabel && <Badge variant="secondary">{billingCycleLabel}</Badge>}
                {membershipStart && (
                  <span className="text-xs text-muted-foreground">
                    Bắt đầu: {membershipStart.toLocaleDateString('vi-VN')}
                  </span>
                )}
                {membershipExpiry && (
                  <span className="text-xs text-muted-foreground">
                    Hết hạn: {membershipExpiry.toLocaleDateString('vi-VN')}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/collections/secret">Secret Collection</Link>
              </Button>
              <Button asChild>
                <Link href="/experiences/members">Workshop riêng</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {membershipFeatures.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Chưa có quyền lợi nào được ghi nhận. Liên hệ concierge nếu bạn nghĩ đây là lỗi.
              </p>
            ) : (
              <div className="grid md:grid-cols-2 gap-3">
                {membershipFeatures.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-3 py-2 text-sm"
                  >
                    <span className="mt-0.5 rounded-full bg-primary/10 p-1 text-primary">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                    <div className="space-y-1">
                      <span className="font-medium text-primary-800">{feature}</span>
                      {exclusiveFeatureSet.has(feature) && (
                        <Badge variant="outline" className="text-xs border-primary/40 text-primary">
                          Độc quyền member
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed border-primary/30">
          <CardContent className="py-8 text-center space-y-3">
            <Crown className="h-8 w-8 mx-auto text-primary" />
            <p className="text-muted-foreground">
              Trở thành hội viên LuxeStay để mở khóa Secret Collection, workshop riêng và concierge 24/7.
            </p>
            <div className="flex gap-2 justify-center">
              <Button asChild>
                <Link href="/membership">Nâng cấp membership</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/membership/checkout?tier=gold&billing=annually">Gói Gold</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Điểm tích lũy</CardDescription>
            <CardTitle className="text-3xl">{userPoints.toLocaleString('vi-VN')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={tierProgress} className="h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Booking năm nay</CardDescription>
            <CardTitle className="text-3xl">{status.metrics.bookingsThisYear}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Đặt nhiều hơn để nhận thêm ưu đãi
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Đêm miễn phí</CardDescription>
            <CardTitle className="text-3xl">
              {status.metrics.freeNightsRemaining}/
              {status.metrics.freeNightsRemaining + status.metrics.freeNightsUsed}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress
              value={
                (status.metrics.freeNightsUsed /
                  Math.max(status.metrics.freeNightsRemaining + status.metrics.freeNightsUsed, 1)) * 100
              }
              className="h-2"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Nâng hạng miễn phí</CardDescription>
            <CardTitle className="text-3xl">{status.metrics.upgradesReceived}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Tiếp tục đặt phòng để nhận thêm nâng cấp
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="benefits" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="benefits" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> Quyền lợi hiện tại
          </TabsTrigger>
          <TabsTrigger value="tiers" className="flex items-center gap-2">
            <Award className="h-4 w-4" /> Các hạng thành viên
          </TabsTrigger>
        </TabsList>

        <TabsContent value="benefits">
          <Card>
            <CardHeader>
              <CardTitle>Quyền lợi hạng {currentTier.name}</CardTitle>
              <CardDescription>Những ưu đãi bạn đang được hưởng</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              {activeBenefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3 rounded-lg border border-border/60 p-3">
                  <div className="text-primary">{getBenefitIcon(benefit)}</div>
                  <span className="text-sm text-foreground">{benefit}</span>
                </div>
              ))}
              {activeBenefits.length === 0 && (
                <p className="text-sm text-muted-foreground">Chưa có quyền lợi cụ thể cho hạng này.</p>
              )}
            </CardContent>
          </Card>

          {nextTier && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Chuẩn bị cho hạng {nextTier.name}</CardTitle>
                <CardDescription>Những quyền lợi bạn sẽ nhận được khi lên hạng tiếp theo</CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                {nextTier.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3 rounded-lg border border-dashed border-primary/40 p-3">
                    <div className="text-primary">{getBenefitIcon(benefit)}</div>
                    <span className="text-sm text-foreground">{benefit}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tiers">
          <div className="space-y-4">
            {status.tiers.map((tier) => {
              const isCurrent = tier.tier === currentTier.tier
              const isUnlocked = userPoints >= tier.minPoints
              const tierMin = tier.minPoints ?? 0
              const tierMax = tier.maxPoints ?? null

              return (
                <Card key={tier.tier} className={isCurrent ? 'ring-2 ring-primary' : ''}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {tier.name}
                          {isCurrent && <Badge>Hạng hiện tại</Badge>}
                          {!isUnlocked && <Badge variant="outline">Chưa mở khóa</Badge>}
                        </CardTitle>
                        <CardDescription>
                          {tierMin.toLocaleString('vi-VN')} điểm
                          {typeof tierMax === 'number' && ` - ${tierMax.toLocaleString('vi-VN')} điểm`}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-3">
                    {tier.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-1" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
