"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Home, Calendar, MessageCircle, BarChart3, Settings, Plus, DollarSign, Zap, BookOpen, ClipboardList, Wallet, TicketPercent } from "lucide-react"
import { Button } from "@/components/ui/button"

const menuItems = [
  { icon: LayoutDashboard, label: "Tổng quan", href: "/host/dashboard" },
  { icon: Home, label: "Listings", href: "/host/listings" },
  { icon: Calendar, label: "Lịch đặt phòng", href: "/host/calendar" },
  { icon: ClipboardList, label: "Đơn đặt phòng", href: "/host/bookings" },
  { icon: MessageCircle, label: "Tin nhắn", href: "/host/messages" },
  { icon: BarChart3, label: "Thống kê", href: "/host/analytics" },
  { icon: DollarSign, label: "Smart Pricing", href: "/host/pricing" },
  { icon: Wallet, label: "Ví host", href: "/host/payouts" },
  { icon: Zap, label: "Tự động hóa", href: "/host/automation" },
  { icon: BookOpen, label: "Tài nguyên", href: "/host/resources" },
  { icon: TicketPercent, label: "Coupon", href: "/host/coupons" },
  { icon: Settings, label: "Cài đặt", href: "/host/settings" },
]

export function HostSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-full lg:w-64 flex-shrink-0">
      <div className="sticky top-24 space-y-4">
        <Button className="w-full bg-primary hover:bg-primary-hover text-white">
          <Plus className="h-4 w-4 mr-2" />
          Tạo listing mới
        </Button>

        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive ? "bg-primary text-white" : "text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
