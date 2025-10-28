"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  MessageSquare,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type DisputeStatus = "OPEN" | "IN_REVIEW" | "AWAITING_RESPONSE" | "RESOLVED" | "CLOSED"
type DisputePriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT"

type AdminDispute = {
  id: string
  bookingId: string
  reporterId: string
  respondentId: string
  type: string
  status: DisputeStatus
  priority: DisputePriority
  subject: string
  description: string
  resolution?: string | null
  refundAmount?: number | null
  createdAt: string
  updatedAt: string
  reporter: {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string | null
  }
  respondent?: {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string | null
  } | null
  booking?: {
    id: string
    checkIn: string
    checkOut: string
    status: string
    totalPrice: number
    listing?: {
      id: string
      title: string
      city?: string | null
      country?: string | null
      images?: string[] | null
    } | null
    guest?: {
      id: string
      name?: string | null
      email?: string | null
    } | null
    host?: {
      id: string
      name?: string | null
      email?: string | null
    } | null
  } | null
}

type SummaryTarget = {
  label: string
  value: DisputeStatus | "all"
  icon: React.ComponentType<{ className?: string }>
}

const STATUS_OPTIONS: Array<{ label: string; value: DisputeStatus | "all" }> = [
  { label: "Tất cả", value: "all" },
  { label: "Đang mở", value: "OPEN" },
  { label: "Đang xử lý", value: "IN_REVIEW" },
  { label: "Chờ phản hồi", value: "AWAITING_RESPONSE" },
  { label: "Đã giải quyết", value: "RESOLVED" },
  { label: "Đã đóng", value: "CLOSED" },
]

const PRIORITY_OPTIONS: Array<{ label: string; value: DisputePriority | "all" }> = [
  { label: "Tất cả độ ưu tiên", value: "all" },
  { label: "Thấp", value: "LOW" },
  { label: "Trung bình", value: "MEDIUM" },
  { label: "Cao", value: "HIGH" },
  { label: "Khẩn cấp", value: "URGENT" },
]

const SUMMARY_TARGETS: SummaryTarget[] = [
  { label: "Đang mở", value: "OPEN", icon: AlertTriangle },
  { label: "Đang xử lý", value: "IN_REVIEW", icon: Clock },
  { label: "Chờ phản hồi", value: "AWAITING_RESPONSE", icon: MessageSquare },
  { label: "Đã giải quyết", value: "RESOLVED", icon: ShieldCheck },
]

const statusBadge = (status: DisputeStatus) => {
  switch (status) {
    case "OPEN":
      return { className: "bg-red-100 text-red-700", label: "Đang mở" }
    case "IN_REVIEW":
      return { className: "bg-amber-100 text-amber-700", label: "Đang xử lý" }
    case "AWAITING_RESPONSE":
      return { className: "bg-blue-100 text-blue-700", label: "Chờ phản hồi" }
    case "RESOLVED":
      return { className: "bg-green-100 text-green-700", label: "Đã giải quyết" }
    case "CLOSED":
      return { className: "bg-gray-100 text-gray-700", label: "Đã đóng" }
    default:
      return { className: "bg-gray-100 text-gray-700", label: status }
  }
}

const priorityBadge = (priority: DisputePriority) => {
  switch (priority) {
    case "LOW":
      return { className: "bg-emerald-100 text-emerald-700", label: "Thấp" }
    case "MEDIUM":
      return { className: "bg-blue-100 text-blue-700", label: "Trung bình" }
    case "HIGH":
      return { className: "bg-orange-100 text-orange-700", label: "Cao" }
    case "URGENT":
      return { className: "bg-red-100 text-red-700", label: "Khẩn cấp" }
    default:
      return { className: "bg-gray-100 text-gray-700", label: priority }
  }
}

const formatCurrency = (value?: number | null) => {
  if (!value) return "0₫"
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value)
}

const formatDateTime = (value?: string | null) => {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleString("vi-VN")
}

const formatDate = (value?: string | null) => {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString("vi-VN")
}

export function DisputeResolution() {
  const [statusFilter, setStatusFilter] = useState<DisputeStatus | "all">("OPEN")
  const [priorityFilter, setPriorityFilter] = useState<DisputePriority | "all">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [disputes, setDisputes] = useState<AdminDispute[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<Record<string, number>>({})
  const [selectedDispute, setSelectedDispute] = useState<AdminDispute | null>(null)
  const [action, setAction] = useState<"review" | "await" | "resolve" | "close" | null>(null)
  const [resolutionNote, setResolutionNote] = useState("")
  const [refundAmount, setRefundAmount] = useState<number | undefined>(undefined)

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 400)
    return () => clearTimeout(handler)
  }, [searchQuery])

  const fetchDisputes = useCallback(
    async (status: DisputeStatus | "all", priority: DisputePriority | "all", keyword: string) => {
      try {
        setLoading(true)
        setError(null)

        const params = new URLSearchParams({
          page: "1",
          limit: "20",
        })

        if (status !== "all") {
          params.set("status", status)
        }

        if (priority !== "all") {
          params.set("priority", priority)
        }

        if (keyword) {
          params.set("search", keyword)
        }

        const response = await fetch(`/api/admin/disputes?${params.toString()}`, {
          cache: "no-store",
        })

        if (!response.ok) {
          throw new Error("Không thể tải danh sách tranh chấp")
        }

        const data = await response.json()
        setDisputes(Array.isArray(data?.disputes) ? data.disputes : [])
      } catch (err) {
        console.error("Failed to fetch disputes:", err)
        setError("Không thể tải dữ liệu tranh chấp. Vui lòng thử lại.")
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  const fetchSummary = useCallback(async () => {
    try {
      const requests = SUMMARY_TARGETS.map(async (target) => {
        const params = new URLSearchParams({ page: "1", limit: "1" })
        if (target.value !== "all") {
          params.set("status", target.value)
        }

        const response = await fetch(`/api/admin/disputes?${params.toString()}`, {
          cache: "no-store",
        })

        if (!response.ok) {
          throw new Error("failed")
        }

        const data = await response.json()
        return {
          status: target.value,
          total: Number(data?.pagination?.total) || Number(data?.pagination?.totalCount) || 0,
        }
      })

      const results = await Promise.allSettled(requests)
      const totals: Record<string, number> = {}

      results.forEach((result) => {
        if (result.status === "fulfilled") {
          totals[result.value.status] = result.value.total
        }
      })

      setSummary(totals)
    } catch (err) {
      console.error("Failed to fetch dispute summary:", err)
    }
  }, [])

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  useEffect(() => {
    fetchDisputes(statusFilter, priorityFilter, debouncedSearch)
  }, [statusFilter, priorityFilter, debouncedSearch, fetchDisputes])

  const refreshData = useCallback(async () => {
    await Promise.all([
      fetchDisputes(statusFilter, priorityFilter, debouncedSearch),
      fetchSummary(),
    ])
  }, [fetchDisputes, fetchSummary, statusFilter, priorityFilter, debouncedSearch])

  const handleUpdateDispute = async (status: DisputeStatus) => {
    if (!selectedDispute) return

    try {
      const response = await fetch("/api/admin/disputes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disputeId: selectedDispute.id,
          status,
          priority: status === "IN_REVIEW" ? "HIGH" : undefined,
          resolution: status === "RESOLVED" || status === "CLOSED" ? resolutionNote : undefined,
          refundAmount:
            typeof refundAmount === "number" && !Number.isNaN(refundAmount) ? refundAmount : undefined,
        }),
      })

      if (!response.ok) {
        throw new Error("Không thể cập nhật tranh chấp")
      }

      setSelectedDispute(null)
      setAction(null)
      setResolutionNote("")
      setRefundAmount(undefined)

      await refreshData()
    } catch (err) {
      console.error("Failed to update dispute:", err)
      setError("Không thể cập nhật tranh chấp. Vui lòng thử lại.")
    }
  }

  const summaryCards = useMemo(() => {
    return SUMMARY_TARGETS.map((target) => ({
      ...target,
      total: summary[target.value] ?? 0,
    }))
  }, [summary])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quản lý tranh chấp</CardTitle>
        <CardDescription>Theo dõi và giải quyết các tranh chấp giữa khách và host</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map(({ value, label, icon: Icon, total }) => (
            <Card key={value}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  {label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{total.toLocaleString("vi-VN")}</div>
                <p className="text-xs text-muted-foreground">Tổng số tranh chấp</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-4 md:flex-row">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-52">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-52">
                <SelectValue placeholder="Độ ưu tiên" />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Tìm theo mã booking, khách, host, chủ đề..."
            className="lg:max-w-sm"
          />
        </div>

        {error ? (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-6 text-sm text-destructive">
            {error}
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : disputes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-12 text-center text-muted-foreground">
            <ShieldAlert className="h-8 w-8" />
            <p>Hiện không có tranh chấp nào phù hợp với bộ lọc.</p>
            <Button variant="outline" size="sm" onClick={refreshData}>
              Tải lại danh sách
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {disputes.map((dispute) => {
              const status = statusBadge(dispute.status)
              const priority = priorityBadge(dispute.priority)

              return (
                <div key={dispute.id} className="rounded-lg border p-4 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="border-primary text-primary">
                          #{dispute.id.slice(-6).toUpperCase()}
                        </Badge>
                        <h3 className="text-lg font-semibold">{dispute.subject}</h3>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{dispute.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={priority.className}>{priority.label}</Badge>
                      <Badge className={status.className}>{status.label}</Badge>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 text-sm">
                    <div className="rounded-md bg-muted p-3">
                      <p className="text-xs text-muted-foreground uppercase">Khách báo cáo</p>
                      <p className="font-medium text-foreground">
                        {dispute.reporter?.name || dispute.reporter?.email || "Không rõ"}
                      </p>
                    </div>
                    <div className="rounded-md bg-muted p-3">
                      <p className="text-xs text-muted-foreground uppercase">Đối tượng</p>
                      <p className="font-medium text-foreground">
                        {dispute.respondent?.name || dispute.respondent?.email || "Không rõ"}
                      </p>
                    </div>
                    {dispute.booking && (
                      <div className="rounded-md bg-muted p-3">
                        <p className="text-xs text-muted-foreground uppercase">Booking</p>
                        <p className="font-medium text-foreground">
                          {dispute.booking.listing?.title || "Homestay"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(dispute.booking.checkIn)} - {formatDate(dispute.booking.checkOut)}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                    <div className="flex flex-wrap items-center gap-3">
                      <span>Loại: {dispute.type.replace(/_/g, " ")}</span>
                      <span>Gửi lúc: {formatDateTime(dispute.createdAt)}</span>
                      {typeof dispute.refundAmount === "number" && dispute.refundAmount > 0 && (
                        <span>Hoàn tiền đề xuất: {formatCurrency(dispute.refundAmount)}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/trips/${dispute.bookingId}`, "_blank")}
                      >
                        Xem booking
                      </Button>

                      {dispute.status === "OPEN" && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedDispute(dispute)
                            setAction("review")
                          }}
                        >
                          Nhận xử lý
                        </Button>
                      )}

                      {dispute.status === "IN_REVIEW" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedDispute(dispute)
                            setAction("await")
                          }}
                        >
                          Yêu cầu phản hồi
                        </Button>
                      )}

                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setSelectedDispute(dispute)
                          setAction("resolve")
                        }}
                      >
                        Giải quyết
                      </Button>

                      {dispute.status !== "CLOSED" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedDispute(dispute)
                            setAction("close")
                          }}
                        >
                          Đóng tranh chấp
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <Button variant="outline" size="sm" onClick={refreshData}>
          Làm mới dữ liệu
        </Button>
      </CardContent>

      {action && selectedDispute && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) {
              setSelectedDispute(null)
              setAction(null)
              setResolutionNote("")
              setRefundAmount(undefined)
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {action === "review" && "Nhận xử lý tranh chấp"}
                {action === "await" && "Yêu cầu phản hồi từ các bên"}
                {action === "resolve" && "Giải quyết tranh chấp"}
                {action === "close" && "Đóng tranh chấp"}
              </DialogTitle>
              <DialogDescription>
                {action === "resolve"
                  ? "Nhập ghi chú giải quyết và số tiền hoàn (nếu có) để kết thúc tranh chấp."
                  : "Hành động này sẽ cập nhật trạng thái của tranh chấp cho toàn bộ hệ thống."}
              </DialogDescription>
            </DialogHeader>

            {action === "resolve" && (
              <div className="space-y-4 py-2">
                <Textarea
                  value={resolutionNote}
                  onChange={(event) => setResolutionNote(event.target.value)}
                  placeholder="Ghi chú giải quyết (bắt buộc)..."
                  rows={4}
                />
                <div>
                  <label htmlFor="refundAmount" className="text-sm font-medium text-foreground">
                    Số tiền hoàn (nếu có)
                  </label>
                  <Input
                    id="refundAmount"
                    type="number"
                    min={0}
                    value={typeof refundAmount === "number" ? refundAmount : ""}
                    onChange={(event) => setRefundAmount(event.target.value ? Number(event.target.value) : undefined)}
                    placeholder="Ví dụ: 500000"
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedDispute(null)
                  setAction(null)
                  setResolutionNote("")
                  setRefundAmount(undefined)
                }}
              >
                Hủy
              </Button>
              {action === "review" && (
                <Button onClick={() => handleUpdateDispute("IN_REVIEW")}>Nhận xử lý</Button>
              )}
              {action === "await" && (
                <Button onClick={() => handleUpdateDispute("AWAITING_RESPONSE")}>
                  Gửi yêu cầu phản hồi
                </Button>
              )}
              {action === "resolve" && (
                <Button
                  onClick={() => handleUpdateDispute("RESOLVED")}
                  disabled={!resolutionNote.trim()}
                >
                  Xác nhận giải quyết
                </Button>
              )}
              {action === "close" && (
                <Button
                  variant="destructive"
                  onClick={() => handleUpdateDispute("CLOSED")}
                >
                  Đóng tranh chấp
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  )
}
