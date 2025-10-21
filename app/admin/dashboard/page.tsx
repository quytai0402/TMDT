"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users, Home, DollarSign, TrendingUp, AlertCircle, CheckCircle2,
  Clock, Shield, Star, MessageSquare, ArrowUp, AlertTriangle
} from "lucide-react"
import { UserManagement } from "@/components/admin-user-management"
import { ListingModeration } from "@/components/admin-listing-moderation"
import { DisputeResolution } from "@/components/admin-dispute-resolution"
import { AdminLayout } from "@/components/admin-layout"
import { useRouter } from "next/navigation"

export default function AdminDashboardPage() {
  const router = useRouter()
  
  return (
    <AdminLayout>
      <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            Admin Dashboard
            <Badge className="bg-gradient-to-r from-red-600 to-orange-600">
              <Shield className="h-3 w-3 mr-1" />
              Control Center
            </Badge>
          </h1>
          <p className="text-muted-foreground mt-2">
            Quản lý toàn bộ nền tảng và hoạt động
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-green-100 text-green-700 px-3 py-1">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2" />
            System Healthy
          </Badge>
          <Button variant="outline">
            <AlertCircle className="h-4 w-4 mr-2" />
            Alerts (3)
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tổng người dùng</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45,231</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <ArrowUp className="h-3 w-3 text-green-600" />
              <span className="text-green-600">+12.5%</span> so với tháng trước
            </p>
            <div className="mt-2 flex gap-2 text-xs">
              <Badge variant="outline">24.3k Guests</Badge>
              <Badge variant="outline">8.9k Hosts</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tổng listings</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12,847</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <ArrowUp className="h-3 w-3 text-green-600" />
              <span className="text-green-600">+8.2%</span> so với tháng trước
            </p>
            <div className="mt-2 flex gap-2 text-xs">
              <Badge variant="outline" className="bg-green-50">11.2k Active</Badge>
              <Badge variant="outline" className="bg-orange-50">1.6k Pending</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Doanh thu tháng này</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₫8.9B</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <ArrowUp className="h-3 w-3 text-green-600" />
              <span className="text-green-600">+15.3%</span> so với tháng trước
            </p>
            <div className="mt-2 flex gap-2 text-xs">
              <Badge variant="outline">Commission: ₫890M</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Bookings tháng này</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23,456</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <ArrowUp className="h-3 w-3 text-green-600" />
              <span className="text-green-600">+18.7%</span> so với tháng trước
            </p>
            <div className="mt-2 flex gap-2 text-xs">
              <Badge variant="outline" className="bg-blue-50">21.1k Completed</Badge>
              <Badge variant="outline" className="bg-yellow-50">2.3k Upcoming</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Verifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">Pending approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              Disputes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">87</div>
            <p className="text-xs text-muted-foreground">Need resolution</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-600" />
              Avg Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">4.87</div>
            <p className="text-xs text-muted-foreground">Platform-wide</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-600" />
              Support
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">234</div>
            <p className="text-xs text-muted-foreground">Open tickets</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-600" />
              Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">12m</div>
            <p className="text-xs text-muted-foreground">Average</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Hoạt động gần đây</CardTitle>
            <CardDescription>Các sự kiện quan trọng trong 24h qua</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
                <div className="flex-1">
                  <p className="text-sm font-medium">New Super Host achieved</p>
                  <p className="text-xs text-muted-foreground">Nguyễn Minh Anh đạt chuẩn Super Host</p>
                  <p className="text-xs text-muted-foreground">5 phút trước</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Listing published</p>
                  <p className="text-xs text-muted-foreground">Villa Đà Lạt đã được phê duyệt</p>
                  <p className="text-xs text-muted-foreground">12 phút trước</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-orange-500 mt-2" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Dispute opened</p>
                  <p className="text-xs text-muted-foreground">Khách #12345 khiếu nại về độ sạch sẽ</p>
                  <p className="text-xs text-muted-foreground">1 giờ trước</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500 mt-2" />
                <div className="flex-1">
                  <p className="text-sm font-medium">User banned</p>
                  <p className="text-xs text-muted-foreground">User #98765 vi phạm quy định 3 lần</p>
                  <p className="text-xs text-muted-foreground">2 giờ trước</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-purple-500 mt-2" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Payment processed</p>
                  <p className="text-xs text-muted-foreground">₫45.000.000 thanh toán thành công</p>
                  <p className="text-xs text-muted-foreground">3 giờ trước</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cảnh báo hệ thống</CardTitle>
            <CardDescription>Các vấn đề cần xử lý</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="text-sm font-medium text-red-900">High dispute rate</p>
                    <p className="text-xs text-red-700">Listing #8765 có 3 tranh chấp trong tuần</p>
                  </div>
                </div>
                <Button size="sm" variant="destructive">Xem</Button>
              </div>

                            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-sm font-medium text-orange-900">Pending verifications</p>
                    <p className="text-xs text-orange-700">234 listings đang chờ duyệt &gt;48h</p>
                  </div>
                </div>
                <Button size="sm" variant="outline">Xem</Button>
              </div>

              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium text-yellow-900">Support backlog</p>
                    <p className="text-xs text-yellow-700">45 tickets chưa phản hồi &gt;24h</p>
                  </div>
                </div>
                <Button size="sm" variant="outline">Xem</Button>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Traffic spike</p>
                    <p className="text-xs text-blue-700">Traffic tăng 45% so với hôm qua</p>
                  </div>
                </div>
                <Button size="sm" variant="outline">Chi tiết</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Management Tabs */}
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Người dùng
          </TabsTrigger>
          <TabsTrigger value="listings" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Listings
          </TabsTrigger>
          <TabsTrigger value="disputes" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Tranh chấp
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="listings">
          <ListingModeration />
        </TabsContent>

        <TabsContent value="disputes">
          <DisputeResolution />
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Thao tác nhanh</CardTitle>
          <CardDescription>Các chức năng thường dùng</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-5">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
              <Users className="h-5 w-5 mb-2" />
              <span className="font-semibold mb-1">Thêm admin</span>
              <span className="text-xs text-muted-foreground">Tạo tài khoản quản trị viên mới</span>
            </Button>

            <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
              <Shield className="h-5 w-5 mb-2" />
              <span className="font-semibold mb-1">Cài đặt bảo mật</span>
              <span className="text-xs text-muted-foreground">Quản lý quyền và bảo mật</span>
            </Button>

            <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
              <MessageSquare className="h-5 w-5 mb-2" />
              <span className="font-semibold mb-1">Gửi thông báo</span>
              <span className="text-xs text-muted-foreground">Thông báo toàn hệ thống</span>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-start"
              onClick={() => router.push('/admin/analytics')}
            >
              <TrendingUp className="h-5 w-5 mb-2" />
              <span className="font-semibold mb-1">Báo cáo chi tiết</span>
              <span className="text-xs text-muted-foreground">Xuất báo cáo phân tích</span>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-start"
              onClick={() => router.push('/admin/cms')}
            >
              <Home className="h-5 w-5 mb-2" />
              <span className="font-semibold mb-1">Quản lý nội dung</span>
              <span className="text-xs text-muted-foreground">CMS homepage & blog</span>
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>
    </AdminLayout>
  )
}
