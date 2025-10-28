"use client"

import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Trophy, Target, Award, Flame, ChevronRight } from "lucide-react"
import Link from "next/link"

type WidgetStats = {
  points: number
  tierName: string
  nextTierPoints: number | null
  activeQuests: number
  unlockedBadges: number
}

export function GamificationWidget() {
  const { status } = useSession()
  const [loading, setLoading] = useState(true)
  const [requiresAuth, setRequiresAuth] = useState(false)
  const [stats, setStats] = useState<WidgetStats>({
    points: 0,
    tierName: "Member",
    nextTierPoints: null,
    activeQuests: 0,
    unlockedBadges: 0,
  })
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    if (typeof window === "undefined") return
    const storedStreak = parseInt(localStorage.getItem("currentStreak") || "0")
    setStreak(storedStreak)
  }, [])

  useEffect(() => {
    const loadData = async () => {
      if (status === "loading") return
      if (status === "unauthenticated") {
        setRequiresAuth(true)
        setLoading(false)
        return
      }

      try {
        const [membershipRes, questsRes] = await Promise.all([
          fetch("/api/membership/status", { cache: "no-store" }),
          fetch("/api/quests", { cache: "no-store" }),
        ])

        if (membershipRes.status === 401 || questsRes.status === 401) {
          setRequiresAuth(true)
          return
        }

        const membershipData = membershipRes.ok ? await membershipRes.json() : null
        const questData = questsRes.ok ? await questsRes.json() : null

        const points = membershipData?.user?.loyaltyPoints ?? 0
        const tierName =
          membershipData?.currentTier?.name ??
          membershipData?.membership?.plan?.name ??
          "Member"
        const pointsToNext = membershipData?.currentTier?.pointsToNextTier
        const nextTierPoints =
          typeof pointsToNext === "number" && pointsToNext > 0 ? points + pointsToNext : null
        const activeQuests =
          typeof questData?.total === "number" && typeof questData?.completed === "number"
            ? Math.max(questData.total - questData.completed, 0)
            : 0
        const unlockedBadges = membershipData?.membership?.features?.length ?? 0

        setStats({
          points,
          tierName,
          nextTierPoints,
          activeQuests,
          unlockedBadges,
        })
      } catch (error) {
        console.error("Failed to load gamification data:", error)
      } finally {
        setLoading(false)
      }
    }

    void loadData()
  }, [status])

  const tierProgress = useMemo(() => {
    if (!stats.nextTierPoints || stats.nextTierPoints <= stats.points) {
      return 100
    }
    return Math.min(100, (stats.points / stats.nextTierPoints) * 100)
  }, [stats.points, stats.nextTierPoints])

  if (loading) {
    return (
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardContent className="pt-6 space-y-4 animate-pulse">
          <div className="h-4 bg-purple-100 rounded w-1/3" />
          <div className="h-4 bg-purple-100 rounded w-1/2" />
          <div className="h-2 bg-purple-100 rounded" />
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-16 bg-white/70 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (requiresAuth) {
    return (
      <Card className="border border-dashed border-purple-200 bg-purple-50">
        <CardContent className="py-8 text-center space-y-3">
          <Trophy className="h-6 w-6 mx-auto text-purple-500" />
          <p className="font-semibold">Đăng nhập để xem bảng Rewards của bạn</p>
          <p className="text-sm text-muted-foreground">
            Tích lũy điểm, mở khóa badge và theo dõi các nhiệm vụ đang chờ hoàn thành.
          </p>
          <Button asChild size="sm">
            <Link href="/login?callbackUrl=%2Fdashboard">Đăng nhập</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
      <CardContent className="pt-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            <h3 className="font-bold">Rewards</h3>
          </div>
          <Badge className="bg-yellow-600">
            {stats.points.toLocaleString()} pts
          </Badge>
        </div>

        {/* Tier Progress */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium">{stats.tierName}</span>
            <span className="text-gray-600">
              {stats.nextTierPoints
                ? `${(stats.nextTierPoints - stats.points).toLocaleString()} tới hạng tiếp theo`
                : "Đã đạt hạng cao nhất"}
            </span>
          </div>
          <Progress value={tierProgress} className="h-2" />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-white rounded-lg">
            <Flame className="h-4 w-4 mx-auto mb-1 text-orange-600" />
            <div className="text-lg font-bold">{streak}</div>
            <div className="text-xs text-gray-600">Streak</div>
          </div>
          <div className="text-center p-2 bg-white rounded-lg">
            <Target className="h-4 w-4 mx-auto mb-1 text-purple-600" />
            <div className="text-lg font-bold">{stats.activeQuests}</div>
            <div className="text-xs text-gray-600">Quests</div>
          </div>
          <div className="text-center p-2 bg-white rounded-lg">
            <Award className="h-4 w-4 mx-auto mb-1 text-blue-600" />
            <div className="text-lg font-bold">{stats.unlockedBadges}</div>
            <div className="text-xs text-gray-600">Badges</div>
          </div>
        </div>

        {/* CTA */}
        <Button variant="outline" className="w-full gap-2" asChild>
          <Link href="/rewards">
            View All Rewards
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
