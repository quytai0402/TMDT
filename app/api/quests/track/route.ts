import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    // Find matching active quests
    const quests = await (prisma as any).quest.findMany({
      where: {
        type: {
          in: questTypes
        },
        isActive: true
      }
    })

    const results = []

    for (const quest of quests) {
      // Get or create user quest
      let userQuest = await (prisma as any).userQuest.findUnique({
        where: {
          userId_questId: {
            userId: session.user.id,
            questId: quest.id
          }
        }
      })

      if (!userQuest) {
        userQuest = await (prisma as any).userQuest.create({
          data: {
            userId: session.user.id,
            questId: quest.id,
            currentCount: 0,
            isCompleted: false
          }
        })
      }

      // Skip if already completed (for one-time quests)
      if (userQuest.isCompleted && !quest.isDaily && !quest.isWeekly) {
        continue
      }

      // Check daily/weekly reset
      const now = new Date()
      const lastReset = userQuest.lastResetAt ?? userQuest.updatedAt ?? userQuest.createdAt ?? new Date()
      const hoursSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60)

      let shouldReset = false
      if (quest.isDaily && hoursSinceReset >= 24) {
        shouldReset = true
      } else if (quest.isWeekly && hoursSinceReset >= 168) {
        shouldReset = true
      }

      // Skip if daily/weekly and already completed today/this week
      if ((quest.isDaily || quest.isWeekly) && userQuest.isCompleted && !shouldReset) {
        continue
      }

      // Update progress
      const newCount = shouldReset ? 1 : userQuest.currentCount + 1
      const isNowCompleted = newCount >= quest.targetCount

      userQuest = await (prisma as any).userQuest.update({
        where: { id: userQuest.id },
        data: {
          currentCount: newCount,
          isCompleted: isNowCompleted,
          completedAt: isNowCompleted ? now : (shouldReset ? null : userQuest.completedAt),
          lastResetAt: shouldReset ? now : userQuest.lastResetAt ?? lastReset
        },
        include: {
          quest: true
        }
      })

      // Award points if just completed
      if (isNowCompleted && (shouldReset || !userQuest.completedAt)) {
        // Create reward transaction
        await (prisma as any).rewardTransaction.create({
          data: {
            userId: session.user.id,
            questId: quest.id,
            transactionType: 'EARN',
            source: 'QUEST',
            points: quest.rewardPoints,
            balanceAfter: 0, // Will be updated
            description: `Hoàn thành nhiệm vụ: ${quest.title}`,
            metadata: {
              ...metadata,
              questId: quest.id,
              questTitle: quest.title,
              trigger
            }
          }
        })

        // Update user points
        await prisma.user.update({
          where: { id: session.user.id },
          data: {
            loyaltyPoints: {
              increment: quest.rewardPoints
            }
          }
        })

        // Award badge if specified
        if (quest.rewardBadgeId) {
          await (prisma as any).userBadge.upsert({
            where: {
              userId_badgeId: {
                userId: session.user.id,
                badgeId: quest.rewardBadgeId
              }
            },
            update: {},
            create: {
              userId: session.user.id,
              badgeId: quest.rewardBadgeId,
              source: 'QUEST',
              metadata: {
                questId: quest.id,
                questTitle: quest.title,
                trigger
              }
            }
          })
        }
      }

      results.push({
        questId: quest.id,
        questTitle: quest.title,
        currentCount: newCount,
        targetCount: quest.targetCount,
        isCompleted: isNowCompleted,
        progress: Math.min(100, (newCount / quest.targetCount) * 100),
        pointsEarned: isNowCompleted ? quest.rewardPoints : 0
      })
    }

    return NextResponse.json({
      message: 'Quest progress tracked',
      updated: results,
      completedCount: results.filter(r => r.isCompleted).length
    })
  } catch (error) {
    console.error('Error tracking quest progress:', error)
    return NextResponse.json(
      { error: 'Failed to track quest progress' },
      { status: 500 }
    )
  }
}
