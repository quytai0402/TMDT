"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
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
import { NotificationCenter } from "@/components/notification-center"
import {
  LayoutDashboard,
  Home,
  Calendar,
  ClipboardList,
  MessageCircle,
  BarChart3,
  DollarSign,
  Wallet,
  Zap,
  BookOpen,
  TicketPercent,
  Settings,
  Menu,
  Search,
  Plus,
  ChevronRight,
  HelpCircle,
  LogOut,
  Star,
} from "lucide-react"

type HostNavMetrics = {
  upcomingBookings?: number | null
  activeListings?: number | null
  unreadMessages?: number | null
}

type HostNavItem = {
  title: string
  href: string
  icon: typeof LayoutDashboard
  badgeKey?: keyof HostNavMetrics
}

type HostNavItemWithBadge = HostNavItem & { badge: string | null }

const NAV_ITEMS: HostNavItem[] = [
  {
    title: "Tổng quan",
    href: "/host/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Listings",
    href: "/host/listings",
    icon: Home,
    badgeKey: "activeListings",
  },
  {
    title: "Lịch đặt phòng",
    href: "/host/calendar",
    icon: Calendar,
    badgeKey: "upcomingBookings",
  },
  {
    title: "Đơn đặt phòng",
    href: "/host/bookings",
    icon: ClipboardList,
  },
  {
    title: "Tin nhắn",
    href: "/host/messages",
    icon: MessageCircle,
    badgeKey: "unreadMessages",
  },
  {
    title: "Đánh giá",
    href: "/host/reviews",
    icon: Star,
  },
  {
    title: "Thống kê",
    href: "/host/analytics",
    icon: BarChart3,
  },
  {
    title: "Smart Pricing",
    href: "/host/pricing",
    icon: DollarSign,
  },
  {
    title: "Ví host",
    href: "/host/payouts",
    icon: Wallet,
  },
  {
    title: "Tự động hóa",
    href: "/host/automation",
    icon: Zap,
  },
  {
    title: "Tài nguyên",
    href: "/host/resources",
    icon: BookOpen,
  },
  {
    title: "Coupon",
    href: "/host/coupons",
    icon: TicketPercent,
  },
  {
    title: "Cài đặt",
    href: "/host/settings",
    icon: Settings,
  },
]

export interface HostDashboardLayoutProps {
  children: React.ReactNode
  metrics?: HostNavMetrics
}

export function HostDashboardLayout({ children, metrics }: HostDashboardLayoutProps) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navItems = useMemo<HostNavItemWithBadge[]>(() => {
    const formatBadge = (value?: number | null) => {
      if (typeof value !== "number") return null
      if (value <= 0) return null
      if (value > 99) return "99+"
      return String(value)
    }

    return NAV_ITEMS.map((item) => ({
      ...item,
      badge: item.badgeKey ? formatBadge(metrics?.[item.badgeKey]) : null,
    }))
  }, [metrics])

  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(`${href}/`) || (href === "/host/dashboard" && pathname === "/host")

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="border-b p-6">
        <Link href="/host/dashboard" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-emerald-500 shadow-lg">
            <span className="font-serif text-xl font-bold text-white">H</span>
          </div>
          <div>
            <div className="font-serif text-xl font-bold text-foreground">Host Center</div>
            <div className="text-xs text-muted-foreground">Quản lý kinh doanh</div>
          </div>
        </Link>
      </div>

      <div className="border-b p-4">
        <Button asChild className="w-full">
          <Link href="/host/listings/new">
            <Plus className="mr-2 h-4 w-4" />
            Tạo listing mới
          </Link>
        </Button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-all ${
                active
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className="flex-1 font-medium">{item.title}</span>
              {item.badge ? (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {item.badge}
                </span>
              ) : null}
            </Link>
          )
        })}
      </nav>

      <div className="space-y-2 border-t p-4">
        <Link
          href="/help"
          className="flex items-center gap-3 rounded-lg px-4 py-3 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
        >
          <HelpCircle className="h-5 w-5" />
          <span className="flex-1 font-medium">Trung tâm hỗ trợ</span>
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-muted/30">
      <aside className="fixed left-0 top-0 hidden h-full w-72 border-r bg-background lg:block">
        <SidebarContent />
      </aside>

      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      <div className="lg:ml-72">
        <header className="sticky top-0 z-40 border-b bg-background">
          <div className="flex h-16 items-center justify-between px-4 lg:px-8">
            <div className="flex items-center gap-3">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
              </Sheet>

              <div className="hidden items-center gap-2 rounded-lg bg-muted/50 px-4 py-2 md:flex">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Tìm kiếm trong trung tâm host"
                  className="flex-1 border-none bg-transparent text-sm outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button asChild variant="outline" className="hidden md:flex">
                <Link href="/host/listings/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Tạo listing
                </Link>
              </Button>

              <NotificationCenter />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={session?.user?.image || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {session?.user?.name?.[0]?.toUpperCase() || session?.user?.email?.[0]?.toUpperCase() || "H"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden text-left md:block">
                      <div className="text-sm font-semibold">{session?.user?.name || "Host"}</div>
                      <div className="text-xs text-muted-foreground">{session?.user?.email}</div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Tài khoản host</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/host/profile">Hồ sơ của tôi</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/host/settings">Cài đặt</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600" onSelect={() => signOut({ callbackUrl: "/" })}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="px-4 pb-10 pt-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}
