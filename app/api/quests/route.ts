import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ensureDefaultQuests } from '@/lib/quest-seed'

// GET /api/quests - Get all active quests for user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const type = searchParams.get('type')

    // Ensure core quests exist before fetching
    await ensureDefaultQuests()

    // Get all active quests
    const where: any = { isActive: true }
    if (category) where.category = category
    if (type) where.type = type

    const quests = await (prisma as any).quest.findMany({
      where,
      orderBy: [
        { isDaily: 'desc' },
        { isWeekly: 'desc' },
        { rewardPoints: 'desc' }
      ]
    })

    // Get user's quest progress
    const userQuests = await (prisma as any).userQuest.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        quest: true
      }
    })

    // Merge quest data with user progress
    const questsWithProgress = quests.map((quest: any) => {
      const userQuest = userQuests.find((uq: any) => uq.questId === quest.id)
      
      return {
        ...quest,
        currentCount: userQuest?.currentCount || 0,
        isCompleted: userQuest?.isCompleted || false,
        completedAt: userQuest?.completedAt || null,
        progress: userQuest ? Math.min(100, (userQuest.currentCount / quest.targetCount) * 100) : 0
      }
    })

    // Group by category
    const grouped = {
      daily: questsWithProgress.filter((q: any) => q.isDaily),
      weekly: questsWithProgress.filter((q: any) => q.isWeekly),
      oneTime: questsWithProgress.filter((q: any) => !q.isDaily && !q.isWeekly)
    }

    return NextResponse.json({
      quests: questsWithProgress,
      grouped,
      total: quests.length,
      completed: questsWithProgress.filter((q: any) => q.isCompleted).length
    })
  } catch (error) {
    console.error('Error fetching quests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quests' },
      { status: 500 }
    )
  }
}
