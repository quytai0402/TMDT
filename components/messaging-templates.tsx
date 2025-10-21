"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, MessageSquare, Clock, CheckCircle2, Edit2, Copy, Trash2, Plus, Wand2, Eye } from "lucide-react"
import { cn } from "@/lib/utils"

interface MessageTemplate {
  id: string
  name: string
  category: "welcome" | "checkin" | "checkout" | "faq" | "reminder" | "custom"
  subject: string
  content: string
  variables: string[]
  language: "vi" | "en"
  lastUsed?: Date
  useCount: number
}

const defaultTemplates: MessageTemplate[] = [
  {
    id: "1",
    name: "Chào mừng khách đặt phòng",
    category: "welcome",
    subject: "Chào mừng bạn đến với {{propertyName}}! 🏡",
    content: `Xin chào {{guestName}}! 👋

Cảm ơn bạn đã tin tưởng và đặt phòng tại {{propertyName}}. Chúng tôi rất vui mừng được đón tiếp bạn!

📅 Thông tin đặt phòng:
• Ngày nhận phòng: {{checkInDate}} lúc {{checkInTime}}
• Ngày trả phòng: {{checkOutDate}} lúc {{checkOutTime}}
• Số lượng khách: {{guestCount}} người
• Mã đặt phòng: {{bookingId}}

Chúng tôi sẽ gửi hướng dẫn chi tiết về cách nhận phòng trước 24h. Nếu có bất kỳ câu hỏi nào, đừng ngại liên hệ nhé!

Chúc bạn có một chuyến đi tuyệt vời! ✨

Trân trọng,
{{hostName}}`,
    variables: ["guestName", "propertyName", "checkInDate", "checkInTime", "checkOutDate", "checkOutTime", "guestCount", "bookingId", "hostName"],
    language: "vi",
    useCount: 45
  },
  {
    id: "2",
    name: "Hướng dẫn nhận phòng",
    category: "checkin",
    subject: "Hướng dẫn nhận phòng - {{propertyName}} 🔑",
    content: `Xin chào {{guestName}}!

Đây là hướng dẫn chi tiết để bạn nhận phòng vào ngày mai:

🏠 Địa chỉ: {{propertyAddress}}
⏰ Giờ nhận phòng: {{checkInTime}}
📍 Vị trí GPS: {{gpsLink}}

🔑 CÁCH NHẬN PHÒNG:
1. Khi đến nơi, vui lòng gọi cho tôi: {{hostPhone}}
2. Mật khẩu cửa chính: {{doorCode}}
3. Phòng của bạn là phòng số {{roomNumber}}
4. WiFi: {{wifiName}} / {{wifiPassword}}

🅿️ Đỗ xe: {{parkingInstructions}}

💡 Một số lưu ý:
• Check-in sớm/muộn: Vui lòng báo trước ít nhất 2h
• Hành lý: Có chỗ để hành lý nếu đến sớm
• Khóa cửa: Nhớ khóa cửa khi ra ngoài

Chúc bạn có chuyến đi vui vẻ! Hãy liên hệ nếu cần hỗ trợ nhé! 😊

{{hostName}}`,
    variables: ["guestName", "propertyName", "propertyAddress", "checkInTime", "gpsLink", "hostPhone", "doorCode", "roomNumber", "wifiName", "wifiPassword", "parkingInstructions", "hostName"],
    language: "vi",
    useCount: 38
  },
  {
    id: "3",
    name: "Cảm ơn sau khi trả phòng",
    category: "checkout",
    subject: "Cảm ơn bạn đã lưu trú! 💙",
    content: `Xin chào {{guestName}}!

Cảm ơn bạn đã chọn {{propertyName}} cho kỳ nghỉ của mình. Hy vọng bạn đã có những trải nghiệm tuyệt vời!

Chúng tôi rất mong nhận được đánh giá từ bạn về:
⭐ Chất lượng phòng ốc
⭐ Dịch vụ và tiện nghi
⭐ Vị trí và không gian

👉 Để lại đánh giá tại đây: {{reviewLink}}

🎁 Đặc biệt: Sử dụng mã {{discountCode}} để được giảm 15% cho lần đặt phòng tiếp theo (có hiệu lực trong 3 tháng).

Rất mong được đón bạn quay lại! 🏡

Trân trọng,
{{hostName}}`,
    variables: ["guestName", "propertyName", "reviewLink", "discountCode", "hostName"],
    language: "vi",
    useCount: 32
  },
  {
    id: "4",
    name: "Nhắc nhở trước 24h",
    category: "reminder",
    subject: "Nhắc nhở: Ngày mai bạn sẽ nhận phòng! ⏰",
    content: `Xin chào {{guestName}}!

Chỉ còn 24h nữa là đến ngày nhận phòng của bạn! 🎉

📋 Xác nhận thông tin:
• Ngày: {{checkInDate}}
• Giờ: {{checkInTime}}
• Địa chỉ: {{propertyAddress}}
• Số khách: {{guestCount}} người

✅ Checklist trước khi đến:
□ Xác nhận giờ đến (nếu có thay đổi, vui lòng báo trước)
□ Chuẩn bị CMND/CCCD để làm thủ tục
□ Lưu số điện thoại liên hệ: {{hostPhone}}
□ Tải bản đồ/GPS nếu cần: {{gpsLink}}

Tôi sẽ gửi hướng dẫn chi tiết về nhận phòng trong vài giờ tới.

Hẹn gặp bạn! 😊
{{hostName}}`,
    variables: ["guestName", "checkInDate", "checkInTime", "propertyAddress", "guestCount", "hostPhone", "gpsLink", "hostName"],
    language: "vi",
    useCount: 28
  },
  {
    id: "5",
    name: "FAQ - Quy định nhà",
    category: "faq",
    subject: "Quy định và nội quy tại {{propertyName}}",
    content: `Xin chào {{guestName}}!

Dưới đây là một số quy định để đảm bảo trải nghiệm tốt nhất cho bạn và các khách khác:

🏠 QUY ĐỊNH NHÀ:
• Không hút thuốc trong nhà
• Không tổ chức tiệc tùng ồn ào sau 22h
• Không mang thú cưng (trừ khi có thỏa thuận trước)
• Tối đa {{maxGuests}} khách
• Giữ gìn vệ sinh chung

🔐 AN TOÀN:
• Khóa cửa khi ra ngoài
• Không cho người lạ vào nhà
• Tắt điện, gas, nước khi không sử dụng
• Liên hệ ngay nếu có sự cố: {{emergencyPhone}}

♻️ BẢO VỆ MÔI TRƯỜNG:
• Tiết kiệm điện nước
• Phân loại rác tại {{wasteLocation}}
• Sử dụng đồ dùng tái chế được cung cấp

Vi phạm quy định có thể dẫn đến phí phạt hoặc yêu cầu rời khỏi nhà.

Cảm ơn bạn đã hợp tác! 🙏
{{hostName}}`,
    variables: ["guestName", "propertyName", "maxGuests", "emergencyPhone", "wasteLocation", "hostName"],
    language: "vi",
    useCount: 18
  }
]

export function MessagingTemplates() {
  const [templates, setTemplates] = useState<MessageTemplate[]>(defaultTemplates)
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewData, setPreviewData] = useState<Record<string, string>>({})
  const [searchQuery, setSearchQuery] = useState("")
  const [filterCategory, setFilterCategory] = useState<string>("all")

  const categoryLabels = {
    welcome: "Chào mừng",
    checkin: "Nhận phòng",
    checkout: "Trả phòng",
    faq: "FAQ",
    reminder: "Nhắc nhở",
    custom: "Tùy chỉnh"
  }

  const categoryColors = {
    welcome: "bg-green-500",
    checkin: "bg-blue-500",
    checkout: "bg-purple-500",
    faq: "bg-orange-500",
    reminder: "bg-yellow-500",
    custom: "bg-gray-500"
  }

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = filterCategory === "all" || template.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const handleDuplicate = (template: MessageTemplate) => {
    const newTemplate: MessageTemplate = {
      ...template,
      id: Date.now().toString(),
      name: `${template.name} (Copy)`,
      useCount: 0,
      lastUsed: undefined
    }
    setTemplates([...templates, newTemplate])
  }

  const handleDelete = (id: string) => {
    setTemplates(templates.filter(t => t.id !== id))
  }

  const handlePreview = (template: MessageTemplate) => {
    setSelectedTemplate(template)
    // Set sample data for preview
    const sampleData: Record<string, string> = {
      guestName: "Nguyễn Văn A",
      propertyName: "Villa Biển Xanh",
      checkInDate: "15/12/2024",
      checkInTime: "14:00",
      checkOutDate: "18/12/2024",
      checkOutTime: "12:00",
      guestCount: "4",
      bookingId: "BK-2024-001234",
      hostName: "Chị Hương",
      propertyAddress: "123 Đường Trần Phú, Nha Trang",
      gpsLink: "https://maps.google.com/?q=12.2388,109.1967",
      hostPhone: "0901 234 567",
      doorCode: "1234#",
      roomNumber: "301",
      wifiName: "Villa_Guest",
      wifiPassword: "welcome2024",
      parkingInstructions: "Đỗ xe trong sân, bên trái cửa chính",
      reviewLink: "https://homestay.vn/review/12345",
      discountCode: "COMEBACK15",
      maxGuests: "6",
      emergencyPhone: "0901 234 567",
      wasteLocation: "Phía sau nhà bếp"
    }
    setPreviewData(sampleData)
    setIsPreviewOpen(true)
  }

  const replaceVariables = (text: string, data: Record<string, string>) => {
    return text.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
      return data[variable] || match
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Mẫu tin nhắn</h2>
          <p className="text-muted-foreground">Quản lý và tùy chỉnh mẫu tin nhắn tự động</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Tạo mẫu mới
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Tạo mẫu tin nhắn mới</DialogTitle>
              <DialogDescription>
                Tạo mẫu tin nhắn tùy chỉnh của riêng bạn
              </DialogDescription>
            </DialogHeader>
            {/* Template creation form would go here */}
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Tên mẫu</Label>
                <Input placeholder="VD: Chào mừng khách VIP" />
              </div>
              <div className="space-y-2">
                <Label>Danh mục</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="welcome">Chào mừng</SelectItem>
                    <SelectItem value="checkin">Nhận phòng</SelectItem>
                    <SelectItem value="checkout">Trả phòng</SelectItem>
                    <SelectItem value="faq">FAQ</SelectItem>
                    <SelectItem value="reminder">Nhắc nhở</SelectItem>
                    <SelectItem value="custom">Tùy chỉnh</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tiêu đề</Label>
                <Input placeholder="Tiêu đề email/tin nhắn" />
              </div>
              <div className="space-y-2">
                <Label>Nội dung</Label>
                <Textarea 
                  placeholder="Nội dung tin nhắn (sử dụng {{variableName}} cho biến động)"
                  rows={10}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline">Hủy</Button>
              <Button>Tạo mẫu</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tổng mẫu</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.length}</div>
            <p className="text-xs text-muted-foreground">+2 mẫu mới tháng này</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Đã sử dụng</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {templates.reduce((sum, t) => sum + t.useCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Tổng số lần gửi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tự động hóa</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <p className="text-xs text-muted-foreground">Tin nhắn tự động</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Thời gian tiết kiệm</CardTitle>
            <Wand2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12h</div>
            <p className="text-xs text-muted-foreground">Mỗi tuần</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            placeholder="Tìm kiếm mẫu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Danh mục" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="welcome">Chào mừng</SelectItem>
            <SelectItem value="checkin">Nhận phòng</SelectItem>
            <SelectItem value="checkout">Trả phòng</SelectItem>
            <SelectItem value="faq">FAQ</SelectItem>
            <SelectItem value="reminder">Nhắc nhở</SelectItem>
            <SelectItem value="custom">Tùy chỉnh</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription className="line-clamp-1">
                    {template.subject}
                  </CardDescription>
                </div>
                <Badge className={cn("ml-2", categoryColors[template.category])}>
                  {categoryLabels[template.category]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground line-clamp-3">
                  {template.content.substring(0, 150)}...
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {template.variables.slice(0, 3).map((variable) => (
                    <Badge key={variable} variant="outline" className="text-xs">
                      {`{{${variable}}}`}
                    </Badge>
                  ))}
                  {template.variables.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{template.variables.length - 3}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="text-xs text-muted-foreground">
                    Đã dùng: {template.useCount} lần
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePreview(template)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedTemplate(template)
                        setIsEditing(true)
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDuplicate(template)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(template.id)}
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

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Xem trước: {selectedTemplate?.name}</DialogTitle>
            <DialogDescription>
              Dữ liệu mẫu được sử dụng để hiển thị
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">TIÊU ĐỀ</Label>
              <div className="p-4 bg-muted rounded-lg font-semibold">
                {selectedTemplate && replaceVariables(selectedTemplate.subject, previewData)}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">NỘI DUNG</Label>
              <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap max-h-[400px] overflow-y-auto">
                {selectedTemplate && replaceVariables(selectedTemplate.content, previewData)}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Đóng
            </Button>
            <Button onClick={() => {
              setIsPreviewOpen(false)
              setIsEditing(true)
            }}>
              Chỉnh sửa mẫu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">Không tìm thấy mẫu</h3>
              <p className="text-muted-foreground">
                Thử thay đổi bộ lọc hoặc tạo mẫu mới
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
