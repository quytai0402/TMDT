"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface SentimentData {
  month: string
  positive: number
  neutral: number
  negative: number
  total: number
  averageRating: number
}

export function SentimentChart() {
  const data: SentimentData[] = [
    { month: "T7", positive: 42, neutral: 3, negative: 1, total: 46, averageRating: 4.9 },
    { month: "T8", positive: 38, neutral: 4, negative: 2, total: 44, averageRating: 4.8 },
    { month: "T9", positive: 45, neutral: 2, negative: 1, total: 48, averageRating: 4.9 },
    { month: "T10", positive: 18, neutral: 1, negative: 0, total: 19, averageRating: 5.0 }
  ]

  const maxTotal = Math.max(...data.map(d => d.total))
  const currentMonth = data[data.length - 1]
  const previousMonth = data[data.length - 2]
  const trend = currentMonth.averageRating - previousMonth.averageRating

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">xu hướng đánh giá theo thời gian</CardTitle>
          <Badge 
            variant={trend >= 0 ? "default" : "destructive"}
            className="gap-1"
          >
            {trend >= 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {trend >= 0 ? "+" : ""}{trend.toFixed(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Chart */}
        <div className="space-y-4">
          {data.map((item, index) => {
            const positivePercent = (item.positive / item.total) * 100
            const neutralPercent = (item.neutral / item.total) * 100
            const negativePercent = (item.negative / item.total) * 100
            const barHeight = (item.total / maxTotal) * 100

            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium w-12">{item.month}</span>
                  <div className="flex-1 mx-4">
                    <div 
                      className="relative bg-gray-100 rounded-full overflow-hidden"
                      style={{ height: `${Math.max(barHeight / 3, 24)}px` }}
                    >
                      <div className="absolute inset-0 flex">
                        <div
                          className="bg-green-500 hover:bg-green-600 transition-colors"
                          style={{ width: `${positivePercent}%` }}
                          title={`${item.positive} tích cực`}
                        />
                        <div
                          className="bg-gray-400 hover:bg-gray-500 transition-colors"
                          style={{ width: `${neutralPercent}%` }}
                          title={`${item.neutral} trung lập`}
                        />
                        <div
                          className="bg-red-500 hover:bg-red-600 transition-colors"
                          style={{ width: `${negativePercent}%` }}
                          title={`${item.negative} tiêu cực`}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">{item.total} đánh giá</span>
                    <Badge variant="secondary" className="min-w-[60px] justify-center">
                      ⭐ {item.averageRating}
                    </Badge>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-6 pt-6 border-t text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded" />
            <span>Tích cực</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-400 rounded" />
            <span>Trung lập</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded" />
            <span>Tiêu cực</span>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {Math.round(data.reduce((sum, d) => sum + (d.positive / d.total * 100), 0) / data.length)}%
            </div>
            <p className="text-xs text-gray-600 mt-1">TB tích cực</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">
              {Math.round(data.reduce((sum, d) => sum + (d.neutral / d.total * 100), 0) / data.length)}%
            </div>
            <p className="text-xs text-gray-600 mt-1">TB trung lập</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {Math.round(data.reduce((sum, d) => sum + (d.negative / d.total * 100), 0) / data.length)}%
            </div>
            <p className="text-xs text-gray-600 mt-1">TB tiêu cực</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
