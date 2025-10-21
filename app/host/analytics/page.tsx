"use client"

import { useState } from "react"
import { HostLayout } from "@/components/host-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  BarChart3, 
  Users, 
  Calendar, 
  Target,
  Download,
  RefreshCw,
  TrendingUp
} from "lucide-react"
import { AnalyticsOverview } from "@/components/analytics-overview"
import { AdvancedRevenueChart } from "@/components/advanced-revenue-chart"
import { GuestDemographics } from "@/components/guest-demographics"
import { SeasonalInsights } from "@/components/seasonal-insights"
import { CompetitorAnalysis } from "@/components/competitor-analysis"

export default function HostAnalyticsPage() {
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1500)
  }

  const handleExport = () => {
    alert("Đang tải xuống báo cáo... (Tính năng đang phát triển)")
  }

  return (
    <HostLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Phân tích & Thống kê</h1>
              <p className="text-muted-foreground">
                Tổng quan hiệu suất listing và insights để tăng doanh thu
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Đang tải...' : 'Làm mới'}
              </Button>
              <Button size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Xuất báo cáo
              </Button>
            </div>
          </div>

          {/* Period Selector */}
          <div className="flex items-center space-x-2">
            <Badge variant="outline">Tháng này</Badge>
            <Badge variant="outline">30 ngày</Badge>
            <Badge variant="outline">90 ngày</Badge>
            <Badge>Năm nay</Badge>
            <Badge variant="outline">Tùy chỉnh</Badge>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="mb-8">
          <AnalyticsOverview />
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="revenue" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="revenue" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Doanh thu</span>
            </TabsTrigger>
            <TabsTrigger value="guests" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Khách hàng</span>
            </TabsTrigger>
            <TabsTrigger value="seasonal" className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Theo mùa</span>
            </TabsTrigger>
            <TabsTrigger value="competitor" className="flex items-center space-x-2">
              <Target className="w-4 h-4" />
              <span>Đối thủ</span>
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>Insights</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="revenue">
            <AdvancedRevenueChart />
          </TabsContent>

          <TabsContent value="guests">
            <GuestDemographics />
          </TabsContent>

          <TabsContent value="seasonal">
            <SeasonalInsights />
          </TabsContent>

          <TabsContent value="competitor">
            <CompetitorAnalysis />
          </TabsContent>

          <TabsContent value="insights">
            <div className="space-y-6">
              {/* Performance Score */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold mb-2">Điểm hiệu suất tổng thể</h3>
                    <p className="text-sm text-muted-foreground">
                      Đánh giá toàn diện về listing của bạn
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mb-2">
                      <span className="text-3xl font-bold text-white">8.7</span>
                    </div>
                    <Badge className="bg-green-600">Xuất sắc</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Điểm mạnh</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center space-x-2">
                        <span className="text-green-600">●</span>
                        <span>Đánh giá xuất sắc (4.8/5) - Top 15%</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <span className="text-green-600">●</span>
                        <span>Tỷ lệ lấp đầy cao (85%) - Top 20%</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <span className="text-green-600">●</span>
                        <span>Tỷ lệ phản hồi tuyệt vời (98%)</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <span className="text-green-600">●</span>
                        <span>Giá cạnh tranh và hợp lý</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Cơ hội phát triển</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center space-x-2">
                        <span className="text-orange-600">●</span>
                        <span>Tăng lượt xem với ảnh chất lượng cao</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <span className="text-orange-600">●</span>
                        <span>Tối ưu giá trong mùa cao điểm</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <span className="text-orange-600">●</span>
                        <span>Thêm amenities độc đáo</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <span className="text-orange-600">●</span>
                        <span>Chạy khuyến mãi dài hạn (7+ ngày)</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>

              {/* Top Actions */}
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4">Hành động đề xuất</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-4 p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">📸</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">Cập nhật ảnh chuyên nghiệp</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Listings với ảnh chất lượng cao nhận được 40% lượt xem nhiều hơn
                      </p>
                      <Badge variant="outline" className="text-xs">+40% views dự kiến</Badge>
                    </div>
                    <Button size="sm">Thuê photographer</Button>
                  </div>

                  <div className="flex items-start space-x-4 p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">💰</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">Điều chỉnh giá mùa hè</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Tăng giá 15% trong T6-T8 để tối đa hóa doanh thu mùa cao điểm
                      </p>
                      <Badge variant="outline" className="text-xs">+18M doanh thu dự kiến</Badge>
                    </div>
                    <Button size="sm">Xem Smart Pricing</Button>
                  </div>

                  <div className="flex items-start space-x-4 p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">🎯</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">Chạy khuyến mãi dài hạn</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Giảm 15% cho booking 7+ ngày để tăng occupancy mùa thấp điểm
                      </p>
                      <Badge variant="outline" className="text-xs">+12% occupancy dự kiến</Badge>
                    </div>
                    <Button size="sm">Tạo khuyến mãi</Button>
                  </div>
                </div>
              </Card>

              {/* Market Trends */}
              <Card className="p-6 bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
                <h3 className="text-xl font-bold mb-4">📈 Xu hướng thị trường</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-white rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Giá TB thị trường</p>
                    <p className="text-2xl font-bold mb-2">₫1,980,000</p>
                    <Badge variant="outline" className="text-xs">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +8% so với tháng trước
                    </Badge>
                  </div>
                  <div className="p-4 bg-white rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Occupancy TB khu vực</p>
                    <p className="text-2xl font-bold mb-2">78%</p>
                    <Badge variant="outline" className="text-xs">
                      Bạn cao hơn +7%
                    </Badge>
                  </div>
                  <div className="p-4 bg-white rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Nhu cầu tháng tới</p>
                    <p className="text-2xl font-bold mb-2">Cao</p>
                    <Badge className="bg-green-600 text-xs">
                      Mùa cao điểm
                    </Badge>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </HostLayout>
  )
}
