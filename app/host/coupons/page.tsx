'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { TicketPercent, Loader2, Plus } from 'lucide-react'
import { z } from 'zod'

import { HostLayout } from '@/components/host-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

type Coupon = {
  id: string
  code: string
  name: string
  description?: string | null
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT'
  discountValue: number
  maxDiscount?: number | null
  minBookingValue?: number | null
  maxUses?: number | null
  maxUsesPerUser?: number | null
  usedCount: number
  validFrom: string
  validUntil: string
  listingIds: string[]
  propertyTypes: string[]
  stackWithMembership: boolean
  stackWithPromotions: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const percentageOptions = [5, 10, 15, 20]

const couponSchema = z.object({
  code: z.string().trim().min(3),
  name: z.string().trim().min(3),
  description: z.string().optional(),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
  discountValue: z.number().positive(),
  maxDiscount: z.number().nonnegative().nullable().optional(),
  minBookingValue: z.number().nonnegative().nullable().optional(),
  maxUses: z.number().int().positive().nullable().optional(),
  maxUsesPerUser: z.number().int().positive().nullable().optional(),
  validFrom: z.string().optional(),
  validUntil: z.string(),
  listingIds: z.array(z.string()).optional(),
  stackWithMembership: z.boolean().optional(),
  stackWithPromotions: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
})

const toDateInput = (value?: string) => {
  if (!value) return ''
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? '' : format(parsed, 'yyyy-MM-dd')
}

const formatCurrency = (value?: number | null) =>
  typeof value === 'number' && !Number.isNaN(value) ? `${value.toLocaleString('vi-VN')}₫` : '—'

export default function HostCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    code: '',
    name: '',
    description: '',
    discountType: 'PERCENTAGE' as Coupon['discountType'],
    discountValue: 5,
    maxDiscount: null as number | null,
    minBookingValue: null as number | null,
    maxUses: null as number | null,
    maxUsesPerUser: null as number | null,
    validFrom: '',
    validUntil: '',
    listingIds: [] as string[],
    stackWithMembership: true,
    stackWithPromotions: false,
    metadata: {},
  })
  const [submitting, setSubmitting] = useState(false)

  const loadCoupons = useCallback(async (keyword?: string) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (keyword) params.set('search', keyword)
      const res = await fetch(`/api/host/coupons?${params.toString()}`, { cache: 'no-store' })
      if (!res.ok) {
        throw new Error('Failed to load coupons')
      }
      const data = await res.json()
      setCoupons(Array.isArray(data.coupons) ? data.coupons : [])
    } catch (error) {
      console.error('Load coupons error:', error)
      toast.error('Không thể tải danh sách coupon')
      setCoupons([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadCoupons()
  }, [loadCoupons])

  const resetForm = () => {
    setForm({
      code: '',
      name: '',
      description: '',
      discountType: 'PERCENTAGE',
      discountValue: 5,
      maxDiscount: null,
      minBookingValue: null,
      maxUses: null,
      maxUsesPerUser: null,
      validFrom: '',
      validUntil: '',
      listingIds: [],
      stackWithMembership: true,
      stackWithPromotions: false,
      metadata: {},
    })
    setEditingId(null)
  }

  const openCreateDialog = () => {
    resetForm()
    setDialogOpen(true)
  }

  const openEditDialog = (coupon: Coupon) => {
    setEditingId(coupon.id)
    setForm({
      code: coupon.code,
      name: coupon.name,
      description: coupon.description ?? '',
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxDiscount: coupon.maxDiscount ?? null,
      minBookingValue: coupon.minBookingValue ?? null,
      maxUses: coupon.maxUses ?? null,
      maxUsesPerUser: coupon.maxUsesPerUser ?? null,
      validFrom: toDateInput(coupon.validFrom),
      validUntil: toDateInput(coupon.validUntil),
      listingIds: coupon.listingIds ?? [],
      stackWithMembership: coupon.stackWithMembership,
      stackWithPromotions: coupon.stackWithPromotions,
      metadata: {},
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      const parsed = couponSchema.parse({
        ...form,
        discountValue: Number(form.discountValue),
        maxDiscount: form.maxDiscount ?? null,
        minBookingValue: form.minBookingValue ?? null,
        maxUses: form.maxUses ?? null,
        maxUsesPerUser: form.maxUsesPerUser ?? null,
      })

      if (parsed.discountType === 'PERCENTAGE' && !percentageOptions.includes(Math.round(parsed.discountValue))) {
        toast.error('Coupon phần trăm chỉ hỗ trợ 5%, 10%, 15% hoặc 20%.')
        return
      }

      setSubmitting(true)
      const res = await fetch('/api/host/coupons', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? { id: editingId, ...parsed } : parsed),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Không thể lưu coupon')
      }

      toast.success(editingId ? 'Đã cập nhật coupon' : 'Đã tạo coupon mới')
      setDialogOpen(false)
      resetForm()
      await loadCoupons(search)
    } catch (error: any) {
      console.error('Save coupon error:', error)
      toast.error(error.message || 'Không thể lưu coupon')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDisable = async (id: string) => {
    try {
      const res = await fetch(`/api/host/coupons?id=${id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Không thể vô hiệu hóa coupon')
      }
      toast.success('Đã vô hiệu hóa coupon')
      await loadCoupons(search)
    } catch (error: any) {
      console.error('Disable coupon error:', error)
      toast.error(error.message || 'Không thể vô hiệu hóa coupon')
    }
  }

  const filteredCoupons = useMemo(() => {
    if (!search.trim()) return coupons
    const keyword = search.trim().toLowerCase()
    return coupons.filter(
      (coupon) =>
        coupon.code.toLowerCase().includes(keyword) ||
        coupon.name.toLowerCase().includes(keyword) ||
        (coupon.description ?? '').toLowerCase().includes(keyword),
    )
  }, [search, coupons])

  return (
    <HostLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold">
              <TicketPercent className="h-6 w-6 text-primary" />
              Coupon của tôi
            </h1>
            <p className="mt-1 text-muted-foreground">
              Tạo mã giảm giá riêng cho homestay của bạn. Bạn có thể giới hạn số lần sử dụng và thời gian hiệu lực.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Input
              placeholder="Tìm coupon..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onBlur={() => {
                void loadCoupons(search.trim())
              }}
            />
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Tạo coupon
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Danh sách coupon</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredCoupons.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">Chưa có coupon nào.</div>
            ) : (
              <div className="space-y-3">
                {filteredCoupons.map((coupon) => (
                  <Card key={coupon.id} className="border border-primary/10">
                    <CardContent className="space-y-3 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={coupon.isActive ? 'default' : 'outline'}>
                              {coupon.isActive ? 'Đang hoạt động' : 'Đã tắt'}
                            </Badge>
                            {coupon.stackWithPromotions && <Badge variant="secondary">Cho phép cộng dồn</Badge>}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-semibold">{coupon.name}</span>
                            <Badge variant="outline" className="font-mono">
                              {coupon.code}
                            </Badge>
                          </div>
                          {coupon.description && (
                            <p className="text-sm text-muted-foreground">{coupon.description}</p>
                          )}
                        </div>
                        <div className="flex min-w-[200px] flex-col gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEditDialog(coupon)}>
                            Chỉnh sửa
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-destructive text-destructive"
                            onClick={() => handleDisable(coupon.id)}
                            disabled={!coupon.isActive}
                          >
                            Vô hiệu hóa
                          </Button>
                        </div>
                      </div>
                      <div className="grid gap-3 text-sm md:grid-cols-4">
                        <div>
                          <p className="text-xs uppercase text-muted-foreground">Giảm giá</p>
                          <p className="font-semibold">
                            {coupon.discountType === 'PERCENTAGE'
                              ? `${coupon.discountValue}%`
                              : formatCurrency(coupon.discountValue)}
                          </p>
                          {coupon.maxDiscount ? (
                            <p className="text-xs text-muted-foreground">
                              Tối đa {formatCurrency(coupon.maxDiscount)}
                            </p>
                          ) : null}
                        </div>
                        <div>
                          <p className="text-xs uppercase text-muted-foreground">Hiệu lực</p>
                          <p>
                            {format(new Date(coupon.validFrom), 'dd/MM/yyyy')} -{' '}
                            {format(new Date(coupon.validUntil), 'dd/MM/yyyy')}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase text-muted-foreground">Điều kiện</p>
                          <p>Tối thiểu {formatCurrency(coupon.minBookingValue)}</p>
                          <p className="text-xs text-muted-foreground">
                            Tổng {coupon.maxUses ?? '∞'} • Mỗi khách {coupon.maxUsesPerUser ?? '∞'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase text-muted-foreground">Thống kê</p>
                          <p>{coupon.usedCount} lượt sử dụng</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) resetForm()
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Chỉnh sửa coupon' : 'Tạo coupon mới'}</DialogTitle>
            <DialogDescription>
              Thiết lập coupon dành riêng cho homestay của bạn. Bạn có thể giới hạn số lượt sử dụng và nhiều điều kiện khác nhau.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Mã coupon</Label>
              <Input
                value={form.code}
                onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value.toUpperCase() }))}
                placeholder="VD: MYHOST10"
              />
            </div>
            <div className="space-y-2">
              <Label>Tên hiển thị</Label>
              <Input
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Giảm 10% khách quay lại"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Mô tả</Label>
            <Textarea
              rows={2}
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Loại giảm</Label>
              <Select
                value={form.discountType}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, discountType: value as Coupon['discountType'] }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">Phần trăm</SelectItem>
                  <SelectItem value="FIXED_AMOUNT">Số tiền</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Giá trị</Label>
              {form.discountType === 'PERCENTAGE' ? (
                <Select
                  value={String(form.discountValue)}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, discountValue: Number(value) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {percentageOptions.map((option) => (
                      <SelectItem key={option} value={String(option)}>
                        {option}%
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type="number"
                  min={0}
                  value={form.discountValue}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, discountValue: Number(event.target.value) }))
                  }
                />
              )}
            </div>
            <div className="space-y-2">
              <Label>Giảm tối đa (VND)</Label>
              <Input
                type="number"
                min={0}
                value={form.maxDiscount ?? ''}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    maxDiscount: event.target.value ? Number(event.target.value) : null,
                  }))
                }
                disabled={form.discountType !== 'PERCENTAGE'}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Ngày bắt đầu</Label>
              <Input
                type="date"
                value={form.validFrom}
                onChange={(event) => setForm((prev) => ({ ...prev, validFrom: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Ngày kết thúc</Label>
              <Input
                type="date"
                value={form.validUntil}
                onChange={(event) => setForm((prev) => ({ ...prev, validUntil: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Giá trị đơn tối thiểu</Label>
              <Input
                type="number"
                min={0}
                value={form.minBookingValue ?? ''}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    minBookingValue: event.target.value ? Number(event.target.value) : null,
                  }))
                }
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Tổng số lượt</Label>
              <Input
                type="number"
                min={1}
                value={form.maxUses ?? ''}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    maxUses: event.target.value ? Number(event.target.value) : null,
                  }))
                }
                placeholder="Không giới hạn nếu để trống"
              />
            </div>
            <div className="space-y-2">
              <Label>Lượt mỗi khách</Label>
              <Input
                type="number"
                min={1}
                value={form.maxUsesPerUser ?? ''}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    maxUsesPerUser: event.target.value ? Number(event.target.value) : null,
                  }))
                }
                placeholder="Không giới hạn nếu để trống"
              />
            </div>
            <div className="space-y-2">
              <Label>Listing áp dụng (mỗi dòng một ID)</Label>
              <Textarea
                rows={3}
                value={form.listingIds.join('\n')}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    listingIds: event.target.value
                      .split('\n')
                      .map((line) => line.trim())
                      .filter(Boolean),
                  }))
                }
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="stack-membership"
                checked={form.stackWithMembership}
                onCheckedChange={(checked) => setForm((prev) => ({ ...prev, stackWithMembership: checked }))}
              />
              <Label htmlFor="stack-membership">Cho phép cộng dồn với membership</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="stack-promotions"
                checked={form.stackWithPromotions}
                onCheckedChange={(checked) => setForm((prev) => ({ ...prev, stackWithPromotions: checked }))}
              />
              <Label htmlFor="stack-promotions">Cho phép cộng dồn với voucher khác</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </HostLayout>
  )
}
