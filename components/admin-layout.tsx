"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  LayoutDashboard,
  Users,
  Building2,
  Calendar,
  DollarSign,
  FileText,
  MessageSquare,
  Settings,
  BarChart3,
  Search,
  Menu,
  Home,
  Shield,
  Award,
  ChevronRight,
  LogOut,
} from "lucide-react"
import { NotificationCenter } from "@/components/notification-center"

type NavMetrics = {
  users?: number
  listings?: number
  bookings?: number
}

type NavItem = {
  title: string
  href: string
  icon: typeof LayoutDashboard
  badgeKey?: keyof NavMetrics
  fallbackBadge?: string | null
}

type NavItemWithBadge = NavItem & { badge: string | null }

const NAV_ITEMS: NavItem[] = [
  {
    title: "Tổng quan",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Người dùng",
    href: "/admin/users",
    icon: Users,
    badgeKey: "users",
  },
  {
    title: "Chỗ nghỉ",
    href: "/admin/listings",
    icon: Building2,
    badgeKey: "listings",
  },
  {
    title: "Đặt phòng",
    href: "/admin/bookings",
    icon: Calendar,
    badgeKey: "bookings",
  },
  {
    title: "Thanh toán",
    href: "/admin/payments",
    icon: DollarSign,
  },
  {
    title: "Đánh giá",
    href: "/admin/reviews",
    icon: FileText,
  },
  {
    title: "Tin nhắn",
    href: "/admin/messages",
    icon: MessageSquare,
  },
  {
    title: "Báo cáo",
    href: "/admin/reports",
    icon: BarChart3,
  },
  {
    title: "Bảo mật",
    href: "/admin/security",
    icon: Shield,
    fallbackBadge: "!",
  },
  {
    title: "Cài đặt",
    href: "/admin/settings",
    icon: Settings,
  },
]

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [metrics, setMetrics] = useState<NavMetrics>({})

  useEffect(() => {
    const controller = new AbortController()

    const fetchMetrics = async () => {
      try {
        const res = await fetch("/api/admin/analytics?period=30", {
          cache: "no-store",
          signal: controller.signal,
        })
        if (!res.ok) return

        const data = await res.json()
        setMetrics({
          users: data?.overview?.totalUsers,
          listings: data?.overview?.totalListings,
          bookings: data?.overview?.totalBookings,
        })
      } catch (err) {
        if ((err as Error).name === "AbortError") return
        console.error("Failed to load navigation metrics:", err)
      }
    }

    fetchMetrics()
    return () => controller.abort()
  }, [])

  const navItemsWithBadges: NavItemWithBadge[] = useMemo(() => {
    const formatBadge = (value?: number) => {
      if (typeof value !== "number") return null
      return new Intl.NumberFormat("vi-VN", {
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(value)
    }

    return NAV_ITEMS.map<NavItemWithBadge>((item) => {
      const badgeValue = item.badgeKey ? formatBadge(metrics[item.badgeKey]) : null
      return {
        ...item,
        badge: badgeValue ?? item.fallbackBadge ?? null,
      }
    })
  }, [metrics])

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === href
    }
    return pathname?.startsWith(href)
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center shadow-lg">
            <span className="text-white font-serif text-xl font-bold">L</span>
          </div>
          <div>
            <div className="font-serif text-xl font-bold text-foreground">LuxeStay</div>
            <div className="text-xs text-muted-foreground">Admin Panel</div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItemsWithBadges.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                active
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className="flex-1 font-medium">{item.title}</span>
              {item.badge && (
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    active
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : item.badge === "!"
                        ? "bg-red-100 text-red-600"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Action */}
      <div className="p-4 border-t space-y-2">
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
        >
          <Home className="h-5 w-5" />
          <span className="flex-1 font-medium">Về trang chủ</span>
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-72 bg-background border-r hidden lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="lg:ml-72">
        {/* Top Navbar */}
        <header className="sticky top-0 z-40 bg-background border-b">
          <div className="flex items-center justify-between h-16 px-4 lg:px-8">
            {/* Left Section */}
            <div className="flex items-center gap-4">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
              </Sheet>

              {/* Search */}
              <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 w-96">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  className="bg-transparent border-none outline-none text-sm flex-1"
                />
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-3">
              <NotificationCenter />

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={session?.user?.image || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-pink-500 text-white">
                          {session?.user?.name?.[0]?.toUpperCase() || session?.user?.email?.[0]?.toUpperCase() || "A"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden md:block text-left">
                        <div className="text-sm font-semibold">{session?.user?.name || "Admin"}</div>
                        <div className="text-xs text-muted-foreground">{session?.user?.email || "admin@luxestay.vn"}</div>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Tài khoản</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Settings className="h-4 w-4 mr-2" />
                    Cài đặt
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Award className="h-4 w-4 mr-2" />
                    Hồ sơ
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600" onSelect={() => signOut({ callbackUrl: '/' })}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
