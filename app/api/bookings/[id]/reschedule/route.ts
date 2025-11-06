import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notifyUser } from '@/lib/notifications'
import { NotificationType } from '@prisma/client'

interface RescheduleBody {
  newCheckIn: string
  newCheckOut: string
  reason?: string
}

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
        listing: {
          include: {
            host: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        guest: {
          select: {
            id: true,
            name: true,
            email: true,
            membershipStatus: true,
            loyaltyTier: true,
          },
        },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Only guest can reschedule
    if (booking.guestId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only guest can reschedule booking' },
        { status: 403 }
      )
    }

    // Cannot reschedule cancelled or completed bookings
    if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') {
      return NextResponse.json(
        { error: `Cannot reschedule ${booking.status.toLowerCase()} booking` },
        { status: 400 }
      )
    }

    // Cannot reschedule if already started
    if (booking.checkIn < new Date()) {
      return NextResponse.json(
        { error: 'Cannot reschedule booking that has already started' },
        { status: 400 }
      )
    }

    const body: RescheduleBody = await req.json()
    const newCheckIn = new Date(body.newCheckIn)
    const newCheckOut = new Date(body.newCheckOut)

    // Validate dates
    if (newCheckIn >= newCheckOut) {
      return NextResponse.json(
        { error: 'Check-out date must be after check-in date' },
        { status: 400 }
      )
    }

    if (newCheckIn < new Date()) {
      return NextResponse.json(
        { error: 'Check-in date cannot be in the past' },
        { status: 400 }
      )
    }

    // Check if new dates are available
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        listingId: booking.listingId,
        id: { not: booking.id },
        status: { in: ['CONFIRMED', 'COMPLETED'] },
        OR: [
          {
            AND: [
              { checkIn: { lte: newCheckIn } },
              { checkOut: { gte: newCheckIn } },
            ],
          },
          {
            AND: [
              { checkIn: { lte: newCheckOut } },
              { checkOut: { gte: newCheckOut } },
            ],
          },
          {
            AND: [
              { checkIn: { gte: newCheckIn } },
              { checkOut: { lte: newCheckOut } },
            ],
          },
        ],
      },
    })

    if (conflictingBooking) {
      return NextResponse.json(
        { error: 'The new dates are not available', conflict: true },
        { status: 409 }
      )
    }

    // Check for blocked dates
    const blockedDate = await prisma.blockedDate.findFirst({
      where: {
        listingId: booking.listingId,
        startDate: { lt: newCheckOut },
        endDate: { gt: newCheckIn },
      },
    })

    if (blockedDate) {
      return NextResponse.json(
        { error: 'The new dates are blocked by host', blocked: true },
        { status: 409 }
      )
    }

    // Calculate new nights and pricing
    const newNights = Math.ceil(
      (newCheckOut.getTime() - newCheckIn.getTime()) / (1000 * 60 * 60 * 24)
    )
    const nightlyRate = booking.basePrice / booking.nights
    const newSubtotal = nightlyRate * newNights
    const cleaningFee = booking.cleaningFee || 0
    const additionalServices = booking.additionalServicesTotal || 0
    const serviceFee = (newSubtotal + additionalServices) * 0.1
    const newTotalBeforeFees = newSubtotal + cleaningFee + serviceFee + additionalServices
    
    // Calculate price difference (can be positive or negative)
    const priceDifference = newTotalBeforeFees - booking.totalPrice
    const isUpgrade = priceDifference > 0 // More nights = more expensive
    const isDowngrade = priceDifference < 0 // Less nights = cheaper

    // Calculate reschedule fee based on membership
    let rescheduleFee = 0
    const membershipStatus = booking.guest?.membershipStatus
    const loyaltyTier = booking.guest?.loyaltyTier

    // Membership benefits for rescheduling
    const hasFreeReschedule =
      membershipStatus === 'ACTIVE' &&
      ['GOLD', 'PLATINUM', 'DIAMOND'].includes(loyaltyTier || '')

    if (!hasFreeReschedule) {
      // Check how close to check-in date
      const hoursUntilCheckIn =
        (booking.checkIn.getTime() - new Date().getTime()) / (1000 * 60 * 60)

      if (hoursUntilCheckIn < 48) {
        // Less than 48h - 10% fee on ORIGINAL price
        rescheduleFee = booking.totalPrice * 0.1
      } else if (hoursUntilCheckIn < 168) {
        // Less than 7 days - 5% fee on ORIGINAL price
        rescheduleFee = booking.totalPrice * 0.05
      }
      // More than 7 days - free for everyone
    }

    // Calculate final total and amount to pay/refund
    const newTotalPrice = newTotalBeforeFees + rescheduleFee
    const amountToPay = isUpgrade ? priceDifference + rescheduleFee : rescheduleFee
    const refundAmount = isDowngrade ? Math.abs(priceDifference) - rescheduleFee : 0

    // Store old dates for notification
    const oldCheckIn = booking.checkIn
    const oldCheckOut = booking.checkOut

    // Update booking
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        checkIn: newCheckIn,
        checkOut: newCheckOut,
        nights: newNights,
        basePrice: newSubtotal,
        serviceFee,
        totalPrice: newTotalPrice,
        // Store reschedule info in metadata
        metadata: {
          ...(typeof booking.metadata === 'object' && booking.metadata !== null ? booking.metadata : {}),
          rescheduled: true,
          rescheduleHistory: [
            ...((booking.metadata as any)?.rescheduleHistory || []),
            {
              oldCheckIn: oldCheckIn.toISOString(),
              oldCheckOut: oldCheckOut.toISOString(),
              oldNights: booking.nights,
              oldTotalPrice: booking.totalPrice,
              newCheckIn: newCheckIn.toISOString(),
              newCheckOut: newCheckOut.toISOString(),
              newNights,
              newTotalPrice,
              priceDifference,
              rescheduleFee,
              amountToPay,
              refundAmount,
              reason: body.reason,
              rescheduledAt: new Date().toISOString(),
            },
          ],
        },
      },
      include: {
        listing: true,
        guest: true,
      },
    })

    // Create transaction for additional payment if needed
    if (amountToPay > 0) {
      await prisma.transaction.create({
        data: {
          userId: session.user.id,
          type: 'RESCHEDULE_FEE',
          amount: amountToPay,
          currency: booking.currency,
          status: 'PENDING',
          referenceId: booking.id,
          description: isUpgrade
            ? `Thanh toán bổ sung ${Math.abs(priceDifference).toLocaleString('vi-VN')}₫ + phí thay đổi ${rescheduleFee.toLocaleString('vi-VN')}₫ cho booking ${booking.id.slice(-6).toUpperCase()}`
            : `Phí thay đổi ngày cho booking ${booking.id.slice(-6).toUpperCase()}`,
        },
      })
    }

    // Create refund transaction if needed
    if (refundAmount > 0) {
      await prisma.transaction.create({
        data: {
          userId: session.user.id,
          type: 'REFUND',
          amount: refundAmount,
          currency: booking.currency,
          status: 'PENDING',
          referenceId: booking.id,
          description: `Hoàn tiền ${refundAmount.toLocaleString('vi-VN')}₫ do giảm số đêm cho booking ${booking.id.slice(-6).toUpperCase()}`,
        },
      })
    }

    // Notify host
    const bookingRef = booking.id.slice(-6).toUpperCase()
    const formatter = new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })

    let hostMessage = `${booking.guest?.name || 'Khách'} đã đổi ngày đặt phòng ${bookingRef} từ ${formatter.format(oldCheckIn)} - ${formatter.format(oldCheckOut)} (${booking.nights} đêm) sang ${formatter.format(newCheckIn)} - ${formatter.format(newCheckOut)} (${newNights} đêm).`
    
    if (isUpgrade) {
      hostMessage += ` Tổng tiền tăng ${Math.abs(priceDifference).toLocaleString('vi-VN')}₫.`
    } else if (isDowngrade) {
      hostMessage += ` Tổng tiền giảm ${Math.abs(priceDifference).toLocaleString('vi-VN')}₫.`
    }
    
    if (body.reason) {
      hostMessage += ` Lý do: ${body.reason}`
    }

    await notifyUser(booking.hostId, {
      type: NotificationType.BOOKING_UPDATE,
      title: 'Khách đã thay đổi ngày đặt phòng',
      message: hostMessage,
      link: `/host/bookings/${booking.id}`,
      data: {
        bookingId: booking.id,
        oldCheckIn: oldCheckIn.toISOString(),
        oldCheckOut: oldCheckOut.toISOString(),
        newCheckIn: newCheckIn.toISOString(),
        newCheckOut: newCheckOut.toISOString(),
        priceDifference,
        rescheduleFee,
      },
    })

    // Notify guest about successful reschedule
    if (booking.guestId) {
      let guestMessage = `Bạn đã thay đổi ngày đặt phòng ${bookingRef} thành công. Ngày mới: ${formatter.format(newCheckIn)} - ${formatter.format(newCheckOut)} (${newNights} đêm).`
      
      if (amountToPay > 0) {
        guestMessage += ` Cần thanh toán thêm: ${amountToPay.toLocaleString('vi-VN')}₫`
        if (isUpgrade) {
          guestMessage += ` (${Math.abs(priceDifference).toLocaleString('vi-VN')}₫ chênh lệch + ${rescheduleFee.toLocaleString('vi-VN')}₫ phí thay đổi).`
        } else {
          guestMessage += ` (phí thay đổi).`
        }
      } else if (refundAmount > 0) {
        guestMessage += ` Bạn sẽ được hoàn ${refundAmount.toLocaleString('vi-VN')}₫.`
      } else if (rescheduleFee === 0) {
        guestMessage += ` Miễn phí thay đổi.`
      }

      await notifyUser(booking.guestId, {
        type: NotificationType.BOOKING_UPDATE,
        title: 'Đã thay đổi ngày đặt phòng',
        message: guestMessage,
        link: `/trips/${booking.id}`,
        data: {
          bookingId: booking.id,
          rescheduleFee,
          priceDifference,
          amountToPay,
          refundAmount,
        },
      })
    }

    return NextResponse.json({
      booking: updatedBooking,
      rescheduleFee,
      priceDifference,
      amountToPay,
      refundAmount,
      isUpgrade,
      isDowngrade,
      oldNights: booking.nights,
      newNights,
      oldTotalPrice: booking.totalPrice,
      newTotalPrice,
      message: 'Booking rescheduled successfully',
      freeReschedule: hasFreeReschedule,
      requiresPayment: amountToPay > 0,
    })
  } catch (error) {
    console.error('Reschedule booking error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
