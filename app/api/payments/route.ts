import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createVNPayPaymentUrl, createMomoPayment, createZaloPayPayment } from '@/lib/payment-gateways'
import { nanoid } from 'nanoid'
import { z } from 'zod'

const createPaymentSchema = z.object({
  bookingId: z.string(),
  paymentMethod: z.enum(['VNPAY', 'MOMO', 'ZALOPAY', 'CREDIT_CARD']),
  paymentGateway: z.enum(['VNPAY', 'MOMO', 'ZALOPAY', 'STRIPE']),
  isSplitPayment: z.boolean().optional(),
  splitDetails: z.array(z.object({
    userId: z.string(),
    amount: z.number(),
  })).optional(),
  isInstallment: z.boolean().optional(),
  installmentMonths: z.number().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = createPaymentSchema.parse(body)

    // Get booking
    const booking = await prisma.booking.findUnique({
      where: { id: validatedData.bookingId },
      include: { listing: true },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (booking.guestId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        bookingId: validatedData.bookingId,
        amount: booking.totalPrice,
        currency: booking.currency,
        paymentMethod: validatedData.paymentMethod,
        paymentGateway: validatedData.paymentGateway,
        status: 'PENDING',
        isSplitPayment: validatedData.isSplitPayment || false,
        splitPayments: validatedData.splitDetails?.map(detail => ({
          userId: detail.userId,
          amount: detail.amount,
          status: 'PENDING' as const,
        })) || [],
        isInstallment: validatedData.isInstallment || false,
      },
    })

    // Generate payment URL based on gateway
    let paymentUrl: string | undefined
    const orderId = `BK${booking.id.substring(0, 8)}${Date.now()}`
    const ipAddr = req.headers.get('x-forwarded-for') || '127.0.0.1'

    try {
      switch (validatedData.paymentGateway) {
        case 'VNPAY':
          paymentUrl = createVNPayPaymentUrl({
            amount: booking.totalPrice,
            orderInfo: `Thanh toán đặt phòng ${booking.listing.title}`,
            orderId: payment.id,
            ipAddr,
          })
          break

        case 'MOMO':
          const momoResponse = await createMomoPayment({
            amount: booking.totalPrice,
            orderInfo: `Thanh toán đặt phòng ${booking.listing.title}`,
            orderId: payment.id,
            requestId: nanoid(),
          })

          if (momoResponse.resultCode === 0) {
            paymentUrl = momoResponse.payUrl
          } else {
            throw new Error(momoResponse.message || 'Momo payment failed')
          }
          break

        case 'ZALOPAY':
          const zalopayResponse = await createZaloPayPayment({
            amount: booking.totalPrice,
            description: `Thanh toán đặt phòng ${booking.listing.title}`,
            orderId: payment.id,
          })

          if (zalopayResponse.return_code === 1) {
            paymentUrl = zalopayResponse.order_url
          } else {
            throw new Error(zalopayResponse.return_message || 'ZaloPay payment failed')
          }
          break

        case 'STRIPE':
          // TODO: Implement Stripe payment
          return NextResponse.json(
            { error: 'Stripe payment not implemented yet' },
            { status: 501 }
          )

        default:
          return NextResponse.json({ error: 'Invalid payment gateway' }, { status: 400 })
      }

      return NextResponse.json({
        payment,
        paymentUrl,
      })
    } catch (error: any) {
      // Update payment status to failed
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          gatewayResponse: { error: error.message },
        },
      })

      throw error
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    console.error('Create payment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET payment status
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const paymentId = searchParams.get('id')

    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID required' }, { status: 400 })
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: {
          include: {
            guest: true,
            listing: true,
          },
        },
      },
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Check authorization
    if (
      payment.booking.guestId !== session.user.id &&
      payment.booking.hostId !== session.user.id &&
      session.user.role !== 'ADMIN'
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ payment })
  } catch (error) {
    console.error('Get payment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
