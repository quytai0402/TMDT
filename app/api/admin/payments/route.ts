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
    const normalizedSearch = search.replace(/\D/g, '')

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { booking: { guest: { name: { contains: search, mode: 'insensitive' } } } },
        { booking: { guest: { email: { contains: search, mode: 'insensitive' } } } },
        { booking: { contactName: { contains: search, mode: 'insensitive' } } },
        { booking: { contactPhone: { contains: search } } },
      ]

      if (normalizedSearch) {
        where.OR.push({
          booking: { contactPhoneNormalized: { contains: normalizedSearch } },
        })
      }
    }

    if (filter === 'completed') {
      where.status = 'COMPLETED'
    } else if (filter === 'pending') {
      where.status = 'PENDING'
    } else if (filter === 'failed') {
      where.status = 'FAILED'
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        booking: {
          include: {
            guest: {
              select: { id: true, name: true, email: true }
            },
            listing: {
              select: { id: true, title: true }
            }
          }
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    // Get stats for today
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayPayments = await prisma.payment.findMany({
      where: {
        createdAt: { gte: today },
        status: 'COMPLETED'
      }
    })

    const todayRevenue = todayPayments.reduce((sum: number, p: any) => sum + p.amount, 0)

    const completedCount = await prisma.payment.count({ where: { status: 'COMPLETED' } })
    const pendingCount = await prisma.payment.count({ where: { status: 'PENDING' } })
    const failedCount = await prisma.payment.count({ where: { status: 'FAILED' } })

    // Calculate total platform revenue (assuming 10% platform fee)
    const totalRevenue = await prisma.payment.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { amount: true }
    })

    const platformFee = (totalRevenue._sum.amount || 0) * 0.10

    const formattedPayments = payments.map(payment => {
      const guestContact = {
        name: payment.booking.contactName || payment.booking.guest?.name || 'Khách vãng lai',
        email: payment.booking.contactEmail || payment.booking.guest?.email || null,
        phone: payment.booking.contactPhone || null,
        guestType: payment.booking.guestType,
      }

      return {
        ...payment,
        guestContact,
      }
    })

    return NextResponse.json({
      payments: formattedPayments,
      stats: {
        todayRevenue,
        todayCount: todayPayments.length,
        completedCount,
        pendingCount,
        failedCount,
        totalRevenue: totalRevenue._sum.amount || 0,
        platformFee,
      }
    })
  } catch (error) {
    console.error('Error fetching admin payments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
