"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Calendar, Clock, Send, User, Home, CheckCircle2, AlertCircle, Pause, Play } from "lucide-react"
import { cn } from "@/lib/utils"

interface ScheduledMessage {
  id: string
  name: string
  template: string
  trigger: "booking_confirmed" | "24h_before_checkin" | "check_in" | "during_stay" | "check_out" | "custom_time"
  timing: string // e.g., "24 hours before check-in", "At check-in time"
  recipients: "all_guests" | "new_guests" | "returning_guests"
  status: "active" | "paused" | "draft"
  sentCount: number
  lastSent?: Date
}

const defaultScheduledMessages: ScheduledMessage[] = [
  {
    id: "1",
    name: "Xác nhận đặt phòng",
    template: "Chào mừng khách đặt phòng",
    trigger: "booking_confirmed",
    timing: "Ngay sau khi xác nhận",
    recipients: "all_guests",
    status: "active",
    sentCount: 42,
    lastSent: new Date("2024-11-28")
  },
  {
    id: "2",
    name: "Nhắc nhở trước 24h",
    template: "Nhắc nhở trước 24h",
    trigger: "24h_before_checkin",
    timing: "24 giờ trước check-in",
    recipients: "all_guests",
    status: "active",
    sentCount: 38,
    lastSent: new Date("2024-11-27")
  },
  {
    id: "3",
    name: "Hướng dẫn check-in",
    template: "Hướng dẫn nhận phòng",
    trigger: "check_in",
    timing: "2 giờ trước check-in",
    recipients: "all_guests",
    status: "active",
    sentCount: 40,
    lastSent: new Date("2024-11-28")
  },
  {
    id: "4",
    name: "Hỏi thăm giữa kỳ",
    template: "Kiểm tra trải nghiệm",
    trigger: "during_stay",
    timing: "Ngày thứ 2 của kỳ lưu trú",
    recipients: "all_guests",
    status: "active",
    sentCount: 35,
    lastSent: new Date("2024-11-26")
  },
  {
    id: "5",
    name: "Cảm ơn sau check-out",
    template: "Cảm ơn sau khi trả phòng",
    trigger: "check_out",
    timing: "2 giờ sau check-out",
    recipients: "all_guests",
    status: "active",
    sentCount: 33,
    lastSent: new Date("2024-11-27")
  },
  {
    id: "6",
    name: "Yêu cầu đánh giá",
    template: "Nhắc nhở đánh giá",
    trigger: "check_out",
    timing: "1 ngày sau check-out",
    recipients: "all_guests",
    status: "active",
    sentCount: 30,
    lastSent: new Date("2024-11-25")
  }
]

export function MessageScheduler() {
  const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessage[]>(defaultScheduledMessages)
  const [selectedMessage, setSelectedMessage] = useState<ScheduledMessage | null>(null)

  const handleToggleStatus = (id: string) => {
    setScheduledMessages(scheduledMessages.map(msg => 
      msg.id === id 
        ? { ...msg, status: msg.status === "active" ? "paused" : "active" }
        : msg
    ))
  }

  const activeMessages = scheduledMessages.filter(m => m.status === "active")
  const totalSent = scheduledMessages.reduce((sum, m) => sum + m.sentCount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Tin nhắn tự động</h2>
        <p className="text-muted-foreground">Lên lịch gửi tin nhắn tự động cho khách</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Đang hoạt động</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeMessages.length}</div>
            <p className="text-xs text-muted-foreground">Tin nhắn tự động</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Đã gửi</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSent}</div>
            <p className="text-xs text-muted-foreground">Tổng số tin</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tỷ lệ gửi</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98%</div>
            <p className="text-xs text-muted-foreground">Thành công</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Thời gian tiết kiệm</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8h</div>
            <p className="text-xs text-muted-foreground">Mỗi tuần</p>
          </CardContent>
        </Card>
      </div>

      {/* Automation Flow */}
      <Card>
        <CardHeader>
          <CardTitle>Quy trình tự động hóa</CardTitle>
          <CardDescription>Tin nhắn sẽ tự động gửi theo các mốc thời gian</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Timeline */}
            <div className="relative">
              {scheduledMessages.filter(m => m.trigger !== "custom_time").map((message, index) => (
                <div key={message.id} className="flex items-start gap-4 mb-6 last:mb-0">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      message.status === "active" ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
                    )}>
                      {message.trigger === "booking_confirmed" && <CheckCircle2 className="h-5 w-5" />}
                      {message.trigger === "24h_before_checkin" && <Clock className="h-5 w-5" />}
                      {message.trigger === "check_in" && <Home className="h-5 w-5" />}
                      {message.trigger === "during_stay" && <User className="h-5 w-5" />}
                      {message.trigger === "check_out" && <Send className="h-5 w-5" />}
                    </div>
                    {index < scheduledMessages.filter(m => m.trigger !== "custom_time").length - 1 && (
                      <div className="w-0.5 h-12 bg-gray-200 my-2" />
                    )}
                  </div>

                  <Card className="flex-1">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{message.name}</h4>
                            <Badge variant={message.status === "active" ? "default" : "secondary"}>
                              {message.status === "active" ? "Hoạt động" : "Tạm dừng"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{message.timing}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Mẫu: {message.template}</span>
                            <span>•</span>
                            <span>Đã gửi: {message.sentCount} lần</span>
                          </div>
                        </div>
                        <Switch
                          checked={message.status === "active"}
                          onCheckedChange={() => handleToggleStatus(message.id)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Cài đặt nâng cao</CardTitle>
          <CardDescription>Tùy chỉnh hành vi gửi tin nhắn</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Gửi tin nhắn vào cuối tuần</Label>
              <p className="text-sm text-muted-foreground">
                Cho phép gửi tin tự động vào thứ 7 và chủ nhật
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Tránh gửi vào ban đêm</Label>
              <p className="text-sm text-muted-foreground">
                Không gửi tin từ 22:00 - 08:00
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Gửi lại nếu thất bại</Label>
              <p className="text-sm text-muted-foreground">
                Tự động thử lại sau 30 phút nếu gửi không thành công
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Thông báo khi gửi</Label>
              <p className="text-sm text-muted-foreground">
                Nhận thông báo mỗi khi tin nhắn được gửi tự động
              </p>
            </div>
            <Switch />
          </div>

          <div className="space-y-2">
            <Label>Múi giờ</Label>
            <Select defaultValue="asia_saigon">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asia_saigon">Việt Nam (GMT+7)</SelectItem>
                <SelectItem value="asia_bangkok">Thailand (GMT+7)</SelectItem>
                <SelectItem value="asia_singapore">Singapore (GMT+8)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Ngôn ngữ mặc định</Label>
            <Select defaultValue="vi">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vi">Tiếng Việt</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="auto">Tự động (theo khách)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Hiệu suất gửi tin</CardTitle>
          <CardDescription>30 ngày gần nhất</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <div className="text-2xl font-bold">218</div>
                <p className="text-xs text-muted-foreground">Tin đã gửi</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">214</div>
                <p className="text-xs text-muted-foreground">Thành công</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">4</div>
                <p className="text-xs text-muted-foreground">Thất bại</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Tỷ lệ thành công</span>
                <span className="font-semibold">98.2%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-green-600" style={{ width: "98.2%" }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
