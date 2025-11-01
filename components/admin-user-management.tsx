"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import { useRouter } from "next/navigation"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  ArrowUpRight,
  Home as HomeIcon,
  Loader2,
  LogIn,
  MoreVertical,
  Search,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users as UsersIcon,
  Ban,
  CheckCircle2,
} from "lucide-react"
import { toast } from "sonner"

type RoleFilter = "guest" | "walkin"

type AdminUser = {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  role?: string | null
  status?: string | null
  isVerified?: boolean | null
  isSuperHost?: boolean | null
  isHost?: boolean | null
  loyaltyPoints?: number | null
  loyaltyTier?: string | null
  createdAt?: string | Date | null
  lastLoginAt?: string | Date | null
  phone?: string | null
  bookingsCount?: number | null
  totalSpent?: number | null
  lastBookingAt?: string | Date | null
  lastCheckIn?: string | Date | null
  lastCheckOut?: string | Date | null
  lastListingTitle?: string | null
  lastListingCity?: string | null
  _count?: {
    listings?: number
    bookingsAsGuest?: number
    bookingsAsHost?: number
  }
}

type UserMetrics = {
  totalUsers: number
  hosts: number
  guests: number
  admins: number
  walkInGuests: number
  walkInBookings: number
}

const INITIAL_METRICS: UserMetrics = {
  totalUsers: 0,
  hosts: 0,
  guests: 0,
  admins: 0,
  walkInGuests: 0,
  walkInBookings: 0,
}

const SEGMENTS: Array<{ label: string; value: RoleFilter; description: string }> = [
  { label: "Khách đăng ký", value: "guest", description: "Khách hàng có tài khoản LuxeStay" },
  { label: "Khách vãng lai", value: "walkin", description: "Khách đặt phòng không đăng nhập" },
]

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Quản trị",
  SUPER_ADMIN: "Quản trị",
  HOST: "Chủ nhà",
  GUEST: "Khách",
  WALK_IN: "Khách vãng lai",
}

const formatNumber = (value?: number | null) => {
  if (!value) return "0"
  return new Intl.NumberFormat("vi-VN").format(value)
}

const formatCurrency = (value?: number | null) => {
  if (!value) return "0₫"
  return `${new Intl.NumberFormat("vi-VN").format(Math.round(value))}₫`
}

const formatDate = (value?: string | Date | null) => {
  if (!value) return "—"
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString("vi-VN")
}

const roleBadgeVariant = (role?: string | null) => {
  switch (role) {
    case "ADMIN":
    case "SUPER_ADMIN":
      return "default"
    case "HOST":
      return "secondary"
    case "WALK_IN":
      return "outline"
    default:
      return "outline"
  }
}

const statusIndicator = (user: AdminUser): ReactNode => {
  if (user.isVerified) {
    return (
      <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
        <ShieldCheck className="mr-1 h-3 w-3" />
        Đã xác thực
      </Badge>
    )
  }

  if (user.isHost) {
    return (
      <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
        <UserCheck className="mr-1 h-3 w-3" />
        Host
      </Badge>
    )
  }

  return null
}

const accountStatusBadge = (user: AdminUser) => {
  if (user.status === "SUSPENDED") {
    return <Badge variant="destructive">Đã khóa</Badge>
  }
  return <Badge variant="outline">Đang hoạt động</Badge>
}

const segmentDescription = (
  segment: RoleFilter,
  counts: Record<RoleFilter, number>,
  metrics: UserMetrics,
) => {
  if (segment === "walkin") {
    return `${formatNumber(counts.walkin)} khách vãng lai với ${formatNumber(metrics.walkInBookings)} lượt đặt đã được ghi nhận.`
  }

  return `${formatNumber(counts.guest)} khách đã đăng ký sử dụng nền tảng LuxeStay.`
}

export function UserManagement() {
  const router = useRouter()
  const [segment, setSegment] = useState<RoleFilter>("guest")
  const [searchQuery, setSearchQuery] = useState("")
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<UserMetrics>(INITIAL_METRICS)
  const [paginationTotal, setPaginationTotal] = useState(0)
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    const fetchUsers = async () => {
      try {
        setLoading(true)
        setError(null)

        const params = new URLSearchParams({
          type: segment,
          limit: segment === "walkin" ? "100" : "50",
        })
        params.set("metrics", "true")

        const response = await fetch(`/api/admin/users?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error("Không thể tải danh sách người dùng")
        }

        const data = await response.json()
        const normalizeUser = (user: any): AdminUser => ({
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          status: user.status,
          isVerified: user.isVerified,
          isSuperHost: user.isSuperHost,
          isHost: user.isHost,
          loyaltyPoints: user.loyaltyPoints,
          loyaltyTier: user.loyaltyTier,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
          _count: user._count,
          phone: user.phone,
          totalSpent: user.totalSpent,
          bookingsCount: user.bookingsCount,
        })

        const nextUsers = Array.isArray(data?.users) ? data.users.map(normalizeUser) : []

        setUsers(nextUsers)
        setPaginationTotal(Number(data?.pagination?.total) || nextUsers.length)

        if (data?.metrics) {
          setMetrics((prev) => ({
            totalUsers: data.metrics.totalUsers ?? prev.totalUsers,
            hosts: data.metrics.hosts ?? prev.hosts,
            guests: data.metrics.guests ?? prev.guests,
            admins: data.metrics.admins ?? prev.admins,
            walkInGuests: data.metrics.walkInGuests ?? prev.walkInGuests,
            walkInBookings: data.metrics.walkInBookings ?? prev.walkInBookings,
          }))
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return
        console.error("Failed to fetch users:", err)
        setError("Không thể tải dữ liệu người dùng. Vui lòng thử lại.")
        setUsers([])
        setPaginationTotal(0)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()

    return () => controller.abort()
  }, [segment])

  const countsBySegment = useMemo<Record<RoleFilter, number>>(
    () => ({
      guest: metrics.guests || (segment === "guest" ? paginationTotal : metrics.guests),
      walkin: metrics.walkInGuests || (segment === "walkin" ? paginationTotal : metrics.walkInGuests),
    }),
    [metrics, paginationTotal, segment],
  )

  const performUserAction = useCallback(
    async (userId: string, payload: Record<string, unknown>, successMessage?: string) => {
      try {
        setUpdatingUserId(userId)
        const response = await fetch("/api/admin/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, ...payload }),
        })

        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || "Không thể cập nhật người dùng")
        }

        if (data.user) {
          setUsers((prev) => prev.map((user) => (user.id === userId ? data.user : user)))
        }

        if (successMessage) {
          toast.success(successMessage)
        }
      } catch (error) {
        console.error("performUserAction error:", error)
        toast.error((error as Error).message)
      } finally {
        setUpdatingUserId(null)
      }
    },
    [],
  )

  const handleVerifyUser = useCallback(
    (user: AdminUser, verify: boolean) =>
      performUserAction(
        user.id,
        { action: verify ? "VERIFY" : "UNVERIFY" },
        verify ? "Đã xác minh tài khoản" : "Đã bỏ xác minh",
      ),
    [performUserAction],
  )

  const handleToggleSuspension = useCallback(
    (user: AdminUser) =>
      performUserAction(
        user.id,
        { action: user.status === "SUSPENDED" ? "ACTIVATE" : "SUSPEND" },
        user.status === "SUSPENDED" ? "Đã mở khóa tài khoản" : "Đã khóa tài khoản",
      ),
    [performUserAction],
  )

  const handleAssignRole = useCallback(
    (user: AdminUser) => {
      const rolePrompt = window.prompt(
        "Nhập vai trò mới cho người dùng (GUEST, HOST, ADMIN)",
        user.role ?? "GUEST",
      )
      if (!rolePrompt) return
      const normalized = rolePrompt.trim().toUpperCase()
      if (!["GUEST", "HOST", "ADMIN", "SUPER_ADMIN"].includes(normalized)) {
        toast.error("Vai trò không hợp lệ")
        return
      }
      performUserAction(user.id, { action: "ASSIGN_ROLE", role: normalized }, "Đã cập nhật vai trò")
    },
    [performUserAction],
  )

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) {
      return users
    }

    const keyword = searchQuery.trim().toLowerCase()
    return users.filter((user) => {
      const name = user.name?.toLowerCase() ?? ""
      const email = user.email?.toLowerCase() ?? ""
      const phone = user.phone?.toLowerCase?.() ?? user.phone ?? ""
      return name.includes(keyword) || email.includes(keyword) || phone.toString().includes(keyword)
    })
  }, [users, searchQuery])

  const statCards = [
    {
      title: "Tổng tài khoản",
      value: formatNumber(metrics.totalUsers),
      subtext: `${formatNumber(metrics.hosts)} host • ${formatNumber(metrics.guests)} khách`,
      icon: UsersIcon,
      iconClass: "text-primary",
      cardClass: "bg-gradient-to-br from-primary/10 via-primary/5 to-white border-primary/20",
    },
    {
      title: "Host hoạt động",
      value: formatNumber(metrics.hosts),
      subtext: `${formatNumber(metrics.admins)} quản trị giám sát`,
      icon: HomeIcon,
      iconClass: "text-emerald-600",
      cardClass: "border-emerald-100 bg-emerald-50/40",
    },
    {
      title: "Khách đăng ký",
      value: formatNumber(metrics.guests),
      subtext: `${formatNumber(metrics.walkInGuests)} khách vãng lai`,
      icon: UserCheck,
      iconClass: "text-sky-600",
      cardClass: "border-sky-100 bg-sky-50/50",
    },
    {
      title: "Khách vãng lai",
      value: formatNumber(metrics.walkInGuests),
      subtext: `${formatNumber(metrics.walkInBookings)} lượt đặt`,
      icon: LogIn,
      iconClass: "text-orange-500",
      cardClass: "border-orange-100 bg-orange-50/50",
    },
  ]

  const renderWalkInCard = (user: AdminUser) => {
    const bookingsCount = user.bookingsCount ?? 0
    const totalSpent = formatCurrency(user.totalSpent)
    const lastStayStart = user.lastCheckIn ?? user.lastBookingAt
    const lastStayEnd = user.lastCheckOut
    const listingLabel = user.lastListingTitle
      ? `${user.lastListingTitle}${user.lastListingCity ? ` • ${user.lastListingCity}` : ""}`
      : null
    const searchKey = user.email || user.phone || ""

    return (
      <div
        key={user.id}
        className="rounded-xl border border-primary/30 bg-primary/5 p-5 shadow-sm transition hover:border-primary/50 hover:shadow-md"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="border-primary/30 bg-primary/10 text-primary">
                Khách vãng lai
              </Badge>
              <h4 className="text-lg font-semibold text-primary-900">
                {user.name || "Khách vãng lai"}
              </h4>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {user.email && (
                <span>
                  Email: <span className="font-medium text-foreground">{user.email}</span>
                </span>
              )}
              {user.phone && (
                <span>
                  SĐT: <span className="font-medium text-foreground">{user.phone}</span>
                </span>
              )}
            </div>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            {user.createdAt ? `Lần đầu: ${formatDate(user.createdAt)}` : null}
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-primary/20 bg-white/70 p-3">
            <p className="text-xs uppercase text-primary/70">Lượt đặt</p>
            <p className="mt-1 text-lg font-semibold text-primary">{formatNumber(bookingsCount)}</p>
          </div>
          <div className="rounded-lg border border-primary/20 bg-white/70 p-3">
            <p className="text-xs uppercase text-primary/70">Tổng chi tiêu</p>
            <p className="mt-1 text-lg font-semibold text-primary">{totalSpent}</p>
          </div>
          <div className="rounded-lg border border-primary/20 bg-white/70 p-3">
            <p className="text-xs uppercase text-primary/70">Lần gần nhất</p>
            <p className="mt-1 text-sm font-semibold text-primary">
              {formatDate(lastStayStart)}
              {lastStayEnd ? ` → ${formatDate(lastStayEnd)}` : ""}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
          {listingLabel ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>
                Lưu trú gần nhất:{" "}
                <span className="font-semibold text-foreground">{listingLabel}</span>
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground">
              Chưa có thông tin lưu trú gần nhất
            </span>
          )}

          {searchKey ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-primary px-0"
              onClick={() =>
                router.push(`/admin/bookings?search=${encodeURIComponent(searchKey)}`)
              }
            >
              Xem booking
              <ArrowUpRight className="ml-1 h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.title} className={`border shadow-sm ${card.cardClass}`}>
            <CardContent className="flex items-center justify-between gap-4 p-5">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <p className="text-2xl font-semibold text-foreground">{card.value}</p>
                {card.subtext ? (
                  <p className="text-xs text-muted-foreground">{card.subtext}</p>
                ) : null}
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-inner">
                <card.icon className={`h-5 w-5 ${card.iconClass}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border border-border/70 bg-white/80 shadow-sm backdrop-blur-sm">
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle>Quản lý người dùng</CardTitle>
            <CardDescription>{segmentDescription(segment, countsBySegment, metrics)}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            {SEGMENTS.map((option) => {
              const isActive = option.value === segment
              const count = countsBySegment[option.value] ?? 0
              return (
                <Button
                  key={option.value}
                  size="sm"
                  variant={isActive ? "default" : "outline"}
                  className={`rounded-full px-4 ${isActive ? "shadow-sm" : ""}`}
                  onClick={() => setSegment(option.value)}
                >
                  <span>{option.label}</span>
                  <span
                    className={`ml-2 text-xs ${
                      isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                    }`}
                  >
                    {formatNumber(count)}
                  </span>
                </Button>
              )
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            {SEGMENTS.find((option) => option.value === segment)?.description}
          </p>

          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo tên, email hoặc SĐT..."
              className="pl-10"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>

          {error ? (
            <div className="mt-6 rounded-lg border border-destructive bg-destructive/10 p-6 text-center text-sm text-destructive">
              {error}
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="mt-8 rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
              Không tìm thấy người dùng phù hợp với điều kiện lọc hiện tại.
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {filteredUsers.map((user) =>
                user.role === "WALK_IN" ? (
                  renderWalkInCard(user)
                ) : (
                  <div
                    key={user.id}
                    className="flex flex-wrap items-start justify-between gap-5 rounded-xl border border-border/70 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-primary/50 hover:shadow-md"
                  >
                    <div className="flex min-w-[260px] flex-1 items-start gap-4">
                      <Avatar className="h-12 w-12 ring-2 ring-primary/10">
                        <AvatarImage src={user.image || undefined} />
                        <AvatarFallback>
                          {user.name?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? "U"}
                        </AvatarFallback>
                      </Avatar>

                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-lg font-semibold text-foreground">
                            {user.name || "Chưa đặt tên"}
                          </h4>
                          {statusIndicator(user)}
                          <Badge variant={roleBadgeVariant(user.role)}>
                            {ROLE_LABELS[user.role ?? "GUEST"] ?? user.role ?? "Khách"}
                          </Badge>
                          {accountStatusBadge(user)}
                          {user.isSuperHost ? (
                            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                              Super Host
                            </Badge>
                          ) : null}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          <span>{user.email}</span>
                          {user.loyaltyTier ? (
                            <Badge variant="outline" className="border-purple-200 bg-purple-50 text-purple-700">
                              {user.loyaltyTier} · {formatNumber(user.loyaltyPoints)} điểm
                            </Badge>
                          ) : null}
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground md:grid-cols-4">
                          <div className="rounded-md bg-muted/60 p-2">
                            <p className="text-xs uppercase">Gia nhập</p>
                            <p className="font-medium text-foreground">{formatDate(user.createdAt)}</p>
                          </div>
                          <div className="rounded-md bg-muted/60 p-2">
                            <p className="text-xs uppercase">Đăng nhập gần nhất</p>
                            <p className="font-medium text-foreground">{formatDate(user.lastLoginAt)}</p>
                          </div>
                          <div className="rounded-md bg-muted/60 p-2">
                            <p className="text-xs uppercase">Listings</p>
                            <p className="font-medium text-foreground">
                              {formatNumber(user._count?.listings)}
                            </p>
                          </div>
                          <div className="rounded-md bg-muted/60 p-2">
                            <p className="text-xs uppercase">Bookings</p>
                            <p className="font-medium text-foreground">
                              {formatNumber(
                                (user._count?.bookingsAsGuest ?? 0) +
                                  (user._count?.bookingsAsHost ?? 0),
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-muted-foreground">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleVerifyUser(user, !user.isVerified)}
                          disabled={updatingUserId === user.id}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          {user.isVerified ? "Bỏ xác minh" : "Xác minh tài khoản"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleAssignRole(user)}
                          disabled={updatingUserId === user.id}
                        >
                          <UserCheck className="mr-2 h-4 w-4" />
                          Gán vai trò
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleToggleSuspension(user)}
                          disabled={updatingUserId === user.id}
                          className={user.status === "SUSPENDED" ? "" : "text-red-600"}
                        >
                          <Ban className="mr-2 h-4 w-4" />
                          {user.status === "SUSPENDED" ? "Mở khóa tài khoản" : "Khóa tài khoản"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ),
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
