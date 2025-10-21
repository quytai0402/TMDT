"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Shield, Lock, Eye, Database, Users, FileText, CheckCircle } from "lucide-react"

const sections = [
  {
    icon: Database,
    title: "1. Thông tin chúng tôi thu thập",
    color: "from-blue-500 to-cyan-500",
    content: `**Thông tin bạn cung cấp:**
- Thông tin cá nhân: Họ tên, email, số điện thoại, địa chỉ
- Thông tin tài khoản: Tên đăng nhập, mật khẩu (được mã hóa)
- Thông tin thanh toán: Thông tin thẻ (được xử lý qua cổng thanh toán bảo mật)
- Thông tin chỗ nghỉ: Nếu bạn là chủ nhà
- Nội dung: Đánh giá, tin nhắn, ảnh

**Thông tin tự động thu thập:**
- Dữ liệu thiết bị: IP, trình duyệt, hệ điều hành
- Dữ liệu sử dụng: Trang xem, thời gian truy cập, tính năng sử dụng
- Cookies và công nghệ tương tự
- Vị trí địa lý (nếu được cho phép)`,
  },
  {
    icon: Eye,
    title: "2. Cách chúng tôi sử dụng thông tin",
    color: "from-purple-500 to-pink-500",
    content: `Chúng tôi sử dụng thông tin của bạn để:

**Cung cấp dịch vụ:**
- Xử lý đặt phòng và thanh toán
- Kết nối khách và chủ nhà
- Gửi xác nhận và thông báo quan trọng
- Hỗ trợ khách hàng

**Cải thiện trải nghiệm:**
- Cá nhân hóa nội dung và đề xuất
- Phân tích hành vi người dùng
- Nghiên cứu và phát triển tính năng mới
- Đo lường hiệu quả marketing

**Bảo vệ an toàn:**
- Phát hiện và ngăn chặn gian lận
- Xác minh danh tính
- Tuân thủ pháp luật
- Giải quyết tranh chấp`,
  },
  {
    icon: Users,
    title: "3. Chia sẻ thông tin",
    color: "from-green-500 to-emerald-500",
    content: `Chúng tôi có thể chia sẻ thông tin của bạn với:

**Người dùng khác:**
- Chủ nhà xem thông tin cơ bản khi bạn đặt phòng
- Khách xem thông tin chỗ nghỉ và chủ nhà
- Đánh giá công khai (tên và ảnh đại diện)

**Đối tác kinh doanh:**
- Nhà cung cấp dịch vụ thanh toán
- Công ty phân tích dữ liệu
- Dịch vụ email và thông báo
- Nhà cung cấp lưu trữ đám mây

**Yêu cầu pháp lý:**
- Cơ quan chức năng khi có yêu cầu hợp pháp
- Bảo vệ quyền lợi của LuxeStay
- Tuân thủ nghĩa vụ pháp lý

Chúng tôi không bán thông tin cá nhân của bạn cho bên thứ ba.`,
  },
  {
    icon: Lock,
    title: "4. Bảo mật thông tin",
    color: "from-orange-500 to-red-500",
    content: `**Biện pháp bảo mật:**
- Mã hóa SSL/TLS cho tất cả dữ liệu truyền tải
- Mã hóa dữ liệu nhạy cảm trong cơ sở dữ liệu
- Kiểm soát truy cập nghiêm ngặt
- Giám sát bảo mật 24/7
- Đào tạo nhân viên về bảo mật
- Kiểm tra và cập nhật bảo mật thường xuyên

**Lưu ý:**
Mặc dù chúng tôi nỗ lực bảo vệ dữ liệu, không có hệ thống nào hoàn toàn an toàn 100%. 
Bạn cũng có trách nhiệm bảo vệ mật khẩu và thông tin đăng nhập.`,
  },
  {
    icon: FileText,
    title: "5. Quyền của bạn",
    color: "from-indigo-500 to-purple-500",
    content: `Bạn có các quyền sau đối với dữ liệu cá nhân:

**Quyền truy cập:** Yêu cầu xem dữ liệu chúng tôi lưu trữ về bạn

**Quyền chỉnh sửa:** Cập nhật hoặc sửa thông tin không chính xác

**Quyền xóa:** Yêu cầu xóa dữ liệu cá nhân (trong một số trường hợp)

**Quyền hạn chế:** Yêu cầu giới hạn cách chúng tôi xử lý dữ liệu

**Quyền di chuyển:** Nhận bản sao dữ liệu ở định dạng có thể đọc được

**Quyền phản đối:** Phản đối việc xử lý dữ liệu cho mục đích marketing

**Quyền rút lại đồng ý:** Rút lại sự đồng ý bất cứ lúc nào

Để thực hiện quyền của bạn, vui lòng liên hệ: privacy@luxestay.vn`,
  },
  {
    icon: Shield,
    title: "6. Lưu trữ và xóa dữ liệu",
    color: "from-yellow-500 to-amber-500",
    content: `**Thời gian lưu trữ:**
- Dữ liệu tài khoản: Cho đến khi bạn xóa tài khoản
- Lịch sử đặt phòng: 7 năm (theo quy định pháp luật)
- Tin nhắn: 3 năm
- Dữ liệu phân tích: Tối đa 26 tháng
- Logs hệ thống: 12 tháng

**Xóa dữ liệu:**
Khi bạn xóa tài khoản, chúng tôi sẽ xóa hoặc ẩn danh hóa dữ liệu cá nhân của bạn, 
trừ khi cần giữ lại để tuân thủ pháp luật hoặc giải quyết tranh chấp.`,
  },
  {
    icon: Users,
    title: "7. Quyền riêng tư của trẻ em",
    color: "from-pink-500 to-rose-500",
    content: `Dịch vụ của chúng tôi dành cho người từ 18 tuổi trở lên. 

Chúng tôi không cố ý thu thập thông tin từ trẻ em dưới 18 tuổi. Nếu bạn là phụ huynh 
và phát hiện con bạn đã cung cấp thông tin cho chúng tôi, vui lòng liên hệ ngay để 
chúng tôi xóa thông tin đó.`,
  },
  {
    icon: FileText,
    title: "8. Thay đổi chính sách",
    color: "from-cyan-500 to-blue-500",
    content: `Chúng tôi có thể cập nhật Chính sách Quyền riêng tư này theo thời gian. 
Những thay đổi quan trọng sẽ được thông báo qua:
- Email đến địa chỉ đã đăng ký
- Thông báo trên trang web
- Popup khi đăng nhập

Ngày cập nhật sẽ được ghi rõ ở đầu chính sách. Việc bạn tiếp tục sử dụng dịch vụ 
sau khi thay đổi có hiệu lực đồng nghĩa với việc bạn chấp nhận chính sách mới.`,
  },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-purple-500/10 via-blue-50 to-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 shadow-xl mb-4">
              <Shield className="h-10 w-10 text-white" />
            </div>
            <h1 className="font-serif text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
              Chính sách Quyền riêng tư
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Cam kết bảo vệ dữ liệu cá nhân và quyền riêng tư của bạn
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>Có hiệu lực từ: 01/01/2024</span>
            </div>
          </div>
        </div>
      </section>

      {/* Overview */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="border-none shadow-xl bg-gradient-to-br from-purple-50 to-blue-50">
              <CardContent className="p-8 md:p-12 space-y-4">
                <h2 className="font-serif text-3xl font-bold text-foreground">Tại sao chính sách này quan trọng</h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Tại LuxeStay, chúng tôi tin rằng bạn có quyền biết dữ liệu nào được thu thập, cách sử dụng 
                  và ai có quyền truy cập. Chính sách này giải thích chi tiết về cách chúng tôi xử lý thông tin 
                  cá nhân của bạn.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Chúng tôi cam kết tuân thủ các quy định về bảo vệ dữ liệu cá nhân của Việt Nam và các tiêu chuẩn 
                  quốc tế, bao gồm GDPR cho người dùng tại EU.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-6">
            {sections.map((section, index) => (
              <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-8 space-y-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br ${section.color} shadow-lg flex items-center justify-center`}
                    >
                      <section.icon className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <h2 className="font-serif text-2xl font-bold text-foreground">{section.title}</h2>
                      <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed whitespace-pre-line">
                        {section.content}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Your Rights Summary */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h2 className="font-serif text-4xl font-bold text-foreground">Quyền của bạn tóm tắt</h2>
              <p className="text-lg text-muted-foreground">Những gì bạn có thể làm với dữ liệu của mình</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: Eye, title: "Xem dữ liệu", desc: "Yêu cầu xem tất cả dữ liệu chúng tôi có về bạn" },
                { icon: FileText, title: "Sửa thông tin", desc: "Cập nhật thông tin không chính xác" },
                { icon: Lock, title: "Xóa dữ liệu", desc: "Yêu cầu xóa dữ liệu cá nhân" },
                { icon: Shield, title: "Hạn chế xử lý", desc: "Giới hạn cách chúng tôi dùng dữ liệu" },
                { icon: Database, title: "Di chuyển dữ liệu", desc: "Tải về dữ liệu của bạn" },
                { icon: Users, title: "Phản đối", desc: "Từ chối marketing và quảng cáo" },
              ].map((item, index) => (
                <Card key={index} className="hover:shadow-xl transition-shadow">
                  <CardContent className="p-6 space-y-3 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-100">
                      <item.icon className="h-6 w-6 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-foreground">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-gradient-to-br from-purple-500 to-blue-500 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h2 className="font-serif text-4xl md:text-5xl font-bold">Câu hỏi về quyền riêng tư?</h2>
            <p className="text-xl text-white/90 leading-relaxed">
              Liên hệ với Bộ phận Bảo vệ Dữ liệu của chúng tôi
            </p>
            <div className="space-y-3 text-white/90">
              <p>Email: <a href="mailto:privacy@luxestay.vn" className="underline font-semibold">privacy@luxestay.vn</a></p>
              <p>Hotline: <a href="tel:1900-1234" className="underline font-semibold">1900 1234</a></p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <a
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-white text-purple-500 font-semibold text-lg hover:shadow-2xl transition-all"
              >
                Liên hệ ngay
              </a>
              <a
                href="/terms"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-white/10 backdrop-blur-sm text-white font-semibold text-lg border-2 border-white/30 hover:bg-white/20 transition-all"
              >
                Điều khoản dịch vụ
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
