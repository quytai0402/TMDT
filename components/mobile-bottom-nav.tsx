"use client"

import { usePathname, useRouter } from "next/navigation"
import { Home, Search, Heart, User, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSession } from "next-auth/react"
import { Badge } from "@/components/ui/badge"

export function MobileBottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()

  // Hide on certain pages
  const hiddenPaths = ["/login", "/register", "/forgot-password", "/admin"]
  const shouldHide = hiddenPaths.some((path) => pathname?.startsWith(path))

  if (shouldHide) return null

  const navItems = [
    {
      icon: Home,
      label: "Khám phá",
      href: "/",
      active: pathname === "/",
    },
    {
      icon: Search,
      label: "Tìm kiếm",
      href: "/search",
      active: pathname?.startsWith("/search"),
    },
    {
      icon: Heart,
      label: "Yêu thích",
      href: "/wishlist",
      active: pathname?.startsWith("/wishlist"),
      badge: 0, // Có thể thêm số lượng wishlist
    },
    {
      icon: MessageSquare,
      label: "Tin nhắn",
      href: "/messages",
      active: pathname?.startsWith("/messages"),
      badge: 0, // Có thể thêm số tin nhắn chưa đọc
    },
    {
      icon: User,
      label: "Tài khoản",
      href: session ? "/profile" : "/login",
      active: pathname?.startsWith("/profile"),
    },
  ]

  return (
    <>
      {/* Spacer to prevent content from being hidden behind fixed nav */}
      <div className="h-16 md:hidden" />
      
      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
        <div className="grid grid-cols-5 h-16">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 relative transition-colors",
                  item.active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {item.badge !== undefined && item.badge > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
                    >
                      {item.badge > 9 ? "9+" : item.badge}
                    </Badge>
                  )}
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
                {item.active && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-t-full" />
                )}
              </button>
            )
          })}
        </div>
      </nav>
    </>
  )
}
