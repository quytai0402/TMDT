"use client"

import { useState } from "react"
import { Menu, X, Home, Search, Heart, User, MessageSquare, Calendar, Trophy, Crown, Settings, LogOut, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export function MobileMenu() {
  const [open, setOpen] = useState(false)
  const { data: session } = useSession()
  const router = useRouter()

  const handleNavigate = (href: string) => {
    router.push(href)
    setOpen(false)
  }

  const menuItems = [
    { icon: Home, label: "Trang chủ", href: "/" },
    { icon: Search, label: "Tìm kiếm", href: "/search" },
    { icon: Heart, label: "Yêu thích", href: "/wishlist", auth: true },
    { icon: Calendar, label: "Chuyến đi", href: "/trips", auth: true },
    { icon: MessageSquare, label: "Tin nhắn", href: "/messages", auth: true },
    { icon: Trophy, label: "Loyalty", href: "/loyalty", auth: true },
  ]

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* User Section */}
          {session?.user ? (
            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
              <Avatar className="h-12 w-12">
                <AvatarImage src={session.user.image || undefined} />
                <AvatarFallback>
                  {session.user.name?.charAt(0) || session.user.email?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{session.user.name || "User"}</p>
                <p className="text-sm text-muted-foreground truncate">{session.user.email}</p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-3">
                Đăng nhập để trải nghiệm đầy đủ tính năng
              </p>
              <Button onClick={() => handleNavigate("/login")} className="w-full">
                <LogIn className="h-4 w-4 mr-2" />
                Đăng nhập
              </Button>
            </div>
          )}

          <Separator />

          {/* Menu Items */}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              if (item.auth && !session?.user) return null
              const Icon = item.icon
              return (
                <button
                  key={item.href}
                  onClick={() => handleNavigate(item.href)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{item.label}</span>
                </button>
              )
            })}
          </nav>

          {session?.user && (
            <>
              <Separator />

              {/* Account Actions */}
              <div className="space-y-1">
                <button
                  onClick={() => handleNavigate("/profile")}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <User className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Hồ sơ</span>
                </button>

                <button
                  onClick={() => handleNavigate("/membership")}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <Crown className="h-5 w-5 text-yellow-500" />
                  <span className="font-medium">Membership</span>
                </button>

                <button
                  onClick={() => handleNavigate("/settings")}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <Settings className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Cài đặt</span>
                </button>

                <Separator className="my-2" />

                <button
                  onClick={() => {
                    signOut({ callbackUrl: "/" })
                    setOpen(false)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-destructive/10 text-destructive transition-colors text-left"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">Đăng xuất</span>
                </button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
