'use client'

import { useEffect, useMemo, useState } from 'react'
import { AdminLayout } from '@/components/admin-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Loader2, Crown, Users, Calendar, RefreshCcw } from 'lucide-react'
import { toast } from 'sonner'

type MembershipPlanSummary = {
  id: string
  name: string
  slug: string
  monthlyPrice: number
  annualPrice: number
  billingCycle?: string | null
  perks: string[]
  description?: string | null
  stats: {
    activeMembers: number
    expiredMembers: number
  }
}

type MembershipMember = {
  id: string
  name: string | null
  email: string | null
  status: string
  startedAt: string | null
  expiresAt: string | null
  features: string[]
  plan: {
    id: string
    name: string
    slug: string
  } | null
}

type MembershipResponse = {
  plans: MembershipPlanSummary[]
  members: MembershipMember[]
  pendingPurchases: PendingPurchase[]
}

type PendingPurchase = {
  id: string
  status: string
  amount: number
  billingCycle: 'MONTHLY' | 'ANNUAL'
  paymentMethod: 'BANK_TRANSFER' | 'CREDIT_CARD' | 'E_WALLET'
  referenceCode: string
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string | null
  }
  plan: {
    id: string
    name: string
    slug: string
  }
}

const statusBadge = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return { variant: 'default' as const, label: 'Đang hoạt động' }
    case 'EXPIRED':
      return { variant: 'secondary' as const, label: 'Hết hạn' }
    case 'CANCELLED':
      return { variant: 'outline' as const, label: 'Đã hủy' }
    default:
      return { variant: 'outline' as const, label: status }
  }
}

const formatDate = (value: string | null) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('vi-VN')
}

const currency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)

export default function AdminMembershipsPage() {
  const [data, setData] = useState<MembershipResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED'>('ALL')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadMemberships = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filter !== 'ALL') params.append('status', filter)

      const res = await fetch(`/api/admin/memberships?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch memberships')
      const payload: MembershipResponse = await res.json()
      setData(payload)
    } catch (error) {
      console.error('Membership load error:', error)
      toast.error('Không thể tải dữ liệu membership')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadMemberships()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  const filteredMembers = useMemo(() => {
    if (!data?.members) return []
    return data.members
  }, [data])

  const handlePurchaseAction = async (purchaseId: string, action: 'confirm' | 'reject') => {
    try {
      setActionLoading(purchaseId)
      const body: Record<string, string> = { action }
      if (action === 'reject') {
        const notes = window.prompt('Nhập ghi chú cho việc từ chối (tuỳ chọn):', '')
        if (notes !== null && notes.trim()) {
          body.notes = notes.trim()
        }
      }

      const res = await fetch(`/api/admin/memberships/purchases/${purchaseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error ?? 'Không thể cập nhật giao dịch')
      }

      toast.success(action === 'confirm' ? 'Đã kích hoạt membership cho khách hàng.' : 'Đã từ chối giao dịch.')
      void loadMemberships()
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : 'Không thể cập nhật giao dịch')
    } finally {
      setActionLoading(null)
    }
  }

  const planPerkMap = useMemo(() => {
    const map = new Map<string, string[]>()
    if (!data?.plans) return map
    for (const plan of data.plans) {
      map.set(plan.id, Array.isArray(plan.perks) ? plan.perks : [])
    }
    return map
  }, [data])

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Quản lý membership</h1>
            <p className="text-muted-foreground mt-2">
              Theo dõi các gói, trạng thái thành viên và quyền lợi được kích hoạt
            </p>
          </div>
          <Button variant="outline" onClick={() => void loadMemberships()}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Đang tải dữ liệu membership...
          </div>
        )}

        {!loading && data && (
          <>
            <Card>
              <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Chờ xác nhận chuyển khoản</CardTitle>
                  <CardDescription>
                    {data.pendingPurchases.length
                      ? `${data.pendingPurchases.length} giao dịch cần xác nhận.`
                      : 'Không có giao dịch chuyển khoản đang chờ.'}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {data.pendingPurchases.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Không có giao dịch chờ xử lý.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Khách hàng</TableHead>
                          <TableHead>Gói</TableHead>
                          <TableHead>Số tiền</TableHead>
                          <TableHead>Tham chiếu</TableHead>
                          <TableHead>Ngày tạo</TableHead>
                          <TableHead className="text-right">Thao tác</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.pendingPurchases.map((purchase) => (
                          <TableRow key={purchase.id}>
                            <TableCell>
                              <div className="flex flex-col text-sm">
                                <span className="font-medium">{purchase.user.name ?? 'Khách'}</span>
                                <span className="text-muted-foreground">{purchase.user.email ?? '—'}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col text-sm">
                                <span className="font-semibold">{purchase.plan.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {purchase.billingCycle === 'MONTHLY' ? 'Hàng tháng' : 'Hàng năm'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(purchase.amount)}
                            </TableCell>
                            <TableCell>
                              <code className="text-xs bg-muted px-2 py-1 rounded">{purchase.referenceCode}</code>
                            </TableCell>
                            <TableCell>
                              {new Date(purchase.createdAt).toLocaleString('vi-VN')}
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                              <Button
                                size="sm"
                                variant="secondary"
                                disabled={actionLoading === purchase.id}
                                onClick={() => handlePurchaseAction(purchase.id, 'reject')}
                              >
                                Từ chối
                              </Button>
                              <Button
                                size="sm"
                                disabled={actionLoading === purchase.id}
                                onClick={() => handlePurchaseAction(purchase.id, 'confirm')}
                              >
                                Xác nhận
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.plans.map((plan) => {
                const perks = Array.isArray(plan.perks) ? plan.perks : []
                const monthlyPrice = typeof plan.monthlyPrice === 'number' ? plan.monthlyPrice : 0
                const annualPrice = typeof plan.annualPrice === 'number' ? plan.annualPrice : 0
                const hasMonthly = monthlyPrice > 0
                const hasAnnual = annualPrice > 0
                const annualSavings = hasMonthly && hasAnnual ? Math.max(monthlyPrice * 12 - annualPrice, 0) : 0
                const billingLabel =
                  plan.billingCycle === 'ANNUAL'
                    ? 'Hàng năm'
                    : plan.billingCycle === 'MONTHLY'
                      ? 'Hàng tháng'
                      : hasMonthly && hasAnnual
                        ? 'Tháng / Năm'
                        : hasMonthly
                          ? 'Hàng tháng'
                          : hasAnnual
                            ? 'Hàng năm'
                            : 'Tùy chỉnh'
                return (
                <Card key={plan.id}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Crown className="h-4 w-4 text-primary" />
                        {plan.name}
                      </CardTitle>
                      <CardDescription>{plan.description || 'Gói membership'}</CardDescription>
                    </div>
                    <Badge variant="outline">{billingLabel}</Badge>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1">
                      <p className="text-2xl font-semibold">
                        {hasMonthly ? `${currency(monthlyPrice)} / tháng` : hasAnnual ? `${currency(annualPrice)} / năm` : 'Liên hệ'}
                      </p>
                      {hasMonthly && hasAnnual && (
                        <p className="text-xs text-muted-foreground">
                          {currency(annualPrice)} / năm
                          {annualSavings > 0 ? ` · tiết kiệm ${currency(annualSavings)}` : ''}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" /> {plan.stats.activeMembers} đang hoạt động
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" /> {plan.stats.expiredMembers} đã hết hạn
                      </span>
                    </div>
                    <ul className="text-sm space-y-1">
                      {perks.length ? perks.map((perk) => (
                        <li key={perk}>• {perk}</li>
                      )) : <li className="text-muted-foreground">Chưa cấu hình quyền lợi.</li>}
                    </ul>
                  </CardContent>
                </Card>
              )})}
            </div>

            <Card>
              <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Danh sách thành viên</CardTitle>
                  <CardDescription>
                    Tổng cộng {filteredMembers.length} thành viên đang theo dõi.
                  </CardDescription>
                </div>
                <Select value={filter} onValueChange={(value: 'ALL' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED') => setFilter(value)}>
                  <SelectTrigger className="w-full md:w-56">
                    <SelectValue placeholder="Tất cả trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                    <SelectItem value="ACTIVE">Đang hoạt động</SelectItem>
                    <SelectItem value="EXPIRED">Đã hết hạn</SelectItem>
                    <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Thành viên</TableHead>
                        <TableHead>Gói</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Ngày kích hoạt</TableHead>
                        <TableHead>Ngày hết hạn</TableHead>
                        <TableHead>Quyền lợi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMembers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                            Không có thành viên nào phù hợp bộ lọc.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredMembers.map((member) => {
                      const badge = statusBadge(member.status)
                      const baseFeatures = Array.isArray(member.features) ? member.features : []
                      const inheritedFeatures =
                        baseFeatures.length > 0
                          ? baseFeatures
                          : planPerkMap.get(member.plan?.id ?? "") ?? []
                      return (
                        <TableRow key={member.id}>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="font-medium">{member.name || 'Chưa cập nhật'}</div>
                                  <div className="text-sm text-muted-foreground">{member.email}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{member.plan?.name || 'Chưa gán'}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={badge.variant}>{badge.label}</Badge>
                              </TableCell>
                              <TableCell>{formatDate(member.startedAt)}</TableCell>
                              <TableCell>{formatDate(member.expiresAt)}</TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {inheritedFeatures.map((feature) => (
                                    <Badge key={feature} variant="secondary">
                                      {feature}
                                    </Badge>
                                  ))}
                                  {inheritedFeatures.length === 0 && (
                                    <span className="text-xs text-muted-foreground">Chưa có</span>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
