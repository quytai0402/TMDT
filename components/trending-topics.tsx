"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, MapPin, Users, Compass } from "lucide-react"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useToast } from "@/components/ui/use-toast"

type Topic = {
  id: string
  title: string
  category: string
  postsCount: number
  location?: string | null
}

const categoryIcon = (category: string) => {
  if (category.toLowerCase().includes("địa")) return <MapPin className="h-4 w-4" />
  if (category.toLowerCase().includes("work")) return <Users className="h-4 w-4" />
  return <Compass className="h-4 w-4" />
}

export function TrendingTopics() {
  const { toast } = useToast()
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false

    async function loadTopics() {
      try {
        setLoading(true)
        const res = await fetch("/api/community/topics", { cache: "no-store" })
        if (!res.ok) {
          throw new Error("Failed to fetch topics")
        }
        const data = await res.json()
        if (!ignore) {
          setTopics(data.topics ?? [])
        }
      } catch (error) {
        console.error(error)
        if (!ignore) {
          toast({
            variant: "destructive",
            title: "Không tải được xu hướng",
            description: "Vui lòng thử lại sau.",
          })
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadTopics()

    return () => {
      ignore = true
    }
  }, [toast])

  const emptyState = useMemo(() => topics.length === 0 && !loading, [topics.length, loading])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Trending Topics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex gap-3 animate-pulse">
                <div className="h-8 w-8 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-1/3 rounded bg-muted" />
                  <div className="h-3 w-1/2 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        )}

        {emptyState && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Chưa có xu hướng mới. Hãy là người đầu tiên chia sẻ trải nghiệm của bạn!
          </p>
        )}

        {!loading && topics.map((topic, index) => (
          <Link
            key={topic.id}
            href={`/community/topics/${encodeURIComponent(topic.title.replace('#', ''))}`}
            className="block hover:bg-muted/50 -mx-2 px-2 py-2 rounded-lg transition-colors"
          >
            <div className="flex items-start gap-2">
              <span className="text-muted-foreground text-xs font-medium pt-0.5 min-w-[22px]">#{index + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm truncate">{topic.title}</p>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  {categoryIcon(topic.category)}
                  <Badge variant="secondary" className="text-xs">
                    {topic.category}
                  </Badge>
                  {topic.location && <span>• {topic.location}</span>}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {topic.postsCount.toLocaleString("vi-VN")} bài viết
                </p>
              </div>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}
