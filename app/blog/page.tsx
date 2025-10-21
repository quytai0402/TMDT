"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen, Calendar, Clock, User, TrendingUp, Heart } from "lucide-react"

const blogPosts = [
  {
    title: "10 Homestay view đẹp nhất Đà Lạt cho chuyến du lịch mùa hoa",
    excerpt:
      "Khám phá những homestay có view tuyệt đẹp tại Đà Lạt, lý tưởng cho chuyến du lịch ngắm hoa và nghỉ dưỡng.",
    author: "Minh Anh",
    date: "15/03/2024",
    readTime: "8 phút",
    category: "Địa điểm",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop",
    trending: true,
  },
  {
    title: "Kinh nghiệm đặt phòng homestay tiết kiệm cho sinh viên",
    excerpt: "Hướng dẫn chi tiết cách tìm và đặt homestay giá rẻ mà vẫn chất lượng cho các bạn sinh viên.",
    author: "Tuấn Anh",
    date: "12/03/2024",
    readTime: "6 phút",
    category: "Mẹo hay",
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop",
  },
  {
    title: "Checklist chuẩn bị cho chuyến du lịch hoàn hảo",
    excerpt: "Danh sách đầy đủ những thứ cần chuẩn bị trước khi bắt đầu chuyến du lịch của bạn.",
    author: "Thu Hà",
    date: "10/03/2024",
    readTime: "5 phút",
    category: "Hướng dẫn",
    image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop",
  },
  {
    title: "Review chi tiết homestay gần biển tại Đà Nẵng",
    excerpt: "Trải nghiệm thực tế tại các homestay view biển đẹp nhất Đà Nẵng với mức giá phải chăng.",
    author: "Hoàng Long",
    date: "08/03/2024",
    readTime: "10 phút",
    category: "Review",
    image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&fit=crop",
    trending: true,
  },
  {
    title: "Những sai lầm cần tránh khi đặt homestay lần đầu",
    excerpt: "Kinh nghiệm quý báu giúp bạn tránh những rắc rối không đáng có khi đặt homestay.",
    author: "Linh Chi",
    date: "05/03/2024",
    readTime: "7 phút",
    category: "Mẹo hay",
    image: "https://images.unsplash.com/photo-1586611292717-f828b167408c?w=800&h=600&fit=crop",
  },
  {
    title: "Khám phá ẩm thực địa phương khi du lịch Hội An",
    excerpt: "Những món ăn đặc sản không thể bỏ qua khi đến thăm phố cổ Hội An.",
    author: "Minh Châu",
    date: "02/03/2024",
    readTime: "9 phút",
    category: "Ẩm thực",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop",
  },
  {
    title: "Hướng dẫn trở thành host thành công trên LuxeStay",
    excerpt: "Bí quyết để tạo listing hấp dẫn và thu hút nhiều khách đặt phòng.",
    author: "Quang Huy",
    date: "28/02/2024",
    readTime: "12 phút",
    category: "Cho host",
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
  },
  {
    title: "Top 5 homestay lý tưởng cho gia đình tại Sapa",
    excerpt: "Những homestay rộng rãi, an toàn và phù hợp cho chuyến du lịch cùng gia đình.",
    author: "Phương Anh",
    date: "25/02/2024",
    readTime: "8 phút",
    category: "Địa điểm",
    image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop",
  },
  {
    title: "Xu hướng du lịch 2024: Staycation và Workation",
    excerpt: "Tìm hiểu về hai xu hướng du lịch mới đang được giới trẻ ưa chuộng.",
    author: "Nam Khánh",
    date: "20/02/2024",
    readTime: "6 phút",
    category: "Xu hướng",
    image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&h=600&fit=crop",
    trending: true,
  },
]

const categories = ["Tất cả", "Địa điểm", "Mẹo hay", "Review", "Hướng dẫn", "Cho host", "Ẩm thực", "Xu hướng"]

export default function BlogPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-emerald-500/10 via-teal-50 to-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-xl mb-4">
              <BookOpen className="h-10 w-10 text-white" />
            </div>
            <h1 className="font-serif text-5xl md:text-6xl font-bold bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
              Blog du lịch
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Chia sẻ kinh nghiệm, mẹo hay và câu chuyện du lịch từ cộng đồng LuxeStay
            </p>
          </div>
        </div>
      </section>

      {/* Categories Filter */}
      <section className="py-8 bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => (
              <Button
                key={category}
                variant={category === "Tất cả" ? "default" : "outline"}
                className="whitespace-nowrap"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Post */}
      <section className="py-12 bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h2 className="font-serif text-3xl font-bold text-foreground flex items-center gap-2">
                <TrendingUp className="h-8 w-8 text-primary" />
                Bài viết nổi bật
              </h2>
            </div>

            {blogPosts
              .filter((post) => post.trending)
              .slice(0, 1)
              .map((post, index) => (
                <Card key={index} className="overflow-hidden hover:shadow-2xl transition-shadow group">
                  <div className="grid md:grid-cols-2 gap-0">
                    <div className="relative h-64 md:h-auto overflow-hidden">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <Badge className="absolute top-4 left-4 bg-primary">{post.category}</Badge>
                    </div>
                    <CardContent className="p-8 md:p-12 flex flex-col justify-center space-y-4">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {post.author}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {post.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {post.readTime}
                        </span>
                      </div>
                      <h3 className="font-serif text-3xl font-bold text-foreground">{post.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{post.excerpt}</p>
                      <div>
                        <Button className="gap-2">
                          Đọc tiếp
                          <BookOpen className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))}
          </div>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-8">
            <div>
              <h2 className="font-serif text-3xl font-bold text-foreground">Bài viết mới nhất</h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogPosts.map((post, index) => (
                <Card key={index} className="overflow-hidden hover:shadow-xl transition-shadow group flex flex-col">
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <Badge className="absolute top-4 left-4 bg-primary">{post.category}</Badge>
                    {post.trending && (
                      <Badge className="absolute top-4 right-4 bg-orange-500 gap-1">
                        <TrendingUp className="h-3 w-3" />
                        Hot
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-6 flex-1 flex flex-col space-y-3">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {post.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {post.readTime}
                      </span>
                    </div>
                    <h3 className="font-serif text-xl font-bold text-foreground line-clamp-2">{post.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 flex-1">{post.excerpt}</p>
                    <div className="pt-2">
                      <Button variant="outline" size="sm" className="w-full gap-2">
                        Đọc tiếp
                        <BookOpen className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Load More */}
            <div className="flex justify-center pt-4">
              <Button variant="outline" size="lg">
                Xem thêm bài viết
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm mb-2">
              <Heart className="h-8 w-8 text-white" />
            </div>
            <h2 className="font-serif text-4xl font-bold">Đăng ký nhận bài viết mới</h2>
            <p className="text-xl text-white/90">
              Nhận thông báo về các bài viết, mẹo du lịch và ưu đãi đặc biệt mỗi tuần
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto pt-4">
              <input
                type="email"
                placeholder="Email của bạn"
                className="flex-1 px-4 py-3 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-white"
              />
              <Button className="bg-white text-emerald-500 hover:bg-white/90 font-semibold px-8">
                Đăng ký
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
