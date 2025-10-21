import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/revenue - Get host's revenue tracking
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'HOST' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Host access required' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined
    const listingId = searchParams.get('listingId') || undefined

    // Build where clause
    const where: any = {
      listing: { hostId: session.user.id },
      status: { in: ['CONFIRMED', 'COMPLETED'] }
    }

    if (listingId) {
      where.listingId = listingId
    }

    if (month) {
      where.checkIn = {
        gte: new Date(year, month - 1, 1),
        lt: new Date(year, month, 1)
      }
    } else {
      where.checkIn = {
        gte: new Date(year, 0, 1),
        lt: new Date(year + 1, 0, 1)
      }
    }

    // Get all bookings for revenue calculation
    const bookings = await prisma.booking.findMany({
      where,
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            city: true,
            country: true,
            images: true,
            basePrice: true
          }
        },
        guest: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        payment: {
          select: {
            id: true,
            status: true,
            amount: true,
            paymentMethod: true
          }
        },
      },
      orderBy: {
        checkIn: 'desc'
      }
    })

    // Calculate revenue
    const totalRevenue = bookings.reduce((sum, booking) => sum + booking.totalPrice, 0)
    const platformFee = totalRevenue * 0.15 // 15% platform fee
    const netRevenue = totalRevenue - platformFee
    const averageBookingValue = bookings.length > 0 ? totalRevenue / bookings.length : 0

    // Group by month for chart
    const monthlyRevenue = new Array(12).fill(0)
    const monthlyBookings = new Array(12).fill(0)
    bookings.forEach(booking => {
      const monthIndex = new Date(booking.checkIn).getMonth()
      monthlyRevenue[monthIndex] += booking.totalPrice
      monthlyBookings[monthIndex] += 1
    })

    // Calculate by listing
    const byListing: Record<string, any> = {}
    bookings.forEach(booking => {
      if (!byListing[booking.listingId]) {
        byListing[booking.listingId] = {
          id: booking.listingId,
          title: booking.listing.title,
          revenue: 0,
          bookings: 0
        }
      }
      byListing[booking.listingId].revenue += booking.totalPrice
      byListing[booking.listingId].bookings += 1
    })

    // Calculate paid vs pending
    const paidBookings = bookings.filter(b => b.payment?.status === 'COMPLETED')
    const paidRevenue = paidBookings.reduce((sum, b) => sum + b.totalPrice, 0)
    const pendingRevenue = totalRevenue - paidRevenue

    return NextResponse.json({
      summary: {
        totalRevenue,
        netRevenue,
        platformFee,
        paidRevenue,
        pendingRevenue,
        averageBookingValue,
        totalBookings: bookings.length,
        year,
        month
      },
      monthlyRevenue,
      monthlyBookings,
      byListing: Object.values(byListing),
      recentBookings: bookings.slice(0, 10).map(booking => ({
        id: booking.id,
        listingTitle: booking.listing.title,
        guestName: booking.contactName || booking.guest?.name || 'Khách vãng lai',
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        nights: booking.nights,
        amount: booking.totalPrice,
        paymentStatus: booking.payment?.status || 'PENDING',
        bookingStatus: booking.status,
        image: booking.listing.images[0] || null
      }))
    })

  } catch (error) {
    console.error('Error fetching revenue:', error)
    return NextResponse.json(
      { error: 'Failed to fetch revenue' },
      { status: 500 }
    )
  }
}
