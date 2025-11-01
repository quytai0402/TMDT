import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import { settleCompletedBookingFinancials } from '@/lib/finance'

const ensureAuthorized = (request: NextRequest) => {
  const secret = process.env.CRON_SECRET
  if (!secret) return true
  const header = request.headers.get('authorization') || request.headers.get('x-cron-secret')
  return header === secret
}

const SERVICE_STATUSES_TO_COMPLETE = new Set(['PENDING', 'CONFIRMED'])

export async function POST(request: NextRequest) {
  if (!ensureAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()

    const bookings = await prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        checkOut: { lte: now },
      },
      select: {
        id: true,
        additionalServices: true,
      },
    })

    if (!bookings.length) {
      return NextResponse.json({ message: 'No bookings to complete', completed: 0 })
    }

    await Promise.all(
      bookings.map(async (booking) => {
        const services = Array.isArray(booking.additionalServices)
          ? booking.additionalServices.map((service: any) => {
              if (!SERVICE_STATUSES_TO_COMPLETE.has(service?.status)) {
                return service
              }

              const completedAt = new Date().toISOString()
              return {
                ...service,
                status: 'COMPLETED',
                updatedAt: completedAt,
                statusHistory: Array.isArray(service?.statusHistory)
                  ? [...service.statusHistory, { status: 'COMPLETED', at: completedAt, by: 'system' }]
                  : [{ status: 'COMPLETED', at: completedAt, by: 'system' }],
              }
            })
          : booking.additionalServices

        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            status: 'COMPLETED',
            completedAt: now,
            additionalServices: services,
          },
        })

        await settleCompletedBookingFinancials(booking.id)
      })
    )

    return NextResponse.json({
      message: 'Bookings auto-completed',
      completed: bookings.length,
    })
  } catch (error) {
    console.error('Auto-complete bookings cron error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
}
