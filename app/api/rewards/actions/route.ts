import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import {
  RewardActionType,
  RewardSource,
  RewardTransactionType,
} from "@prisma/client"

type ActionConfig = {
  title: string
  description?: string
  points: number
  source: RewardSource
  cooldownHours?: number | null
  maxTimesPerWeek?: number | null
  isRecurring?: boolean
}

const ACTION_CONFIG: Record<RewardActionType, ActionConfig> = {
  [RewardActionType.BOOKING_COMPLETED]: {
    title: "Hoàn tất booking",
    description: "Điểm thưởng cho mỗi lần hoàn tất đặt phòng.",
    points: 250,
    source: RewardSource.BOOKING,
    isRecurring: true,
  },
  [RewardActionType.REVIEW_SUBMITTED]: {
    title: "Viết đánh giá",
    description: "Cảm ơn bạn đã chia sẻ trải nghiệm của mình.",
    points: 80,
    source: RewardSource.REVIEW,
    isRecurring: true,
  },
  [RewardActionType.PROFILE_COMPLETED]: {
    title: "Hoàn tất hồ sơ",
    description: "Hoàn thiện hồ sơ cá nhân để nhận ưu đãi.",
    points: 120,
    source: RewardSource.PROMOTION,
    isRecurring: false,
  },
  [RewardActionType.REFERRAL_COMPLETED]: {
    title: "Giới thiệu bạn bè",
    description: "Bạn được thưởng khi lời mời quy đổi thành booking.",
    points: 400,
    source: RewardSource.REFERRAL,
    isRecurring: true,
  },
  [RewardActionType.QUEST_COMPLETED]: {
    title: "Hoàn thành nhiệm vụ",
    description: "Điểm thưởng cho các nhiệm vụ gamification.",
    points: 60,
    source: RewardSource.QUEST,
    isRecurring: true,
  },
  [RewardActionType.DAILY_CHECK_IN]: {
    title: "Daily check-in",
    description: "Ghé LuxeStay mỗi ngày để giữ streak và tích điểm.",
    points: 40,
    source: RewardSource.DAILY,
    cooldownHours: 24,
    maxTimesPerWeek: 7,
    isRecurring: true,
  },
  [RewardActionType.ANNIVERSARY]: {
    title: "Kỷ niệm thành viên",
    description: "Món quà nhỏ nhân dịp kỷ niệm với LuxeStay.",
    points: 500,
    source: RewardSource.PROMOTION,
    isRecurring: true,
  },
  [RewardActionType.PROMOTION]: {
    title: "Khuyến mãi đặc biệt",
    description: "Điểm thưởng từ chương trình khuyến mãi.",
    points: 100,
    source: RewardSource.PROMOTION,
    isRecurring: true,
  },
  [RewardActionType.MANUAL_ADJUSTMENT]: {
    title: "Điều chỉnh thủ công",
    description: "Điều chỉnh điểm bởi đội ngũ chăm sóc khách hàng.",
    points: 0,
    source: RewardSource.MANUAL,
    isRecurring: true,
  },
}

const awardPointsSchema = z.object({
  actionType: z.nativeEnum(RewardActionType),
  metadata: z.record(z.any()).optional(),
  bookingId: z.string().optional(),
  questId: z.string().optional(),
  multiplier: z.number().min(0.1).max(10).optional(),
})

function buildSlug(actionType: RewardActionType) {
  return `reward-${actionType.toLowerCase().replace(/_/g, "-")}`
}

function buildResponseTransaction(transaction: {
  id: string
  points: number
  description: string | null
  createdAt: Date
  action: { title: string }
}) {
  return {
    id: transaction.id,
    points: transaction.points,
    action: transaction.action?.title ?? "Reward",
    description: transaction.description,
    createdAt: transaction.createdAt,
  }
}

async function resolveUser(sessionUser: { id?: string; email?: string | null }) {
  if (!sessionUser?.id && !sessionUser?.email) {
    return null
  }

  const whereClauses = []
  if (sessionUser.id) {
    whereClauses.push({ id: sessionUser.id })
  }
  if (sessionUser.email) {
    whereClauses.push({ email: sessionUser.email })
  }

  return prisma.user.findFirst({
    where: { OR: whereClauses },
    select: {
      id: true,
      loyaltyPoints: true,
      loyaltyTier: true,
    },
  })
}

/**
 * POST /api/rewards/actions
 * Award points for a completed action
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validation = awardPointsSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { actionType, metadata, bookingId, questId, multiplier } = validation.data
    const config = ACTION_CONFIG[actionType]

    if (!config) {
      return NextResponse.json(
        { error: `No reward configuration for action: ${actionType}` },
        { status: 404 }
      )
    }

    const user = await resolveUser({
      id: session.user.id,
      email: session.user.email,
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const slug = buildSlug(actionType)
    const action = await prisma.rewardAction.upsert({
      where: { slug },
      update: {
        title: config.title,
        description: config.description,
        points: config.points,
        isActive: true,
        cooldownHours: config.cooldownHours ?? null,
        maxTimesPerWeek: config.maxTimesPerWeek ?? null,
        isRecurring: config.isRecurring ?? true,
      },
      create: {
        slug,
        title: config.title,
        description: config.description,
        type: actionType,
        source: config.source,
        points: config.points,
        cooldownHours: config.cooldownHours ?? null,
        maxTimesPerWeek: config.maxTimesPerWeek ?? null,
        isRecurring: config.isRecurring ?? true,
        isActive: true,
        metadata,
      },
    })

    if (!action.isActive) {
      return NextResponse.json(
        { error: "This reward action is currently inactive" },
        { status: 400 }
      )
    }

    if (bookingId) {
      const duplicate = await prisma.rewardTransaction.findFirst({
        where: {
          userId: user.id,
          actionId: action.id,
          referenceId: bookingId,
        },
      })

      if (duplicate) {
        return NextResponse.json(
          {
            error: "Points already awarded for this booking",
            transactionId: duplicate.id,
          },
          { status: 409 }
        )
      }
    }

    const tier = await prisma.rewardTier.findFirst({
      where: { tier: user.loyaltyTier },
      select: {
        tier: true,
        bonusMultiplier: true,
      },
    })

    const tierMultiplier = tier?.bonusMultiplier ?? 1
    const customMultiplier = multiplier ?? 1
    const basePoints = config.points
    const totalPoints = Math.max(
      0,
      Math.round(basePoints * tierMultiplier * customMultiplier)
    )

    const userAfterIncrement = await prisma.user.update({
      where: { id: user.id },
      data: {
        loyaltyPoints: {
          increment: totalPoints,
        },
      },
      select: {
        id: true,
        loyaltyPoints: true,
        loyaltyTier: true,
      },
    })

    const transaction = await prisma.rewardTransaction.create({
      data: {
        userId: user.id,
        actionId: action.id,
        questId,
        referenceId: bookingId ?? undefined,
        transactionType: RewardTransactionType.CREDIT,
        source: config.source,
        points: totalPoints,
        balanceAfter: userAfterIncrement.loyaltyPoints,
        description: config.description ?? config.title,
        metadata: {
          ...metadata,
          bookingId,
          basePoints,
          tierMultiplier,
          customMultiplier,
          actionSlug: action.slug,
        },
      },
      include: {
        action: {
          select: {
            title: true,
          },
        },
      },
    })

    const tiers = await prisma.rewardTier.findMany({
      orderBy: { minPoints: "asc" },
      select: {
        tier: true,
        minPoints: true,
      },
    })

    let tierUpgraded = false
    let currentTier = userAfterIncrement.loyaltyTier
    if (tiers.length > 0) {
      const eligibleTier = [...tiers]
        .reverse()
        .find((t) => userAfterIncrement.loyaltyPoints >= t.minPoints)

      if (eligibleTier && eligibleTier.tier !== userAfterIncrement.loyaltyTier) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            loyaltyTier: eligibleTier.tier,
          },
        })
        currentTier = eligibleTier.tier
        tierUpgraded = true
      }
    }

    return NextResponse.json({
      success: true,
      transaction: buildResponseTransaction(transaction),
      user: {
        id: user.id,
        newBalance: userAfterIncrement.loyaltyPoints,
        loyaltyTier: currentTier,
        tierUpgraded,
      },
    })
  } catch (error) {
    console.error("Error awarding points:", error)
    return NextResponse.json(
      { error: "Failed to award points" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/rewards/actions
 * List all available reward actions
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const actions = await prisma.rewardAction.findMany({
      where: { isActive: true },
      orderBy: { points: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        points: true,
        source: true,
        type: true,
        cooldownHours: true,
        maxTimesPerWeek: true,
        isRecurring: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ actions })
  } catch (error) {
    console.error("Error fetching reward actions:", error)
    return NextResponse.json(
      { error: "Failed to fetch reward actions" },
      { status: 500 }
    )
  }
}
