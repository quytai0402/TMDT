'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
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
import { TrendingUp, TrendingDown, Calendar, MapPin, DollarSign } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface ExpenseData {
  summary: {
    totalExpenses: number
    averageExpense: number
    totalBookings: number
    year: number
    month?: number
  }
  monthlyExpenses: number[]
  byDestination: Record<string, number>
  recentExpenses: Array<{
    id: string
    listingTitle: string
    location: string
    checkIn: string
    checkOut: string
    amount: number
    paymentStatus: string
    image: string | null
  }>
}

export function ExpenseTracker() {
  const { data: session } = useSession()
  const [data, setData] = useState<ExpenseData | null>(null)
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState<number | undefined>(undefined)

  useEffect(() => {
    if (session?.user) {
      loadExpenses()
    }
  }, [session, year, month])

  const loadExpenses = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ year: year.toString() })
      if (month) params.append('month', month.toString())

      const res = await fetch(`/api/expenses?${params}`)
      if (res.ok) {
        const result = await res.json()
        setData(result)
      }
    } catch (error) {
      console.error('Error loading expenses:', error)
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

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!data) return null

  const topDestinations = Object.entries(data.byDestination)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-4">
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tổng chi tiêu</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.summary.totalExpenses)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.summary.totalBookings} chuyến đi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Chi tiêu trung bình</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.summary.averageExpense)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Mỗi chuyến đi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tổng chuyến đi</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalBookings}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {month ? monthNames[month - 1] : 'Cả năm'} {year}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="recent" className="w-full">
        <TabsList>
          <TabsTrigger value="recent">Giao dịch gần đây</TabsTrigger>
          <TabsTrigger value="destinations">Theo địa điểm</TabsTrigger>
          <TabsTrigger value="chart">Biểu đồ</TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="space-y-4">
          {data.recentExpenses.map((expense) => (
            <Card key={expense.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {expense.image && (
                    <img
                      src={expense.image}
                      alt={expense.listingTitle}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold">{expense.listingTitle}</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3" />
                      <span>{expense.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(expense.checkIn)} - {formatDate(expense.checkOut)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{formatCurrency(expense.amount)}</div>
                    <Badge variant={expense.paymentStatus === 'COMPLETED' ? 'default' : 'secondary'}>
                      {expense.paymentStatus === 'COMPLETED' ? 'Đã thanh toán' : 'Chờ xử lý'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="destinations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top 5 địa điểm</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topDestinations.map(([location, amount], index) => (
                  <div key={location} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                        #{index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{location}</div>
                        <div className="text-sm text-muted-foreground">
                          {((amount / data.summary.totalExpenses) * 100).toFixed(1)}% tổng chi tiêu
                        </div>
                      </div>
                    </div>
                    <div className="font-bold">{formatCurrency(amount)}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chart">
          <Card>
            <CardHeader>
              <CardTitle>Chi tiêu theo tháng</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.monthlyExpenses.map((amount, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-20 text-sm font-medium">{monthNames[index]}</div>
                    <div className="flex-1 h-8 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{
                          width: `${data.summary.totalExpenses > 0 ? (amount / data.summary.totalExpenses * 100) : 0}%`
                        }}
                      />
                    </div>
                    <div className="w-32 text-right text-sm font-medium">
                      {formatCurrency(amount)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
