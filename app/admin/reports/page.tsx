'use client'

import { AdminLayout } from '@/components/admin-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Download, TrendingUp, TrendingDown } from 'lucide-react'

const revenueData = [
  { month: "T1", revenue: 450000000, bookings: 234, users: 1200 },
  { month: "T2", revenue: 520000000, bookings: 289, users: 1350 },
  { month: "T3", revenue: 480000000, bookings: 256, users: 1420 },
  { month: "T4", revenue: 610000000, bookings: 312, users: 1580 },
  { month: "T5", revenue: 550000000, bookings: 298, users: 1680 },
  { month: "T6", revenue: 670000000, bookings: 345, users: 1820 },
]

const categoryData = [
  { name: "Villa", value: 35 },
  { name: "Apartment", value: 30 },
  { name: "Resort", value: 20 },
  { name: "Homestay", value: 15 },
]

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

export default function AdminReportsPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Báo cáo & Thống kê</h1>
            <p className="text-muted-foreground mt-2">
              Phân tích chi tiết về hoạt động nền tảng
            </p>
          </div>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Xuất báo cáo
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Doanh thu tháng này</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">670 triệu đ</div>
              <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" />
                +21.8% so với tháng trước
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Đặt phòng</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">345</div>
              <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" />
                +15.8% so với tháng trước
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Người dùng mới</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">140</div>
              <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" />
                +8.3% so với tháng trước
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Tỷ lệ hoàn thành</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">94%</div>
              <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                <TrendingDown className="h-3 w-3" />
                -2.1% so với tháng trước
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="revenue" className="space-y-4">
          <TabsList>
            <TabsTrigger value="revenue">Doanh thu</TabsTrigger>
            <TabsTrigger value="bookings">Đặt phòng</TabsTrigger>
            <TabsTrigger value="categories">Danh mục</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Doanh thu 6 tháng gần đây</CardTitle>
                <CardDescription>
                  Phân tích xu hướng doanh thu theo tháng
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} name="Doanh thu (VNĐ)" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Số lượng đặt phòng theo tháng</CardTitle>
                <CardDescription>
                  Theo dõi xu hướng đặt phòng
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="bookings" fill="#82ca9d" name="Số đặt phòng" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Phân bố theo danh mục</CardTitle>
                <CardDescription>
                  Tỷ lệ listings theo loại hình
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry: { name: string; percent?: number }) =>
                        `${entry.name} ${entry.percent ? (entry.percent * 100).toFixed(0) : 0}%`
                      }
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}
