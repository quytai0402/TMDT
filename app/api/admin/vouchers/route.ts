import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import {
  DiscountType,
  LoyaltyTier,
  PromotionSource,
  PromotionType,
  PropertyType,
} from "@prisma/client"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const PERCENTAGE_OPTIONS = new Set([5, 10, 15, 20])

const upsertSchema = z.object({
  code: z.string().trim().min(3).max(32),
  name: z.string().trim().min(3).max(120),
  description: z.string().trim().max(500).optional(),
  discountType: z.nativeEnum(DiscountType),
  discountValue: z.number().positive(),
  maxDiscount: z.number().nonnegative().nullable().optional(),
  minBookingValue: z.number().nonnegative().nullable().optional(),
  maxUses: z.number().int().positive().nullable().optional(),
  maxUsesPerUser: z.number().int().positive().nullable().optional(),
  validFrom: z.string().optional(),
  validUntil: z.string().optional(),
  propertyTypes: z.array(z.nativeEnum(PropertyType)).optional(),
  listingIds: z.array(z.string().trim().min(1)).optional(),
  allowedMembershipTiers: z.array(z.nativeEnum(LoyaltyTier)).optional(),
  pointCost: z.number().int().nonnegative().nullable().optional(),
  stackWithMembership: z.boolean().optional(),
  stackWithPromotions: z.boolean().optional(),
  isActive: z.boolean().optional(),
  type: z.nativeEnum(PromotionType).optional(),
  source: z.nativeEnum(PromotionSource).optional(),
  hostId: z.string().trim().min(1).optional(),
  metadata: z.record(z.any()).optional(),
})

const updateSchema = upsertSchema.partial().extend({
  id: z.string().trim().min(1),
})

const filtersSchema = z.object({
  source: z.nativeEnum(PromotionSource).optional(),
  hostId: z.string().trim().min(1).optional(),
  active: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => (value ? value === "true" : undefined)),
  search: z.string().trim().optional(),
})

const toDateOrNull = (value?: string): Date | null => {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const serializePromotion = (promotion: any) => {
  const redemptionStats = promotion.redemptions?.reduce(
    (acc: Record<string, number>, redemption: { status: string }) => {
      acc[redemption.status] = (acc[redemption.status] ?? 0) + 1
      return acc
    },
    {},
  ) ?? {}

  return {
    id: promotion.id,
    code: promotion.code,
    name: promotion.name,
    description: promotion.description,
    discountType: promotion.discountType,
    discountValue: promotion.discountValue,
    maxDiscount: promotion.maxDiscount,
    minBookingValue: promotion.minBookingValue,
    maxUses: promotion.maxUses,
    maxUsesPerUser: promotion.maxUsesPerUser,
    usedCount: promotion.usedCount,
    source: promotion.source,
    pointCost: promotion.pointCost ?? 0,
    stackWithMembership: promotion.stackWithMembership,
    stackWithPromotions: promotion.stackWithPromotions,
    allowedMembershipTiers: promotion.allowedMembershipTiers ?? [],
    listingIds: promotion.listingIds ?? [],
    propertyTypes: promotion.propertyTypes ?? [],
    validFrom: promotion.validFrom,
    validUntil: promotion.validUntil,
    isActive: promotion.isActive,
    metadata: promotion.metadata ?? null,
    type: promotion.type,
    host: promotion.host
      ? {
          id: promotion.host.id,
          name: promotion.host.name,
          email: promotion.host.email,
        }
      : null,
    redemptionCounts: {
      total: promotion.redemptions?.length ?? 0,
      byStatus: redemptionStats,
    },
    createdAt: promotion.createdAt,
    updatedAt: promotion.updatedAt,
  }
}

const ensureAdminSession = async () => {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return null
  }
  return session
}

export async function GET(request: NextRequest) {
  try {
    const session = await ensureAdminSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const filtersParse = filtersSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams))
    if (!filtersParse.success) {
      return NextResponse.json({ error: "Invalid filters", details: filtersParse.error.flatten() }, { status: 400 })
    }

    const { source, hostId, active, search } = filtersParse.data

    const where: Record<string, unknown> = {}
    if (source) where.source = source
    if (hostId) where.hostId = hostId
    if (typeof active === "boolean") where.isActive = active
    if (search) {
      where.OR = [
        { code: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    const promotions = await prisma.promotion.findMany({
      where,
      include: {
        host: { select: { id: true, name: true, email: true } },
        redemptions: { select: { status: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    })

    return NextResponse.json({
      vouchers: promotions.map(serializePromotion),
    })
  } catch (error) {
    console.error("Admin vouchers GET error:", error)
    return NextResponse.json({ error: "Failed to load vouchers" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await ensureAdminSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await request.json()
    const parsed = upsertSchema.safeParse(payload)

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 })
    }

    const data = parsed.data

    if (data.discountType === DiscountType.PERCENTAGE && !PERCENTAGE_OPTIONS.has(Math.round(data.discountValue))) {
      return NextResponse.json(
        { error: "Voucher phần trăm chỉ hỗ trợ các mức 5%, 10%, 15% hoặc 20%." },
        { status: 400 },
      )
    }

    const validFrom = toDateOrNull(data.validFrom) ?? new Date()
    const validUntil = toDateOrNull(data.validUntil)

    if (!validUntil || validUntil <= validFrom) {
      return NextResponse.json(
        { error: "Ngày hết hạn phải sau ngày bắt đầu và không được để trống." },
        { status: 400 },
      )
    }

    const source =
      data.source ??
      (data.hostId ? PromotionSource.HOST : data.pointCost && data.pointCost > 0 ? PromotionSource.LOYALTY_EXCHANGE : PromotionSource.ADMIN)

    const promotion = await prisma.promotion.create({
      data: {
        code: data.code.toUpperCase(),
        name: data.name,
        description: data.description,
        type: data.type ?? PromotionType.GENERAL,
        discountType: data.discountType,
        discountValue: data.discountValue,
        maxDiscount: data.maxDiscount ?? null,
        minBookingValue: data.minBookingValue ?? null,
        maxUses: data.maxUses ?? null,
        maxUsesPerUser: data.maxUsesPerUser ?? null,
        pointCost: data.pointCost ?? 0,
        source,
        hostId: data.hostId ?? null,
        stackWithMembership: data.stackWithMembership ?? true,
        stackWithPromotions: data.stackWithPromotions ?? false,
        allowedMembershipTiers: data.allowedMembershipTiers ?? [],
        listingIds: data.listingIds ?? [],
        propertyTypes: data.propertyTypes ?? [],
        metadata: data.metadata ?? null,
        validFrom,
        validUntil,
        isActive: data.isActive ?? true,
      },
      include: {
        host: { select: { id: true, name: true, email: true } },
        redemptions: { select: { status: true } },
      },
    })

    return NextResponse.json({ voucher: serializePromotion(promotion) })
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Mã voucher đã tồn tại. Vui lòng chọn mã khác." }, { status: 409 })
    }

    console.error("Admin vouchers POST error:", error)
    return NextResponse.json({ error: "Không thể tạo voucher mới" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await ensureAdminSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await request.json()
    const parsed = updateSchema.safeParse(payload)

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 })
    }

    const { id, ...rest } = parsed.data
    const existing = await prisma.promotion.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: "Voucher không tồn tại" }, { status: 404 })
    }

    if (rest.discountType === DiscountType.PERCENTAGE || (rest.discountValue !== undefined && existing.discountType === DiscountType.PERCENTAGE)) {
      const candidateValue =
        rest.discountValue ?? existing.discountValue
      if (!PERCENTAGE_OPTIONS.has(Math.round(candidateValue))) {
        return NextResponse.json(
          { error: "Voucher phần trăm chỉ hỗ trợ các mức 5%, 10%, 15% hoặc 20%." },
          { status: 400 },
        )
      }
    }

    const validFrom = rest.validFrom ? toDateOrNull(rest.validFrom) : existing.validFrom
    const validUntil = rest.validUntil ? toDateOrNull(rest.validUntil) : existing.validUntil

    if (!validUntil || validUntil <= (validFrom ?? existing.validFrom)) {
      return NextResponse.json(
        { error: "Ngày hết hạn phải sau ngày bắt đầu và không được để trống." },
        { status: 400 },
      )
    }

    const source = rest.source ?? existing.source

    const updated = await prisma.promotion.update({
      where: { id },
      data: {
        code: rest.code ? rest.code.toUpperCase() : undefined,
        name: rest.name ?? undefined,
        description: rest.description ?? undefined,
        type: rest.type ?? undefined,
        discountType: rest.discountType ?? undefined,
        discountValue: rest.discountValue ?? undefined,
        maxDiscount: rest.maxDiscount !== undefined ? rest.maxDiscount : undefined,
        minBookingValue: rest.minBookingValue !== undefined ? rest.minBookingValue : undefined,
        maxUses: rest.maxUses !== undefined ? rest.maxUses : undefined,
        maxUsesPerUser: rest.maxUsesPerUser !== undefined ? rest.maxUsesPerUser : undefined,
        pointCost: rest.pointCost !== undefined ? rest.pointCost ?? 0 : undefined,
        source,
        hostId: rest.hostId !== undefined ? rest.hostId ?? null : undefined,
        stackWithMembership: rest.stackWithMembership ?? undefined,
        stackWithPromotions: rest.stackWithPromotions ?? undefined,
        allowedMembershipTiers: rest.allowedMembershipTiers ?? undefined,
        listingIds: rest.listingIds ?? undefined,
        propertyTypes: rest.propertyTypes ?? undefined,
        metadata: rest.metadata ?? undefined,
        validFrom,
        validUntil,
        isActive: rest.isActive ?? undefined,
      },
      include: {
        host: { select: { id: true, name: true, email: true } },
        redemptions: { select: { status: true } },
      },
    })

    return NextResponse.json({ voucher: serializePromotion(updated) })
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Mã voucher đã tồn tại. Vui lòng chọn mã khác." }, { status: 409 })
    }

    console.error("Admin vouchers PATCH error:", error)
    return NextResponse.json({ error: "Không thể cập nhật voucher" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await ensureAdminSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const id = request.nextUrl.searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Thiếu mã voucher cần xóa" }, { status: 400 })
    }

    const promotion = await prisma.promotion.findUnique({ where: { id } })
    if (!promotion) {
      return NextResponse.json({ error: "Voucher không tồn tại" }, { status: 404 })
    }

    const disabled = await prisma.promotion.update({
      where: { id },
      data: {
        isActive: false,
      },
      include: {
        host: { select: { id: true, name: true, email: true } },
        redemptions: { select: { status: true } },
      },
    })

    return NextResponse.json({ voucher: serializePromotion(disabled) })
  } catch (error) {
    console.error("Admin vouchers DELETE error:", error)
    return NextResponse.json({ error: "Không thể vô hiệu hóa voucher" }, { status: 500 })
  }
}
