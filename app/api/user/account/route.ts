import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8),
})

const updateProfileSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  bio: z.string().optional(),
  languages: z.array(z.string()).optional(),
})

// GET /api/user/account - Get account details and activity
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        phoneVerified: true,
        emailVerified: true,
        image: true,
        bio: true,
        languages: true,
        role: true,
        isVerified: true,
        isHost: true,
        isSuperHost: true,
        loyaltyPoints: true,
        loyaltyTier: true,
        referralCode: true,
        createdAt: true,
        lastLoginAt: true,
        _count: {
          select: {
            bookingsAsGuest: true,
            listings: true,
            reviewsWritten: true,
            reviewsReceived: true,
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get recent activity
    const recentBookings = await prisma.booking.findMany({
      where: { guestId: session.user.id },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        checkIn: true,
        checkOut: true,
        totalPrice: true,
        createdAt: true,
        listing: {
          select: {
            title: true,
            city: true,
            images: true
          }
        }
      }
    })

    const recentReviews = await prisma.review.findMany({
      where: { reviewerId: session.user.id },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        overallRating: true,
        comment: true,
        createdAt: true,
        listing: {
          select: {
            title: true,
            images: true
          }
        }
      }
    })

    return NextResponse.json({
      user: {
        ...user,
        stats: {
          totalBookings: user._count.bookingsAsGuest,
          totalListings: user._count.listings,
          reviewsWritten: user._count.reviewsWritten,
          reviewsReceived: user._count.reviewsReceived,
        }
      },
      recentActivity: {
        bookings: recentBookings,
        reviews: recentReviews
      }
    })

  } catch (error) {
    console.error('Error fetching account:', error)
    return NextResponse.json(
      { error: 'Failed to fetch account' },
      { status: 500 }
    )
  }
}

// PUT /api/user/account - Update account details
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = updateProfileSchema.parse(body)

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: validatedData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        image: true,
        bio: true,
        languages: true,
      }
    })

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: updatedUser
    })

  } catch (error) {
    console.error('Error updating account:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to update account' },
      { status: 500 }
    )
  }
}

// DELETE /api/user/account - Delete account
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const confirm = searchParams.get('confirm') === 'true'

    if (!confirm) {
      return NextResponse.json(
        { error: 'Please confirm account deletion' },
        { status: 400 }
      )
    }

    // Check if user has active bookings
    const activeBookings = await prisma.booking.count({
      where: {
        OR: [
          { guestId: session.user.id },
          { hostId: session.user.id }
        ],
        status: { in: ['PENDING', 'CONFIRMED'] }
      }
    })

    if (activeBookings > 0) {
      return NextResponse.json(
        { error: 'Cannot delete account with active bookings' },
        { status: 400 }
      )
    }

    // Soft delete user (or hard delete based on requirements)
    await prisma.user.delete({
      where: { id: session.user.id }
    })

    return NextResponse.json({
      message: 'Account deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting account:', error)
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    )
  }
}
