"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, MapPin, Users } from "lucide-react"
import Link from "next/link"

interface TrendingTopic {
  id: string
  title: string
  category: string
  postsCount: number
  icon?: React.ReactNode
}

const trendingTopics: TrendingTopic[] = [
  {
    id: "1",
    title: "#DalatWinter2025",
    category: "Địa điểm",
    postsCount: 1234,
    icon: <MapPin className="h-4 w-4" />
  },
  {
    id: "2",
    title: "#WorkationVibes",
    category: "Workation",
    postsCount: 892,
    icon: <Users className="h-4 w-4" />
  },
  {
    id: "3",
    title: "#BeachGetaway",
    category: "Trải nghiệm",
    postsCount: 756
  },
  {
    id: "4",
    title: "#PhuQuocTravel",
    category: "Địa điểm",
    postsCount: 645,
    icon: <MapPin className="h-4 w-4" />
  },
  {
    id: "5",
    title: "#FamilyTrip",
    category: "Gia đình",
    postsCount: 523
  }
]

export function TrendingTopics() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Trending Topics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {trendingTopics.map((topic, index) => (
          <Link
            key={topic.id}
            href={`/community/topics/${topic.id}`}
            className="block hover:bg-muted/50 -mx-2 px-2 py-2 rounded-lg transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs font-medium">
                    #{index + 1}
                  </span>
                  <p className="font-semibold text-sm truncate">{topic.title}</p>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {topic.icon}
                  <Badge variant="secondary" className="text-xs">
                    {topic.category}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {topic.postsCount.toLocaleString('vi-VN')} bài viết
                </p>
              </div>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}
