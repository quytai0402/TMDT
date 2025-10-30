'use client'

import { useCallback, useEffect, useState } from 'react'
import { AdminLayout } from '@/components/admin-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Search, DollarSign, TrendingUp, Clock, ArrowDownRight, Loader2 } from 'lucide-react'

interface Payment {
  id: string
  amount: number
  currency: string
  status: string
  paymentMethod: string
  paymentGateway: string
  createdAt: string
  booking: {
    guest?: { name: string | null } | null
    listing: { title: string }
  }
  guestContact?: {
    name: string
    email?: string | null
    phone?: string | null
    guestType?: string
  }
}

interface PaymentStats {
  totalRevenue: number
  platformFee: number
  todayRevenue: number
  todayCount: number
  completedCount: number
  pendingCount: number
  failedCount: number
}

const DEFAULT_STATS: PaymentStats = {
  totalRevenue: 0,
  platformFee: 0,
  todayRevenue: 0,
  todayCount: 0,
  completedCount: 0,
  pendingCount: 0,
  failedCount: 0,
}

export default function AdminPaymentsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [stats, setStats] = useState<PaymentStats>(DEFAULT_STATS)

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filter !== 'all') params.append('filter', filter)
      if (searchQuery) params.append('search', searchQuery)

      const res = await fetch(`/api/admin/payments?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch payments')
      const data = await res.json()
      setPayments(data.payments || [])
      setStats({
        totalRevenue: data.stats?.totalRevenue ?? 0,
        platformFee: data.stats?.platformFee ?? 0,
        todayRevenue: data.stats?.todayRevenue ?? 0,
        todayCount: data.stats?.todayCount ?? 0,
        completedCount: data.stats?.completedCount ?? 0,
        pendingCount: data.stats?.pendingCount ?? 0,
        failedCount: data.stats?.failedCount ?? 0,
      })
    } catch (error) {
      console.error('Failed to fetch payments:', error)
      setStats(DEFAULT_STATS)
      setPayments([])
    } finally {
      setLoading(false)
    }
  }, [filter, searchQuery])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline'

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: BadgeVariant; label: string }> = {
      COMPLETED: { variant: 'default', label: 'Thành công' },
      PENDING: { variant: 'secondary', label: 'Đang xử lý' },
      FAILED: { variant: 'destructive', label: 'Thất bại' },
      REFUNDED: { variant: 'outline', label: 'Đã hoàn' },
    }
    const config = statusMap[status] || { variant: 'outline', label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      VNPAY: 'VNPay',
      MOMO: 'Momo',
      ZALOPAY: 'ZaloPay',
      CREDIT_CARD: 'Thẻ tín dụng',
      BANK_TRANSFER: 'Chuyển khoản',
    }
    return methods[method] || method
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Quản lý thanh toán</h1>
          <p className="text-muted-foreground mt-2">
            Theo dõi và quản lý các giao dịch thanh toán
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tổng doanh thu</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Hôm nay {formatCurrency(stats.todayRevenue)} • {stats.todayCount} giao dịch
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Thành công</p>
                  <p className="text-2xl font-bold">{stats.completedCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">Tổng giao dịch thành công</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Đang xử lý</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.pendingCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">Chờ xác nhận</p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Thất bại</p>
                  <p className="text-2xl font-bold text-red-600">{stats.failedCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">Cần kiểm tra</p>
                </div>
                <ArrowDownRight className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Table */}
        <Card>
          <CardContent className="pt-6">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm giao dịch..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Tabs defaultValue="all" onValueChange={setFilter}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">Tất cả</TabsTrigger>
                <TabsTrigger value="completed">Thành công</TabsTrigger>
                <TabsTrigger value="pending">Đang xử lý</TabsTrigger>
                <TabsTrigger value="failed">Thất bại</TabsTrigger>
              </TabsList>

              <TabsContent value={filter}>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : payments.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Không có giao dịch nào
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mã GD</TableHead>
                        <TableHead>Khách hàng</TableHead>
                        <TableHead>Listing</TableHead>
                        <TableHead>Phương thức</TableHead>
                        <TableHead className="text-right">Số tiền</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Thời gian</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">{payment.id.slice(0, 8)}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <span className="font-medium">
                                {payment.guestContact?.name || payment.booking.guest?.name || 'Khách vãng lai'}
                              </span>
                              {payment.guestContact?.guestType === 'WALK_IN' && (
                                <Badge variant="outline" className="w-fit text-[10px] px-2 py-0 border-orange-200 text-orange-600 bg-orange-50">
                                  Khách vãng lai
                                </Badge>
                              )}
                              {payment.guestContact?.phone && (
                                <span className="text-xs text-muted-foreground">{payment.guestContact.phone}</span>
                              )}
                              {payment.guestContact?.email && (
                                <span className="text-xs text-muted-foreground">{payment.guestContact.email}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {payment.booking.listing.title}
                          </TableCell>
                          <TableCell>{getMethodLabel(payment.paymentMethod)}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(payment.amount)}
                          </TableCell>
                          <TableCell>{getStatusBadge(payment.status)}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(payment.createdAt).toLocaleDateString('vi-VN')}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">Chi tiết</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
