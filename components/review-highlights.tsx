"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star } from "lucide-react"
import { useState } from "react"

interface Review {
  id: string
  reviewer: {
    id: string
    name: string
    image: string | null
  }
  overallRating: number
  comment: string
  createdAt: Date
  cleanlinessRating?: number
  communicationRating?: number
  locationRating?: number
  valueRating?: number
}

interface ReviewHighlightsProps {
  reviews: Review[]
  averageRating: number
  totalReviews: number
}

export function ReviewHighlights({ reviews, averageRating, totalReviews }: ReviewHighlightsProps) {
  const [selectedFilter, setSelectedFilter] = useState<"all" | "positive" | "recent">("all")
  const [showAll, setShowAll] = useState(false)

  const filteredReviews = reviews.filter(review => {
    if (selectedFilter === "positive") return review.overallRating >= 4
    if (selectedFilter === "recent") {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return new Date(review.createdAt) >= thirtyDaysAgo
    }
    return true
  })

  const displayedReviews = showAll ? filteredReviews : filteredReviews.slice(0, 6)

  const ratingDistribution = [5, 4, 3, 2, 1].map(stars => ({
    stars,
    count: reviews.filter(r => Math.round(r.overallRating) === stars).length,
    percentage: totalReviews > 0 ? Math.round((reviews.filter(r => Math.round(r.overallRating) === stars).length / totalReviews) * 100) : 0
  }))

  const formatDate = (date: Date) => {
    const diffDays = Math.ceil((new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays < 7) return `${diffDays} ngày trước`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} tháng trước`
    return `${Math.floor(diffDays / 365)} năm trước`
  }

  if (reviews.length === 0) {
    return (
      <Card className="mt-8">
        <CardContent className="p-8 text-center">
          <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">Chưa có đánh giá</h3>
          <p className="text-muted-foreground">Hãy là người đầu tiên đánh giá chỗ ở này!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6 mt-8">
      <div>
        <h3 className="text-2xl font-semibold mb-2">
          <Star className="inline h-6 w-6 fill-primary text-primary mr-2" />
          {averageRating.toFixed(1)} · {totalReviews} đánh giá
        </h3>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant={selectedFilter === "all" ? "default" : "outline"} size="sm" onClick={() => setSelectedFilter("all")}>
          Tất cả ({reviews.length})
        </Button>
        <Button variant={selectedFilter === "positive" ? "default" : "outline"} size="sm" onClick={() => setSelectedFilter("positive")}>
          Tích cực ({reviews.filter(r => r.overallRating >= 4).length})
        </Button>
        <Button variant={selectedFilter === "recent" ? "default" : "outline"} size="sm" onClick={() => setSelectedFilter("recent")}>
          Gần đây
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {ratingDistribution.map(({ stars, percentage }) => (
              <div key={stars} className="flex items-center gap-3">
                <span className="text-sm font-medium w-16">{stars} sao</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${percentage}%` }} />
                </div>
                <span className="text-sm text-muted-foreground w-12 text-right">{percentage}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {displayedReviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={review.reviewer.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.reviewer.name}`} alt={review.reviewer.name} />
                  <AvatarFallback>{review.reviewer.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-semibold">{review.reviewer.name}</h4>
                      <p className="text-sm text-muted-foreground">{formatDate(review.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < Math.round(review.overallRating) ? 'fill-primary text-primary' : 'fill-muted text-muted'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed">{review.comment}</p>
                  {(review.cleanlinessRating || review.communicationRating || review.locationRating || review.valueRating) && (
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                      {review.cleanlinessRating && <div><span className="text-muted-foreground">Sạch sẽ: </span><span className="font-medium">{review.cleanlinessRating.toFixed(1)}</span></div>}
                      {review.communicationRating && <div><span className="text-muted-foreground">Giao tiếp: </span><span className="font-medium">{review.communicationRating.toFixed(1)}</span></div>}
                      {review.locationRating && <div><span className="text-muted-foreground">Vị trí: </span><span className="font-medium">{review.locationRating.toFixed(1)}</span></div>}
                      {review.valueRating && <div><span className="text-muted-foreground">Giá trị: </span><span className="font-medium">{review.valueRating.toFixed(1)}</span></div>}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredReviews.length > 6 && !showAll && (
        <Button variant="outline" className="w-full" onClick={() => setShowAll(true)}>
          Xem thêm {filteredReviews.length - 6} đánh giá
        </Button>
      )}
    </div>
  )
}
