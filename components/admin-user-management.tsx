"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, MoreVertical, Shield, Ban, Check, X, Mail, Phone } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface User {
  id: string
  name: string
  email: string
  phone: string
  role: "GUEST" | "HOST" | "ADMIN"
  status: "active" | "suspended" | "banned"
  verified: boolean
  joinDate: Date
  lastActive: Date
  bookings: number
  listings: number
  revenue: number
  rating: number
  avatar: string
}

const mockUsers: User[] = [
  {
    id: "1",
    name: "Nguyễn Văn A",
    email: "nguyenvana@gmail.com",
    phone: "0901234567",
    role: "HOST",
    status: "active",
    verified: true,
    joinDate: new Date("2023-01-15"),
    lastActive: new Date(),
    bookings: 0,
    listings: 5,
    revenue: 125000000,
    rating: 4.9,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user1"
  },
  {
    id: "2",
    name: "Trần Thị B",
    email: "tranthib@gmail.com",
    phone: "0912345678",
    role: "GUEST",
    status: "active",
    verified: true,
    joinDate: new Date("2023-03-20"),
    lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000),
    bookings: 12,
    listings: 0,
    revenue: 0,
    rating: 4.8,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user2"
  },
  {
    id: "3",
    name: "Lê Văn C",
    email: "levanc@gmail.com",
    phone: "0923456789",
    role: "HOST",
    status: "suspended",
    verified: false,
    joinDate: new Date("2023-06-10"),
    lastActive: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    bookings: 0,
    listings: 2,
    revenue: 15000000,
    rating: 3.2,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user3"
  },
  {
    id: "4",
    name: "Phạm Thị D",
    email: "phamthid@gmail.com",
    phone: "0934567890",
    role: "GUEST",
    status: "active",
    verified: true,
    joinDate: new Date("2024-01-05"),
    lastActive: new Date(Date.now() - 1 * 60 * 60 * 1000),
    bookings: 25,
    listings: 0,
    revenue: 0,
    rating: 4.95,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user4"
  },
  {
    id: "5",
    name: "Hoàng Văn E",
    email: "hoangvane@gmail.com",
    phone: "0945678901",
    role: "ADMIN",
    status: "active",
    verified: true,
    joinDate: new Date("2022-11-01"),
    lastActive: new Date(),
    bookings: 0,
    listings: 0,
    revenue: 0,
    rating: 5.0,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user5"
  }
]

export function UserManagement() {
  const [users, setUsers] = useState<User[]>(mockUsers)
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [actionDialog, setActionDialog] = useState<"ban" | "verify" | "promote" | null>(null)

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    const matchesStatus = statusFilter === "all" || user.status === statusFilter
    return matchesSearch && matchesRole && matchesStatus
  })

  const getRoleColor = (role: User["role"]) => {
    switch (role) {
      case "ADMIN": return "bg-red-100 text-red-700"
      case "HOST": return "bg-blue-100 text-blue-700"
      case "GUEST": return "bg-green-100 text-green-700"
    }
  }

  const getStatusColor = (status: User["status"]) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-700"
      case "suspended": return "bg-yellow-100 text-yellow-700"
      case "banned": return "bg-red-100 text-red-700"
    }
  }

  const handleBanUser = (userId: string) => {
    setUsers(users.map(u => u.id === userId ? { ...u, status: "banned" as const } : u))
    setActionDialog(null)
    setSelectedUser(null)
  }

  const handleVerifyUser = (userId: string) => {
    setUsers(users.map(u => u.id === userId ? { ...u, verified: true } : u))
    setActionDialog(null)
    setSelectedUser(null)
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("vi-VN")
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên hoặc email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Vai trò" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả vai trò</SelectItem>
            <SelectItem value="GUEST">Guest</SelectItem>
            <SelectItem value="HOST">Host</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="banned">Banned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách người dùng ({filteredUsers.length})</CardTitle>
          <CardDescription>Quản lý tất cả người dùng trên nền tảng</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 flex-1">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{user.name}</h4>
                      {user.verified && (
                        <Badge variant="outline" className="bg-blue-50">
                          <Check className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                      <Badge className={getRoleColor(user.role)}>
                        {user.role}
                      </Badge>
                      <Badge className={getStatusColor(user.status)}>
                        {user.status}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {user.phone}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                      {user.role === "HOST" && (
                        <>
                          <span>{user.listings} listings</span>
                          <span>{formatCurrency(user.revenue)} revenue</span>
                          <span>⭐ {user.rating}</span>
                        </>
                      )}
                      {user.role === "GUEST" && (
                        <>
                          <span>{user.bookings} bookings</span>
                          <span>⭐ {user.rating}</span>
                        </>
                      )}
                      <span>Tham gia: {formatDate(user.joinDate)}</span>
                    </div>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      setSelectedUser(user)
                      setActionDialog("verify")
                    }}>
                      <Check className="h-4 w-4 mr-2" />
                      Xác thực tài khoản
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      setSelectedUser(user)
                      setActionDialog("promote")
                    }}>
                      <Shield className="h-4 w-4 mr-2" />
                      Thay đổi vai trò
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-red-600"
                      onClick={() => {
                        setSelectedUser(user)
                        setActionDialog("ban")
                      }}
                    >
                      <Ban className="h-4 w-4 mr-2" />
                      Cấm tài khoản
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Dialogs */}
      {actionDialog === "ban" && selectedUser && (
        <Dialog open={true} onOpenChange={() => setActionDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cấm tài khoản</DialogTitle>
              <DialogDescription>
                Bạn có chắc muốn cấm tài khoản <strong>{selectedUser.name}</strong>?
                Người dùng sẽ không thể đăng nhập và sử dụng dịch vụ.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setActionDialog(null)}>
                Hủy
              </Button>
              <Button variant="destructive" onClick={() => handleBanUser(selectedUser.id)}>
                Cấm tài khoản
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {actionDialog === "verify" && selectedUser && (
        <Dialog open={true} onOpenChange={() => setActionDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Xác thực tài khoản</DialogTitle>
              <DialogDescription>
                Xác thực tài khoản <strong>{selectedUser.name}</strong> để tăng độ tin cậy.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setActionDialog(null)}>
                Hủy
              </Button>
              <Button onClick={() => handleVerifyUser(selectedUser.id)}>
                Xác thực
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
