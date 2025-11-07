"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  Loader2,
  Wallet,
  PiggyBank,
  Receipt,
  Send,
  AlertTriangle,
  CreditCard,
  ExternalLink,
} from "lucide-react"

import { HostLayout } from "@/components/host-layout"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { VIETNAMESE_BANKS, getBankVietQrCode } from "@/lib/banks"
import { cn } from "@/lib/utils"

type PendingBooking = {
  id: string
  amount: number
  commission: number
  grossAmount: number
  completedAt?: string | null
}

type PayoutHistoryItem = {
  id: string
  amount: number
  feeAmount?: number | null
  grossAmount?: number | null
  status: string
  requestedAt: string
  processedAt?: string | null
}

type PayoutAccount = {
  bankName: string
  bankBranch?: string | null
  accountNumber: string
  accountName: string
  qrCodeImage?: string | null
  taxId?: string | null
  notes?: string | null
}

type HostPayoutResponse = {
  balance: {
    available: number
    pending: number
    lifetime: number
  }
  pendingBookings: PendingBooking[]
  payouts: PayoutHistoryItem[]
  requiresPayoutSetup: boolean
  payoutAccount: PayoutAccount | null
}

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
})

const formatCurrency = (value: number) => currencyFormatter.format(Math.max(0, Math.round(value)))

const statusLabelMap: Record<string, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  PAID: "Đã thanh toán",
  REJECTED: "Từ chối",
}

type BadgeVariant = "default" | "secondary" | "destructive" | "outline"

const statusVariantMap: Record<string, BadgeVariant> = {
  PENDING: "outline",
  APPROVED: "secondary",
  PAID: "default",
  REJECTED: "destructive",
}

const normalizeAccountHolderName = (value: string) =>
  value
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")

const buildVietQrImageUrl = (bankCode: string, accountNumber: string, accountName: string) => {
  const sanitizedNumber = accountNumber.replace(/\D/g, "")
  if (!sanitizedNumber) return null
  const sanitizedName = normalizeAccountHolderName(accountName)
  if (!sanitizedName) return null
  const params = new URLSearchParams()
  params.set("accountName", sanitizedName)
  params.set("addInfo", sanitizedName)
  return `https://img.vietqr.io/image/${bankCode}-${sanitizedNumber}-compact.png?${params.toString()}`
}

export default function HostPayoutsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [data, setData] = useState<HostPayoutResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedBookingIds, setSelectedBookingIds] = useState<string[]>([])
  const [accountModalOpen, setAccountModalOpen] = useState(false)
  const [accountSaving, setAccountSaving] = useState(false)
  const [accountForm, setAccountForm] = useState({
    bankName: "",
    bankBranch: "",
    accountNumber: "",
    accountName: "",
    qrCodeImage: "",
    taxId: "",
    notes: "",
  })

  const loadPayouts = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/host/payouts", { cache: "no-store" })
      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error ?? "Không thể tải dữ liệu ví host")
      }
      const payload = (await response.json()) as HostPayoutResponse
      setData({
        balance: payload.balance,
        pendingBookings: Array.isArray(payload.pendingBookings) ? payload.pendingBookings : [],
        payouts: Array.isArray(payload.payouts) ? payload.payouts : [],
        requiresPayoutSetup: Boolean(payload.requiresPayoutSetup),
        payoutAccount: payload.payoutAccount ?? null,
      })
      setSelectedBookingIds(
        Array.isArray(payload.pendingBookings) ? payload.pendingBookings.map((booking) => booking.id) : [],
      )
    } catch (error) {
      console.error("Host payouts load error:", error)
      toast({
        title: "Không thể tải ví host",
        description: error instanceof Error ? error.message : "Vui lòng thử lại sau.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") {
      router.replace("/login")
      return
    }
    if (session?.user?.role !== "HOST") {
      router.replace("/")
      return
    }
    void loadPayouts()
  }, [status, session, router, loadPayouts])

  const handleToggleBooking = (bookingId: string) => {
    setSelectedBookingIds((prev) =>
      prev.includes(bookingId) ? prev.filter((id) => id !== bookingId) : [...prev, bookingId],
    )
  }

  const handleToggleAll = () => {
    if (!data) return
    const allIds = data.pendingBookings.map((booking) => booking.id)
    const isAllSelected = selectedBookingIds.length === allIds.length
    setSelectedBookingIds(isAllSelected ? [] : allIds)
  }

  useEffect(() => {
    if (!data?.payoutAccount) return
    const account = data.payoutAccount
    setAccountForm({
      bankName: account.bankName ?? "",
      bankBranch: account.bankBranch ?? "",
      accountNumber: account.accountNumber ?? "",
      accountName: account.accountName ?? "",
      qrCodeImage: account.qrCodeImage ?? "",
      taxId: account.taxId ?? "",
      notes: account.notes ?? "",
    })
  }, [data?.payoutAccount])

  const handleAccountChange = (field: keyof typeof accountForm, value: string) => {
    setAccountForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const selectedBankVietQrCode = useMemo(() => {
    if (!accountForm.bankName) return null
    return getBankVietQrCode(accountForm.bankName) ?? null
  }, [accountForm.bankName])

  const generatedQrUrl = useMemo(() => {
    if (!selectedBankVietQrCode) return null
    if (!accountForm.accountNumber.trim() || !accountForm.accountName.trim()) return null
    return buildVietQrImageUrl(
      selectedBankVietQrCode,
      accountForm.accountNumber,
      accountForm.accountName,
    )
  }, [selectedBankVietQrCode, accountForm.accountNumber, accountForm.accountName])

  const qrPreviewUrl = generatedQrUrl || (accountForm.qrCodeImage || null)
  const bankSupportsAutoQr = Boolean(accountForm.bankName && selectedBankVietQrCode)

  const handleCopyQrLink = useCallback(() => {
    if (!qrPreviewUrl) return
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      toast({
        title: "Không thể sao chép",
        description: "Trình duyệt của bạn không hỗ trợ sao chép tự động.",
        variant: "destructive",
      })
      return
    }

    navigator.clipboard
      .writeText(qrPreviewUrl)
      .then(() =>
        toast({
          title: "Đã sao chép link QR",
          description: "Bạn có thể gửi link này cho admin nếu cần.",
        }),
      )
      .catch(() =>
        toast({
          title: "Sao chép thất bại",
          description: "Vui lòng thử lại hoặc mở ảnh QR để tải xuống.",
          variant: "destructive",
        }),
      )
  }, [qrPreviewUrl, toast])

  const handleSaveAccount = async () => {
    if (!accountForm.bankName || !accountForm.accountNumber || !accountForm.accountName) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng chọn ngân hàng và điền đầy đủ số tài khoản, tên tài khoản.",
        variant: "destructive",
      })
      return
    }

    try {
      setAccountSaving(true)
      const qrCodeImage = qrPreviewUrl || undefined
      const response = await fetch("/api/host/payout-account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankName: accountForm.bankName,
          bankBranch: accountForm.bankBranch || undefined,
          accountNumber: accountForm.accountNumber,
          accountName: accountForm.accountName,
          qrCodeImage,
          taxId: accountForm.taxId || undefined,
          notes: accountForm.notes || undefined,
        }),
      })

      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(payload?.error ?? "Không thể cập nhật thông tin thanh toán")
      }

      toast({
        title: "Đã lưu thông tin thanh toán",
        description: "Admin sẽ sử dụng thông tin này để chuyển khoản trong các lần rút tiền.",
      })

      setAccountModalOpen(false)
      await loadPayouts()
    } catch (error) {
      console.error("Host payout account update error:", error)
      toast({
        title: "Cập nhật thất bại",
        description: error instanceof Error ? error.message : "Vui lòng thử lại sau.",
        variant: "destructive",
      })
    } finally {
      setAccountSaving(false)
    }
  }

  const selectedBookings = useMemo(() => {
    if (!data) return [] as PendingBooking[]
    return data.pendingBookings.filter((booking) => selectedBookingIds.includes(booking.id))
  }, [data, selectedBookingIds])

  const totalSelectedNet = useMemo(
    () => selectedBookings.reduce((sum, booking) => sum + booking.amount, 0),
    [selectedBookings],
  )

  const totalSelectedCommission = useMemo(
    () => selectedBookings.reduce((sum, booking) => sum + booking.commission, 0),
    [selectedBookings],
  )

  const totalSelectedGross = totalSelectedNet + totalSelectedCommission

  const handleRequestPayout = async () => {
    if (!data) return

    if (!selectedBookingIds.length) {
      toast({
        title: "Chưa chọn booking",
        description: "Vui lòng chọn tối thiểu một booking để gửi yêu cầu rút tiền.",
        variant: "destructive",
      })
      return
    }

    if (data.requiresPayoutSetup) {
      toast({
        title: "Thiếu thông tin thanh toán",
        description: "Cập nhật tài khoản ngân hàng trong phần Cài đặt trước khi yêu cầu.",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch("/api/host/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookings: selectedBookingIds,
          amount: totalSelectedNet,
        }),
      })

      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(payload?.error ?? "Không thể gửi yêu cầu rút tiền")
      }

      toast({
        title: "Đã gửi yêu cầu",
        description: "Đội ngũ admin sẽ xử lý yêu cầu rút tiền trong thời gian sớm nhất.",
      })

      await loadPayouts()
    } catch (error) {
      console.error("Host payout submit error:", error)
      toast({
        title: "Không thể gửi yêu cầu",
        description: error instanceof Error ? error.message : "Vui lòng thử lại sau.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  if (status === "unauthenticated" || session?.user?.role !== "HOST") {
    return null
  }

  return (
    <HostLayout>
      {loading ? (
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : data ? (
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="flex items-center gap-2 font-serif text-3xl font-bold text-foreground">
              <Wallet className="h-6 w-6 text-primary" /> Ví host
            </h1>
            <p className="text-muted-foreground">
              Theo dõi thu nhập, kiểm tra phí nền tảng 10% và gửi yêu cầu rút tiền tới đội ngũ admin.
            </p>
          </div>

          {data.requiresPayoutSetup ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Chưa hoàn thành thông tin thanh toán</AlertTitle>
              <AlertDescription className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <span>
                  Cập nhật thông tin ngân hàng và mã QR trước khi gửi yêu cầu rút tiền để admin xử lý nhanh chóng.
                </span>
                <Button variant="secondary" onClick={() => setAccountModalOpen(true)}>
                  <CreditCard className="mr-2 h-4 w-4" /> Cập nhật ngay
                </Button>
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Số dư khả dụng</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(data.balance.available)}</p>
                  <p className="text-xs text-muted-foreground">Có thể rút ngay</p>
                </div>
                <PiggyBank className="h-8 w-8 text-primary" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Đang chờ xử lý</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(data.balance.pending)}</p>
                  <p className="text-xs text-muted-foreground">Chờ duyệt bởi admin</p>
                </div>
                <Receipt className="h-8 w-8 text-orange-500" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Tổng thu nhập</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(data.balance.lifetime)}</p>
                  <p className="text-xs text-muted-foreground">Đã trừ phí nền tảng 10%</p>
                </div>
                <Send className="h-8 w-8 text-emerald-500" />
              </CardContent>
            </Card>
          </div>

          {data.payoutAccount ? (
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle>Thông tin nhận tiền</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1 text-sm">
                  <p className="font-semibold text-foreground">
                    {data.payoutAccount.accountName} — {data.payoutAccount.bankName}
                  </p>
                  <p className="text-muted-foreground">
                    STK: <span className="font-medium text-foreground">{data.payoutAccount.accountNumber}</span>
                    {data.payoutAccount.bankBranch ? ` • ${data.payoutAccount.bankBranch}` : ""}
                  </p>
                  {data.payoutAccount.taxId ? (
                    <p className="text-xs text-muted-foreground">Mã số thuế: {data.payoutAccount.taxId}</p>
                  ) : null}
                  {data.payoutAccount.notes ? (
                    <p className="text-xs text-muted-foreground">Ghi chú: {data.payoutAccount.notes}</p>
                  ) : null}
                </div>
                <div className="flex items-center gap-3">
                  {data.payoutAccount.qrCodeImage ? (
                    <a
                      href={data.payoutAccount.qrCodeImage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-primary underline"
                    >
                      Xem mã QR <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : (
                    <span className="text-sm text-muted-foreground">Chưa đính kèm QR code</span>
                  )}
                  <Button variant="outline" size="sm" onClick={() => setAccountModalOpen(true)}>
                    Cập nhật
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Booking đủ điều kiện rút tiền</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Chỉ những booking đã hoàn tất mới hiển thị tại đây. Phí nền tảng 10% đã được tính tự động.
                </p>
              </div>
              {data.pendingBookings.length > 0 ? (
                <Button variant="ghost" size="sm" onClick={handleToggleAll}>
                  {selectedBookingIds.length === data.pendingBookings.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                </Button>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-4">
              {data.pendingBookings.length === 0 ? (
                <div className="rounded-lg border border-dashed border-muted-foreground/30 p-6 text-center text-sm text-muted-foreground">
                  Không có booking nào đang chờ rút tiền.
                </div>
              ) : (
                <div className="space-y-2">
                  {data.pendingBookings.map((booking) => {
                    const selected = selectedBookingIds.includes(booking.id)
                    const bookingLabel = `#${booking.id.slice(-6).toUpperCase()}`
                    return (
                      <label
                        key={booking.id}
                        className={cn(
                          "flex flex-col gap-3 rounded-lg border px-3 py-3 transition md:flex-row md:items-center md:justify-between",
                          selected ? "border-primary/60 bg-primary/5" : "border-muted/60",
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selected}
                            disabled={data.requiresPayoutSetup}
                            onCheckedChange={() => handleToggleBooking(booking.id)}
                          />
                          <div className="space-y-1 text-sm">
                            <p className="font-semibold text-foreground">Mã booking {bookingLabel}</p>
                            <p className="text-xs text-muted-foreground">
                              Hoàn thành: {booking.completedAt ? new Date(booking.completedAt).toLocaleDateString("vi-VN") : "—"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Tổng: {formatCurrency(booking.grossAmount)} • Phí 10%: {formatCurrency(booking.commission)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right text-sm">
                          <p className="font-semibold text-primary">{formatCurrency(booking.amount)}</p>
                          <p className="text-xs text-muted-foreground">Số tiền nhận sau khi trừ phí</p>
                        </div>
                      </label>
                    )
                  })}
                </div>
              )}

              <Separator />

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1 text-sm">
                  <p className="text-muted-foreground">Tổng tiền rút</p>
                  <p className="text-2xl font-semibold text-foreground">{formatCurrency(totalSelectedNet)}</p>
                  <p className="text-xs text-muted-foreground">
                    Tổng sau phí: {formatCurrency(totalSelectedNet)} • Phí nền tảng 10%: <span className="font-medium text-foreground">{formatCurrency(totalSelectedCommission)}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">Tổng giá trị booking: {formatCurrency(totalSelectedGross)}</p>
                </div>
                <Button
                  onClick={handleRequestPayout}
                  disabled={
                    submitting ||
                    data.requiresPayoutSetup ||
                    !selectedBookingIds.length ||
                    totalSelectedNet <= 0
                  }
                >
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Gửi yêu cầu rút tiền
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lịch sử yêu cầu rút tiền</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.payouts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa có yêu cầu nào.</p>
              ) : (
                data.payouts.map((payout) => {
                  const status = payout.status ?? "PENDING"
                  const badgeVariant = statusVariantMap[status] ?? "outline"
                  const statusLabel = statusLabelMap[status] ?? status
                  return (
                    <div
                      key={payout.id}
                      className="flex flex-col gap-2 rounded-lg border border-muted/60 px-3 py-3 text-sm md:flex-row md:items-center md:justify-between"
                    >
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">{formatCurrency(payout.amount)}</p>
                        <p className="text-xs text-muted-foreground">
                          Gửi lúc {new Date(payout.requestedAt).toLocaleString("vi-VN")}
                        </p>
                        {typeof payout.feeAmount === "number" ? (
                          <p className="text-xs text-muted-foreground">
                            Phí nền tảng ghi nhận: {formatCurrency(payout.feeAmount)}
                          </p>
                        ) : null}
                        {payout.processedAt ? (
                          <p className="text-xs text-muted-foreground">
                            Xử lý lúc {new Date(payout.processedAt).toLocaleString("vi-VN")}
                          </p>
                        ) : null}
                      </div>
                      <Badge variant={badgeVariant}>{statusLabel}</Badge>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertTitle>Không thể hiển thị dữ liệu</AlertTitle>
            <AlertDescription>
              Dữ liệu ví host chưa sẵn sàng. Vui lòng thử tải lại trang hoặc liên hệ đội ngũ hỗ trợ.
            </AlertDescription>
          </Alert>
          <Button onClick={loadPayouts}>Thử tải lại</Button>
        </div>
      )}

      <Dialog open={accountModalOpen} onOpenChange={(open) => !accountSaving && setAccountModalOpen(open)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Thông tin tài khoản ngân hàng</DialogTitle>
            <DialogDescription>
              LuxeStay sử dụng thông tin này để chuyển khoản khi yêu cầu rút tiền được admin phê duyệt.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Ngân hàng</label>
              <Select
                value={accountForm.bankName}
                onValueChange={(value) => handleAccountChange("bankName", value)}
                disabled={accountSaving}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn ngân hàng" />
                </SelectTrigger>
                <SelectContent>
                  {VIETNAMESE_BANKS.map((bank) => (
                    <SelectItem key={bank.code} value={bank.shortName}>
                      {bank.shortName} — {bank.name}
                    </SelectItem>
                  ))}
                  {accountForm.bankName &&
                    !VIETNAMESE_BANKS.some(
                      (bank) => bank.shortName === accountForm.bankName || bank.name === accountForm.bankName,
                    ) && (
                      <SelectItem value={accountForm.bankName}>
                        {accountForm.bankName} (tùy chỉnh)
                      </SelectItem>
                    )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Số tài khoản</label>
                <Input
                  value={accountForm.accountNumber}
                  onChange={(event) => handleAccountChange("accountNumber", event.target.value)}
                  placeholder="Ví dụ: 0123456789"
                  disabled={accountSaving}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Tên chủ tài khoản</label>
                <Input
                  value={accountForm.accountName}
                  onChange={(event) => handleAccountChange("accountName", event.target.value)}
                  placeholder="Tên trùng CMND/CCCD"
                  disabled={accountSaving}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Chi nhánh (tuỳ chọn)</label>
                <Input
                  value={accountForm.bankBranch}
                  onChange={(event) => handleAccountChange("bankBranch", event.target.value)}
                  placeholder="Ví dụ: Hội sở Hà Nội"
                  disabled={accountSaving}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Mã số thuế (tuỳ chọn)</label>
                <Input
                  value={accountForm.taxId}
                  onChange={(event) => handleAccountChange("taxId", event.target.value)}
                  placeholder="Nhập MST nếu có"
                  disabled={accountSaving}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Mã VietQR chuyển khoản</label>
              {qrPreviewUrl ? (
                <div className="space-y-3 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-4">
                  <div className="flex items-center justify-between text-xs">
                    <Badge variant={generatedQrUrl ? "secondary" : "outline"}>
                      {generatedQrUrl ? "Tự động tạo từ VietQR" : "Đang dùng QR đã lưu"}
                    </Badge>
                    {accountForm.bankName ? (
                      <span className="text-muted-foreground">
                        {accountForm.bankName} • {accountForm.accountNumber}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <img
                      src={qrPreviewUrl}
                      alt="Mã VietQR chuyển khoản"
                      className="h-36 w-36 rounded-md border border-border bg-white p-2"
                    />
                    <p className="text-[11px] text-muted-foreground text-center">
                      LuxeStay sẽ sử dụng mã này để chuyển khoản nhanh khi duyệt rút tiền.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={handleCopyQrLink}>
                        Sao chép link
                      </Button>
                      <Button variant="secondary" size="sm" asChild>
                        <a href={qrPreviewUrl} target="_blank" rel="noreferrer">
                          Mở ảnh QR
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-muted px-3 py-3 text-xs text-muted-foreground">
                  Nhập số tài khoản, tên chủ tài khoản và chọn ngân hàng hỗ trợ VietQR để hệ thống tự tạo mã.
                  {!bankSupportsAutoQr && accountForm.bankName ? (
                    <div className="mt-2 text-destructive">
                      Ngân hàng này hiện chưa hỗ trợ VietQR tự động. Admin sẽ chuyển khoản thủ công theo thông tin phía trên.
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Ghi chú cho admin (tuỳ chọn)</label>
              <Textarea
                value={accountForm.notes}
                onChange={(event) => handleAccountChange("notes", event.target.value)}
                placeholder="Ví dụ: Ưu tiên chuyển trước 12h, nếu chuyển qua số điện thoại thì liên hệ trước."
                disabled={accountSaving}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAccountModalOpen(false)} disabled={accountSaving}>
              Huỷ
            </Button>
            <Button onClick={handleSaveAccount} disabled={accountSaving}>
              {accountSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Lưu thông tin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </HostLayout>
  )
}
