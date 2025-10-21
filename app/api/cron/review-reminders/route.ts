import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendReviewReminderEmail } from '@/lib/email'

// POST /api/cron/review-reminders
// This endpoint should be called daily by a cron job (e.g., Vercel Cron)
export async function POST(req: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Find bookings that checked out yesterday and don't have a review
    const bookings = await prisma.booking.findMany({
      where: {
        status: 'COMPLETED',
        checkOut: {
          gte: yesterday,
          lt: today,
        },
        review: null, // No review yet
      },
      include: {
        guest: {
          select: {
            name: true,
            email: true,
          },
        },
        listing: {
          select: {
            title: true,
          },
        },
      },
    })

    const results = await Promise.allSettled(
      bookings.map(async (booking) => {
        const guestEmail = booking.contactEmail || booking.guest?.email
        if (!guestEmail) {
          return Promise.resolve()
        }

        return sendReviewReminderEmail({
          guestName: booking.contactName || booking.guest?.name || 'Guest',
          guestEmail,
          listingTitle: booking.listing.title,
          bookingId: booking.id,
          checkOut: booking.checkOut,
        })
      })
    )

    const sent = results.filter((r) => r.status === 'fulfilled').length
    const failed = results.filter((r) => r.status === 'rejected').length

    return NextResponse.json({
      success: true,
      totalBookings: bookings.length,
      emailsSent: sent,
      emailsFailed: failed,
    })
  } catch (error) {
    console.error('Review reminders cron error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/cron/review-reminders (for manual testing)
export async function GET(req: NextRequest) {
  // Return count of bookings that need review reminders
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  yesterday.setHours(0, 0, 0, 0)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const count = await prisma.booking.count({
    where: {
      status: 'COMPLETED',
      checkOut: {
        gte: yesterday,
        lt: today,
      },
      review: null,
    },
  })

  return NextResponse.json({
    bookingsNeedingReviewReminder: count,
    dateRange: {
      from: yesterday.toISOString(),
      to: today.toISOString(),
    },
  })
}
