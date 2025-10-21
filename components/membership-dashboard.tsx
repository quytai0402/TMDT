'use client'

import { useEffect, useMemo, useState } from 'react'
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
