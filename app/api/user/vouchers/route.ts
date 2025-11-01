import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import {
  PromotionSource,
  PromotionRedemptionStatus,
  RewardRedemptionStatus,
  RewardSource,
  RewardTransactionType,
} from "@prisma/client"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const redeemSchema = z.object({
  catalogItemId: z.string().trim().min(1),
})

const ensureUserSession = async () => {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return null
  }
  return session
}

const serializeRedemption = (redemption: any) => ({
  id: redemption.id,
  promotionId: redemption.promotionId,
  code: redemption.promotion.code,
  name: redemption.promotion.name,
  description: redemption.promotion.description,
  discountType: redemption.promotion.discountType,
  discountValue: redemption.promotion.discountValue,
  maxDiscount: redemption.promotion.maxDiscount,
  minBookingValue: redemption.promotion.minBookingValue,
  source: redemption.promotion.source,
  pointCost: redemption.pointsSpent ?? redemption.promotion.pointCost ?? 0,
  status: redemption.status,
  redeemedAt: redemption.redeemedAt,
  expiresAt: redemption.expiresAt,
  stackWithMembership: redemption.promotion.stackWithMembership,
  stackWithPromotions: redemption.promotion.stackWithPromotions,
  listingIds: redemption.promotion.listingIds ?? [],
  propertyTypes: redemption.promotion.propertyTypes ?? [],
  allowedMembershipTiers: redemption.promotion.allowedMembershipTiers ?? [],
  metadata: redemption.metadata ?? null,
  appliedBookingId: redemption.appliedBookingId ?? null,
})

export async function GET(request: NextRequest) {
  try {
    const session = await ensureUserSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const statusParam = request.nextUrl.searchParams.get("status")
    const statusFilter = statusParam
      ? (statusParam.split(",") as PromotionRedemptionStatus[])
      : [PromotionRedemptionStatus.ACTIVE]

    const redemptions = await prisma.promotionRedemption.findMany({
      where: {
        userId: session.user.id,
        status: { in: statusFilter },
      },
      include: {
        promotion: true,
      },
      orderBy: { redeemedAt: "desc" },
      take: 100,
    })

    return NextResponse.json({
      vouchers: redemptions.map(serializeRedemption),
    })
  } catch (error) {
    console.error("User vouchers GET error:", error)
    return NextResponse.json({ error: "Không thể tải danh sách voucher" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await ensureUserSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await request.json()
    const parsed = redeemSchema.safeParse(payload)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 })
    }

    const { catalogItemId } = parsed.data

    const [user, catalogItem] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          loyaltyPoints: true,
        },
      }),
      prisma.rewardCatalogItem.findUnique({
        where: { id: catalogItemId },
        include: {
          promotion: true,
        },
      }),
    ])

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (!catalogItem || !catalogItem.promotion) {
      return NextResponse.json({ error: "Voucher không khả dụng để đổi điểm" }, { status: 404 })
    }

    const promotion = catalogItem.promotion

    if (promotion.source !== PromotionSource.LOYALTY_EXCHANGE && (promotion.pointCost ?? 0) <= 0) {
      return NextResponse.json({ error: "Voucher này không hỗ trợ đổi điểm." }, { status: 400 })
    }

    const now = new Date()
    if (promotion.validFrom > now || promotion.validUntil < now || !promotion.isActive) {
      return NextResponse.json({ error: "Voucher đã hết hạn hoặc không còn hiệu lực." }, { status: 400 })
    }

    if (!catalogItem.isActive) {
      return NextResponse.json({ error: "Voucher hiện tạm khóa trong catalog." }, { status: 400 })
    }

    if (
      typeof catalogItem.quantityAvailable === "number" &&
      catalogItem.quantityAvailable !== null &&
      catalogItem.quantityAvailable <= 0
    ) {
      return NextResponse.json({ error: "Voucher đã được đổi hết." }, { status: 400 })
    }

    const cost = catalogItem.pointsCost
    if (user.loyaltyPoints < cost) {
      return NextResponse.json(
        {
          error: "Bạn không đủ điểm để đổi voucher này.",
          required: cost,
          available: user.loyaltyPoints,
        },
        { status: 400 },
      )
    }

    const redemptionResult = await prisma.$transaction(async (tx) => {
      const [globalRedemptions, userRedemptionsForPromotion, userRedemptionsForCatalog] = await Promise.all([
        tx.promotionRedemption.count({
          where: { promotionId: promotion.id },
        }),
        tx.promotionRedemption.count({
          where: {
            promotionId: promotion.id,
            userId: user.id,
          },
        }),
        tx.rewardRedemption.count({
          where: {
            userId: user.id,
            rewardId: catalogItem.id,
            status: { in: [RewardRedemptionStatus.PENDING, RewardRedemptionStatus.APPROVED, RewardRedemptionStatus.FULFILLED] },
          },
        }),
      ])

      if (typeof promotion.maxUses === "number" && promotion.maxUses !== null && globalRedemptions >= promotion.maxUses) {
        throw new Error("Voucher đã đạt số lượt đổi tối đa.")
      }

      if (
        typeof promotion.maxUsesPerUser === "number" &&
        promotion.maxUsesPerUser !== null &&
        userRedemptionsForPromotion >= promotion.maxUsesPerUser
      ) {
        throw new Error("Bạn đã đổi voucher này tối đa số lần cho phép.")
      }

      if (
        typeof catalogItem.maxPerUser === "number" &&
        catalogItem.maxPerUser !== null &&
        userRedemptionsForCatalog >= catalogItem.maxPerUser
      ) {
        throw new Error("Bạn đã đổi số lượng voucher này tối đa cho phép.")
      }

      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          loyaltyPoints: { decrement: cost },
        },
        select: {
          loyaltyPoints: true,
        },
      })

      if (typeof catalogItem.quantityAvailable === "number" && catalogItem.quantityAvailable !== null) {
        await tx.rewardCatalogItem.update({
          where: { id: catalogItem.id },
          data: {
            quantityAvailable: { decrement: 1 },
            isActive: catalogItem.quantityAvailable - 1 > 0,
          },
        })
      }

      await tx.promotion.update({
        where: { id: promotion.id },
        data: {
          usedCount: promotion.usedCount + 1,
        },
      })

      const rewardRedemption = await tx.rewardRedemption.create({
        data: {
          userId: user.id,
          rewardId: catalogItem.id,
          status: RewardRedemptionStatus.FULFILLED,
          pointsSpent: cost,
          metadata: {
            promotionId: promotion.id,
          },
        },
      })

      const promotionRedemption = await tx.promotionRedemption.create({
        data: {
          promotionId: promotion.id,
          userId: user.id,
          status: PromotionRedemptionStatus.ACTIVE,
          pointsSpent: cost,
          expiresAt: promotion.validUntil,
          metadata: {
            catalogItemId: catalogItem.id,
            rewardRedemptionId: rewardRedemption.id,
          },
        },
        include: {
          promotion: true,
        },
      })

      await tx.rewardTransaction.create({
        data: {
          userId: user.id,
          transactionType: RewardTransactionType.DEBIT,
          source: RewardSource.REDEMPTION,
          points: -cost,
          balanceAfter: updatedUser.loyaltyPoints,
          description: `Đổi voucher ${promotion.code}`,
          referenceId: promotionRedemption.id,
          metadata: {
            promotionId: promotion.id,
            catalogItemId: catalogItem.id,
          },
        },
      })

      return {
        redemption: promotionRedemption,
        balance: updatedUser.loyaltyPoints,
      }
    })

    return NextResponse.json({
      voucher: serializeRedemption(redemptionResult.redemption),
      balance: redemptionResult.balance,
    })
  } catch (error: any) {
    if (error instanceof Error && error.message.startsWith("Voucher")) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    if (error instanceof Error && error.message.startsWith("Bạn đã")) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    if (error instanceof Error && error.message.includes("đổi")) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error("User vouchers POST error:", error)
    return NextResponse.json({ error: "Không thể đổi voucher" }, { status: 500 })
  }
}
