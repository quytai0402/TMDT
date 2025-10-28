import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { RewardSource, RewardTransactionType } from '@prisma/client'

// POST /api/quests/track - Track quest progress based on trigger
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { trigger, metadata = {} } = body

    if (!trigger) {
      return NextResponse.json(
        { error: 'Trigger is required' },
        { status: 400 }
      )
    }

    // Map trigger to quest types (using actual enum values from Prisma schema)
    const questTypeMap: Record<string, string[]> = {
      'BOOKING_CREATED': ['BOOKING'],
      'BOOKING_COMPLETED': ['BOOKING'],
      'REVIEW_CREATED': ['REVIEW'],
      'WISHLIST_ADDED': ['EXPLORATION'],
      'PROFILE_COMPLETED': ['PROFILE_COMPLETION'],
      'PROFILE_UPDATED': ['PROFILE_COMPLETION'],
      'EMAIL_VERIFIED': ['PROFILE_COMPLETION'],
      'PHONE_VERIFIED': ['PROFILE_COMPLETION'],
      'PAYMENT_METHOD_ADDED': ['PROFILE_COMPLETION'],
      'COLLECTION_CREATED': ['SOCIAL'],
      'LISTING_VIEWED': ['EXPLORATION'],
      'LISTING_SHARED': ['SOCIAL'],
      'POST_CREATED': ['SOCIAL'],
      'DAILY_CHECK_IN': ['DAILY_CHECK_IN'],
      'REFERRAL_COMPLETED': ['REFERRAL'],
      'STREAK_MILESTONE': ['STREAK']
    }

    const questTypes = questTypeMap[trigger] || []

    if (questTypes.length === 0) {
      return NextResponse.json({
        message: 'No quests for this trigger',
        updated: []
      })
    }

    const quests = await prisma.quest.findMany({
      where: {
        type: { in: questTypes },
        isActive: true,
      },
    })

    const results: Array<{
      questId: string
      questTitle: string
      currentCount: number
      targetCount: number
      isCompleted: boolean
      progress: number
      pointsEarned: number
    }> = []

    for (const quest of quests) {
      let userQuest = await prisma.userQuest.findUnique({
        where: {
          userId_questId: {
            userId: session.user.id,
            questId: quest.id,
          },
        },
      })

      if (!userQuest) {
        userQuest = await prisma.userQuest.create({
          data: {
            userId: session.user.id,
            questId: quest.id,
            currentCount: 0,
            isCompleted: false,
            lastResetAt: new Date(),
          },
        })
      }

      const now = new Date()
      const isRepeating = quest.isDaily || quest.isWeekly
      const lastResetReference = userQuest.lastResetAt ?? userQuest.updatedAt ?? userQuest.createdAt ?? now
      const hoursSinceReset = (now.getTime() - lastResetReference.getTime()) / (1000 * 60 * 60)
      const shouldReset = quest.isDaily ? hoursSinceReset >= 24 : quest.isWeekly ? hoursSinceReset >= 168 : false

      if (!shouldReset && userQuest.isCompleted) {
        if (!isRepeating) {
          results.push({
            questId: quest.id,
            questTitle: quest.title,
            currentCount: userQuest.currentCount,
            targetCount: quest.targetCount,
            isCompleted: true,
            progress: 100,
            pointsEarned: 0,
          })
          continue
        }

        if (isRepeating) {
          results.push({
            questId: quest.id,
            questTitle: quest.title,
            currentCount: userQuest.currentCount,
            targetCount: quest.targetCount,
            isCompleted: true,
            progress: 100,
            pointsEarned: 0,
          })
          continue
        }
      }

      const baseCount = shouldReset ? 0 : userQuest.currentCount
      const newCount = baseCount + 1
      const justCompleted = newCount >= quest.targetCount && (!userQuest.isCompleted || shouldReset)
      const isCompleted = justCompleted || (!shouldReset && userQuest.isCompleted)
      const updatedLastResetAt = shouldReset ? now : userQuest.lastResetAt ?? now
      const completedAt = justCompleted ? now : shouldReset ? null : isCompleted ? userQuest.completedAt : null

      userQuest = await prisma.userQuest.update({
        where: { id: userQuest.id },
        data: {
          currentCount: newCount,
          isCompleted,
          completedAt,
          lastResetAt: updatedLastResetAt,
        },
        include: {
          quest: true,
        },
      })

      let pointsEarned = 0

      if (justCompleted) {
        const updatedUser = await prisma.user.update({
          where: { id: session.user.id },
          data: {
            loyaltyPoints: {
              increment: quest.rewardPoints,
            },
          },
          select: {
            loyaltyPoints: true,
          },
        })

        await prisma.rewardTransaction.create({
          data: {
            userId: session.user.id,
            questId: quest.id,
            transactionType: RewardTransactionType.CREDIT,
            source: RewardSource.QUEST,
            points: quest.rewardPoints,
            balanceAfter: updatedUser.loyaltyPoints,
            description: `Hoàn thành nhiệm vụ: ${quest.title}`,
            metadata: {
              ...metadata,
              questId: quest.id,
              questTitle: quest.title,
              trigger,
            },
          },
        })

        if (quest.rewardBadgeId) {
          await prisma.userBadge.upsert({
            where: {
              userId_badgeId: {
                userId: session.user.id,
                badgeId: quest.rewardBadgeId,
              },
            },
            update: {},
            create: {
              userId: session.user.id,
              badgeId: quest.rewardBadgeId,
              source: 'QUEST',
              metadata: {
                ...metadata,
                questId: quest.id,
                questTitle: quest.title,
                trigger,
              },
            },
          })
        }

        pointsEarned = quest.rewardPoints
      }

      results.push({
        questId: quest.id,
        questTitle: quest.title,
        currentCount: newCount,
        targetCount: quest.targetCount,
        isCompleted,
        progress: Math.min(100, (newCount / quest.targetCount) * 100),
        pointsEarned,
      })
    }

    return NextResponse.json({
      message: 'Quest progress tracked',
      updated: results,
      completedCount: results.filter((r) => r.pointsEarned > 0).length,
    })
  } catch (error) {
    console.error('Error tracking quest progress:', error)
    return NextResponse.json(
      { error: 'Failed to track quest progress' },
      { status: 500 }
    )
  }
}
