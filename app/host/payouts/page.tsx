"use client"

import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Loader2, Wallet, PiggyBank, Receipt, Send } from "lucide-react"
import { toast } from "sonner"

interface HostPayoutData {
  balance: {
    available: number
    pending: number
    lifetime: number
  }
  pendingBookings: Array<{
    id: string
    amount: number
    completedAt: string | null
  }>
  payouts: Array<{
    id: string
    amount: number
    status: string
    requestedAt: string
  }>
}

const formatAmount = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Math.round(value))

export default function HostPayoutsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<HostPayoutData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedBookingIds, setSelectedBookingIds] = useState<string[]>([])

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }
    if (session?.user?.role !== "HOST" && session?.user?.role !== "ADMIN") {
      router.push("/")
      return
    }
    void loadPayouts()
  }, [status, session, router])

  const loadPayouts = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/host/payouts", { cache: "no-store" })
      if (!res.ok) {
        throw new Error("Không thể tải dữ liệu ví host")
      }
      const payload = await res.json()
      setData(payload)
      setSelectedBookingIds(payload.pendingBookings?.map((booking: any) => booking.id) ?? [])
    } catch (error) {
      console.error("Host payouts load error:", error)
      toast.error("Không thể tải dữ liệu ví host")
    } finally {
      setLoading(false)
    }
  }

  const handleToggleBooking = (bookingId: string) => {
    setSelectedBookingIds((prev) =>
      prev.includes(bookingId)
        ? prev.filter((id) => id !== bookingId)
        : [...prev, bookingId],
    )
  }

  const totalSelected = useMemo(() => {
    if (!data) return 0
    return data.pendingBookings
      .filter((booking) => selectedBookingIds.includes(booking.id))
      .reduce((sum, booking) => sum + booking.amount, 0)
  }, [data, selectedBookingIds])

  const handleRequestPayout = async () => {
    if (!data) return
    if (!selectedBookingIds.length) {
      toast.error("Vui lòng chọn ít nhất một booking để rút tiền")
      return
    }

    try {
      setSubmitting(true)
      const res = await fetch("/api/host/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookings: selectedBookingIds,
          amount: totalSelected,
        }),
      })

      const result = await res.json()
      if (!res.ok) {
        throw new Error(result.error || "Không thể tạo yêu cầu rút tiền")
      }

      toast.success("Đã gửi yêu cầu rút tiền")
      await loadPayouts()
    } catch (error) {
      console.error("Host payout submit error:", error)
      toast.error((error as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8 py-10 space-y-6">
          <div className="max-w-3xl space-y-2">
            <h1 className="font-serif text-3xl font-bold text-foreground flex items-center gap-2">
              <Wallet className="h-6 w-6 text-primary" /> Ví host
            </h1>
            <p className="text-muted-foreground">
              Theo dõi thu nhập, lịch sử rút tiền và yêu cầu thanh toán trực tiếp cho các booking đã hoàn tất.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Số dư khả dụng</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-foreground">{formatAmount(data.balance.available)}</p>
                  <p className="text-xs text-muted-foreground">Có thể yêu cầu rút ngay</p>
                </div>
                <PiggyBank className="h-8 w-8 text-primary" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Đang chờ thanh toán</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-foreground">{formatAmount(data.balance.pending)}</p>
                  <p className="text-xs text-muted-foreground">Đang xử lý bởi admin</p>
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
                  <p className="text-2xl font-bold text-foreground">{formatAmount(data.balance.lifetime)}</p>
                  <p className="text-xs text-muted-foreground">Sau khi khấu trừ phí nền tảng</p>
                </div>
                <Send className="h-8 w-8 text-emerald-500" />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Booking đủ điều kiện rút tiền</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.pendingBookings.length === 0 ? (
                <p className="text-sm text-muted-foreground">Không có booking nào đang chờ rút tiền.</p>
              ) : (
                <div className="space-y-2">
                  {data.pendingBookings.map((booking) => (
                    <label
                      key={booking.id}
                      className="flex flex-col gap-1 rounded-lg border border-muted/60 p-3 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedBookingIds.includes(booking.id)}
                          onCheckedChange={() => handleToggleBooking(booking.id)}
                        />
                        <div className="space-y-1">
                          <p className="font-semibold text-sm">Mã booking #{booking.id.slice(-6).toUpperCase()}</p>
                          <p className="text-xs text-muted-foreground">
                            Hoàn thành: {booking.completedAt ? new Date(booking.completedAt).toLocaleDateString("vi-VN") : "—"}
                          </p>
                        </div>
                      </div>
                    <p className="text-sm font-semibold text-primary">{formatAmount(booking.amount)}</p>
                    </label>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                <div>
                  <p className="text-sm text-muted-foreground">Tổng số tiền sẽ rút</p>
                  <p className="text-xl font-semibold text-foreground">{formatAmount(totalSelected)}</p>
                </div>
                <Button
                  onClick={handleRequestPayout}
                  disabled={submitting || !selectedBookingIds.length || totalSelected <= 0}
                >
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
                data.payouts.map((payout) => (
                  <div key={payout.id} className="flex items-center justify-between rounded-lg border border-muted/60 px-3 py-2 text-sm">
                    <div>
                      <p className="font-medium text-foreground">{formatAmount(payout.amount)}</p>
                      <p className="text-xs text-muted-foreground">
                        Gửi lúc {new Date(payout.requestedAt).toLocaleString("vi-VN")}
                      </p>
                    </div>
                    <Badge variant={payout.status === "PAID" ? "default" : payout.status === "REJECTED" ? "destructive" : "outline"}>
                      {payout.status}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
