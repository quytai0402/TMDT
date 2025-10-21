"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { MessageCircle, Zap, Edit2, Trash2, Plus, Copy, Clock, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface SavedReply {
  id: string
  title: string
  shortcut: string
  content: string
  tags: string[]
  useCount: number
  lastUsed?: Date
  createdAt: Date
}

const defaultReplies: SavedReply[] = [
  {
    id: "1",
    title: "Xác nhận đặt phòng",
    shortcut: "/confirm",
    content: "Xin chào! Cảm ơn bạn đã đặt phòng. Tôi đã xác nhận đơn đặt phòng của bạn. Nếu có bất kỳ câu hỏi nào, vui lòng liên hệ nhé! 😊",
    tags: ["xác nhận", "đặt phòng"],
    useCount: 156,
    lastUsed: new Date("2024-11-28"),
    createdAt: new Date("2024-01-15")
  },
  {
    id: "2",
    title: "Hỏi về WiFi",
    shortcut: "/wifi",
    content: "WiFi tại nhà:\n• Tên mạng: {{wifiName}}\n• Mật khẩu: {{wifiPassword}}\n• Tốc độ: 100Mbps\nMáy phát WiFi ở phòng khách. Nếu có vấn đề, vui lòng báo tôi!",
    tags: ["wifi", "internet", "tiện ích"],
    useCount: 89,
    lastUsed: new Date("2024-11-27"),
    createdAt: new Date("2024-01-20")
  },
  {
    id: "3",
    title: "Hướng dẫn đỗ xe",
    shortcut: "/parking",
    content: "Đỗ xe miễn phí tại:\n• Trong sân: 2 chỗ phía bên trái\n• Ngoài đường: Trước cổng (dành cho xe máy)\n• Gara: Liên hệ tôi nếu cần thêm chỗ\nVui lòng không chặn lối đi chung.",
    tags: ["đỗ xe", "giao thông"],
    useCount: 67,
    lastUsed: new Date("2024-11-26"),
    createdAt: new Date("2024-02-01")
  },
  {
    id: "4",
    title: "Hỏi về địa điểm ăn uống",
    shortcut: "/food",
    content: "Một số gợi ý ăn uống gần nhà:\n🍜 Phở Hà Nội - 200m (7:00-22:00)\n🍕 Pizza 4P's - 500m (11:00-23:00)\n☕ The Coffee House - 300m (7:00-22:30)\n🍲 Cơm niêu Sài Gòn - 400m (10:00-21:00)\nTất cả đều ngon và giá hợp lý!",
    tags: ["ăn uống", "nhà hàng", "địa điểm"],
    useCount: 92,
    lastUsed: new Date("2024-11-28"),
    createdAt: new Date("2024-02-10")
  },
  {
    id: "5",
    title: "Check-in sớm",
    shortcut: "/early",
    content: "Check-in sớm có thể tùy thuộc vào lịch đặt phòng. Vui lòng cho tôi biết giờ bạn dự kiến đến, tôi sẽ cố gắng sắp xếp. Nếu phòng chưa sẵn sàng, bạn có thể gửi hành lý miễn phí!",
    tags: ["check-in", "sớm", "linh hoạt"],
    useCount: 45,
    lastUsed: new Date("2024-11-25"),
    createdAt: new Date("2024-03-01")
  },
  {
    id: "6",
    title: "Yêu cầu thêm khăn tắm",
    shortcut: "/towels",
    content: "Tất nhiên! Tôi sẽ mang thêm khăn tắm cho bạn ngay. Dự kiến 15-20 phút nữa sẽ đến. Bạn cần bao nhiêu bộ khăn ạ?",
    tags: ["tiện ích", "khăn tắm", "yêu cầu"],
    useCount: 34,
    lastUsed: new Date("2024-11-24"),
    createdAt: new Date("2024-03-15")
  },
  {
    id: "7",
    title: "Hỏi về di chuyển",
    shortcut: "/transport",
    content: "Các phương tiện di chuyển:\n🚕 Grab/Be: Tiện lợi nhất\n🚌 Bus: Tuyến 32, 42 (trạm cách 200m)\n🚲 Xe đạp: Miễn phí (2 chiếc ở sân)\n🛵 Thuê xe máy: 100k/ngày (tôi có liên hệ)\nBạn muốn đi đâu để tôi gợi ý cụ thể hơn?",
    tags: ["di chuyển", "giao thông", "xe"],
    useCount: 78,
    lastUsed: new Date("2024-11-27"),
    createdAt: new Date("2024-04-01")
  },
  {
    id: "8",
    title: "Báo sự cố",
    shortcut: "/issue",
    content: "Xin lỗi vì sự bất tiện này! Tôi sẽ giải quyết ngay. Vui lòng gửi cho tôi:\n1. Mô tả sự cố\n2. Ảnh chụp (nếu có)\n3. Mức độ khẩn cấp\nTôi sẽ phản hồi trong 15 phút!",
    tags: ["sự cố", "khẩn cấp", "hỗ trợ"],
    useCount: 23,
    lastUsed: new Date("2024-11-23"),
    createdAt: new Date("2024-04-15")
  }
]

export function SavedReplies() {
  const [replies, setReplies] = useState<SavedReply[]>(defaultReplies)
  const [selectedReply, setSelectedReply] = useState<SavedReply | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredReplies = replies.filter(reply => {
    const searchLower = searchQuery.toLowerCase()
    return (
      reply.title.toLowerCase().includes(searchLower) ||
      reply.content.toLowerCase().includes(searchLower) ||
      reply.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
      reply.shortcut.toLowerCase().includes(searchLower)
    )
  })

  const handleDelete = (id: string) => {
    setReplies(replies.filter(r => r.id !== id))
  }

  const handleDuplicate = (reply: SavedReply) => {
    const newReply: SavedReply = {
      ...reply,
      id: Date.now().toString(),
      title: `${reply.title} (Copy)`,
      shortcut: `${reply.shortcut}_copy`,
      useCount: 0,
      lastUsed: undefined,
      createdAt: new Date()
    }
    setReplies([...replies, newReply])
  }

  const totalUseCount = replies.reduce((sum, r) => sum + r.useCount, 0)
  const avgUseCount = Math.round(totalUseCount / replies.length)
  const mostUsed = replies.reduce((max, r) => r.useCount > max.useCount ? r : max, replies[0])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Trả lời nhanh</h2>
          <p className="text-muted-foreground">Thiết lập câu trả lời có sẵn với phím tắt</p>
        </div>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Thêm trả lời mới
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Tạo trả lời nhanh mới</DialogTitle>
              <DialogDescription>
                Thiết lập câu trả lời được lưu với phím tắt
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tiêu đề</Label>
                  <Input placeholder="VD: Xác nhận đặt phòng" />
                </div>
                <div className="space-y-2">
                  <Label>Phím tắt</Label>
                  <Input placeholder="VD: /confirm" />
                  <p className="text-xs text-muted-foreground">
                    Gõ phím tắt để sử dụng nhanh
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Nội dung</Label>
                <Textarea 
                  placeholder="Nội dung trả lời (sử dụng {{variable}} cho biến)"
                  rows={6}
                />
              </div>
              <div className="space-y-2">
                <Label>Tags (phân cách bằng dấu phẩy)</Label>
                <Input placeholder="VD: xác nhận, đặt phòng, thanh toán" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Hủy
              </Button>
              <Button onClick={() => setIsCreating(false)}>
                Tạo trả lời
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tổng trả lời</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{replies.length}</div>
            <p className="text-xs text-muted-foreground">Câu trả lời được lưu</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Đã sử dụng</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUseCount}</div>
            <p className="text-xs text-muted-foreground">Tổng lần sử dụng</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Trung bình</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgUseCount}</div>
            <p className="text-xs text-muted-foreground">Lần/trả lời</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Phổ biến nhất</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold truncate">{mostUsed?.title}</div>
            <p className="text-xs text-muted-foreground">{mostUsed?.useCount} lần</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div>
        <Input
          placeholder="Tìm kiếm theo tiêu đề, nội dung, tags hoặc phím tắt..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Tips Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            Mẹo sử dụng
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <span className="font-medium">1.</span>
            <span>Gõ <code className="px-1.5 py-0.5 bg-white rounded text-xs">/</code> để xem danh sách phím tắt</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-medium">2.</span>
            <span>Sử dụng biến <code className="px-1.5 py-0.5 bg-white rounded text-xs">{`{{variable}}`}</code> cho nội dung động</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-medium">3.</span>
            <span>Thêm tags để dễ tìm kiếm và phân loại</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-medium">4.</span>
            <span>Nhấn <kbd className="px-2 py-0.5 bg-white rounded text-xs border">⌘K</kbd> để mở tìm kiếm nhanh</span>
          </div>
        </CardContent>
      </Card>

      {/* Replies Grid */}
      <div className="grid gap-4">
        {filteredReplies.map((reply) => (
          <Card key={reply.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{reply.title}</CardTitle>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {reply.shortcut}
                    </Badge>
                  </div>
                  <CardDescription className="text-sm">
                    {reply.content}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Tags */}
                <div className="flex items-center gap-2 flex-wrap">
                  {reply.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Stats and Actions */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      <span>{reply.useCount} lần</span>
                    </div>
                    {reply.lastUsed && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {new Date(reply.lastUsed).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(reply.content)
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedReply(reply)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDuplicate(reply)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(reply.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredReplies.length === 0 && (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">Không tìm thấy trả lời</h3>
              <p className="text-muted-foreground">
                Thử thay đổi từ khóa tìm kiếm hoặc tạo trả lời mới
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
