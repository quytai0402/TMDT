import { notFound } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { CheckCircle2, Calendar, MapPin, Download, MessageCircle } from "lucide-react"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { prisma } from "@/lib/prisma"
import { formatTransferReference } from "@/lib/payments"

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
})

type PageProps = {
  searchParams: Promise<{
    bookingId?: string
    pending?: string
    method?: string
  }>
}

export default async function BookingSuccessPage({ searchParams }: PageProps) {
  const params = await searchParams
  const bookingId = params.bookingId
  const paymentMethod = params.method

  if (!bookingId) {
    notFound()
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      listing: {
        select: {
          id: true,
          slug: true,
          title: true,
          city: true,
          state: true,
          country: true,
          images: true,
          checkInTime: true,
          checkOutTime: true,
          host: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      },
      guest: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      payment: true,
    },
  })

  if (!booking || !booking.listing) {
    notFound()
  }

  const listing = booking.listing
  const totalPrice = booking.totalPrice ?? 0
  const listingImage = listing.images?.[0] ?? "/placeholder.svg"
  const checkInLabel = format(booking.checkIn, "dd/MM/yyyy", { locale: vi })
  const checkOutLabel = format(booking.checkOut, "dd/MM/yyyy", { locale: vi })
  const checkInTime = listing.checkInTime ?? "14:00"
  const checkOutTime = listing.checkOutTime ?? "11:00"
  const bookingCode = booking.id.slice(-8).toUpperCase()
  const paymentStatus = booking.paymentStatus ?? "PENDING"
  const awaitingPayment = paymentStatus !== "COMPLETED"
  const isPending = awaitingPayment || params.pending === 'true'
  const totalLabel = currencyFormatter.format(totalPrice)
  const locationLabel = [listing.city, listing.state ?? undefined].filter(Boolean).join(", ")
  const host = listing.host
  const conversationLink =
    host?.id && listing.id
      ? `/messages?participant=${encodeURIComponent(host.id)}&listing=${encodeURIComponent(listing.id)}`
      : "/messages"

  const receiptReference = booking.transferReference ?? formatTransferReference("BOOKING", bookingCode)

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8 py-16">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${isPending ? 'bg-yellow-100' : 'bg-green-100'} mb-4`}>
                <CheckCircle2 className={`h-10 w-10 ${isPending ? 'text-yellow-600' : 'text-green-600'}`} />
              </div>
              <h1 className="font-serif text-4xl font-bold text-foreground mb-2">
                {isPending ? 'Đặt phòng đang chờ xác nhận!' : 'Đặt phòng thành công!'}
              </h1>
              <p className="text-lg text-muted-foreground">
                {isPending
                  ? 'Vui lòng chuyển khoản theo đúng nội dung bên dưới. LuxeStay sẽ xác nhận đặt phòng ngay khi đối chiếu được mã tham chiếu của bạn.'
                  : 'Cảm ơn bạn đã tin tưởng LuxeStay. Đơn đặt phòng đã được xác nhận thành công!'
                }
              </p>
            </div>

            <Card className="mb-6">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-xl text-foreground">Thông tin đặt phòng</h2>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm font-medium text-primary">Mã đặt phòng: {bookingCode}</span>
                    {isPending && (
                      <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 font-medium">
                        Chờ xác nhận thanh toán
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <Link
                      href={listing.slug ? `/listing/${listing.slug}` : "/trips"}
                      className="flex-shrink-0"
                    >
                      <img
                        src={listingImage}
                        alt={listing.title}
                        className="w-32 h-24 rounded-lg object-cover hover:opacity-90 transition-opacity"
                      />
                    </Link>
                    <div className="flex-1">
                      <Link href={listing.slug ? `/listing/${listing.slug}` : "/trips"}>
                        <h3 className="font-semibold text-foreground mb-1 hover:text-primary transition-colors">
                          {listing.title}
                        </h3>
                      </Link>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <MapPin className="h-4 w-4" />
                        <span>{locationLabel || listing.country}</span>
                      </div>
                      {host?.name && <p className="text-sm text-muted-foreground">Chủ nhà: {host.name}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Calendar className="h-4 w-4" />
                        <span>Nhận phòng</span>
                      </div>
                      <p className="font-semibold text-foreground">
                        {checkInLabel}, {checkInTime}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Calendar className="h-4 w-4" />
                        <span>Trả phòng</span>
                      </div>
                      <p className="font-semibold text-foreground">
                        {checkOutLabel}, {checkOutTime}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Tổng thanh toán</span>
                      <span className="font-bold text-2xl text-foreground">{totalLabel}</span>
                    </div>
                    {booking.additionalServicesTotal && booking.additionalServicesTotal > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Bao gồm dịch vụ bổ sung trị giá{" "}
                        {currencyFormatter.format(booking.additionalServicesTotal)}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Nội dung chuyển khoản đã lưu: <span className="font-semibold">{receiptReference}</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Button variant="outline" className="w-full bg-transparent" asChild>
                <Link href={`/api/bookings/${booking.id}/confirmation`} prefetch={false}>
                  <Download className="h-4 w-4 mr-2" />
                  Tải xác nhận
                </Link>
              </Button>
              <Button variant="outline" className="w-full bg-transparent" asChild>
                <Link href={conversationLink}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Nhắn tin chủ nhà
                </Link>
              </Button>
              <Link href="/trips" className="w-full">
                <Button className="w-full bg-primary hover:bg-primary-hover">Xem chuyến đi</Button>
              </Link>
            </div>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg text-foreground mb-4">Bước tiếp theo</h3>
                <ul className="space-y-3">
                  {isPending && paymentMethod === 'bank' && (
                    <li className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center text-sm font-semibold text-white">
                        !
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Hoàn tất thanh toán chuyển khoản</p>
                        <p className="text-sm text-muted-foreground mb-2">
                          Vui lòng chuyển khoản với nội dung <span className="font-semibold text-foreground">{receiptReference}</span>
                        </p>
                        <p className="text-xs text-yellow-700 font-medium">
                          ⚠️ Phòng chưa được xác nhận. Sau khi thanh toán, admin sẽ xác nhận và phòng sẽ chính thức thuộc về bạn.
                        </p>
                      </div>
                    </li>
                  )}
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                      1
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Kiểm tra email xác nhận</p>
                      <p className="text-sm text-muted-foreground">
                        Chúng tôi đã gửi chi tiết đặt phòng và hướng dẫn đến email của bạn.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                      2
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Liên hệ với chủ nhà</p>
                      <p className="text-sm text-muted-foreground">
                        Sử dụng nút “Nhắn tin chủ nhà” để trao đổi thêm về việc check-in hay yêu cầu đặc biệt.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                      3
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Chuẩn bị cho chuyến đi</p>
                      <p className="text-sm text-muted-foreground">
                        Đừng quên xem lại chính sách nhận phòng và danh sách đồ cần mang theo trong phần Chi tiết chuyến đi.
                      </p>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
