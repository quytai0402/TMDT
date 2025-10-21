import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const filter = searchParams.get('filter') || 'all'
    const search = searchParams.get('search') || ''

    // Build where clause
    const where: any = {}
    
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

    // Get stats
    const totalMessages = await prisma.message.count()

    return NextResponse.json({
      messages,
      stats: {
        total: totalMessages,
        flagged: 0,
        spam: 0,
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
