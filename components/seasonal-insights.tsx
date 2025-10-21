"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Sun,
  Cloud,
  Snowflake,
  Leaf,
  DollarSign,
  Users,
  Target
} from "lucide-react"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

const monthlyTrends = [
  { month: "T1", bookings: 18, revenue: 65, occupancy: 72, avgPrice: 1600 },
  { month: "T2", bookings: 16, revenue: 59, occupancy: 68, avgPrice: 1550 },
  { month: "T3", bookings: 21, revenue: 72, occupancy: 78, avgPrice: 1700 },
  { month: "T4", bookings: 19, revenue: 68, occupancy: 75, avgPrice: 1650 },
  { month: "T5", bookings: 24, revenue: 81, occupancy: 85, avgPrice: 1800 },
  { month: "T6", bookings: 28, revenue: 94, occupancy: 91, avgPrice: 1900 },
  { month: "T7", bookings: 32, revenue: 105, occupancy: 95, avgPrice: 2000 },
  { month: "T8", bookings: 29, revenue: 98, occupancy: 92, avgPrice: 1950 },
  { month: "T9", bookings: 22, revenue: 76, occupancy: 79, avgPrice: 1750 },
  { month: "T10", bookings: 25, revenue: 84, occupancy: 82, avgPrice: 1850 },
]

const seasonalData = [
  {
    season: "Xuân",
    icon: Leaf,
    months: "T3-T5",
    avgBookings: 21,
    avgRevenue: 73.7,
    avgOccupancy: 79,
    trend: "up",
    color: "text-green-600",
    bgColor: "bg-green-100"
  },
  {
    season: "Hè",
    icon: Sun,
    months: "T6-T8",
    avgBookings: 29.7,
    avgRevenue: 99,
    avgOccupancy: 93,
    trend: "up",
    color: "text-orange-600",
    bgColor: "bg-orange-100"
  },
  {
    season: "Thu",
    icon: Cloud,
    months: "T9-T11",
    avgBookings: 23.5,
    avgRevenue: 80,
    avgOccupancy: 80.5,
    trend: "down",
    color: "text-amber-600",
    bgColor: "bg-amber-100"
  },
  {
    season: "Đông",
    icon: Snowflake,
    months: "T12-T2",
    avgBookings: 17,
    avgRevenue: 62,
    avgOccupancy: 70,
    trend: "down",
    color: "text-blue-600",
    bgColor: "bg-blue-100"
  },
]

const upcomingEvents = [
  { 
    name: "Tết Nguyên Đán", 
    date: "29/01 - 04/02/2025", 
    impact: "high",
    predictedBookings: "+150%",
    suggestedPrice: "+80%"
  },
  { 
    name: "Lễ 30/4 - 1/5", 
    date: "30/04 - 03/05/2025", 
    impact: "high",
    predictedBookings: "+120%",
    suggestedPrice: "+60%"
  },
  { 
    name: "Hè cao điểm", 
    date: "15/06 - 31/08/2025", 
    impact: "medium",
    predictedBookings: "+80%",
    suggestedPrice: "+40%"
  },
]

export function SeasonalInsights() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Phân tích theo mùa</h2>
        <p className="text-muted-foreground">
          Hiểu xu hướng theo mùa để tối ưu giá và tăng doanh thu
        </p>
      </div>

      {/* Seasonal Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {seasonalData.map((season, idx) => {
          const Icon = season.icon
          const TrendIcon = season.trend === "up" ? TrendingUp : TrendingDown
          
          return (
            <Card key={idx} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg ${season.bgColor} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${season.color}`} />
                </div>
                <Badge variant={season.trend === "up" ? "default" : "secondary"}>
                  <TrendIcon className="w-3 h-3 mr-1" />
                  {season.trend === "up" ? "Mùa cao điểm" : "Mùa thấp điểm"}
                </Badge>
              </div>
              
              <h3 className="font-bold text-lg mb-1">{season.season}</h3>
              <p className="text-sm text-muted-foreground mb-4">{season.months}</p>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">TB đặt phòng</span>
                  <span className="font-bold">{season.avgBookings}/tháng</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">TB doanh thu</span>
                  <span className="font-bold">{season.avgRevenue}M/tháng</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">TB lấp đầy</span>
                  <span className="font-bold">{season.avgOccupancy}%</span>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Detailed Charts */}
      <Card className="p-6">
        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="bookings">Đặt phòng</TabsTrigger>
            <TabsTrigger value="revenue">Doanh thu</TabsTrigger>
            <TabsTrigger value="occupancy">Lấp đầy</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="bookings" fill="#8b5cf6" name="Số đặt phòng" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="revenue">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `${value}M`} />
                  <Tooltip formatter={(value) => `${value}M₫`} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Doanh thu (triệu)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="occupancy">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `${value}%`} />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="occupancy" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    name="Tỷ lệ lấp đầy (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Upcoming Events */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold mb-1">Sự kiện sắp tới</h3>
            <p className="text-sm text-muted-foreground">
              Chuẩn bị trước cho các mùa cao điểm
            </p>
          </div>
          <Button variant="outline" size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            Xem lịch đầy đủ
          </Button>
        </div>

        <div className="space-y-4">
          {upcomingEvents.map((event, idx) => (
            <div 
              key={idx} 
              className="flex items-start justify-between p-4 border rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h4 className="font-semibold">{event.name}</h4>
                  <Badge variant={event.impact === "high" ? "default" : "secondary"}>
                    {event.impact === "high" ? "Cao điểm" : "Trung bình"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  {event.date}
                </p>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span className="text-blue-600 font-medium">{event.predictedBookings}</span>
                    <span className="text-muted-foreground">đặt phòng</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="text-green-600 font-medium">{event.suggestedPrice}</span>
                    <span className="text-muted-foreground">giá đề xuất</span>
                  </div>
                </div>
              </div>
              <Button size="sm" className="ml-4">
                Điều chỉnh giá
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Insights */}
      <Card className="p-6 bg-gradient-to-r from-primary/10 to-blue-500/10">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <Target className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h4 className="font-semibold text-lg mb-2">💡 Gợi ý tối ưu</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Mùa hè (T6-T8) là mùa cao điểm nhất với doanh thu TB 99M/tháng (+34% so với cả năm)</li>
              <li>• Tăng giá 40-60% trong các dịp lễ lớn để tối đa hóa doanh thu</li>
              <li>• Mùa đông có nhu cầu thấp hơn, cân nhắc giảm giá 15-20% hoặc chạy khuyến mãi dài hạn</li>
              <li>• Đặt phòng sớm cho Tết Nguyên Đán thường tăng 150%, mở đặt phòng từ 3 tháng trước</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}
