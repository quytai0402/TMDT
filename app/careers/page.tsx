"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Briefcase, MapPin, Clock, Heart, Rocket, Users, Sparkles, TrendingUp } from "lucide-react"

const jobs = [
  {
    title: "Senior Full-Stack Developer",
    department: "Engineering",
    location: "Hà Nội / Remote",
    type: "Full-time",
    description: "Xây dựng và phát triển nền tảng công nghệ cho hàng triệu người dùng",
    requirements: ["3+ years experience", "React, Node.js, TypeScript", "Database design"],
  },
  {
    title: "Product Designer",
    department: "Design",
    location: "Hồ Chí Minh",
    type: "Full-time",
    description: "Thiết kế trải nghiệm người dùng tuyệt vời cho sản phẩm",
    requirements: ["2+ years experience", "Figma, UI/UX", "User research"],
  },
  {
    title: "Customer Success Manager",
    department: "Customer Service",
    location: "Hà Nội",
    type: "Full-time",
    description: "Đảm bảo khách hàng có trải nghiệm tốt nhất với dịch vụ",
    requirements: ["1+ years experience", "Communication skills", "Problem solving"],
  },
  {
    title: "Marketing Manager",
    department: "Marketing",
    location: "Hồ Chí Minh / Remote",
    type: "Full-time",
    description: "Xây dựng và thực hiện chiến lược marketing cho thương hiệu",
    requirements: ["2+ years experience", "Digital marketing", "Data analysis"],
  },
  {
    title: "Business Development Executive",
    department: "Sales",
    location: "Đà Nẵng",
    type: "Full-time",
    description: "Mở rộng mạng lưới chủ nhà và đối tác kinh doanh",
    requirements: ["1+ years experience", "Sales experience", "Negotiation skills"],
  },
  {
    title: "Content Creator",
    department: "Marketing",
    location: "Remote",
    type: "Part-time",
    description: "Tạo nội dung hấp dẫn về du lịch và trải nghiệm",
    requirements: ["Portfolio required", "Photography/Videography", "Storytelling"],
  },
]

const benefits = [
  {
    icon: Heart,
    title: "Bảo hiểm toàn diện",
    description: "Bảo hiểm sức khỏe, tai nạn cho bạn và gia đình",
  },
  {
    icon: Rocket,
    title: "Phát triển sự nghiệp",
    description: "Đào tạo liên tục, cơ hội thăng tiến rõ ràng",
  },
  {
    icon: Users,
    title: "Môi trường năng động",
    description: "Làm việc với đội ngũ trẻ, sáng tạo và nhiệt huyết",
  },
  {
    icon: Sparkles,
    title: "Ưu đãi du lịch",
    description: "Giảm giá đặc biệt khi sử dụng dịch vụ LuxeStay",
  },
  {
    icon: TrendingUp,
    title: "Lương thưởng hấp dẫn",
    description: "Mức lương cạnh tranh, thưởng hiệu suất định kỳ",
  },
  {
    icon: Clock,
    title: "Linh hoạt làm việc",
    description: "Hybrid/Remote, giờ giấc linh hoạt theo dự án",
  },
]

export default function CareersPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-500/10 via-purple-50 to-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 shadow-xl mb-4">
              <Briefcase className="h-10 w-10 text-white" />
            </div>
            <h1 className="font-serif text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Tuyển dụng
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Gia nhập LuxeStay và cùng xây dựng nền tảng du lịch hàng đầu Việt Nam
            </p>
          </div>
        </div>
      </section>

      {/* Why Join Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6 mb-12">
            <h2 className="font-serif text-4xl font-bold text-foreground">Tại sao chọn LuxeStay?</h2>
            <p className="text-lg text-muted-foreground">
              Làm việc tại một trong những startup công nghệ phát triển nhanh nhất Việt Nam
            </p>
          </div>

          <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="group hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-6 space-y-4">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg group-hover:scale-110 transition-transform">
                    <benefit.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="font-serif text-xl font-bold text-foreground">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-16 bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h2 className="font-serif text-4xl font-bold text-foreground">Vị trí đang tuyển</h2>
              <p className="text-lg text-muted-foreground">
                {jobs.length} vị trí đang mở - Tìm công việc phù hợp với bạn
              </p>
            </div>

            <div className="space-y-4">
              {jobs.map((job, index) => (
                <Card key={index} className="hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-start gap-3">
                          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 shadow-md flex-shrink-0">
                            <Briefcase className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-serif text-2xl font-bold text-foreground mb-1">{job.title}</h3>
                            <p className="text-muted-foreground">{job.description}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary" className="gap-1">
                            <Briefcase className="h-3 w-3" />
                            {job.department}
                          </Badge>
                          <Badge variant="secondary" className="gap-1">
                            <MapPin className="h-3 w-3" />
                            {job.location}
                          </Badge>
                          <Badge variant="secondary" className="gap-1">
                            <Clock className="h-3 w-3" />
                            {job.type}
                          </Badge>
                        </div>

                        <div className="pt-2">
                          <p className="text-sm text-muted-foreground font-semibold mb-2">Yêu cầu:</p>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {job.requirements.map((req, idx) => (
                              <li key={idx} className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                {req}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        <Button className="w-full md:w-auto">Ứng tuyển ngay</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-blue-500 to-purple-500 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h2 className="font-serif text-4xl md:text-5xl font-bold">Không tìm thấy vị trí phù hợp?</h2>
            <p className="text-xl text-white/90 leading-relaxed">
              Gửi CV của bạn cho chúng tôi. Chúng tôi luôn tìm kiếm những người tài năng!
            </p>
            <div className="pt-4">
              <a
                href="mailto:careers@luxestay.vn"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-white text-blue-500 font-semibold text-lg hover:shadow-2xl transition-all"
              >
                Gửi CV
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
