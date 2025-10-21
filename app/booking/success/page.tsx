import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { CheckCircle2, Calendar, MapPin, Download, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"

export default function BookingSuccessPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8 py-16">
          <div className="max-w-3xl mx-auto">
            {/* Success Message */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <h1 className="font-serif text-4xl font-bold text-foreground mb-2">Đặt phòng thành công!</h1>
              <p className="text-lg text-muted-foreground">
                Cảm ơn bạn đã tin tưởng LuxeStay. Chúng tôi đã gửi xác nhận đến email của bạn.
              </p>
            </div>

            {/* Booking Details Card */}
            <Card className="mb-6">
              <CardContent className="p-6 space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-xl text-foreground">Thông tin đặt phòng</h2>
                    <span className="text-sm font-medium text-primary">Mã đặt phòng: #BK123456</span>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start space-x-4">
                      <img
                        src="/placeholder.svg?height=100&width=120"
                        alt="Listing"
                        className="w-32 h-24 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-1">Villa sang trọng view biển Nha Trang</h3>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
                          <MapPin className="h-4 w-4" />
                          <span>Nha Trang, Khánh Hòa</span>
                        </div>
                        <p className="text-sm text-muted-foreground">Chủ nhà: Minh Anh</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                      <div>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-1">
                          <Calendar className="h-4 w-4" />
                          <span>Nhận phòng</span>
                        </div>
                        <p className="font-semibold text-foreground">15/01/2025, 14:00</p>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-1">
                          <Calendar className="h-4 w-4" />
                          <span>Trả phòng</span>
                        </div>
                        <p className="font-semibold text-foreground">20/01/2025, 12:00</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Tổng thanh toán</span>
                        <span className="font-bold text-2xl text-foreground">19.000.000₫</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Button variant="outline" className="w-full bg-transparent">
                <Download className="h-4 w-4 mr-2" />
                Tải xác nhận
              </Button>
              <Button variant="outline" className="w-full bg-transparent">
                <MessageCircle className="h-4 w-4 mr-2" />
                Nhắn tin chủ nhà
              </Button>
              <Link href="/trips" className="w-full">
                <Button className="w-full bg-primary hover:bg-primary-hover">Xem chuyến đi</Button>
              </Link>
            </div>

            {/* Next Steps */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg text-foreground mb-4">Bước tiếp theo</h3>
                <ul className="space-y-3">
                  <li className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                      1
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Kiểm tra email xác nhận</p>
                      <p className="text-sm text-muted-foreground">
                        Chúng tôi đã gửi chi tiết đặt phòng và hướng dẫn đến email của bạn
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                      2
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Liên hệ với chủ nhà</p>
                      <p className="text-sm text-muted-foreground">
                        Bạn có thể nhắn tin trực tiếp với chủ nhà để hỏi thêm thông tin
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                      3
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Chuẩn bị cho chuyến đi</p>
                      <p className="text-sm text-muted-foreground">
                        Xem lại chính sách nhận phòng và danh sách đồ cần mang theo
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
