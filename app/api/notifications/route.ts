import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Simple in-memory cache for unread count (5 seconds TTL)
const unreadCache = new Map<string, { count: number; timestamp: number }>()
const CACHE_TTL = 5000 // 5 seconds

// GET /api/notifications - Get user notifications
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // If only requesting unread count, use cache
    if (unreadOnly && limit === 1 && skip === 0) {
      const cached = unreadCache.get(session.user.id)
      const now = Date.now()
      
      if (cached && now - cached.timestamp < CACHE_TTL) {
        return NextResponse.json({
          notifications: [],
          pagination: { page: 1, limit: 1, total: cached.count },
          unreadCount: cached.count,
        })
      }
    }

    const where: any = {
      userId: session.user.id
    }

    if (unreadOnly) {
      where.isRead = false
    }

    // Optimize: Only fetch what's needed
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database timeout')), 15000)
    )

    const queryPromise = Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          type: true,
          title: true,
          message: true,
          link: true,
          isRead: true,
          createdAt: true,
        }
      }),
      // Only count if not cached
      unreadOnly && limit === 1 ? 
        prisma.notification.count({ where }) : 
        Promise.resolve(0),
    ])

    const [notifications, count] = await Promise.race([queryPromise, timeout]).catch(async (error) => {
      console.warn('Notifications query exceeded timeout, retrying without race condition:', error)
      try {
        return await queryPromise
      } catch (fallbackError) {
        console.error('Database error in notifications after fallback:', fallbackError)
        return [[], 0] as const
      }
    })

    // Cache unread count
    if (unreadOnly && limit === 1) {
      unreadCache.set(session.user.id, {
        count: count,
        timestamp: Date.now()
      })
    }

    return NextResponse.json({
      notifications,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      },
      unreadCount: unreadOnly ? count : 0
    })

  } catch (error) {
    console.error('Error fetching notifications:', error)
    // Return empty data instead of error for better UX
    return NextResponse.json({
      notifications: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
      },
      unreadCount: 0
    })
  }
}

// PUT /api/notifications - Mark notifications as read
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { notificationIds, markAllAsRead } = body

    if (markAllAsRead) {
      // Mark all as read
      await prisma.notification.updateMany({
        where: {
          userId: session.user.id,
          isRead: false
        },
        data: { isRead: true }
      })

      return NextResponse.json({
        message: 'All notifications marked as read'
      })
    }

    if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: session.user.id
        },
        data: { isRead: true }
      })

      return NextResponse.json({
        message: 'Notifications marked as read'
      })
    }

    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error updating notifications:', error)
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    )
  }
}

// DELETE /api/notifications - Delete notifications
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const notificationId = searchParams.get('id')
    const deleteAll = searchParams.get('deleteAll') === 'true'

    if (deleteAll) {
      // Delete all read notifications
      await prisma.notification.deleteMany({
        where: {
          userId: session.user.id,
          isRead: true
        }
      })

      return NextResponse.json({
        message: 'All read notifications deleted'
      })
    }

    if (notificationId) {
      // Delete specific notification
      await prisma.notification.deleteMany({
        where: {
          id: notificationId,
          userId: session.user.id
        }
      })

      return NextResponse.json({
        message: 'Notification deleted'
      })
    }

    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error deleting notifications:', error)
    return NextResponse.json(
      { error: 'Failed to delete notifications' },
      { status: 500 }
    )
  }
}
