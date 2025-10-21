"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  TrendingUp, 
  TrendingDown,
  Eye,
  DollarSign,
  Star,
  Target,
  AlertCircle,
  CheckCircle
} from "lucide-react"

interface Competitor {
  id: string
  name: string
  distance: string
  price: number
  rating: number
  reviews: number
  occupancy: number
  image: string
  advantages: string[]
  disadvantages: string[]
}

const competitors: Competitor[] = [
  {
    id: "1",
    name: "Seaside Villa Premium",
    distance: "0.5km",
    price: 2200000,
    rating: 4.9,
    reviews: 342,
    occupancy: 92,
    image: "/placeholder.svg",
    advantages: ["Giá cao hơn 19%", "Rating cao hơn"],
    disadvantages: ["Ít đánh giá hơn 15%"],
  },
  {
    id: "2",
    name: "Ocean View Apartment",
    distance: "0.8km",
    price: 1650000,
    rating: 4.6,
    reviews: 267,
    image: "/placeholder.svg",
    advantages: ["Giá thấp hơn 11%"],
    disadvantages: ["Rating thấp hơn", "Occupancy thấp hơn 8%"],
    occupancy: 78,
  },
  {
    id: "3",
    name: "Beachfront Luxury Suite",
    distance: "1.2km",
    price: 2800000,
    rating: 4.8,
    reviews: 189,
    image: "/placeholder.svg",
    advantages: ["Giá cao hơn 51%"],
    disadvantages: ["Xa hơn", "Ít reviews"],
    occupancy: 88,
  },
]

const marketInsights = [
  {
    metric: "Vị trí giá của bạn",
    value: "Trung bình-Cao",
    description: "Cao hơn 58% đối thủ cùng khu vực",
    status: "good",
    icon: DollarSign
  },
  {
    metric: "Đánh giá của bạn",
    value: "4.8/5.0",
    description: "Cao hơn TB thị trường (4.6)",
    status: "good",
    icon: Star
  },
  {
    metric: "Lượt xem",
    value: "1,247",
    description: "Thấp hơn 12% so với tháng trước",
    status: "warning",
    icon: Eye
  },
  {
    metric: "Tỷ lệ chuyển đổi",
    value: "3.2%",
    description: "Cao hơn TB thị trường (2.8%)",
    status: "good",
    icon: Target
  },
]

export function CompetitorAnalysis() {
  const yourPrice = 1850000
  const avgCompetitorPrice = (competitors.reduce((sum, c) => sum + c.price, 0) / competitors.length)
  const priceDiff = ((yourPrice - avgCompetitorPrice) / avgCompetitorPrice * 100)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Phân tích đối thủ</h2>
        <p className="text-muted-foreground">
          So sánh với các homestay cạnh tranh trong khu vực
        </p>
      </div>

      {/* Market Position */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {marketInsights.map((insight, idx) => {
          const Icon = insight.icon
          return (
            <Card key={idx} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg ${
                  insight.status === "good" ? "bg-green-100" : "bg-orange-100"
                } flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${
                    insight.status === "good" ? "text-green-600" : "text-orange-600"
                  }`} />
                </div>
                {insight.status === "good" ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-1">{insight.metric}</p>
              <p className="text-xl font-bold mb-2">{insight.value}</p>
              <p className="text-xs text-muted-foreground">{insight.description}</p>
            </Card>
          )
        })}
      </div>

      {/* Price Comparison */}
      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4">So sánh giá</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg border-2 border-primary">
            <div>
              <p className="font-semibold mb-1">Giá của bạn</p>
              <p className="text-2xl font-bold text-primary">{yourPrice.toLocaleString('vi-VN')}₫</p>
            </div>
            <Badge className="bg-primary">Listing của bạn</Badge>
          </div>

          {competitors.map((comp, idx) => {
            const priceDiff = ((comp.price - yourPrice) / yourPrice * 100)
            const isHigher = priceDiff > 0
            
            return (
              <div key={idx} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="w-16 h-16 rounded-lg bg-muted flex-shrink-0"></div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{comp.name}</h4>
                    <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                      <span>📍 {comp.distance}</span>
                      <span>⭐ {comp.rating} ({comp.reviews})</span>
                      <span>📊 {comp.occupancy}% lấp đầy</span>
                    </div>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p className="text-lg font-bold mb-1">{comp.price.toLocaleString('vi-VN')}₫</p>
                  <div className={`flex items-center space-x-1 text-sm ${
                    isHigher ? "text-red-600" : "text-green-600"
                  }`}>
                    {isHigher ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    <span className="font-medium">{isHigher ? '+' : ''}{priceDiff.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            )
          })}

          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Giá trung bình thị trường</span>
              <span className="text-xl font-bold">{avgCompetitorPrice.toLocaleString('vi-VN')}₫</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Giá của bạn {priceDiff > 0 ? 'cao' : 'thấp'} hơn {Math.abs(priceDiff).toFixed(1)}% so với TB
            </p>
          </div>
        </div>
      </Card>

      {/* Competitive Advantages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            Điểm mạnh của bạn
          </h3>
          <ul className="space-y-3">
            <li className="flex items-start space-x-2">
              <span className="text-green-600 font-bold">✓</span>
              <span className="text-sm">Đánh giá cao (4.8/5) - cao hơn 2 trong 3 đối thủ</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-green-600 font-bold">✓</span>
              <span className="text-sm">Số lượng reviews nhiều nhất (402 đánh giá)</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-green-600 font-bold">✓</span>
              <span className="text-sm">Tỷ lệ lấp đầy cao (85%) - trên TB thị trường</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-green-600 font-bold">✓</span>
              <span className="text-sm">Giá cạnh tranh - cân bằng giữa chất lượng và giá trị</span>
            </li>
          </ul>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 text-orange-600 mr-2" />
            Cơ hội cải thiện
          </h3>
          <ul className="space-y-3">
            <li className="flex items-start space-x-2">
              <span className="text-orange-600 font-bold">!</span>
              <span className="text-sm">Tăng lượt xem bằng cách tối ưu ảnh và mô tả</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-orange-600 font-bold">!</span>
              <span className="text-sm">Cân nhắc điều chỉnh giá trong mùa thấp điểm</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-orange-600 font-bold">!</span>
              <span className="text-sm">Thêm amenities độc đáo để khác biệt hóa</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-orange-600 font-bold">!</span>
              <span className="text-sm">Cải thiện tốc độ phản hồi để tăng tỷ lệ chuyển đổi</span>
            </li>
          </ul>
        </Card>
      </div>

      {/* Recommendations */}
      <Card className="p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <Target className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-lg mb-3">💡 Chiến lược đề xuất</h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold">1</span>
                </div>
                <div>
                  <p className="font-medium text-sm mb-1">Tối ưu giá theo mùa</p>
                  <p className="text-sm text-muted-foreground">
                    Tăng giá 10-15% trong mùa cao điểm (T6-T8) khi occupancy đạt 90%+
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold">2</span>
                </div>
                <div>
                  <p className="font-medium text-sm mb-1">Cải thiện visibility</p>
                  <p className="text-sm text-muted-foreground">
                    Cập nhật ảnh chất lượng cao và mô tả chi tiết để tăng lượt xem lên 20-30%
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold">3</span>
                </div>
                <div>
                  <p className="font-medium text-sm mb-1">Khuyến mãi chiến lược</p>
                  <p className="text-sm text-muted-foreground">
                    Giảm 15% cho booking 7+ ngày trong T11-T2 để duy trì occupancy
                  </p>
                </div>
              </div>
            </div>
            <Button className="mt-4" size="sm">
              Áp dụng chiến lược
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
