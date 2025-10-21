import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/payments/history - Get payment history
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit
    const status = searchParams.get('status') // PENDING, COMPLETED, FAILED, REFUNDED
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined

    // Build where clause based on user role
    const where: any = {
      booking: {}
    }

    if (session.user.role === 'HOST' || session.user.role === 'ADMIN') {
      // Host sees payments for their listings
      where.booking.hostId = session.user.id
    } else {
      // Guest sees their own payments
      where.booking.guestId = session.user.id
    }

    if (status) {
      where.status = status
    }

    if (year) {
      const startDate = new Date(year, month ? month - 1 : 0, 1)
      const endDate = month 
        ? new Date(year, month, 1)
        : new Date(year + 1, 0, 1)
      
      where.createdAt = {
        gte: startDate,
        lt: endDate
      }
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          booking: {
            include: {
              listing: {
                select: {
                  title: true,
                  city: true,
                  country: true,
                  images: true
                }
              },
              guest: {
                select: {
                  name: true,
                  email: true,
                  image: true,
                  phone: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.payment.count({ where })
    ])

    // Calculate summary
    const summary = await prisma.payment.aggregate({
      where,
      _sum: {
        amount: true,
        refundAmount: true
      },
      _count: true
    })

    const enrichedPayments = payments.map(payment => {
      // Calculate platform fee (15%) and host amount
      const platformFee = payment.amount * 0.15
      const hostAmount = payment.amount - platformFee
      const guestContact = {
        name: payment.booking.contactName || payment.booking.guest?.name || 'Khách vãng lai',
        email: payment.booking.contactEmail || payment.booking.guest?.email || null,
        phone: payment.booking.contactPhone || payment.booking.guest?.phone || null,
        guestType: payment.booking.guestType,
      }

      return {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        paymentMethod: payment.paymentMethod,
        paymentGateway: payment.paymentGateway,
        transactionId: payment.transactionId,
        hostAmount,
        platformFee,
        refundAmount: payment.refundAmount,
        refundReason: payment.refundReason,
        isSplitPayment: payment.isSplitPayment,
        createdAt: payment.createdAt,
        paidAt: payment.paidAt,
        guestContact,
        booking: {
          id: payment.booking.id,
          checkIn: payment.booking.checkIn,
          checkOut: payment.booking.checkOut,
          nights: payment.booking.nights,
          status: payment.booking.status,
          listing: {
            title: payment.booking.listing.title,
            location: `${payment.booking.listing.city}, ${payment.booking.listing.country}`,
            image: payment.booking.listing.images[0] || null
          },
          guest: session.user.role === 'HOST'
            ? {
                name: payment.booking.guest?.name || guestContact.name,
                email: payment.booking.guest?.email || guestContact.email,
                image: payment.booking.guest?.image || null,
                phone: payment.booking.guest?.phone || guestContact.phone,
                guestType: guestContact.guestType,
              }
            : undefined
        }
      }
    })

    // Calculate totals
    const totalAmount = summary._sum?.amount || 0
    const totalPlatformFee = totalAmount * 0.15
    const totalHostAmount = totalAmount - totalPlatformFee

    return NextResponse.json({
      payments: enrichedPayments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      summary: {
        totalAmount,
        totalHostAmount,
        totalPlatformFee,
        totalRefunded: summary._sum?.refundAmount || 0,
        totalPayments: summary._count
      }
    })

  } catch (error) {
    console.error('Error fetching payment history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment history' },
      { status: 500 }
    )
  }
}
