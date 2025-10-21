"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, MessageSquare, Calendar, Star, DollarSign, Clock } from "lucide-react"
import { toast } from "sonner"

export default function NotificationDemoPage() {
  const [notificationCount, setNotificationCount] = useState(0)

  const simulateNotification = (type: string) => {
    setNotificationCount((prev) => prev + 1)

    const notifications = {
      booking: {
        title: "Đặt phòng mới",
        description: "Bạn có booking mới tại Villa Đà Lạt",
        icon: "🏠",
      },
      message: {
        title: "Tin nhắn mới",
        description: "Nguyễn Văn A đã gửi tin nhắn cho bạn",
        icon: "💬",
      },
      review: {
        title: "Đánh giá mới",
        description: "Bạn nhận được đánh giá 5⭐ từ khách",
        icon: "⭐",
      },
      payment: {
        title: "Thanh toán thành công",
        description: "Bạn đã nhận được thanh toán ₫2,500,000",
        icon: "💰",
      },
      price_drop: {
        title: "Giảm giá",
        description: "Villa Nha Trang vừa giảm 20%",
        icon: "💸",
      },
      reminder: {
        title: "Nhắc nhở",
        description: "Check-in còn 2 ngày nữa",
        icon: "⏰",
      },
    }

    const notification = notifications[type as keyof typeof notifications] || notifications.booking

    toast.success(notification.title, {
      description: notification.description,
      icon: notification.icon,
      action: {
        label: "Xem",
        onClick: () => {
          console.log("View notification")
        },
      },
    })

    // Play notification sound
    try {
      const audio = new Audio("/notification.mp3")
      audio.volume = 0.5
      audio.play().catch(() => {
        console.log("Autoplay blocked")
      })
    } catch (error) {
      console.log("Audio error")
    }
  }

  return (
    <div className="container max-w-4xl py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Demo Thông Báo Real-time</h1>
        <p className="text-muted-foreground">
          Test hệ thống thông báo với toast, badge, và favicon notification
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Trạng thái</CardTitle>
          <CardDescription>Thông tin về hệ thống thông báo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium">Trạng thái:</span>
            </div>
            <span className="text-sm text-muted-foreground">Trực tuyến</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Số thông báo đã gửi:</span>
            <span className="text-sm text-muted-foreground">{notificationCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Icon thông báo:</span>
            <span className="text-sm text-muted-foreground">
              Nhấn vào icon <Bell className="inline h-4 w-4" /> trên header để xem
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Favicon badge:</span>
            <span className="text-sm text-muted-foreground">
              Kiểm tra tab browser (chuyển sang tab khác rồi quay lại)
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tạo Thông Báo Test</CardTitle>
          <CardDescription>Click vào các nút để tạo thông báo mẫu</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              onClick={() => simulateNotification("booking")}
              variant="outline"
              className="justify-start"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Đặt phòng mới
            </Button>
            <Button
              onClick={() => simulateNotification("message")}
              variant="outline"
              className="justify-start"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Tin nhắn mới
            </Button>
            <Button
              onClick={() => simulateNotification("review")}
              variant="outline"
              className="justify-start"
            >
              <Star className="h-4 w-4 mr-2" />
              Đánh giá mới
            </Button>
            <Button
              onClick={() => simulateNotification("payment")}
              variant="outline"
              className="justify-start"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Thanh toán thành công
            </Button>
            <Button
              onClick={() => simulateNotification("price_drop")}
              variant="outline"
              className="justify-start"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Giảm giá
            </Button>
            <Button
              onClick={() => simulateNotification("reminder")}
              variant="outline"
              className="justify-start"
            >
              <Clock className="h-4 w-4 mr-2" />
              Nhắc nhở
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Tính năng Real-time:</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary">✓</span>
            <span>Toast notification hiển thị ngay khi có thông báo mới</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">✓</span>
            <span>Badge đỏ trên icon Bell hiển thị số thông báo chưa đọc</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">✓</span>
            <span>Favicon badge trên tab browser (khi ở tab khác)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">✓</span>
            <span>Âm thanh thông báo (nếu có file notification.mp3)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">✓</span>
            <span>Polling mỗi 10 giây để check thông báo mới</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">✓</span>
            <span>Đánh dấu đã đọc và xóa thông báo</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
