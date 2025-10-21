"use client"

import { Shield, Award, Headphones, Sparkles, TrendingUp, Heart } from "lucide-react"
import { Card } from "@/components/ui/card"

const features = [
  {
    icon: Shield,
    title: "Bảo mật thanh toán",
    description: "Giao dịch an toàn với công nghệ mã hóa tiên tiến và bảo vệ thông tin khách hàng tuyệt đối",
  },
  {
    icon: Award,
    title: "Chất lượng đảm bảo",
    description: "Tất cả homestay được kiểm duyệt và xác minh kỹ lưỡng bởi đội ngũ chuyên nghiệp",
  },
  {
    icon: Headphones,
    title: "Hỗ trợ 24/7",
    description: "Đội ngũ chăm sóc khách hàng luôn sẵn sàng hỗ trợ bạn mọi lúc mọi nơi",
  },
  {
    icon: Sparkles,
    title: "Trải nghiệm cao cấp",
    description: "Những nơi ở độc đáo với tiện nghi sang trọng và dịch vụ 5 sao",
  },
  {
    icon: TrendingUp,
    title: "Giá tốt nhất",
    description: "Cam kết giá cạnh tranh nhất thị trường với nhiều ưu đãi hấp dẫn",
  },
  {
    icon: Heart,
    title: "Đánh giá thực tế",
    description: "Hệ thống đánh giá minh bạch từ khách hàng đã trải nghiệm thực tế",
  },
]

export function FeaturesSection() {
  return (
    <section className="py-24 bg-gradient-to-b from-muted to-background">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">Tại sao chọn LuxeStay?</h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Chúng tôi cam kết mang đến trải nghiệm đặt phòng tuyệt vời nhất với dịch vụ chuyên nghiệp và tận tâm
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card
                key={index}
                className="p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-border"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-5">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-xl text-foreground mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </Card>
            )
          })}
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <div className="bg-primary/5 border border-primary/20 rounded-3xl p-12 max-w-4xl mx-auto">
            <h3 className="font-serif text-3xl font-bold text-foreground mb-4">Sẵn sàng cho chuyến đi tiếp theo?</h3>
            <p className="text-lg text-muted-foreground mb-8">Hàng nghìn homestay cao cấp đang chờ bạn khám phá</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#search"
                className="inline-flex items-center justify-center px-8 py-4 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-colors"
              >
                Bắt đầu tìm kiếm
              </a>
              <a
                href="/host"
                className="inline-flex items-center justify-center px-8 py-4 bg-white hover:bg-muted text-foreground font-semibold rounded-xl border border-border transition-colors"
              >
                Trở thành chủ nhà
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
