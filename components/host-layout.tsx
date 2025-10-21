"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Building2, 
  Calendar, 
  DollarSign, 
  FileText,
  MessageSquare,
  BarChart3,
  Settings,
  Home,
  ChevronRight,
  Menu,
  Bell,
  Search
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"

const menuItems = [
  { icon: LayoutDashboard, label: "Tổng quan", href: "/host/dashboard" },
  { icon: Building2, label: "Chỗ nghỉ", href: "/host/listings", badge: "10" },
  { icon: Calendar, label: "Lịch đặt phòng", href: "/host/calendar", badge: "5" },
  { icon: DollarSign, label: "Doanh thu", href: "/host/analytics" },
  { icon: BarChart3, label: "Giá & Phân tích", href: "/host/pricing" },
  { icon: FileText, label: "Đánh giá", href: "/host/reviews", badge: "3" },
  { icon: MessageSquare, label: "Tin nhắn", href: "/host/messages", badge: "2" },
  { icon: Settings, label: "Tự động hóa", href: "/host/automation" },
  { icon: FileText, label: "Tài nguyên", href: "/host/resources" },
  { icon: Settings, label: "Cài đặt", href: "/host/settings" },
]

function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/" className="flex items-center space-x-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary via-primary to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
            L
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-lg font-bold bg-gradient-to-r from-primary to-pink-600 bg-clip-text text-transparent">LuxeStay</span>
            <span className="text-xs text-muted-foreground">Host Panel</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-semibold",
                  isActive 
                    ? "bg-white/20 text-white" 
                    : item.badge === "!" 
                      ? "bg-red-500 text-white" 
                      : "bg-primary/10 text-primary"
                )}>
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Link */}
      <div className="border-t p-4">
        <Link
          href="/"
          className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
        >
          <div className="flex items-center gap-3">
            <Home className="h-5 w-5" />
            <span>Về trang chủ</span>
          </div>
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}

export function HostLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const { data: session } = useSession()
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Sidebar - Desktop */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-72 border-r bg-white lg:block">
        <Sidebar />
      </aside>

      {/* Sidebar - Mobile */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="lg:pl-72">
        {/* Top Navbar */}
        <header className="sticky top-0 z-40 border-b bg-white">
          <div className="flex h-16 items-center gap-4 px-4 lg:px-8">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm..."
                  className="w-full pl-9 bg-muted/50 border-0 focus-visible:ring-1"
                />
              </div>
            </div>

            {/* Right Section */}
            <div className="ml-auto flex items-center gap-3">
              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                  3
                </span>
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 ring-2 ring-primary/10">
                      <AvatarImage src={session?.user?.image || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-pink-500 text-white">
                        {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || "H"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{session?.user?.name || "Host User"}</p>
                      <p className="text-xs text-muted-foreground">{session?.user?.email || "host@luxestay.vn"}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/host/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Cài đặt
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/profile')}>
                    <Home className="mr-2 h-4 w-4" />
                    Hồ sơ
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="text-red-600"
                  >
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
