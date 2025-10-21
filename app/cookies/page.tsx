"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Cookie, Settings, Check, X, Info } from "lucide-react"

const cookieTypes = [
  {
    name: "Cookies thiết yếu",
    icon: Check,
    color: "from-green-500 to-emerald-500",
    badge: "Bắt buộc",
    badgeColor: "bg-green-500",
    description: "Cần thiết để website hoạt động",
    required: true,
    examples: [
      "Session cookies - Duy trì phiên đăng nhập",
      "Security cookies - Bảo mật và xác thực",
      "Load balancing - Phân phối tải server",
      "Cookie preferences - Lưu cài đặt cookie",
    ],
    retention: "Phiên hoặc 1 năm",
  },
  {
    name: "Cookies chức năng",
    icon: Settings,
    color: "from-blue-500 to-cyan-500",
    badge: "Tùy chọn",
    badgeColor: "bg-blue-500",
    description: "Cải thiện trải nghiệm người dùng",
    required: false,
    examples: [
      "Language preferences - Lưu ngôn ngữ",
      "Region settings - Cài đặt khu vực",
      "UI preferences - Tùy chọn giao diện",
      "Recently viewed - Lịch sử xem",
    ],
    retention: "1-2 năm",
  },
  {
    name: "Cookies phân tích",
    icon: Info,
    color: "from-purple-500 to-pink-500",
    badge: "Tùy chọn",
    badgeColor: "bg-purple-500",
    description: "Hiểu cách người dùng tương tác",
    required: false,
    examples: [
      "Google Analytics - Phân tích traffic",
      "Hotjar - Heatmaps và recordings",
      "Performance monitoring - Giám sát hiệu suất",
      "A/B testing - Thử nghiệm tính năng",
    ],
    retention: "26 tháng",
  },
  {
    name: "Cookies quảng cáo",
    icon: Info,
    color: "from-orange-500 to-red-500",
    badge: "Tùy chọn",
    badgeColor: "bg-orange-500",
    description: "Hiển thị quảng cáo phù hợp",
    required: false,
    examples: [
      "Facebook Pixel - Quảng cáo Facebook",
      "Google Ads - Remarketing Google",
      "Ad preferences - Tùy chọn quảng cáo",
      "Conversion tracking - Theo dõi chuyển đổi",
    ],
    retention: "13 tháng",
  },
]

const thirdPartyCookies = [
  {
    name: "Google Analytics",
    purpose: "Phân tích lưu lượng và hành vi người dùng",
    cookies: "_ga, _gid, _gat",
    retention: "2 năm",
    link: "https://policies.google.com/privacy",
  },
  {
    name: "Facebook Pixel",
    purpose: "Đo lường và tối ưu hóa quảng cáo",
    cookies: "_fbp, fr",
    retention: "90 ngày",
    link: "https://www.facebook.com/privacy",
  },
  {
    name: "Stripe",
    purpose: "Xử lý thanh toán an toàn",
    cookies: "__stripe_mid, __stripe_sid",
    retention: "1 năm",
    link: "https://stripe.com/privacy",
  },
]

export default function CookiesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-amber-500/10 via-orange-50 to-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-xl mb-4">
              <Cookie className="h-10 w-10 text-white" />
            </div>
            <h1 className="font-serif text-5xl md:text-6xl font-bold bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
              Chính sách Cookies
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Tìm hiểu về cookies và cách chúng tôi sử dụng chúng
            </p>
          </div>
        </div>
      </section>

      {/* What are Cookies */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h2 className="font-serif text-4xl font-bold text-foreground">Cookies là gì?</h2>
            </div>

            <Card className="border-none shadow-xl bg-gradient-to-br from-amber-50 to-orange-50">
              <CardContent className="p-8 md:p-12 space-y-4">
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Cookies là các tệp văn bản nhỏ được lưu trữ trên thiết bị của bạn khi bạn truy cập website. 
                  Chúng giúp website "nhớ" thông tin về lượt truy cập của bạn, như ngôn ngữ ưa thích, thông tin 
                  đăng nhập và các tùy chọn khác.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  LuxeStay sử dụng cookies để cải thiện trải nghiệm của bạn, phân tích cách website được sử dụng 
                  và hiển thị nội dung phù hợp. Bạn có thể kiểm soát việc sử dụng cookies thông qua cài đặt trình 
                  duyệt hoặc bảng quản lý cookie của chúng tôi.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Cookie Types */}
      <section className="py-16 bg-gradient-to-b from-orange-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="font-serif text-4xl font-bold text-foreground">Các loại cookies chúng tôi sử dụng</h2>
              <p className="text-lg text-muted-foreground">Mỗi loại cookies phục vụ mục đích khác nhau</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {cookieTypes.map((type, index) => (
                <Card key={index} className="hover:shadow-2xl transition-shadow flex flex-col">
                  <CardContent className="p-6 space-y-6 flex-1 flex flex-col">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div
                          className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${type.color} shadow-lg`}
                        >
                          <type.icon className="h-7 w-7 text-white" />
                        </div>
                        <Badge className={type.badgeColor}>{type.badge}</Badge>
                      </div>
                      <div>
                        <h3 className="font-serif text-2xl font-bold text-foreground mb-2">{type.name}</h3>
                        <p className="text-muted-foreground mb-4">{type.description}</p>
                        <div className="flex items-center gap-2 text-sm">
                          <Badge variant="outline">Lưu trữ: {type.retention}</Badge>
                          {type.required ? (
                            <Badge variant="outline" className="gap-1">
                              <Check className="h-3 w-3" />
                              Bắt buộc
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1">
                              <X className="h-3 w-3" />
                              Có thể tắt
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 flex-1">
                      <p className="text-sm font-semibold text-foreground">Ví dụ:</p>
                      <ul className="space-y-2">
                        {type.examples.map((example, exIndex) => (
                          <li key={exIndex} className="flex gap-2 text-sm text-muted-foreground">
                            <div className="flex-shrink-0 mt-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                            </div>
                            <span>{example}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Third Party Cookies */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h2 className="font-serif text-4xl font-bold text-foreground">Cookies bên thứ ba</h2>
              <p className="text-lg text-muted-foreground">Các đối tác sử dụng cookies trên website của chúng tôi</p>
            </div>

            <div className="space-y-4">
              {thirdPartyCookies.map((cookie, index) => (
                <Card key={index} className="hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4 items-start">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <h3 className="font-serif text-xl font-bold text-foreground">{cookie.name}</h3>
                          <Badge variant="outline">{cookie.retention}</Badge>
                        </div>
                        <p className="text-muted-foreground">{cookie.purpose}</p>
                        <div className="text-sm text-muted-foreground">
                          <span className="font-semibold">Cookies:</span> {cookie.cookies}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <Button variant="outline" size="sm" asChild>
                          <a href={cookie.link} target="_blank" rel="noopener noreferrer">
                            Chính sách
                          </a>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Manage Cookies */}
      <section className="py-16 bg-gradient-to-b from-orange-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h2 className="font-serif text-4xl font-bold text-foreground">Quản lý cookies</h2>
              <p className="text-lg text-muted-foreground">Cách kiểm soát cookies trên thiết bị của bạn</p>
            </div>

            <Card className="shadow-xl">
              <CardContent className="p-8 space-y-6">
                <div className="space-y-4">
                  <h3 className="font-serif text-xl font-bold text-foreground">Qua trình duyệt</h3>
                  <p className="text-muted-foreground">
                    Hầu hết trình duyệt cho phép bạn kiểm soát cookies qua cài đặt. Bạn có thể:
                  </p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex gap-2">
                      <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span>Xem cookies nào đã được lưu</span>
                    </li>
                    <li className="flex gap-2">
                      <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span>Xóa cookies hiện có</span>
                    </li>
                    <li className="flex gap-2">
                      <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span>Chặn cookies từ các website cụ thể</span>
                    </li>
                    <li className="flex gap-2">
                      <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span>Chặn tất cả cookies của bên thứ ba</span>
                    </li>
                    <li className="flex gap-2">
                      <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span>Xóa cookies khi đóng trình duyệt</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-serif text-xl font-bold text-foreground">Qua LuxeStay</h3>
                  <p className="text-muted-foreground">
                    Bạn có thể quản lý tùy chọn cookies của mình bất cứ lúc nào thông qua:
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button className="gap-2">
                      <Settings className="h-4 w-4" />
                      Cài đặt Cookies
                    </Button>
                    <Button variant="outline" className="gap-2">
                      <X className="h-4 w-4" />
                      Từ chối tất cả (trừ thiết yếu)
                    </Button>
                  </div>
                </div>

                <div className="pt-4 border-t bg-amber-50 -mx-8 -mb-8 px-8 py-6 rounded-b-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-amber-600">Lưu ý:</strong> Việc chặn hoặc xóa cookies có thể ảnh hưởng 
                    đến trải nghiệm của bạn trên website. Một số tính năng có thể không hoạt động đúng cách.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16 bg-gradient-to-br from-amber-500 to-orange-500 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h2 className="font-serif text-4xl md:text-5xl font-bold">Câu hỏi về cookies?</h2>
            <p className="text-xl text-white/90 leading-relaxed">
              Liên hệ với chúng tôi nếu bạn có thắc mắc về cách chúng tôi sử dụng cookies
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <a
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-white text-amber-500 font-semibold text-lg hover:shadow-2xl transition-all"
              >
                Liên hệ hỗ trợ
              </a>
              <a
                href="/privacy"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-white/10 backdrop-blur-sm text-white font-semibold text-lg border-2 border-white/30 hover:bg-white/20 transition-all"
              >
                Chính sách quyền riêng tư
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
