"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { UserPlus, UserCheck, Sparkles } from "lucide-react"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useToast } from "@/components/ui/use-toast"

type Suggestion = {
  id: string
  name: string
  avatar: string
  verified: boolean
  role: "guest" | "host"
  headline: string
  stats: {
    listings: number
    completedTrips: number
    followers: number
  }
  loyaltyTier?: string | null
  mutualConnections: number
  isFollowing: boolean
}

export function SuggestedConnections() {
  const { toast } = useToast()
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [requiresAuth, setRequiresAuth] = useState(false)

  useEffect(() => {
    let ignore = false

    async function loadSuggestions() {
      try {
        setLoading(true)
        const res = await fetch("/api/community/suggestions", { cache: "no-store" })
        if (res.status === 401) {
          if (!ignore) {
            setRequiresAuth(true)
            setSuggestions([])
          }
          return
        }
        if (!res.ok) {
          throw new Error("Failed to load suggestions")
        }
        const data = await res.json()
        if (!ignore) {
          setRequiresAuth(false)
          setSuggestions(data.suggestions ?? [])
        }
      } catch (error) {
        console.error(error)
        if (!ignore) {
          toast({
            variant: "destructive",
            title: "Không tải được gợi ý",
            description: "Vui lòng thử lại sau.",
          })
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadSuggestions()

    return () => {
      ignore = true
    }
  }, [toast])

  const handleFollowToggle = async (userId: string, isFollowing: boolean) => {
    try {
      setUpdatingId(userId)
      const response = await fetch("/api/community/follow", {
        method: isFollowing ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ targetUserId: userId }),
      })

      if (!response.ok) {
        throw new Error("Failed to update follow status")
      }

      setSuggestions((prev) =>
        prev.map((item) =>
          item.id === userId
            ? {
                ...item,
                isFollowing: !isFollowing,
                stats: {
                  ...item.stats,
                  followers: Math.max(0, item.stats.followers + (isFollowing ? -1 : 1)),
                },
              }
            : item
        )
      )
    } catch (error) {
      console.error(error)
      toast({
        variant: "destructive",
        title: "Không thể cập nhật theo dõi",
        description: "Vui lòng thử lại.",
      })
    } finally {
      setUpdatingId(null)
    }
  }

  const emptyState = useMemo(() => suggestions.length === 0 && !loading, [suggestions.length, loading])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Gợi ý kết nối</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {requiresAuth && (
          <div className="rounded-md border border-dashed border-primary/40 bg-muted/30 p-4 text-sm text-muted-foreground">
            <p>Đăng nhập để xem gợi ý kết nối từ cộng đồng.</p>
            <Button asChild variant="outline" size="sm" className="mt-3">
              <Link href="/login?callbackUrl=%2Fcommunity">
                Đăng nhập
              </Link>
            </Button>
          </div>
        )}

        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-start gap-3 animate-pulse">
                <div className="h-12 w-12 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-1/3 rounded bg-muted" />
                  <div className="h-3 w-2/3 rounded bg-muted" />
                  <div className="h-7 w-24 rounded-full bg-muted" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && emptyState && (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-sm text-muted-foreground">
            <Sparkles className="h-5 w-5" />
            <p>Hiện bạn đã kết nối với hầu hết thành viên nổi bật. Hãy khám phá thêm trong cộng đồng!</p>
          </div>
        )}

        {!loading && !emptyState && suggestions.map((user) => (
          <div key={user.id} className="flex items-start gap-3">
            <Link href={`/profile/${user.id}`}>
              <Avatar className="h-12 w-12 cursor-pointer hover:opacity-80 transition-opacity">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>{user.name[0]}</AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <Link href={`/profile/${user.id}`}>
                  <p className="font-semibold text-sm hover:underline cursor-pointer truncate">
                    {user.name}
                  </p>
                </Link>
                {user.verified && (
                  <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                    ✓
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                {user.headline}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                <span>{user.stats.completedTrips} chuyến đi</span>
                <Separator orientation="vertical" className="h-3" />
                <span>{user.stats.listings} homestay</span>
                {user.mutualConnections > 0 && (
                  <>
                    <Separator orientation="vertical" className="h-3" />
                    <span>{user.mutualConnections} kết nối chung</span>
                  </>
                )}
              </div>
              <Button
                size="sm"
                variant={user.isFollowing ? "outline" : "default"}
                className="mt-2 h-7 text-xs"
                onClick={() => handleFollowToggle(user.id, user.isFollowing)}
                disabled={updatingId === user.id}
              >
                {user.isFollowing ? (
                  <>
                    <UserCheck className="h-3 w-3 mr-1" />
                    Đang theo dõi
                  </>
                ) : (
                  <>
                    <UserPlus className="h-3 w-3 mr-1" />
                    Theo dõi
                  </>
                )}
              </Button>
            </div>
          </div>
        ))}

        {!loading && suggestions.length > 0 && (
          <Button variant="ghost" size="sm" className="w-full">
            Xem thêm
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
