'use client'

import { AdminLayout } from '@/components/admin-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Settings, Bell, Shield, Mail, DollarSign, Globe } from 'lucide-react'

export default function AdminSettingsPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Cài đặt hệ thống</h1>
          <p className="text-muted-foreground mt-2">
            Quản lý cấu hình và thiết lập nền tảng
          </p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general">
              <Settings className="h-4 w-4 mr-2" />
              Chung
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Thông báo
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="h-4 w-4 mr-2" />
              Bảo mật
            </TabsTrigger>
            <TabsTrigger value="payments">
              <DollarSign className="h-4 w-4 mr-2" />
              Thanh toán
            </TabsTrigger>
            <TabsTrigger value="email">
              <Mail className="h-4 w-4 mr-2" />
              Email
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin nền tảng</CardTitle>
                <CardDescription>
                  Cập nhật thông tin cơ bản về LuxeStay
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Tên nền tảng</Label>
                  <Input id="siteName" defaultValue="LuxeStay" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteDescription">Mô tả</Label>
                  <Textarea 
                    id="siteDescription" 
                    rows={3}
                    defaultValue="Nền tảng đặt chỗ nghỉ cao cấp hàng đầu Việt Nam"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Email hỗ trợ</Label>
                  <Input id="supportEmail" type="email" defaultValue="support@luxestay.vn" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportPhone">Hotline</Label>
                  <Input id="supportPhone" defaultValue="1900 1234" />
                </div>
                <Button>Lưu thay đổi</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tính năng nền tảng</CardTitle>
                <CardDescription>
                  Bật/tắt các tính năng chính
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Đăng ký mới</Label>
                    <p className="text-sm text-muted-foreground">
                      Cho phép người dùng mới đăng ký
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Đặt phòng tức thì</Label>
                    <p className="text-sm text-muted-foreground">
                      Cho phép đặt phòng không cần phê duyệt
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>AI Smart Pricing</Label>
                    <p className="text-sm text-muted-foreground">
                      Tự động điều chỉnh giá dựa trên AI
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Chế độ bảo trì</Label>
                    <p className="text-sm text-muted-foreground">
                      Tạm dừng toàn bộ hoạt động nền tảng
                    </p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Cài đặt thông báo</CardTitle>
                <CardDescription>
                  Quản lý thông báo cho admin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Đặt phòng mới</Label>
                    <p className="text-sm text-muted-foreground">
                      Nhận thông báo khi có đặt phòng mới
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Người dùng mới</Label>
                    <p className="text-sm text-muted-foreground">
                      Nhận thông báo khi có người dùng đăng ký
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Báo cáo vi phạm</Label>
                    <p className="text-sm text-muted-foreground">
                      Nhận thông báo khi có báo cáo vi phạm
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Giao dịch lớn</Label>
                    <p className="text-sm text-muted-foreground">
                      Nhận thông báo giao dịch trên 50 triệu
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Báo cáo hàng ngày</Label>
                    <p className="text-sm text-muted-foreground">
                      Nhận báo cáo tổng quan qua email
                    </p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Bảo mật nền tảng</CardTitle>
                <CardDescription>
                  Cấu hình các thiết lập bảo mật
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Xác thực 2 yếu tố (2FA)</Label>
                    <p className="text-sm text-muted-foreground">
                      Bắt buộc 2FA cho tài khoản admin
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Giới hạn đăng nhập</Label>
                    <p className="text-sm text-muted-foreground">
                      Khóa tài khoản sau 5 lần đăng nhập sai
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Kiểm duyệt listing</Label>
                    <p className="text-sm text-muted-foreground">
                      Yêu cầu admin duyệt listing mới
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Kiểm duyệt đánh giá</Label>
                    <p className="text-sm text-muted-foreground">
                      Yêu cầu admin duyệt đánh giá trước khi hiển thị
                    </p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Settings */}
          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Cấu hình thanh toán</CardTitle>
                <CardDescription>
                  Thiết lập phương thức và phí thanh toán
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Phí dịch vụ cho khách (%)</Label>
                  <Input type="number" defaultValue="5" min="0" max="20" />
                  <p className="text-xs text-muted-foreground">Phí tính trên tổng giá đặt phòng</p>
                </div>
                <div className="space-y-2">
                  <Label>Phí dịch vụ cho host (%)</Label>
                  <Input type="number" defaultValue="10" min="0" max="20" />
                  <p className="text-xs text-muted-foreground">Phí tính trên doanh thu host</p>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Thanh toán bằng thẻ</Label>
                    <p className="text-sm text-muted-foreground">Visa, Mastercard, JCB</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Ví điện tử MoMo</Label>
                    <p className="text-sm text-muted-foreground">Thanh toán qua MoMo</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Ví điện tử ZaloPay</Label>
                    <p className="text-sm text-muted-foreground">Thanh toán qua ZaloPay</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Button>Lưu cài đặt</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Settings */}
          <TabsContent value="email" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Cấu hình Email</CardTitle>
                <CardDescription>
                  Thiết lập SMTP và email templates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>SMTP Host</Label>
                  <Input defaultValue="smtp.gmail.com" />
                </div>
                <div className="space-y-2">
                  <Label>SMTP Port</Label>
                  <Input type="number" defaultValue="587" />
                </div>
                <div className="space-y-2">
                  <Label>SMTP Username</Label>
                  <Input type="email" defaultValue="noreply@luxestay.vn" />
                </div>
                <div className="space-y-2">
                  <Label>SMTP Password</Label>
                  <Input type="password" defaultValue="••••••••" />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email xác nhận đặt phòng</Label>
                    <p className="text-sm text-muted-foreground">
                      Gửi email khi đặt phòng thành công
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email nhắc nhở check-in</Label>
                    <p className="text-sm text-muted-foreground">
                      Gửi trước 1 ngày check-in
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Button>Lưu cấu hình</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}
