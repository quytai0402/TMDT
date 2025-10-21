'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Star, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ReviewFormProps {
  params: {
    id: string // booking ID
  }
}

export default function ReviewPage({ params }: ReviewFormProps) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [ratings, setRatings] = useState({
    overall: 0,
    cleanliness: 0,
    accuracy: 0,
    checkIn: 0,
    communication: 0,
    location: 0,
    value: 0,
  })
  const [comment, setComment] = useState("")

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      loadBooking()
    }
  }, [status])

  const loadBooking = async () => {
    try {
      const response = await fetch(`/api/bookings/${params.id}`)
      
      if (!response.ok) {
        throw new Error('Không tìm thấy booking')
      }

      const data = await response.json()
      
      // Check if already reviewed
      if (data.review) {
        toast({
          title: "Đã đánh giá",
          description: "Bạn đã đánh giá chuyến đi này rồi",
        })
        router.push(`/trips/${params.id}`)
        return
      }

      // Check if booking is completed
      if (data.status !== 'COMPLETED') {
        toast({
          title: "Chưa thể đánh giá",
          description: "Chỉ có thể đánh giá sau khi hoàn thành chuyến đi",
        })
        router.push(`/trips/${params.id}`)
        return
      }

      setBooking(data)
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra",
        variant: "destructive",
      })
      router.push('/trips')
    } finally {
      setLoading(false)
    }
  }

  const handleStarClick = (category: string, value: number) => {
    setRatings(prev => ({ ...prev, [category]: value }))
  }

  const handleSubmit = async () => {
    // Validation
    if (ratings.overall === 0) {
      toast({
        title: "Vui lòng đánh giá",
        description: "Hãy chọn số sao cho đánh giá tổng thể",
        variant: "destructive",
      })
      return
    }

    if (comment.length < 20) {
      toast({
        title: "Nhận xét quá ngắn",
        description: "Hãy viết ít nhất 20 ký tự",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: params.id,
          type: 'GUEST_TO_LISTING',
          overallRating: ratings.overall,
          cleanlinessRating: ratings.cleanliness || ratings.overall,
          accuracyRating: ratings.accuracy || ratings.overall,
          checkInRating: ratings.checkIn || ratings.overall,
          communicationRating: ratings.communication || ratings.overall,
          locationRating: ratings.location || ratings.overall,
          valueRating: ratings.value || ratings.overall,
          comment,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Gửi đánh giá thất bại')
      }

      const data = await response.json()
      const review = data.review || data

      Promise.all([
        import('@/lib/rewards').then(({ awardReviewPoints }) =>
          awardReviewPoints(review.id, { bookingId: params.id }).catch(err =>
            console.error('Failed to award review points:', err)
          )
        ),
        import('@/lib/quests').then(({ trackReviewQuest }) =>
          trackReviewQuest(review.id, ratings.overall).catch(err =>
            console.error('Failed to track review quest:', err)
          )
        ),
      ]).catch(err => {
        console.error('Review bonus tracking error:', err)
      })

      toast({
        title: "Thành công",
        description: "Cảm ơn bạn đã đánh giá!",
      })

      router.push(`/trips/${params.id}`)
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!booking) {
    return null
  }

  const StarRating = ({ category, label }: { category: string; label: string }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => handleStarClick(category, value)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <Star
              className={`h-8 w-8 ${
                value <= ratings[category as keyof typeof ratings]
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-muted/30 py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Đánh giá chuyến đi của bạn</CardTitle>
              <p className="text-muted-foreground mt-2">
                Chia sẻ trải nghiệm tại <strong>{booking.listing.title}</strong>
              </p>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Overall Rating - Required */}
              <div className="space-y-4 p-6 bg-muted/50 rounded-lg">
                <StarRating category="overall" label="Đánh giá tổng thể *" />
              </div>

              {/* Detailed Ratings - Optional */}
              <div className="space-y-6">
                <h3 className="font-semibold text-lg">Chi tiết (không bắt buộc)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <StarRating category="cleanliness" label="Độ sạch sẽ" />
                  <StarRating category="accuracy" label="Độ chính xác" />
                  <StarRating category="checkIn" label="Check-in" />
                  <StarRating category="communication" label="Giao tiếp" />
                  <StarRating category="location" label="Vị trí" />
                  <StarRating category="value" label="Giá trị" />
                </div>
              </div>

              {/* Comment */}
              <div className="space-y-2">
                <Label htmlFor="comment">Nhận xét của bạn *</Label>
                <Textarea
                  id="comment"
                  placeholder="Hãy chia sẻ chi tiết về trải nghiệm của bạn... (tối thiểu 20 ký tự)"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
                <p className="text-sm text-muted-foreground">
                  {comment.length} / 20 ký tự tối thiểu
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={submitting}
                  className="flex-1"
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || ratings.overall === 0 || comment.length < 20}
                  className="flex-1"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang gửi...
                    </>
                  ) : (
                    "Gửi đánh giá"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
