"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { format } from "date-fns"
import { TicketPercent, Plus, Loader2, CalendarClock, Percent, Layers } from "lucide-react"
import { z } from "zod"
import { useRouter } from "next/navigation"

import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

type Voucher = {
  id: string
  code: string
  name: string
  description?: string | null
  discountType: "PERCENTAGE" | "FIXED_AMOUNT"
  discountValue: number
  maxDiscount?: number | null
  minBookingValue?: number | null
  maxUses?: number | null
  maxUsesPerUser?: number | null
  usedCount: number
  source: "ADMIN" | "HOST" | "LOYALTY_EXCHANGE"
  pointCost: number
  stackWithMembership: boolean
  stackWithPromotions: boolean
  allowedMembershipTiers: string[]
  listingIds: string[]
  propertyTypes: string[]
  validFrom: string
  validUntil: string
  isActive: boolean
  metadata?: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
  redemptionCounts?: {
    total: number
    byStatus: Record<string, number>
  }
}

const defaultForm: Partial<Voucher> & { discountType: Voucher["discountType"]; discountValue: number } = {
  code: "",
  name: "",
  description: "",
  discountType: "PERCENTAGE",
  discountValue: 5,
  minBookingValue: 0,
  maxUses: null,
  maxUsesPerUser: null,
  stackWithMembership: true,
  stackWithPromotions: false,
  pointCost: 0,
  allowedMembershipTiers: [],
  listingIds: [],
  propertyTypes: [],
  validFrom: "",
  validUntil: "",
  isActive: true,
}

const loyaltyTiers = ["BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND"] as const
const percentageOptions = [5, 10, 15, 20]

const voucherFormSchema = z.object({
  code: z.string().trim().min(3),
  name: z.string().trim().min(3),
  discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
  discountValue: z.number().positive(),
  maxDiscount: z.number().nonnegative().nullable().optional(),
  minBookingValue: z.number().nonnegative().nullable().optional(),
  maxUses: z.number().int().positive().nullable().optional(),
  maxUsesPerUser: z.number().int().positive().nullable().optional(),
  validFrom: z.string().optional(),
  validUntil: z.string(),
  pointCost: z.number().int().nonnegative().optional(),
  stackWithMembership: z.boolean().optional(),
  stackWithPromotions: z.boolean().optional(),
  allowedMembershipTiers: z.array(z.string()).optional(),
  listingIds: z.array(z.string()).optional(),
  propertyTypes: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  description: z.string().optional(),
})

const toInputDate = (value?: string) => {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return format(date, "yyyy-MM-dd")
}

const formatMoney = (value?: number | null) =>
  typeof value === "number" && !Number.isNaN(value) ? value.toLocaleString("vi-VN") + "₫" : "—"

export default function AdminVouchersPage() {
  const router = useRouter()
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formState, setFormState] = useState<typeof defaultForm>(defaultForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [unauthorized, setUnauthorized] = useState(false)

  const loadVouchers = useCallback(async (searchTerm?: string) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.set("search", searchTerm)
      const res = await fetch(`/api/admin/vouchers?${params.toString()}`, { cache: "no-store" })
      if (res.status === 401) {
        setUnauthorized(true)
        setVouchers([])
        return
      }
      if (!res.ok) {
        const payload = await res.json().catch(() => null)
        throw new Error(payload?.error || "Không thể tải danh sách voucher")
      }
      setUnauthorized(false)
      const data = await res.json()
      setVouchers(Array.isArray(data.vouchers) ? data.vouchers : [])
    } catch (error) {
      console.error("Load vouchers error:", error)
      if (!unauthorized) toast.error((error as Error).message)
      setVouchers([])
    } finally {
      setLoading(false)
    }
  }, [unauthorized])

  useEffect(() => {
    void loadVouchers()
  }, [loadVouchers])

  const resetForm = useCallback(() => {
    setFormState(defaultForm)
    setEditingId(null)
  }, [])

  const openCreateDialog = () => {
    resetForm()
    setDialogOpen(true)
  }

  const openEditDialog = (voucher: Voucher) => {
    setEditingId(voucher.id)
    setFormState({
      code: voucher.code,
      name: voucher.name,
      description: voucher.description ?? "",
      discountType: voucher.discountType,
      discountValue: voucher.discountValue,
      maxDiscount: voucher.maxDiscount ?? null,
      minBookingValue: voucher.minBookingValue ?? null,
      maxUses: voucher.maxUses ?? null,
      maxUsesPerUser: voucher.maxUsesPerUser ?? null,
      stackWithMembership: voucher.stackWithMembership,
      stackWithPromotions: voucher.stackWithPromotions,
      pointCost: voucher.pointCost,
      allowedMembershipTiers: voucher.allowedMembershipTiers,
      listingIds: voucher.listingIds,
      propertyTypes: voucher.propertyTypes,
      validFrom: toInputDate(voucher.validFrom),
      validUntil: toInputDate(voucher.validUntil),
      isActive: voucher.isActive,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      const parsed = voucherFormSchema.parse({
        code: formState.code,
        name: formState.name,
        discountType: formState.discountType,
        discountValue: Number(formState.discountValue),
        maxDiscount: formState.maxDiscount === null || formState.maxDiscount === undefined || formState.maxDiscount === "" ? null : Number(formState.maxDiscount),
        minBookingValue:
          formState.minBookingValue === null || formState.minBookingValue === undefined || formState.minBookingValue === ""
            ? null
            : Number(formState.minBookingValue),
        maxUses: formState.maxUses === null || formState.maxUses === undefined || formState.maxUses === "" ? null : Number(formState.maxUses),
        maxUsesPerUser:
          formState.maxUsesPerUser === null || formState.maxUsesPerUser === undefined || formState.maxUsesPerUser === ""
            ? null
            : Number(formState.maxUsesPerUser),
        validFrom: formState.validFrom || undefined,
        validUntil: formState.validUntil,
        pointCost: formState.pointCost ?? 0,
        stackWithMembership: formState.stackWithMembership ?? true,
        stackWithPromotions: formState.stackWithPromotions ?? false,
        allowedMembershipTiers: formState.allowedMembershipTiers ?? [],
        listingIds: formState.listingIds ?? [],
        propertyTypes: formState.propertyTypes ?? [],
        isActive: formState.isActive ?? true,
        description: formState.description ?? "",
      })

      if (parsed.discountType === "PERCENTAGE" && !percentageOptions.includes(Math.round(parsed.discountValue))) {
        toast.error("Voucher phần trăm chỉ hỗ trợ 5%, 10%, 15% hoặc 20%.")
        return
      }

      setSubmitting(true)
      const payload = {
        ...parsed,
        discountValue: parsed.discountValue,
        pointCost: parsed.pointCost ?? 0,
      }

      const res = await fetch(editingId ? "/api/admin/vouchers" : "/api/admin/vouchers", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Lưu voucher thất bại")
      }

      toast.success(editingId ? "Đã cập nhật voucher" : "Đã tạo voucher mới")
      setDialogOpen(false)
      resetForm()
      await loadVouchers(search)
    } catch (error: any) {
      console.error("Save voucher error:", error)
      toast.error(error.message || "Không thể lưu voucher")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDisable = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/vouchers?id=${id}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Không thể vô hiệu hóa voucher")
      }
      toast.success("Đã vô hiệu hóa voucher")
      await loadVouchers(search)
    } catch (error: any) {
      console.error("Disable voucher error:", error)
      toast.error(error.message || "Không thể vô hiệu hóa voucher")
    }
  }

  const filteredVouchers = useMemo(() => {
    if (!search.trim()) return vouchers
    const keyword = search.trim().toLowerCase()
    return vouchers.filter(
      (voucher) =>
        voucher.code.toLowerCase().includes(keyword) ||
        voucher.name.toLowerCase().includes(keyword) ||
        (voucher.description ?? "").toLowerCase().includes(keyword),
    )
  }, [search, vouchers])

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <TicketPercent className="h-7 w-7 text-primary" />
              Quản lý voucher & coupon
            </h1>
            <p className="text-muted-foreground mt-1 max-w-2xl">
              Tạo voucher giảm giá, cấu hình điều kiện áp dụng và theo dõi lượt sử dụng. Voucher có thể dùng cho chương trình
              đổi điểm, ưu đãi nội bộ hoặc cấp cho host.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Input
              placeholder="Tìm theo mã, tên hoặc mô tả..."
              className="w-64"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
              }}
              onBlur={() => {
                void loadVouchers(search.trim())
              }}
            />
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Tạo voucher
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Danh sách voucher</CardTitle>
            <CardDescription>
              Tổng cộng {filteredVouchers.length} voucher. Nhấn vào từng dòng để chỉnh sửa hoặc vô hiệu hóa.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : unauthorized ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <p className="text-muted-foreground">
                  Bạn cần đăng nhập bằng tài khoản quản trị để xem và quản lý voucher.
                </p>
                <div className="flex items-center gap-2">
                  <Button onClick={() => router.push("/login")}>Đăng nhập</Button>
                  <Button variant="outline" onClick={() => router.push("/")}>
                    Về trang chủ
                  </Button>
                </div>
              </div>
            ) : filteredVouchers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">Chưa có voucher nào.</div>
            ) : (
              <div className="space-y-4">
                {filteredVouchers.map((voucher) => (
                  <Card key={voucher.id} className="border border-muted">
                    <CardContent className="p-5 space-y-4">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={voucher.isActive ? "default" : "outline"}>
                              {voucher.isActive ? "Đang hoạt động" : "Đã vô hiệu hóa"}
                            </Badge>
                            {voucher.source === "LOYALTY_EXCHANGE" && (
                              <Badge variant="secondary">Đổi điểm</Badge>
                            )}
                            {voucher.source === "HOST" && <Badge variant="secondary">Host phát hành</Badge>}
                          </div>
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="text-lg font-semibold">{voucher.name}</span>
                            <Badge variant="outline" className="font-mono">
                              {voucher.code}
                            </Badge>
                          </div>
                          {voucher.description && (
                            <p className="text-sm text-muted-foreground">{voucher.description}</p>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 min-w-[220px]">
                          <Button variant="outline" size="sm" onClick={() => openEditDialog(voucher)}>
                            Chỉnh sửa
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive border-destructive"
                            onClick={() => handleDisable(voucher.id)}
                            disabled={!voucher.isActive}
                          >
                            Vô hiệu hóa
                          </Button>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-4">
                        <div className="rounded-lg border p-4 space-y-1">
                          <p className="text-xs uppercase text-muted-foreground flex items-center gap-2">
                            <Percent className="h-3.5 w-3.5" />
                            Giảm giá
                          </p>
                          <p className="text-lg font-semibold">
                            {voucher.discountType === "PERCENTAGE"
                              ? `${voucher.discountValue}%`
                              : `${voucher.discountValue.toLocaleString("vi-VN")}₫`}
                          </p>
                          {voucher.maxDiscount ? (
                            <p className="text-xs text-muted-foreground">
                              Tối đa {voucher.maxDiscount.toLocaleString("vi-VN")}₫
                            </p>
                          ) : null}
                        </div>
                        <div className="rounded-lg border p-4 space-y-1">
                          <p className="text-xs uppercase text-muted-foreground flex items-center gap-2">
                            <CalendarClock className="h-3.5 w-3.5" />
                            Hiệu lực
                          </p>
                          <p className="text-sm font-medium">
                            {format(new Date(voucher.validFrom), "dd/MM/yyyy")} -{" "}
                            {format(new Date(voucher.validUntil), "dd/MM/yyyy")}
                          </p>
                        </div>
                        <div className="rounded-lg border p-4 space-y-1">
                          <p className="text-xs uppercase text-muted-foreground">Điều kiện</p>
                          <p className="text-sm">
                            Tối thiểu {formattedMinBooking(voucher.minBookingValue)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Tối đa {voucher.maxUses ?? "∞"} lượt • Mỗi khách {voucher.maxUsesPerUser ?? "∞"}
                          </p>
                        </div>
                        <div className="rounded-lg border p-4 space-y-1">
                          <p className="text-xs uppercase text-muted-foreground flex items-center gap-2">
                            <Layers className="h-3.5 w-3.5" />
                            Thống kê
                          </p>
                          <p className="text-lg font-semibold">{voucher.usedCount}</p>
                          <p className="text-xs text-muted-foreground">
                            Đã đổi • Tổng lượt: {voucher.redemptionCounts?.total ?? voucher.usedCount}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>Stack membership: {voucher.stackWithMembership ? "Có" : "Không"}</span>
                        <span>•</span>
                        <span>Stack voucher khác: {voucher.stackWithPromotions ? "Có" : "Không"}</span>
                        {voucher.pointCost > 0 && (
                          <>
                            <span>•</span>
                            <span>Đổi {voucher.pointCost.toLocaleString("vi-VN")} điểm</span>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) resetForm()
          }}
        >
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{editingId ? "Chỉnh sửa voucher" : "Tạo voucher mới"}</DialogTitle>
              <DialogDescription>
                Thiết lập mã giảm giá và điều kiện áp dụng. Voucher phần trăm chỉ hỗ trợ 5%, 10%, 15% hoặc 20%.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Mã voucher</Label>
                <Input
                  value={formState.code}
                  onChange={(event) => setFormState((prev) => ({ ...prev, code: event.target.value.toUpperCase() }))}
                  placeholder="VD: LUXE5"
                />
              </div>
              <div className="space-y-2">
                <Label>Tên hiển thị</Label>
                <Input
                  value={formState.name}
                  onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Giảm 10% mùa lễ hội"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Textarea
                value={formState.description ?? ""}
                onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
                rows={2}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Loại giảm giá</Label>
                <Select
                  value={formState.discountType}
                  onValueChange={(value: Voucher["discountType"]) =>
                    setFormState((prev) => ({ ...prev, discountType: value as Voucher["discountType"] }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Phần trăm (%)</SelectItem>
                    <SelectItem value="FIXED_AMOUNT">Số tiền cố định</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Giá trị</Label>
                {formState.discountType === "PERCENTAGE" ? (
                  <Select
                    value={String(formState.discountValue)}
                    onValueChange={(value) =>
                      setFormState((prev) => ({ ...prev, discountValue: Number(value) }))
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
                    value={formState.discountValue}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, discountValue: Number(event.target.value) }))
                    }
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label>Giảm tối đa (VND)</Label>
                <Input
                  type="number"
                  min={0}
                  value={formState.maxDiscount ?? ""}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      maxDiscount: event.target.value ? Number(event.target.value) : null,
                    }))
                  }
                  placeholder="Ví dụ: 500000"
                  disabled={formState.discountType !== "PERCENTAGE"}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Ngày bắt đầu</Label>
                <Input
                  type="date"
                  value={formState.validFrom}
                  onChange={(event) => setFormState((prev) => ({ ...prev, validFrom: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Ngày kết thúc</Label>
                <Input
                  type="date"
                  value={formState.validUntil}
                  onChange={(event) => setFormState((prev) => ({ ...prev, validUntil: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Giá trị đơn tối thiểu (VND)</Label>
                <Input
                  type="number"
                  min={0}
                  value={formState.minBookingValue ?? ""}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      minBookingValue: event.target.value ? Number(event.target.value) : null,
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Tổng số lượt sử dụng</Label>
                <Input
                  type="number"
                  min={1}
                  value={formState.maxUses ?? ""}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      maxUses: event.target.value ? Number(event.target.value) : null,
                    }))
                  }
                  placeholder="Không giới hạn nếu để trống"
                />
              </div>
              <div className="space-y-2">
                <Label>Số lượt mỗi khách</Label>
                <Input
                  type="number"
                  min={1}
                  value={formState.maxUsesPerUser ?? ""}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      maxUsesPerUser: event.target.value ? Number(event.target.value) : null,
                    }))
                  }
                  placeholder="Không giới hạn nếu để trống"
                />
              </div>
              <div className="space-y-2">
                <Label>Điểm quy đổi</Label>
                <Input
                  type="number"
                  min={0}
                  value={formState.pointCost ?? 0}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      pointCost: Number(event.target.value),
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Áp dụng cho hạng membership</Label>
                <div className="flex flex-wrap gap-2">
                  {loyaltyTiers.map((tier) => {
                    const checked = formState.allowedMembershipTiers?.includes(tier)
                    return (
                      <Button
                        key={tier}
                        type="button"
                        variant={checked ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setFormState((prev) => {
                            const current = new Set(prev.allowedMembershipTiers ?? [])
                            if (current.has(tier)) {
                              current.delete(tier)
                            } else {
                              current.add(tier)
                            }
                            return { ...prev, allowedMembershipTiers: Array.from(current) }
                          })
                        }}
                      >
                        {tier}
                      </Button>
                    )
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Danh sách listing áp dụng (mỗi dòng một ID)</Label>
                <Textarea
                  rows={3}
                  value={(formState.listingIds ?? []).join("\n")}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      listingIds: event.target.value
                        .split("\n")
                        .map((line) => line.trim())
                        .filter(Boolean),
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="stack-membership"
                  checked={formState.stackWithMembership ?? true}
                  onCheckedChange={(checked) =>
                    setFormState((prev) => ({ ...prev, stackWithMembership: checked }))
                  }
                />
                <Label htmlFor="stack-membership">Cho phép cộng dồn với membership</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="stack-others"
                  checked={formState.stackWithPromotions ?? false}
                  onCheckedChange={(checked) =>
                    setFormState((prev) => ({ ...prev, stackWithPromotions: checked }))
                  }
                />
                <Label htmlFor="stack-others">Cho phép cộng dồn với voucher khác</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="is-active"
                  checked={formState.isActive ?? true}
                  onCheckedChange={(checked) =>
                    setFormState((prev) => ({ ...prev, isActive: checked }))
                  }
                />
                <Label htmlFor="is-active">Kích hoạt</Label>
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleSave} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingId ? "Cập nhật" : "Tạo mới"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}

const formattedMinBooking = (value?: number | null) =>
  typeof value === "number" && value > 0 ? value.toLocaleString("vi-VN") + "₫" : "Không yêu cầu"
