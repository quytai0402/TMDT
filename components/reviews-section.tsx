'use client'

import { Star, ThumbsUp } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { useState, useEffect } from "react"

interface ReviewsSectionProps {
  listingId: string
  rating: number
  totalReviews: number
}

interface Review {
  id: string
  user: {
    name: string
    avatar: string
    date: string
  }
  rating: number
  comment: string
  helpful: number
}

interface RatingBreakdown {
  stars: number
  percentage: number
}

export function ReviewsSection({ listingId, rating, totalReviews }: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [ratingBreakdown, setRatingBreakdown] = useState<RatingBreakdown[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/listings/${listingId}/reviews`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch reviews')
        }

        const data = await response.json()
        setReviews(data.reviews || [])
        setRatingBreakdown(data.ratingBreakdown || [])
      } catch (error) {
        console.error('Error fetching reviews:', error)
        setReviews([])
        setRatingBreakdown([])
      } finally {
        setLoading(false)
      }
    }

    fetchReviews()
  }, [listingId])

  if (loading) {
    return (
      <div className="pb-8 border-b border-border">
        <h3 className="font-semibold text-xl text-foreground mb-6">Đánh giá</h3>
        <div className="text-muted-foreground">Đang tải đánh giá...</div>
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <div className="pb-8 border-b border-border">
        <h3 className="font-semibold text-xl text-foreground mb-6">Đánh giá</h3>
        <div className="text-muted-foreground">Chưa có đánh giá nào.</div>
      </div>
    )
  }
  return (
    <div className="pb-8 border-b border-border">
      <h3 className="font-semibold text-xl text-foreground mb-6">Đánh giá</h3>

      {/* Rating Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <Star className="h-6 w-6 fill-foreground text-foreground" />
            <span className="text-3xl font-bold">{rating}</span>
            <span className="text-muted-foreground">({totalReviews} đánh giá)</span>
          </div>
        </div>

        <div className="space-y-2">
          {ratingBreakdown.map((item) => (
            <div key={item.stars} className="flex items-center space-x-3">
              <span className="text-sm text-muted-foreground w-12">{item.stars} sao</span>
              <Progress value={item.percentage} className="flex-1" />
              <span className="text-sm text-muted-foreground w-12">{item.percentage}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.map((review) => (
          <div key={review.id} className="space-y-3">
            <div className="flex items-start space-x-4">
              <Avatar>
                <AvatarImage src={review.user.avatar || "/placeholder.svg"} alt={review.user.name} />
                <AvatarFallback>{review.user.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-foreground">{review.user.name}</h4>
                  <span className="text-sm text-muted-foreground">{review.user.date}</span>
                </div>
                <div className="flex items-center space-x-1 mb-2">
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-foreground text-foreground" />
                  ))}
                </div>
                <p className="text-muted-foreground leading-relaxed">{review.comment}</p>
                <button className="flex items-center space-x-2 mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <ThumbsUp className="h-4 w-4" />
                  <span>Hữu ích ({review.helpful})</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
