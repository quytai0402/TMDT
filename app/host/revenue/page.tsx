'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, DollarSign, Calendar, Package, Loader2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface RevenueData {
  summary: {
    totalRevenue: number
    netRevenue: number
    platformFee: number
    paidRevenue: number
    pendingRevenue: number
    averageBookingValue: number
    totalBookings: number
    year: number
    month?: number
  }
  monthlyRevenue: number[]
  monthlyBookings: number[]
  byListing: Array<{
    id: string
    title: string
    revenue: number
    bookings: number
  }>
  recentBookings: Array<{
    id: string
    listingTitle: string
    guestName: string
    checkIn: string
    checkOut: string
    nights: number
    amount: number
    paymentStatus: string
    bookingStatus: string
    image: string | null
  }>
}

export default function RevenuePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<RevenueData | null>(null)
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState<number | undefined>(undefined)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      if (session?.user?.role !== 'HOST' && session?.user?.role !== 'ADMIN') {
        router.push('/')
      } else {
        loadRevenue()
      }
    }
  }, [status, session, year, month, router])

  const loadRevenue = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ year: year.toString() })
      if (month) params.append('month', month.toString())

      const res = await fetch(`/api/revenue?${params}`)
      if (res.ok) {
        const result = await res.json()
        setData(result)
      }
    } catch (error) {
      console.error('Error loading revenue:', error)
    } finally {
      setLoading(false)
    }
  }

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

  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ]

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-muted/30">
          <div className="container mx-auto px-4 lg:px-8 py-8">
            <Skeleton className="h-12 w-64 mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
            <Skeleton className="h-96 w-full" />
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="font-serif text-3xl font-bold text-foreground mb-2">
              Quản lý Doanh Thu
            </h1>
            <p className="text-muted-foreground">
              Theo dõi và phân tích doanh thu từ các homestay của bạn
            </p>
          </div>

          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026].map(y => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={month?.toString() || 'all'} onValueChange={(v) => setMonth(v === 'all' ? undefined : parseInt(v))}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tất cả tháng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả tháng</SelectItem>
                {monthNames.map((name, idx) => (
                  <SelectItem key={idx} value={(idx + 1).toString()}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Tổng doanh thu</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(data.summary.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.summary.totalBookings} bookings
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Doanh thu thuần</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(data.summary.netRevenue)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Sau phí 15%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Đã thanh toán</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(data.summary.paidRevenue)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Chờ: {formatCurrency(data.summary.pendingRevenue)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">TB/Booking</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(data.summary.averageBookingValue)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Giá trị trung bình
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="recent" className="w-full">
            <TabsList>
              <TabsTrigger value="recent">Bookings gần đây</TabsTrigger>
              <TabsTrigger value="listings">Theo Listing</TabsTrigger>
              <TabsTrigger value="chart">Biểu đồ</TabsTrigger>
            </TabsList>

            <TabsContent value="recent" className="space-y-4">
              {data.recentBookings.map((booking) => (
                <Card key={booking.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {booking.image && (
                        <img
                          src={booking.image}
                          alt={booking.listingTitle}
                          className="w-20 h-20 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-semibold">{booking.listingTitle}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Khách: {booking.guestName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)} • {booking.nights} đêm
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{formatCurrency(booking.amount)}</div>
                        <Badge variant={booking.paymentStatus === 'COMPLETED' ? 'default' : 'secondary'}>
                          {booking.paymentStatus === 'COMPLETED' ? 'Đã thanh toán' : 'Chờ xử lý'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="listings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Doanh thu theo Listing</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.byListing.map((listing, index) => (
                      <div key={listing.id} className="flex items-center justify-between pb-4 border-b last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                            #{index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{listing.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {listing.bookings} bookings
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{formatCurrency(listing.revenue)}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatCurrency(listing.revenue * 0.85)} thuần
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="chart">
              <Card>
                <CardHeader>
                  <CardTitle>Doanh thu theo tháng</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.monthlyRevenue.map((revenue, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-20 text-sm font-medium">{monthNames[index]}</div>
                        <div className="flex-1 h-8 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-600 rounded-full transition-all"
                            style={{
                              width: `${data.summary.totalRevenue > 0 ? (revenue / data.summary.totalRevenue * 100) : 0}%`
                            }}
                          />
                        </div>
                        <div className="w-32 text-right">
                          <div className="text-sm font-medium">{formatCurrency(revenue)}</div>
                          <div className="text-xs text-muted-foreground">
                            {data.monthlyBookings[index]} bookings
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  )
}
