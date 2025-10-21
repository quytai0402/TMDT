"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { 
  Sparkles, 
  ThumbsUp, 
  ThumbsDown, 
  TrendingUp,
  Star,
  CheckCircle2,
  AlertCircle,
  Heart
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SentimentCategory {
  category: string
  icon: React.ReactNode
  positive: number
  negative: number
  neutral: number
  highlights: string[]
}

interface ReviewSummaryProps {
  totalReviews: number
  averageRating: number
  verifiedPercentage: number
}

export function AIReviewSummary({ 
  totalReviews = 156, 
  averageRating = 4.8,
  verifiedPercentage = 92 
}: ReviewSummaryProps) {
  const sentimentCategories: SentimentCategory[] = [
    {
      category: "Sự sạch sẽ",
      icon: <Sparkles className="h-4 w-4" />,
      positive: 95,
      negative: 2,
      neutral: 3,
      highlights: [
        "Phòng luôn được dọn dẹp cực kỳ sạch sẽ",
        "Khăn trải giường và khăn tắm mới tinh",
        "Không gian thơm tho, thoáng mát"
      ]
    },
    {
      category: "Vị trí",
      icon: <TrendingUp className="h-4 w-4" />,
      positive: 88,
      negative: 5,
      neutral: 7,
      highlights: [
        "Gần biển, chỉ 5 phút đi bộ",
        "Xung quanh nhiều nhà hàng và quán cà phê",
        "Yên tĩnh nhưng vẫn thuận tiện"
      ]
    },
    {
      category: "Chủ nhà",
      icon: <Heart className="h-4 w-4" />,
      positive: 97,
      negative: 1,
      neutral: 2,
      highlights: [
        "Chủ nhà nhiệt tình, thân thiện",
        "Check-in/check-out linh hoạt",
        "Hỗ trợ tận tình khi có vấn đề"
      ]
    },
    {
      category: "Giá trị",
      icon: <Star className="h-4 w-4" />,
      positive: 91,
      negative: 4,
      neutral: 5,
      highlights: [
        "Giá cả hợp lý so với chất lượng",
        "Tiện nghi đầy đủ, hiện đại",
        "Đáng giá từng đồng bỏ ra"
      ]
    }
  ]

  const getSentimentColor = (positive: number) => {
    if (positive >= 90) return "text-green-600"
    if (positive >= 80) return "text-blue-600"
    if (positive >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  const getSentimentLabel = (positive: number, negative: number) => {
    if (positive >= 90) return { label: "Xuất sắc", color: "bg-green-100 text-green-700" }
    if (positive >= 80) return { label: "Rất tốt", color: "bg-blue-100 text-blue-700" }
    if (positive >= 70) return { label: "Tốt", color: "bg-yellow-100 text-yellow-700" }
    return { label: "Cần cải thiện", color: "bg-red-100 text-red-700" }
  }

  return (
    <div className="space-y-6">
      {/* AI Summary Header */}
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Phân tích AI từ {totalReviews} đánh giá
            </span>
            <Badge variant="secondary" className="ml-auto">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              {verifiedPercentage}% đã xác minh
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <div className="flex items-center justify-center gap-1 mb-2">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="text-3xl font-bold">{averageRating}</span>
                <span className="text-gray-500">/5</span>
              </div>
              <p className="text-sm text-gray-600">Điểm trung bình</p>
            </div>
            
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <div className="flex items-center justify-center gap-2 mb-2">
                <ThumbsUp className="h-5 w-5 text-green-600" />
                <span className="text-3xl font-bold text-green-600">94%</span>
              </div>
              <p className="text-sm text-gray-600">Đánh giá tích cực</p>
            </div>
            
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
                <span className="text-3xl font-bold text-blue-600">98%</span>
              </div>
              <p className="text-sm text-gray-600">Sẽ đặt lại</p>
            </div>
          </div>

          {/* Quick Summary */}
          <div className="mt-6 p-4 bg-white rounded-lg border border-purple-200">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-600" />
              Tóm tắt nhanh
            </h4>
            <p className="text-sm text-gray-700 leading-relaxed">
              Khách hàng đặc biệt ấn tượng với <strong>chủ nhà nhiệt tình</strong> (97% tích cực) 
              và <strong>độ sạch sẽ xuất sắc</strong> (95% tích cực). Vị trí được đánh giá cao 
              với <strong>88% khách hàng hài lòng</strong> về sự thuận tiện. Giá trị nhận được 
              xứng đáng với chi phí bỏ ra theo <strong>91% đánh giá</strong>.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Sentiment Analysis by Category */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Phân tích chi tiết theo danh mục</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {sentimentCategories.map((category, index) => {
            const sentiment = getSentimentLabel(category.positive, category.negative)
            
            return (
              <div key={index} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {category.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold">{category.category}</h4>
                      <Badge variant="secondary" className={sentiment.color}>
                        {sentiment.label}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={cn("text-2xl font-bold", getSentimentColor(category.positive))}>
                      {category.positive}%
                    </span>
                    <p className="text-xs text-gray-500">tích cực</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex gap-1">
                    <div 
                      className="h-2 bg-green-500 rounded-l"
                      style={{ width: `${category.positive}%` }}
                    />
                    <div 
                      className="h-2 bg-gray-300"
                      style={{ width: `${category.neutral}%` }}
                    />
                    <div 
                      className="h-2 bg-red-500 rounded-r"
                      style={{ width: `${category.negative}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3 text-green-600" />
                      {category.positive}%
                    </span>
                    <span>{category.neutral}% trung lập</span>
                    <span className="flex items-center gap-1">
                      <ThumbsDown className="h-3 w-3 text-red-600" />
                      {category.negative}%
                    </span>
                  </div>
                </div>

                {/* Highlights */}
                <div className="pl-12 space-y-1">
                  {category.highlights.map((highlight, hIndex) => (
                    <div key={hIndex} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{highlight}</span>
                    </div>
                  ))}
                </div>

                {index < sentimentCategories.length - 1 && (
                  <div className="border-b pt-2" />
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Common Keywords */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Từ khóa được nhắc đến nhiều nhất</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[
              { word: "sạch sẽ", count: 89 },
              { word: "view đẹp", count: 72 },
              { word: "chủ nhà tốt", count: 68 },
              { word: "yên tĩnh", count: 54 },
              { word: "tiện nghi", count: 51 },
              { word: "gần biển", count: 47 },
              { word: "rộng rãi", count: 43 },
              { word: "giá hợp lý", count: 41 },
              { word: "đầy đủ", count: 38 },
              { word: "thoải mái", count: 35 },
              { word: "ấm cúng", count: 32 },
              { word: "WiFi nhanh", count: 28 }
            ].map((keyword, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="px-3 py-1 text-sm hover:bg-gray-200 cursor-default"
              >
                {keyword.word}
                <span className="ml-1.5 text-xs text-gray-500">({keyword.count})</span>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Areas for Improvement */}
      <Card className="border-orange-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-orange-700">
            <AlertCircle className="h-5 w-5" />
            Điểm cần cải thiện (từ phản hồi tiêu cực)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-sm">
              <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium">Đường đi hơi khó tìm</span>
                <span className="text-gray-500"> - 5% đánh giá đề cập</span>
              </div>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium">Tiếng ồn từ đường lớn vào sáng sớm</span>
                <span className="text-gray-500"> - 4% đánh giá đề cập</span>
              </div>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium">Nước nóng đôi khi không ổn định</span>
                <span className="text-gray-500"> - 3% đánh giá đề cập</span>
              </div>
            </li>
          </ul>
          <p className="mt-4 text-sm text-gray-500 italic">
            * Chủ nhà đã phản hồi và cam kết cải thiện những vấn đề trên
          </p>
        </CardContent>
      </Card>

      {/* Trust Indicators */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <h4 className="font-semibold text-green-900">Đánh giá đã xác minh</h4>
                <p className="text-sm text-green-700">
                  {verifiedPercentage}% đánh giá từ khách đã lưu trú thực tế
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-blue-600" />
              <div>
                <h4 className="font-semibold text-blue-900">Phân tích bằng AI</h4>
                <p className="text-sm text-blue-700">
                  Tự động phát hiện và lọc đánh giá giả mạo
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
