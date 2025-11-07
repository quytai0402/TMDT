"use client"

import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Shield, Lock, AlertTriangle, UserX, CheckCircle2, Activity, Server } from "lucide-react"
import { useState } from "react"

export default function AdminSecurityPage() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true)
  const [loginRateLimit, setLoginRateLimit] = useState(true)
  const [ipWhitelist, setIpWhitelist] = useState(false)
  const [sessionTimeout, setSessionTimeout] = useState("30")

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Bảo mật hệ thống
          </h1>
          <p className="text-muted-foreground mt-2">
            Quản lý cài đặt bảo mật và giám sát hoạt động
          </p>
        </div>

        {/* Security Status */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Bảo mật
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Tốt</div>
              <p className="text-xs text-muted-foreground">Không có cảnh báo</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                Đăng nhập thất bại
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">23</div>
              <p className="text-xs text-muted-foreground">Trong 24h qua</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <UserX className="h-4 w-4 text-red-600" />
                IP bị chặn
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">Đang hoạt động</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-600" />
                Hoạt động đáng ngờ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">Cần xem xét</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="settings" className="space-y-6">
          <TabsList>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Cài đặt
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Hoạt động
            </TabsTrigger>
            <TabsTrigger value="blocked" className="flex items-center gap-2">
              <UserX className="h-4 w-4" />
              IP bị chặn
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              Logs
            </TabsTrigger>
          </TabsList>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Xác thực & Phiên làm việc</CardTitle>
                <CardDescription>Cấu hình bảo mật đăng nhập</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="2fa" className="text-base">Bắt buộc xác thực 2 yếu tố (2FA)</Label>
                    <p className="text-sm text-muted-foreground">
                      Yêu cầu tất cả admin phải bật 2FA
                    </p>
                  </div>
                  <Switch
                    id="2fa"
                    checked={twoFactorEnabled}
                    onCheckedChange={setTwoFactorEnabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="rate-limit" className="text-base">Giới hạn đăng nhập</Label>
                    <p className="text-sm text-muted-foreground">
                      Chặn IP sau 5 lần đăng nhập thất bại
                    </p>
                  </div>
                  <Switch
                    id="rate-limit"
                    checked={loginRateLimit}
                    onCheckedChange={setLoginRateLimit}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="whitelist" className="text-base">IP Whitelist</Label>
                    <p className="text-sm text-muted-foreground">
                      Chỉ cho phép đăng nhập từ IP được phê duyệt
                    </p>
                  </div>
                  <Switch
                    id="whitelist"
                    checked={ipWhitelist}
                    onCheckedChange={setIpWhitelist}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="session-timeout">Thời gian hết phiên (phút)</Label>
                  <Select value={sessionTimeout} onValueChange={setSessionTimeout}>
                    <SelectTrigger id="session-timeout">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 phút</SelectItem>
                      <SelectItem value="30">30 phút</SelectItem>
                      <SelectItem value="60">60 phút</SelectItem>
                      <SelectItem value="120">120 phút</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button>Lưu cài đặt</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mật khẩu & Mã hóa</CardTitle>
                <CardDescription>Chính sách bảo mật mật khẩu</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label>Độ dài tối thiểu</Label>
                    <Input type="number" defaultValue="8" min="6" max="20" />
                  </div>
                  <div className="space-y-2">
                    <Label>Yêu cầu</Label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Chữ hoa</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Chữ thường</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Số</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Ký tự đặc biệt</span>
                      </div>
                    </div>
                  </div>
                </div>
                <Button>Cập nhật chính sách</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Hoạt động gần đây</CardTitle>
                <CardDescription>Hoạt động đăng nhập và thay đổi quan trọng</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Thời gian</TableHead>
                      <TableHead>Người dùng</TableHead>
                      <TableHead>Hành động</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-mono text-sm">2025-11-07 14:23:15</TableCell>
                      <TableCell>admin@gmail.com</TableCell>
                      <TableCell>Đăng nhập</TableCell>
                      <TableCell className="font-mono text-sm">192.168.1.1</TableCell>
                      <TableCell>
                        <Badge className="bg-green-600">Thành công</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono text-sm">2025-11-07 14:15:42</TableCell>
                      <TableCell>user@example.com</TableCell>
                      <TableCell>Đăng nhập thất bại</TableCell>
                      <TableCell className="font-mono text-sm">103.56.158.90</TableCell>
                      <TableCell>
                        <Badge variant="destructive">Thất bại</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono text-sm">2025-11-07 13:45:12</TableCell>
                      <TableCell>host@gmail.com</TableCell>
                      <TableCell>Thay đổi mật khẩu</TableCell>
                      <TableCell className="font-mono text-sm">14.232.150.45</TableCell>
                      <TableCell>
                        <Badge className="bg-green-600">Thành công</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono text-sm">2025-11-07 12:30:08</TableCell>
                      <TableCell>unknown</TableCell>
                      <TableCell>Brute force attempt</TableCell>
                      <TableCell className="font-mono text-sm">185.220.101.3</TableCell>
                      <TableCell>
                        <Badge variant="destructive">Đã chặn</Badge>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Blocked IPs Tab */}
          <TabsContent value="blocked">
            <Card>
              <CardHeader>
                <CardTitle>IP bị chặn</CardTitle>
                <CardDescription>Danh sách IP đang bị cấm truy cập</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input placeholder="Nhập IP để chặn (VD: 192.168.1.1)" />
                    <Button>Chặn IP</Button>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Lý do</TableHead>
                        <TableHead>Thời gian chặn</TableHead>
                        <TableHead>Hết hạn</TableHead>
                        <TableHead className="text-right">Hành động</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-mono">185.220.101.3</TableCell>
                        <TableCell>Brute force attack</TableCell>
                        <TableCell>2025-11-07 12:30</TableCell>
                        <TableCell>Vĩnh viễn</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">Bỏ chặn</Button>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono">103.56.158.90</TableCell>
                        <TableCell>Nhiều lần đăng nhập thất bại</TableCell>
                        <TableCell>2025-11-07 14:15</TableCell>
                        <TableCell>24 giờ</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">Bỏ chặn</Button>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>System Logs</CardTitle>
                <CardDescription>Chi tiết logs hệ thống</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 font-mono text-xs bg-black text-green-400 p-4 rounded-lg h-96 overflow-auto">
                  <div>[2025-11-07 14:23:15] INFO: User login successful - admin@gmail.com (192.168.1.1)</div>
                  <div>[2025-11-07 14:15:42] WARN: Failed login attempt - user@example.com (103.56.158.90)</div>
                  <div>[2025-11-07 14:15:45] WARN: Failed login attempt - user@example.com (103.56.158.90)</div>
                  <div>[2025-11-07 14:15:48] ERROR: IP blocked due to rate limit - 103.56.158.90</div>
                  <div>[2025-11-07 13:45:12] INFO: Password changed - host@gmail.com</div>
                  <div>[2025-11-07 12:30:08] CRITICAL: Brute force attack detected - 185.220.101.3</div>
                  <div>[2025-11-07 12:30:10] INFO: IP permanently blocked - 185.220.101.3</div>
                  <div>[2025-11-07 10:15:33] INFO: Database backup completed successfully</div>
                  <div>[2025-11-07 09:00:00] INFO: Daily security scan completed - No threats detected</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}
