"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Trophy, Target, Award, Flame, ChevronRight } from "lucide-react"
import Link from "next/link"

export function GamificationWidget() {
  const userStats = {
    points: 2450,
    tier: "Gold",
    nextTierPoints: 3000,
    streak: 7,
    activeQuests: 3,
    unlockedBadges: 8
  }

  const tierProgress = ((userStats.points / userStats.nextTierPoints) * 100)

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
            {userStats.points} pts
          </Badge>
        </div>

        {/* Tier Progress */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium">{userStats.tier} Member</span>
            <span className="text-gray-600">{userStats.nextTierPoints - userStats.points} to Diamond</span>
          </div>
          <Progress value={tierProgress} className="h-2" />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-white rounded-lg">
            <Flame className="h-4 w-4 mx-auto mb-1 text-orange-600" />
            <div className="text-lg font-bold">{userStats.streak}</div>
            <div className="text-xs text-gray-600">Streak</div>
          </div>
          <div className="text-center p-2 bg-white rounded-lg">
            <Target className="h-4 w-4 mx-auto mb-1 text-purple-600" />
            <div className="text-lg font-bold">{userStats.activeQuests}</div>
            <div className="text-xs text-gray-600">Quests</div>
          </div>
          <div className="text-center p-2 bg-white rounded-lg">
            <Award className="h-4 w-4 mx-auto mb-1 text-blue-600" />
            <div className="text-lg font-bold">{userStats.unlockedBadges}</div>
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
