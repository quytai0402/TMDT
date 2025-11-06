"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { createVietQRUrl, formatTransferReference, getBankTransferInfo } from "@/lib/payments"

interface Location {
  id: string
  city: string
  state: string
  country: string
  description?: string
}

type PaymentMethod = "MOMO" | "BANK_TRANSFER" | "CREDIT_CARD"

interface LocationExpansionDialogProps {
  trigger?: React.ReactNode | null
  onSuccess?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const EXPANSION_FEE = 500000

const PAYMENT_OPTIONS: Array<{ value: PaymentMethod; label: string; description: string }> = [
  {
    value: "MOMO",
    label: "Ví MoMo",
    description: "Thanh toán trực tiếp trong ứng dụng MoMo",
  },
  {
    value: "BANK_TRANSFER",
    label: "Chuyển khoản ngân hàng",
    description: "Chuyển khoản thủ công với thông tin LuxeStay",
  },
  {
    value: "CREDIT_CARD",
    label: "Thẻ ngân hàng",
    description: "Thanh toán bằng thẻ Visa/MasterCard",
  },
]

export function LocationExpansionDialog({
  trigger,
  onSuccess,
  open: controlledOpen,
  onOpenChange,
}: LocationExpansionDialogProps) {
  const { toast } = useToast()
  const router = useRouter()
  const { data: session } = useSession()

  const [internalOpen, setInternalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [locations, setLocations] = useState<Location[]>([])
  const [locationsLoading, setLocationsLoading] = useState(false)
  const [selectedLocationId, setSelectedLocationId] = useState("")
  const [reason, setReason] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("BANK_TRANSFER")

  const isControlled = typeof controlledOpen === "boolean"
  const open = isControlled ? controlledOpen : internalOpen

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!isControlled) {
        setInternalOpen(next)
      }
      onOpenChange?.(next)
    },
    [isControlled, onOpenChange],
  )

  const formattedFee = useMemo(() => `${new Intl.NumberFormat("en-US").format(EXPANSION_FEE)}đ`, [])
  const bankInfo = useMemo(() => getBankTransferInfo(), [])
  const transferReference = useMemo(() => {
    const source = session?.user?.id ?? "HOST"
    return formatTransferReference("LOCATION_EXPANSION", source)
  }, [session?.user?.id])

  const qrUrl = useMemo(() => createVietQRUrl(EXPANSION_FEE, transferReference, "compact"), [transferReference])

  const resetForm = useCallback(() => {
    setSelectedLocationId("")
    setReason("")
    setPaymentMethod("BANK_TRANSFER")
  }, [])

  const fetchLocations = useCallback(async () => {
    try {
      setLocationsLoading(true)
      const response = await fetch("/api/locations")
      if (!response.ok) {
        throw new Error("Không thể tải danh sách khu vực")
      }
      const data = await response.json()
      setLocations(Array.isArray(data.locations) ? data.locations : [])
    } catch (error) {
      console.error("Error fetching locations:", error)
      toast({
        title: "Không thể tải khu vực",
        description: "Vui lòng thử lại sau.",
        variant: "destructive",
      })
    } finally {
      setLocationsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (open) {
      void fetchLocations()
    } else {
      resetForm()
    }
  }, [open, fetchLocations, resetForm])

  const handleSubmit = async () => {
    if (!selectedLocationId) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng chọn khu vực bạn muốn mở rộng",
        variant: "destructive",
      })
      return
    }

    if (reason.trim().length < 20) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng mô tả lý do chi tiết hơn (ít nhất 20 ký tự)",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/host/location-expansion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationId: selectedLocationId,
          reason,
          paymentMethod,
          transferReference,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Không thể gửi yêu cầu")
      }

      toast({
        title: "Đã gửi yêu cầu",
        description: "Admin sẽ xem xét và phản hồi trong vòng 24-48 giờ",
      })

      handleOpenChange(false)

      if (data.paymentUrl) {
        router.push(data.paymentUrl)
      }

      onSuccess?.()
    } catch (error) {
      console.error("Location expansion submit error:", error)
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Vui lòng thử lại sau.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const selectedLocation = locations.find((loc) => loc.id === selectedLocationId)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Mở rộng khu vực đăng tin</DialogTitle>
          <DialogDescription>
            Thanh toán một lần để kích hoạt quyền đăng tin tại khu vực mới bạn mong muốn.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <section className="rounded-lg border border-primary/20 bg-primary/5 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Phí mở rộng khu vực</p>
                <p className="text-sm text-muted-foreground">
                  Sau khi được duyệt bạn có thể đăng tin không giới hạn tại khu vực mới.
                </p>
              </div>
              <span className="text-3xl font-semibold text-primary">{formattedFee}</span>
            </div>
            <ul className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              <li>• Quyền đăng tin không giới hạn</li>
              <li>• Hỗ trợ duyệt ưu tiên trong 24-48 giờ</li>
              <li>• Hiệu lực vĩnh viễn cho tài khoản của bạn</li>
              <li>• Hoàn tiền 100% nếu yêu cầu bị từ chối</li>
            </ul>
          </section>

          <div className="space-y-2">
            <Label htmlFor="location">Khu vực muốn mở rộng *</Label>
            <Select
              value={selectedLocationId}
              onValueChange={setSelectedLocationId}
              disabled={locationsLoading}
            >
              <SelectTrigger id="location">
                <SelectValue placeholder={locationsLoading ? "Đang tải danh sách khu vực..." : "Chọn khu vực"} />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    <span className="font-medium">{location.city}</span>
                    <span className="text-muted-foreground"> — {location.state}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedLocation?.description ? (
              <p className="text-sm text-muted-foreground">{selectedLocation.description}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Lý do mở rộng *</Label>
            <Textarea
              id="reason"
              placeholder="Mô tả sơ bộ lượng phòng, tiềm năng khu vực và kế hoạch vận hành của bạn"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={4}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">Tối thiểu 20 ký tự — hiện tại: {reason.trim().length} ký tự</p>
          </div>

          <div className="space-y-2">
            <Label>Phương thức thanh toán *</Label>
            <div className="grid gap-2 md:grid-cols-3">
              {PAYMENT_OPTIONS.map((option) => {
                const isActive = paymentMethod === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPaymentMethod(option.value)}
                    className={`rounded-lg border px-4 py-3 text-left transition ${
                      isActive ? "border-primary bg-primary/5" : "border-border hover:border-primary"
                    }`}
                  >
                    <div className="text-sm font-semibold text-foreground">{option.label}</div>
                    <p className="mt-1 text-xs text-muted-foreground">{option.description}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {paymentMethod === "BANK_TRANSFER" ? (
            <section className="space-y-4 rounded-lg border bg-muted/30 p-4">
              <div className="space-y-1 text-sm">
                <p className="font-semibold text-muted-foreground">Thông tin chuyển khoản</p>
                <p className="text-foreground">{bankInfo.accountName}</p>
                <p className="text-foreground">Số tài khoản: {bankInfo.accountNumber}</p>
                <p className="text-muted-foreground">Ngân hàng: {bankInfo.bankName}</p>
                {bankInfo.branch ? <p className="text-muted-foreground">Chi nhánh: {bankInfo.branch}</p> : null}
              </div>
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px] md:items-center">
                <div className="space-y-2 text-sm">
                  <p className="font-semibold text-muted-foreground">Nội dung chuyển khoản</p>
                  <code className="inline-flex rounded-md border bg-background px-3 py-2 text-sm font-semibold tracking-wider text-primary">
                    {transferReference}
                  </code>
                  <p className="text-xs text-muted-foreground">
                    Mỗi host có nội dung riêng để hệ thống khớp lệnh nhanh chóng. Đừng chỉnh sửa mã này.
                  </p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="rounded-lg border bg-white p-2">
                    <img
                      src={qrUrl}
                      alt={`VietQR chuyển khoản ${transferReference}`}
                      width={200}
                      height={200}
                      className="h-auto w-[200px]"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Quét mã để điền sẵn {formattedFee} và mã {transferReference}
                  </p>
                </div>
              </div>
            </section>
          ) : null}

          <section className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Quy trình phê duyệt</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>Yêu cầu được chuyển tới đội vận hành trong vòng vài phút.</li>
              <li>Admin xác thực thanh toán và phê duyệt trong 24-48 giờ.</li>
              <li>Bạn nhận thông báo ngay khi yêu cầu được duyệt hoặc cần bổ sung thông tin.</li>
              <li>Hoàn tiền 100% nếu yêu cầu bị từ chối.</li>
            </ol>
          </section>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Đang xử lý..." : `Thanh toán ${formattedFee}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
