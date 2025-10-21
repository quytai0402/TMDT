"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Newspaper, Download, ExternalLink, Calendar, Award } from "lucide-react"

const pressReleases = [
  {
    date: "15/03/2024",
    title: "LuxeStay công bố vòng gọi vốn Series A trị giá 10 triệu USD",
    excerpt: "Khoản đầu tư từ các quỹ đầu tư hàng đầu sẽ giúp LuxeStay mở rộng quy mô và nâng cao chất lượng dịch vụ.",
    category: "Tài chính",
  },
  {
    date: "28/02/2024",
    title: "LuxeStay đạt mốc 500,000 người dùng và 10,000 chỗ nghỉ",
    excerpt: "Nền tảng ghi nhận tốc độ tăng trưởng ấn tượng với 200% tăng trưởng so với cùng kỳ năm ngoái.",
    category: "Doanh thu",
  },
  {
    date: "10/02/2024",
    title: 'LuxeStay nhận giải thưởng "Startup công nghệ tiêu biểu 2024"',
    excerpt: "Được vinh danh tại Vietnam Startup Awards 2024 cho đóng góp trong lĩnh vực công nghệ du lịch.",
    category: "Giải thưởng",
  },
  {
    date: "20/01/2024",
    title: "Ra mắt tính năng AI cá nhân hóa trải nghiệm tìm kiếm",
    excerpt: "LuxeStay ứng dụng trí tuệ nhân tạo để giúp người dùng tìm kiếm chỗ nghỉ phù hợp nhanh hơn và chính xác hơn.",
    category: "Sản phẩm",
  },
  {
    date: "05/01/2024",
    title: "LuxeStay mở rộng sang 5 thành phố lớn mới",
    excerpt: "Nền tảng chính thức có mặt tại Cần Thơ, Nha Trang, Vũng Tàu, Phú Quốc và Đà Lạt.",
    category: "Mở rộng",
  },
]

const mediaKit = [
  {
    title: "Logo & Brand Assets",
    description: "Logo, màu sắc thương hiệu và hướng dẫn sử dụng",
    file: "brand-assets.zip",
    size: "2.5 MB",
  },
  {
    title: "Press Kit 2024",
    description: "Thông tin công ty, thống kê và hình ảnh chất lượng cao",
    file: "press-kit-2024.pdf",
    size: "8.3 MB",
  },
  {
    title: "Company Profile",
    description: "Hồ sơ năng lực và giới thiệu doanh nghiệp",
    file: "company-profile.pdf",
    size: "4.2 MB",
  },
]

const awards = [
  {
    year: "2024",
    title: "Startup công nghệ tiêu biểu 2024",
    organization: "Vietnam Startup Awards",
  },
  {
    year: "2023",
    title: "Top 10 Nền tảng du lịch tốt nhất Việt Nam",
    organization: "Vietnam Travel Awards",
  },
  {
    year: "2023",
    title: "Giải pháp công nghệ sáng tạo nhất",
    organization: "Tech Innovation Summit",
  },
]

export default function PressPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-indigo-500/10 via-purple-50 to-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-xl mb-4">
              <Newspaper className="h-10 w-10 text-white" />
            </div>
            <h1 className="font-serif text-5xl md:text-6xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Báo chí
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Tin tức, thông cáo báo chí và tài liệu truyền thông về LuxeStay
            </p>
          </div>
        </div>
      </section>

      {/* Press Contact */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="border-none shadow-xl bg-gradient-to-br from-indigo-50 to-purple-50">
              <CardContent className="p-8 md:p-12 space-y-4">
                <h2 className="font-serif text-3xl font-bold text-foreground">Liên hệ báo chí</h2>
                <p className="text-lg text-muted-foreground">
                  Để biết thêm thông tin hoặc yêu cầu phỏng vấn, vui lòng liên hệ:
                </p>
                <div className="space-y-2 text-muted-foreground">
                  <p>
                    <span className="font-semibold">Email:</span>{" "}
                    <a href="mailto:press@luxestay.vn" className="text-primary hover:underline">
                      press@luxestay.vn
                    </a>
                  </p>
                  <p>
                    <span className="font-semibold">Điện thoại:</span> +84 24 1234 5678
                  </p>
                  <p>
                    <span className="font-semibold">Giờ làm việc:</span> 9:00 - 18:00 (Thứ Hai - Thứ Sáu)
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Press Releases */}
      <section className="py-16 bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h2 className="font-serif text-4xl font-bold text-foreground">Thông cáo báo chí</h2>
              <p className="text-lg text-muted-foreground">Tin tức mới nhất về LuxeStay</p>
            </div>

            <div className="space-y-4">
              {pressReleases.map((release, index) => (
                <Card key={index} className="hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <Badge variant="outline" className="gap-1">
                            <Calendar className="h-3 w-3" />
                            {release.date}
                          </Badge>
                          <Badge>{release.category}</Badge>
                        </div>
                        <h3 className="font-serif text-2xl font-bold text-foreground">{release.title}</h3>
                        <p className="text-muted-foreground leading-relaxed">{release.excerpt}</p>
                      </div>
                      <div className="flex-shrink-0">
                        <Button variant="outline" className="gap-2">
                          Xem chi tiết
                          <ExternalLink className="h-4 w-4" />
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

      {/* Media Kit */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h2 className="font-serif text-4xl font-bold text-foreground">Bộ tài liệu truyền thông</h2>
              <p className="text-lg text-muted-foreground">Tải về logo, hình ảnh và tài liệu về LuxeStay</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {mediaKit.map((item, index) => (
                <Card key={index} className="hover:shadow-xl transition-shadow">
                  <CardContent className="p-6 space-y-4">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg">
                      <Download className="h-7 w-7 text-white" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-serif text-xl font-bold text-foreground">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                      <p className="text-xs text-muted-foreground">{item.size}</p>
                    </div>
                    <Button className="w-full gap-2">
                      <Download className="h-4 w-4" />
                      Tải về
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Awards */}
      <section className="py-16 bg-gradient-to-b from-purple-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 shadow-xl mb-2">
                <Award className="h-8 w-8 text-white" />
              </div>
              <h2 className="font-serif text-4xl font-bold text-foreground">Giải thưởng & Vinh danh</h2>
              <p className="text-lg text-muted-foreground">Những thành tựu đáng tự hào của chúng tôi</p>
            </div>

            <div className="space-y-4">
              {awards.map((award, index) => (
                <Card key={index} className="hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg">
                          <span className="text-white font-bold text-xl">{award.year}</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-serif text-xl font-bold text-foreground mb-1">{award.title}</h3>
                        <p className="text-muted-foreground">{award.organization}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
