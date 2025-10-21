'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, DollarSign, TrendingUp, Calendar, Users } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface RevenueData {
  totalRevenue: number
  platformFee: number
  netRevenue: number
  totalBookings: number
  averageBookingValue: number
  monthlyData: Array<{
    month: string
    revenue: number
    bookings: number
  }>
  topHosts: Array<{
    hostName: string
    revenue: number
    bookings: number
  }>
}

export default function AdminRevenuePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<RevenueData | null>(null)
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(new Date().getFullYear())
  const [error, setError] = useState<string | null>(null)

  const loadRevenue = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/revenue?year=${year}`)
      
      if (!res.ok) {
        throw new Error('Failed to fetch revenue data')
      }

      const result = await res.json()
      
      // Calculate platform statistics from all bookings
      const revenueData: RevenueData = {
        totalRevenue: result.summary?.totalRevenue || 0,
        platformFee: result.summary?.platformFee || 0,
        netRevenue: result.summary?.netRevenue || 0,
        totalBookings: result.summary?.totalBookings || 0,
        averageBookingValue: result.summary?.averageBookingValue || 0,
        monthlyData: result.monthlyRevenue?.map((revenue: number, idx: number) => ({
          month: `Tháng ${idx + 1}`,
          revenue,
          bookings: result.monthlyBookings?.[idx] || 0
        })) || [],
        topHosts: result.byListing?.slice(0, 10).map((listing: { title: string; revenue: number; bookings: number }) => ({
          hostName: listing.title,
          revenue: listing.revenue,
          bookings: listing.bookings
        })) || []
      }
      
      setData(revenueData)
    } catch (error) {
      console.error('Error loading revenue:', error)
      setError('Không thể tải dữ liệu doanh thu')
    } finally {
      setLoading(false)
    }
  }, [year])

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

      loadRevenue()
    }
  }, [status, session, router, loadRevenue])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

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

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-muted/30">
          <div className="container mx-auto px-4 lg:px-8 py-8">
            <Button variant="ghost" onClick={() => router.push('/admin')} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại Dashboard
            </Button>
            <Card>
              <CardHeader>
                <CardTitle>Lỗi tải dữ liệu</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={loadRevenue}>Thử lại</Button>
              </CardContent>
            </Card>
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
            <Button variant="ghost" onClick={() => router.push('/admin')} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại Dashboard
            </Button>
            <h1 className="font-serif text-3xl font-bold text-foreground mb-2">
              Doanh Thu Nền Tảng
            </h1>
            <p className="text-muted-foreground">
              Theo dõi doanh thu và phí nền tảng
            </p>
          </div>

          {/* Year Filter */}
          <div className="mb-6">
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
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Tổng doanh thu</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(data.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Từ {data.totalBookings} bookings
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Phí nền tảng (15%)</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(data.platformFee)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Thu nhập của nền tảng
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Doanh thu hosts</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(data.netRevenue)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Sau phí nền tảng
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">TB/Booking</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(data.averageBookingValue)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Giá trị trung bình
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="monthly" className="w-full">
            <TabsList>
              <TabsTrigger value="monthly">Doanh thu tháng</TabsTrigger>
              <TabsTrigger value="hosts">Top Hosts</TabsTrigger>
            </TabsList>

            <TabsContent value="monthly">
              <Card>
                <CardHeader>
                  <CardTitle>Doanh thu theo tháng năm {year}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.monthlyData.map((item, index) => (
                      <div key={index} className="flex items-center gap-4">
                        <div className="w-20 text-sm font-medium">{item.month}</div>
                        <div className="flex-1 h-10 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full transition-all flex items-center justify-end pr-4"
                            style={{
                              width: `${data.totalRevenue > 0 ? (item.revenue / data.totalRevenue * 100) : 0}%`
                            }}
                          >
                            {item.revenue > 0 && (
                              <span className="text-white text-xs font-medium">
                                {formatCurrency(item.revenue)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="w-32 text-right text-sm">
                          <div className="font-medium">{item.bookings} bookings</div>
                          <div className="text-xs text-muted-foreground">
                            {formatCurrency(item.revenue * 0.15)} phí
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="hosts">
              <Card>
                <CardHeader>
                  <CardTitle>Top 10 Hosts theo doanh thu</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.topHosts.map((host, index) => (
                      <div key={index} className="flex items-center justify-between pb-4 border-b last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                            #{index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{host.hostName}</div>
                            <div className="text-sm text-muted-foreground">
                              {host.bookings} bookings
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{formatCurrency(host.revenue)}</div>
                          <div className="text-sm text-green-600">
                            +{formatCurrency(host.revenue * 0.15)} phí
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
