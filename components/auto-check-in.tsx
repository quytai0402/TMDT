"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { KeyRound, MapPin, Wifi, Phone, Clock, Copy, Save, Eye } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Loader2 } from "lucide-react"

type HostListing = {
  id: string
  title: string
  address: string
  city: string
  state?: string | null
  country: string
  latitude?: number | null
  longitude?: number | null
  checkInTime?: string | null
  checkOutTime?: string | null
  wifiName?: string | null
  wifiPassword?: string | null
  smartLockCode?: string | null
  hasSmartLock?: boolean | null
  checkInInstructions?: string | null
}

type HostBooking = {
  id: string
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "DECLINED" | "EXPIRED"
  checkIn: string
  checkOut: string
}

function composeAddress(listing?: HostListing) {
  if (!listing) return ""
  const chunks = [listing.address, listing.city, listing.state, listing.country].filter(Boolean)
  return chunks.join(", ")
}

function formatCoordinates(listing?: HostListing) {
  if (!listing?.latitude || !listing?.longitude) return ""
  return `${listing.latitude.toFixed(5)}, ${listing.longitude.toFixed(5)}`
}

export function AutoCheckIn() {
  const { data: session } = useSession()
  const [listings, setListings] = useState<HostListing[]>([])
  const [selectedListingId, setSelectedListingId] = useState<string>("")
  const [bookings, setBookings] = useState<HostBooking[]>([])
  const [instructions, setInstructions] = useState("")
  const [wifiName, setWifiName] = useState("")
  const [wifiPassword, setWifiPassword] = useState("")
  const [smartLockCode, setSmartLockCode] = useState("")
  const [hasSmartLock, setHasSmartLock] = useState(false)
  const [autoSendEnabled, setAutoSendEnabled] = useState(true)
  const [sendTiming, setSendTiming] = useState("2h_before")
  const [isLoading, setIsLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedListing = listings.find((listing) => listing.id === selectedListingId)
  const address = composeAddress(selectedListing)
  const gpsCoordinates = formatCoordinates(selectedListing)

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const [listingRes, bookingRes] = await Promise.all([
        fetch("/api/listings?hostId=me", { cache: "no-store" }),
        fetch("/api/bookings?type=host&limit=200", { cache: "no-store" }),
      ])

      if (!listingRes.ok) {
        throw new Error("Không thể tải danh sách căn hộ")
      }
      if (!bookingRes.ok) {
        throw new Error("Không thể tải danh sách đặt phòng")
      }

      const listingData = await listingRes.json()
      const bookingData = await bookingRes.json()
      const parsedListings = Array.isArray(listingData?.listings) ? (listingData.listings as HostListing[]) : []
      const parsedBookings = Array.isArray(bookingData?.bookings) ? (bookingData.bookings as HostBooking[]) : []

      setListings(parsedListings)
      setBookings(parsedBookings)
    } catch (err) {
      console.error(err)
      setError((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (!selectedListingId && listings.length) {
      setSelectedListingId(listings[0].id)
    }
  }, [listings, selectedListingId])

  useEffect(() => {
    if (!selectedListing) return
    setInstructions(selectedListing.checkInInstructions ?? "")
    setWifiName(selectedListing.wifiName ?? "")
    setWifiPassword(selectedListing.wifiPassword ?? "")
    setSmartLockCode(selectedListing.smartLockCode ?? "")
    setHasSmartLock(Boolean(selectedListing.hasSmartLock))
  }, [selectedListing])

  const successRate = useMemo(() => {
    if (!bookings.length) return 0
    const successful = bookings.filter((booking) => booking.status === "COMPLETED").length
    return Math.round((successful / bookings.length) * 100)
  }, [bookings])

  const upcomingCheckIns = useMemo(() => {
    const now = Date.now()
    const nextWeek = now + 7 * 24 * 60 * 60 * 1000
    return bookings.filter((booking) => {
      const checkInTime = new Date(booking.checkIn).getTime()
      return checkInTime >= now && checkInTime <= nextWeek && booking.status !== "CANCELLED"
    }).length
  }, [bookings])

  const monthlySends = useMemo(() => {
    const now = new Date()
    const month = now.getMonth()
    const year = now.getFullYear()
    return bookings.filter((booking) => {
      const checkInDate = new Date(booking.checkIn)
      return (
        checkInDate.getMonth() === month &&
        checkInDate.getFullYear() === year &&
        booking.status !== "CANCELLED"
      )
    }).length
  }, [bookings])

  const composedInstructions = useMemo(() => {
    const checkInTime = selectedListing?.checkInTime || "14:00"
    const checkOutTime = selectedListing?.checkOutTime || "11:00"
    const hostPhone = session?.user?.phone || "(cập nhật số điện thoại)"
    const instructionsBody = instructions || "Chưa có hướng dẫn chi tiết. Vui lòng bổ sung."

    return `🏠 HƯỚNG DẪN CHECK-IN - ${selectedListing?.title ?? "Homestay"}

📍 ĐỊA CHỈ
${address || "Chưa cập nhật"}
${gpsCoordinates ? `GPS: ${gpsCoordinates}` : ""}

⏰ THỜI GIAN
Check-in: ${checkInTime}
Check-out: ${checkOutTime}

🔑 TRUY CẬP
${hasSmartLock ? `Khóa mã: ${smartLockCode || "(chưa nhập)"}` : "Liên hệ host khi đến nơi"}

📶 WIFI
Tên mạng: ${wifiName || "(chưa nhập)"}
Mật khẩu: ${wifiPassword || "(chưa nhập)"}

📞 LIÊN HỆ
${hostPhone}

💡 LƯU Ý
${instructionsBody}`
  }, [address, gpsCoordinates, hasSmartLock, instructions, selectedListing, session?.user?.phone, smartLockCode, wifiName, wifiPassword])

  const handleSave = useCallback(async () => {
    if (!selectedListing) {
      toast.error("Không tìm thấy căn hộ để lưu")
      return
    }

    try {
      setSaving(true)
      const response = await fetch(`/api/listings/${selectedListing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkInInstructions: instructions,
          wifiName: wifiName || null,
          wifiPassword: wifiPassword || null,
          smartLockCode: smartLockCode || null,
          hasSmartLock,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Không thể lưu hướng dẫn")
      }

      const data = await response.json()
      if (data?.listing) {
        setListings((prev) => prev.map((listing) => (listing.id === data.listing.id ? data.listing : listing)))
      }

      toast.success("Đã lưu hướng dẫn check-in")
    } catch (err) {
      console.error(err)
      toast.error((err as Error).message)
    } finally {
      setSaving(false)
    }
  }, [hasSmartLock, instructions, selectedListing, smartLockCode, wifiName, wifiPassword])

  const handleCopy = () => {
    navigator.clipboard.writeText(composedInstructions)
    toast.success("Đã sao chép hướng dẫn")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Hướng dẫn check-in tự động</h2>
          <p className="text-muted-foreground">Tạo và lưu hướng dẫn check-in thực tế cho từng căn hộ</p>
        </div>
        <div className="w-full md:w-auto">
          <Label className="text-xs text-muted-foreground">Chọn căn hộ</Label>
          <Select value={selectedListingId} onValueChange={setSelectedListingId}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Chọn căn hộ" />
            </SelectTrigger>
            <SelectContent>
              {listings.map((listing) => (
                <SelectItem key={listing.id} value={listing.id}>
                  {listing.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Check-in thành công</CardTitle>
            <KeyRound className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
            <p className="text-xs text-muted-foreground">Tỷ lệ hoàn tất</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Check-in sắp tới</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingCheckIns}</div>
            <p className="text-xs text-muted-foreground">Trong 7 ngày tới</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Hướng dẫn tháng này</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthlySends}</div>
            <p className="text-xs text-muted-foreground">Đặt phòng nhận hướng dẫn</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Số căn hộ</CardTitle>
            <Badge variant="outline">{listings.length}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{listings.length || "—"}</div>
            <p className="text-xs text-muted-foreground">Đang cấu hình</p>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Card className="border-destructive/40 bg-destructive/10">
          <CardHeader>
            <CardTitle className="text-destructive">Không thể tải dữ liệu</CardTitle>
            <CardDescription className="text-destructive">{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={loadData}>
              Thử lại
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Tabs defaultValue="setup" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="setup">Thiết lập</TabsTrigger>
            <TabsTrigger value="preview">Xem trước</TabsTrigger>
            <TabsTrigger value="settings">Tự động hóa</TabsTrigger>
          </TabsList>

          <TabsContent value="setup" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin căn hộ</CardTitle>
                <CardDescription>Địa chỉ và thông tin liên hệ sẽ hiển thị trong hướng dẫn</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>
                    <MapPin className="mr-2 inline h-4 w-4" />
                    Địa chỉ
                  </Label>
                  <Input value={address} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Tọa độ GPS</Label>
                  <Input value={gpsCoordinates} readOnly placeholder="Chưa có GPS" />
                </div>
                <div className="space-y-2">
                  <Label>
                    <Phone className="mr-2 inline h-4 w-4" />
                    Điện thoại host
                  </Label>
                  <Input value={session?.user?.phone ?? ""} readOnly placeholder="Cập nhật trong hồ sơ của bạn" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Phương thức vào nhà</CardTitle>
                <CardDescription>Cập nhật trạng thái khóa và mã truy cập</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">Khóa thông minh</p>
                    <p className="text-sm text-muted-foreground">Kích hoạt nếu sử dụng khóa mã</p>
                  </div>
                  <Switch checked={hasSmartLock} onCheckedChange={setHasSmartLock} />
                </div>
                {hasSmartLock && (
                  <div className="space-y-2">
                    <Label>Mã khóa</Label>
                    <Input value={smartLockCode} onChange={(event) => setSmartLockCode(event.target.value)} placeholder="VD: 1234#" />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Thông tin WiFi</CardTitle>
                <CardDescription>Sẽ hiển thị trong hướng dẫn gửi cho khách</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>
                    <Wifi className="mr-2 inline h-4 w-4" />
                    Tên mạng
                  </Label>
                  <Input value={wifiName} onChange={(event) => setWifiName(event.target.value)} placeholder="VD: Villa_Guest" />
                </div>
                <div className="space-y-2">
                  <Label>Mật khẩu</Label>
                  <Input
                    type="text"
                    value={wifiPassword}
                    onChange={(event) => setWifiPassword(event.target.value)}
                    placeholder="VD: Welcome@2024"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lưu ý & hướng dẫn chi tiết</CardTitle>
                <CardDescription>
                  Thêm nội dung cụ thể: hướng dẫn đỗ xe, lưu ý tiếng ồn, nơi để rác...
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  rows={6}
                  placeholder="VD: Gõ cửa bên trái, gửi ảnh CCCD tại quầy bảo vệ..."
                  value={instructions}
                  onChange={(event) => setInstructions(event.target.value)}
                />
              </CardContent>
            </Card>

            <div className="flex flex-col gap-2 md:flex-row">
              <Button className="flex-1" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Lưu hướng dẫn
              </Button>
              <Button variant="outline" onClick={handleCopy}>
                <Copy className="mr-2 h-4 w-4" />
                Sao chép
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="preview">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Xem trước hướng dẫn</CardTitle>
                    <CardDescription>Đây là nội dung khách sẽ nhận được</CardDescription>
                  </div>
                  <Button variant="outline" onClick={handleCopy}>
                    <Copy className="mr-2 h-4 w-4" />
                    Sao chép
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-muted p-6">
                  <pre className="whitespace-pre-wrap text-sm leading-relaxed">{composedInstructions}</pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Gửi tự động</CardTitle>
                <CardDescription>Cấu hình khi nào gửi hướng dẫn cho khách</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">Kích hoạt gửi tự động</p>
                    <p className="text-sm text-muted-foreground">Gửi hướng dẫn cho mọi booking đã xác nhận</p>
                  </div>
                  <Switch checked={autoSendEnabled} onCheckedChange={setAutoSendEnabled} />
                </div>
                <div className="space-y-2">
                  <Label>Thời điểm gửi</Label>
                  <Select value={sendTiming} onValueChange={setSendTiming}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2h_before">2 giờ trước check-in</SelectItem>
                      <SelectItem value="24h_before">24 giờ trước check-in</SelectItem>
                      <SelectItem value="on_confirmed">Ngay khi booking được xác nhận</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-sm text-muted-foreground">
                  Tính năng gửi tự động sẽ dùng mẫu hướng dẫn hiện tại và đồng bộ cùng lịch tin nhắn trong phần Automation.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
