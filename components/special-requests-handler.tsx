"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Utensils,
  Wrench,
  ShoppingBag,
  Sparkles,
  HelpCircle,
  Clock,
  Check,
  AlertCircle,
  Send,
  Home,
  Calendar
} from "lucide-react"

interface Booking {
  id: string
  listingTitle: string
  location: string
  checkIn: string
  checkOut: string
  status: "upcoming" | "current" | "past"
}

interface Request {
  id: string
  bookingId: string
  category: "room-service" | "maintenance" | "shopping" | "special" | "other"
  title: string
  description: string
  status: "pending" | "in-progress" | "completed"
  time: string
  response?: string
}

interface QuickRequest {
  id: string
  category: "room-service" | "maintenance" | "shopping" | "special" | "other"
  title: string
  icon: any
}

export function SpecialRequestsHandler() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState("new")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<string>("")
  const [customRequest, setCustomRequest] = useState("")

  // Mock bookings data - in real app, this would come from API
  const userBookings: Booking[] = [
    {
      id: "BK001",
      listingTitle: "Villa view biển Nha Trang",
      location: "Nha Trang, Khánh Hòa",
      checkIn: "15/01/2025",
      checkOut: "18/01/2025",
      status: "current"
    },
    {
      id: "BK002",
      listingTitle: "Studio Đà Lạt cozy",
      location: "Đà Lạt, Lâm Đồng",
      checkIn: "20/01/2025",
      checkOut: "23/01/2025",
      status: "upcoming"
    },
    {
      id: "BK003",
      listingTitle: "Homestay Hội An phố cổ",
      location: "Hội An, Quảng Nam",
      checkIn: "05/01/2025",
      checkOut: "08/01/2025",
      status: "past"
    },
  ]

  const [requests, setRequests] = useState<Request[]>([
    {
      id: "1",
      bookingId: "BK001",
      category: "room-service",
      title: "Đặt thêm khăn tắm",
      description: "Cần 2 khăn tắm lớn",
      status: "completed",
      time: "2 giờ trước",
      response: "Đã giao 2 khăn tắm mới tại phòng"
    },
    {
      id: "2",
      bookingId: "BK001",
      category: "maintenance",
      title: "Kiểm tra điều hòa",
      description: "Điều hòa không mát",
      status: "in-progress",
      time: "30 phút trước",
      response: "Kỹ thuật viên đang trên đường đến"
    },
  ])

  const quickRequests: QuickRequest[] = [
    { id: "extra-towels", category: "room-service", title: "Khăn tắm thêm", icon: Sparkles },
    { id: "extra-pillows", category: "room-service", title: "Gối thêm", icon: Sparkles },
    { id: "extra-blanket", category: "room-service", title: "Chăn thêm", icon: Sparkles },
    { id: "room-cleaning", category: "room-service", title: "Dọn phòng", icon: Sparkles },
    { id: "check-ac", category: "maintenance", title: "Kiểm tra điều hòa", icon: Wrench },
    { id: "check-wifi", category: "maintenance", title: "Kiểm tra WiFi", icon: Wrench },
    { id: "check-light", category: "maintenance", title: "Sửa đèn", icon: Wrench },
    { id: "buy-water", category: "shopping", title: "Mua nước", icon: ShoppingBag },
    { id: "buy-snacks", category: "shopping", title: "Mua đồ ăn vặt", icon: ShoppingBag },
    { id: "early-checkin", category: "special", title: "Check-in sớm", icon: Clock },
    { id: "late-checkout", category: "special", title: "Check-out muộn", icon: Clock },
    { id: "birthday-setup", category: "special", title: "Trang trí sinh nhật", icon: Sparkles },
  ]

  const categories = [
    { id: "room-service", name: "Dịch vụ phòng", icon: Utensils },
    { id: "maintenance", name: "Bảo trì", icon: Wrench },
    { id: "shopping", name: "Mua sắm", icon: ShoppingBag },
    { id: "special", name: "Yêu cầu đặc biệt", icon: Sparkles },
    { id: "other", name: "Khác", icon: HelpCircle },
  ]

  const handleQuickRequest = (request: QuickRequest) => {
    if (!selectedBooking) {
      alert("Vui lòng chọn booking trước")
      return
    }

    const newRequest: Request = {
      id: Date.now().toString(),
      bookingId: selectedBooking,
      category: request.category,
      title: request.title,
      description: "",
      status: "pending",
      time: "Vừa xong",
    }
    setRequests([newRequest, ...requests])
    setActiveTab("my-requests")
  }

  const handleCustomRequest = () => {
    if (!selectedBooking) {
      alert("Vui lòng chọn booking trước")
      return
    }
    if (!selectedCategory || !customRequest.trim()) return

    const newRequest: Request = {
      id: Date.now().toString(),
      bookingId: selectedBooking,
      category: selectedCategory as any,
      title: customRequest,
      description: "",
      status: "pending",
      time: "Vừa xong",
    }
    setRequests([newRequest, ...requests])
    setCustomRequest("")
    setSelectedCategory(null)
    setActiveTab("my-requests")
  }

  const getStatusBadge = (status: Request["status"]) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" /> Đang xử lý</Badge>
      case "in-progress":
        return <Badge className="bg-blue-500"><AlertCircle className="w-3 h-3 mr-1" /> Đang thực hiện</Badge>
      case "completed":
        return <Badge className="bg-green-500"><Check className="w-3 h-3 mr-1" /> Hoàn thành</Badge>
    }
  }

  const getCategoryIcon = (category: Request["category"]) => {
    const cat = categories.find(c => c.id === category)
    if (!cat) return null
    const Icon = cat.icon
    return <Icon className="w-4 h-4" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Yêu cầu & hỗ trợ</h2>
        <p className="text-muted-foreground">
          Gửi yêu cầu của bạn, chúng tôi luôn sẵn sàng hỗ trợ 24/7
        </p>
      </div>

      {/* Booking Selector */}
      <Card className="p-6">
        <Label className="text-base font-semibold mb-3 block">Chọn phòng đã đặt</Label>
        <Select value={selectedBooking} onValueChange={setSelectedBooking}>
          <SelectTrigger>
            <SelectValue placeholder="Chọn booking để gửi yêu cầu" />
          </SelectTrigger>
          <SelectContent>
            {userBookings
              .filter(b => b.status === "current" || b.status === "upcoming")
              .map((booking) => (
                <SelectItem key={booking.id} value={booking.id}>
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    <div>
                      <p className="font-medium">{booking.listingTitle}</p>
                      <p className="text-xs text-muted-foreground">
                        {booking.location} • {booking.checkIn} - {booking.checkOut}
                      </p>
                    </div>
                  </div>
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        {selectedBooking && (
          <div className="mt-3 p-3 bg-muted rounded-lg">
            <div className="flex items-start gap-3">
              <Home className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">
                  {userBookings.find(b => b.id === selectedBooking)?.listingTitle}
                </p>
                <p className="text-sm text-muted-foreground">
                  {userBookings.find(b => b.id === selectedBooking)?.location}
                </p>
                <div className="flex items-center gap-2 mt-2 text-xs">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {userBookings.find(b => b.id === selectedBooking)?.checkIn} - {userBookings.find(b => b.id === selectedBooking)?.checkOut}
                  </span>
                  <Badge variant={userBookings.find(b => b.id === selectedBooking)?.status === "current" ? "default" : "secondary"} className="ml-2">
                    {userBookings.find(b => b.id === selectedBooking)?.status === "current" ? "Đang ở" : "Sắp tới"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="new">Tạo yêu cầu mới</TabsTrigger>
          <TabsTrigger value="my-requests">
            Yêu cầu của tôi
            {requests.filter(r => r.status !== "completed").length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                {requests.filter(r => r.status !== "completed").length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="space-y-6">
          {/* Quick Requests */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Yêu cầu nhanh</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {quickRequests.map(request => {
                const Icon = request.icon
                return (
                  <Button
                    key={request.id}
                    variant="outline"
                    className="h-auto py-4 flex-col space-y-2"
                    onClick={() => handleQuickRequest(request)}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm text-center">{request.title}</span>
                  </Button>
                )
              })}
            </div>
          </Card>

          {/* Custom Request */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Yêu cầu tùy chỉnh</h3>
            
            <div className="space-y-4">
              {/* Category Selection */}
              <div>
                <Label>Loại yêu cầu</Label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-2">
                  {categories.map(category => {
                    const Icon = category.icon
                    return (
                      <Button
                        key={category.id}
                        variant={selectedCategory === category.id ? "default" : "outline"}
                        className="h-auto py-3 flex-col space-y-1"
                        onClick={() => setSelectedCategory(category.id)}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-xs">{category.name}</span>
                      </Button>
                    )
                  })}
                </div>
              </div>

              {/* Request Details */}
              <div>
                <Label>Mô tả yêu cầu</Label>
                <Textarea
                  placeholder="Nhập chi tiết yêu cầu của bạn..."
                  value={customRequest}
                  onChange={(e) => setCustomRequest(e.target.value)}
                  className="mt-2"
                  rows={4}
                />
              </div>

              <Button 
                className="w-full" 
                size="lg"
                onClick={handleCustomRequest}
                disabled={!selectedCategory || !customRequest.trim()}
              >
                <Send className="w-4 h-4 mr-2" />
                Gửi yêu cầu
              </Button>
            </div>
          </Card>

          {/* Info Card */}
          <Card className="p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <HelpCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold mb-2">Cần hỗ trợ gấp?</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Liên hệ concierge 24/7 qua chat hoặc hotline để được hỗ trợ ngay lập tức
                </p>
                <div className="flex items-center space-x-3">
                  <Button variant="outline" size="sm">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Chat ngay
                  </Button>
                  <Button variant="outline" size="sm">
                    Gọi hotline
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="my-requests" className="space-y-4">
          {requests.length === 0 ? (
            <Card className="p-12 text-center">
              <HelpCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold mb-2">Chưa có yêu cầu nào</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Bạn chưa gửi yêu cầu nào. Hãy tạo yêu cầu mới để chúng tôi hỗ trợ bạn.
              </p>
              <Button onClick={() => setActiveTab("new")}>
                Tạo yêu cầu mới
              </Button>
            </Card>
          ) : (
            <>
              {requests.map(request => {
                const booking = userBookings.find(b => b.id === request.bookingId)
                return (
                  <Card key={request.id} className="p-6">
                    {/* Booking Info Header */}
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b">
                      <Home className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{booking?.listingTitle}</span>
                      <Badge variant="outline" className="text-xs">{booking?.id}</Badge>
                    </div>

                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          {getCategoryIcon(request.category)}
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">{request.title}</h3>
                          {request.description && (
                            <p className="text-sm text-muted-foreground">{request.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">{request.time}</p>
                        </div>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>

                    {request.response && (
                      <div className="bg-muted/50 rounded-lg p-4 border-l-4 border-primary">
                        <p className="text-sm font-medium mb-1">Phản hồi từ concierge:</p>
                        <p className="text-sm text-muted-foreground">{request.response}</p>
                      </div>
                    )}
                  </Card>
                )
              })}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-primary">{requests.length}</p>
          <p className="text-xs text-muted-foreground">Tổng yêu cầu</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-blue-500">
            {requests.filter(r => r.status === "in-progress").length}
          </p>
          <p className="text-xs text-muted-foreground">Đang xử lý</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-green-500">
            {requests.filter(r => r.status === "completed").length}
          </p>
          <p className="text-xs text-muted-foreground">Hoàn thành</p>
        </Card>
      </div>
    </div>
  )
}
