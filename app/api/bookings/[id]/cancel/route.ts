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
        guest: {
          select: {
            id: true,
            name: true,
            email: true,
            membershipStatus: true,
            loyaltyTier: true,
          },
        },
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

    // Calculate refund based on cancellation policy and membership benefits
    let refundAmount = 0
    const hoursUntilCheckIn =
      (booking.checkIn.getTime() - new Date().getTime()) / (1000 * 60 * 60)

    // Check membership status for enhanced refund policy
    const membershipStatus = booking.guest?.membershipStatus
    const loyaltyTier = booking.guest?.loyaltyTier
    const hasEnhancedRefund =
      membershipStatus === 'ACTIVE' &&
      ['SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'].includes(loyaltyTier || '')

    switch (booking.listing.cancellationPolicy) {
      case 'FLEXIBLE':
        // Standard: Full refund if cancelled 24h before
        // Enhanced: Full refund if cancelled 12h before
        refundAmount = hoursUntilCheckIn >= (hasEnhancedRefund ? 12 : 24) ? booking.totalPrice : 0
        break
      case 'MODERATE':
        // Standard: Full refund 5 days before, 50% otherwise
        // Enhanced: Full refund 3 days before, 75% otherwise
        if (hasEnhancedRefund) {
          refundAmount = hoursUntilCheckIn >= 72 ? booking.totalPrice : booking.totalPrice * 0.75
        } else {
          refundAmount = hoursUntilCheckIn >= 120 ? booking.totalPrice : booking.totalPrice * 0.5
        }
        break
      case 'STRICT':
        // Standard: Full refund 7 days before, 0% otherwise
        // Enhanced: Full refund 7 days before, 50% within 7 days
        if (hasEnhancedRefund) {
          refundAmount = hoursUntilCheckIn >= 168 ? booking.totalPrice : booking.totalPrice * 0.5
        } else {
          refundAmount = hoursUntilCheckIn >= 168 ? booking.totalPrice : 0
        }
        break
      case 'SUPER_STRICT':
        // Standard: 50% refund 14 days before, 0% otherwise
        // Enhanced: 75% refund 14 days before, 50% within 14 days
        if (hasEnhancedRefund) {
          refundAmount = hoursUntilCheckIn >= 336 ? booking.totalPrice * 0.75 : booking.totalPrice * 0.5
        } else {
          refundAmount = hoursUntilCheckIn >= 336 ? booking.totalPrice * 0.5 : 0
        }
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
        metadata: {
          ...(booking.metadata as object),
          membershipBenefitApplied: hasEnhancedRefund,
          cancellationPolicy: booking.listing.cancellationPolicy,
          hoursUntilCheckIn: Math.round(hoursUntilCheckIn),
        },
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
    const bookingRef = booking.id.slice(-6).toUpperCase()

    if (notificationUserId) {
      const notificationTitle = isGuestCancelling
        ? 'Khách đã hủy đặt phòng'
        : 'Chủ nhà đã hủy đặt phòng'
      
      const notificationMessage = isGuestCancelling
        ? `${booking.guest?.name || 'Khách'} đã hủy đặt phòng ${bookingRef} cho "${booking.listing.title}". ${refundAmount > 0 ? `Hoàn tiền: ${refundAmount.toLocaleString('vi-VN')}₫` : 'Không hoàn tiền.'}${cancellationReason ? ` Lý do: ${cancellationReason}` : ''}`
        : `Chủ nhà đã hủy đặt phòng ${bookingRef} cho "${booking.listing.title}". Bạn sẽ được hoàn tiền đầy đủ.`

      await prisma.notification.create({
        data: {
          userId: notificationUserId,
          type: 'BOOKING_CANCELLED',
          title: notificationTitle,
          message: notificationMessage,
          link: isGuestCancelling ? `/host/bookings/${booking.id}` : `/trips/${booking.id}`,
          data: { bookingId: booking.id, refundAmount, cancellationReason },
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
      refundPercentage: Math.round((refundAmount / booking.totalPrice) * 100),
      membershipBenefitApplied: hasEnhancedRefund,
      message: 'Booking cancelled successfully',
    })
  } catch (error) {
    console.error('Cancel booking error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
