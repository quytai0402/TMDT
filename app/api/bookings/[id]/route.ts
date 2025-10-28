import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        listing: {
          include: {
            host: {
              include: {
                hostProfile: true,
              },
            },
          },
        },
        guest: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            phone: true,
          },
        },
        review: true,
        payment: true,
        conciergePlans: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const isGuest = booking.guestId && session.user.id === booking.guestId
    const isHost = session.user.id === booking.hostId
    const isAdmin = session.user.role === 'ADMIN'

    if (!isGuest && !isHost && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const guestContact = {
      name: booking.contactName || booking.guest?.name || 'Khách vãng lai',
      email: booking.contactEmail || booking.guest?.email || null,
      phone: booking.contactPhone || booking.guest?.phone || null,
      guestType: booking.guestType,
    }

    const canReview =
      booking.status === 'COMPLETED' &&
      session.user.id === booking.guestId &&
      !booking.review

    return NextResponse.json({
      ...booking,
      guestContact,
      canReview,
    })
  } catch (error) {
    console.error('Error fetching booking detail:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
