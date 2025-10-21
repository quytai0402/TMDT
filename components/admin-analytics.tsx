"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { 
  TrendingUp, 
  Users, 
  Home, 
  DollarSign, 
  Download, 
  Calendar as CalendarIcon,
  ArrowUp,
  ArrowDown,
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon
} from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { useState } from "react"
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts"

// Mock data
const revenueData = [
  { month: "T1", revenue: 125000000, bookings: 245, avgPrice: 510204 },
  { month: "T2", revenue: 142000000, bookings: 278, avgPrice: 510791 },
  { month: "T3", revenue: 158000000, bookings: 312, avgPrice: 506410 },
  { month: "T4", revenue: 178000000, bookings: 356, avgPrice: 500000 },
  { month: "T5", revenue: 195000000, bookings: 389, avgPrice: 501285 },
  { month: "T6", revenue: 215000000, bookings: 425, avgPrice: 505882 },
  { month: "T7", revenue: 245000000, bookings: 478, avgPrice: 512552 },
  { month: "T8", revenue: 268000000, bookings: 521, avgPrice: 514395 },
  { month: "T9", revenue: 252000000, bookings: 495, avgPrice: 509091 },
  { month: "T10", revenue: 285000000, bookings: 556, avgPrice: 512590 },
  { month: "T11", revenue: 312000000, bookings: 598, avgPrice: 521739 },
  { month: "T12", revenue: 345000000, bookings: 652, avgPrice: 529141 },
]

const userGrowthData = [
  { month: "T1", guests: 1250, hosts: 245, total: 1495 },
  { month: "T2", guests: 1420, hosts: 278, total: 1698 },
  { month: "T3", guests: 1580, hosts: 312, total: 1892 },
  { month: "T4", guests: 1780, hosts: 356, total: 2136 },
  { month: "T5", guests: 1950, hosts: 389, total: 2339 },
  { month: "T6", guests: 2150, hosts: 425, total: 2575 },
  { month: "T7", guests: 2450, hosts: 478, total: 2928 },
  { month: "T8", guests: 2680, hosts: 521, total: 3201 },
  { month: "T9", guests: 2520, hosts: 495, total: 3015 },
  { month: "T10", guests: 2850, hosts: 556, total: 3406 },
  { month: "T11", guests: 3120, hosts: 598, total: 3718 },
  { month: "T12", guests: 3450, hosts: 652, total: 4102 },
]

const bookingStatusData = [
  { name: "Hoàn thành", value: 5245, color: "#10b981" },
  { name: "Đang diễn ra", value: 892, color: "#3b82f6" },
  { name: "Sắp tới", value: 1234, color: "#f59e0b" },
  { name: "Đã hủy", value: 456, color: "#ef4444" },
]

const topLocationsData = [
  { location: "Đà Lạt", bookings: 1245, revenue: 45000000 },
  { location: "Nha Trang", bookings: 1123, revenue: 52000000 },
  { location: "Hội An", bookings: 987, revenue: 38000000 },
  { location: "Phú Quốc", bookings: 856, revenue: 62000000 },
  { location: "Sapa", bookings: 745, revenue: 28000000 },
]

export function AdminAnalytics() {
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(2024, 0, 1),
    to: new Date(2024, 11, 31)
  })
  const [activeChart, setActiveChart] = useState("revenue")

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value)
  }

  const handleExportCSV = () => {
    // CSV export logic
    alert("Đang xuất báo cáo CSV...")
  }

  const handleExportPDF = () => {
    // PDF export logic
    alert("Đang xuất báo cáo PDF...")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Analytics & Reporting</h2>
          <p className="text-muted-foreground mt-1">
            Phân tích chi tiết và báo cáo doanh thu nền tảng
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Date Range Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                {dateRange.from && dateRange.to ? (
                  <>
                    {format(dateRange.from, "dd/MM/yyyy", { locale: vi })} - {format(dateRange.to, "dd/MM/yyyy", { locale: vi })}
                  </>
                ) : (
                  "Chọn khoảng thời gian"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          {/* Export Buttons */}
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button variant="outline" onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              Tổng doanh thu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₫2.72 tỷ</div>
            <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
              <ArrowUp className="h-3 w-3" />
              <span>+18.2% so với năm trước</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Home className="h-4 w-4 text-blue-600" />
              Tổng bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7,827</div>
            <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
              <ArrowUp className="h-3 w-3" />
              <span>+15.3% so với năm trước</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              Người dùng mới
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4,102</div>
            <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
              <ArrowUp className="h-3 w-3" />
              <span>+22.5% so với năm trước</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-orange-600" />
              Giá trung bình
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₫512k</div>
            <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
              <ArrowUp className="h-3 w-3" />
              <span>+3.7% so với năm trước</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue" className="gap-2">
            <LineChartIcon className="h-4 w-4" />
            Doanh thu
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Người dùng
          </TabsTrigger>
          <TabsTrigger value="bookings" className="gap-2">
            <PieChartIcon className="h-4 w-4" />
            Bookings
          </TabsTrigger>
          <TabsTrigger value="locations" className="gap-2">
            <Home className="h-4 w-4" />
            Địa điểm
          </TabsTrigger>
        </TabsList>

        {/* Revenue Chart */}
        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Biểu đồ doanh thu theo tháng</CardTitle>
              <CardDescription>Doanh thu và số lượng bookings qua 12 tháng</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" tickFormatter={(value) => formatCurrency(value)} />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    formatter={(value: any, name: string) => {
                      if (name === "Doanh thu") return formatCurrency(value)
                      return value
                    }}
                  />
                  <Legend />
                  <Area 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3b82f6" 
                    fillOpacity={1} 
                    fill="url(#colorRevenue)"
                    name="Doanh thu"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="bookings" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    name="Số bookings"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Monthly Comparison */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Tháng cao nhất</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Tháng 12</div>
                <p className="text-xs text-muted-foreground">₫345M • 652 bookings</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Tăng trưởng MoM</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">+10.6%</div>
                <p className="text-xs text-muted-foreground">So với tháng 11</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Tăng trưởng YoY</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">+18.2%</div>
                <p className="text-xs text-muted-foreground">So với năm 2023</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* User Growth Chart */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tăng trưởng người dùng</CardTitle>
              <CardDescription>Phân bố guests và hosts theo tháng</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="guests" fill="#3b82f6" name="Guests" />
                  <Bar dataKey="hosts" fill="#f59e0b" name="Hosts" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Booking Status */}
        <TabsContent value="bookings" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Trạng thái bookings</CardTitle>
                <CardDescription>Phân bố theo trạng thái</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={bookingStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry: any) => `${entry.name}: ${((entry.percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {bookingStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Chi tiết số liệu</CardTitle>
                <CardDescription>Tổng quan theo trạng thái</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {bookingStatusData.map((status) => (
                  <div key={status.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: status.color }}
                      />
                      <span className="text-sm">{status.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{status.value.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">
                        {((status.value / bookingStatusData.reduce((sum, s) => sum + s.value, 0)) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Top Locations */}
        <TabsContent value="locations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top địa điểm phổ biến</CardTitle>
              <CardDescription>5 địa điểm có số lượng bookings cao nhất</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topLocationsData.map((location, index) => (
                  <div key={location.location} className="flex items-center gap-4">
                    <Badge className="w-8 h-8 rounded-full flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{location.location}</span>
                        <span className="text-sm text-muted-foreground">
                          {location.bookings} bookings
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 bg-muted rounded-full h-2 mr-4">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${(location.bookings / topLocationsData[0].bookings) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold">
                          {formatCurrency(location.revenue)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
