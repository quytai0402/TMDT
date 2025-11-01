import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { DiscountType, PromotionSource, PromotionType, PropertyType } from "@prisma/client"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const PERCENTAGE_OPTIONS = new Set([5, 10, 15, 20])

const upsertSchema = z.object({
  code: z.string().trim().min(3).max(32),
  name: z.string().trim().min(3).max(120),
  description: z.string().trim().max(400).optional(),
  discountType: z.nativeEnum(DiscountType),
  discountValue: z.number().positive(),
  maxDiscount: z.number().nonnegative().nullable().optional(),
  minBookingValue: z.number().nonnegative().nullable().optional(),
  maxUses: z.number().int().positive().nullable().optional(),
  maxUsesPerUser: z.number().int().positive().nullable().optional(),
  validFrom: z.string().optional(),
  validUntil: z.string(),
  propertyTypes: z.array(z.nativeEnum(PropertyType)).optional(),
  listingIds: z.array(z.string().trim().min(1)).optional(),
  stackWithMembership: z.boolean().optional(),
  stackWithPromotions: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
})

const updateSchema = upsertSchema.partial().extend({
  id: z.string().trim().min(1),
})

const toDate = (value?: string): Date | null => {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const ensureHostSession = async () => {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "HOST") {
    return null
  }
  return session
}

const serializePromotion = (promotion: any) => ({
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
  validFrom: promotion.validFrom,
  validUntil: promotion.validUntil,
  listingIds: promotion.listingIds ?? [],
  propertyTypes: promotion.propertyTypes ?? [],
  stackWithMembership: promotion.stackWithMembership,
  stackWithPromotions: promotion.stackWithPromotions,
  isActive: promotion.isActive,
  metadata: promotion.metadata ?? null,
  createdAt: promotion.createdAt,
  updatedAt: promotion.updatedAt,
  redemptionCounts: {
    total: promotion.redemptions?.length ?? 0,
  },
})

export async function GET(request: NextRequest) {
  try {
    const session = await ensureHostSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const search = request.nextUrl.searchParams.get("search")
    const activeParam = request.nextUrl.searchParams.get("active")
    const active =
      activeParam === null ? undefined : activeParam === "true" ? true : activeParam === "false" ? false : undefined

    const where: Record<string, unknown> = {
      hostId: session.user.id,
      source: PromotionSource.HOST,
    }

    if (typeof active === "boolean") {
      where.isActive = active
    }

    if (search) {
      where.OR = [
        { code: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
      ]
    }

    const promotions = await prisma.promotion.findMany({
      where,
      include: {
        redemptions: { select: { status: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    })

    return NextResponse.json({
      coupons: promotions.map(serializePromotion),
    })
  } catch (error) {
    console.error("Host coupons GET error:", error)
    return NextResponse.json({ error: "Không thể tải danh sách coupon" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await ensureHostSession()
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
        { error: "Coupon phần trăm chỉ hỗ trợ các mức 5%, 10%, 15% hoặc 20%." },
        { status: 400 },
      )
    }

    const validFrom = toDate(data.validFrom) ?? new Date()
    const validUntil = toDate(data.validUntil)

    if (!validUntil || validUntil <= validFrom) {
      return NextResponse.json({ error: "Vui lòng chọn thời gian kết thúc hợp lệ." }, { status: 400 })
    }

    const promotion = await prisma.promotion.create({
      data: {
        code: data.code.toUpperCase(),
        name: data.name,
        description: data.description,
        type: PromotionType.GENERAL,
        discountType: data.discountType,
        discountValue: data.discountValue,
        maxDiscount: data.maxDiscount ?? null,
        minBookingValue: data.minBookingValue ?? null,
        maxUses: data.maxUses ?? null,
        maxUsesPerUser: data.maxUsesPerUser ?? null,
        validFrom,
        validUntil,
        listingIds: data.listingIds ?? [],
        propertyTypes: data.propertyTypes ?? [],
        stackWithMembership: data.stackWithMembership ?? true,
        stackWithPromotions: data.stackWithPromotions ?? false,
        metadata: data.metadata ?? null,
        source: PromotionSource.HOST,
        hostId: session.user.id,
        isActive: true,
      },
      include: {
        redemptions: { select: { status: true } },
      },
    })

    return NextResponse.json({ coupon: serializePromotion(promotion) })
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Mã coupon đã tồn tại." }, { status: 409 })
    }
    console.error("Host coupons POST error:", error)
    return NextResponse.json({ error: "Không thể tạo coupon mới" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await ensureHostSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await request.json()
    const parsed = updateSchema.safeParse(payload)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 })
    }

    const { id, ...rest } = parsed.data
    const existing = await prisma.promotion.findFirst({
      where: { id, hostId: session.user.id, source: PromotionSource.HOST },
    })

    if (!existing) {
      return NextResponse.json({ error: "Coupon không tồn tại hoặc bạn không có quyền chỉnh sửa." }, { status: 404 })
    }

    if (rest.discountType === DiscountType.PERCENTAGE || (rest.discountValue !== undefined && existing.discountType === DiscountType.PERCENTAGE)) {
      const candidateValue = rest.discountValue ?? existing.discountValue
      if (!PERCENTAGE_OPTIONS.has(Math.round(candidateValue))) {
        return NextResponse.json(
          { error: "Coupon phần trăm chỉ hỗ trợ các mức 5%, 10%, 15% hoặc 20%." },
          { status: 400 },
        )
      }
    }

    const validFrom = rest.validFrom ? toDate(rest.validFrom) : existing.validFrom
    const validUntil = rest.validUntil ? toDate(rest.validUntil) : existing.validUntil

    if (!validUntil || validUntil <= (validFrom ?? existing.validFrom)) {
      return NextResponse.json({ error: "Vui lòng chọn thời gian kết thúc hợp lệ." }, { status: 400 })
    }

    const updated = await prisma.promotion.update({
      where: { id },
      data: {
        code: rest.code ? rest.code.toUpperCase() : undefined,
        name: rest.name ?? undefined,
        description: rest.description ?? undefined,
        discountType: rest.discountType ?? undefined,
        discountValue: rest.discountValue ?? undefined,
        maxDiscount: rest.maxDiscount !== undefined ? rest.maxDiscount : undefined,
        minBookingValue: rest.minBookingValue !== undefined ? rest.minBookingValue : undefined,
        maxUses: rest.maxUses !== undefined ? rest.maxUses : undefined,
        maxUsesPerUser: rest.maxUsesPerUser !== undefined ? rest.maxUsesPerUser : undefined,
        validFrom,
        validUntil,
        listingIds: rest.listingIds ?? undefined,
        propertyTypes: rest.propertyTypes ?? undefined,
        stackWithMembership: rest.stackWithMembership ?? undefined,
        stackWithPromotions: rest.stackWithPromotions ?? undefined,
        metadata: rest.metadata ?? undefined,
      },
      include: {
        redemptions: { select: { status: true } },
      },
    })

    return NextResponse.json({ coupon: serializePromotion(updated) })
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Mã coupon đã tồn tại." }, { status: 409 })
    }
    console.error("Host coupons PATCH error:", error)
    return NextResponse.json({ error: "Không thể cập nhật coupon" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await ensureHostSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const id = request.nextUrl.searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "Thiếu mã coupon cần vô hiệu hóa." }, { status: 400 })
    }

    const existing = await prisma.promotion.findFirst({
      where: { id, hostId: session.user.id, source: PromotionSource.HOST },
    })

    if (!existing) {
      return NextResponse.json({ error: "Coupon không tồn tại hoặc bạn không có quyền thao tác." }, { status: 404 })
    }

    const disabled = await prisma.promotion.update({
      where: { id },
      data: {
        isActive: false,
      },
      include: {
        redemptions: { select: { status: true } },
      },
    })

    return NextResponse.json({ coupon: serializePromotion(disabled) })
  } catch (error) {
    console.error("Host coupons DELETE error:", error)
    return NextResponse.json({ error: "Không thể vô hiệu hóa coupon" }, { status: 500 })
  }
}
