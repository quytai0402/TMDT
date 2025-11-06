"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
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
  Calendar,
  Compass,
  BarChart3,
  Wallet,
  Star,
  Menu,
  Search,
  HelpCircle,
  LogOut,
  Plus,
  Users,
} from "lucide-react"

export type GuideNavMetrics = {
  upcomingExperiences?: number | null
  pendingBookings?: number | null
  rating?: number | null
}

export type GuideDashboardLayoutProps = {
  children: React.ReactNode
  metrics?: GuideNavMetrics
}

type GuideNavItem = {
  title: string
  href: string
  icon: typeof LayoutDashboard
  badgeKey?: keyof GuideNavMetrics
}

type GuideNavItemWithBadge = GuideNavItem & { badge: string | null }

const NAV_ITEMS: GuideNavItem[] = [
  {
    title: "Tổng quan",
    href: "/guide/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Trải nghiệm",
    href: "/guide/experiences",
    icon: Compass,
    badgeKey: "upcomingExperiences",
  },
  {
    title: "Lịch & Booking",
    href: "/guide/bookings",
    icon: Calendar,
    badgeKey: "pendingBookings",
  },
  {
    title: "Doanh thu",
    href: "/guide/earnings",
    icon: Wallet,
  },
  {
    title: "Đánh giá",
    href: "/guide/reviews",
    icon: Star,
    badgeKey: "rating",
  },
  {
    title: "Đối tác",
    href: "/guide/partners",
    icon: Users,
  },
]

export function GuideDashboardLayout({ children, metrics }: GuideDashboardLayoutProps) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navItems = useMemo<GuideNavItemWithBadge[]>(() => {
    const formatBadge = (value?: number | null) => {
      if (typeof value !== "number") return null
      if (!Number.isFinite(value) || value <= 0) return null
      if (value > 99) return "99+"
      if (value < 1 && value > 0) {
        return value.toFixed(1)
      }
      return String(value)
    }

    return NAV_ITEMS.map((item) => ({
      ...item,
      badge: item.badgeKey ? formatBadge(metrics?.[item.badgeKey]) : null,
    }))
  }, [metrics])

  const isActive = (href: string) => pathname === href || pathname?.startsWith(`${href}/`)

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="border-b p-6">
        <Link href="/guide/dashboard" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-amber-500 shadow-lg">
            <span className="font-serif text-xl font-bold text-white">G</span>
          </div>
          <div>
            <div className="font-serif text-xl font-bold text-foreground">Guide Center</div>
            <div className="text-xs text-muted-foreground">Quản lý trải nghiệm</div>
          </div>
        </Link>
      </div>

      <div className="border-b p-4">
        <Button asChild className="w-full">
          <Link href="/guide/experiences/new">
            <Plus className="mr-2 h-4 w-4" />
            Tạo trải nghiệm mới
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
          href="/help/guide"
          className="flex items-center gap-3 rounded-lg px-4 py-3 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
        >
          <HelpCircle className="h-5 w-5" />
          <span className="flex-1 font-medium">Trung tâm hỗ trợ</span>
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
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="absolute left-4 top-4 z-50 lg:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      <div className="lg:ml-72">
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="flex h-16 items-center justify-between px-4 lg:px-8">
            <div className="hidden items-center gap-2 rounded-lg bg-muted/50 px-4 py-2 md:flex">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Tìm kiếm trải nghiệm, khách hàng, ghi chú..."
                className="flex-1 border-none bg-transparent text-sm outline-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <Button asChild variant="outline" className="hidden md:flex">
                <Link href="/guide/experiences/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Tạo trải nghiệm
                </Link>
              </Button>

              <NotificationCenter />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={session?.user?.image || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {session?.user?.name?.[0]?.toUpperCase() || session?.user?.email?.[0]?.toUpperCase() || "G"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden text-left md:block">
                      <div className="text-sm font-semibold">{session?.user?.name || "Guide"}</div>
                      <div className="text-xs text-muted-foreground">{session?.user?.email}</div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Tài khoản hướng dẫn viên</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/guide/profile">Hồ sơ hướng dẫn viên</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/guide/settings">Cài đặt</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/guide/partners">Đối tác & đội ngũ</Link>
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
