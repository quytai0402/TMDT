'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Star, TrendingUp, TrendingDown } from 'lucide-react'

interface ReviewAISummaryProps {
  summary: {
    overall: {
      averageRating: number
      totalReviews: number
      sentiment: {
        positive: number
        neutral: number
        negative: number
      }
    }
    categoryRatings: {
      cleanliness: number
      accuracy: number
      checkIn: number
      communication: number
      location: number
      value: number
    }
    keywords: {
      positive: string[]
      negative: string[]
    }
    summary: string
  }
}

const categoryLabels: Record<string, string> = {
  cleanliness: 'Độ sạch sẽ',
  accuracy: 'Mô tả chính xác',
  checkIn: 'Nhận phòng',
  communication: 'Giao tiếp',
  location: 'Vị trí',
  value: 'Giá trị',
}

export function ReviewAISummary({ summary }: ReviewAISummaryProps) {
  const sentimentPercent = {
    positive: (summary.overall.sentiment.positive / summary.overall.totalReviews) * 100,
    neutral: (summary.overall.sentiment.neutral / summary.overall.totalReviews) * 100,
    negative: (summary.overall.sentiment.negative / summary.overall.totalReviews) * 100,
  }

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-purple-600" />
          Tóm tắt đánh giá bằng AI
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Rating */}
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-900">
              {summary.overall.averageRating.toFixed(1)}
            </div>
            <div className="flex gap-1 mt-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(summary.overall.averageRating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {summary.overall.totalReviews} đánh giá
            </div>
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Tích cực</span>
              <Progress value={sentimentPercent.positive} className="flex-1 h-2" />
              <span className="text-sm text-muted-foreground">
                {sentimentPercent.positive.toFixed(0)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-4 w-4" />
              <span className="text-sm font-medium">Trung lập</span>
              <Progress value={sentimentPercent.neutral} className="flex-1 h-2" />
              <span className="text-sm text-muted-foreground">
                {sentimentPercent.neutral.toFixed(0)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium">Tiêu cực</span>
              <Progress value={sentimentPercent.negative} className="flex-1 h-2" />
              <span className="text-sm text-muted-foreground">
                {sentimentPercent.negative.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {/* Category Ratings */}
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(summary.categoryRatings).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm">{categoryLabels[key]}</span>
              <div className="flex items-center gap-2">
                <Progress value={value * 20} className="w-20 h-2" />
                <span className="text-sm font-semibold w-8">{value.toFixed(1)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* AI Summary */}
        <div className="bg-white/60 rounded-lg p-4">
          <h4 className="font-semibold mb-2">Tóm tắt tự động</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {summary.summary}
          </p>
        </div>

        {/* Keywords */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold mb-2 text-green-700">Điểm mạnh</h4>
            <div className="flex flex-wrap gap-2">
              {summary.keywords.positive.slice(0, 5).map((keyword, index) => (
                <Badge key={index} variant="secondary" className="bg-green-100 text-green-800">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-2 text-orange-700">Cần cải thiện</h4>
            <div className="flex flex-wrap gap-2">
              {summary.keywords.negative.slice(0, 5).map((keyword, index) => (
                <Badge key={index} variant="secondary" className="bg-orange-100 text-orange-800">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
