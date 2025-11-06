"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { HostLayout } from "@/components/host-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bell, Mail, MessageSquare, Globe, Lock, CreditCard, User } from "lucide-react"
import { useSettings } from "@/hooks/use-settings"
import { useToast } from "@/hooks/use-toast"

export default function HostSettingsPage() {
  const { data: session } = useSession()
  const { settings, loading, saving, updateSettings } = useSettings()
  const { toast } = useToast()
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    bio: "",
  })

  useEffect(() => {
    if (session?.user) {
      setProfile({
        name: session.user.name || "",
        email: session.user.email || "",
        phone: (session.user as any).phone || "",
        bio: (session.user as any).bio || "",
      })
    }
  }, [session])

  const handleUpdateProfile = async () => {
    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      })

      if (!response.ok) {
        throw new Error("Failed to update profile")
      }

      toast({
        title: "Đã lưu",
        description: "Thông tin cá nhân đã được cập nhật",
      })
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật thông tin",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <HostLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin text-4xl">⏳</div>
        </div>
      </HostLayout>
    )
  }

  return (
    <HostLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Cài đặt</h1>
          <p className="text-muted-foreground mt-2">
            Quản lý thông tin tài khoản và tùy chỉnh chủ nhà
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              Hồ sơ
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Thông báo
            </TabsTrigger>
            <TabsTrigger value="hosting">
              <Globe className="h-4 w-4 mr-2" />
              Chủ nhà
            </TabsTrigger>
            <TabsTrigger value="security">
              <Lock className="h-4 w-4 mr-2" />
              Bảo mật
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin cá nhân</CardTitle>
                <CardDescription>
                  Cập nhật thông tin hồ sơ của bạn
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20 ring-4 ring-primary/10">
                    <AvatarImage src={session?.user?.image || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-pink-500 text-white text-2xl">
                      {session?.user?.name?.charAt(0).toUpperCase() || "H"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <Button variant="outline">Thay đổi ảnh</Button>
                    <p className="text-xs text-muted-foreground">
                      JPG, GIF hoặc PNG. Tối đa 2MB
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="name">Tên đầy đủ</Label>
                  <Input 
                    id="name" 
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input 
                    id="phone" 
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Giới thiệu</Label>
                  <Textarea 
                    id="bio" 
                    placeholder="Viết vài dòng về bạn..."
                    rows={4}
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  />
                </div>

                <Button onClick={handleUpdateProfile}>
                  Lưu thay đổi
                </Button>
                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="language">Ngôn ngữ</Label>
                  <Input id="language" defaultValue="Tiếng Việt, English" />
                </div>

                <Button>Lưu thay đổi</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Cài đặt thông báo</CardTitle>
                <CardDescription>
                  Chọn cách bạn muốn nhận thông báo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <Label>Email thông báo</Label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Nhận thông báo qua email về đặt phòng mới
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <Label>Tin nhắn</Label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Thông báo khi có tin nhắn mới từ khách
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-muted-foreground" />
                        <Label>Đánh giá mới</Label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Nhận thông báo khi có đánh giá mới
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <Label>Thanh toán</Label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Thông báo về thanh toán và doanh thu
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Khuyến mãi & Mẹo</Label>
                      <p className="text-sm text-muted-foreground">
                        Nhận tin về khuyến mãi và mẹo chủ nhà
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>

                <Button>Lưu cài đặt</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Bảo mật tài khoản</CardTitle>
                <CardDescription>
                  Quản lý mật khẩu và xác thực hai yếu tố
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
                    <Input id="currentPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Mật khẩu mới</Label>
                    <Input id="newPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
                    <Input id="confirmPassword" type="password" />
                  </div>
                </div>

                <Button>Đổi mật khẩu</Button>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Xác thực hai yếu tố (2FA)</Label>
                      <p className="text-sm text-muted-foreground">
                        Bảo vệ tài khoản với lớp bảo mật bổ sung
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin thanh toán</CardTitle>
                <CardDescription>
                  Quản lý phương thức nhận thanh toán
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Ngân hàng</Label>
                    <Input id="bankName" placeholder="Vietcombank" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">Số tài khoản</Label>
                    <Input id="accountNumber" placeholder="1234567890" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountName">Tên tài khoản</Label>
                    <Input id="accountName" placeholder="NGUYEN VAN A" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxId">Mã số thuế (Nếu có)</Label>
                    <Input id="taxId" placeholder="0123456789" />
                  </div>
                </div>

                <Button>Lưu thông tin</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </HostLayout>
  )
}
