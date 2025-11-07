"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  Loader2,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  RefreshCcw,
  Languages,
  MapPin,
  ExternalLink,
  UserRound,
  UsersRound,
  ClipboardList,
} from "lucide-react"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

interface GuideApplicationApplicant {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  role: string | null
  isGuide: boolean
  isHost: boolean
}

interface GuideApplicationSponsor {
  id: string
  name: string | null
  email: string | null
  isHost: boolean
}

interface GuideApplicationProfile {
  id: string
  status: string
}

type GuideApplicationStatus = "PENDING" | "APPROVED" | "REJECTED" | "NEEDS_REVISION"

interface GuideApplication {
  id: string
  status: GuideApplicationStatus
  displayName: string
  tagline?: string | null
  introduction: string
  experienceSummary: string
  languages: string[]
  serviceAreas: string[]
  specialties: string[]
  availabilityNotes?: string | null
  portfolioLinks: string[]
  documents?: unknown
  subscriptionAcknowledged: boolean
  adminNotes?: string | null
  reviewedAt?: string | null
  createdAt: string
  applicant: GuideApplicationApplicant
  sponsor?: GuideApplicationSponsor | null
  guideProfile?: GuideApplicationProfile | null
}

interface GuideMeta {
  fee: number
  commissionRate: number
}

type TabValue = "pending" | "approved" | "needs_revision" | "rejected" | "all"

type ActionType = "APPROVE" | "REJECT" | "NEEDS_REVISION"

const statusLabels: Record<GuideApplicationStatus, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Đã từ chối",
  NEEDS_REVISION: "Yêu cầu chỉnh sửa",
}

const statusVariant: Record<GuideApplicationStatus, "default" | "outline" | "destructive" | "secondary"> = {
  PENDING: "outline",
  APPROVED: "default",
  REJECTED: "destructive",
  NEEDS_REVISION: "secondary",
}

const tabToStatus: Record<TabValue, GuideApplicationStatus | null> = {
  pending: "PENDING",
  approved: "APPROVED",
  needs_revision: "NEEDS_REVISION",
  rejected: "REJECTED",
  all: null,
}

const tabItems: { value: TabValue; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: "Chờ duyệt" },
  { value: "needs_revision", label: "Cần chỉnh sửa" },
  { value: "approved", label: "Đã duyệt" },
  { value: "rejected", label: "Đã từ chối" },
]

const numberFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
})

const percentFormatter = new Intl.NumberFormat("vi-VN", {
  style: "percent",
  maximumFractionDigits: 1,
})

const FRIENDLY_DOCUMENT_LABELS: Record<string, string> = {
  paymentReference: "Mã tham chiếu thanh toán",
}

const buildDocumentList = (documents: unknown): { label: string; value: string }[] => {
  if (Array.isArray(documents)) {
    return documents
      .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      .map((item) => ({ label: item, value: item }))
  }

  if (documents && typeof documents === "object") {
    return Object.entries(documents as Record<string, unknown>)
      .filter(([, value]) => typeof value === "string" && value.trim().length > 0)
      .map(([key, value]) => ({
        label: FRIENDLY_DOCUMENT_LABELS[key] ?? key,
        value: value as string,
      }))
  }

  return []
}

export default function AdminGuideApplicationsPage() {
  const [applications, setApplications] = useState<GuideApplication[]>([])
  const [meta, setMeta] = useState<GuideMeta>({ fee: 399_000, commissionRate: 0.1 })
  const [activeTab, setActiveTab] = useState<TabValue>("all")
  const [loading, setLoading] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})

  const loadApplications = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/guide-applications", { cache: "no-store" })
      if (!res.ok) {
        throw new Error("Không thể tải danh sách hướng dẫn viên")
      }
      const data = await res.json()
      setApplications(data.applications || [])
      setMeta({
        fee: typeof data.meta?.fee === "number" ? data.meta.fee : 399_000,
        commissionRate:
          typeof data.meta?.commissionRate === "number" ? data.meta.commissionRate : 0.1,
      })
      const presetNotes: Record<string, string> = {}
      for (const application of data.applications || []) {
        if (application.adminNotes) {
          presetNotes[application.id] = application.adminNotes
        }
      }
      setNotes(presetNotes)
    } catch (error) {
      console.error("Load guide applications error:", error)
      toast.error((error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadApplications()
  }, [])

  const filteredApplications = useMemo(() => {
    const status = tabToStatus[activeTab]
    if (!status) return applications
    return applications.filter((application) => application.status === status)
  }, [activeTab, applications])

  const stats = useMemo(() => {
    return applications.reduce(
      (acc, application) => {
        acc.total += 1
        acc[application.status] += 1
        return acc
      },
      {
        total: 0,
        PENDING: 0,
        APPROVED: 0,
        REJECTED: 0,
        NEEDS_REVISION: 0,
      } as Record<"total" | GuideApplicationStatus, number>,
    )
  }, [applications])

  const handleAction = async (applicationId: string, action: ActionType) => {
    try {
      setProcessingId(applicationId)
      const note = notes[applicationId]?.trim()
      const res = await fetch("/api/admin/guide-applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId,
          action,
          adminNotes: note && note.length > 0 ? note : undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Không thể cập nhật hồ sơ")
      }

      if (action === "APPROVE") {
        toast.success("Đã phê duyệt hồ sơ hướng dẫn viên")
      } else if (action === "REJECT") {
        toast.success("Đã từ chối hồ sơ")
      } else {
        toast.success("Đã yêu cầu chỉnh sửa hồ sơ")
      }

      await loadApplications()
    } catch (error) {
      console.error("Update guide application error:", error)
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
            <h1 className="text-3xl font-bold">Quản lý hướng dẫn viên</h1>
            <p className="text-muted-foreground">
              Duyệt hồ sơ, quản lý phí 399.000đ/tháng và hoa hồng 10% cho đội ngũ hướng dẫn viên
            </p>
          </div>
          <Button variant="outline" onClick={() => void loadApplications()} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
            Tải lại
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border-muted/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Phí duy trì</CardTitle>
              <CardDescription className="text-2xl font-semibold text-foreground">
                {numberFormatter.format(meta.fee)} / tháng
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-muted/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Hoa hồng nền tảng</CardTitle>
              <CardDescription className="text-2xl font-semibold text-foreground">
                {percentFormatter.format(meta.commissionRate)}
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-muted/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Hồ sơ chờ duyệt</CardTitle>
              <CardDescription className="text-2xl font-semibold text-foreground">{stats.PENDING}</CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-muted/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Hướng dẫn viên đang hoạt động</CardTitle>
              <CardDescription className="text-2xl font-semibold text-foreground">{stats.APPROVED}</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)}>
          <TabsList className="flex-wrap">
            {tabItems.map((item) => (
              <TabsTrigger key={item.value} value={item.value}>
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Đang tải danh sách...
              </div>
            ) : filteredApplications.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Không có hồ sơ ở trạng thái này.
                </CardContent>
              </Card>
            ) : (
              filteredApplications.map((application) => {
                const documentEntries = buildDocumentList(application.documents)
                return (
                  <Card key={application.id} className="border border-muted/50">
                    <CardHeader className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <CardTitle className="text-xl font-semibold">{application.displayName}</CardTitle>
                        <CardDescription className="flex flex-wrap items-center gap-2 text-sm">
                          {application.tagline && <span>{application.tagline}</span>}
                          <span className="text-muted-foreground">
                            Nộp ngày {new Date(application.createdAt).toLocaleDateString("vi-VN")}
                          </span>
                        </CardDescription>
                      </div>
                      <div className="flex flex-col items-start gap-2 text-right md:items-end">
                        <Badge variant={statusVariant[application.status]} className="uppercase">
                          {statusLabels[application.status]}
                        </Badge>
                        {application.reviewedAt ? (
                          <span className="text-xs text-muted-foreground">
                            Cập nhật {new Date(application.reviewedAt).toLocaleString("vi-VN")}
                          </span>
                        ) : null}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-lg border p-4 text-sm">
                          <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                            <UserRound className="h-4 w-4" /> Ứng viên
                          </p>
                          <p className="mt-2 text-foreground font-medium">
                            {application.applicant.name || application.applicant.email || "Không rõ"}
                          </p>
                          {application.applicant.email && (
                            <p className="mt-1 flex items-center gap-1 text-muted-foreground">
                              <Mail className="h-3.5 w-3.5" />
                              {application.applicant.email}
                            </p>
                          )}
                          {application.applicant.phone && (
                            <p className="flex items-center gap-1 text-muted-foreground">
                              <Phone className="h-3.5 w-3.5" />
                              {application.applicant.phone}
                            </p>
                          )}
                          <p className="mt-2 text-xs text-muted-foreground">
                            Vai trò hiện tại: {application.applicant.role || "GUEST"} · Host: {application.applicant.isHost ? "Có" : "Không"} · Guide: {application.applicant.isGuide ? "Có" : "Không"}
                          </p>
                        </div>
                        <div className="rounded-lg border p-4 text-sm">
                          <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                            <UsersRound className="h-4 w-4" /> Host bảo trợ
                          </p>
                          {application.sponsor ? (
                            <>
                              <p className="mt-2 text-foreground font-medium">
                                {application.sponsor.name || application.sponsor.email || "Không rõ"}
                              </p>
                              {application.sponsor.email && (
                                <p className="mt-1 flex items-center gap-1 text-muted-foreground">
                                  <Mail className="h-3.5 w-3.5" />
                                  {application.sponsor.email}
                                </p>
                              )}
                              <p className="mt-2 text-xs text-muted-foreground">
                                Host nội bộ: {application.sponsor.isHost ? "Có" : "Không"}
                              </p>
                            </>
                          ) : (
                            <p className="mt-2 text-muted-foreground">Không có host bảo trợ</p>
                          )}
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="rounded-lg border p-4 text-sm">
                          <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                            <Languages className="h-4 w-4" /> Ngôn ngữ
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {application.languages.length > 0 ? (
                              application.languages.map((language) => (
                                <Badge key={language} variant="secondary">
                                  {language}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-muted-foreground">Chưa cập nhật</span>
                            )}
                          </div>
                        </div>
                        <div className="rounded-lg border p-4 text-sm">
                          <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                            <MapPin className="h-4 w-4" /> Khu vực hoạt động
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {application.serviceAreas.length > 0 ? (
                              application.serviceAreas.map((area) => (
                                <Badge key={area} variant="secondary">
                                  {area}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-muted-foreground">Chưa cập nhật</span>
                            )}
                          </div>
                        </div>
                        <div className="rounded-lg border p-4 text-sm">
                          <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                            <ClipboardList className="h-4 w-4" /> Sở trường
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {application.specialties.length > 0 ? (
                              application.specialties.map((specialty) => (
                                <Badge key={specialty} variant="secondary">
                                  {specialty}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-muted-foreground">Chưa cập nhật</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-lg border p-4">
                          <p className="text-sm font-semibold text-muted-foreground">Giới thiệu bản thân</p>
                          <p className="mt-2 whitespace-pre-line text-sm text-foreground">
                            {application.introduction}
                          </p>
                        </div>
                        <div className="rounded-lg border p-4">
                          <p className="text-sm font-semibold text-muted-foreground">Kinh nghiệm & dự án nổi bật</p>
                          <p className="mt-2 whitespace-pre-line text-sm text-foreground">
                            {application.experienceSummary}
                          </p>
                        </div>
                      </div>

                      {application.availabilityNotes ? (
                        <div className="rounded-lg border p-4">
                          <p className="text-sm font-semibold text-muted-foreground">Ghi chú về lịch làm việc</p>
                          <p className="mt-2 whitespace-pre-line text-sm text-foreground">
                            {application.availabilityNotes}
                          </p>
                        </div>
                      ) : null}

                      {application.portfolioLinks && application.portfolioLinks.length > 0 ? (
                        <div className="rounded-lg border p-4">
                          <p className="text-sm font-semibold text-muted-foreground">Portfolio & liên kết</p>
                          <div className="mt-2 flex flex-col gap-2 text-sm">
                            {application.portfolioLinks.map((link) => (
                              <Link
                                key={link}
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-primary hover:underline"
                              >
                                <ExternalLink className="h-4 w-4" /> {link}
                              </Link>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {documentEntries.length > 0 ? (
                        <div className="rounded-lg border p-4">
                          <p className="text-sm font-semibold text-muted-foreground">Thông tin bổ sung</p>
                          <div className="mt-2 flex flex-col gap-2 text-sm">
                            {documentEntries.map((doc, index) => {
                              const key = `${doc.label}-${index}`
                              const isLink = /^https?:\/\//i.test(doc.value)
                              if (isLink) {
                                return (
                                  <Link
                                    key={key}
                                    href={doc.value}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-primary hover:underline"
                                  >
                                    <ExternalLink className="h-4 w-4" /> {doc.label || doc.value}
                                  </Link>
                                )
                              }

                              return (
                                <div key={key} className="flex flex-wrap items-center gap-2">
                                  <span className="text-muted-foreground">{doc.label || "Thông tin"}:</span>
                                  <code className="rounded bg-muted px-2 py-1 text-sm text-foreground">
                                    {doc.value}
                                  </code>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ) : null}

                      {application.guideProfile ? (
                        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                          <p className="font-semibold">Hồ sơ hướng dẫn viên đã được tạo</p>
                          <p className="mt-1">Mã hồ sơ: {application.guideProfile.id}</p>
                          <p className="mt-1">Trạng thái: {application.guideProfile.status}</p>
                        </div>
                      ) : null}

                      {application.status !== "PENDING" && application.adminNotes ? (
                        <div className="rounded-lg border border-dashed bg-muted/40 p-4">
                          <p className="text-sm font-semibold text-muted-foreground">Ghi chú đã gửi cho ứng viên</p>
                          <p className="mt-2 whitespace-pre-line text-sm text-foreground">
                            {application.adminNotes}
                          </p>
                        </div>
                      ) : null}

                      {(application.status === "PENDING" || application.status === "NEEDS_REVISION") && (
                        <div className="space-y-3">
                          <Textarea
                            placeholder="Ghi chú dành cho ứng viên (tùy chọn)"
                            value={notes[application.id] ?? ""}
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
                              onClick={() => handleAction(application.id, "NEEDS_REVISION")}
                              disabled={processingId === application.id}
                            >
                              {processingId === application.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <RefreshCcw className="mr-2 h-4 w-4" />
                              )}
                              Yêu cầu chỉnh sửa
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
                )
              })
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}
