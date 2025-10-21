import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendBookingCancellationEmail } from '@/lib/email'

export async function POST(
  req: NextRequest,
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
        listing: true,
        guest: true,
        host: true,
        payment: true,
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Check if user is guest or host
    if (booking.guestId !== session.user.id && booking.hostId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if already cancelled
    if (booking.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Booking already cancelled' }, { status: 400 })
    }

    // Check if booking has started
    if (booking.checkIn < new Date()) {
      return NextResponse.json(
        { error: 'Cannot cancel booking that has already started' },
        { status: 400 }
      )
    }

    // Calculate refund based on cancellation policy
    let refundAmount = 0
    const hoursUntilCheckIn =
      (booking.checkIn.getTime() - new Date().getTime()) / (1000 * 60 * 60)

    switch (booking.listing.cancellationPolicy) {
      case 'FLEXIBLE':
        refundAmount = hoursUntilCheckIn >= 24 ? booking.totalPrice : 0
        break
      case 'MODERATE':
        refundAmount = hoursUntilCheckIn >= 120 ? booking.totalPrice : booking.totalPrice * 0.5
        break
      case 'STRICT':
        refundAmount = hoursUntilCheckIn >= 168 ? booking.totalPrice : 0
        break
      case 'SUPER_STRICT':
        refundAmount = hoursUntilCheckIn >= 336 ? booking.totalPrice * 0.5 : 0
        break
    }

    const body = await req.json()
    const cancellationReason = body.reason

    // Update booking
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledBy: session.user.id,
        cancellationReason,
        refundAmount,
      },
      include: {
        listing: true,
        guest: true,
      },
    })

    // Update payment status if exists
    if (booking.payment && refundAmount > 0) {
      await prisma.payment.update({
        where: { id: booking.payment.id },
        data: {
          status: refundAmount === booking.totalPrice ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
        },
      })
    }

    // Send notification to the other party
    const isGuestCancelling = booking.guestId && session.user.id === booking.guestId
    const notificationUserId = isGuestCancelling ? booking.hostId : booking.guestId

    if (notificationUserId) {
      const notificationMessage = isGuestCancelling
        ? `Khách đã hủy đặt chỗ ${booking.listing.title}`
        : `Chủ nhà đã hủy đặt chỗ ${booking.listing.title}`

      await prisma.notification.create({
        data: {
          userId: notificationUserId,
          type: 'BOOKING_CANCELLED',
          title: 'Booking Cancelled',
          message: notificationMessage,
          link: `/bookings/${booking.id}`,
          data: { bookingId: booking.id, refundAmount },
        },
      })
    }

    // Send cancellation email to guest
    const guestEmailForNotification =
      updatedBooking.contactEmail || updatedBooking.guest?.email
    if (guestEmailForNotification) {
      await sendBookingCancellationEmail({
        guestName: updatedBooking.guest?.name || updatedBooking.contactName || 'Guest',
        guestEmail: guestEmailForNotification,
        listingTitle: updatedBooking.listing.title,
        checkIn: updatedBooking.checkIn,
        checkOut: updatedBooking.checkOut,
        bookingId: updatedBooking.id,
        refundAmount,
        cancellationReason,
      }).catch(error => {
        console.error('Failed to send cancellation email:', error)
      })
    }

    return NextResponse.json({
      booking: updatedBooking,
      refundAmount,
      message: 'Booking cancelled successfully',
    })
  } catch (error) {
    console.error('Cancel booking error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
