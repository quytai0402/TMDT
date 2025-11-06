"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { HostLayout } from "@/components/host-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Search, Star, MessageSquare, Loader2, Eye, TrendingUp, TrendingDown, Award } from "lucide-react"
import { toast } from "@/lib/toast"

interface Review {
  id: string
  reviewer: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
  listing: {
    id: string
    title: string
    slug?: string | null
  }
  booking: {
    id: string
    checkIn: string
    checkOut: string
  }
  overallRating: number
  cleanlinessRating?: number | null
  accuracyRating?: number | null
  checkInRating?: number | null
  communicationRating?: number | null
  locationRating?: number | null
  valueRating?: number | null
  comment: string
  hostResponse?: string | null
  hostRespondedAt?: string | null
  aiSentiment?: string | null
  aiSummary?: string | null
  aiKeywords?: string[]
  createdAt: string
}

interface ReviewStats {
  total: number
  pending: number
  responded: number
  averageRating: number
  ratingTrend: number
  totalByRating: Record<string, number>
}

const DEFAULT_STATS: ReviewStats = {
  total: 0,
  pending: 0,
  responded: 0,
  averageRating: 0,
  ratingTrend: 0,
  totalByRating: {},
}

export default function HostReviewsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [listingFilter, setListingFilter] = useState("all")
  const [stats, setStats] = useState<ReviewStats>(DEFAULT_STATS)
  const [respondingTo, setRespondingTo] = useState<Review | null>(null)
  const [responseText, setResponseText] = useState("")
  const [submittingResponse, setSubmittingResponse] = useState(false)
  const [hostListings, setHostListings] = useState<Array<{ id: string; title: string }>>([])

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filter !== "all") params.append("filter", filter)
      if (listingFilter !== "all") params.append("listingId", listingFilter)
      if (searchQuery) params.append("search", searchQuery)

      const res = await fetch(`/api/host/reviews?${params}`)
      if (!res.ok) {
        throw new Error("Không thể tải đánh giá")
      }

      const data = await res.json()
      setReviews(data.reviews || [])
      setStats(data.stats || DEFAULT_STATS)
      setHostListings(data.listings || [])
    } catch (error) {
      console.error("Failed to fetch reviews:", error)
      toast.error("Không thể tải đánh giá")
    } finally {
      setLoading(false)
    }
  }, [filter, listingFilter, searchQuery])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  const handleOpenResponse = useCallback((review: Review) => {
    setRespondingTo(review)
    setResponseText(review.hostResponse || "")
  }, [])

  const handleSubmitResponse = useCallback(async () => {
    if (!respondingTo || !responseText.trim()) return

    try {
      setSubmittingResponse(true)
      const res = await fetch("/api/host/reviews/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewId: respondingTo.id,
          response: responseText.trim(),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Không thể gửi phản hồi")
      }

      toast.success("Đã gửi phản hồi")
      setRespondingTo(null)
      setResponseText("")
      await fetchReviews()
    } catch (error) {
      console.error("Failed to submit response:", error)
      toast.error(error instanceof Error ? error.message : "Không thể gửi phản hồi")
    } finally {
      setSubmittingResponse(false)
    }
  }, [respondingTo, responseText, fetchReviews])

  const filteredReviews = useMemo(() => reviews, [reviews])

  const ratingDistribution = useMemo(() => {
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    reviews.forEach((review) => {
      const rounded = Math.round(review.overallRating)
      if (rounded >= 1 && rounded <= 5) {
        dist[rounded as keyof typeof dist]++
      }
    })
    return dist
  }, [reviews])

  return (
    <HostLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Đánh giá của khách</h1>
          <p className="text-muted-foreground mt-2">
            Xem và phản hồi đánh giá từ khách đã lưu trú tại các listing của bạn
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">Tổng đánh giá</div>
              <div className="text-2xl font-bold mt-2">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">Từ khách hàng</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">Chưa phản hồi</div>
              <div className="text-2xl font-bold mt-2 text-orange-600">{stats.pending}</div>
              <p className="text-xs text-muted-foreground mt-1">Cần trả lời</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">Điểm trung bình</div>
              <div className="text-2xl font-bold mt-2 flex items-center gap-1">
                {stats.averageRating.toFixed(1)}{" "}
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              </div>
              <div className="flex items-center gap-1 text-xs mt-1">
                {stats.ratingTrend >= 0 ? (
                  <>
                    <TrendingUp className="h-3 w-3 text-green-600" />
                    <span className="text-green-600">+{stats.ratingTrend.toFixed(1)}%</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-3 w-3 text-red-600" />
                    <span className="text-red-600">{stats.ratingTrend.toFixed(1)}%</span>
                  </>
                )}
                <span className="text-muted-foreground">so với tháng trước</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">Tỉ lệ phản hồi</div>
              <div className="text-2xl font-bold mt-2">
                {stats.total > 0 ? Math.round((stats.responded / stats.total) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.responded} / {stats.total} đánh giá
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Rating Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Phân bổ đánh giá</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = ratingDistribution[rating as keyof typeof ratingDistribution]
              const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0
              return (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-16">
                    <span className="text-sm font-medium">{rating}</span>
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  </div>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-16 text-right">
                    {count} ({percentage.toFixed(0)}%)
                  </span>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Reviews Table */}
        <Card>
          <CardContent className="pt-6">
            <div className="mb-4 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm đánh giá..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={listingFilter} onValueChange={setListingFilter}>
                <SelectTrigger className="w-full sm:w-[250px]">
                  <SelectValue placeholder="Lọc theo listing" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả listings</SelectItem>
                  {hostListings.map((listing) => (
                    <SelectItem key={listing.id} value={listing.id}>
                      {listing.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Tabs defaultValue="all" onValueChange={setFilter}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">Tất cả ({stats.total})</TabsTrigger>
                <TabsTrigger value="pending">Chưa phản hồi ({stats.pending})</TabsTrigger>
                <TabsTrigger value="responded">Đã phản hồi ({stats.responded})</TabsTrigger>
                <TabsTrigger value="high">
                  <Award className="h-4 w-4 mr-1" />5 sao
                </TabsTrigger>
              </TabsList>

              <TabsContent value={filter} className="space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredReviews.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Chưa có đánh giá nào
                  </div>
                ) : (
                  filteredReviews.map((review) => (
                    <div
                      key={review.id}
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors space-y-3"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={review.reviewer.image || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-primary to-pink-500 text-white">
                              {review.reviewer.name?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{review.reviewer.name || "Khách ẩn danh"}</p>
                            <p className="text-sm text-muted-foreground">{review.listing.title}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.overallRating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                            <span className="ml-1 text-sm font-medium">{review.overallRating.toFixed(1)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                          </p>
                        </div>
                      </div>

                      {/* Detailed Ratings */}
                      {(review.cleanlinessRating ||
                        review.accuracyRating ||
                        review.checkInRating ||
                        review.communicationRating ||
                        review.locationRating ||
                        review.valueRating) && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                          {review.cleanlinessRating && (
                            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                              <span>Sạch sẽ</span>
                              <span className="font-medium">{review.cleanlinessRating.toFixed(1)}</span>
                            </div>
                          )}
                          {review.accuracyRating && (
                            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                              <span>Chính xác</span>
                              <span className="font-medium">{review.accuracyRating.toFixed(1)}</span>
                            </div>
                          )}
                          {review.checkInRating && (
                            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                              <span>Check-in</span>
                              <span className="font-medium">{review.checkInRating.toFixed(1)}</span>
                            </div>
                          )}
                          {review.communicationRating && (
                            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                              <span>Giao tiếp</span>
                              <span className="font-medium">{review.communicationRating.toFixed(1)}</span>
                            </div>
                          )}
                          {review.locationRating && (
                            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                              <span>Vị trí</span>
                              <span className="font-medium">{review.locationRating.toFixed(1)}</span>
                            </div>
                          )}
                          {review.valueRating && (
                            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                              <span>Giá trị</span>
                              <span className="font-medium">{review.valueRating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Comment */}
                      <div className="space-y-2">
                        <p className="text-sm leading-relaxed">{review.comment}</p>
                        {review.aiSentiment && (
                          <Badge
                            variant={
                              review.aiSentiment === "positive"
                                ? "default"
                                : review.aiSentiment === "negative"
                                  ? "destructive"
                                  : "secondary"
                            }
                            className="text-xs"
                          >
                            {review.aiSentiment === "positive"
                              ? "Tích cực"
                              : review.aiSentiment === "negative"
                                ? "Tiêu cực"
                                : "Trung lập"}
                          </Badge>
                        )}
                      </div>

                      {/* AI Summary */}
                      {review.aiSummary && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                          <p className="font-medium text-blue-900 mb-1">Tóm tắt AI:</p>
                          <p className="text-blue-700">{review.aiSummary}</p>
                        </div>
                      )}

                      {/* Host Response */}
                      {review.hostResponse && (
                        <div className="pl-4 border-l-2 border-primary/30 space-y-1">
                          <p className="text-xs font-medium text-primary">Phản hồi của bạn:</p>
                          <p className="text-sm text-muted-foreground">{review.hostResponse}</p>
                          {review.hostRespondedAt && (
                            <p className="text-xs text-muted-foreground">
                              {new Date(review.hostRespondedAt).toLocaleDateString("vi-VN")}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            router.push(
                              review.listing.slug
                                ? `/listing/${review.listing.slug}`
                                : `/listing/${review.listing.id}`,
                            )
                          }
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Xem listing
                        </Button>
                        <Button
                          size="sm"
                          variant={review.hostResponse ? "outline" : "default"}
                          onClick={() => handleOpenResponse(review)}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          {review.hostResponse ? "Sửa phản hồi" : "Phản hồi"}
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Response Dialog */}
      <Dialog open={!!respondingTo} onOpenChange={(open) => !open && setRespondingTo(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Phản hồi đánh giá</DialogTitle>
            <DialogDescription>
              Phản hồi của bạn sẽ hiển thị công khai trên trang listing
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {respondingTo && (
              <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{respondingTo.reviewer.name}</span>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${
                          i < respondingTo.overallRating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{respondingTo.comment}</p>
              </div>
            )}
            <Textarea
              placeholder="Viết phản hồi của bạn..."
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              rows={5}
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRespondingTo(null)} disabled={submittingResponse}>
              Hủy
            </Button>
            <Button onClick={handleSubmitResponse} disabled={!responseText.trim() || submittingResponse}>
              {submittingResponse ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                "Gửi phản hồi"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </HostLayout>
  )
}
