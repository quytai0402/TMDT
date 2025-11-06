"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Check, X, MapPin, Calendar, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminLayout } from "@/components/admin-layout"

interface LocationRequest {
  id: string
  city: string
  state: string
  country: string
  reason: string
  status: "PENDING" | "APPROVED" | "REJECTED"
  createdAt: string
  approvedAt?: string
  rejectionReason?: string
  requestedByUser: {
    name: string
    email: string
  }
  approvedByUser?: {
    name: string
  }
}

export default function AdminLocationsPage() {
  const { toast } = useToast()
  const [requests, setRequests] = useState<LocationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [actionDialog, setActionDialog] = useState<{
    open: boolean
    type: "approve" | "reject" | null
    request: LocationRequest | null
  }>({
    open: false,
    type: null,
    request: null,
  })
  const [rejectionReason, setRejectionReason] = useState("")
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      const response = await fetch("/api/locations/requests")
      const data = await response.json()
      setRequests(data.requests || [])
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách yêu cầu",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async () => {
    if (!actionDialog.request || !actionDialog.type) return

    if (actionDialog.type === "reject" && !rejectionReason.trim()) {
      toast({
        title: "Thiếu lý do",
        description: "Vui lòng nhập lý do từ chối",
        variant: "destructive",
      })
      return
    }

    setProcessing(true)
    try {
      const response = await fetch(`/api/locations/requests/${actionDialog.request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: actionDialog.type === "approve" ? "APPROVED" : "REJECTED",
          rejectionReason: actionDialog.type === "reject" ? rejectionReason : undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Không thể xử lý yêu cầu")
      }

      toast({
        title: actionDialog.type === "approve" ? "✅ Đã phê duyệt" : "❌ Đã từ chối",
        description: data.message,
      })

      setActionDialog({ open: false, type: null, request: null })
      setRejectionReason("")
      fetchRequests()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  const pendingRequests = requests.filter((r) => r.status === "PENDING")
  const approvedRequests = requests.filter((r) => r.status === "APPROVED")
  const rejectedRequests = requests.filter((r) => r.status === "REJECTED")

  const RequestTable = ({ data }: { data: LocationRequest[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Khu vực</TableHead>
          <TableHead>Host</TableHead>
          <TableHead>Lý do</TableHead>
          <TableHead>Ngày gửi</TableHead>
          <TableHead>Trạng thái</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
              Không có yêu cầu nào
            </TableCell>
          </TableRow>
        ) : (
          data.map((request) => (
            <TableRow key={request.id}>
              <TableCell>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{request.city}</p>
                    <p className="text-sm text-muted-foreground">
                      {request.state}, {request.country}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{request.requestedByUser?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {request.requestedByUser?.email}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="max-w-xs">
                <p className="line-clamp-2 text-sm">{request.reason}</p>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {new Date(request.createdAt).toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    request.status === "APPROVED"
                      ? "default"
                      : request.status === "REJECTED"
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {request.status === "PENDING" && "🕐 Chờ duyệt"}
                  {request.status === "APPROVED" && "✅ Đã duyệt"}
                  {request.status === "REJECTED" && "❌ Từ chối"}
                </Badge>
                {request.status === "APPROVED" && request.approvedByUser && (
                  <p className="text-xs text-muted-foreground mt-1">
                    bởi {request.approvedByUser.name}
                  </p>
                )}
                {request.status === "REJECTED" && request.rejectionReason && (
                  <p className="text-xs text-destructive mt-1 line-clamp-1">
                    {request.rejectionReason}
                  </p>
                )}
              </TableCell>
              <TableCell>
                {request.status === "PENDING" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        setActionDialog({ open: true, type: "approve", request })
                      }
                      className="gap-1"
                    >
                      <Check className="h-4 w-4" />
                      Duyệt
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        setActionDialog({ open: true, type: "reject", request })
                      }
                      className="gap-1"
                    >
                      <X className="h-4 w-4" />
                      Từ chối
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin text-4xl">⏳</div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Quản lý khu vực</h1>
          <p className="text-muted-foreground mt-2">
            Xem xét và phê duyệt yêu cầu đăng ký khu vực mới từ các host
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Chờ duyệt</CardDescription>
              <CardTitle className="text-4xl">{pendingRequests.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Đã phê duyệt</CardDescription>
              <CardTitle className="text-4xl">{approvedRequests.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Đã từ chối</CardDescription>
              <CardTitle className="text-4xl">{rejectedRequests.length}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">
              Chờ duyệt ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Đã duyệt ({approvedRequests.length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Từ chối ({rejectedRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Yêu cầu chờ xử lý</CardTitle>
                <CardDescription>
                  Các yêu cầu đăng ký khu vực mới cần được xem xét
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RequestTable data={pendingRequests} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Đã phê duyệt</CardTitle>
                <CardDescription>
                  Các khu vực đã được thêm vào hệ thống
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RequestTable data={approvedRequests} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Đã từ chối</CardTitle>
                <CardDescription>
                  Các yêu cầu không được chấp thuận
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RequestTable data={rejectedRequests} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Action Dialog */}
      <Dialog
        open={actionDialog.open}
        onOpenChange={(open) =>
          !processing && setActionDialog({ open, type: null, request: null })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === "approve" ? "Phê duyệt yêu cầu" : "Từ chối yêu cầu"}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.request && (
                <>
                  Khu vực: <strong>{actionDialog.request.city}, {actionDialog.request.state}</strong>
                  <br />
                  Host: <strong>{actionDialog.request.requestedByUser?.name}</strong>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {actionDialog.type === "approve" ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Sau khi phê duyệt, khu vực này sẽ được thêm vào hệ thống và host có thể
                bắt đầu đăng listing tại đây.
              </p>
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm font-medium mb-2">Lý do đăng ký:</p>
                <p className="text-sm">{actionDialog.request?.reason}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Label htmlFor="rejection-reason">
                Lý do từ chối <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="rejection-reason"
                placeholder="Ví dụ: Khu vực này chưa có nhu cầu đủ lớn, hoặc đang trong kế hoạch mở rộng..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                disabled={processing}
              />
              <p className="text-xs text-muted-foreground">
                Lý do này sẽ được gửi cho host qua thông báo
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialog({ open: false, type: null, request: null })}
              disabled={processing}
            >
              Hủy
            </Button>
            <Button
              onClick={handleAction}
              disabled={processing}
              variant={actionDialog.type === "reject" ? "destructive" : "default"}
            >
              {processing ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Đang xử lý...
                </>
              ) : actionDialog.type === "approve" ? (
                "Phê duyệt"
              ) : (
                "Từ chối"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
