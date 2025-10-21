"use client"

import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts"

const revenueData = [
  { month: "T1", revenue: 65000000, bookings: 18, avgPrice: 1600000 },
  { month: "T2", revenue: 59000000, bookings: 16, avgPrice: 1550000 },
  { month: "T3", revenue: 72000000, bookings: 21, avgPrice: 1700000 },
  { month: "T4", revenue: 68000000, bookings: 19, avgPrice: 1650000 },
  { month: "T5", revenue: 81000000, bookings: 24, avgPrice: 1800000 },
  { month: "T6", revenue: 94000000, bookings: 28, avgPrice: 1900000 },
  { month: "T7", revenue: 105000000, bookings: 32, avgPrice: 2000000 },
  { month: "T8", revenue: 98000000, bookings: 29, avgPrice: 1950000 },
  { month: "T9", revenue: 76000000, bookings: 22, avgPrice: 1750000 },
  { month: "T10", revenue: 84000000, bookings: 25, avgPrice: 1850000 },
  { month: "T11", revenue: 0, bookings: 0, avgPrice: 0 },
  { month: "T12", revenue: 0, bookings: 0, avgPrice: 0 },
]

const occupancyData = [
  { week: "T1", rate: 75, available: 10, booked: 21 },
  { week: "T2", rate: 68, available: 12, booked: 19 },
  { week: "T3", rate: 82, available: 8, booked: 23 },
  { week: "T4", rate: 79, available: 9, booked: 22 },
  { week: "T5", rate: 85, available: 7, booked: 24 },
  { week: "T6", rate: 91, available: 4, booked: 27 },
  { week: "T7", rate: 88, available: 5, booked: 26 },
  { week: "T8", rate: 85, available: 7, booked: 24 },
]

const bookingSourceData = [
  { source: "Tìm kiếm", bookings: 124, percentage: 45 },
  { source: "Collections", bookings: 68, percentage: 25 },
  { source: "Trực tiếp", bookings: 41, percentage: 15 },
  { source: "Giới thiệu", bookings: 27, percentage: 10 },
  { source: "Khác", bookings: 14, percentage: 5 },
]

export function AdvancedRevenueChart() {
  return (
    <Card className="p-6">
      <h3 className="text-xl font-bold mb-6">Phân tích chi tiết</h3>
      
      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="revenue">Doanh thu</TabsTrigger>
          <TabsTrigger value="occupancy">Lấp đầy</TabsTrigger>
          <TabsTrigger value="sources">Nguồn booking</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis 
                  tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                />
                <Tooltip 
                  formatter={(value: any) => `${value.toLocaleString('vi-VN')}₫`}
                  labelStyle={{ color: '#000' }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#8884d8" 
                  fillOpacity={1} 
                  fill="url(#colorRevenue)"
                  name="Doanh thu"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Tổng doanh thu</p>
              <p className="text-xl font-bold text-primary">₫802M</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Trung bình/tháng</p>
              <p className="text-xl font-bold">₫80.2M</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Tháng cao nhất</p>
              <p className="text-xl font-bold text-green-600">₫105M (T7)</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="occupancy" className="space-y-4">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={occupancyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="booked" fill="#10b981" name="Đã đặt" />
                <Bar dataKey="available" fill="#f59e0b" name="Còn trống" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">TB lấp đầy</p>
              <p className="text-xl font-bold text-primary">82%</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Tuần cao nhất</p>
              <p className="text-xl font-bold text-green-600">91% (T6)</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Tuần thấp nhất</p>
              <p className="text-xl font-bold text-orange-600">68% (T2)</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sources" className="space-y-4">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bookingSourceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="source" type="category" width={100} />
                <Tooltip />
                <Legend />
                <Bar dataKey="bookings" fill="#8b5cf6" name="Số đặt phòng" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            {bookingSourceData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">{item.source}</p>
                  <p className="text-sm text-muted-foreground">{item.bookings} đặt phòng</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">{item.percentage}%</p>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  )
}
