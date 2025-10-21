"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Clock, CheckCircle2, User, Home, MessageSquare } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Dispute {
  id: string
  bookingId: string
  type: "cleanliness" | "damage" | "cancellation" | "refund" | "other"
  priority: "low" | "medium" | "high"
  status: "open" | "investigating" | "resolved"
  reportedBy: "guest" | "host"
  guestName: string
  guestAvatar: string
  hostName: string
  hostAvatar: string
  listingTitle: string
  issue: string
  guestMessage: string
  hostMessage?: string
  createdDate: Date
  amount: number
}

const mockDisputes: Dispute[] = [
  {
    id: "1",
    bookingId: "BK12345",
    type: "cleanliness",
    priority: "high",
    status: "open",
    reportedBy: "guest",
    guestName: "Nguyễn Văn A",
    guestAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=guest1",
    hostName: "Trần Thị B",
    hostAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=host1",
    listingTitle: "Villa view biển Nha Trang",
    issue: "Phòng không sạch sẽ như mô tả",
    guestMessage: "Khi tôi đến phòng còn bẩn, giường chưa được dọn dẹp, toilet còn bẩn. Tôi yêu cầu hoàn tiền 50%.",
    hostMessage: "Tôi đã dọn dẹp kỹ trước khi khách đến. Có thể khách đến sớm hơn giờ check-in.",
    createdDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
    amount: 1750000
  },
  {
    id: "2",
    bookingId: "BK23456",
    type: "damage",
    priority: "high",
    status: "investigating",
    reportedBy: "host",
    guestName: "Lê Văn C",
    guestAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=guest2",
    hostName: "Phạm Thị D",
    hostAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=host2",
    listingTitle: "Căn hộ studio Đà Lạt",
    issue: "Khách làm hỏng tivi và bàn kính",
    guestMessage: "Tôi không làm hỏng gì cả. Tivi đã hỏng từ trước.",
    hostMessage: "Sau khi khách trả phòng, tôi phát hiện tivi bị vỡ màn hình và bàn kính bị nứt. Yêu cầu bồi thường 5 triệu.",
    createdDate: new Date(Date.now() - 5 * 60 * 60 * 1000),
    amount: 800000
  },
  {
    id: "3",
    bookingId: "BK34567",
    type: "cancellation",
    priority: "medium",
    status: "open",
    reportedBy: "guest",
    guestName: "Hoàng Văn E",
    guestAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=guest3",
    hostName: "Võ Thị F",
    hostAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=host3",
    listingTitle: "Homestay Hội An",
    issue: "Host hủy phòng đột ngột",
    guestMessage: "Host hủy phòng 2 ngày trước ngày check-in mà không lý do. Tôi đã mua vé máy bay và yêu cầu bồi thường.",
    createdDate: new Date(Date.now() - 8 * 60 * 60 * 1000),
    amount: 1200000
  },
  {
    id: "4",
    bookingId: "BK45678",
    type: "refund",
    priority: "low",
    status: "resolved",
    reportedBy: "guest",
    guestName: "Mai Thị G",
    guestAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=guest4",
    hostName: "Đỗ Văn H",
    hostAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=host4",
    listingTitle: "Biệt thự Ba Vì",
    issue: "Yêu cầu hoàn tiền do thay đổi kế hoạch",
    guestMessage: "Gia đình có việc đột xuất, tôi muốn hủy và xin hoàn lại tiền.",
    hostMessage: "Theo chính sách của tôi, không hoàn tiền trong vòng 7 ngày trước check-in.",
    createdDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    amount: 5000000
  }
]

export function DisputeResolution() {
  const [disputes, setDisputes] = useState<Dispute[]>(mockDisputes)
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null)
  const [actionDialog, setActionDialog] = useState<"resolve" | null>(null)
  const [resolution, setResolution] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("open")

  const filteredDisputes = disputes.filter(d => 
    statusFilter === "all" || d.status === statusFilter
  )

  const handleResolveDispute = (disputeId: string) => {
    setDisputes(disputes.map(d => 
      d.id === disputeId ? { ...d, status: "resolved" as const } : d
    ))
    setActionDialog(null)
    setSelectedDispute(null)
    setResolution("")
  }

  const getTypeLabel = (type: Dispute["type"]) => {
    switch (type) {
      case "cleanliness": return "Vệ sinh"
      case "damage": return "Hư hỏng"
      case "cancellation": return "Hủy phòng"
      case "refund": return "Hoàn tiền"
      case "other": return "Khác"
    }
  }

  const getTypeColor = (type: Dispute["type"]) => {
    switch (type) {
      case "cleanliness": return "bg-orange-100 text-orange-700"
      case "damage": return "bg-red-100 text-red-700"
      case "cancellation": return "bg-purple-100 text-purple-700"
      case "refund": return "bg-blue-100 text-blue-700"
      case "other": return "bg-gray-100 text-gray-700"
    }
  }

  const getPriorityColor = (priority: Dispute["priority"]) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-700"
      case "medium": return "bg-yellow-100 text-yellow-700"
      case "low": return "bg-green-100 text-green-700"
    }
  }

  const getStatusColor = (status: Dispute["status"]) => {
    switch (status) {
      case "open": return "bg-yellow-100 text-yellow-700"
      case "investigating": return "bg-blue-100 text-blue-700"
      case "resolved": return "bg-green-100 text-green-700"
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount)
  }

  const formatDate = (date: Date) => {
    const now = Date.now()
    const diff = now - new Date(date).getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    
    if (hours < 1) return "Vừa xong"
    if (hours < 24) return `${hours} giờ trước`
    const days = Math.floor(hours / 24)
    return `${days} ngày trước`
  }

  const openCount = disputes.filter(d => d.status === "open").length
  const investigatingCount = disputes.filter(d => d.status === "investigating").length

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              Mới mở
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openCount}</div>
            <p className="text-xs text-muted-foreground">Cần xử lý ngay</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              Đang xử lý
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{investigatingCount}</div>
            <p className="text-xs text-muted-foreground">Đang điều tra</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Đã giải quyết
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">456</div>
            <p className="text-xs text-muted-foreground">Tháng này</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Thời gian TB
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18h</div>
            <p className="text-xs text-muted-foreground">Giải quyết</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="open">Mới mở</SelectItem>
            <SelectItem value="investigating">Đang xử lý</SelectItem>
            <SelectItem value="resolved">Đã giải quyết</SelectItem>
          </SelectContent>
        </Select>

        {openCount > 0 && (
          <Badge className="bg-red-600">
            {openCount} tranh chấp khẩn cấp
          </Badge>
        )}
      </div>

      {/* Disputes List */}
      <div className="space-y-4">
        {filteredDisputes.map((dispute) => (
          <Card key={dispute.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={getStatusColor(dispute.status)}>
                      {dispute.status === "open" && "Mới mở"}
                      {dispute.status === "investigating" && "Đang xử lý"}
                      {dispute.status === "resolved" && "Đã giải quyết"}
                    </Badge>
                    <Badge className={getPriorityColor(dispute.priority)}>
                      {dispute.priority === "high" && "🔴 Cao"}
                      {dispute.priority === "medium" && "🟡 Trung bình"}
                      {dispute.priority === "low" && "🟢 Thấp"}
                    </Badge>
                    <Badge className={getTypeColor(dispute.type)}>
                      {getTypeLabel(dispute.type)}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <CardTitle className="text-lg">{dispute.issue}</CardTitle>
                    <CardDescription className="flex items-center gap-4 text-xs">
                      <span>Booking: #{dispute.bookingId}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Home className="h-3 w-3" />
                        {dispute.listingTitle}
                      </span>
                      <span>•</span>
                      <span>{formatCurrency(dispute.amount)}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(dispute.createdDate)}
                      </span>
                    </CardDescription>
                  </div>
                </div>

                {dispute.status !== "resolved" && (
                  <Button 
                    size="sm"
                    onClick={() => {
                      setSelectedDispute(dispute)
                      setActionDialog("resolve")
                    }}
                  >
                    Giải quyết
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                {/* Guest Side */}
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <Avatar>
                    <AvatarImage src={dispute.guestAvatar} />
                    <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm">{dispute.guestName}</p>
                      <Badge variant="outline" className="text-xs">Guest</Badge>
                      {dispute.reportedBy === "guest" && (
                        <Badge className="text-xs bg-red-100 text-red-700">Người báo cáo</Badge>
                      )}
                    </div>
                    <p className="text-sm">{dispute.guestMessage}</p>
                  </div>
                </div>

                {/* Host Side */}
                {dispute.hostMessage && (
                  <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                    <Avatar>
                      <AvatarImage src={dispute.hostAvatar} />
                      <AvatarFallback><Home className="h-4 w-4" /></AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-sm">{dispute.hostName}</p>
                        <Badge variant="outline" className="text-xs">Host</Badge>
                        {dispute.reportedBy === "host" && (
                          <Badge className="text-xs bg-red-100 text-red-700">Người báo cáo</Badge>
                        )}
                      </div>
                      <p className="text-sm">{dispute.hostMessage}</p>
                    </div>
                  </div>
                )}

                {!dispute.hostMessage && dispute.status === "open" && (
                  <div className="p-3 bg-gray-50 rounded-lg text-center text-sm text-muted-foreground">
                    <MessageSquare className="h-4 w-4 inline mr-2" />
                    Đang chờ phản hồi từ host
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredDisputes.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Không có tranh chấp</h3>
            <p className="text-muted-foreground">
              Không có tranh chấp nào với bộ lọc hiện tại
            </p>
          </CardContent>
        </Card>
      )}

      {/* Resolve Dialog */}
      {actionDialog === "resolve" && selectedDispute && (
        <Dialog open={true} onOpenChange={() => setActionDialog(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Giải quyết tranh chấp #{selectedDispute.bookingId}</DialogTitle>
              <DialogDescription>
                Nhập quyết định và lý do giải quyết tranh chấp
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Guest</p>
                  <p className="font-semibold">{selectedDispute.guestName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Host</p>
                  <p className="font-semibold">{selectedDispute.hostName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Số tiền</p>
                  <p className="font-semibold">{formatCurrency(selectedDispute.amount)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Loại</p>
                  <p className="font-semibold">{getTypeLabel(selectedDispute.type)}</p>
                </div>
              </div>

              <Textarea
                placeholder="Quyết định giải quyết tranh chấp và lý do..."
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                rows={6}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setActionDialog(null)}>
                Hủy
              </Button>
              <Button 
                onClick={() => handleResolveDispute(selectedDispute.id)}
                disabled={!resolution.trim()}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Đánh dấu đã giải quyết
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
