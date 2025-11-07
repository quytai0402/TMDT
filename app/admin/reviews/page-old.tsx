"use client"

import { useEffect, useState } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Star, Flag, Eye, Trash2, Loader2 } from "lucide-react"

interface Review {
  id: string
  reviewer: { id: string; name: string | null; email: string; image: string | null }
  listing: { id: string; title: string }
  overallRating: number
  comment: string | null
  createdAt: string
  isFlagged?: boolean | null
  isVerified?: boolean | null
}

interface ReviewStats {
  total: number
  pending: number
  flagged: number
  averageRating: number
}

type ReviewFilter = "all" | "pending" | "approved" | "flagged"

export default function AdminReviewsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<ReviewFilter>("all")
  const [stats, setStats] = useState<ReviewStats>({
    total: 0,
    pending: 0,
    flagged: 0,
    averageRating: 0,
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void fetchReviews()
  }, [filter, searchQuery])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      if (filter !== "all") params.set("filter", filter)
      if (searchQuery.trim()) params.set("search", searchQuery.trim())
      const res = await fetch(`/api/admin/reviews?${params.toString()}`)
      if (!res.ok) {
        throw new Error("Không thể tải danh sách đánh giá")
      }
      const data = await res.json()
      setReviews(Array.isArray(data?.reviews) ? data.reviews : [])
      setStats(
        data?.stats ?? {
          total: 0,
          pending: 0,
          flagged: 0,
          averageRating: 0,
        },
      )
    } catch (err) {
      console.error("Failed to fetch reviews:", err)
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const renderReviews = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )
    }

    if (error) {
      return (
        <div className="text-center py-8 text-sm text-destructive">
          {error}. Vui lòng thử lại sau.
        </div>
      )
    }

    if (reviews.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          {filter === "all" ? "Không có đánh giá nào" : "Không có đánh giá phù hợp với bộ lọc."}
        </div>
      )
    }

    return reviews.map((review) => (
      <div key={review.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback className="bg-gradient-to-br from-primary to-pink-500 text-white">
                {review.reviewer.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{review.reviewer.name || "Ẩn danh"}</p>
              <p className="text-sm text-muted-foreground">{review.listing.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < review.overallRating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            {review.isFlagged && (
              <Badge variant="destructive">
                <Flag className="h-3 w-3 mr-1" />
                Báo cáo
              </Badge>
            )}
          </div>
        </div>
        <p className="text-sm mb-2">{review.comment || "Không có nhận xét"}</p>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {new Date(review.createdAt).toLocaleDateString("vi-VN")}
          </p>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost">
              <Eye className="h-4 w-4 mr-1" />
              Xem chi tiết
            </Button>
            <Button size="sm" variant="ghost" className="text-red-600">
              <Trash2 className="h-4 w-4 mr-1" />
              Xóa
            </Button>
          </div>
        </div>
      </div>
    ))
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Quản lý đánh giá</h1>
          <p className="text-muted-foreground mt-2">Kiểm duyệt và quản lý đánh giá từ khách hàng</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">Tổng đánh giá</div>
              <div className="text-2xl font-bold mt-2">{stats.total.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Cập nhật mỗi giờ</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">Đang chờ duyệt</div>
              <div className="text-2xl font-bold mt-2 text-orange-600">{stats.pending}</div>
              <p className="text-xs text-muted-foreground mt-1">Ưu tiên xử lý</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">Bị báo cáo</div>
              <div className="text-2xl font-bold mt-2 text-red-600">{stats.flagged}</div>
              <p className="text-xs text-muted-foreground mt-1">Cần theo dõi</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">Đánh giá TB</div>
              <div className="text-2xl font-bold mt-2 flex items-center gap-1">
                {stats.averageRating.toFixed(1)}
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              </div>
              <p className="text-xs text-green-600 mt-1">Cập nhật theo thời gian thực</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm đánh giá..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Tabs value={filter} onValueChange={(value) => setFilter(value as ReviewFilter)}>
              <TabsList className="mb-2">
                <TabsTrigger value="all">Tất cả</TabsTrigger>
                <TabsTrigger value="pending">Chờ duyệt ({stats.pending})</TabsTrigger>
                <TabsTrigger value="approved">Đã duyệt</TabsTrigger>
                <TabsTrigger value="flagged">
                  <Flag className="h-4 w-4 mr-1" />
                  Bị báo cáo ({stats.flagged})
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-3">{renderReviews()}</div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
