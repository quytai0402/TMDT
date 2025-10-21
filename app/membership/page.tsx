import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { MembershipPricing } from "@/components/membership-pricing"
import { MemberBenefitsShowcase } from "@/components/member-benefits-showcase"
import { Separator } from "@/components/ui/separator"

export default function MembershipPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-16 space-y-20">
          {/* Pricing Section */}
          <section>
            <MembershipPricing />
          </section>

          <Separator />

          {/* Benefits Showcase */}
          <section>
            <MemberBenefitsShowcase />
          </section>

          {/* FAQ Section */}
          <section className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Câu hỏi thường gặp</h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Tôi có thể hủy membership bất kỳ lúc nào không?</h3>
                <p className="text-muted-foreground">
                  Có, bạn có thể hủy membership bất kỳ lúc nào. Quyền lợi sẽ tiếp tục có hiệu lực đến hết kỳ đã thanh toán.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Đêm miễn phí có thời hạn sử dụng không?</h3>
                <p className="text-muted-foreground">
                  Các đêm miễn phí hết hạn vào cuối năm membership. Hãy sử dụng trong vòng 12 tháng kể từ khi nhận được.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Tôi có thể nâng cấp membership giữa kỳ không?</h3>
                <p className="text-muted-foreground">
                  Có, bạn có thể nâng cấp bất kỳ lúc nào. Chỉ cần thanh toán phần chênh lệch và quyền lợi mới sẽ được kích hoạt ngay lập tức.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Secret Collection có homestays nào?</h3>
                <p className="text-muted-foreground">
                  Secret Collection bao gồm các homestays cao cấp, villa riêng tư và chỗ nghỉ độc đáo chỉ dành cho members. Danh sách được cập nhật hàng tháng.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Giảm giá member có cộng dồn với khuyến mãi khác không?</h3>
                <p className="text-muted-foreground">
                  Giảm giá member được áp dụng sau các khuyến mãi khác, giúp bạn tiết kiệm tối đa. Tuy nhiên, một số chương trình đặc biệt có thể có điều kiện riêng.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
