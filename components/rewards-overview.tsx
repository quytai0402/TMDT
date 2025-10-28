"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  Award, 
  ArrowRight, 
  Sparkles, 
  TrendingUp,
  Gift
} from "lucide-react"
import { getTierColor, getTierBadgeColor } from "@/lib/rewards"

interface RewardsOverviewProps {
  compact?: boolean
}

export function RewardsOverview({ compact = false }: RewardsOverviewProps) {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRewardsData()
  }, [])

  const fetchRewardsData = async () => {
    try {
      const res = await fetch("/api/rewards/tiers")
      if (res.ok) {
        const tierData = await res.json()
        setData(tierData)
      }
    } catch (error) {
      console.error("Failed to fetch rewards:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-8 bg-muted rounded w-1/2"></div>
            <div className="h-2 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return null
  }

  const currentTier = data.tiers.find((t: any) => t.tier === data.currentTier)

  if (compact) {
    return (
      <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push("/rewards")}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${getTierColor(data.currentTier)}`}>
                <Award className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold">{data.currentPoints.toLocaleString()} điểm</p>
                <p className="text-xs text-muted-foreground">{currentTier?.name || data.currentTier}</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <div className={`h-2 ${getTierColor(data.currentTier)}`}></div>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Chương trình Rewards
            </CardTitle>
            <CardDescription>Theo dõi điểm thưởng và quyền lợi của bạn</CardDescription>
          </div>
          <Badge 
            variant="outline" 
            className={`font-semibold ${getTierBadgeColor(data.currentTier)}`}
          >
            {currentTier?.name || data.currentTier}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Points Display */}
        <div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-primary">
              {data.currentPoints.toLocaleString()}
            </span>
            <span className="text-muted-foreground">điểm</span>
          </div>
          
          {data.nextTier && (
            <>
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                <span>{currentTier?.name || data.currentTier}</span>
                <span>{data.nextTier.name}</span>
              </div>
              <Progress value={data.progress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {data.pointsToNextTier.toLocaleString()} điểm đến {data.nextTier.name}
              </p>
            </>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-sm font-semibold">
              {currentTier?.pointsMultiplier || 1}x
            </p>
            <p className="text-xs text-muted-foreground">Hệ số nhân</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <Gift className="h-4 w-4 text-purple-600" />
            </div>
            <p className="text-sm font-semibold">
              {currentTier?.benefits?.length || 0}
            </p>
            <p className="text-xs text-muted-foreground">Quyền lợi</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push("/rewards")}
          >
            Xem chi tiết
          </Button>
          <Button 
            size="sm"
            onClick={() => router.push("/rewards/catalog")}
          >
            <Gift className="h-4 w-4 mr-1" />
            Đổi quà
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
