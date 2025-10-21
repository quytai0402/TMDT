'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Star, AlertCircle, CheckCircle } from 'lucide-react'
import { useReviews } from '@/hooks/use-reviews'
import { cn } from '@/lib/utils'

interface ReviewFormProps {
  bookingId: string
  reviewType: 'GUEST_TO_HOST' | 'GUEST_TO_LISTING' | 'HOST_TO_GUEST'
  targetId: string
  targetName: string
  onSuccess?: () => void
}

const categories = [
  { key: 'cleanliness', label: 'Độ sạch sẽ' },
  { key: 'accuracy', label: 'Mô tả chính xác' },
  { key: 'checkIn', label: 'Nhận phòng' },
  { key: 'communication', label: 'Giao tiếp' },
  { key: 'location', label: 'Vị trí' },
  { key: 'value', label: 'Giá trị' },
]

export function ReviewForm({
  bookingId,
  reviewType,
  targetId,
  targetName,
  onSuccess,
}: ReviewFormProps) {
  const { createReview, loading, error } = useReviews()
  const [submitted, setSubmitted] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState('')
  const [categoryRatings, setCategoryRatings] = useState<Record<string, number>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (rating === 0) return

    try {
      await createReview({
        bookingId,
        reviewType,
        targetId,
        rating,
        comment,
        categoryRatings: reviewType === 'GUEST_TO_LISTING' ? categoryRatings : undefined,
      })

      setSubmitted(true)
      onSuccess?.()
    } catch (err) {
      console.error('Failed to submit review:', err)
    }
  }

  if (submitted) {
    return (
      <Card>
        <CardContent className="p-8 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-2">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="font-semibold text-lg">Cảm ơn bạn đã đánh giá!</h3>
          <p className="text-sm text-muted-foreground">
            Đánh giá của bạn giúp cộng đồng có thêm thông tin và cải thiện trải nghiệm.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Đánh giá {targetName}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Overall Rating */}
          <div className="space-y-2">
            <Label>Đánh giá tổng thể *</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      'h-8 w-8',
                      (hoveredRating || rating) >= star
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    )}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-muted-foreground">
                {rating === 5 && 'Tuyệt vời!'}
                {rating === 4 && 'Rất tốt'}
                {rating === 3 && 'Tốt'}
                {rating === 2 && 'Khá'}
                {rating === 1 && 'Cần cải thiện'}
              </p>
            )}
          </div>

          {/* Category Ratings (for listing reviews) */}
          {reviewType === 'GUEST_TO_LISTING' && (
            <div className="space-y-4">
              <Label>Đánh giá chi tiết</Label>
              {categories.map((category) => (
                <div key={category.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{category.label}</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() =>
                            setCategoryRatings({
                              ...categoryRatings,
                              [category.key]: star,
                            })
                          }
                          className="transition-transform hover:scale-110"
                        >
                          <Star
                            className={cn(
                              'h-5 w-5',
                              (categoryRatings[category.key] || 0) >= star
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            )}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment">Nhận xét của bạn *</Label>
            <Textarea
              id="comment"
              placeholder="Chia sẻ trải nghiệm của bạn..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={5}
              required
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || rating === 0 || !comment.trim()}
          >
            {loading ? 'Đang gửi...' : 'Gửi đánh giá'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
