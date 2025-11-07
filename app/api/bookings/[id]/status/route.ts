import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notifyAdmins, notifyUser } from '@/lib/notifications'
import { sendBookingConfirmationEmail } from '@/lib/email'
import { settleCompletedBookingFinancials } from '@/lib/finance'
import { sendAutomationMessageForBooking } from '@/lib/host/automation'
import { AutomationMessageTrigger, NotificationType, PaymentStatus } from '@prisma/client'

const ALLOWED_STATUSES = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'] as const

type AllowedStatus = (typeof ALLOWED_STATUSES)[number]

// Host can only confirm or cancel PENDING bookings, and cancel CONFIRMED bookings
// This ensures hosts have control over their properties
const HOST_TRANSITIONS: Record<AllowedStatus, AllowedStatus[]> = {
  PENDING: ['CANCELLED'],
  CONFIRMED: ['CANCELLED'],
  CANCELLED: [],
  COMPLETED: [],
}

// Admin has full control and can reverse most transitions
const ADMIN_TRANSITIONS: Record<AllowedStatus, AllowedStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PENDING', 'CANCELLED', 'COMPLETED'],
  CANCELLED: ['PENDING', 'CONFIRMED'],
  COMPLETED: [],
}

const STATUS_LABEL: Record<AllowedStatus, string> = {
  PENDING: 'Chờ xử lý',
  CONFIRMED: 'Đã xác nhận',
  CANCELLED: 'Đã hủy',
  COMPLETED: 'Hoàn thành',
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const status = String(body?.status || '').toUpperCase() as AllowedStatus
    const rawPaymentStatus = body?.paymentStatus ? String(body.paymentStatus).toUpperCase() : null
    const paymentNotesProvided = Object.prototype.hasOwnProperty.call(body ?? {}, 'paymentNotes')
    const sanitizedPaymentNotes =
      typeof body?.paymentNotes === 'string' ? body.paymentNotes.trim().slice(0, 600) : null

    if (!ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        listing: true,
        guest: true,
        host: true,
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const isAdmin = session.user.role === 'ADMIN'
    const isHost = booking.hostId === session.user.id
    const requestedPaymentStatus = rawPaymentStatus ? (rawPaymentStatus as PaymentStatus) : null

    if (requestedPaymentStatus && !Object.values(PaymentStatus).includes(requestedPaymentStatus)) {
      return NextResponse.json({ error: 'Invalid payment status' }, { status: 400 })
    }

    if (requestedPaymentStatus && !isAdmin) {
      return NextResponse.json({ error: 'Only admins can update payment status' }, { status: 403 })
    }

    if (!isAdmin && !isHost) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const statusUnchanged = booking.status === status
    const hasPaymentMutation = Boolean(requestedPaymentStatus) || paymentNotesProvided

    if (statusUnchanged && !hasPaymentMutation) {
      return NextResponse.json({
        message: 'Booking status unchanged',
        booking,
        statusLabel: STATUS_LABEL[status],
      })
    }

    if (booking.status === 'COMPLETED') {
      return NextResponse.json({ error: 'Booking đã hoàn tất, không thể cập nhật' }, { status: 400 })
    }

    const transitionsMap = isAdmin ? ADMIN_TRANSITIONS : HOST_TRANSITIONS
    const allowedTargets = transitionsMap[booking.status as AllowedStatus] ?? []

    if (!allowedTargets.includes(status)) {
      return NextResponse.json(
        {
          error: 'Trạng thái không hợp lệ cho vai trò hiện tại',
          allowed: allowedTargets.map((target) => ({
            value: target,
            label: STATUS_LABEL[target],
          })),
        },
        { status: 409 },
      )
    }

    const now = new Date()
    const data: Record<string, unknown> = {
      status,
    }

    if (status === 'CONFIRMED') {
      data.confirmedAt = now
      data.cancelledAt = null
      data.cancelledBy = null
      data.cancellationReason = null
    }

    if (status === 'COMPLETED') {
      data.completedAt = now
    }

    if (status === 'PENDING') {
      data.confirmedAt = null
      data.cancelledAt = null
      data.cancelledBy = null
      data.cancellationReason = null
      data.completedAt = null
    }

    if (status === 'CANCELLED') {
      data.cancelledAt = now
      data.cancelledBy = session.user.id
      data.completedAt = null
      data.confirmedAt = null
    }

    let paymentStatusToApply: PaymentStatus | undefined
    if (requestedPaymentStatus) {
      paymentStatusToApply = requestedPaymentStatus
    } else if (status === 'CONFIRMED' && isAdmin) {
      paymentStatusToApply = PaymentStatus.COMPLETED
    } else if (status === 'PENDING') {
      paymentStatusToApply = PaymentStatus.PENDING
    }

    const canPersistPaymentFields = booking.paymentStatus !== undefined

    if (paymentStatusToApply && canPersistPaymentFields) {
      data.paymentStatus = paymentStatusToApply
      if (paymentStatusToApply === PaymentStatus.COMPLETED) {
        data.paymentConfirmedAt = now
        data.paymentConfirmedBy = session.user.id
      } else if (
        paymentStatusToApply === PaymentStatus.PENDING ||
        paymentStatusToApply === PaymentStatus.PROCESSING ||
        paymentStatusToApply === PaymentStatus.FAILED ||
        paymentStatusToApply === PaymentStatus.REFUNDED
      ) {
        data.paymentConfirmedAt = null
        data.paymentConfirmedBy = null
      }
    }

    if (paymentNotesProvided && canPersistPaymentFields) {
      data.paymentNotes = sanitizedPaymentNotes
    }

    let updatedBooking
    const updateInclude = {
      listing: true,
      guest: true,
      host: true,
    }

    try {
      updatedBooking = await prisma.booking.update({
        where: { id },
        data,
        include: updateInclude,
      })
    } catch (error) {
      console.warn("Primary booking status update failed, retrying without payment fields:", error)
      const fallbackData = { ...data }
      delete fallbackData.paymentStatus
      delete fallbackData.paymentConfirmedAt
      delete fallbackData.paymentConfirmedBy
      delete fallbackData.paymentNotes

      updatedBooking = await prisma.booking.update({
        where: { id },
        data: fallbackData,
        include: updateInclude,
      })
    }

    const bookingRef = updatedBooking.id.slice(-6).toUpperCase()

    if (status === 'CONFIRMED') {
      if (updatedBooking.guestId) {
        await notifyUser(updatedBooking.guestId, {
          type: NotificationType.BOOKING_CONFIRMED,
          title: 'Đặt phòng đã được xác nhận',
          message: `LuxeStay đã xác nhận đơn ${bookingRef} cho "${updatedBooking.listing.title}".`,
          link: `/trips/${updatedBooking.id}`,
          data: {
            bookingId: updatedBooking.id,
            listingId: updatedBooking.listingId,
          },
        })
      }

      await notifyAdmins({
        type: NotificationType.BOOKING_CONFIRMED,
        title: 'Đơn đặt phòng được xác nhận',
        message: `Đơn ${bookingRef} đã được xác nhận bởi admin.`,
        link: `/admin/bookings?highlight=${updatedBooking.id}`,
        data: {
          bookingId: updatedBooking.id,
          listingId: updatedBooking.listingId,
        },
      })

      const guestEmail = updatedBooking.contactEmail || updatedBooking.guest?.email
      if (guestEmail) {
        await sendBookingConfirmationEmail({
          guestName: updatedBooking.guest?.name || updatedBooking.contactName || 'Guest',
          guestEmail,
          listingTitle: updatedBooking.listing.title,
          listingAddress: `${updatedBooking.listing.city}, ${updatedBooking.listing.country}`,
          checkIn: updatedBooking.checkIn,
          checkOut: updatedBooking.checkOut,
          nights: updatedBooking.nights,
          guests: {
            adults: updatedBooking.adults,
            children: updatedBooking.children,
            infants: updatedBooking.infants,
          },
          totalPrice: updatedBooking.totalPrice,
          currency: updatedBooking.currency,
          bookingId: updatedBooking.id,
          hostName: booking.host.name || 'Host',
          hostEmail: booking.host.email || '',
        }).catch((error) => {
          console.error('Failed to send booking confirmation email:', error)
        })
      }

      if (!isHost) {
        await notifyUser(booking.hostId, {
          type: NotificationType.SYSTEM,
          title: 'Đơn đặt phòng đã được xác nhận',
          message: `Đơn ${bookingRef} cho "${booking.listing.title}" đã được admin xác nhận.`,
          link: `/host/bookings/${booking.id}`,
          data: {
            bookingId: booking.id,
            listingId: booking.listingId,
          },
        })
      }

      await sendAutomationMessageForBooking(updatedBooking, AutomationMessageTrigger.BOOKING_CONFIRMED)
    }

    if (status === 'CANCELLED') {
      const cancellationMessage = `Đơn ${bookingRef} cho "${booking.listing.title}" đã được hủy.`

      if (updatedBooking.guestId) {
        await notifyUser(updatedBooking.guestId, {
          type: NotificationType.BOOKING_CANCELLED,
          title: 'Đặt phòng đã bị hủy',
          message: `${cancellationMessage} Concierge sẽ hỗ trợ bạn đặt lại nếu cần.`,
          link: `/trips/${updatedBooking.id}`,
          data: {
            bookingId: updatedBooking.id,
            listingId: updatedBooking.listingId,
          },
        })
      }

      if (!isHost) {
        await notifyUser(booking.hostId, {
          type: NotificationType.SYSTEM,
          title: 'Đơn đặt phòng bị hủy',
          message: `${cancellationMessage} Vui lòng chuẩn bị để mở bán lại lịch.`,
          link: `/host/bookings/${booking.id}`,
          data: {
            bookingId: booking.id,
            listingId: booking.listingId,
          },
        })
      }

      await notifyAdmins({
        type: NotificationType.BOOKING_CANCELLED,
        title: 'Đơn đặt phòng bị hủy',
        message: cancellationMessage,
        link: `/admin/bookings?highlight=${booking.id}`,
        data: {
          bookingId: booking.id,
          listingId: booking.listingId,
          cancelledBy: session.user.id,
        },
      })
    }

    if (status === 'PENDING' && isAdmin) {
      await notifyUser(booking.hostId, {
        type: NotificationType.SYSTEM,
        title: 'Đơn đặt phòng mở lại',
        message: `Đơn ${bookingRef} đã được đưa về trạng thái chờ xử lý.`,
        link: `/host/bookings/${booking.id}`,
        data: {
          bookingId: booking.id,
        },
      })
    }

    if (status === 'COMPLETED' && updatedBooking.guestId) {
      await settleCompletedBookingFinancials(updatedBooking.id)
      updatedBooking = await prisma.booking.findUnique({
        where: { id },
        include: {
          listing: true,
          guest: true,
          host: true,
        },
      }) ?? updatedBooking

      await notifyUser(updatedBooking.guestId, {
        type: NotificationType.SYSTEM,
        title: 'Kỳ nghỉ đã hoàn tất',
        message: `Cảm ơn bạn đã lưu trú tại ${updatedBooking.listing.title}. Đừng quên để lại đánh giá nhé!`,
        link: `/trips/${updatedBooking.id}/review`,
        data: {
          bookingId: updatedBooking.id,
        },
      })
    }

    return NextResponse.json({
      message: 'Booking status updated',
      booking: updatedBooking,
      statusLabel: STATUS_LABEL[status],
    })
  } catch (error) {
    console.error('Update booking status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
