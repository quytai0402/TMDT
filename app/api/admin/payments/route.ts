import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import { BookingStatus, TransactionStatus, TransactionType } from '@prisma/client'

const PLATFORM_COMMISSION_FALLBACK_RATE = 0.1

const toNumber = (value?: number | null) => {
  if (typeof value === 'number') {
    return value
  }
  if (value === null || value === undefined) {
    return 0
  }
  return Number(value)
}

function buildBookingWhere(
  extra?: Prisma.BookingWhereInput,
  condition?: Prisma.BookingWhereInput
): Prisma.BookingWhereInput {
  const clauses: Prisma.BookingWhereInput[] = [{ status: BookingStatus.COMPLETED }]
  if (extra) clauses.push(extra)
  if (condition) clauses.push(condition)
  if (clauses.length === 1) {
    return clauses[0]
  }
  return { AND: clauses }
}

async function calculateBookingRevenue(todayStart: Date) {
  const platformRecordedCondition: Prisma.BookingWhereInput = {
    platformCommission: { gt: 0 },
  }

  const serviceFeeFallbackCondition: Prisma.BookingWhereInput = {
    serviceFee: { gt: 0 },
    OR: [
      { platformCommission: { lte: 0 } },
      { platformCommission: null },
    ],
  }

  const missingCommissionCondition: Prisma.BookingWhereInput = {
    totalPrice: { gt: 0 },
    AND: [
      {
        OR: [
          { platformCommission: { lte: 0 } },
          { platformCommission: null },
        ],
      },
      {
        OR: [
          { serviceFee: { lte: 0 } },
          { serviceFee: null },
        ],
      },
    ],
  }

  const [
    recordedTotal,
    fallbackServiceTotal,
    missingTotal,
    recordedToday,
    fallbackServiceToday,
    missingToday,
    todayCount,
  ] = await Promise.all([
    prisma.booking.aggregate({
      where: buildBookingWhere(undefined, platformRecordedCondition),
      _sum: { platformCommission: true },
    }),
    prisma.booking.aggregate({
      where: buildBookingWhere(undefined, serviceFeeFallbackCondition),
      _sum: { serviceFee: true },
    }),
    prisma.booking.aggregate({
      where: buildBookingWhere(undefined, missingCommissionCondition),
      _sum: { totalPrice: true },
    }),
    prisma.booking.aggregate({
      where: buildBookingWhere({ completedAt: { gte: todayStart } }, platformRecordedCondition),
      _sum: { platformCommission: true },
    }),
    prisma.booking.aggregate({
      where: buildBookingWhere({ completedAt: { gte: todayStart } }, serviceFeeFallbackCondition),
      _sum: { serviceFee: true },
    }),
    prisma.booking.aggregate({
      where: buildBookingWhere({ completedAt: { gte: todayStart } }, missingCommissionCondition),
      _sum: { totalPrice: true },
    }),
    prisma.booking.count({
      where: buildBookingWhere({ completedAt: { gte: todayStart } }),
    }),
  ])

  const total =
    toNumber(recordedTotal._sum.platformCommission) +
    toNumber(fallbackServiceTotal._sum.serviceFee) +
    toNumber(missingTotal._sum.totalPrice) * PLATFORM_COMMISSION_FALLBACK_RATE

  const today =
    toNumber(recordedToday._sum.platformCommission) +
    toNumber(fallbackServiceToday._sum.serviceFee) +
    toNumber(missingToday._sum.totalPrice) * PLATFORM_COMMISSION_FALLBACK_RATE

  return {
    total,
    today,
    todayCount,
  }
}

async function calculateAncillaryRevenue(todayStart: Date) {
  const baseWhere: Prisma.TransactionWhereInput = {
    status: TransactionStatus.COMPLETED,
    amount: { gt: 0 },
    type: { in: [TransactionType.FEE, TransactionType.LOCATION_EXPANSION] },
  }

  const todayWhere: Prisma.TransactionWhereInput = {
    ...baseWhere,
    createdAt: { gte: todayStart },
  }

  const [totalAggregate, todayAggregate, todayCount] = await Promise.all([
    prisma.transaction.aggregate({
      where: baseWhere,
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: todayWhere,
      _sum: { amount: true },
    }),
    prisma.transaction.count({
      where: todayWhere,
    }),
  ])

  return {
    total: toNumber(totalAggregate._sum.amount),
    today: toNumber(todayAggregate._sum.amount),
    todayCount,
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const filterParam = searchParams.get('filter') || 'all'
    const filter = filterParam as 'all' | 'completed' | 'pending' | 'failed'
    const search = searchParams.get('search') || ''
    const normalizedSearch = search.replace(/\D/g, '')

    // Build where clause
    const where: Prisma.PaymentWhereInput = {}

    if (search) {
      const orConditions: Prisma.PaymentWhereInput[] = [
        { id: { contains: search, mode: 'insensitive' } },
        { booking: { guest: { name: { contains: search, mode: 'insensitive' } } } },
        { booking: { guest: { email: { contains: search, mode: 'insensitive' } } } },
        { booking: { contactName: { contains: search, mode: 'insensitive' } } },
        { booking: { contactPhone: { contains: search } } },
      ]

      if (normalizedSearch) {
        orConditions.push({
          booking: { contactPhoneNormalized: { contains: normalizedSearch } },
        })
      }

      where.OR = orConditions
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

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const [bookingRevenue, ancillaryRevenue, completedCount, pendingCount, failedCount] = await Promise.all([
      calculateBookingRevenue(todayStart),
      calculateAncillaryRevenue(todayStart),
      prisma.payment.count({ where: { status: 'COMPLETED' } }),
      prisma.payment.count({ where: { status: 'PENDING' } }),
      prisma.payment.count({ where: { status: 'FAILED' } }),
    ])

    const bookingRevenueTotal = Math.round(bookingRevenue.total)
    const bookingRevenueToday = Math.round(bookingRevenue.today)
    const ancillaryRevenueTotal = Math.round(ancillaryRevenue.total)
    const ancillaryRevenueToday = Math.round(ancillaryRevenue.today)
    const totalRevenue = bookingRevenueTotal + ancillaryRevenueTotal
    const todayRevenue = bookingRevenueToday + ancillaryRevenueToday
    const todayCount = bookingRevenue.todayCount + ancillaryRevenue.todayCount

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
        todayCount,
        completedCount,
        pendingCount,
        failedCount,
        totalRevenue,
        platformFee: bookingRevenueTotal,
        ancillaryRevenue: ancillaryRevenueTotal,
        breakdown: {
          bookingCommission: {
            total: bookingRevenueTotal,
            today: bookingRevenueToday,
            todayCount: bookingRevenue.todayCount,
          },
          ancillary: {
            total: ancillaryRevenueTotal,
            today: ancillaryRevenueToday,
            todayCount: ancillaryRevenue.todayCount,
          },
        },
      }
    })
  } catch (error) {
    console.error('Error fetching admin payments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
