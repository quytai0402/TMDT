"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { FileText, Scale, CheckCircle, AlertCircle } from "lucide-react"

const sections = [
  {
    title: "1. Chấp nhận điều khoản",
    content: `Bằng việc truy cập và sử dụng nền tảng LuxeStay, bạn đồng ý tuân thủ và bị ràng buộc bởi các Điều khoản Dịch vụ này. Nếu bạn không đồng ý với bất kỳ phần nào của các điều khoản, bạn không có quyền sử dụng dịch vụ của chúng tôi.

Các điều khoản này áp dụng cho tất cả người dùng của trang web, bao gồm nhưng không giới hạn ở khách hàng, chủ nhà, nhà cung cấp nội dung và người đóng góp thông tin.`,
  },
  {
    title: "2. Tài khoản người dùng",
    content: `**Đăng ký tài khoản:**
- Bạn phải cung cấp thông tin chính xác, đầy đủ và cập nhật khi đăng ký
- Bạn chịu trách nhiệm duy trì tính bảo mật của tài khoản và mật khẩu
- Bạn phải thông báo ngay cho chúng tôi về bất kỳ vi phạm bảo mật nào

**Quyền hạn tài khoản:**
- Chúng tôi có quyền tạm ngưng hoặc chấm dứt tài khoản vi phạm điều khoản
- Một người chỉ được tạo một tài khoản duy nhất
- Nghiêm cấm việc mua bán tài khoản`,
  },
  {
    title: "3. Dịch vụ đặt phòng",
    content: `**Quy trình đặt phòng:**
- Khách hàng tìm kiếm và chọn chỗ nghỉ phù hợp
- Xác nhận thông tin và thanh toán qua nền tảng
- Nhận xác nhận đặt phòng qua email
- Check-in theo đúng thời gian đã thỏa thuận

**Trách nhiệm của khách:**
- Tuân thủ nội quy của chỗ nghỉ
- Giữ gìn tài sản và vệ sinh
- Thanh toán đầy đủ theo giá đã thỏa thuận
- Báo cáo kịp thời nếu có vấn đề

**Trách nhiệm của chủ nhà:**
- Cung cấp thông tin chính xác về chỗ nghỉ
- Đảm bảo chất lượng như đã mô tả
- Hỗ trợ khách trong thời gian lưu trú
- Tuân thủ chính sách hủy phòng`,
  },
  {
    title: "4. Thanh toán và phí dịch vụ",
    content: `**Phương thức thanh toán:**
LuxeStay chấp nhận các hình thức thanh toán: thẻ tín dụng/ghi nợ, ví điện tử, chuyển khoản ngân hàng.

**Phí dịch vụ:**
- Khách hàng: 5-10% giá trị đặt phòng
- Chủ nhà: 3-15% tùy gói dịch vụ
- Phí được hiển thị rõ ràng trước khi thanh toán

**Chính sách hoàn tiền:**
Tuân theo chính sách hủy phòng của từng chỗ nghỉ. Thời gian hoàn tiền: 5-7 ngày làm việc kể từ khi được duyệt.`,
  },
  {
    title: "5. Nội dung người dùng",
    content: `**Đánh giá và nhận xét:**
- Phải trung thực, dựa trên trải nghiệm thực tế
- Không chứa ngôn từ xúc phạm, phân biệt đối xử
- Không spam hoặc quảng cáo trái phép

**Quyền sở hữu:**
- Bạn giữ quyền sở hữu nội dung của mình
- Bạn cấp cho LuxeStay quyền sử dụng nội dung để vận hành dịch vụ
- Chúng tôi có quyền xóa nội dung vi phạm`,
  },
  {
    title: "6. Hành vi cấm",
    content: `Nghiêm cấm các hành vi sau:
- Gian lận, lừa đảo hoặc cung cấp thông tin sai
- Vi phạm quyền sở hữu trí tuệ
- Sử dụng dịch vụ cho mục đích bất hợp pháp
- Gửi spam, virus hoặc mã độc hại
- Quấy rối, đe dọa người dùng khác
- Tạo tài khoản giả hoặc mạo danh
- Can thiệp vào hệ thống bảo mật`,
  },
  {
    title: "7. Giới hạn trách nhiệm",
    content: `**Không bảo đảm:**
Dịch vụ được cung cấp "nguyên trạng". Chúng tôi không đảm bảo dịch vụ luôn khả dụng, không lỗi hoặc an toàn tuyệt đối.

**Giới hạn trách nhiệm pháp lý:**
LuxeStay không chịu trách nhiệm cho:
- Thiệt hại gián tiếp, ngẫu nhiên hoặc hậu quả
- Mất mát về dữ liệu hoặc lợi nhuận
- Hành vi của người dùng khác
- Vấn đề phát sinh từ lực bất khả kháng

Tổng trách nhiệm của chúng tôi không vượt quá số tiền bạn đã thanh toán trong 12 tháng gần nhất.`,
  },
  {
    title: "8. Quyền sở hữu trí tuệ",
    content: `Tất cả nội dung trên LuxeStay (logo, thiết kế, văn bản, mã nguồn) thuộc quyền sở hữu của chúng tôi hoặc được cấp phép hợp pháp.

Bạn không được:
- Sao chép, sửa đổi hoặc phân phối nội dung mà không có sự cho phép
- Sử dụng logo hoặc thương hiệu của chúng tôi trái phép
- Tạo sản phẩm phái sinh từ dịch vụ của chúng tôi`,
  },
  {
    title: "9. Sửa đổi điều khoản",
    content: `Chúng tôi có quyền sửa đổi các Điều khoản này bất cứ lúc nào. Những thay đổi quan trọng sẽ được thông báo qua email hoặc thông báo trên trang web.

Việc bạn tiếp tục sử dụng dịch vụ sau khi thay đổi có hiệu lực đồng nghĩa với việc bạn chấp nhận các điều khoản mới.`,
  },
  {
    title: "10. Luật áp dụng",
    content: `Các Điều khoản này được điều chỉnh bởi luật pháp Việt Nam. Mọi tranh chấp phát sinh sẽ được giải quyết tại Tòa án có thẩm quyền tại Thành phố Hà Nội.

Nếu có mâu thuẫn giữa bản tiếng Việt và các bản dịch khác, bản tiếng Việt sẽ có giá trị cao nhất.`,
  },
]

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-indigo-500/10 via-blue-50 to-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-500 shadow-xl mb-4">
              <Scale className="h-10 w-10 text-white" />
            </div>
            <h1 className="font-serif text-5xl md:text-6xl font-bold bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
              Điều khoản Dịch vụ
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Quy định sử dụng và điều khoản pháp lý của nền tảng LuxeStay
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>Cập nhật lần cuối: 01/01/2024</span>
            </div>
          </div>
        </div>
      </section>

      {/* Important Notice */}
      <section className="py-8 bg-blue-50 border-y border-blue-100">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-4 items-start">
              <AlertCircle className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">Lưu ý quan trọng</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Vui lòng đọc kỹ các Điều khoản Dịch vụ này trước khi sử dụng LuxeStay. Việc sử dụng dịch vụ 
                  của chúng tôi đồng nghĩa với việc bạn đã đọc, hiểu và đồng ý với tất cả các điều khoản dưới đây.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Terms Content */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            {sections.map((section, index) => (
              <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-8 space-y-4">
                  <h2 className="font-serif text-2xl font-bold text-foreground flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-indigo-600" />
                    </div>
                    {section.title}
                  </h2>
                  <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed whitespace-pre-line">
                    {section.content}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h2 className="font-serif text-4xl font-bold text-foreground">Câu hỏi thường gặp</h2>
              <p className="text-lg text-muted-foreground">Giải đáp nhanh về điều khoản dịch vụ</p>
            </div>

            <Card className="border-none shadow-xl">
              <CardContent className="p-6 md:p-8">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger className="text-left">
                      Tôi có thể hủy đặt phòng khi nào?
                    </AccordionTrigger>
                    <AccordionContent>
                      Bạn có thể hủy đặt phòng bất cứ lúc nào, tuy nhiên số tiền hoàn lại phụ thuộc vào chính sách 
                      hủy của chủ nhà và thời điểm bạn hủy. Vui lòng xem chi tiết tại trang Chính sách hủy.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-2">
                    <AccordionTrigger className="text-left">
                      LuxeStay có thu phí dịch vụ không?
                    </AccordionTrigger>
                    <AccordionContent>
                      Có, chúng tôi thu phí dịch vụ từ 5-10% đối với khách và 3-15% đối với chủ nhà tùy theo 
                      gói dịch vụ. Tất cả phí được hiển thị rõ ràng trước khi bạn xác nhận thanh toán.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-3">
                    <AccordionTrigger className="text-left">
                      Tôi có thể làm gì nếu có tranh chấp với chủ nhà/khách?
                    </AccordionTrigger>
                    <AccordionContent>
                      Hãy liên hệ ngay với bộ phận hỗ trợ LuxeStay. Chúng tôi sẽ làm trung gian để giải quyết 
                      tranh chấp một cách công bằng dựa trên bằng chứng và quy định của nền tảng.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-4">
                    <AccordionTrigger className="text-left">
                      Dữ liệu của tôi có được bảo mật không?
                    </AccordionTrigger>
                    <AccordionContent>
                      Chúng tôi cam kết bảo vệ dữ liệu cá nhân của bạn theo Chính sách Quyền riêng tư. 
                      Mọi thông tin được mã hóa và không chia sẻ cho bên thứ ba mà không có sự đồng ý của bạn.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-gradient-to-br from-indigo-500 to-blue-500 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h2 className="font-serif text-4xl md:text-5xl font-bold">Có câu hỏi về điều khoản?</h2>
            <p className="text-xl text-white/90 leading-relaxed">
              Đội ngũ pháp lý của chúng tôi sẵn sàng giải đáp mọi thắc mắc
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <a
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-white text-indigo-500 font-semibold text-lg hover:shadow-2xl transition-all"
              >
                Liên hệ với chúng tôi
              </a>
              <a
                href="/help"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-white/10 backdrop-blur-sm text-white font-semibold text-lg border-2 border-white/30 hover:bg-white/20 transition-all"
              >
                Trung tâm trợ giúp
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
