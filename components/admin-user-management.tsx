"use client"

import { useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Loader2, MoreVertical, Search, ShieldCheck, UserCheck, UserX } from "lucide-react"

type AdminUser = {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  role?: string | null
  isVerified?: boolean | null
  isSuperHost?: boolean | null
  isHost?: boolean | null
  loyaltyPoints?: number | null
  loyaltyTier?: string | null
  createdAt?: string | Date | null
  lastLoginAt?: string | Date | null
  _count?: {
    listings?: number
    bookingsAsGuest?: number
    bookingsAsHost?: number
  }
}

const ROLE_FILTERS: Array<{ label: string; value: string }> = [
  { label: "Tất cả", value: "all" },
  { label: "Khách hàng", value: "guest" },
  { label: "Chủ nhà", value: "host" },
  { label: "Quản trị", value: "admin" },
]

const formatNumber = (value?: number | null) => {
  if (!value) return "0"
  return new Intl.NumberFormat("vi-VN").format(value)
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
      return "default"
    case "HOST":
      return "secondary"
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

export function UserManagement() {
  const [roleFilter, setRoleFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    const fetchUsers = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/admin/users?type=${roleFilter}&limit=50`, {
          cache: "no-store",
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error("Không thể tải danh sách người dùng")
        }

        const data = await response.json()
        setUsers(Array.isArray(data?.users) ? data.users : [])
      } catch (err) {
        if ((err as Error).name === "AbortError") return
        console.error("Failed to fetch users:", err)
        setError("Không thể tải dữ liệu người dùng. Vui lòng thử lại.")
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
    return () => controller.abort()
  }, [roleFilter])

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) {
      return users
    }

    const keyword = searchQuery.trim().toLowerCase()
    return users.filter((user) => {
      const name = user.name?.toLowerCase() ?? ""
      const email = user.email?.toLowerCase() ?? ""
      return name.includes(keyword) || email.includes(keyword)
    })
  }, [users, searchQuery])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quản lý người dùng</CardTitle>
        <CardDescription>Theo dõi và kiểm soát người dùng trên toàn nền tảng</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo tên hoặc email..."
              className="pl-10"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full md:w-52">
              <SelectValue placeholder="Lọc theo vai trò" />
            </SelectTrigger>
            <SelectContent>
              {ROLE_FILTERS.map((role) => (
                <SelectItem key={role.value} value={role.value}>
                  {role.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {error ? (
          <div className="mt-8 rounded-lg border border-destructive bg-destructive/10 p-6 text-center text-sm text-destructive">
            {error}
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="mt-10 rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
            Không tìm thấy người dùng phù hợp với điều kiện lọc hiện tại.
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {filteredUsers.map((user) => {
              const bookingsCount =
                (user._count?.bookingsAsGuest ?? 0) + (user._count?.bookingsAsHost ?? 0)

              return (
                <div
                  key={user.id}
                  className="flex flex-wrap items-start justify-between gap-4 rounded-lg border p-4 transition hover:border-primary"
                >
                  <div className="flex min-w-[260px] flex-1 items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.image || undefined} />
                      <AvatarFallback>
                        {user.name?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? "U"}
                      </AvatarFallback>
                    </Avatar>

                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-semibold">{user.name || "Chưa đặt tên"}</h4>
                        {statusIndicator(user)}
                        <Badge variant={roleBadgeVariant(user.role)}>{user.role ?? "GUEST"}</Badge>
                        {user.isSuperHost && (
                          <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                            Super Host
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span>{user.email}</span>
                        {user.loyaltyTier && (
                          <Badge variant="outline" className="border-purple-200 bg-purple-50 text-purple-700">
                            {user.loyaltyTier} · {formatNumber(user.loyaltyPoints)} điểm
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground md:grid-cols-4">
                        <div className="rounded-md bg-muted p-2">
                          <p className="text-xs uppercase">Gia nhập</p>
                          <p className="font-medium text-foreground">{formatDate(user.createdAt)}</p>
                        </div>
                        <div className="rounded-md bg-muted p-2">
                          <p className="text-xs uppercase">Đăng nhập gần nhất</p>
                          <p className="font-medium text-foreground">{formatDate(user.lastLoginAt)}</p>
                        </div>
                        <div className="rounded-md bg-muted p-2">
                          <p className="text-xs uppercase">Listings</p>
                          <p className="font-medium text-foreground">{formatNumber(user._count?.listings)}</p>
                        </div>
                        <div className="rounded-md bg-muted p-2">
                          <p className="text-xs uppercase">Bookings</p>
                          <p className="font-medium text-foreground">{formatNumber(bookingsCount)}</p>
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
                      <DropdownMenuItem disabled>
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Xác minh (sắp ra mắt)
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled>
                        <UserCheck className="mr-2 h-4 w-4" />
                        Gán vai trò (sắp ra mắt)
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled className="text-red-600">
                        <UserX className="mr-2 h-4 w-4" />
                        Khóa tài khoản (sắp ra mắt)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
