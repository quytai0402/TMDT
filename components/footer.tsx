import Link from "next/link"
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-muted border-t border-border">
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Company */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Về LuxeStay</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Giới thiệu
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Tuyển dụng
                </Link>
              </li>
              <li>
                <Link href="/press" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Báo chí
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Hỗ trợ</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/help" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Trung tâm trợ giúp
                </Link>
              </li>
              <li>
                <Link href="/safety" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  An toàn
                </Link>
              </li>
              <li>
                <Link
                  href="/cancellation-policy"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Chính sách hủy
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Liên hệ
                </Link>
              </li>
            </ul>
          </div>

          {/* Hosting */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Cho chủ nhà</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/become-host" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Trở thành chủ nhà
                </Link>
              </li>
              <li>
                <Link href="/become-guide" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Trở thành hướng dẫn viên
                </Link>
              </li>
              <li>
                <Link
                  href="/host/resources"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Tài nguyên
                </Link>
              </li>
              <li>
                <Link
                  href="/host/community"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cộng đồng
                </Link>
              </li>
              <li>
                <Link
                  href="/host/standards"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Tiêu chuẩn
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Pháp lý</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Điều khoản
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Quyền riêng tư
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Cookies
                </Link>
              </li>
              <li>
                <Link href="/sitemap" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Sơ đồ trang
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mb-10 rounded-3xl border border-border bg-background/70 p-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-lg font-semibold text-foreground">Muốn chia sẻ trải nghiệm và kiếm thêm thu nhập?</p>
            <p className="text-sm text-muted-foreground">
              Đăng ký làm chủ nhà hoặc hướng dẫn viên ngay hôm nay, đội ngũ LuxeStay sẽ hỗ trợ bạn từng bước.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <Link
              href="/become-host"
              className="flex-1 rounded-xl bg-primary text-primary-foreground px-4 py-3 text-center text-sm font-semibold shadow-lg shadow-primary/10 hover:bg-primary/90"
            >
              Trở thành chủ nhà
            </Link>
            <Link
              href="/become-guide"
              className="flex-1 rounded-xl border border-primary/30 px-4 py-3 text-center text-sm font-semibold text-primary hover:bg-primary/5"
            >
              Trở thành hướng dẫn viên
            </Link>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <p className="text-sm text-muted-foreground">© 2025 LuxeStay. All rights reserved.</p>
          </div>

          <div className="flex items-center space-x-4">
            <Link href="https://facebook.com" className="text-muted-foreground hover:text-foreground transition-colors">
              <Facebook className="h-5 w-5" />
            </Link>
            <Link
              href="https://instagram.com"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Instagram className="h-5 w-5" />
            </Link>
            <Link href="https://twitter.com" className="text-muted-foreground hover:text-foreground transition-colors">
              <Twitter className="h-5 w-5" />
            </Link>
            <Link href="https://youtube.com" className="text-muted-foreground hover:text-foreground transition-colors">
              <Youtube className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
