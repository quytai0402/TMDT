"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import {
  Home,
  Search,
  Heart,
  Calendar,
  User,
  Building2,
  MessageSquare,
  Award,
  ShoppingBag,
  FileText,
  HelpCircle,
  Shield,
  Newspaper,
  Briefcase,
  BookOpen,
  Scale,
  Cookie,
  Map,
  Settings,
  BarChart,
  Users,
} from "lucide-react"

const sections = [
  {
    title: "Trang chính",
    icon: Home,
    color: "from-blue-500 to-cyan-500",
    links: [
      { name: "Trang chủ", href: "/", icon: Home },
      { name: "Tìm kiếm chỗ nghỉ", href: "/search", icon: Search },
      { name: "Danh sách yêu thích", href: "/wishlist", icon: Heart },
      { name: "Chuyến đi của tôi", href: "/trips", icon: Calendar },
    ],
  },
  {
    title: "Tài khoản",
    icon: User,
    color: "from-purple-500 to-pink-500",
    links: [
      { name: "Đăng nhập", href: "/login", icon: User },
      { name: "Đăng ký", href: "/register", icon: User },
      { name: "Hồ sơ cá nhân", href: "/profile", icon: User },
      { name: "Quên mật khẩu", href: "/forgot-password", icon: Shield },
    ],
  },
  {
    title: "Dành cho chủ nhà",
    icon: Building2,
    color: "from-green-500 to-emerald-500",
    links: [
      { name: "Dashboard chủ nhà", href: "/host/dashboard", icon: BarChart },
      { name: "Quản lý chỗ nghỉ", href: "/host/listings", icon: Building2 },
      { name: "Lịch đặt phòng", href: "/host/calendar", icon: Calendar },
      { name: "Tạo chỗ nghỉ mới", href: "/host/listings/new", icon: Building2 },
    ],
  },
  {
    title: "Tính năng",
    icon: Settings,
    color: "from-orange-500 to-red-500",
    links: [
      { name: "Tin nhắn", href: "/messages", icon: MessageSquare },
      { name: "Loyalty Program", href: "/loyalty", icon: Award },
      { name: "Shop quà tặng", href: "/shop", icon: ShoppingBag },
      { name: "Đánh giá", href: "/reviews", icon: FileText },
    ],
  },
  {
    title: "Về LuxeStay",
    icon: FileText,
    color: "from-indigo-500 to-purple-500",
    links: [
      { name: "Giới thiệu", href: "/about", icon: FileText },
      { name: "Tuyển dụng", href: "/careers", icon: Briefcase },
      { name: "Báo chí", href: "/press", icon: Newspaper },
      { name: "Blog du lịch", href: "/blog", icon: BookOpen },
    ],
  },
  {
    title: "Hỗ trợ",
    icon: HelpCircle,
    color: "from-yellow-500 to-amber-500",
    links: [
      { name: "Trung tâm trợ giúp", href: "/help", icon: HelpCircle },
      { name: "An toàn & Bảo mật", href: "/safety", icon: Shield },
      { name: "Chính sách hủy phòng", href: "/cancellation-policy", icon: FileText },
      { name: "Liên hệ", href: "/contact", icon: MessageSquare },
    ],
  },
  {
    title: "Pháp lý",
    icon: Scale,
    color: "from-red-500 to-pink-500",
    links: [
      { name: "Điều khoản dịch vụ", href: "/terms", icon: Scale },
      { name: "Chính sách quyền riêng tư", href: "/privacy", icon: Shield },
      { name: "Chính sách Cookies", href: "/cookies", icon: Cookie },
      { name: "Sơ đồ trang", href: "/sitemap", icon: Map },
    ],
  },
  {
    title: "Admin (Nội bộ)",
    icon: Settings,
    color: "from-gray-500 to-slate-500",
    links: [
      { name: "Admin Dashboard", href: "/admin", icon: BarChart },
      { name: "Quản lý người dùng", href: "/admin/users", icon: Users },
      { name: "Quản lý chỗ nghỉ", href: "/admin/listings", icon: Building2 },
      { name: "Quản lý đặt phòng", href: "/admin/bookings", icon: Calendar },
    ],
  },
]

export default function SitemapPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-cyan-500/10 via-blue-50 to-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 shadow-xl mb-4">
              <Map className="h-10 w-10 text-white" />
            </div>
            <h1 className="font-serif text-5xl md:text-6xl font-bold bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 bg-clip-text text-transparent">
              Sơ đồ trang
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Tổng quan tất cả các trang và tính năng trên LuxeStay
            </p>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-8 bg-blue-50 border-y border-blue-100">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Trang chính", count: sections.reduce((acc, s) => acc + s.links.length, 0) },
                { label: "Danh mục", count: sections.length },
                { label: "Tính năng", count: "30+" },
                { label: "Cập nhật", count: "Hàng ngày" },
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="font-serif text-3xl font-bold text-primary">{stat.count}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Sitemap Content */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-8">
            {sections.map((section, index) => (
              <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div
                      className={`flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br ${section.color} shadow-lg flex items-center justify-center`}
                    >
                      <section.icon className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h2 className="font-serif text-2xl font-bold text-foreground">{section.title}</h2>
                      <p className="text-sm text-muted-foreground">{section.links.length} trang</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {section.links.map((link, linkIndex) => (
                      <Link
                        key={linkIndex}
                        href={link.href}
                        className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all group"
                      >
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                          <link.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                            {link.name}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">{link.href}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* XML Sitemap */}
      <section className="py-16 bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="border-none shadow-xl">
              <CardContent className="p-8 md:p-12 space-y-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 shadow-lg mb-4">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <h2 className="font-serif text-3xl font-bold text-foreground">XML Sitemap</h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Dành cho công cụ tìm kiếm như Google, Bing để index website hiệu quả hơn
                </p>
                <div className="pt-4">
                  <a
                    href="/sitemap.xml"
                    className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold text-lg hover:shadow-2xl transition-all"
                  >
                    Xem XML Sitemap
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Help Section */}
      <section className="py-16 bg-gradient-to-br from-cyan-500 to-blue-500 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h2 className="font-serif text-4xl md:text-5xl font-bold">Không tìm thấy trang bạn cần?</h2>
            <p className="text-xl text-white/90 leading-relaxed">
              Sử dụng tìm kiếm hoặc liên hệ với chúng tôi để được hỗ trợ
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <a
                href="/search"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-white text-cyan-500 font-semibold text-lg hover:shadow-2xl transition-all gap-2"
              >
                <Search className="h-5 w-5" />
                Tìm kiếm
              </a>
              <a
                href="/help"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-white/10 backdrop-blur-sm text-white font-semibold text-lg border-2 border-white/30 hover:bg-white/20 transition-all gap-2"
              >
                <HelpCircle className="h-5 w-5" />
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
