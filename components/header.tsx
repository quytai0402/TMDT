"use client"

import Link from "next/link"
import { Menu, User, Heart, Globe, Trophy, Sparkles, Crown, Users, Compass, Calendar, MessageSquare, Building2, LayoutDashboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AuthModal } from "@/components/auth-modal"
import { useAuthModal } from "@/hooks/use-auth-modal"
import { NotificationCenter } from "@/components/notification-center"
import { MobileMenu } from "@/components/mobile-menu"
import { UserRewardsBadge } from "@/components/user-rewards-badge"
import { canAccessAdmin, canManageListings, isGuest, resolveRoleLabel } from "@/lib/rbac"
import { useConciergeAccess } from "@/hooks/use-concierge-access"

const MEMBERSHIP_BADGE_STYLES: Record<string, { label: string; className: string }> = {
  SILVER: {
    label: "Silver",
    className: "h-5 px-1.5 text-[10px] bg-gradient-to-r from-slate-400 to-slate-600 border-0",
  },
  GOLD: {
    label: "Gold",
    className: "h-5 px-1.5 text-[10px] bg-gradient-to-r from-amber-500 to-amber-600 border-0",
  },
  PLATINUM: {
    label: "Platinum",
    className: "h-5 px-1.5 text-[10px] bg-gradient-to-r from-gray-500 to-gray-700 border-0",
  },
  DIAMOND: {
    label: "Diamond",
    className: "h-5 px-1.5 text-[10px] bg-gradient-to-r from-cyan-500 to-blue-600 border-0",
  },
}

function resolveMembershipKey(tier: string | null | undefined) {
  if (!tier) return null
  const normalized = tier.toString().toUpperCase()
  if (normalized in MEMBERSHIP_BADGE_STYLES) {
    return normalized as keyof typeof MEMBERSHIP_BADGE_STYLES
  }
  if (normalized.includes("DIAMOND")) return "DIAMOND"
  if (normalized.includes("PLATINUM")) return "PLATINUM"
  if (normalized.includes("GOLD")) return "GOLD"
  if (normalized.includes("SILVER")) return "SILVER"
  return null
}

export function Header() {
  const { data: session } = useSession()
  const router = useRouter()
  const authModal = useAuthModal()
  const isAuthenticated = !!session?.user
  const { hasAccess: conciergeAccess, resolvedTier, loading: conciergeLoading } = useConciergeAccess()
  const sessionTier = session?.user?.membership ?? null
  const normalizedTier = resolvedTier ?? (sessionTier ? sessionTier.toString().toUpperCase() : null)
  const badgeKey = resolveMembershipKey(normalizedTier)
  const membershipBadge = badgeKey ? MEMBERSHIP_BADGE_STYLES[badgeKey] : undefined


  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/80 shadow-sm">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Mobile Menu */}
          <div className="flex items-center gap-2 md:hidden">
            <MobileMenu />
          </div>

          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="h-8 w-8 md:h-9 md:w-9 rounded-xl bg-gradient-to-br from-primary via-primary to-pink-500 flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
              <span className="text-white font-serif text-base md:text-lg font-bold">L</span>
            </div>
            <span className="font-serif text-lg md:text-xl font-bold bg-gradient-to-r from-primary to-pink-600 bg-clip-text text-transparent hidden sm:inline">LuxeStay</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-0.5">
            <Link href="/search" className="px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:text-primary hover:bg-primary/5 rounded-lg transition-all duration-200">
              Khám phá
            </Link>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 px-2.5 text-sm text-gray-700 hover:text-primary hover:bg-primary/5 rounded-lg transition-all duration-200">
                  <Sparkles className="h-3.5 w-3.5 mr-1" />
                  Collections
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem onClick={() => router.push('/collections')}>
                  Tất cả Collections
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/collections/romantic-getaways')}>
                  💕 Romantic Getaways
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/collections/workation-spots')}>
                  💻 Workation Paradise
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/collections/beach-vibes')}>
                  🏖️ Beach Vibes
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link href="/personas" className="px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:text-primary hover:bg-primary/5 rounded-lg transition-all duration-200 flex items-center gap-1">
              <LayoutDashboard className="h-3.5 w-3.5" />
              Chủ đề
            </Link>

            <Link href="/experiences" className="px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:text-primary hover:bg-primary/5 rounded-lg transition-all duration-200 flex items-center gap-1">
              <Compass className="h-3.5 w-3.5" />
              Trải nghiệm
            </Link>

            <Link href="/community" className="px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:text-primary hover:bg-primary/5 rounded-lg transition-all duration-200 flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              Cộng đồng
            </Link>

            <Link href="/rewards" className="px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:text-primary hover:bg-primary/5 rounded-lg transition-all duration-200 flex items-center gap-1">
              <Trophy className="h-3.5 w-3.5" />
              Rewards
            </Link>

            <Link href="/membership" className="px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:text-primary hover:bg-primary/5 rounded-lg transition-all duration-200 flex items-center gap-1">
              <Crown className="h-3.5 w-3.5" />
              Membership
            </Link>

            {conciergeAccess && !conciergeLoading && (
              <Link href="/concierge" className="px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:text-primary hover:bg-primary/5 rounded-lg transition-all duration-200 flex items-center gap-1 relative">
                <MessageSquare className="h-3.5 w-3.5" />
                Concierge
                <Badge className="ml-1 h-4 px-1.5 text-[10px] bg-gradient-to-r from-primary to-pink-500 text-white border-0 shadow-sm">24/7</Badge>
              </Link>
            )}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center space-x-2 md:space-x-3">
            <Button variant="ghost" size="icon" className="hidden md:flex h-9 w-9 hover:bg-primary/10 hover:text-primary rounded-lg transition-all duration-200">
              <Globe className="h-5 w-5" />
            </Button>

            <Button 
              variant="ghost" 
              size="icon" 
              className="hidden md:flex h-9 w-9 hover:bg-primary/10 hover:text-primary rounded-lg transition-all duration-200"
              onClick={() => {
                if (isAuthenticated) {
                  router.push('/wishlist')
                } else {
                  authModal.openLogin()
                }
              }}
            >
              <Heart className="h-5 w-5" />
            </Button>

            {/* Notification Center - Only show when authenticated */}
            {isAuthenticated && <NotificationCenter />}

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center space-x-2 border border-gray-200 rounded-full px-2 py-2 hover:shadow-md hover:border-primary/30 transition-all duration-200">
                    <Menu className="h-4 w-4 text-gray-600" />
                    <Avatar className="h-7 w-7 ring-2 ring-primary/10">
                      <AvatarImage src={session.user.image || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-pink-500 text-white text-sm">
                        {session.user.name?.charAt(0) || session.user.email?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col flex-1">
                        <p className="text-sm font-medium flex items-center gap-1.5">
                          {session.user.name}
                          {membershipBadge ? (
                            <Badge className={membershipBadge.className}>
                              <Crown className="h-3 w-3" />
                              <span className="ml-1 hidden sm:inline">{membershipBadge.label}</span>
                            </Badge>
                          ) : null}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {resolveRoleLabel(session.user.role)} • {session.user.email}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {/* Rewards Info Badge */}
                  <UserRewardsBadge />
                  
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => router.push('/rewards')}>
                      <Trophy className="h-4 w-4 mr-2" />
                      Rewards & Quests
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/membership')}>
                      <Crown className="h-4 w-4 mr-2" />
                      Membership
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  
                  {isGuest(session.user.role) && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuItem onClick={() => router.push('/trips')}>
                          Chuyến đi
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push('/wishlist')}>
                          Yêu thích
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push('/expenses')}>
                          Quản lý chi tiêu
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push('/become-host')}>
                          Trở thành chủ nhà
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push('/become-guide')}>
                          Trở thành hướng dẫn viên
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push('/profile')}>
                          Tài khoản
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </>
                  )}
                  
                  <DropdownMenuSeparator />
                  {canManageListings(session.user.role) ? (
                    <>
                      <DropdownMenuGroup>
                        <DropdownMenuLabel className="text-xs text-muted-foreground font-semibold">Host Tools</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => router.push('/host/dashboard')}>
                          <LayoutDashboard className="h-4 w-4 mr-2" />
                          Dashboard chủ nhà
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push('/host/listings')}>
                          <Building2 className="h-4 w-4 mr-2" />
                          Quản lý listings
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push('/host/calendar')}>
                          <Calendar className="h-4 w-4 mr-2" />
                          Lịch đặt phòng
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                    </>
                  ) : null}
                  {session.user.isGuide ? (
                    <>
                      <DropdownMenuGroup>
                        <DropdownMenuLabel className="text-xs text-muted-foreground font-semibold">Guide Tools</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => router.push('/guide/dashboard')}>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Dashboard hướng dẫn viên
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push('/guide/experiences')}>
                          <Compass className="h-4 w-4 mr-2" />
                          Quản lý trải nghiệm
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push('/guide/bookings')}>
                          <Calendar className="h-4 w-4 mr-2" />
                          Lịch & Booking
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                    </>
                  ) : null}
                  {canAccessAdmin(session.user.role) ? (
                    <>
                      <DropdownMenuGroup>
                        <DropdownMenuItem onClick={() => router.push('/admin/dashboard')} className="font-medium">
                          <LayoutDashboard className="h-4 w-4 mr-2" />
                          Dashboard Admin
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                    </>
                  ) : null}
                  <DropdownMenuItem 
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="text-red-600"
                  >
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  className="font-semibold text-gray-700 hover:text-primary hover:bg-primary/5 rounded-lg transition-all duration-200"
                  onClick={() => authModal.openLogin()}
                >
                  Đăng nhập
                </Button>
                <Button 
                  className="bg-gradient-to-r from-primary to-pink-500 hover:from-primary/90 hover:to-pink-500/90 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                  onClick={() => authModal.openRegister()}
                >
                  Đăng ký
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal 
        open={authModal.isOpen} 
        onOpenChange={(open) => !open && authModal.close()}
        defaultTab={authModal.defaultTab}
      />
    </header>
  )
}
