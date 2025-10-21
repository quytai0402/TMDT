"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Building2, Users, Globe, Award, Heart, Sparkles } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-pink-50 to-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-pink-500 shadow-xl mb-4">
              <Building2 className="h-10 w-10 text-white" />
            </div>
            <h1 className="font-serif text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-pink-500 to-red-500 bg-clip-text text-transparent">
              Về LuxeStay
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Nền tảng đặt phòng homestay, khách sạn và trải nghiệm du lịch hàng đầu Việt Nam
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="border-none shadow-xl">
              <CardContent className="p-8 md:p-12 space-y-6">
                <h2 className="font-serif text-3xl font-bold text-foreground">Sứ mệnh của chúng tôi</h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  LuxeStay ra đời với sứ mệnh kết nối du khách với những chủ nhà nhiệt tình, tạo ra những trải nghiệm lưu trú 
                  độc đáo và đáng nhớ. Chúng tôi tin rằng mỗi chuyến đi không chỉ là về điểm đến, mà còn là về những con người 
                  bạn gặp và những câu chuyện bạn tạo ra.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Với công nghệ hiện đại và dịch vụ tận tâm, chúng tôi cam kết mang đến nền tảng đặt phòng an toàn, thuận tiện 
                  và đáng tin cậy cho cả khách hàng và chủ nhà.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { icon: Building2, number: "10,000+", label: "Chỗ nghỉ" },
                { icon: Users, number: "500,000+", label: "Khách hàng" },
                { icon: Globe, number: "63/63", label: "Tỉnh thành" },
                { icon: Award, number: "4.8/5", label: "Đánh giá" },
              ].map((stat, index) => (
                <Card key={index} className="text-center hover:shadow-xl transition-shadow">
                  <CardContent className="p-6 space-y-3">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-pink-500 shadow-lg">
                      <stat.icon className="h-7 w-7 text-white" />
                    </div>
                    <div className="font-serif text-3xl font-bold text-foreground">{stat.number}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="font-serif text-4xl font-bold text-foreground">Giá trị cốt lõi</h2>
              <p className="text-lg text-muted-foreground">
                Những giá trị định hướng mọi hoạt động của chúng tôi
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Heart,
                  color: "from-red-500 to-pink-500",
                  title: "Tận tâm",
                  description: "Đặt khách hàng làm trung tâm, luôn lắng nghe và không ngừng cải thiện dịch vụ.",
                },
                {
                  icon: Sparkles,
                  color: "from-yellow-500 to-orange-500",
                  title: "Chất lượng",
                  description: "Cam kết mang đến những chỗ nghỉ và trải nghiệm chất lượng cao nhất.",
                },
                {
                  icon: Users,
                  color: "from-blue-500 to-cyan-500",
                  title: "Cộng đồng",
                  description: "Xây dựng cộng đồng chủ nhà và du khách gắn kết, chia sẻ niềm đam mê du lịch.",
                },
              ].map((value, index) => (
                <Card key={index} className="group hover:shadow-2xl transition-all duration-300">
                  <CardContent className="p-8 space-y-4 text-center">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${value.color} shadow-lg group-hover:scale-110 transition-transform`}>
                      <value.icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-serif text-2xl font-bold text-foreground">{value.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{value.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-gradient-to-b from-pink-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <h2 className="font-serif text-4xl font-bold text-foreground">Đội ngũ của chúng tôi</h2>
              <p className="text-lg text-muted-foreground">
                Một nhóm những người đam mê du lịch, công nghệ và dịch vụ khách hàng
              </p>
            </div>

            <Card className="border-none shadow-xl">
              <CardContent className="p-8 md:p-12">
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Đội ngũ LuxeStay bao gồm các chuyên gia từ nhiều lĩnh vực khác nhau - từ công nghệ, du lịch, 
                  dịch vụ khách hàng đến marketing. Chúng tôi đều có chung một niềm đam mê: tạo ra những trải nghiệm 
                  du lịch tuyệt vời và kết nối mọi người qua những chuyến đi đáng nhớ.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-primary to-pink-500 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h2 className="font-serif text-4xl md:text-5xl font-bold">Cùng tạo nên câu chuyện của bạn</h2>
            <p className="text-xl text-white/90 leading-relaxed">
              Khám phá hàng nghìn chỗ nghỉ độc đáo hoặc chia sẻ không gian của bạn với du khách từ khắp nơi
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <a
                href="/search"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-white text-primary font-semibold text-lg hover:shadow-2xl transition-all"
              >
                Khám phá ngay
              </a>
              <a
                href="/host/listings"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-white/10 backdrop-blur-sm text-white font-semibold text-lg border-2 border-white/30 hover:bg-white/20 transition-all"
              >
                Trở thành chủ nhà
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
