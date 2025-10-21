import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/quests/[id]/progress - Update quest progress
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: questId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { increment = 1 } = body

    // Get quest
    const quest = await (prisma as any).quest.findUnique({
      where: { id: questId }
    })

    if (!quest) {
      return NextResponse.json(
        { error: 'Quest not found' },
        { status: 404 }
      )
    }

    if (!quest.isActive) {
      return NextResponse.json(
        { error: 'Quest is not active' },
        { status: 400 }
      )
    }

    // Get or create user quest
    let userQuest = await (prisma as any).userQuest.findUnique({
      where: {
        userId_questId: {
          userId: session.user.id,
          questId
        }
      }
    })

    if (!userQuest) {
      userQuest = await (prisma as any).userQuest.create({
        data: {
          userId: session.user.id,
          questId,
          currentCount: 0,
          isCompleted: false
        }
      })
    }

    // Check if already completed
    if (userQuest.isCompleted) {
      return NextResponse.json({
        message: 'Quest already completed',
        userQuest
      })
    }

    // Check daily/weekly reset
    const now = new Date()
    const lastReset = userQuest.lastResetAt
    const hoursSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60)

    let shouldReset = false
    if (quest.isDaily && hoursSinceReset >= 24) {
      shouldReset = true
    } else if (quest.isWeekly && hoursSinceReset >= 168) { // 7 days
      shouldReset = true
    }

    // Update progress
    const newCount = shouldReset ? increment : userQuest.currentCount + increment
    const isNowCompleted = newCount >= quest.targetCount

    userQuest = await (prisma as any).userQuest.update({
      where: { id: userQuest.id },
      data: {
        currentCount: newCount,
        isCompleted: isNowCompleted,
        completedAt: isNowCompleted ? now : userQuest.completedAt,
        lastResetAt: shouldReset ? now : userQuest.lastResetAt
      },
      include: {
        quest: true
      }
    })

    // Award points if completed
    let rewardTransaction = null
    if (isNowCompleted && !shouldReset) {
      // Award points via rewards system
      const rewardResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/rewards/actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': req.headers.get('cookie') || ''
        },
        body: JSON.stringify({
          actionType: 'QUEST_COMPLETED',
          metadata: {
            questId,
            questTitle: quest.title,
            questPoints: quest.rewardPoints
          }
        })
      })

      if (rewardResponse.ok) {
        const rewardData = await rewardResponse.json()
        rewardTransaction = rewardData.transaction
      }

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
              questId,
              questTitle: quest.title
            }
          }
        })
      }
    }

    return NextResponse.json({
      message: isNowCompleted ? 'Quest completed!' : 'Progress updated',
      userQuest,
      rewardTransaction,
      progress: Math.min(100, (newCount / quest.targetCount) * 100)
    })
  } catch (error) {
    console.error('Error updating quest progress:', error)
    return NextResponse.json(
      { error: 'Failed to update quest progress' },
      { status: 500 }
    )
  }
}

// GET /api/quests/[id]/progress - Get quest progress for user
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: questId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userQuest = await (prisma as any).userQuest.findUnique({
      where: {
        userId_questId: {
          userId: session.user.id,
          questId
        }
      },
      include: {
        quest: true
      }
    })

    if (!userQuest) {
      return NextResponse.json({
        currentCount: 0,
        isCompleted: false,
        progress: 0
      })
    }

    return NextResponse.json({
      ...userQuest,
      progress: Math.min(100, (userQuest.currentCount / userQuest.quest.targetCount) * 100)
    })
  } catch (error) {
    console.error('Error fetching quest progress:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quest progress' },
      { status: 500 }
    )
  }
}
