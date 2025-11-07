import { type NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { BookingStatus } from '@prisma/client'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { triggerPusherEvent } from '@/lib/pusher'

interface RouteParams {
  id: string
}

type RouteContext = {
  params: Promise<RouteParams>
}

const resolveParams = async (params: RouteParams | Promise<RouteParams>) => params

// Only block dates for CONFIRMED and COMPLETED bookings, not PENDING
const CONFIRMED_STATUSES: BookingStatus[] = ['CONFIRMED', 'COMPLETED']

const blockPayloadSchema = z
  .object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    reason: z.string().max(200).optional(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    path: ['endDate'],
    message: 'Ngày kết thúc phải sau ngày bắt đầu',
  })

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { id: listingId } = await resolveParams(context.params)

    const blockedDates = await prisma.blockedDate.findMany({
      where: {
        listingId,
        endDate: {
          gte: new Date(),
        },
      },
      orderBy: {
        startDate: 'asc',
      },
    })

    return NextResponse.json(blockedDates)
  } catch (error) {
    console.error('Error fetching blocked dates:', error)
    return NextResponse.json({ error: 'Failed to fetch blocked dates' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: listingId } = await resolveParams(context.params)
    const body = await req.json()
    const payload = blockPayloadSchema.parse(body)

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { hostId: true },
    })

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    const isAdmin = session.user.role === 'ADMIN'
    const isOwner = listing.hostId === session.user.id

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const overlappingBooking = await prisma.booking.findFirst({
      where: {
        listingId,
        status: { in: CONFIRMED_STATUSES },
        checkIn: { lt: payload.endDate },
        checkOut: { gt: payload.startDate },
      },
      select: { id: true, status: true },
    })

    if (overlappingBooking) {
      return NextResponse.json(
        {
          error: 'Khoảng thời gian đang có booking',
          bookingId: overlappingBooking.id,
        },
        { status: 409 },
      )
    }

    const overlappingBlock = await prisma.blockedDate.findFirst({
      where: {
        listingId,
        startDate: { lt: payload.endDate },
        endDate: { gt: payload.startDate },
      },
      select: { id: true },
    })

    if (overlappingBlock) {
      return NextResponse.json(
        {
          error: 'Khoảng thời gian đã bị chặn trước đó',
          blockedDateId: overlappingBlock.id,
        },
        { status: 409 },
      )
    }

    const blockedDate = await prisma.blockedDate.create({
      data: {
        listingId,
        startDate: payload.startDate,
        endDate: payload.endDate,
        reason: payload.reason,
      },
    })

    // Trigger real-time notification to admin and users
    await triggerPusherEvent(
      `listing-${listingId}`,
      'blocked-dates-updated',
      {
        listingId,
        action: 'blocked',
        blockedDate: {
          id: blockedDate.id,
          startDate: blockedDate.startDate,
          endDate: blockedDate.endDate,
          reason: blockedDate.reason,
        },
      }
    )

    return NextResponse.json({ blockedDate }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues?.[0]?.message ?? 'Invalid payload' }, { status: 400 })
    }
    console.error('Failed to create blocked date:', error)
    return NextResponse.json({ error: 'Failed to create blocked date' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: listingId } = await resolveParams(context.params)
    const { searchParams } = new URL(req.url)
    const blockedId = searchParams.get('blockId') ?? searchParams.get('id')

    if (!blockedId) {
      return NextResponse.json({ error: 'Thiếu blockId' }, { status: 400 })
    }

    const blockedDate = await prisma.blockedDate.findUnique({
      where: { id: blockedId },
      select: { id: true, listingId: true, listing: { select: { hostId: true } } },
    })

    if (!blockedDate || blockedDate.listingId !== listingId) {
      return NextResponse.json({ error: 'Blocked date not found' }, { status: 404 })
    }

    const isAdmin = session.user.role === 'ADMIN'
    const isOwner = blockedDate.listing.hostId === session.user.id

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.blockedDate.delete({ where: { id: blockedId } })

    // Trigger real-time notification for unblock
    await triggerPusherEvent(
      `listing-${listingId}`,
      'blocked-dates-updated',
      {
        listingId,
        action: 'unblocked',
        blockedDateId: blockedId,
      }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete blocked date:', error)
    return NextResponse.json({ error: 'Failed to delete blocked date' }, { status: 500 })
  }
}
