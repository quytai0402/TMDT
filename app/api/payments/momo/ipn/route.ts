import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyMomoCallback } from '@/lib/payment-gateways'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Verify callback signature
    const isValid = verifyMomoCallback(body)

    if (!isValid) {
      return NextResponse.json({ resultCode: 97 }) // Invalid signature
    }

    const paymentId = body.orderId
    const resultCode = body.resultCode
    const transactionId = body.transId

    // Get payment
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { booking: true },
    })

    if (!payment) {
      return NextResponse.json({ resultCode: 99 }) // Payment not found
    }

    if (resultCode === 0) {
      // Payment successful
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'COMPLETED',
          transactionId: transactionId.toString(),
          paidAt: new Date(),
          gatewayResponse: body,
        },
      })

      // Update booking
      await prisma.booking.update({
        where: { id: payment.bookingId },
        data: {
          status: 'CONFIRMED',
          confirmedAt: new Date(),
        },
      })

      // Create transaction
      await prisma.transaction.create({
        data: {
          userId: payment.booking.guestId,
          type: 'BOOKING_PAYMENT',
          amount: payment.amount,
          currency: payment.currency,
          status: 'COMPLETED',
          referenceId: payment.bookingId,
        },
      })

      // Send notifications
      await Promise.all([
        prisma.notification.create({
          data: {
            userId: payment.booking.guestId,
            type: 'PAYMENT_RECEIVED',
            title: 'Thanh toán thành công',
            message: 'Thanh toán đặt phòng của bạn đã được xác nhận',
            link: `/trips/${payment.bookingId}`,
          },
        }),
        prisma.notification.create({
          data: {
            userId: payment.booking.hostId,
            type: 'BOOKING_CONFIRMED',
            title: 'Đặt phòng mới',
            message: 'Bạn có một đặt phòng mới đã được thanh toán',
            link: `/host/bookings/${payment.bookingId}`,
          },
        }),
      ])

      return NextResponse.json({ resultCode: 0 })
    } else {
      // Payment failed
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'FAILED',
          gatewayResponse: body,
        },
      })

      return NextResponse.json({ resultCode: 0 })
    }
  } catch (error) {
    console.error('Momo IPN error:', error)
    return NextResponse.json({ resultCode: 99 }) // System error
  }
}
