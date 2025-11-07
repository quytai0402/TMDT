"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { MessageSquare, Clock, CheckCircle2, Copy, Trash2, Plus, Wand2, Eye, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type TemplateCategory = "WELCOME" | "CHECKIN" | "CHECKOUT" | "FAQ" | "REMINDER" | "CUSTOM"

interface MessageTemplate {
  id: string
  name: string
  category: TemplateCategory
  subject: string | null
  content: string
  variables: string[]
  language: string
  lastUsed?: string | null
  useCount: number
  createdAt: string
}

const categoryLabels: Record<TemplateCategory, string> = {
  WELCOME: "Chào mừng",
  CHECKIN: "Nhận phòng",
  CHECKOUT: "Trả phòng",
  FAQ: "FAQ",
  REMINDER: "Nhắc nhở",
  CUSTOM: "Tùy chỉnh",
}

const categoryColors: Record<TemplateCategory, string> = {
  WELCOME: "bg-green-500",
  CHECKIN: "bg-blue-500",
  CHECKOUT: "bg-purple-500",
  FAQ: "bg-orange-500",
  REMINDER: "bg-yellow-500",
  CUSTOM: "bg-gray-500",
}

const filterOptions: Array<{ value: TemplateCategory | "all"; label: string }> = [
  { value: "all", label: "Tất cả" },
  { value: "WELCOME", label: "Chào mừng" },
  { value: "CHECKIN", label: "Nhận phòng" },
  { value: "CHECKOUT", label: "Trả phòng" },
  { value: "FAQ", label: "FAQ" },
  { value: "REMINDER", label: "Nhắc nhở" },
  { value: "CUSTOM", label: "Tùy chỉnh" },
]

export function MessagingTemplates() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewData, setPreviewData] = useState<Record<string, string>>({})
  const [searchQuery, setSearchQuery] = useState("")
  const [filterCategory, setFilterCategory] = useState<TemplateCategory | "all">("all")
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: "",
    category: "WELCOME" as TemplateCategory,
    subject: "",
    content: "",
  })

  const loadTemplates = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch("/api/host/automation/templates", { cache: "no-store" })
      if (!response.ok) {
        throw new Error("Không thể tải danh sách mẫu tin nhắn")
      }
      const data = (await response.json()) as { templates?: MessageTemplate[] }
      setTemplates(Array.isArray(data.templates) ? data.templates : [])
    } catch (err) {
      console.error(err)
      setError((err as Error).message)
      setTemplates([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTemplates()
  }, [loadTemplates])

  const totalUseCount = useMemo(
    () => templates.reduce((sum, template) => sum + (template.useCount ?? 0), 0),
    [templates],
  )

  const automatedRatio = useMemo(() => {
    if (!templates.length) return 0
    const activeTemplates = templates.filter((template) => (template.useCount ?? 0) > 0).length
    return Math.round((activeTemplates / templates.length) * 100)
  }, [templates])

  const estimatedHoursSaved = useMemo(() => {
    if (!templates.length) return 0
    return Math.max(Math.round(totalUseCount * 0.25), templates.length)
  }, [templates, totalUseCount])

  const filteredTemplates = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    return templates.filter((template) => {
      const matchesSearch =
        !query ||
        template.name.toLowerCase().includes(query) ||
        template.content.toLowerCase().includes(query) ||
        (template.subject ?? "").toLowerCase().includes(query)

      const matchesCategory = filterCategory === "all" || template.category === filterCategory

      return matchesSearch && matchesCategory
    })
  }, [templates, searchQuery, filterCategory])

  const handleDuplicate = useCallback(async (templateId: string) => {
    try {
      setActionLoading(true)
      const response = await fetch("/api/host/automation/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceTemplateId: templateId }),
      })

      if (!response.ok) {
        throw new Error("Không thể nhân bản mẫu")
      }

      const data = await response.json()
      if (data?.template) {
        setTemplates((prev) => [data.template, ...prev])
        toast.success("Đã nhân bản mẫu tin nhắn")
      }
    } catch (err) {
      console.error(err)
      toast.error((err as Error).message)
    } finally {
      setActionLoading(false)
    }
  }, [])

  const handleDelete = useCallback(async (id: string) => {
    const confirmed = window.confirm("Bạn có chắc muốn xóa mẫu này?")
    if (!confirmed) return

    try {
      setActionLoading(true)
      const response = await fetch(`/api/host/automation/templates/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Không thể xóa mẫu")
      }

      setTemplates((prev) => prev.filter((template) => template.id !== id))
      toast.success("Đã xóa mẫu tin nhắn")
    } catch (err) {
      console.error(err)
      toast.error((err as Error).message)
    } finally {
      setActionLoading(false)
    }
  }, [])

  const handlePreview = useCallback((template: MessageTemplate) => {
    setSelectedTemplate(template)
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
      wasteLocation: "Phía sau nhà bếp",
    }
    setPreviewData(sampleData)
    setIsPreviewOpen(true)
  }, [])

  const replaceVariables = useCallback((text: string | null, data: Record<string, string>) => {
    if (!text) return ""
    return text.replace(/\{\{(\w+)\}\}/g, (match, variable) => data[variable] ?? match)
  }, [])

  const handleCreate = useCallback(async () => {
    if (!createForm.name.trim() || !createForm.content.trim()) {
      toast.error("Vui lòng nhập tên và nội dung")
      return
    }

    try {
      setActionLoading(true)
      const response = await fetch("/api/host/automation/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createForm.name.trim(),
          category: createForm.category,
          subject: createForm.subject.trim() || null,
          content: createForm.content.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error("Không thể tạo mẫu mới")
      }

      const data = await response.json()
      if (data?.template) {
        setTemplates((prev) => [data.template, ...prev])
        toast.success("Đã tạo mẫu tin nhắn")
        setCreateForm({ name: "", category: "WELCOME", subject: "", content: "" })
        setIsCreating(false)
      }
    } catch (err) {
      console.error(err)
      toast.error((err as Error).message)
    } finally {
      setActionLoading(false)
    }
  }, [createForm])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Mẫu tin nhắn</h2>
          <p className="text-muted-foreground">Quản lý và tùy chỉnh mẫu tin nhắn tự động</p>
        </div>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Tạo mẫu mới
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Tạo mẫu tin nhắn mới</DialogTitle>
              <DialogDescription>Tạo mẫu tin nhắn được cá nhân hóa cho khách của bạn</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Tên mẫu</Label>
                <Input
                  value={createForm.name}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="VD: Chào mừng khách VIP"
                />
              </div>
              <div className="space-y-2">
                <Label>Danh mục</Label>
                <Select
                  value={createForm.category}
                  onValueChange={(value: TemplateCategory) => setCreateForm((prev) => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions
                      .filter((option) => option.value !== "all")
                      .map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tiêu đề</Label>
                <Input
                  value={createForm.subject}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, subject: event.target.value }))}
                  placeholder="Tiêu đề email/tin nhắn"
                />
              </div>
              <div className="space-y-2">
                <Label>Nội dung</Label>
                <Textarea
                  value={createForm.content}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, content: event.target.value }))}
                  placeholder="Nội dung tin nhắn (sử dụng {{variableName}} cho biến động)"
                  rows={10}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Hủy
              </Button>
              <Button onClick={handleCreate} disabled={actionLoading}>
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Tạo mẫu"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tổng mẫu</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.length}</div>
            <p className="text-xs text-muted-foreground">Đã tạo cho tài khoản host của bạn</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Đã sử dụng</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUseCount}</div>
            <p className="text-xs text-muted-foreground">Tổng số lần gửi cho khách</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tự động hóa</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{automatedRatio}%</div>
            <p className="text-xs text-muted-foreground">Mẫu đã gắn vào workflow tự động</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Thời gian tiết kiệm</CardTitle>
            <Wand2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estimatedHoursSaved}h</div>
            <p className="text-xs text-muted-foreground">Ước tính mỗi năm</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            placeholder="Tìm kiếm theo tên, tiêu đề hoặc nội dung..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>
        <Select value={filterCategory} onValueChange={(value) => setFilterCategory(value as TemplateCategory | "all")}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Danh mục" />
          </SelectTrigger>
          <SelectContent>
            {filterOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <Card className="border-destructive/40 bg-destructive/10">
          <CardHeader>
            <CardTitle className="text-destructive">Không thể tải dữ liệu</CardTitle>
            <CardDescription className="text-destructive">{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={loadTemplates}>
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
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-1">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    {template.subject && <CardDescription className="line-clamp-1">{template.subject}</CardDescription>}
                  </div>
                  <Badge className={cn("ml-2", categoryColors[template.category])}>
                    {categoryLabels[template.category]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground line-clamp-3">
                    {template.content.substring(0, 180)}
                    {template.content.length > 180 ? "…" : ""}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
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

                  <div className="flex items-center justify-between border-t pt-2">
                    <div className="text-xs text-muted-foreground">Đã gửi: {template.useCount} lần</div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handlePreview(template)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" disabled={actionLoading} onClick={() => handleDuplicate(template.id)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" disabled={actionLoading} onClick={() => handleDelete(template.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && !filteredTemplates.length && !error && (
        <Card className="p-12">
          <div className="space-y-4 text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">Chưa có mẫu phù hợp</h3>
              <p className="text-muted-foreground">Thử thay đổi bộ lọc hoặc tạo mẫu mới dành riêng cho khách của bạn.</p>
            </div>
          </div>
        </Card>
      )}

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Xem trước: {selectedTemplate?.name}</DialogTitle>
            <DialogDescription>Dữ liệu mẫu được sử dụng cho bản xem trước, không gửi cho khách.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">TIÊU ĐỀ</Label>
              <div className="rounded-lg bg-muted p-4 font-semibold">
                {replaceVariables(selectedTemplate?.subject ?? "", previewData)}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">NỘI DUNG</Label>
              <div className="max-h-[400px] rounded-lg bg-muted p-4 whitespace-pre-wrap overflow-y-auto">
                {replaceVariables(selectedTemplate?.content ?? "", previewData)}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
