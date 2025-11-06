"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { GuideDashboardLayout } from "@/components/guide-dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import { Loader2, RefreshCcw, Star } from "lucide-react"

import type { GuideNavMetrics } from "@/components/guide-dashboard-layout"

type GuideReview = {
  id: string
  rating: number
  content: string
  images: string[]
  createdAt: string
  experience: { id: string; title: string; city: string; image: string | null }
  author: { id: string; name: string | null; email: string | null; image: string | null }
}

type GuideReviewsResponse = {
  reviews: GuideReview[]
  stats: {
    averageRating: number
    totalReviews: number
    ratingsBreakdown: Record<string, number>
    lastReviewAt: string | null
  }
  navMetrics: GuideNavMetrics
}

const ratingLabels: Record<string, string> = {
  "5": "Xuất sắc",
  "4": "Rất tốt",
  "3": "Tốt",
  "2": "Trung bình",
  "1": "Cần cải thiện",
}

const formatDate = (value: string | null) =>
  value ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(new Date(value)) : "--"

export default function GuideReviewsPage() {
  const [data, setData] = useState<GuideReviewsResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const loadReviews = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/guide/reviews", { cache: "no-store" })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: "Không thể tải đánh giá" }))
        throw new Error(payload.error || "Không thể tải đánh giá")
      }
      const payload = (await response.json()) as GuideReviewsResponse
      setData(payload)
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadReviews()
  }, [])

  const navMetrics = data?.navMetrics

  const averageScoreDisplay = useMemo(() => {
    if (!data) return "0.0"
    return (data.stats.averageRating || 0).toFixed(2)
  }, [data])

  const totalReviews = data?.stats.totalReviews ?? 0

  return (
    <GuideDashboardLayout metrics={navMetrics}>
      <div className="space-y-8">
        <section className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold md:text-4xl">Đánh giá khách hàng</h1>
            <p className="text-sm text-muted-foreground">
              Ghi nhận phản hồi để tối ưu trải nghiệm và giữ mức rating ổn định trên LuxeStay.
            </p>
          </div>
          <Button variant="outline" onClick={() => void loadReviews()} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
            Tải lại
          </Button>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Điểm trung bình</CardTitle>
              <CardDescription>Tính trên toàn bộ trải nghiệm</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center space-y-4 py-10">
              <div className="flex items-center gap-2 text-5xl font-bold text-yellow-500">
                <Star className="h-10 w-10" fill="currentColor" />
                <span>{averageScoreDisplay}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {totalReviews} đánh giá • Cập nhật {formatDate(data?.stats.lastReviewAt ?? null)}
              </p>
              <div className="w-full space-y-2">
                {Object.entries(data?.stats.ratingsBreakdown ?? {})
                  .sort(([a], [b]) => Number(b) - Number(a))
                  .map(([rating, count]) => (
                    <div key={rating} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Badge variant="secondary">{rating} ★</Badge>
                        {ratingLabels[rating] ?? ""}
                      </span>
                      <span className="font-semibold text-foreground">{count}</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Phản hồi mới nhất</CardTitle>
              <CardDescription>Các review gần đây nhất từ khách LuxeStay</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex h-[360px] items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : data && data.reviews.length > 0 ? (
                <ScrollArea className="h-[460px]">
                  <div className="space-y-4 p-4">
                    {data.reviews.map((review) => (
                      <div key={review.id} className="rounded-xl border border-muted/60 p-5 shadow-sm">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                              <Star className="h-4 w-4 text-amber-500" fill="currentColor" /> {review.rating.toFixed(1)}
                            </div>
                            <p className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</p>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                              {review.author.image ? (
                                <Image src={review.author.image} alt={review.author.name ?? "Guest"} width={32} height={32} className="h-8 w-8 rounded-full object-cover" />
                              ) : (
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                                  {(review.author.name || review.author.email || "G")?.[0]?.toUpperCase() ?? "G"}
                                </div>
                              )}
                              <span>{review.author.name || review.author.email || "Ẩn danh"}</span>
                            </div>
                            <Badge variant="outline">{review.experience.title}</Badge>
                          </div>
                        </div>
                        <p className="mt-3 text-sm text-foreground">{review.content}</p>
                        {review.images.length > 0 ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {review.images.map((image) => (
                              <Image
                                key={image}
                                src={image}
                                alt="Review media"
                                width={120}
                                height={80}
                                className="h-20 w-28 rounded-lg object-cover"
                              />
                            ))}
                          </div>
                        ) : null}
                        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                          <span>Trải nghiệm: {review.experience.title}</span>
                          <span>Thành phố: {review.experience.city}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex h-[360px] flex-col items-center justify-center gap-3 text-muted-foreground">
                  <Star className="h-10 w-10 text-amber-500" />
                  <p className="text-sm">Chưa có đánh giá nào. Hãy khuyến khích khách để lại phản hồi sau mỗi trải nghiệm.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </GuideDashboardLayout>
  )
}
