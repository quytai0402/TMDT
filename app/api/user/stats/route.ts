import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/user/stats - Get user statistics
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [
      bookingsCount,
      listingsCount,
      reviewsCount,
      wishlistCount,
      totalSpent,
      totalEarned,
    ] = await Promise.all([
      // Guest bookings
      prisma.booking.count({
        where: { guestId: session.user.id },
      }),
      // Host listings
      prisma.listing.count({
        where: { hostId: session.user.id },
      }),
      // Reviews given
      prisma.review.count({
        where: { reviewerId: session.user.id },
      }),
      // Wishlist items
      prisma.wishlist.findFirst({
        where: { userId: session.user.id },
        select: { listingIds: true },
      }).then(w => w?.listingIds.length || 0),
      // Total spent as guest
      prisma.booking.aggregate({
        where: {
          guestId: session.user.id,
          status: 'CONFIRMED',
        },
        _sum: {
          totalPrice: true,
        },
      }).then(r => r._sum.totalPrice || 0),
      // Total earned as host
      prisma.booking.aggregate({
        where: {
          listing: {
            hostId: session.user.id,
          },
          status: 'CONFIRMED',
        },
        _sum: {
          totalPrice: true,
        },
      }).then(r => r._sum.totalPrice || 0),
    ])

    return NextResponse.json({
      bookings: bookingsCount,
      listings: listingsCount,
      reviews: reviewsCount,
      wishlist: wishlistCount,
      totalSpent,
      totalEarned,
    })
  } catch (error: any) {
    console.error('Error fetching user stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
