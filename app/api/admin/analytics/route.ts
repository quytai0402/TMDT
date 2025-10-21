import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || '30' // days

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(period))

    // Platform statistics
    const [
      totalUsers,
      totalHosts,
      totalListings,
      activeListings,
      totalBookings,
      completedBookings,
      totalRevenue,
      newUsers,
      newListings,
      newBookings,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isHost: true } }),
      prisma.listing.count(),
      prisma.listing.count({ where: { status: 'ACTIVE' } }),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: 'COMPLETED' } }),
      prisma.payment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      prisma.user.count({
        where: { createdAt: { gte: startDate } },
      }),
      prisma.listing.count({
        where: { createdAt: { gte: startDate } },
      }),
      prisma.booking.count({
        where: { createdAt: { gte: startDate } },
      }),
    ])

    // Calculate growth rates
    const previousPeriodStart = new Date(startDate)
    previousPeriodStart.setDate(previousPeriodStart.getDate() - parseInt(period))

    const [previousUsers, previousListings, previousBookings] = await Promise.all([
      prisma.user.count({
        where: {
          createdAt: {
            gte: previousPeriodStart,
            lt: startDate,
          },
        },
      }),
      prisma.listing.count({
        where: {
          createdAt: {
            gte: previousPeriodStart,
            lt: startDate,
          },
        },
      }),
      prisma.booking.count({
        where: {
          createdAt: {
            gte: previousPeriodStart,
            lt: startDate,
          },
        },
      }),
    ])

    const userGrowth = previousUsers > 0 ? ((newUsers - previousUsers) / previousUsers) * 100 : 0
    const listingGrowth = previousListings > 0 ? ((newListings - previousListings) / previousListings) * 100 : 0
    const bookingGrowth = previousBookings > 0 ? ((newBookings - previousBookings) / previousBookings) * 100 : 0

    // Revenue by period (simplified for MongoDB)
    const payments = await prisma.payment.findMany({
      where: {
        status: 'COMPLETED',
        paidAt: { gte: startDate },
      },
      select: {
        amount: true,
        paidAt: true,
      },
    })

    const revenueByDay = payments.reduce((acc: any[], payment) => {
      if (!payment.paidAt) return acc
      const date = payment.paidAt.toISOString().split('T')[0]
      const existing = acc.find(item => item.date === date)
      if (existing) {
        existing.revenue += payment.amount
        existing.transactions++
      } else {
        acc.push({ date, revenue: payment.amount, transactions: 1 })
      }
      return acc
    }, [])

    // Top performing listings
    const topListings = await prisma.listing.findMany({
      where: {
        bookings: {
          some: {
            status: 'COMPLETED',
            checkOut: { gte: startDate },
          },
        },
      },
      select: {
        id: true,
        title: true,
        city: true,
        averageRating: true,
        totalBookings: true,
        _count: {
          select: {
            bookings: {
              where: {
                status: 'COMPLETED',
                checkOut: { gte: startDate },
              },
            },
          },
        },
      },
      orderBy: {
        totalBookings: 'desc',
      },
      take: 10,
    })

    return NextResponse.json({
      overview: {
        totalUsers,
        totalHosts,
        totalListings,
        activeListings,
        totalBookings,
        completedBookings,
        totalRevenue: totalRevenue._sum.amount || 0,
      },
      growth: {
        period: parseInt(period),
        users: {
          new: newUsers,
          growth: Math.round(userGrowth * 10) / 10,
        },
        listings: {
          new: newListings,
          growth: Math.round(listingGrowth * 10) / 10,
        },
        bookings: {
          new: newBookings,
          growth: Math.round(bookingGrowth * 10) / 10,
        },
      },
      revenue: {
        total: totalRevenue._sum.amount || 0,
        byDay: revenueByDay,
      },
      topListings,
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
