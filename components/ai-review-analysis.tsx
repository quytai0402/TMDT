'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, TrendingDown, Sparkles, AlertCircle } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface ReviewAnalysis {
  sentimentScore: number
  totalReviews: number
  categories: {
    cleanliness: number
    accuracy: number
    checkIn: number
    communication: number
    location: number
    value: number
  }
  highlights: string[]
  improvements: string[]
  aiSummary: string
  trends: {
    month: string
    averageRating: number
  }[]
}

interface AIReviewAnalysisProps {
  listingId: string
  city: string
}

export function AIReviewAnalysis({ listingId, city }: AIReviewAnalysisProps) {
  const [analysis, setAnalysis] = useState<ReviewAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAnalysis() {
      // Validate required parameters
      if (!listingId || !city) {
        setError('Missing required parameters')
        setLoading(false)
        return
      }

      try {
        const res = await fetch(
          `/api/listings/${listingId}/reviews/analyze?city=${encodeURIComponent(city)}`
        )
        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch analysis')
        }

        setAnalysis(data)
      } catch (error: any) {
        console.error('Error fetching review analysis:', error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalysis()
  }, [listingId, city])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Phân tích đánh giá AI
          </CardTitle>
          <CardDescription>Đang phân tích bằng Machine Learning...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-600">
            <AlertCircle className="h-5 w-5" />
            Tính năng AI đang được cập nhật
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            {error.includes('API key')
              ? 'Tính năng phân tích AI cần OpenAI API key để hoạt động.'
              : 'Phân tích AI tạm thời không khả dụng. Vui lòng thử lại sau.'}
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!analysis) return null

  const categoryLabels: Record<string, string> = {
    cleanliness: 'Độ sạch sẽ',
    accuracy: 'Độ chính xác',
    checkIn: 'Nhận phòng',
    communication: 'Giao tiếp',
    location: 'Vị trí',
    value: 'Giá trị',
  }

  return (
    <div className="space-y-6">
      {/* AI Summary */}
      {analysis.aiSummary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Tóm tắt AI
            </CardTitle>
            <CardDescription>
              Được tạo bởi AI dựa trên {analysis.totalReviews} đánh giá
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">{analysis.aiSummary}</p>
          </CardContent>
        </Card>
      )}

      {/* Sentiment Score */}
      <Card>
        <CardHeader>
          <CardTitle>Đánh giá tổng quan</CardTitle>
          <CardDescription>
            Phân tích cảm xúc (Sentiment Analysis) từ {analysis.totalReviews} đánh giá
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Progress value={analysis.sentimentScore * 100} className="h-3" />
            </div>
            <Badge
              variant={analysis.sentimentScore >= 0.8 ? 'default' : 'secondary'}
              className="text-lg px-4 py-2"
            >
              {(analysis.sentimentScore * 100).toFixed(0)}%
            </Badge>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {analysis.sentimentScore >= 0.9
              ? 'Xuất sắc! Khách hàng cực kỳ hài lòng'
              : analysis.sentimentScore >= 0.8
              ? 'Rất tốt! Đa số khách hài lòng'
              : analysis.sentimentScore >= 0.7
              ? 'Tốt, nhưng có thể cải thiện'
              : 'Cần cải thiện chất lượng dịch vụ'}
          </p>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Phân tích chi tiết theo danh mục</CardTitle>
          <CardDescription>Điểm đánh giá từng khía cạnh (0-5 ⭐)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(analysis.categories).map(([key, value]) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    {categoryLabels[key] || key}
                  </span>
                  <span className="text-sm font-bold">{value.toFixed(1)}/5.0</span>
                </div>
                <Progress value={(value / 5) * 100} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Highlights */}
      {analysis.highlights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Điểm nổi bật được nhắc đến nhiều nhất
            </CardTitle>
            <CardDescription>AI phát hiện các ưu điểm được khen ngợi</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analysis.highlights.map((highlight, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg"
                >
                  <span className="text-green-600 font-bold">✓</span>
                  <span className="text-gray-700">{highlight}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Improvements */}
      {analysis.improvements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-orange-600" />
              Điểm cần cải thiện
            </CardTitle>
            <CardDescription>
              Phân tích từ phản hồi tiêu cực (AI-powered insights)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analysis.improvements.map((improvement, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg"
                >
                  <span className="text-orange-600 font-bold">!</span>
                  <span className="text-gray-700">{improvement}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trends */}
      {analysis.trends && analysis.trends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Xu hướng đánh giá theo thời gian</CardTitle>
            <CardDescription>
              Biểu đồ phân tích xu hướng rating (Time-series Analysis)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analysis.trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="averageRating"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
