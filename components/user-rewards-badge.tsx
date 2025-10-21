"use client"

import { useEffect, useState } from "react"
import { Award, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getTierBadgeColor } from "@/lib/rewards"

interface UserRewardsInfo {
  points: number
  tier: string
  tierName: string
}

export function UserRewardsBadge() {
  const [rewardsInfo, setRewardsInfo] = useState<UserRewardsInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRewardsInfo()
  }, [])

  const fetchRewardsInfo = async () => {
    try {
      const res = await fetch("/api/rewards/tiers")
      if (res.ok) {
        const data = await res.json()
        setRewardsInfo({
          points: data.currentPoints || 0,
          tier: data.currentTier || "BRONZE",
          tierName: data.tiers.find((t: any) => t.tier === data.currentTier)?.name || "Bronze"
        })
      }
    } catch (error) {
      console.error("Failed to fetch rewards info:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !rewardsInfo) {
    return null
  }

  return (
    <div className="px-3 py-2 flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50 border-y border-purple-100">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-white shadow-sm">
          <Sparkles className="h-4 w-4 text-purple-500" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-purple-900">
            {rewardsInfo.points.toLocaleString()} điểm
          </span>
          <span className="text-[10px] text-purple-600">
            {rewardsInfo.tierName} Tier
          </span>
        </div>
      </div>
      <Badge 
        variant="outline" 
        className={`text-[10px] font-semibold border ${getTierBadgeColor(rewardsInfo.tier)}`}
      >
        <Award className="h-3 w-3 mr-1" />
        {rewardsInfo.tier}
      </Badge>
    </div>
  )
}
