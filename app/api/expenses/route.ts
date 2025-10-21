import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// GET /api/expenses - Get user's expense tracking
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined

    // Get all bookings with payments for expense calculation
    const bookings = await prisma.booking.findMany({
      where: {
        guestId: session.user.id,
        status: { in: ['CONFIRMED', 'COMPLETED'] },
        createdAt: month ? {
          gte: new Date(year, month - 1, 1),
          lt: new Date(year, month, 1)
        } : {
          gte: new Date(year, 0, 1),
          lt: new Date(year + 1, 0, 1)
        }
      },
      include: {
        listing: {
          select: {
            title: true,
            city: true,
            country: true,
            images: true
          }
        },
        payment: true,
      },
      orderBy: {
        checkIn: 'desc'
      }
    })

    // Calculate expenses
    const totalExpenses = bookings.reduce((sum, booking) => sum + booking.totalPrice, 0)
    const averageExpense = bookings.length > 0 ? totalExpenses / bookings.length : 0

    // Group by month for chart
    const monthlyExpenses = new Array(12).fill(0)
    bookings.forEach(booking => {
      const monthIndex = new Date(booking.checkIn).getMonth()
      monthlyExpenses[monthIndex] += booking.totalPrice
    })

    // Calculate category breakdown
    const byDestination: Record<string, number> = {}
    bookings.forEach(booking => {
      const location = `${booking.listing.city}, ${booking.listing.country}`
      byDestination[location] = (byDestination[location] || 0) + booking.totalPrice
    })

    return NextResponse.json({
      summary: {
        totalExpenses,
        averageExpense,
        totalBookings: bookings.length,
        year,
        month
      },
      monthlyExpenses,
      byDestination,
      recentExpenses: bookings.map(booking => ({
        id: booking.id,
        listingTitle: booking.listing.title,
        location: `${booking.listing.city}, ${booking.listing.country}`,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        amount: booking.totalPrice,
        paymentStatus: booking.payment?.status || 'PENDING',
        image: booking.listing.images[0] || null
      }))
    })

  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
      { status: 500 }
    )
  }
}
