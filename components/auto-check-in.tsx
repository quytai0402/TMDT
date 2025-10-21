"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { KeyRound, MapPin, Wifi, Car, Phone, Home, Clock, Info, Copy, Eye, Edit2, Save } from "lucide-react"

interface CheckInInfo {
  arrivalTime: string
  address: string
  gpsCoordinates: string
  parkingInstructions: string
  accessMethod: "key" | "code" | "lockbox" | "host_greeting"
  doorCode?: string
  lockboxLocation?: string
  lockboxCode?: string
  hostPhone: string
  wifiName: string
  wifiPassword: string
  roomNumber?: string
  specialInstructions: string
}

export function AutoCheckIn() {
  const [checkInInfo, setCheckInInfo] = useState<CheckInInfo>({
    arrivalTime: "14:00",
    address: "123 Đường Trần Phú, Phường 5, Quận 1, TP.HCM",
    gpsCoordinates: "10.7769, 106.7009",
    parkingInstructions: "Đỗ xe trong sân, bên trái cửa chính. Có 2 chỗ đỗ xe hơi và không giới hạn xe máy.",
    accessMethod: "code",
    doorCode: "1234#",
    hostPhone: "0901 234 567",
    wifiName: "Villa_Guest_2024",
    wifiPassword: "Welcome@2024",
    roomNumber: "301",
    specialInstructions: "Vui lòng gọi điện trước 30 phút nếu đến sớm hoặc muộn. Khóa cửa khi ra ngoài."
  })

  const [autoSendEnabled, setAutoSendEnabled] = useState(true)
  const [sendTiming, setSendTiming] = useState("2h_before")

  const handleCopyInstructions = () => {
    const instructions = generateInstructions()
    navigator.clipboard.writeText(instructions)
  }

  const generateInstructions = () => {
    return `🏠 HƯỚNG DẪN CHECK-IN TỰ ĐỘNG

📍 ĐỊA CHỈ:
${checkInInfo.address}
GPS: ${checkInInfo.gpsCoordinates}
🔗 Google Maps: https://maps.google.com/?q=${checkInInfo.gpsCoordinates}

⏰ GIỜ CHECK-IN:
${checkInInfo.arrivalTime}

🅿️ ĐỖ XE:
${checkInInfo.parkingInstructions}

🔑 CÁCH VÀO NHÀ:
${checkInInfo.accessMethod === "code" ? `Mật khẩu cửa chính: ${checkInInfo.doorCode}` : 
  checkInInfo.accessMethod === "lockbox" ? `Hộp khóa tại: ${checkInInfo.lockboxLocation}\nMã số: ${checkInInfo.lockboxCode}` :
  checkInInfo.accessMethod === "key" ? "Nhận chìa khóa từ chủ nhà" :
  "Chủ nhà sẽ trực tiếp đón bạn"}
${checkInInfo.roomNumber ? `Phòng số: ${checkInInfo.roomNumber}` : ''}

📶 WIFI:
Tên mạng: ${checkInInfo.wifiName}
Mật khẩu: ${checkInInfo.wifiPassword}

📞 LIÊN HỆ KHẨN CẤP:
${checkInInfo.hostPhone}

💡 LƯU Ý:
${checkInInfo.specialInstructions}

Chúc bạn có kỳ nghỉ tuyệt vời! 🌟`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Hướng dẫn check-in tự động</h2>
        <p className="text-muted-foreground">Tạo và gửi hướng dẫn check-in tự động cho khách</p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Check-in thành công</CardTitle>
            <KeyRound className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98%</div>
            <p className="text-xs text-muted-foreground">Không cần hỗ trợ</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Thời gian tiết kiệm</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6h</div>
            <p className="text-xs text-muted-foreground">Mỗi tuần</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Đã gửi</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">127</div>
            <p className="text-xs text-muted-foreground">Hướng dẫn tháng này</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Đánh giá</CardTitle>
            <Info className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.9</div>
            <p className="text-xs text-muted-foreground">Độ rõ ràng</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="setup" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="setup">Thiết lập</TabsTrigger>
          <TabsTrigger value="preview">Xem trước</TabsTrigger>
          <TabsTrigger value="settings">Cài đặt</TabsTrigger>
        </TabsList>

        {/* Setup Tab */}
        <TabsContent value="setup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cơ bản</CardTitle>
              <CardDescription>Cung cấp thông tin check-in cho khách</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="arrival">
                    <Clock className="h-4 w-4 inline mr-2" />
                    Giờ check-in
                  </Label>
                  <Input
                    id="arrival"
                    type="time"
                    value={checkInInfo.arrivalTime}
                    onChange={(e) => setCheckInInfo({...checkInInfo, arrivalTime: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">
                    <Phone className="h-4 w-4 inline mr-2" />
                    Số điện thoại liên hệ
                  </Label>
                  <Input
                    id="phone"
                    value={checkInInfo.hostPhone}
                    onChange={(e) => setCheckInInfo({...checkInInfo, hostPhone: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">
                  <MapPin className="h-4 w-4 inline mr-2" />
                  Địa chỉ đầy đủ
                </Label>
                <Input
                  id="address"
                  value={checkInInfo.address}
                  onChange={(e) => setCheckInInfo({...checkInInfo, address: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gps">
                  Tọa độ GPS
                </Label>
                <Input
                  id="gps"
                  placeholder="10.7769, 106.7009"
                  value={checkInInfo.gpsCoordinates}
                  onChange={(e) => setCheckInInfo({...checkInInfo, gpsCoordinates: e.target.value})}
                />
                <p className="text-xs text-muted-foreground">
                  Tìm trên Google Maps → Click chuột phải → Sao chép tọa độ
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="parking">
                  <Car className="h-4 w-4 inline mr-2" />
                  Hướng dẫn đỗ xe
                </Label>
                <Textarea
                  id="parking"
                  rows={3}
                  value={checkInInfo.parkingInstructions}
                  onChange={(e) => setCheckInInfo({...checkInInfo, parkingInstructions: e.target.value})}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Phương thức vào nhà</CardTitle>
              <CardDescription>Chọn cách khách sẽ vào nhà</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>
                  <KeyRound className="h-4 w-4 inline mr-2" />
                  Loại khóa
                </Label>
                <Select 
                  value={checkInInfo.accessMethod}
                  onValueChange={(value: any) => setCheckInInfo({...checkInInfo, accessMethod: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="code">Khóa điện tử (mã số)</SelectItem>
                    <SelectItem value="lockbox">Hộp khóa (lockbox)</SelectItem>
                    <SelectItem value="key">Chìa khóa truyền thống</SelectItem>
                    <SelectItem value="host_greeting">Chủ nhà trực tiếp đón</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {checkInInfo.accessMethod === "code" && (
                <div className="space-y-2">
                  <Label htmlFor="doorCode">Mật khẩu cửa</Label>
                  <Input
                    id="doorCode"
                    value={checkInInfo.doorCode}
                    onChange={(e) => setCheckInInfo({...checkInInfo, doorCode: e.target.value})}
                    placeholder="1234#"
                  />
                  <p className="text-xs text-muted-foreground">
                    Đừng quên dấu # nếu khóa yêu cầu
                  </p>
                </div>
              )}

              {checkInInfo.accessMethod === "lockbox" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="lockboxLocation">Vị trí hộp khóa</Label>
                    <Input
                      id="lockboxLocation"
                      value={checkInInfo.lockboxLocation}
                      onChange={(e) => setCheckInInfo({...checkInInfo, lockboxLocation: e.target.value})}
                      placeholder="Bên cạnh cửa chính, phía trái"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lockboxCode">Mã số hộp khóa</Label>
                    <Input
                      id="lockboxCode"
                      value={checkInInfo.lockboxCode}
                      onChange={(e) => setCheckInInfo({...checkInInfo, lockboxCode: e.target.value})}
                      placeholder="5678"
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="roomNumber">Số phòng (nếu có)</Label>
                <Input
                  id="roomNumber"
                  value={checkInInfo.roomNumber}
                  onChange={(e) => setCheckInInfo({...checkInInfo, roomNumber: e.target.value})}
                  placeholder="301"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>WiFi</CardTitle>
              <CardDescription>Thông tin kết nối internet</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="wifiName">
                    <Wifi className="h-4 w-4 inline mr-2" />
                    Tên mạng WiFi
                  </Label>
                  <Input
                    id="wifiName"
                    value={checkInInfo.wifiName}
                    onChange={(e) => setCheckInInfo({...checkInInfo, wifiName: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wifiPassword">Mật khẩu WiFi</Label>
                  <Input
                    id="wifiPassword"
                    value={checkInInfo.wifiPassword}
                    onChange={(e) => setCheckInInfo({...checkInInfo, wifiPassword: e.target.value})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lưu ý đặc biệt</CardTitle>
              <CardDescription>Thông tin bổ sung cho khách</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                rows={4}
                value={checkInInfo.specialInstructions}
                onChange={(e) => setCheckInInfo({...checkInInfo, specialInstructions: e.target.value})}
                placeholder="VD: Vui lòng gọi điện trước 30 phút. Khóa cửa khi ra ngoài..."
              />
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => {}}>
              <Save className="h-4 w-4 mr-2" />
              Lưu thông tin
            </Button>
            <Button variant="outline" onClick={handleCopyInstructions}>
              <Copy className="h-4 w-4 mr-2" />
              Sao chép
            </Button>
          </div>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Xem trước hướng dẫn</CardTitle>
                  <CardDescription>Đây là những gì khách sẽ nhận được</CardDescription>
                </div>
                <Button variant="outline" onClick={handleCopyInstructions}>
                  <Copy className="h-4 w-4 mr-2" />
                  Sao chép
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-6 rounded-lg">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {generateInstructions()}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gửi tự động</CardTitle>
              <CardDescription>Cấu hình khi nào gửi hướng dẫn check-in</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Kích hoạt gửi tự động</Label>
                  <p className="text-sm text-muted-foreground">
                    Tự động gửi hướng dẫn check-in cho mọi đặt phòng
                  </p>
                </div>
                <Switch
                  checked={autoSendEnabled}
                  onCheckedChange={setAutoSendEnabled}
                />
              </div>

              {autoSendEnabled && (
                <div className="space-y-2">
                  <Label>Thời điểm gửi</Label>
                  <Select value={sendTiming} onValueChange={setSendTiming}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="booking">Ngay sau khi đặt phòng</SelectItem>
                      <SelectItem value="24h_before">24 giờ trước check-in</SelectItem>
                      <SelectItem value="2h_before">2 giờ trước check-in</SelectItem>
                      <SelectItem value="1h_before">1 giờ trước check-in</SelectItem>
                      <SelectItem value="checkin_time">Đúng giờ check-in</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Gửi qua SMS</Label>
                  <p className="text-sm text-muted-foreground">
                    Gửi thêm bản tin nhắn SMS (có phí)
                  </p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Gửi qua email</Label>
                  <p className="text-sm text-muted-foreground">
                    Gửi email có định dạng đẹp hơn
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Tạo QR code</Label>
                  <p className="text-sm text-muted-foreground">
                    Tạo mã QR chứa thông tin check-in
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Thông báo cho chủ nhà</CardTitle>
              <CardDescription>Nhận cập nhật về check-in</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Thông báo khi khách check-in</Label>
                  <p className="text-sm text-muted-foreground">
                    Nhận thông báo khi khách đến và sử dụng mã
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Thông báo khi hướng dẫn được đọc</Label>
                  <p className="text-sm text-muted-foreground">
                    Biết khi khách đã xem hướng dẫn check-in
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
