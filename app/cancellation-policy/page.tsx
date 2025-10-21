"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { XCircle, CheckCircle, Clock, DollarSign, Calendar, AlertCircle, FileText } from "lucide-react"

const policies = [
  {
    name: "Linh hoạt",
    icon: CheckCircle,
    color: "from-green-500 to-emerald-500",
    badge: "Phổ biến nhất",
    badgeColor: "bg-green-500",
    description: "Hủy miễn phí trước 24 giờ",
    details: [
      {
        time: "Trước 24 giờ nhận phòng",
        refund: "100%",
        description: "Hoàn lại toàn bộ tiền đã thanh toán",
      },
      {
        time: "Trong vòng 24 giờ trước nhận phòng",
        refund: "50%",
        description: "Hoàn lại 50% tổng giá trị đặt phòng",
      },
      {
        time: "Sau thời gian nhận phòng",
        refund: "0%",
        description: "Không được hoàn tiền",
      },
    ],
  },
  {
    name: "Vừa phải",
    icon: Clock,
    color: "from-blue-500 to-cyan-500",
    badge: "Cân bằng",
    badgeColor: "bg-blue-500",
    description: "Hủy miễn phí trước 5 ngày",
    details: [
      {
        time: "Trước 5 ngày nhận phòng",
        refund: "100%",
        description: "Hoàn lại toàn bộ tiền đã thanh toán",
      },
      {
        time: "Trong vòng 5 ngày trước nhận phòng",
        refund: "50%",
        description: "Hoàn lại 50% tổng giá trị đặt phòng",
      },
      {
        time: "Sau thời gian nhận phòng",
        refund: "0%",
        description: "Không được hoàn tiền",
      },
    ],
  },
  {
    name: "Nghiêm ngặt",
    icon: XCircle,
    color: "from-orange-500 to-red-500",
    badge: "Lễ, Tết",
    badgeColor: "bg-orange-500",
    description: "Hủy miễn phí trước 14 ngày",
    details: [
      {
        time: "Trước 14 ngày nhận phòng",
        refund: "100%",
        description: "Hoàn lại toàn bộ tiền đã thanh toán",
      },
      {
        time: "Trong vòng 7-14 ngày trước nhận phòng",
        refund: "50%",
        description: "Hoàn lại 50% tổng giá trị đặt phòng",
      },
      {
        time: "Trong vòng 7 ngày hoặc sau nhận phòng",
        refund: "0%",
        description: "Không được hoàn tiền",
      },
    ],
  },
]

const refundProcess = [
  {
    step: 1,
    title: "Yêu cầu hủy phòng",
    description: "Truy cập trang đặt phòng của bạn và nhấn nút 'Hủy đặt phòng'",
  },
  {
    step: 2,
    title: "Xác nhận hủy",
    description: "Chọn lý do hủy và xác nhận quyết định của bạn",
  },
  {
    step: 3,
    title: "Xét duyệt",
    description: "Chúng tôi sẽ xử lý yêu cầu trong vòng 24 giờ",
  },
  {
    step: 4,
    title: "Nhận tiền hoàn",
    description: "Tiền sẽ được hoàn về phương thức thanh toán ban đầu trong 5-7 ngày làm việc",
  },
]

const exceptions = [
  "Điều kiện thời tiết cực đoan (bão, lũ lụt) được cơ quan chức năng cảnh báo",
  "Khách bị ốm nặng hoặc tai nạn (cần cung cấp giấy tờ y tế)",
  "Chỗ nghỉ không đúng như mô tả hoặc có vấn đề nghiêm trọng về vệ sinh, an toàn",
  "Sự cố kỹ thuật từ phía LuxeStay khiến không thể hoàn tất đặt phòng",
]

const tips = [
  "Đọc kỹ chính sách hủy trước khi đặt phòng",
  "Chọn chính sách linh hoạt nếu kế hoạch của bạn có thể thay đổi",
  "Mua bảo hiểm du lịch để được bảo vệ toàn diện",
  "Liên hệ chủ nhà trước nếu cần thay đổi ngày nhận phòng",
  "Hủy sớm để tăng cơ hội được hoàn tiền nhiều hơn",
]

export default function CancellationPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-purple-500/10 via-pink-50 to-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-xl mb-4">
              <FileText className="h-10 w-10 text-white" />
            </div>
            <h1 className="font-serif text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 bg-clip-text text-transparent">
              Chính sách hủy phòng
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Hiểu rõ các chính sách hủy và quy trình hoàn tiền tại LuxeStay
            </p>
          </div>
        </div>
      </section>

      {/* Overview */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="border-none shadow-xl bg-gradient-to-br from-purple-50 to-pink-50">
              <CardContent className="p-8 md:p-12 space-y-4">
                <h2 className="font-serif text-3xl font-bold text-foreground">Tổng quan</h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Mỗi chỗ nghỉ trên LuxeStay có một trong ba chính sách hủy phòng: Linh hoạt, Vừa phải hoặc Nghiêm ngặt. 
                  Chính sách được chủ nhà lựa chọn và hiển thị rõ ràng trên trang chi tiết chỗ nghỉ.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Số tiền bạn nhận lại khi hủy phòng phụ thuộc vào thời điểm hủy và chính sách áp dụng. 
                  Vui lòng đọc kỹ thông tin trước khi đặt phòng.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Policy Types */}
      <section className="py-16 bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="font-serif text-4xl font-bold text-foreground">Các loại chính sách</h2>
              <p className="text-lg text-muted-foreground">So sánh và chọn chính sách phù hợp</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {policies.map((policy, index) => (
                <Card key={index} className="hover:shadow-2xl transition-shadow flex flex-col">
                  <CardContent className="p-6 space-y-6 flex-1 flex flex-col">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div
                          className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${policy.color} shadow-lg`}
                        >
                          <policy.icon className="h-7 w-7 text-white" />
                        </div>
                        <Badge className={policy.badgeColor}>{policy.badge}</Badge>
                      </div>
                      <div>
                        <h3 className="font-serif text-2xl font-bold text-foreground mb-2">{policy.name}</h3>
                        <p className="text-muted-foreground">{policy.description}</p>
                      </div>
                    </div>

                    <div className="space-y-4 flex-1">
                      {policy.details.map((detail, detailIndex) => (
                        <div
                          key={detailIndex}
                          className="p-4 rounded-lg bg-muted/30 border border-muted space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                              <Clock className="h-4 w-4" />
                              {detail.time}
                            </div>
                            <Badge variant="outline" className="gap-1">
                              <DollarSign className="h-3 w-3" />
                              Hoàn {detail.refund}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{detail.description}</p>
                        </div>
                      ))}
                    </div>

                    <Button variant="outline" className="w-full">
                      Xem chi tiết
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Refund Process */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="font-serif text-4xl font-bold text-foreground">Quy trình hoàn tiền</h2>
              <p className="text-lg text-muted-foreground">4 bước đơn giản để hủy phòng và nhận hoàn tiền</p>
            </div>

            <div className="space-y-4">
              {refundProcess.map((step, index) => (
                <Card key={index} className="hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg text-white font-bold text-lg">
                          {step.step}
                        </div>
                      </div>
                      <div className="flex-1 pt-1">
                        <h3 className="font-serif text-xl font-bold text-foreground mb-2">{step.title}</h3>
                        <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Exceptions */}
      <section className="py-16 bg-gradient-to-b from-amber-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-xl mb-2">
                <AlertCircle className="h-8 w-8 text-white" />
              </div>
              <h2 className="font-serif text-4xl font-bold text-foreground">Trường hợp đặc biệt</h2>
              <p className="text-lg text-muted-foreground">Các tình huống có thể được hoàn tiền 100%</p>
            </div>

            <Card className="border-2 border-amber-200 shadow-xl">
              <CardContent className="p-8 space-y-4">
                <ul className="space-y-3">
                  {exceptions.map((exception, index) => (
                    <li key={index} className="flex gap-3 text-muted-foreground">
                      <div className="flex-shrink-0 mt-1">
                        <CheckCircle className="h-5 w-5 text-amber-600" />
                      </div>
                      <span className="leading-relaxed">{exception}</span>
                    </li>
                  ))}
                </ul>
                <div className="pt-4 border-t border-amber-200">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-amber-600">Lưu ý:</strong> Để được áp dụng chính sách hoàn tiền 100% 
                    trong các trường hợp đặc biệt, bạn cần cung cấp bằng chứng liên quan và liên hệ bộ phận hỗ trợ 
                    trong vòng 24 giờ.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Tips */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h2 className="font-serif text-4xl font-bold text-foreground">Mẹo hữu ích</h2>
              <p className="text-lg text-muted-foreground">Giúp bạn tránh mất phí khi hủy phòng</p>
            </div>

            <Card className="shadow-xl">
              <CardContent className="p-8">
                <ul className="space-y-3">
                  {tips.map((tip, index) => (
                    <li key={index} className="flex gap-3 text-muted-foreground">
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center">
                          <CheckCircle className="h-3.5 w-3.5 text-purple-600" />
                        </div>
                      </div>
                      <span className="leading-relaxed">{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-purple-500 to-pink-500 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h2 className="font-serif text-4xl md:text-5xl font-bold">Cần hỗ trợ thêm?</h2>
            <p className="text-xl text-white/90 leading-relaxed">
              Liên hệ với chúng tôi nếu bạn có thắc mắc về chính sách hủy phòng
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <a
                href="/help"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-white text-purple-500 font-semibold text-lg hover:shadow-2xl transition-all"
              >
                Trung tâm trợ giúp
              </a>
              <a
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-white/10 backdrop-blur-sm text-white font-semibold text-lg border-2 border-white/30 hover:bg-white/20 transition-all"
              >
                Liên hệ hỗ trợ
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
