'use client'

import Image from 'next/image'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Search, MoreVertical, ArrowLeft, Calendar, DollarSign } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface Booking {
  id: string
  bookingRef: string
  checkIn: string
  checkOut: string
  adults: number
  children: number
  infants: number
  nights: number
  guests: number
  totalPrice: number
  total: number
  status: string
  guestType: 'REGISTERED' | 'WALK_IN'
  guestName: string
  guestEmail: string
  guestPhone: string
  guestHistory?: {
    totalBookings: number
    totalSpent: number
  } | null
  isGuestBooking: boolean
  guest?: {
    id: string
    name: string
    email: string
  } | null
  listing: {
    id: string
    title: string
    images: string[]
    host: {
      name: string
    }
  }
  payment: {
    status: string
    paymentMethod: string
  } | null
  createdAt: string
}

export default function AdminBookingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  const loadBookings = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'ALL') params.append('status', statusFilter)

      const res = await fetch(`/api/admin/bookings?${params}`)
      if (res.ok) {
        const data = await res.json()
        setBookings(data.bookings || [])
      }
    } catch (error) {
      console.error('Error loading bookings:', error)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (status === 'authenticated') {
      if (session?.user?.role !== 'ADMIN') {
        router.push('/')
        return
      }

      loadBookings()
    }
  }, [status, session, router, loadBookings])

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, status: newStatus }),
      })

      if (res.ok) {
        loadBookings()
      }
    } catch (error) {
      console.error('Error updating booking:', error)
    }
  }

  const cancelBooking = async (bookingId: string) => {
    if (!confirm('Bạn có chắc muốn hủy booking này?')) return

    try {
      const res = await fetch(`/api/admin/bookings?bookingId=${bookingId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        loadBookings()
      }
    } catch (error) {
      console.error('Error cancelling booking:', error)
    }
  }

  const filteredBookings = useMemo(() => {
    const normalizedQuery = searchQuery.toLowerCase()

    return bookings.filter((booking) => {
      const guestName = booking.guestName?.toLowerCase?.() || ''
      const guestEmail = booking.guestEmail?.toLowerCase?.() || ''
      const listingTitle = booking.listing.title?.toLowerCase?.() || ''
      const guestPhone = booking.guestPhone || ''

      return (
        guestName.includes(normalizedQuery) ||
        guestEmail.includes(normalizedQuery) ||
        guestPhone.includes(searchQuery) ||
        listingTitle.includes(normalizedQuery)
      )
    })
  }, [bookings, searchQuery])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-600'
      case 'PENDING': return 'bg-yellow-600'
      case 'CANCELLED': return 'bg-red-600'
      case 'COMPLETED': return 'bg-blue-600'
      default: return 'bg-gray-600'
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-muted/30">
          <div className="container mx-auto px-4 lg:px-8 py-8">
            <Skeleton className="h-12 w-64 mb-6" />
            <Skeleton className="h-96 w-full" />
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8 py-8">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => router.push('/admin')} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại Dashboard
            </Button>
            <h1 className="font-serif text-3xl font-bold text-foreground mb-2">
              Quản lý Bookings
            </h1>
            <p className="text-muted-foreground">
              Tổng cộng {bookings.length} bookings
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Tìm theo khách, email, listing..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <Card key={booking.id}>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <div className="relative w-32 h-32 overflow-hidden rounded-lg">
                      <Image
                        src={booking.listing.images[0] || '/placeholder.svg'}
                        alt={booking.listing.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{booking.listing.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            Host: {booking.listing.host.name}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono mt-1">
                            Mã đặt phòng: {booking.bookingRef}
                          </p>
                        </div>
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Khách</div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{booking.guestName}</span>
                            {booking.guestType === 'WALK_IN' && (
                              <Badge variant="outline" className="text-[10px] px-2 py-0 border-orange-200 text-orange-600 bg-orange-50">
                                Khách vãng lai
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {booking.guestEmail || 'Chưa cung cấp email'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {booking.guestPhone || 'Chưa cung cấp SĐT'}
                          </div>
                          {booking.guestHistory && (
                            <div className="text-xs text-muted-foreground">
                              {booking.guestHistory.totalBookings} đặt • {formatCurrency(booking.guestHistory.totalSpent)}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Check-in
                          </div>
                          <div className="font-medium">{formatDate(booking.checkIn)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Check-out
                          </div>
                          <div className="font-medium">{formatDate(booking.checkOut)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            Tổng tiền
                          </div>
                          <div className="font-medium">{formatCurrency(booking.totalPrice)}</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="text-sm flex flex-wrap items-center gap-2">
                          <span className="text-muted-foreground">Số khách:</span>
                          <span className="font-medium">
                            {booking.adults} người lớn
                            {booking.children > 0 && `, ${booking.children} trẻ em`}
                            {booking.infants > 0 && `, ${booking.infants} em bé`}
                          </span>
                          <span className="mx-2">•</span>
                          <span className="text-muted-foreground">Thanh toán:</span>
                          <Badge variant="outline" className="ml-1">
                            {booking.payment?.status || 'N/A'}
                          </Badge>
                          {booking.payment?.paymentMethod && (
                            <span className="text-xs text-muted-foreground">
                              {booking.payment.paymentMethod}
                            </span>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => updateBookingStatus(booking.id, 'CONFIRMED')}>
                              ✅ Xác nhận
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateBookingStatus(booking.id, 'COMPLETED')}>
                              ✔️ Hoàn thành
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateBookingStatus(booking.id, 'PENDING')}>
                              ⏳ Đặt chờ
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => cancelBooking(booking.id)}
                              className="text-red-600"
                            >
                              ❌ Hủy booking
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredBookings.length === 0 && (
            <Card>
              <CardContent className="text-center py-12 text-muted-foreground">
                Không tìm thấy booking nào
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
