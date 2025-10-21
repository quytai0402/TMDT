"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Shield, Lock, CheckCircle, AlertTriangle, Phone, FileText, UserCheck, CreditCard } from "lucide-react"

const safetyFeatures = [
  {
    icon: UserCheck,
    title: "Xác minh danh tính",
    description: "Tất cả chủ nhà và khách phải xác minh danh tính qua email, số điện thoại và CCCD/CMND.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Shield,
    title: "Bảo hiểm toàn diện",
    description: "Mỗi đặt phòng được bảo vệ bởi bảo hiểm tài sản lên đến 100 triệu đồng.",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Lock,
    title: "Thanh toán an toàn",
    description: "Mã hóa SSL 256-bit và không lưu trữ thông tin thẻ của bạn.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Phone,
    title: "Hỗ trợ 24/7",
    description: "Đội ngũ hỗ trợ sẵn sàng giúp đỡ bạn mọi lúc, mọi nơi.",
    color: "from-orange-500 to-red-500",
  },
  {
    icon: FileText,
    title: "Hợp đồng rõ ràng",
    description: "Tất cả điều khoản và chính sách được quy định minh bạch.",
    color: "from-indigo-500 to-purple-500",
  },
  {
    icon: CheckCircle,
    title: "Đánh giá xác thực",
    description: "Chỉ khách đã ở mới có thể đánh giá, đảm bảo tính chân thực.",
    color: "from-yellow-500 to-amber-500",
  },
]

const safetyTips = [
  {
    title: "Dành cho khách",
    tips: [
      "Luôn đặt phòng và thanh toán qua nền tảng LuxeStay để được bảo vệ",
      "Đọc kỹ mô tả chỗ nghỉ, đánh giá và chính sách hủy trước khi đặt",
      "Liên hệ chủ nhà qua tin nhắn trên nền tảng để có bằng chứng",
      "Kiểm tra chỗ nghỉ khi check-in và báo ngay nếu có vấn đề",
      "Không chia sẻ thông tin cá nhân nhạy cảm với chủ nhà",
      "Giữ liên lạc với LuxeStay nếu có tình huống khẩn cấp",
    ],
  },
  {
    title: "Dành cho chủ nhà",
    tips: [
      "Xác minh danh tính khách trước khi cho nhận phòng",
      "Không chấp nhận thanh toán tiền mặt ngoài nền tảng",
      "Chụp ảnh hiện trạng phòng trước và sau khi khách ở",
      "Quy định rõ ràng các điều khoản sử dụng chỗ nghỉ",
      "Cài đặt hệ thống an ninh như camera ngoài khu vực công cộng",
      "Mua bảo hiểm tài sản để được đảm bảo toàn diện",
    ],
  },
]

const warningSignals = [
  "Yêu cầu thanh toán tiền mặt hoặc chuyển khoản trực tiếp ngoài nền tảng",
  "Giá quá thấp so với thị trường (có thể là lừa đảo)",
  "Chủ nhà/khách thiếu thông tin xác minh hoặc đánh giá",
  "Yêu cầu thông tin thẻ tín dụng hoặc mật khẩu qua tin nhắn",
  "Áp lực bạn ra quyết định nhanh hoặc đặt cọc trước",
  "Chỗ nghỉ có nhiều đánh giá tiêu cực về vấn đề an toàn",
]

export default function SafetyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-500/10 via-green-50 to-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-green-500 shadow-xl mb-4">
              <Shield className="h-10 w-10 text-white" />
            </div>
            <h1 className="font-serif text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-500 via-green-500 to-emerald-500 bg-clip-text text-transparent">
              An toàn & Bảo mật
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Cam kết bảo vệ bạn với công nghệ bảo mật hàng đầu và chính sách an toàn nghiêm ngặt
            </p>
          </div>
        </div>
      </section>

      {/* Commitment */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="border-none shadow-xl bg-gradient-to-br from-blue-50 to-green-50">
              <CardContent className="p-8 md:p-12 space-y-6">
                <h2 className="font-serif text-3xl font-bold text-foreground">Cam kết của chúng tôi</h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Tại LuxeStay, an toàn của bạn là ưu tiên hàng đầu. Chúng tôi không ngừng đầu tư vào công nghệ 
                  và quy trình để đảm bảo mọi giao dịch đặt phòng diễn ra an toàn, bảo mật và minh bạch.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Với hệ thống xác minh danh tính đa lớp, mã hóa dữ liệu tiêu chuẩn ngân hàng và đội ngũ hỗ trợ 
                  24/7, bạn có thể yên tâm tận hưởng chuyến đi mà không lo lắng về vấn đề an ninh.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Safety Features */}
      <section className="py-16 bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="font-serif text-4xl font-bold text-foreground">Tính năng an toàn</h2>
              <p className="text-lg text-muted-foreground">
                Các biện pháp bảo vệ toàn diện cho mọi đặt phòng
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {safetyFeatures.map((feature, index) => (
                <Card key={index} className="group hover:shadow-2xl transition-all duration-300">
                  <CardContent className="p-6 space-y-4">
                    <div
                      className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} shadow-lg group-hover:scale-110 transition-transform`}
                    >
                      <feature.icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="font-serif text-xl font-bold text-foreground">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Safety Tips */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="font-serif text-4xl font-bold text-foreground">Mẹo an toàn</h2>
              <p className="text-lg text-muted-foreground">Hướng dẫn giúp bạn có trải nghiệm an toàn nhất</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {safetyTips.map((section, index) => (
                <Card key={index} className="shadow-xl">
                  <CardContent className="p-8 space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-green-500 shadow-lg">
                        <CheckCircle className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="font-serif text-2xl font-bold text-foreground">{section.title}</h3>
                    </div>
                    <ul className="space-y-3">
                      {section.tips.map((tip, tipIndex) => (
                        <li key={tipIndex} className="flex gap-3 text-muted-foreground">
                          <div className="flex-shrink-0 mt-1">
                            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                              <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                            </div>
                          </div>
                          <span className="leading-relaxed">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Warning Signals */}
      <section className="py-16 bg-gradient-to-b from-orange-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 shadow-xl mb-2">
                <AlertTriangle className="h-8 w-8 text-white" />
              </div>
              <h2 className="font-serif text-4xl font-bold text-foreground">Dấu hiệu cảnh báo</h2>
              <p className="text-lg text-muted-foreground">Nhận biết các tình huống có thể không an toàn</p>
            </div>

            <Card className="border-2 border-orange-200 shadow-xl bg-gradient-to-br from-orange-50/50 to-white">
              <CardContent className="p-8 space-y-4">
                <ul className="space-y-3">
                  {warningSignals.map((signal, index) => (
                    <li key={index} className="flex gap-3 text-muted-foreground">
                      <div className="flex-shrink-0 mt-1">
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                      </div>
                      <span className="leading-relaxed">{signal}</span>
                    </li>
                  ))}
                </ul>
                <div className="pt-4 border-t border-orange-200">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-orange-600">Lưu ý:</strong> Nếu bạn gặp bất kỳ dấu hiệu nào ở trên, 
                    hãy liên hệ ngay với bộ phận hỗ trợ LuxeStay qua hotline <strong>1900 1234</strong> hoặc 
                    email <strong>support@luxestay.vn</strong>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-blue-500 to-green-500 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h2 className="font-serif text-4xl md:text-5xl font-bold">Cần hỗ trợ khẩn cấp?</h2>
            <p className="text-xl text-white/90 leading-relaxed">
              Liên hệ ngay với đội ngũ hỗ trợ an toàn của chúng tôi
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <a
                href="tel:1900-1234"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-white text-blue-500 font-semibold text-lg hover:shadow-2xl transition-all gap-2"
              >
                <Phone className="h-5 w-5" />
                Hotline: 1900 1234
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
