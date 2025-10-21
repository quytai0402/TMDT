'use client'

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
import { Search, Download, DollarSign, TrendingUp, CreditCard, ArrowUpRight, ArrowDownRight, CheckCircle, Clock, XCircle } from 'lucide-react'
import { useState } from 'react'

const mockTransactions = [
  { id: "TXN001", user: "Nguyễn Văn A", type: "booking", amount: 2500000, status: "completed", time: "10 phút trước", method: "credit_card" },
  { id: "TXN002", user: "Trần Thị B", type: "payout", amount: -5000000, status: "completed", time: "1 giờ trước", method: "bank_transfer" },
  { id: "TXN003", user: "Lê Minh C", type: "booking", amount: 3200000, status: "pending", time: "2 giờ trước", method: "momo" },
  { id: "TXN004", user: "Phạm Thu D", type: "refund", amount: -1500000, status: "completed", time: "5 giờ trước", method: "credit_card" },
  { id: "TXN005", user: "Hoàng Văn E", type: "booking", amount: 4800000, status: "failed", time: "1 ngày trước", method: "zalopay" },
]

export default function AdminPaymentsPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Thành công</Badge>
      case "pending":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Đang xử lý</Badge>
      case "failed":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Thất bại</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "booking": return "Đặt phòng"
      case "payout": return "Rút tiền"
      case "refund": return "Hoàn tiền"
      default: return type
    }
  }

  const getMethodLabel = (method: string) => {
    switch (method) {
      case "credit_card": return "Thẻ tín dụng"
      case "bank_transfer": return "Chuyển khoản"
      case "momo": return "MoMo"
      case "zalopay": return "ZaloPay"
      default: return method
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Quản lý thanh toán</h1>
            <p className="text-muted-foreground mt-2">
              Theo dõi và quản lý tất cả giao dịch thanh toán
            </p>
          </div>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Xuất báo cáo
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-muted-foreground">Doanh thu hôm nay</div>
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
              <div className="text-2xl font-bold mt-2">125 triệu đ</div>
              <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" />
                +15.3% so với hôm qua
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-muted-foreground">Giao dịch thành công</div>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="text-2xl font-bold mt-2">234</div>
              <p className="text-xs text-muted-foreground mt-1">98.5% tỷ lệ thành công</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-muted-foreground">Đang chờ xử lý</div>
                <Clock className="h-4 w-4 text-orange-600" />
              </div>
              <div className="text-2xl font-bold mt-2 text-orange-600">12</div>
              <p className="text-xs text-muted-foreground mt-1">Cần xem xét</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-muted-foreground">Giao dịch thất bại</div>
                <XCircle className="h-4 w-4 text-red-600" />
              </div>
              <div className="text-2xl font-bold mt-2 text-red-600">3</div>
              <p className="text-xs text-muted-foreground mt-1">1.5% tổng số</p>
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
                  placeholder="Tìm kiếm theo mã giao dịch, người dùng..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Tabs defaultValue="all">
              <TabsList className="mb-4">
                <TabsTrigger value="all">Tất cả</TabsTrigger>
                <TabsTrigger value="completed">Thành công</TabsTrigger>
                <TabsTrigger value="pending">Đang xử lý</TabsTrigger>
                <TabsTrigger value="failed">Thất bại</TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã GD</TableHead>
                      <TableHead>Người dùng</TableHead>
                      <TableHead>Loại</TableHead>
                      <TableHead>Phương thức</TableHead>
                      <TableHead className="text-right">Số tiền</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Thời gian</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockTransactions.map((txn) => (
                      <TableRow key={txn.id}>
                        <TableCell className="font-medium">{txn.id}</TableCell>
                        <TableCell>{txn.user}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {txn.amount > 0 ? (
                              <ArrowDownRight className="h-4 w-4 text-green-600" />
                            ) : (
                              <ArrowUpRight className="h-4 w-4 text-red-600" />
                            )}
                            {getTypeLabel(txn.type)}
                          </div>
                        </TableCell>
                        <TableCell>{getMethodLabel(txn.method)}</TableCell>
                        <TableCell className={`text-right font-medium ${txn.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {txn.amount > 0 ? '+' : ''}{(txn.amount / 1000000).toFixed(1)}M đ
                        </TableCell>
                        <TableCell>{getStatusBadge(txn.status)}</TableCell>
                        <TableCell className="text-muted-foreground">{txn.time}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">Chi tiết</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="completed">
                <div className="text-center py-12 text-muted-foreground">
                  {mockTransactions.filter(t => t.status === "completed").length} giao dịch thành công
                </div>
              </TabsContent>

              <TabsContent value="pending">
                <div className="text-center py-12 text-muted-foreground">
                  {mockTransactions.filter(t => t.status === "pending").length} giao dịch đang xử lý
                </div>
              </TabsContent>

              <TabsContent value="failed">
                <div className="text-center py-12 text-muted-foreground">
                  {mockTransactions.filter(t => t.status === "failed").length} giao dịch thất bại
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
