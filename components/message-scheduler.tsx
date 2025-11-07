"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Calendar, Clock, Send, User, Home, CheckCircle2, AlertCircle, Pause, Play, Loader2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

type TemplateCategory = "WELCOME" | "CHECKIN" | "CHECKOUT" | "FAQ" | "REMINDER" | "CUSTOM"
type AutomationTrigger =
  | "BOOKING_CONFIRMED"
  | "BEFORE_CHECK_IN"
  | "CHECK_IN"
  | "DURING_STAY"
  | "CHECK_OUT"
  | "AFTER_CHECK_OUT"
  | "CUSTOM_TIME"
type AutomationStatus = "ACTIVE" | "PAUSED" | "DRAFT"
type RecipientScope = "ALL_GUESTS" | "NEW_GUESTS" | "RETURNING_GUESTS" | "VIP_GUESTS"

interface ScheduledMessage {
  id: string
  name: string
  trigger: AutomationTrigger
  timingLabel?: string | null
  offsetMinutes?: number | null
  recipients: RecipientScope
  status: AutomationStatus
  sentCount: number
  lastSent?: string | null
  template?: {
    id: string
    name: string
    category: TemplateCategory
  } | null
}

const triggerLabels: Record<AutomationTrigger, { label: string; description: string }> = {
  BOOKING_CONFIRMED: { label: "Ngay khi xác nhận", description: "Gửi khi booking được xác nhận" },
  BEFORE_CHECK_IN: { label: "Trước check-in", description: "Nhắc khách trước khi đến" },
  CHECK_IN: { label: "Tại check-in", description: "Gửi đúng thời điểm nhận phòng" },
  DURING_STAY: { label: "Trong kỳ lưu trú", description: "Chăm sóc trong khi khách nghỉ" },
  CHECK_OUT: { label: "Khi check-out", description: "Thông báo lúc khách trả phòng" },
  AFTER_CHECK_OUT: { label: "Sau check-out", description: "Nhắc đánh giá hoặc ưu đãi" },
  CUSTOM_TIME: { label: "Tùy chỉnh", description: "Theo lịch riêng" },
}

const statusStyles: Record<AutomationStatus, { label: string; className: string }> = {
  ACTIVE: { label: "Đang chạy", className: "bg-green-100 text-green-700" },
  PAUSED: { label: "Tạm dừng", className: "bg-yellow-100 text-yellow-700" },
  DRAFT: { label: "Nháp", className: "bg-gray-100 text-gray-600" },
}

const recipientLabels: Record<RecipientScope, string> = {
  ALL_GUESTS: "Tất cả khách",
  NEW_GUESTS: "Khách mới",
  RETURNING_GUESTS: "Khách quay lại",
  VIP_GUESTS: "Khách VIP",
}

function formatDateTime(value?: string | null) {
  if (!value) return "—"
  return new Date(value).toLocaleString("vi-VN")
}

export function MessageScheduler() {
  const [messages, setMessages] = useState<ScheduledMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [sendWeekends, setSendWeekends] = useState(true)
  const [nightQuietHours, setNightQuietHours] = useState(true)
  const [retryFailed, setRetryFailed] = useState(true)
  const [sendNotifications, setSendNotifications] = useState(false)

  const loadMessages = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch("/api/host/automation/scheduled-messages", { cache: "no-store" })
      if (!response.ok) {
        throw new Error("Không thể tải danh sách tin nhắn tự động")
      }
      const data = (await response.json()) as { messages?: ScheduledMessage[] }
      setMessages(Array.isArray(data.messages) ? data.messages : [])
    } catch (err) {
      console.error(err)
      setError((err as Error).message)
      setMessages([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  const activeMessages = useMemo(() => messages.filter((message) => message.status === "ACTIVE"), [messages])
  const totalSent = useMemo(() => messages.reduce((sum, message) => sum + (message.sentCount ?? 0), 0), [messages])
  const lastTriggered = useMemo(() => {
    const sorted = [...messages].sort((a, b) => {
      const dateA = a.lastSent ? new Date(a.lastSent).getTime() : 0
      const dateB = b.lastSent ? new Date(b.lastSent).getTime() : 0
      return dateB - dateA
    })
    return sorted[0]?.lastSent
  }, [messages])
  const templateUsage = useMemo(() => {
    const ids = new Set<string>()
    messages.forEach((message) => {
      if (message.template?.id) {
        ids.add(message.template.id)
      }
    })
    return ids.size
  }, [messages])

  const handleToggleStatus = useCallback(
    async (messageId: string) => {
      try {
        setTogglingId(messageId)
        const response = await fetch(`/api/host/automation/scheduled-messages/${messageId}`, {
          method: "PATCH",
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Không thể cập nhật trạng thái tin nhắn")
        }

        const data = await response.json()
        if (data?.message) {
          setMessages((prev) => prev.map((message) => (message.id === data.message.id ? data.message : message)))
        } else {
          await loadMessages()
        }

        toast.success("Đã cập nhật trạng thái tin nhắn")
      } catch (err) {
        console.error(err)
        toast.error((err as Error).message)
      } finally {
        setTogglingId(null)
      }
    },
    [loadMessages],
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Tin nhắn tự động</h2>
        <p className="text-muted-foreground">Lên lịch gửi tin nhắn tự động cho khách</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Đang hoạt động</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeMessages.length}</div>
            <p className="text-xs text-muted-foreground">Automation bật</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tổng tin đã gửi</CardTitle>
            <Send className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSent}</div>
            <p className="text-xs text-muted-foreground">Cộng dồn toàn hệ thống</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Mẫu đang dùng</CardTitle>
            <Home className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templateUsage}</div>
            <p className="text-xs text-muted-foreground">Mẫu đang gắn vào workflow</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Lần gửi gần nhất</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold">{formatDateTime(lastTriggered)}</div>
            <p className="text-xs text-muted-foreground">Cập nhật realtime</p>
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
            <Button variant="outline" onClick={loadMessages}>
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
        <div className="grid gap-4 md:grid-cols-2">
          {messages.map((message) => {
            const triggerInfo = triggerLabels[message.trigger]
            const statusInfo = statusStyles[message.status]
            return (
              <Card key={message.id} className="transition-shadow hover:shadow-md">
                <CardHeader className="space-y-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{message.name}</CardTitle>
                      <CardDescription>{message.timingLabel || triggerInfo?.description}</CardDescription>
                    </div>
                    <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1 text-sm">
                      <p className="text-muted-foreground">Trigger</p>
                      <div className="flex items-center gap-2 font-medium">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {triggerInfo?.label}
                      </div>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p className="text-muted-foreground">Đối tượng</p>
                      <div className="flex items-center gap-2 font-medium">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {recipientLabels[message.recipients] || "—"}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">Mẫu tin nhắn</p>
                    {message.template ? (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{message.template.name}</Badge>
                        <Badge>{message.template.category}</Badge>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Chưa gắn mẫu</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t pt-2 text-xs text-muted-foreground">
                    <span>Đã gửi: {message.sentCount} lần</span>
                    <span>Lần cuối: {formatDateTime(message.lastSent)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleToggleStatus(message.id)}
                      disabled={togglingId === message.id}
                    >
                      {message.status === "ACTIVE" ? (
                        <>
                          {togglingId === message.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Pause className="mr-2 h-4 w-4" />
                          )}
                          Tạm dừng
                        </>
                      ) : (
                        <>
                          {togglingId === message.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="mr-2 h-4 w-4" />
                          )}
                          Kích hoạt
                        </>
                      )}
                    </Button>
                    <Button variant="ghost" size="icon">
                      <AlertCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {!isLoading && !messages.length && !error && (
        <Card className="p-12 text-center">
          <div className="space-y-4">
            <Send className="mx-auto h-12 w-12 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">Chưa có workflow nào</h3>
              <p className="text-muted-foreground">Tạo mẫu tin nhắn và gắn vào automation để bắt đầu</p>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Cài đặt nâng cao</CardTitle>
          <CardDescription>Tùy chỉnh hành vi gửi tin nhắn</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Gửi vào cuối tuần</Label>
              <p className="text-sm text-muted-foreground">Cho phép gửi tin tự động vào thứ 7 và chủ nhật</p>
            </div>
            <Switch checked={sendWeekends} onCheckedChange={setSendWeekends} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Tránh gửi ban đêm (22h - 8h)</Label>
              <p className="text-sm text-muted-foreground">Hạn chế làm phiền khách vào khung giờ nhạy cảm</p>
            </div>
            <Switch checked={nightQuietHours} onCheckedChange={setNightQuietHours} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Tự động gửi lại</Label>
              <p className="text-sm text-muted-foreground">Thử gửi lại sau 30 phút nếu thất bại</p>
            </div>
            <Switch checked={retryFailed} onCheckedChange={setRetryFailed} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Thông báo cho host</Label>
              <p className="text-sm text-muted-foreground">Nhận thông báo mỗi khi automation chạy</p>
            </div>
            <Switch checked={sendNotifications} onCheckedChange={setSendNotifications} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Múi giờ</Label>
              <Select defaultValue="asia_saigon">
                <SelectTrigger>
                  <SelectValue placeholder="Chọn múi giờ" />
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
                  <SelectValue placeholder="Chọn ngôn ngữ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vi">Tiếng Việt</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="auto">Tự động theo khách</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hiệu suất gửi tin</CardTitle>
          <CardDescription>Số liệu tổng quan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <div className="text-2xl font-bold">{totalSent}</div>
              <p className="text-xs text-muted-foreground">Tin đã gửi</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{activeMessages.length}</div>
              <p className="text-xs text-muted-foreground">Workflow đang chạy</p>
            </div>
            <div>
              <div className="text-2xl font-bold">{formatDateTime(lastTriggered)}</div>
              <p className="text-xs text-muted-foreground">Lần gửi gần nhất</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
