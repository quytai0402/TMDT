"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  Target,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Info
} from "lucide-react"

interface PricingSuggestion {
  period: string
  currentPrice: number
  suggestedPrice: number
  reason: string
  impact: "high" | "medium" | "low"
  confidence: number
  factors: string[]
}

const suggestions: PricingSuggestion[] = [
  {
    period: "15-25 Nov (Cuối tuần)",
    currentPrice: 1850000,
    suggestedPrice: 2400000,
    reason: "Nhu cầu cao do gần lễ Thanksgiving và thời tiết đẹp",
    impact: "high",
    confidence: 92,
    factors: [
      "Nhu cầu tăng 45% so với tuần trước",
      "Đối thủ tăng giá TB 28%",
      "Occupancy dự kiến 95%",
      "Weather forecast: Nắng đẹp"
    ]
  },
  {
    period: "1-7 Dec (Đầu tháng)",
    currentPrice: 1850000,
    suggestedPrice: 1650000,
    reason: "Nhu cầu thấp sau ngày lễ, nên giảm giá để tăng occupancy",
    impact: "medium",
    confidence: 78,
    factors: [
      "Nhu cầu giảm 22% sau lễ",
      "Thị trường có nhiều phòng trống",
      "Giảm giá giúp tăng 15% booking",
      "Cạnh tranh với 8 listings mới"
    ]
  },
  {
    period: "20-31 Dec (Tết Dương lịch)",
    currentPrice: 1850000,
    suggestedPrice: 3200000,
    reason: "Mùa cao điểm tuyệt đối - Tết Dương lịch & Giáng sinh",
    impact: "high",
    confidence: 96,
    factors: [
      "Peak season với occupancy 98%",
      "Đối thủ tăng giá 65-75%",
      "Booking sớm tăng 180%",
      "Limited availability trong khu vực"
    ]
  },
  {
    period: "1-15 Jan (Sau Tết)",
    currentPrice: 1850000,
    suggestedPrice: 1500000,
    reason: "Mùa thấp điểm, giảm giá mạnh để duy trì occupancy",
    impact: "high",
    confidence: 85,
    factors: [
      "Off-season với nhu cầu giảm 40%",
      "Cần duy trì cash flow",
      "Khuyến mãi dài hạn (7+ đêm) hiệu quả",
      "Workation travelers tìm deal tốt"
    ]
  }
]

export function AIPricingSuggestions() {
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return "text-red-600 bg-red-100"
      case "medium":
        return "text-orange-600 bg-orange-100"
      case "low":
        return "text-blue-600 bg-blue-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  const getImpactLabel = (impact: string) => {
    switch (impact) {
      case "high":
        return "Ảnh hưởng lớn"
      case "medium":
        return "Ảnh hưởng vừa"
      case "low":
        return "Ảnh hưởng nhỏ"
      default:
        return "Khác"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Đề xuất giá từ AI</h2>
          <p className="text-muted-foreground">
            Dựa trên phân tích thị trường, đối thủ, và xu hướng đặt phòng
          </p>
        </div>
        <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2">
          <Sparkles className="w-4 h-4 mr-2" />
          AI Powered
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">+35%</p>
              <p className="text-xs text-muted-foreground">Tiềm năng doanh thu</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">4</p>
              <p className="text-xs text-muted-foreground">Gợi ý giá mới</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Target className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">88%</p>
              <p className="text-xs text-muted-foreground">Độ chính xác TB</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">12</p>
              <p className="text-xs text-muted-foreground">Đối thủ phân tích</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Suggestions List */}
      <div className="space-y-4">
        {suggestions.map((suggestion, idx) => {
          const priceChange = suggestion.suggestedPrice - suggestion.currentPrice
          const priceChangePercent = (priceChange / suggestion.currentPrice * 100).toFixed(1)
          const isIncrease = priceChange > 0

          return (
            <Card key={idx} className="p-6 hover:shadow-lg transition-shadow">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-bold text-lg">{suggestion.period}</h3>
                    <Badge className={getImpactColor(suggestion.impact)}>
                      {getImpactLabel(suggestion.impact)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{suggestion.reason}</p>
                </div>
                <div className="text-right ml-4">
                  <div className="flex items-center space-x-2 mb-1">
                    {isIncrease ? (
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-orange-600" />
                    )}
                    <span className={`text-2xl font-bold ${isIncrease ? "text-green-600" : "text-orange-600"}`}>
                      {isIncrease ? "+" : ""}{priceChangePercent}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">so với giá hiện tại</p>
                </div>
              </div>

              {/* Price Comparison */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Giá hiện tại</p>
                  <p className="text-xl font-bold">{suggestion.currentPrice.toLocaleString("vi-VN")}₫</p>
                </div>
                <div className={`p-3 rounded-lg ${isIncrease ? "bg-green-50" : "bg-orange-50"}`}>
                  <p className="text-xs text-muted-foreground mb-1">Giá đề xuất</p>
                  <p className={`text-xl font-bold ${isIncrease ? "text-green-600" : "text-orange-600"}`}>
                    {suggestion.suggestedPrice.toLocaleString("vi-VN")}₫
                  </p>
                </div>
              </div>

              {/* Confidence Score */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Độ tin cậy</span>
                  <span className="text-sm font-bold text-primary">{suggestion.confidence}%</span>
                </div>
                <Progress value={suggestion.confidence} className="h-2" />
              </div>

              {/* Factors */}
              <div className="mb-4">
                <p className="text-sm font-medium mb-3 flex items-center">
                  <Info className="w-4 h-4 mr-2 text-muted-foreground" />
                  Yếu tố ảnh hưởng
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {suggestion.factors.map((factor, factorIdx) => (
                    <div key={factorIdx} className="flex items-start space-x-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{factor}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-3 pt-4 border-t">
                <Button className="flex-1">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Áp dụng giá này
                </Button>
                <Button variant="outline">
                  Chi tiết
                </Button>
                <Button variant="outline" size="icon">
                  <AlertCircle className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Auto-pricing Card */}
      <Card className="p-6 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-lg mb-2">Bật tự động điều chỉnh giá?</h4>
            <p className="text-sm text-muted-foreground mb-4">
              AI sẽ tự động cập nhật giá theo thời gian thực dựa trên thị trường, đối thủ và nhu cầu. 
              Bạn vẫn có thể xem và duyệt trước khi áp dụng.
            </p>
            <div className="flex items-center space-x-3">
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600">
                <Sparkles className="w-4 h-4 mr-2" />
                Kích hoạt Auto-pricing
              </Button>
              <Button variant="outline">
                Tìm hiểu thêm
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
