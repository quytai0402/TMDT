import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { computeBookingFinancials } from '@/lib/finance'
import { BookingStatus, PaymentStatus, ListingStatus } from '@prisma/client'

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
      completedBookingsCount,
      commissionAggregate,
      paymentsAggregate,
      newUsers,
      newListings,
      newBookings,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isHost: true } }),
      prisma.listing.count(),
      prisma.listing.count({ where: { status: ListingStatus.ACTIVE } }),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: BookingStatus.COMPLETED } }),
      prisma.booking.aggregate({
        where: { status: BookingStatus.COMPLETED },
        _sum: {
          platformCommission: true,
          serviceFee: true,
        },
      }),
      prisma.payment.aggregate({
        where: { status: PaymentStatus.COMPLETED },
        _sum: {
          amount: true,
        },
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
    const commissionBookings = await prisma.booking.findMany({
      where: {
        status: BookingStatus.COMPLETED,
        completedAt: { gte: startDate },
      },
      select: {
        completedAt: true,
        platformCommission: true,
        serviceFee: true,
        totalPrice: true,
        hostEarnings: true,
      },
    })

    const revenueByDay = commissionBookings.reduce((acc: any[], booking) => {
      if (!booking.completedAt) return acc
      const date = booking.completedAt.toISOString().split('T')[0]
      const { commission } = computeBookingFinancials(booking)
      const existing = acc.find(item => item.date === date)
      if (existing) {
        existing.revenue += commission
        existing.transactions++
      } else {
        acc.push({ date, revenue: commission, transactions: 1 })
      }
      return acc
    }, [])

    // Top performing listings
    const topListings = await prisma.listing.findMany({
      where: {
        bookings: {
          some: {
            status: BookingStatus.COMPLETED,
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
                status: BookingStatus.COMPLETED,
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

    const platformCommission = Number(commissionAggregate._sum.platformCommission ?? 0)
    const fallbackServiceFee = Number(commissionAggregate._sum.serviceFee ?? 0)
    const platformRevenue = platformCommission > 0 ? platformCommission : fallbackServiceFee
    const totalPayments = Number(paymentsAggregate._sum.amount ?? 0)

    return NextResponse.json({
      overview: {
        totalUsers,
        totalHosts,
        totalListings,
        activeListings,
        totalBookings,
        completedBookings: completedBookingsCount,
        totalRevenue: platformRevenue,
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
        total: totalPayments,
        byDay: revenueByDay,
      },
      topListings,
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
