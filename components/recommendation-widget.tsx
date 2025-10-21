"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sparkles, TrendingUp, Heart, Clock, ArrowRight } from "lucide-react"
import Link from "next/link"

interface QuickRecommendation {
  id: string
  title: string
  image: string
  reason: string
  badge: string
  matchScore: number
}

export function RecommendationWidget() {
  const recommendations: QuickRecommendation[] = [
    {
      id: "1",
      title: "Villa Nha Trang",
      image: "/placeholder.svg?height=200&width=300",
      reason: "Perfect match",
      badge: "98% phù hợp",
      matchScore: 98
    },
    {
      id: "2",
      title: "Penthouse Vũng Tàu",
      image: "/placeholder.svg?height=200&width=300",
      reason: "Hot deal",
      badge: "-20% hôm nay",
      matchScore: 95
    },
    {
      id: "3",
      title: "Căn hộ Đà Nẵng",
      image: "/placeholder.svg?height=200&width=300",
      reason: "Trending",
      badge: "🔥 Top 10",
      matchScore: 92
    }
  ]

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Gợi ý cho bạn
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.map((rec) => (
          <Link key={rec.id} href={`/listing/${rec.id}`}>
            <div className="group flex gap-3 p-3 rounded-lg hover:bg-white hover:shadow-md transition-all cursor-pointer">
              {/* Image */}
              <div className="w-24 h-20 bg-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center text-gray-400 text-xs">
                Img
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm line-clamp-1 group-hover:text-purple-600 transition-colors">
                  {rec.title}
                </h4>
                <p className="text-xs text-gray-600 mt-1">{rec.reason}</p>
                <Badge variant="secondary" className="mt-2 text-xs">
                  {rec.badge}
                </Badge>
              </div>

              {/* Match Score */}
              <div className="flex items-center">
                <div className="text-right">
                  <div className="text-lg font-bold text-purple-600">
                    {rec.matchScore}
                  </div>
                  <div className="text-xs text-gray-500">match</div>
                </div>
              </div>
            </div>
          </Link>
        ))}

        <Button variant="outline" className="w-full gap-2" asChild>
          <Link href="/recommendations">
            Xem tất cả gợi ý
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
