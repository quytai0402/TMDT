import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const filterRaw = searchParams.get('filter') || 'all'
    const filter = filterRaw as 'all' | 'flagged' | 'spam' | 'support'
    const search = searchParams.get('search') || ''

    // Build where clause
    const where: Prisma.MessageWhereInput = {}
    
    if (search) {
      where.OR = [
        { content: { contains: search, mode: 'insensitive' } },
        { sender: { name: { contains: search, mode: 'insensitive' } } },
        { sender: { email: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const messages = await prisma.message.findMany({
      where,
      include: {
        sender: {
          select: { id: true, name: true, email: true, image: true }
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const totalMessages = await prisma.message.count()
    const flaggedCount = messages.filter(message => message.isAutomated).length
    const spamCount = messages.filter(message => message.messageType === 'SYSTEM').length
    const filteredMessages =
      filter === 'all'
        ? messages
        : messages.filter(message => {
            if (filter === 'flagged') {
              return message.isAutomated
            }
            if (filter === 'spam') {
              return message.messageType === 'SYSTEM'
            }
            if (filter === 'support') {
              return message.messageType === 'AUTOMATED'
            }
            return true
          })

    return NextResponse.json({
      messages: filteredMessages,
      stats: {
        total: totalMessages,
        flagged: flaggedCount,
        spam: spamCount,
        todayCount: messages.filter(m => {
          const today = new Date()
          const msgDate = new Date(m.createdAt)
          return msgDate.toDateString() === today.toDateString()
        }).length,
      }
    })
  } catch (error) {
    console.error('Error fetching admin messages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
