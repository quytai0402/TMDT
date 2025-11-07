"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Loader2, RefreshCw, ShieldCheck, CheckCheck, XCircle } from "lucide-react"

import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

type PayoutStatus = "PENDING" | "APPROVED" | "REJECTED" | "PAID"

type PayoutAccountSnapshot = {
  bankName?: string | null
  bankBranch?: string | null
  accountNumber?: string | null
  accountName?: string | null
  qrCodeImage?: string | null
  taxId?: string | null
}

type AdminPayout = {
  id: string
  hostId: string
  amount: number
  feeAmount?: number | null
  grossAmount?: number | null
  payoutMethod?: string | null
  notes?: string | null
  adminNotes?: string | null
  bookingIds: string[]
  accountSnapshot?: PayoutAccountSnapshot | null
  status: PayoutStatus
  requestedAt: string
  processedAt?: string | null
  host: {
    id: string
    name: string | null
    email: string | null
  }
}

type PayoutSummary = {
  total: number
  pending: { count: number; amount: number }
  approved: { count: number; amount: number }
  paid: { count: number; amount: number }
  rejected: { count: number; amount: number }
}

const statusOptions: Array<{ label: string; value: "ALL" | PayoutStatus }> = [
  { label: "Tất cả", value: "ALL" },
  { label: "Chờ duyệt", value: "PENDING" },
  { label: "Đã duyệt", value: "APPROVED" },
  { label: "Đã thanh toán", value: "PAID" },
  { label: "Từ chối", value: "REJECTED" },
]

const statusLabelMap: Record<PayoutStatus, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  PAID: "Đã thanh toán",
  REJECTED: "Từ chối",
}

const statusVariantMap: Record<PayoutStatus, "default" | "secondary" | "outline" | "destructive"> = {
  PENDING: "outline",
  APPROVED: "secondary",
  PAID: "default",
  REJECTED: "destructive",
}

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
})

const formatCurrency = (value?: number | null) =>
  currencyFormatter.format(Math.max(0, Math.round(value ?? 0)))

export default function AdminPayoutsPage() {
  const [statusFilter, setStatusFilter] = useState<(typeof statusOptions)[number]["value"]>("ALL")
  const [payouts, setPayouts] = useState<AdminPayout[]>([])
  const [summary, setSummary] = useState<PayoutSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const { toast } = useToast()

  const loadPayouts = useCallback(async () => {
    try {
      setLoading(true)
      const query = statusFilter === "ALL" ? "" : `?status=${statusFilter}`
      const [listResponse, summaryResponse] = await Promise.all([
        fetch(`/api/admin/payouts${query}`, { cache: "no-store", credentials: "include" }),
        fetch("/api/admin/payouts?summary=true", { cache: "no-store", credentials: "include" }),
      ])

      const listPayload = await listResponse.json()
      if (!listResponse.ok) {
        if (listResponse.status === 401) {
          throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để xem yêu cầu rút tiền.")
        }
        if (listResponse.status === 403) {
          throw new Error("Bạn không có quyền truy cập mục quản lý rút tiền.")
        }
        throw new Error(listPayload?.error ?? "Không thể tải danh sách yêu cầu rút tiền")
      }
      setPayouts(Array.isArray(listPayload?.payouts) ? listPayload.payouts : [])

      if (summaryResponse.ok) {
        const summaryPayload = await summaryResponse.json().catch(() => null)
        if (summaryPayload?.summary) {
          setSummary(summaryPayload.summary as PayoutSummary)
        }
      }
    } catch (error) {
      console.error("Admin payout load error:", error)
      toast({
        title: "Không thể tải dữ liệu",
        description: error instanceof Error ? error.message : "Vui lòng thử lại sau.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [statusFilter, toast])

  useEffect(() => {
    void loadPayouts()
  }, [loadPayouts])

  const handleAction = async (payoutId: string, action: "APPROVE" | "REJECT" | "PAY") => {
    const confirmMessage =
      action === "APPROVE"
        ? "Phê duyệt yêu cầu này?"
        : action === "REJECT"
        ? "Từ chối yêu cầu và hoàn trả số dư?"
        : "Đánh dấu đã thanh toán yêu cầu này?"

    if (!window.confirm(confirmMessage)) return

    try {
      setActionLoading(payoutId)
      const response = await fetch("/api/admin/payouts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payoutId, action }),
        credentials: "include",
      })

      const payload = await response.json()
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.")
        }
        if (response.status === 403) {
          throw new Error("Bạn không có quyền thực hiện thao tác này.")
        }
        throw new Error(payload?.error ?? "Không thể cập nhật trạng thái")
      }

      toast({
        title: "Đã cập nhật yêu cầu",
        description: `Yêu cầu #${payoutId.slice(-6)} đã được cập nhật.`,
      })

      await loadPayouts()
    } catch (error) {
      console.error("Payout action error:", error)
      toast({
        title: "Cập nhật thất bại",
        description: error instanceof Error ? error.message : "Vui lòng thử lại.",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const stats = useMemo(
    () => ({
      PENDING: summary?.pending.count ?? 0,
      APPROVED: summary?.approved.count ?? 0,
      PAID: summary?.paid.count ?? 0,
      REJECTED: summary?.rejected.count ?? 0,
    }),
    [summary],
  )

  const pendingAmountLabel = formatCurrency(summary?.pending.amount ?? 0)
  const paidAmountLabel = formatCurrency(summary?.paid.amount ?? 0)
  const totalRequests = summary?.total ?? payouts.length

  return (
    <AdminLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Yêu cầu rút tiền</h1>
          <p className="text-muted-foreground">
            Quản lý các yêu cầu chuyển khoản từ host, hướng dẫn viên và đối tác.
          </p>
        </div>
        <Button variant="outline" onClick={() => loadPayouts()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Tải lại
        </Button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statusOptions
          .filter((option) => option.value !== "ALL")
          .map((option) => (
            <Card
              key={option.value}
              className={cn(
                "cursor-pointer transition-colors",
                statusFilter === option.value ? "border-primary shadow-sm" : "",
              )}
              onClick={() => setStatusFilter(option.value)}
            >
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="text-sm text-muted-foreground">{option.label}</p>
                  <p className="text-2xl font-semibold">
                    {stats[(option.value as PayoutStatus)] ?? 0}
                  </p>
                </div>
                <Badge variant={statusVariantMap[option.value as PayoutStatus]}>
                  {statusLabelMap[option.value as PayoutStatus]}
                </Badge>
              </CardContent>
            </Card>
          ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-dashed border-primary/30 bg-primary/5 px-4 py-3 text-sm">
        <div>
          <p className="text-muted-foreground">Tổng tiền đang chờ giải ngân</p>
          <p className="text-lg font-semibold text-primary">{pendingAmountLabel}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Đã thanh toán trong chu kỳ gần nhất</p>
          <p className="text-base font-semibold text-emerald-600">{paidAmountLabel}</p>
        </div>
      </div>

      <section className="mt-8 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => (
              <Button
                key={option.value}
                variant={statusFilter === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Tổng cộng: <span className="font-semibold">{totalRequests}</span> yêu cầu
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Đang tải dữ liệu...
          </div>
        ) : payouts.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Hiện không có yêu cầu nào phù hợp với bộ lọc.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {payouts.map((payout) => {
              const statusLabel = statusLabelMap[payout.status] ?? payout.status
              const account = payout.accountSnapshot
              return (
                <Card key={payout.id} className="border border-border/70">
                  <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">
                        {formatCurrency(payout.amount)}
                        <span className="text-sm text-muted-foreground"> • #{payout.id.slice(-8)}</span>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Host: {payout.host.name ?? payout.host.email ?? payout.host.id}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Gửi lúc {new Date(payout.requestedAt).toLocaleString("vi-VN")}
                        {payout.processedAt
                          ? ` • Xử lý ${new Date(payout.processedAt).toLocaleString("vi-VN")}`
                          : ""}
                      </p>
                    </div>
                    <Badge variant={statusVariantMap[payout.status]}>{statusLabel}</Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="rounded-lg border border-dashed px-3 py-2 text-sm">
                        <p className="text-xs uppercase text-muted-foreground">Ngân hàng</p>
                        <p className="font-medium">
                          {account?.bankName ?? "Chưa cung cấp"}
                          {account?.bankBranch ? ` • ${account.bankBranch}` : ""}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          STK: <span className="font-medium">{account?.accountNumber ?? "—"}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Chủ TK: <span className="font-medium">{account?.accountName ?? "—"}</span>
                        </p>
                      </div>
                      <div className="rounded-lg border border-dashed px-3 py-2 text-sm">
                        <p className="text-xs uppercase text-muted-foreground">Chi tiết</p>
                        <p>Hoa hồng: {formatCurrency(payout.feeAmount)}</p>
                        <p>Gross: {formatCurrency(payout.grossAmount)}</p>
                        {payout.bookingIds?.length ? (
                          <p className="text-xs text-muted-foreground">
                            {payout.bookingIds.length} booking đính kèm
                          </p>
                        ) : null}
                      </div>
                      <div className="rounded-lg border border-dashed px-3 py-2 text-sm space-y-1">
                        <p className="text-xs uppercase text-muted-foreground">Ghi chú</p>
                        <p>{payout.notes || "—"}</p>
                        {payout.adminNotes ? (
                          <p className="text-xs text-muted-foreground">Admin: {payout.adminNotes}</p>
                        ) : null}
                        {account?.qrCodeImage ? (
                          <Button variant="link" size="sm" className="px-0" asChild>
                            <a href={account.qrCodeImage} target="_blank" rel="noreferrer">
                              Mở mã VietQR
                            </a>
                          </Button>
                        ) : null}
                      </div>
                    </div>

                    <Separator />

                    <div className="flex flex-wrap gap-2">
                      {payout.status === "PENDING" && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleAction(payout.id, "APPROVE")}
                          disabled={actionLoading === payout.id}
                        >
                          <ShieldCheck className="mr-2 h-4 w-4" />
                          Phê duyệt
                        </Button>
                      )}
                      {payout.status !== "PAID" && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleAction(payout.id, "PAY")}
                          disabled={actionLoading === payout.id}
                        >
                          <CheckCheck className="mr-2 h-4 w-4" />
                          Đánh dấu đã thanh toán
                        </Button>
                      )}
                      {payout.status !== "PAID" && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleAction(payout.id, "REJECT")}
                          disabled={actionLoading === payout.id}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Từ chối
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </section>
    </AdminLayout>
  )
}
