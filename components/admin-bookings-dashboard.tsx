"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Calendar, 
  Phone, 
  Mail, 
  User, 
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp
} from "lucide-react"
import { useState, useEffect } from "react"

interface Booking {
  id: string
  bookingRef: string
  guestName: string
  guestPhone: string
  guestEmail: string
  listingTitle: string
  checkIn: string
  checkOut: string
  guests: number
  nights: number
  total: number
  status: "confirmed" | "pending" | "cancelled" | "completed"
  paymentMethod: string
  createdAt: string
  isGuestBooking: boolean
  guestHistory?: {
    totalBookings: number
    totalSpent: number
  }
}

export function AdminBookingsDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/admin/bookings')
        
        if (!response.ok) {
          throw new Error('Failed to fetch bookings')
        }

        const data = await response.json()
        const transformed = Array.isArray(data.bookings)
          ? data.bookings.map((booking: any) => {
              const guestsCount =
                booking.guests ??
                (booking.adults || 0) +
                  (booking.children || 0) +
                  (booking.infants || 0)
              const status = (booking.status || '').toString().toLowerCase()
              return {
                id: booking.id,
                bookingRef: booking.bookingRef || (typeof booking.id === 'string'
                  ? booking.id.slice(-8).toUpperCase()
                  : ''),
                guestName: booking.guestName || booking.guest?.name || 'Khách vãng lai',
                guestPhone: booking.guestPhone || booking.guest?.phone || '',
                guestEmail: booking.guestEmail || booking.guest?.email || '',
                listingTitle: booking.listing?.title || '—',
                checkIn: booking.checkIn,
                checkOut: booking.checkOut,
                guests: guestsCount,
                nights: booking.nights || 0,
                total: booking.total ?? booking.totalPrice ?? 0,
                status: (status === 'confirmed' || status === 'pending' || status === 'cancelled' || status === 'completed')
                  ? status
                  : 'pending',
                paymentMethod: booking.payment?.paymentMethod || 'N/A',
                createdAt: booking.createdAt,
                isGuestBooking: booking.isGuestBooking ?? booking.guestType === 'WALK_IN',
                guestHistory: booking.guestHistory || null,
              } as Booking
            })
          : []
        setBookings(transformed)
      } catch (error) {
        console.error('Error fetching bookings:', error)
        setBookings([])
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [])

const statusConfig = {
  confirmed: { label: "Đã xác nhận", color: "bg-green-600", icon: CheckCircle2 },
  pending: { label: "Chờ xử lý", color: "bg-yellow-600", icon: Clock },
  cancelled: { label: "Đã hủy", color: "bg-red-600", icon: XCircle },
  completed: { label: "Hoàn thành", color: "bg-blue-600", icon: CheckCircle2 }
}

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(Math.round(price))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    })
  }

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.bookingRef.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.guestPhone.includes(searchTerm) ||
      booking.guestEmail.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === "all" || booking.status === filterStatus

    return matchesSearch && matchesStatus
  })

  const stats = {
    totalBookings: bookings.length,
    confirmed: bookings.filter((b: Booking) => b.status === "confirmed").length,
    pending: bookings.filter((b: Booking) => b.status === "pending").length,
    guestBookings: bookings.filter((b: Booking) => b.isGuestBooking).length,
    totalRevenue: bookings
      .filter((b: Booking) => b.status === "confirmed" || b.status === "completed")
      .reduce((sum: number, b: Booking) => sum + b.total, 0)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Đang tải dữ liệu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Tổng đặt phòng</p>
              <p className="text-2xl font-bold">{stats.totalBookings}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Đã xác nhận</p>
              <p className="text-2xl font-bold">{stats.confirmed}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Chờ xử lý</p>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Doanh thu</p>
              <p className="text-2xl font-bold">{formatPrice(stats.totalRevenue)}₫</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo mã đặt phòng, tên, SĐT, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setFilterStatus("all")}>
              Tất cả
            </Button>
            <Button variant="outline" onClick={() => setFilterStatus("confirmed")}>
              Đã xác nhận
            </Button>
            <Button variant="outline" onClick={() => setFilterStatus("pending")}>
              Chờ xử lý
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Xuất Excel
            </Button>
          </div>
        </div>
      </Card>

      {/* Bookings Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã đặt phòng</TableHead>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Liên hệ</TableHead>
              <TableHead>Phòng</TableHead>
              <TableHead>Check-in/out</TableHead>
              <TableHead>Khách</TableHead>
              <TableHead>Tổng tiền</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead>Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBookings.map((booking) => {
              const StatusIcon = statusConfig[booking.status].icon
              return (
                <TableRow key={booking.id}>
                  <TableCell className="font-medium">
                    <div>
                      <p className="font-mono">{booking.bookingRef}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(booking.createdAt)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{booking.guestName}</p>
                      {booking.guestHistory && (
                        <p className="text-xs text-muted-foreground">
                          {booking.guestHistory.totalBookings} đặt phòng • {formatPrice(booking.guestHistory.totalSpent)}₫
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm space-y-1">
                      <div className="flex items-center space-x-1">
                        <Phone className="w-3 h-3 text-muted-foreground" />
                        <span>{booking.guestPhone}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Mail className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs">{booking.guestEmail}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="max-w-xs truncate">{booking.listingTitle}</p>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{formatDate(booking.checkIn)}</p>
                      <p>{formatDate(booking.checkOut)}</p>
                      <p className="text-xs text-muted-foreground">{booking.nights} đêm</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>{booking.guests}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">
                    {formatPrice(booking.total)}₫
                  </TableCell>
                  <TableCell>
                    <Badge className={statusConfig[booking.status].color}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {statusConfig[booking.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {booking.isGuestBooking ? (
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                        Khách vãng lai
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        Tài khoản
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4 mr-1" />
                      Chi tiết
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>

      {filteredBookings.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Không tìm thấy đặt phòng nào</p>
        </Card>
      )}
    </div>
  )
}
