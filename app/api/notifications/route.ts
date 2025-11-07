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
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const skip = (page - 1) * limit

    const unreadCountWhere = { userId: session.user.id, isRead: false }

    // Lightweight path used by polling to only retrieve unread count
    if (unreadOnly && limit === 1 && skip === 0) {
      const cached = unreadCache.get(session.user.id)
      const now = Date.now()

      if (cached && now - cached.timestamp < CACHE_TTL) {
        return NextResponse.json({
          notifications: [],
          pagination: { page: 1, limit: 1, total: cached.count, totalPages: 1 },
          unreadCount: cached.count,
        })
      }

      const unreadCount = await prisma.notification.count({ where: unreadCountWhere })
      unreadCache.set(session.user.id, { count: unreadCount, timestamp: Date.now() })

      return NextResponse.json({
        notifications: [],
        pagination: { page: 1, limit: 1, total: unreadCount, totalPages: 1 },
        unreadCount,
      })
    }

    const where: Record<string, unknown> = { userId: session.user.id }
    if (unreadOnly) {
      where.isRead = false
    }

    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Database timeout')), 15000))

    const notificationsQuery = prisma.notification.findMany({
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
      },
    })

    const totalQuery = prisma.notification.count({ where })
    const unreadCountQuery = unreadOnly ? totalQuery : prisma.notification.count({ where: unreadCountWhere })

    const queryPromise = Promise.all([notificationsQuery, totalQuery, unreadCountQuery])

    const [notifications, total, unreadCount] = await Promise.race([queryPromise, timeout]).catch(async (error) => {
      console.warn('Notifications query exceeded timeout, retrying without race condition:', error)
      try {
        return await queryPromise
      } catch (fallbackError) {
        console.error('Database error in notifications after fallback:', fallbackError)
        return [[], 0, 0] as const
      }
    })

    return NextResponse.json({
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: total > 0 ? Math.ceil(total / limit) : 0,
      },
      unreadCount,
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({
      notifications: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      unreadCount: 0,
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

    let body: any = null
    try {
      body = await req.json()
    } catch {
      // Body can legitimately be empty for some requests
    }

    const { searchParams } = new URL(req.url)
    const markAllFromQuery = searchParams.get('markAllAsRead') === 'true'
    const idsFromQuery = searchParams.get('ids')

    const markAllAsRead = Boolean(body?.markAllAsRead) || markAllFromQuery
    const bodyIds: string[] = Array.isArray(body?.notificationIds) ? body.notificationIds : []
    const queryIds = typeof idsFromQuery === 'string'
      ? idsFromQuery
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean)
      : []
    const notificationIds = bodyIds.length ? bodyIds : queryIds

    if (markAllAsRead) {
      await prisma.notification.updateMany({
        where: { userId: session.user.id, isRead: false },
        data: { isRead: true },
      })
      unreadCache.delete(session.user.id)
      return NextResponse.json({ message: 'All notifications marked as read' })
    }

    if (notificationIds.length > 0) {
      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: session.user.id,
        },
        data: { isRead: true },
      })
      unreadCache.delete(session.user.id)
      return NextResponse.json({ message: 'Notifications marked as read' })
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (error) {
    console.error('Error updating notifications:', error)
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
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
      await prisma.notification.deleteMany({
        where: {
          userId: session.user.id,
          isRead: true,
        },
      })
      unreadCache.delete(session.user.id)
      return NextResponse.json({ message: 'All read notifications deleted' })
    }

    if (notificationId) {
      await prisma.notification.deleteMany({
        where: {
          id: notificationId,
          userId: session.user.id,
        },
      })
      unreadCache.delete(session.user.id)
      return NextResponse.json({ message: 'Notification deleted' })
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (error) {
    console.error('Error deleting notifications:', error)
    return NextResponse.json({ error: 'Failed to delete notifications' }, { status: 500 })
  }
}
