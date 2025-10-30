'use client'

import { useEffect, useState } from 'react'
import { AdminLayout } from '@/components/admin-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Settings, Bell, Shield, Mail, DollarSign } from 'lucide-react'
import { toast } from 'sonner'

type GeneralSettings = {
  siteName: string
  siteDescription: string
  supportEmail: string
  supportPhone: string
  address?: string
}

type FeatureSettings = {
  allowRegistration: boolean
  instantBooking: boolean
  aiPricing: boolean
  maintenanceMode: boolean
}

type NotificationSettings = {
  booking: boolean
  newUser: boolean
  dispute: boolean
  payout: boolean
}

type EmailSettings = {
  fromName: string
  fromEmail: string
  replyToEmail: string
}

type PaymentGatewaySetting = {
  gateway: string
  isEnabled: boolean
  config: Record<string, string | number | boolean | null>
}

type SettingsResponse = {
  general: GeneralSettings
  features: FeatureSettings
  notifications: NotificationSettings
  email: EmailSettings
  paymentGateways: PaymentGatewaySetting[]
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SettingsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/admin/settings')
        if (!res.ok) throw new Error('Failed to fetch settings')
        const data: SettingsResponse = await res.json()
        setSettings(data)
      } catch (error) {
        console.error('Settings load error:', error)
        toast.error('Không thể tải cấu hình hệ thống')
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [])

  const saveSettings = async (payload: Partial<SettingsResponse>, key: string) => {
    try {
      setSaving(key)
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error('Failed to save settings')

      const data: SettingsResponse = await res.json()
      setSettings(data)
      toast.success('Đã lưu cấu hình')
    } catch (error) {
      console.error('Settings save error:', error)
      toast.error('Không thể lưu cấu hình, vui lòng thử lại')
    } finally {
      setSaving(null)
    }
  }

  const updateGeneral = (field: keyof GeneralSettings, value: string) => {
    setSettings((prev) =>
      prev
        ? {
            ...prev,
            general: {
              ...prev.general,
              [field]: value,
            },
          }
        : prev,
    )
  }

  const toggleFeature = (field: keyof FeatureSettings, value: boolean) => {
    setSettings((prev) =>
      prev
        ? {
            ...prev,
            features: {
              ...prev.features,
              [field]: value,
            },
          }
        : prev,
    )
  }

  const toggleNotification = (field: keyof NotificationSettings, value: boolean) => {
    setSettings((prev) =>
      prev
        ? {
            ...prev,
            notifications: {
              ...prev.notifications,
              [field]: value,
            },
          }
        : prev,
    )
  }

  const updateEmail = (field: keyof EmailSettings, value: string) => {
    setSettings((prev) =>
      prev
        ? {
            ...prev,
            email: {
              ...prev.email,
              [field]: value,
            },
          }
        : prev,
    )
  }

  const updateGateway = (gateway: string, field: string, value: string | boolean) => {
    setSettings((prev) =>
      prev
        ? {
            ...prev,
            paymentGateways: prev.paymentGateways.map((item) =>
              item.gateway === gateway
                ? {
                    ...item,
                    ...(field === 'isEnabled'
                      ? { isEnabled: Boolean(value) }
                      : {
                          config: {
                            ...item.config,
                            [field]: value,
                          },
                        }),
                  }
                : item,
            ),
          }
        : prev,
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Cài đặt hệ thống</h1>
          <p className="text-muted-foreground mt-2">Quản lý cấu hình chung, thông báo và cổng thanh toán</p>
        </div>

        {loading || !settings ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Đang tải cấu hình...
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList>
              <TabsTrigger value="general">
                <Settings className="h-4 w-4 mr-2" />
                Chung
              </TabsTrigger>
              <TabsTrigger value="features">
                <Shield className="h-4 w-4 mr-2" />
                Tính năng
              </TabsTrigger>
              <TabsTrigger value="notifications">
                <Bell className="h-4 w-4 mr-2" />
                Thông báo
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

            <TabsContent value="general" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin nền tảng</CardTitle>
                  <CardDescription>Cập nhật thông tin cơ bản hiển thị trên trang chủ và email</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="siteName">Tên nền tảng</Label>
                    <Input
                      id="siteName"
                      value={settings.general.siteName}
                      onChange={(event) => updateGeneral('siteName', event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="siteDescription">Mô tả</Label>
                    <Textarea
                      id="siteDescription"
                      rows={3}
                      value={settings.general.siteDescription}
                      onChange={(event) => updateGeneral('siteDescription', event.target.value)}
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="supportEmail">Email hỗ trợ</Label>
                      <Input
                        id="supportEmail"
                        type="email"
                        value={settings.general.supportEmail}
                        onChange={(event) => updateGeneral('supportEmail', event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="supportPhone">Hotline</Label>
                      <Input
                        id="supportPhone"
                        value={settings.general.supportPhone}
                        onChange={(event) => updateGeneral('supportPhone', event.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Địa chỉ văn phòng</Label>
                    <Input
                      id="address"
                      value={settings.general.address ?? ''}
                      onChange={(event) => updateGeneral('address', event.target.value)}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={() => saveSettings({ general: settings.general }, 'general')} disabled={saving === 'general'}>
                      {saving === 'general' ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="features" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tính năng nền tảng</CardTitle>
                  <CardDescription>Bật hoặc tắt nhanh các tính năng chính của hệ thống</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Cho phép đăng ký mới</p>
                      <p className="text-sm text-muted-foreground">Khách mới có thể tự tạo tài khoản.</p>
                    </div>
                    <Switch
                      checked={settings.features.allowRegistration}
                      onCheckedChange={(checked) => toggleFeature('allowRegistration', checked)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Đặt phòng tức thì</p>
                      <p className="text-sm text-muted-foreground">Khách không cần host phê duyệt thủ công.</p>
                    </div>
                    <Switch
                      checked={settings.features.instantBooking}
                      onCheckedChange={(checked) => toggleFeature('instantBooking', checked)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">AI Smart Pricing</p>
                      <p className="text-sm text-muted-foreground">Tự động gợi ý giá theo dữ liệu thị trường.</p>
                    </div>
                    <Switch
                      checked={settings.features.aiPricing}
                      onCheckedChange={(checked) => toggleFeature('aiPricing', checked)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Chế độ bảo trì</p>
                      <p className="text-sm text-muted-foreground">Ẩn tạm thời website đối với khách truy cập.</p>
                    </div>
                    <Switch
                      checked={settings.features.maintenanceMode}
                      onCheckedChange={(checked) => toggleFeature('maintenanceMode', checked)}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={() => saveSettings({ features: settings.features }, 'features')} disabled={saving === 'features'}>
                      {saving === 'features' ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Thông báo quản trị</CardTitle>
                  <CardDescription>Chọn các sự kiện gửi thông báo đến đội ngũ quản trị</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Đơn đặt phòng mới</p>
                      <p className="text-sm text-muted-foreground">Nhận thông báo khi có booking mới tạo.</p>
                    </div>
                    <Switch
                      checked={settings.notifications.booking}
                      onCheckedChange={(checked) => toggleNotification('booking', checked)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Người dùng mới</p>
                      <p className="text-sm text-muted-foreground">Thông báo khi có tài khoản mới đăng ký.</p>
                    </div>
                    <Switch
                      checked={settings.notifications.newUser}
                      onCheckedChange={(checked) => toggleNotification('newUser', checked)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Khiếu nại / tranh chấp</p>
                      <p className="text-sm text-muted-foreground">Thông báo ngay khi có dispute mới.</p>
                    </div>
                    <Switch
                      checked={settings.notifications.dispute}
                      onCheckedChange={(checked) => toggleNotification('dispute', checked)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Yêu cầu thanh toán</p>
                      <p className="text-sm text-muted-foreground">Thông báo khi host yêu cầu rút tiền.</p>
                    </div>
                    <Switch
                      checked={settings.notifications.payout}
                      onCheckedChange={(checked) => toggleNotification('payout', checked)}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={() => saveSettings({ notifications: settings.notifications }, 'notifications')} disabled={saving === 'notifications'}>
                      {saving === 'notifications' ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payments" className="space-y-6">
              {settings.paymentGateways.map((gateway) => (
                <Card key={gateway.gateway}>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>{gateway.gateway}</CardTitle>
                      <CardDescription>
                        {gateway.gateway === 'VNPAY'
                          ? 'Cấu hình VNPay (QR / website)'
                          : gateway.gateway === 'PAYPAL'
                          ? 'Cổng thanh toán PayPal'
                          : 'Cấu hình VietQR'}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Kích hoạt</span>
                      <Switch
                        checked={gateway.isEnabled}
                        onCheckedChange={(checked) => updateGateway(gateway.gateway, 'isEnabled', checked)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(gateway.config).map(([key, value]) => (
                      <div key={key} className="space-y-2">
                        <Label className="uppercase text-xs text-muted-foreground">{key}</Label>
                        <Input
                          value={value?.toString() ?? ''}
                          onChange={(event) => updateGateway(gateway.gateway, key, event.target.value)}
                        />
                      </div>
                    ))}
                    {gateway.gateway === 'VIETQR' && (
                      <p className="text-xs text-muted-foreground">
                        QR mẫu: https://img.vietqr.io/image/{'{bankCode}'}-{'{accountNumber}'}-compact.png?amount=100000
                      </p>
                    )}
                    <div className="flex justify-end">
                      <Button onClick={() => saveSettings({ paymentGateways: settings.paymentGateways }, `gateway-${gateway.gateway}`)} disabled={saving === `gateway-${gateway.gateway}`}>
                        {saving === `gateway-${gateway.gateway}` ? 'Đang lưu...' : 'Lưu cổng thanh toán'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="email" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin email gửi đi</CardTitle>
                  <CardDescription>Thiết lập tên và địa chỉ gửi trong các email hệ thống</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>From name</Label>
                    <Input
                      value={settings.email.fromName}
                      onChange={(event) => updateEmail('fromName', event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>From email</Label>
                    <Input
                      type="email"
                      value={settings.email.fromEmail}
                      onChange={(event) => updateEmail('fromEmail', event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Reply-to email</Label>
                    <Input
                      type="email"
                      value={settings.email.replyToEmail}
                      onChange={(event) => updateEmail('replyToEmail', event.target.value)}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={() => saveSettings({ email: settings.email }, 'email')} disabled={saving === 'email'}>
                      {saving === 'email' ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AdminLayout>
  )
}
