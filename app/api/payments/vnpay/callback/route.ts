import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyVNPayCallback } from '@/lib/payment-gateways'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const params = Object.fromEntries(searchParams.entries())

    // Verify callback signature
    const isValid = verifyVNPayCallback(params)

    if (!isValid) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/payment/failed?reason=invalid_signature`
      )
    }

    const paymentId = params.vnp_TxnRef
    const responseCode = params.vnp_ResponseCode
    const transactionId = params.vnp_TransactionNo
    const amount = parseInt(params.vnp_Amount) / 100

    // Get payment
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { booking: true },
    })

    if (!payment) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/payment/failed?reason=payment_not_found`
      )
    }

    if (responseCode === '00') {
      // Payment successful
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'COMPLETED',
          transactionId,
          paidAt: new Date(),
          gatewayResponse: params,
        },
      })

      // Update booking status
      await prisma.booking.update({
        where: { id: payment.bookingId },
        data: {
          status: 'CONFIRMED',
          confirmedAt: new Date(),
        },
      })

      // Create transaction record
      await prisma.transaction.create({
        data: {
          userId: payment.booking.guestId,
          type: 'BOOKING_PAYMENT',
          amount: payment.amount,
          currency: payment.currency,
          status: 'COMPLETED',
          referenceId: payment.bookingId,
          description: `Payment for booking ${payment.bookingId}`,
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

      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?bookingId=${payment.bookingId}`
      )
    } else {
      // Payment failed
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'FAILED',
          gatewayResponse: params,
        },
      })

      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/payment/failed?reason=payment_declined`
      )
    }
  } catch (error) {
    console.error('VNPay callback error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/payment/failed?reason=system_error`
    )
  }
}
