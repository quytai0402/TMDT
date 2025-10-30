'use client'

import { useEffect, useMemo, useState } from 'react'
import { AdminLayout } from '@/components/admin-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, ArrowDownRight, ArrowUpRight, Calendar, DollarSign, LineChart, Users } from 'lucide-react'
import { toast } from 'sonner'

type RevenueSummary = {
  total: number
  today: number
  month: number
  commission: number
  net: number
}

type BookingSummary = {
  monthTotal: number
  yearTotal: number
  avgBookingValue: number
  chartByDay: Array<{ day: number; revenue: number }>
  chartByMonth: Array<{ month: number; revenue: number; bookings: number }>
}

type ListingSummary = Array<{
  id: string
  title: string
  city: string | null
  revenue: number
  bookings: number
}>

type FinanceResponse = {
  revenue: RevenueSummary
  bookings: BookingSummary
  topListings: ListingSummary
}

const currency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)

const numberFormat = (value: number) => new Intl.NumberFormat('vi-VN').format(value)

export default function AdminRevenuePage() {
  const [finance, setFinance] = useState<FinanceResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState<'month' | 'year'>('month')

  useEffect(() => {
    const loadFinance = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/admin/finance')
        if (!res.ok) {
          throw new Error('Failed to fetch finance data')
        }
        const data = (await res.json()) as FinanceResponse
        setFinance(data)
      } catch (error) {
        console.error('Finance load error:', error)
        toast.error('Không thể tải dữ liệu tài chính')
      } finally {
        setLoading(false)
      }
    }

    loadFinance()
  }, [])

  const chartData = useMemo(() => {
    if (!finance) return []
    return range === 'month' ? finance.bookings.chartByDay : finance.bookings.chartByMonth
  }, [finance, range])

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Báo cáo doanh thu</h1>
            <p className="text-muted-foreground mt-2">
              Tổng hợp doanh thu, phí nền tảng và hiệu suất theo thời gian
            </p>
          </div>
          <Select value={range} onValueChange={(value: 'month' | 'year') => setRange(value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Khoảng thời gian" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Theo ngày trong tháng</SelectItem>
              <SelectItem value="year">Theo tháng trong năm</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Đang tải dữ liệu tài chính...
          </div>
        ) : !finance ? (
          <Card>
            <CardHeader>
              <CardTitle>Không có dữ liệu</CardTitle>
              <CardDescription>Hệ thống chưa ghi nhận doanh thu nào.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => window.location.reload()}>Thử tải lại</Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Tổng doanh thu</p>
                    <p className="text-2xl font-bold">{currency(finance.revenue.total)}</p>
                    <span className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                      Tháng này {currency(finance.revenue.month)}
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Phí nền tảng</p>
                    <p className="text-2xl font-bold">{currency(finance.revenue.commission)}</p>
                    <span className="text-xs text-muted-foreground mt-1">Tỷ lệ 10% mặc định</span>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <ArrowDownRight className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Đặt phòng</p>
                    <p className="text-2xl font-bold">
                      {numberFormat(finance.bookings.yearTotal)}
                    </p>
                    <span className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-emerald-500" />
                      {numberFormat(finance.bookings.monthTotal)} trong tháng
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Users className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Giá trị trung bình</p>
                    <p className="text-2xl font-bold">
                      {currency(finance.bookings.avgBookingValue)}
                    </p>
                    <span className="text-xs text-muted-foreground mt-1">Theo năm hiện tại</span>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                    <LineChart className="h-6 w-6 text-amber-600" />
                  </div>
                </div>
              </Card>
            </div>

            <Tabs defaultValue="chart" className="space-y-6">
              <TabsList>
                <TabsTrigger value="chart">Biểu đồ doanh thu</TabsTrigger>
                <TabsTrigger value="listings">Top chỗ nghỉ</TabsTrigger>
              </TabsList>

              <TabsContent value="chart">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {range === 'month' ? 'Doanh thu từng ngày trong tháng' : 'Doanh thu từng tháng'}
                    </CardTitle>
                    <CardDescription>
                      Tổng hợp doanh thu ghi nhận theo khoảng thời gian đã chọn.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-3">
                      {chartData.map((point) => (
                        <div key={point.day ?? point.month} className="flex flex-col gap-1">
                          <div className="h-24 rounded-md bg-muted relative overflow-hidden">
                            <div
                              className="absolute bottom-0 left-0 right-0 bg-primary/80 rounded-t-md transition-all"
                              style={{
                                height: `${Math.min(100, (point.revenue / (finance.revenue.total || 1)) * 220)}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs font-medium text-center">
                            {range === 'month' ? `Ngày ${point.day}` : `T${point.month}`}
                          </span>
                          <span className="text-[11px] text-muted-foreground text-center">
                            {currency(point.revenue)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="listings">
                <Card>
                  <CardHeader>
                    <CardTitle>Top chỗ nghỉ có doanh thu cao nhất</CardTitle>
                    <CardDescription>
                      Dữ liệu tính theo tổng doanh thu kể từ đầu năm.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {finance.topListings.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Chưa có dữ liệu.</p>
                    ) : (
                      finance.topListings.map((listing) => (
                        <div
                          key={listing.id}
                          className="flex flex-wrap items-center justify-between gap-3 border rounded-lg p-4"
                        >
                          <div>
                            <h3 className="font-semibold">{listing.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {listing.city || 'Chưa cập nhật'} • {listing.bookings} lượt đặt
                            </p>
                          </div>
                          <Badge variant="outline" className="text-base font-semibold py-1.5 px-4">
                            {currency(listing.revenue)}
                          </Badge>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
