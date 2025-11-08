import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createVietQRUrl, formatTransferReference, getBankTransferInfo } from "@/lib/payments"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getFallbackLocationById } from "@/lib/fallback-locations"

const STATUS_BADGE_MAP: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  PENDING: { label: "Đang chờ thanh toán", variant: "secondary" },
  COMPLETED: { label: "Đã hoàn tất", variant: "default" },
  FAILED: { label: "Thanh toán thất bại", variant: "destructive" },
  CANCELLED: { label: "Đã hủy", variant: "outline" },
}

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
})

const BANK_INFO = getBankTransferInfo()

const extractTransferReference = (description?: string | null): string | null => {
  if (!description) {
    return null
  }
  const parts = description.split("•")
  if (parts.length < 2) {
    return null
  }
  const lastPart = parts[parts.length - 1]?.trim()
  return lastPart && lastPart.length >= 6 ? lastPart.replace(/\s+/g, "") : null
}

const formatDateTime = (value: Date) =>
  new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value)

export default async function TransactionDetailPage({
  params,
}: {
  params: { transactionId: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect(`/login?callbackUrl=/payments/${params.transactionId}`)
  }

  const transaction = await prisma.transaction.findUnique({
    where: { id: params.transactionId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })

  if (!transaction) {
    notFound()
  }

  const isOwner = transaction.userId === session.user.id
  const isAdmin = session.user.role === "ADMIN"

  if (!isOwner && !isAdmin) {
    notFound()
  }

  let locationLabel: string | null = null
  if (transaction.type === "LOCATION_EXPANSION" && transaction.referenceId) {
    const fallbackLocation = getFallbackLocationById(transaction.referenceId)
    if (fallbackLocation) {
      const parts = [fallbackLocation.city, fallbackLocation.state, fallbackLocation.country].filter(Boolean)
      locationLabel = parts.join(", ")
    } else {
      const location = await prisma.location.findUnique({
        where: { id: transaction.referenceId },
        select: {
          city: true,
          state: true,
          country: true,
        },
      })
      if (location) {
        const parts = [location.city, location.state, location.country].filter(Boolean)
        locationLabel = parts.join(", ")
      }
    }
  }

  const statusMeta = STATUS_BADGE_MAP[transaction.status] ?? {
    label: transaction.status,
    variant: "secondary" as const,
  }

  const parsedReference = extractTransferReference(transaction.description)
  const fallbackReference = formatTransferReference(
    transaction.type === "LOCATION_EXPANSION" ? "LOCATION_EXPANSION" : "BOOKING",
    (transaction.referenceId ?? transaction.id).slice(-8).toUpperCase()
  )
  const transferReference = parsedReference || fallbackReference
  const qrUrl = createVietQRUrl(transaction.amount, transferReference)

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">
              <Link href="/host/dashboard" className="underline">Quay lại bảng điều khiển</Link>
            </p>
            <h1 className="mt-2 text-3xl font-semibold">Chi tiết thanh toán</h1>
            <p className="text-muted-foreground">
              Theo dõi trạng thái giao dịch và hướng dẫn chuyển khoản cho yêu cầu của bạn.
            </p>
          </div>
          <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
        </div>

        {transaction.status === "PENDING" ? (
          <Alert className="border-amber-200 bg-amber-50 text-amber-700">
            <AlertDescription>
              Vui lòng hoàn tất chuyển khoản với nội dung <span className="font-semibold">{transferReference}</span> để yêu cầu được xử lý.
              Bộ phận vận hành sẽ xác nhận trong vòng 24-48 giờ sau khi nhận thanh toán.
            </AlertDescription>
          </Alert>
        ) : null}

        {transaction.status === "COMPLETED" ? (
          <Alert className="border-green-200 bg-green-50 text-green-700">
            <AlertDescription>
              Thanh toán đã được xác nhận. Cảm ơn bạn! Nếu cần hỗ trợ thêm, vui lòng liên hệ đội chăm sóc host.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin giao dịch</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Số tiền</span>
                <span className="text-lg font-semibold text-foreground">{currencyFormatter.format(transaction.amount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Loại giao dịch</span>
                <span className="font-medium text-foreground">{transaction.type.replace(/_/g, " ")}</span>
              </div>
              {locationLabel ? (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Khu vực đăng ký</span>
                  <span className="font-medium text-foreground">{locationLabel}</span>
                </div>
              ) : null}
              {transaction.description ? (
                <div>
                  <p className="text-muted-foreground">Mô tả</p>
                  <p className="mt-1 whitespace-pre-line text-foreground">{transaction.description}</p>
                </div>
              ) : null}
              <div className="grid gap-2 text-sm text-muted-foreground">
                <span>Tạo lúc: {formatDateTime(transaction.createdAt)}</span>
                <span>Cập nhật: {formatDateTime(transaction.updatedAt)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hướng dẫn chuyển khoản</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="rounded-lg border border-dashed border-border bg-muted/40 p-4">
                <p className="text-muted-foreground">Nội dung chuyển khoản</p>
                <p className="mt-2 select-all text-lg font-semibold tracking-wide text-foreground">
                  {transferReference}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Đừng chỉnh sửa nội dung để hệ thống khớp lệnh tự động.
                </p>
              </div>

              <div className="grid gap-3">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Ngân hàng</span>
                  <span className="font-medium text-foreground">{BANK_INFO.bankName}</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Số tài khoản</span>
                  <span className="font-medium text-foreground">{BANK_INFO.accountNumber}</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Chủ tài khoản</span>
                  <span className="font-medium text-foreground uppercase">{BANK_INFO.accountName}</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Số tiền</span>
                  <span className="font-medium text-foreground">{currencyFormatter.format(transaction.amount)}</span>
                </div>
              </div>

              <div className="flex flex-col items-center gap-3">
                <div className="rounded-lg border border-border bg-white p-2">
                  <img src={qrUrl} alt={`VietQR cho giao dịch ${transferReference}`} className="h-40 w-40" />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Quét mã VietQR để điền sẵn thông tin chuyển khoản nhanh chóng.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
          <div className="text-xs text-muted-foreground">
            Giao dịch ID: <span className="font-mono text-foreground">{transaction.id}</span>
          </div>
          <Button asChild variant="outline">
            <Link href="/help">Cần hỗ trợ? Liên hệ đội vận hành</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
