import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const awardPointsSchema = z.object({
  actionType: z.enum([
    "BOOKING_COMPLETED",
    "REVIEW_SUBMITTED",
    "REFERRAL_SIGNUP",
    "PROFILE_COMPLETED",
    "FIRST_BOOKING",
    "REPEAT_BOOKING",
    "EARLY_CHECKIN",
    "LATE_CHECKOUT",
    "IDENTITY_VERIFIED",
    "PAYMENT_METHOD_ADDED",
    "WISHLIST_CREATED",
    "SOCIAL_SHARE",
    "NEWSLETTER_SIGNUP",
    "PROPERTY_LISTING",
    "SUPERHOST_ACHIEVED",
    "DAILY_CHECK_IN",
    "QUEST_COMPLETION"
  ]),
  metadata: z.record(z.any()).optional(),
  bookingId: z.string().optional(),
  questId: z.string().optional(),
  multiplier: z.number().min(1).max(10).optional()
})

/**
 * POST /api/rewards/actions
 * Award points for a completed action
 * This is typically called by other backend services
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validation = awardPointsSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.errors },
        { status: 400 }
      )
    }

    const { actionType, metadata, bookingId, questId, multiplier } = validation.data

    // Get or bootstrap the reward action configuration
    let action = await (prisma as any).rewardAction.findFirst({
      where: { actionType }
    })

    if (!action) {
      if (actionType === "DAILY_CHECK_IN") {
        action = await (prisma as any).rewardAction.create({
          data: {
            actionType,
            name: "Daily Check-In",
            description: "Điểm thưởng cho check-in mỗi ngày",
            points: 10,
            isActive: true,
            category: "ENGAGEMENT",
          },
        })
      } else {
        return NextResponse.json(
          { error: `No reward configured for action: ${actionType}` },
          { status: 404 }
        )
      }
    }

    // Check if action is still active
    if (!action.isActive) {
      return NextResponse.json(
        { error: "This reward action is currently inactive" },
        { status: 400 }
      )
    }

    // Get user with tier info
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        loyaltyPoints: true,
        loyaltyTier: true,
        name: true,
        email: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Get tier multiplier
    const tier = await (prisma as any).rewardTier.findFirst({
      where: { tier: user.loyaltyTier }
    })

    const tierMultiplier = tier?.pointsMultiplier || 1.0
    const customMultiplier = multiplier || 1.0
    
    // Calculate points (base * tier multiplier * custom multiplier)
    const basePoints = action.points
    const totalPoints = Math.round(basePoints * tierMultiplier * customMultiplier)

    // Check if user already earned points for this specific action (prevent duplicates)
    if (bookingId) {
      const existingTransaction = await (prisma as any).rewardTransaction.findFirst({
        where: {
          userId: session.user.id,
          actionId: action.id,
          metadata: {
            path: ['bookingId'],
            equals: bookingId
          }
        }
      })

      if (existingTransaction) {
        return NextResponse.json(
          { 
            error: "Points already awarded for this action",
            existingTransaction 
          },
          { status: 409 }
        )
      }
    }

    // Create transaction
    const transaction = await (prisma as any).rewardTransaction.create({
      data: {
        userId: session.user.id,
        actionId: action.id,
        questId,
        points: totalPoints,
        type: "EARN",
        source: actionType,
        description: action.description,
        metadata: {
          ...metadata,
          bookingId,
          tierMultiplier,
          customMultiplier,
          basePoints
        }
      },
      include: {
        action: true
      }
    })

    // Award points to user
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        loyaltyPoints: {
          increment: totalPoints
        }
      },
      select: {
        loyaltyPoints: true,
        loyaltyTier: true
      }
    })

    // Check for tier upgrade
    const nextTier = await (prisma as any).rewardTier.findFirst({
      where: {
        minPoints: {
          lte: updatedUser.loyaltyPoints,
          gt: tier?.minPoints || 0
        }
      },
      orderBy: {
        minPoints: 'desc'
      }
    })

    let tierUpgraded = false
    if (nextTier && nextTier.tier !== updatedUser.loyaltyTier) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          loyaltyTier: nextTier.tier
        }
      })
      tierUpgraded = true

      // Create tier upgrade transaction
      await (prisma as any).rewardTransaction.create({
        data: {
          userId: session.user.id,
          points: 0,
          type: "EARN",
          source: "TIER_UPGRADE",
          description: `Upgraded to ${nextTier.name} tier!`,
          metadata: {
            previousTier: updatedUser.loyaltyTier,
            newTier: nextTier.tier
          }
        }
      })
    }

    // Check badge progress
    const badges = await (prisma as any).rewardBadge.findMany({
      where: {
        isActive: true,
        criteria: {
          path: ['actionType'],
          equals: actionType
        }
      }
    })

    const badgesEarned = []
    for (const badge of badges) {
      // Check if user already has this badge
      const existingBadge = await (prisma as any).userBadge.findFirst({
        where: {
          userId: session.user.id,
          badgeId: badge.id
        }
      })

      if (!existingBadge) {
        // Count how many times user has done this action
        const actionCount = await (prisma as any).rewardTransaction.count({
          where: {
            userId: session.user.id,
            actionId: action.id
          }
        })

        // Check if criteria is met (simplified - you may want more complex logic)
        const requiredCount = badge.criteria?.requiredCount || 1
        if (actionCount >= requiredCount) {
          // Award badge
          await (prisma as any).userBadge.create({
            data: {
              userId: session.user.id,
              badgeId: badge.id,
              earnedAt: new Date(),
              progress: 100
            }
          })

          // Create badge earned transaction
          await (prisma as any).rewardTransaction.create({
            data: {
              userId: session.user.id,
              badgeId: badge.id,
              points: badge.bonusPoints || 0,
              type: "EARN",
              source: "BADGE_EARNED",
              description: `Earned badge: ${badge.name}!`,
              metadata: {
                badgeId: badge.id,
                badgeName: badge.name
              }
            }
          })

          // Award bonus points if applicable
          if (badge.bonusPoints > 0) {
            await prisma.user.update({
              where: { id: session.user.id },
              data: {
                loyaltyPoints: {
                  increment: badge.bonusPoints
                }
              }
            })
          }

          badgesEarned.push(badge)
        }
      }
    }

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        points: totalPoints,
        action: action.name,
        description: action.description,
        createdAt: transaction.createdAt
      },
      user: {
        newBalance: updatedUser.loyaltyPoints + (badgesEarned.reduce((sum, b) => sum + (b.bonusPoints || 0), 0)),
        currentTier: tierUpgraded ? nextTier.tier : updatedUser.loyaltyTier,
        tierUpgraded
      },
      badgesEarned: badgesEarned.map(b => ({
        id: b.id,
        name: b.name,
        icon: b.icon,
        bonusPoints: b.bonusPoints
      }))
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
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const actions = await (prisma as any).rewardAction.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        points: 'desc'
      }
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
