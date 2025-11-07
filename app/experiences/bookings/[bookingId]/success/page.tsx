import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { CheckCircle2, CreditCard, MessageCircle, ShieldCheck } from "lucide-react"
import { notFound, redirect } from "next/navigation"
import { getServerSession } from "next-auth"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createVietQRUrl, formatTransferReference, getBankTransferInfo } from "@/lib/payments"

type PageParams = {
  bookingId: string
}

export default async function ExperienceBookingSuccessPage({
  params,
}: {
  params: Promise<PageParams>
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent("/experiences")}`)
  }

  const { bookingId } = await params

  const booking = await prisma.experienceBooking.findUnique({
    where: { id: bookingId },
    include: {
      experience: {
        select: {
          id: true,
          title: true,
          city: true,
          hostId: true,
        },
      },
    },
  })

  if (!booking || booking.guestId !== session.user.id) {
    notFound()
  }

  const bank = getBankTransferInfo()
  const referenceCode = formatTransferReference("EXPERIENCE", booking.id.slice(-8).toUpperCase())
  const qrUrl = createVietQRUrl(booking.totalPrice, referenceCode)
  const formattedDate = format(booking.date, "EEEE, dd MMMM yyyy", { locale: vi })
  const totalGuests = booking.numberOfGuests

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-12 max-w-4xl space-y-8">
          <Card className="border-green-200 shadow-lg">
            <CardHeader className="flex flex-col gap-2 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
              <CardTitle className="text-3xl">Đã gửi yêu cầu cho hướng dẫn viên</CardTitle>
              <p className="text-muted-foreground">
                Đội ngũ concierge sẽ kiểm tra giao dịch và xác nhận với bạn trong vòng 30 phút.
              </p>
            </CardHeader>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin trải nghiệm</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-center justify-between">
                  <span>Tên trải nghiệm</span>
                  <span className="font-semibold text-right">{booking.experience.title}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Ngày diễn ra</span>
                  <span className="font-semibold text-right">{formattedDate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Số khách</span>
                  <span className="font-semibold text-right">{totalGuests} khách</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Tổng thanh toán</span>
                  <span className="font-semibold text-right">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: booking.currency,
                      maximumFractionDigits: 0,
                    }).format(booking.totalPrice)}
                  </span>
                </div>
                <Badge variant="outline" className="w-fit border-green-500 text-green-600">
                  Mã đặt trải nghiệm: {booking.id.slice(-8).toUpperCase()}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-col gap-2">
                <CardTitle>Chi tiết chuyển khoản</CardTitle>
                <p className="text-sm text-muted-foreground">Giữ lại biên lai để concierge xác nhận nhanh hơn.</p>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Ngân hàng</p>
                    <p className="font-semibold">{bank.bankName}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Số tài khoản</p>
                    <p className="font-semibold tracking-wide">{bank.accountNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Chủ tài khoản</p>
                    <p className="font-semibold">{bank.accountName}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Nội dung</p>
                    <p className="font-semibold text-primary">{referenceCode}</p>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-primary/50 p-3">
                  <img
                    src={qrUrl}
                    alt="VietQR"
                    className="h-32 w-32 rounded-md border bg-white p-2"
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Nếu chưa quét mã, vui lòng sử dụng QR này và nội dung chuyển khoản hiển thị ở trên để hệ thống nhận diện.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border border-blue-100 bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldCheck className="h-4 w-4 text-blue-500" />
                  Tiếp theo sẽ ra sao?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>• Concierge xác thực giao dịch rồi cập nhật trạng thái trải nghiệm.</p>
                <p>• Hướng dẫn viên sẽ liên hệ để chốt lịch trình và chuẩn bị dịch vụ.</p>
                <p>• Bạn có thể xem chi tiết hoặc hủy yêu cầu trong phần “Trips”.</p>
              </CardContent>
            </Card>

            <Card className="border border-amber-100 bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageCircle className="h-4 w-4 text-amber-500" />
                  Cần hỗ trợ ngay?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>• Chat với concierge trong mục “Trips & Support”.</p>
                <p>• Hotline ưu tiên cho hội viên: 1900 6767 (phím 2).</p>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="secondary" size="sm">
                    <a href="/concierge">Mở concierge</a>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <a href={`/experiences/${booking.experience.id}`}>Xem lại trải nghiệm</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="h-4 w-4 text-primary" />
                Tóm tắt giao dịch
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Khách đã xác nhận</span>
                <span className="font-semibold text-foreground">{new Date().toLocaleString("vi-VN")}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Trạng thái</span>
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">Đang chờ concierge</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
