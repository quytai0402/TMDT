"use client"

import { useEffect, useState } from "react"
import { Loader2, MapPin, Mail, Phone, Building2, CheckCircle2, XCircle } from "lucide-react"

import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

interface HostApplication {
  id: string
  locationName: string
  locationSlug: string
  introduction?: string | null
  experience?: string | null
  status: "PENDING" | "APPROVED" | "REJECTED"
  maintenanceAcknowledged: boolean
  paymentReference?: string | null
  createdAt: string
  reviewedAt?: string | null
  adminNotes?: string | null
  user: {
    id: string
    name: string | null
    email: string | null
    phone: string | null
    status: string
    role: string
    isVerified: boolean
  }
}

export default function AdminHostApplicationsPage() {
  const [applications, setApplications] = useState<HostApplication[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "approved" | "rejected">("all")
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})

  const loadApplications = async (status?: string) => {
    try {
      setLoading(true)
      const params = status && status !== "all" ? `?status=${status.toUpperCase()}` : ""
      const res = await fetch(`/api/admin/host-applications${params}`, { cache: "no-store" })
      if (!res.ok) {
        throw new Error("Không thể tải danh sách yêu cầu")
      }
      const data = await res.json()
      setApplications(data.applications || [])
    } catch (error) {
      console.error("Load host applications error:", error)
      toast.error("Không thể tải danh sách yêu cầu host")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadApplications(activeTab === "all" ? undefined : activeTab)
  }, [activeTab])

  const handleAction = async (applicationId: string, action: "APPROVE" | "REJECT") => {
    try {
      setProcessingId(applicationId)
      const res = await fetch("/api/admin/host-applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId,
          action,
          adminNotes: notes[applicationId] || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Không thể cập nhật yêu cầu")
      }

      toast.success(action === "APPROVE" ? "Đã phê duyệt host" : "Đã từ chối yêu cầu")
      void loadApplications(activeTab === "all" ? undefined : activeTab)
    } catch (error) {
      console.error("Update host application error:", error)
      toast.error((error as Error).message)
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Yêu cầu trở thành host</h1>
            <p className="text-muted-foreground">Phê duyệt hồ sơ host và quản lý khu vực vận hành</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
          <TabsList>
            <TabsTrigger value="all">Tất cả</TabsTrigger>
            <TabsTrigger value="pending">Chờ duyệt</TabsTrigger>
            <TabsTrigger value="approved">Đã duyệt</TabsTrigger>
            <TabsTrigger value="rejected">Đã từ chối</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Đang tải danh sách...
              </div>
            ) : applications.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Không có yêu cầu nào ở trạng thái này.
                </CardContent>
              </Card>
            ) : (
              applications.map((application) => (
                <Card key={application.id} className="border border-muted/50">
                  <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        {application.user.name || application.user.email || "Host"}
                      </CardTitle>
                      <CardDescription className="flex flex-wrap items-center gap-3">
                        <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{application.user.email}</span>
                        {application.user.phone && (
                          <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{application.user.phone}</span>
                        )}
                      </CardDescription>
                    </div>
                    <Badge variant={application.status === "APPROVED" ? "default" : application.status === "REJECTED" ? "destructive" : "outline"}>
                      {application.status}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-lg border p-4 text-sm">
                        <p className="font-semibold text-muted-foreground flex items-center gap-2">
                          <MapPin className="h-4 w-4" /> Khu vực vận hành
                        </p>
                        <p className="mt-1 text-foreground font-medium">{application.locationName}</p>
                      </div>
                      <div className="rounded-lg border p-4 text-sm">
                        <p className="font-semibold text-muted-foreground">Thông tin tài khoản</p>
                        <p className="mt-1">Trạng thái: {application.user.status}</p>
                        <p>Vai trò hiện tại: {application.user.role}</p>
                        <p>Xác minh: {application.user.isVerified ? "Đã xác minh" : "Chưa"}</p>
                      </div>
                    </div>

                    {application.paymentReference && (
                      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                        <p className="text-sm font-semibold text-blue-900">Mã tham chiếu thanh toán</p>
                        <p className="mt-1 text-lg font-mono font-bold text-blue-700">{application.paymentReference}</p>
                        <p className="mt-1 text-xs text-blue-600">Sử dụng mã này để xác nhận thanh toán trong hệ thống ngân hàng</p>
                      </div>
                    )}

                    {application.introduction && (
                      <div className="rounded-lg border p-4">
                        <p className="text-sm font-semibold text-muted-foreground">Giới thiệu homestay</p>
                        <p className="mt-1 text-sm whitespace-pre-line">{application.introduction}</p>
                      </div>
                    )}

                    {application.experience && (
                      <div className="rounded-lg border p-4">
                        <p className="text-sm font-semibold text-muted-foreground">Kinh nghiệm & đội ngũ</p>
                        <p className="mt-1 text-sm whitespace-pre-line">{application.experience}</p>
                      </div>
                    )}

                    {application.status !== "PENDING" && application.adminNotes ? (
                      <div className="rounded-lg border border-dashed bg-muted/30 p-4">
                        <p className="text-sm font-semibold text-muted-foreground">Ghi chú đã gửi cho host</p>
                        <p className="mt-1 whitespace-pre-line text-sm text-foreground">{application.adminNotes}</p>
                        {application.reviewedAt ? (
                          <p className="mt-2 text-xs text-muted-foreground">
                            Đánh giá lúc {new Date(application.reviewedAt).toLocaleString("vi-VN")}
                          </p>
                        ) : null}
                      </div>
                    ) : null}

                    {application.status === "PENDING" && (
                      <div className="space-y-3">
                        <Textarea
                          placeholder="Ghi chú cho host (tuỳ chọn)"
                          value={notes[application.id] || ""}
                          onChange={(event) =>
                            setNotes((prev) => ({ ...prev, [application.id]: event.target.value }))
                          }
                        />
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleAction(application.id, "APPROVE")}
                            disabled={processingId === application.id}
                          >
                            {processingId === application.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                            )}
                            Phê duyệt
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600"
                            onClick={() => handleAction(application.id, "REJECT")}
                            disabled={processingId === application.id}
                          >
                            {processingId === application.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <XCircle className="mr-2 h-4 w-4" />
                            )}
                            Từ chối
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}
