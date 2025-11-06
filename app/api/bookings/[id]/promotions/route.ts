import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { DiscountType, PromotionRedemptionStatus } from "@prisma/client"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { formatBookingResponse } from "../../utils"

const applyPromotionSchema = z.object({
  code: z.string().min(3, "Mã ưu đãi không hợp lệ").max(64, "Mã ưu đãi quá dài"),
})

const bookingInclude = {
  listing: {
    include: {
      host: {
        include: {
          hostProfile: true,
        },
      },
    },
  },
  guest: {
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      phone: true,
      loyaltyTier: true,
      loyaltyPoints: true,
    },
  },
  review: true,
  payment: true,
  conciergePlans: {
    orderBy: { createdAt: "desc" as const },
  },
} as const

const parsePromotionArray = (value: unknown): Array<Record<string, any>> => {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is Record<string, any> => Boolean(entry) && typeof entry === "object")
  }

  return []
}

const sanitizeCode = (code: string) => code.trim().toUpperCase()

const computeTotalBeforeDiscounts = (booking: { totalPrice?: number | null; discount?: number | null }) => {
  return (booking.totalPrice ?? 0) + (booking.discount ?? 0)
}

const buildMembershipEntry = (existing: Array<Record<string, any>>, fallbackAmount: number) => {
  const entry = existing.find((item) => item?.type === "MEMBERSHIP")
  if (entry) {
    return entry
  }

  if (fallbackAmount > 0) {
    return {
      type: "MEMBERSHIP",
      amount: fallbackAmount,
    }
  }

  return null
}

const ensureBookingAccess = (booking: { guestId: string | null; hostId: string; }, session: { user?: { id?: string; role?: string } }) => {
  const userId = session.user?.id
  if (!userId) {
    return false
  }
  const isGuest = booking.guestId && booking.guestId === userId
  const isHost = booking.hostId === userId
  const isAdmin = session.user?.role === "ADMIN"

  return Boolean(isGuest || isHost || isAdmin)
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Bạn cần đăng nhập để áp dụng mã ưu đãi." }, { status: 401 })
    }

    const body = await request.json()
    const { code } = applyPromotionSchema.parse(body)
    const normalizedCode = sanitizeCode(code)

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        listing: {
          select: {
            id: true,
            propertyType: true,
            title: true,
          },
        },
        guest: {
          select: {
            id: true,
            loyaltyTier: true,
          },
        },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: "Không tìm thấy đơn đặt phòng." }, { status: 404 })
    }

    if (!ensureBookingAccess(booking, session)) {
      return NextResponse.json({ error: "Bạn không có quyền cập nhật đơn này." }, { status: 403 })
    }

    const promotion = await prisma.promotion.findUnique({
      where: { code: normalizedCode },
    })

    if (!promotion || !promotion.isActive) {
      return NextResponse.json({ error: "Mã ưu đãi không tồn tại hoặc đã hết hạn." }, { status: 404 })
    }

    const now = new Date()
    if (promotion.validFrom && promotion.validFrom > now) {
      return NextResponse.json({ error: "Mã ưu đãi chưa bắt đầu hiệu lực." }, { status: 400 })
    }
    if (promotion.validUntil && promotion.validUntil < now) {
      return NextResponse.json({ error: "Mã ưu đãi đã hết hạn sử dụng." }, { status: 400 })
    }

    if (typeof promotion.maxUses === "number" && promotion.maxUses > 0 && promotion.usedCount >= promotion.maxUses) {
      return NextResponse.json({ error: "Mã ưu đãi đã đạt giới hạn sử dụng." }, { status: 400 })
    }

    const userId = session.user.id
    if (!userId) {
      return NextResponse.json({ error: "Không xác định được người dùng." }, { status: 400 })
    }

    if (promotion.userIds.length > 0 && !promotion.userIds.includes(userId)) {
      return NextResponse.json({ error: "Mã ưu đãi này không áp dụng cho tài khoản của bạn." }, { status: 400 })
    }

    if (promotion.listingIds.length > 0 && !promotion.listingIds.includes(booking.listingId)) {
      return NextResponse.json({ error: "Mã ưu đãi không áp dụng cho chỗ ở này." }, { status: 400 })
    }

    if (promotion.propertyTypes.length > 0 && !promotion.propertyTypes.includes(booking.listing.propertyType)) {
      return NextResponse.json({ error: "Mã ưu đãi không áp dụng cho loại chỗ ở này." }, { status: 400 })
    }

    const guestTier = booking.guest?.loyaltyTier ?? null
    if (promotion.allowedMembershipTiers.length > 0 && (!guestTier || !promotion.allowedMembershipTiers.includes(guestTier))) {
      return NextResponse.json({ error: "Mã ưu đãi chỉ dành cho hạng thành viên cao hơn." }, { status: 400 })
    }

    if (!promotion.stackWithMembership && (booking.membershipDiscount ?? 0) > 0) {
      return NextResponse.json({ error: "Mã ưu đãi này không áp dụng cùng ưu đãi thành viên." }, { status: 400 })
    }

    const appliedPromotions = parsePromotionArray(booking.appliedPromotions)
    const existingPromotionEntry = appliedPromotions.find((entry) => entry.type === "PROMOTION")
    const existingPromotionCode = typeof existingPromotionEntry?.code === "string" ? existingPromotionEntry.code : null

    if (existingPromotionEntry && existingPromotionCode && existingPromotionCode !== promotion.code) {
      return NextResponse.json({ error: "Bạn đã áp dụng mã khác. Vui lòng gỡ mã cũ trước." }, { status: 400 })
    }

    if (promotion.maxUsesPerUser && promotion.maxUsesPerUser > 0) {
      const userUsedCount = await prisma.promotionRedemption.count({
        where: {
          promotionId: promotion.id,
          userId,
          status: PromotionRedemptionStatus.USED,
        },
      })

      const hasExistingUsageForBooking = existingPromotionEntry && existingPromotionCode === promotion.code
      if (!hasExistingUsageForBooking && userUsedCount >= promotion.maxUsesPerUser) {
        return NextResponse.json({ error: "Bạn đã dùng mã này đủ số lần cho phép." }, { status: 400 })
      }
    }

    const totalBeforeDiscounts = computeTotalBeforeDiscounts({
      totalPrice: booking.totalPrice,
      discount: booking.discount,
    })
    const membershipDiscountAmount = booking.membershipDiscount ?? 0

    if (promotion.minBookingValue && totalBeforeDiscounts < promotion.minBookingValue) {
      return NextResponse.json({ error: "Giá trị đơn đặt phòng chưa đạt mức áp dụng mã." }, { status: 400 })
    }

    let promotionDiscount = 0

    if (promotion.discountType === DiscountType.PERCENTAGE) {
      promotionDiscount = Math.round(totalBeforeDiscounts * (promotion.discountValue / 100))
      if (promotion.maxDiscount && promotion.maxDiscount > 0) {
        promotionDiscount = Math.min(promotionDiscount, Math.round(promotion.maxDiscount))
      }
    } else {
      promotionDiscount = Math.round(promotion.discountValue)
    }

    const maxAllowedDiscount = Math.max(totalBeforeDiscounts - membershipDiscountAmount, 0)
    promotionDiscount = Math.min(promotionDiscount, maxAllowedDiscount)

    if (promotionDiscount <= 0) {
      return NextResponse.json({ error: "Mã ưu đãi hiện không tạo ra giảm giá." }, { status: 400 })
    }

    const membershipEntry = buildMembershipEntry(appliedPromotions, membershipDiscountAmount)
    const updatedAppliedPromotions = [] as Array<Record<string, any>>

    if (membershipEntry) {
      updatedAppliedPromotions.push(membershipEntry)
    }

    updatedAppliedPromotions.push({
      type: "PROMOTION",
      code: promotion.code,
      name: promotion.name,
      amount: promotionDiscount,
      discountType: promotion.discountType,
      rate: promotion.discountType === DiscountType.PERCENTAGE ? promotion.discountValue : undefined,
      stackWithMembership: promotion.stackWithMembership,
      stackWithPromotions: promotion.stackWithPromotions,
    })

    const totalDiscount = membershipDiscountAmount + promotionDiscount
    const newTotalPrice = Math.max(0, totalBeforeDiscounts - totalDiscount)

    const updatedBooking = await prisma.$transaction(async (tx) => {
      const bookingUpdate = await tx.booking.update({
        where: { id: booking.id },
        data: {
          promotionDiscount,
          discount: totalDiscount,
          totalPrice: newTotalPrice,
          appliedPromotions: updatedAppliedPromotions,
        },
        include: bookingInclude,
      })

      let shouldIncrementUsage = false

      const existingRedemption = await tx.promotionRedemption.findFirst({
        where: {
          promotionId: promotion.id,
          userId,
        },
      })

      if (existingRedemption) {
        await tx.promotionRedemption.update({
          where: { id: existingRedemption.id },
          data: {
            status: PromotionRedemptionStatus.USED,
            appliedBookingId: booking.id,
            metadata: {
              ...(existingRedemption.metadata as Record<string, unknown> | null ?? {}),
              lastAppliedAt: new Date().toISOString(),
            },
          },
        })

        if (
          existingRedemption.status !== PromotionRedemptionStatus.USED ||
          existingRedemption.appliedBookingId !== booking.id
        ) {
          shouldIncrementUsage = true
        }
      } else {
        await tx.promotionRedemption.create({
          data: {
            promotionId: promotion.id,
            userId,
            status: PromotionRedemptionStatus.USED,
            appliedBookingId: booking.id,
            metadata: {
              appliedAt: new Date().toISOString(),
            },
          },
        })
        shouldIncrementUsage = true
      }

      if (shouldIncrementUsage) {
        await tx.promotion.update({
          where: { id: promotion.id },
          data: {
            usedCount: {
              increment: 1,
            },
          },
        })
      }

      return bookingUpdate
    })

    return NextResponse.json(formatBookingResponse(updatedBooking, session.user.id))
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Dữ liệu không hợp lệ" }, { status: 400 })
    }

    console.error("Apply promotion error:", error)
    return NextResponse.json({ error: "Không thể áp dụng mã ưu đãi." }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Bạn cần đăng nhập để thao tác." }, { status: 401 })
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      select: {
        id: true,
        guestId: true,
        hostId: true,
        appliedPromotions: true,
        membershipDiscount: true,
        totalPrice: true,
        discount: true,
      },
    })

    if (!booking) {
      return NextResponse.json({ error: "Không tìm thấy đơn đặt phòng." }, { status: 404 })
    }

    if (!ensureBookingAccess(booking, session)) {
      return NextResponse.json({ error: "Bạn không có quyền cập nhật đơn này." }, { status: 403 })
    }

    const appliedPromotions = parsePromotionArray(booking.appliedPromotions)
    const promotionEntry = appliedPromotions.find((entry) => entry.type === "PROMOTION")

    if (!promotionEntry) {
      return NextResponse.json({ error: "Không có mã ưu đãi nào đang được áp dụng." }, { status: 400 })
    }

    const promotionCode = typeof promotionEntry.code === "string" ? promotionEntry.code : null
    const membershipDiscountAmount = booking.membershipDiscount ?? 0
    const membershipEntry = buildMembershipEntry(appliedPromotions, membershipDiscountAmount)

    const totalBeforeDiscounts = computeTotalBeforeDiscounts({
      totalPrice: booking.totalPrice,
      discount: booking.discount,
    })

    const totalDiscount = membershipDiscountAmount
    const newTotalPrice = Math.max(0, totalBeforeDiscounts - totalDiscount)

    const updatedAppliedPromotions = [] as Array<Record<string, any>>
    if (membershipEntry) {
      updatedAppliedPromotions.push(membershipEntry)
    }

    const updatedBooking = await prisma.$transaction(async (tx) => {
      const bookingUpdate = await tx.booking.update({
        where: { id: booking.id },
        data: {
          promotionDiscount: 0,
          discount: totalDiscount,
          totalPrice: newTotalPrice,
          appliedPromotions: updatedAppliedPromotions,
        },
        include: bookingInclude,
      })

      if (promotionCode) {
        const promotion = await tx.promotion.findUnique({ where: { code: promotionCode } })

        if (promotion) {
          const redemption = await tx.promotionRedemption.findFirst({
            where: {
              promotionId: promotion.id,
              userId: session.user.id,
              appliedBookingId: booking.id,
            },
          })

          if (redemption) {
            await tx.promotionRedemption.update({
              where: { id: redemption.id },
              data: {
                status: PromotionRedemptionStatus.ACTIVE,
                appliedBookingId: null,
                metadata: {
                  ...(redemption.metadata as Record<string, unknown> | null ?? {}),
                  removedAt: new Date().toISOString(),
                },
              },
            })
          }

          if (promotion.usedCount > 0) {
            await tx.promotion.update({
              where: { id: promotion.id },
              data: {
                usedCount: {
                  decrement: 1,
                },
              },
            })
          }
        }
      }

      return bookingUpdate
    })

    return NextResponse.json(formatBookingResponse(updatedBooking, session.user.id))
  } catch (error) {
    console.error("Remove promotion error:", error)
    return NextResponse.json({ error: "Không thể gỡ mã ưu đãi." }, { status: 500 })
  }
}
