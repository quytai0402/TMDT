"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { HelpCircle, Search, Book, CreditCard, Home, MessageSquare, Shield, Users } from "lucide-react"

const categories = [
  {
    icon: Book,
    title: "Đặt phòng & Thanh toán",
    count: 12,
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Home,
    title: "Quản lý chỗ nghỉ",
    count: 8,
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: CreditCard,
    title: "Hoàn tiền & Hủy phòng",
    count: 10,
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Shield,
    title: "An toàn & Bảo mật",
    count: 6,
    color: "from-red-500 to-orange-500",
  },
  {
    icon: Users,
    title: "Tài khoản & Hồ sơ",
    count: 7,
    color: "from-yellow-500 to-amber-500",
  },
  {
    icon: MessageSquare,
    title: "Hỗ trợ khác",
    count: 5,
    color: "from-indigo-500 to-purple-500",
  },
]

const faqs = [
  {
    category: "Đặt phòng",
    question: "Làm thế nào để đặt phòng trên LuxeStay?",
    answer:
      "Để đặt phòng, bạn tìm kiếm chỗ nghỉ theo địa điểm và ngày mong muốn, chọn phòng phù hợp, điền thông tin khách và thanh toán. Bạn sẽ nhận được xác nhận đặt phòng qua email ngay sau khi thanh toán thành công.",
  },
  {
    category: "Đặt phòng",
    question: "Tôi có thể hủy hoặc thay đổi đặt phòng không?",
    answer:
      "Có, bạn có thể hủy hoặc thay đổi đặt phòng tùy thuộc vào chính sách của chủ nhà. Vui lòng kiểm tra chính sách hủy phòng trước khi đặt. Thông thường, bạn có thể hủy miễn phí trước 24-48 giờ trước ngày nhận phòng.",
  },
  {
    category: "Thanh toán",
    question: "LuxeStay chấp nhận những phương thức thanh toán nào?",
    answer:
      "Chúng tôi chấp nhận các phương thức thanh toán: thẻ tín dụng/ghi nợ (Visa, Mastercard), ví điện tử (Momo, ZaloPay, VNPay), chuyển khoản ngân hàng và thanh toán tại chỗ (nếu chủ nhà cho phép).",
  },
  {
    category: "Thanh toán",
    question: "Khi nào tiền sẽ được trừ từ tài khoản của tôi?",
    answer:
      "Tiền sẽ được trừ ngay sau khi bạn xác nhận đặt phòng. Đối với một số chỗ nghỉ, bạn có thể chọn thanh toán một phần hoặc toàn bộ. Tiền sẽ được giữ an toàn và chỉ chuyển cho chủ nhà sau khi bạn check-in thành công.",
  },
  {
    category: "Hoàn tiền",
    question: "Làm thế nào để được hoàn tiền khi hủy phòng?",
    answer:
      "Nếu bạn hủy phòng theo đúng chính sách hủy, tiền sẽ được hoàn lại vào phương thức thanh toán ban đầu trong vòng 5-7 ngày làm việc. Số tiền hoàn lại phụ thuộc vào thời điểm hủy và chính sách của chủ nhà.",
  },
  {
    category: "Hoàn tiền",
    question: "Tôi không được hoàn tiền đầy đủ, tại sao?",
    answer:
      "Số tiền hoàn lại phụ thuộc vào chính sách hủy của chủ nhà và thời điểm bạn hủy phòng. Nếu hủy gần ngày nhận phòng, bạn có thể bị trừ phí. Vui lòng kiểm tra email xác nhận hủy để biết chi tiết số tiền được hoàn.",
  },
  {
    category: "Tài khoản",
    question: "Làm sao để tạo tài khoản LuxeStay?",
    answer:
      'Bạn có thể tạo tài khoản bằng cách nhấn "Đăng ký" ở góc trên cùng, sau đó điền email, mật khẩu và thông tin cá nhân. Bạn cũng có thể đăng ký nhanh bằng tài khoản Google hoặc Facebook.',
  },
  {
    category: "Tài khoản",
    question: "Tôi quên mật khẩu, phải làm sao?",
    answer:
      'Nhấn vào "Quên mật khẩu" ở trang đăng nhập, nhập email đã đăng ký. Chúng tôi sẽ gửi link đặt lại mật khẩu đến email của bạn. Kiểm tra cả hộp thư spam nếu không thấy email.',
  },
  {
    category: "Chủ nhà",
    question: "Làm thế nào để trở thành chủ nhà trên LuxeStay?",
    answer:
      'Nhấn vào "Cho thuê chỗ ở" ở trang chủ, điền thông tin về chỗ nghỉ của bạn (địa chỉ, loại phòng, tiện nghi, giá), tải lên hình ảnh chất lượng cao và đợi xét duyệt. Sau khi được duyệt, chỗ nghỉ của bạn sẽ xuất hiện trên nền tảng.',
  },
  {
    category: "Chủ nhà",
    question: "Tôi nhận được tiền khi nào sau khi có khách đặt phòng?",
    answer:
      "Tiền sẽ được chuyển vào tài khoản của bạn sau 24 giờ kể từ khi khách check-in thành công. Bạn có thể rút tiền về tài khoản ngân hàng bất cứ lúc nào từ ví LuxeStay của mình.",
  },
  {
    category: "An toàn",
    question: "LuxeStay bảo vệ thông tin cá nhân của tôi như thế nào?",
    answer:
      "Chúng tôi sử dụng mã hóa SSL 256-bit để bảo vệ tất cả thông tin cá nhân và thanh toán. Dữ liệu của bạn được lưu trữ an toàn và không bao giờ được chia sẻ với bên thứ ba không có sự đồng ý của bạn.",
  },
  {
    category: "An toàn",
    question: "Nếu có vấn đề với chỗ nghỉ, tôi phải làm gì?",
    answer:
      "Hãy liên hệ với chủ nhà ngay lập tức. Nếu không giải quyết được, liên hệ bộ phận hỗ trợ LuxeStay qua chat, email hoặc hotline. Chúng tôi có chính sách bảo vệ khách hàng và sẽ hỗ trợ bạn tìm giải pháp phù hợp.",
  },
]

export default function HelpCenterPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-500/10 via-cyan-50 to-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-xl mb-4">
              <HelpCircle className="h-10 w-10 text-white" />
            </div>
            <h1 className="font-serif text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 bg-clip-text text-transparent">
              Trung tâm trợ giúp
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Tìm câu trả lời cho mọi câu hỏi của bạn về LuxeStay
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto pt-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Tìm kiếm câu hỏi, chủ đề..."
                  className="pl-12 py-6 text-lg border-2 focus:border-primary"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h2 className="font-serif text-4xl font-bold text-foreground">Chủ đề phổ biến</h2>
              <p className="text-lg text-muted-foreground">Chọn chủ đề bạn cần hỗ trợ</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category, index) => (
                <Card key={index} className="group hover:shadow-xl transition-all duration-300 cursor-pointer">
                  <CardContent className="p-6 space-y-4">
                    <div
                      className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${category.color} shadow-lg group-hover:scale-110 transition-transform`}
                    >
                      <category.icon className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h3 className="font-serif text-xl font-bold text-foreground mb-1">{category.title}</h3>
                      <p className="text-sm text-muted-foreground">{category.count} bài viết</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h2 className="font-serif text-4xl font-bold text-foreground">Câu hỏi thường gặp</h2>
              <p className="text-lg text-muted-foreground">Những câu hỏi được hỏi nhiều nhất</p>
            </div>

            <Card className="border-none shadow-xl">
              <CardContent className="p-6 md:p-8">
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left hover:no-underline">
                        <div className="space-y-1 pr-4">
                          <div className="text-sm text-primary font-semibold">{faq.category}</div>
                          <div className="text-base font-semibold text-foreground">{faq.question}</div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-muted-foreground leading-relaxed pl-0 pt-2">{faq.answer}</p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Support */}
      <section className="py-16 bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h2 className="font-serif text-4xl md:text-5xl font-bold">Không tìm thấy câu trả lời?</h2>
            <p className="text-xl text-white/90 leading-relaxed">
              Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giúp đỡ bạn 24/7
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <a
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-white text-blue-500 font-semibold text-lg hover:shadow-2xl transition-all"
              >
                Liên hệ hỗ trợ
              </a>
              <a
                href="/messages"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-white/10 backdrop-blur-sm text-white font-semibold text-lg border-2 border-white/30 hover:bg-white/20 transition-all gap-2"
              >
                <MessageSquare className="h-5 w-5" />
                Chat ngay
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
