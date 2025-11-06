import { type NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { BookingStatus } from '@prisma/client'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  id: string
}

const resolveParams = async (params: RouteParams | Promise<RouteParams>) => params

const isValidStatus = (value: string): value is BookingStatus =>
  (Object.values(BookingStatus) as string[]).includes(value)

const PUBLIC_BOOKING_STATUSES: BookingStatus[] = ['CONFIRMED', 'COMPLETED', 'PENDING']

function parseBoolean(value: string | null) {
  if (!value) return false
  return value === 'true' || value === '1'
}

export async function GET(req: NextRequest, context: { params: RouteParams | Promise<RouteParams> }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      const isPublicRequest = parseBoolean(new URL(req.url).searchParams.get('public'))
      if (!isPublicRequest) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const { id: listingId } = await resolveParams(context.params)
    const { searchParams } = new URL(req.url)
    const isPublicRequest = parseBoolean(searchParams.get('public'))
    const rawStatuses = searchParams.get('status')?.split(',').map((item) => item.trim().toUpperCase()).filter(Boolean) ?? []
    const statusFilter = rawStatuses.filter(isValidStatus)

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { hostId: true },
    })

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    if (!isPublicRequest) {
      const isAdmin = session.user.role === 'ADMIN'
      const isOwner = listing.hostId === session.user.id

      if (!isAdmin && !isOwner) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const bookings = await prisma.booking.findMany({
        where: {
          listingId,
          ...(statusFilter.length ? { status: { in: statusFilter } } : {}),
        },
        select: {
          id: true,
          checkIn: true,
          checkOut: true,
          status: true,
          totalPrice: true,
          contactName: true,
          guest: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: {
          checkIn: 'asc',
        },
      })

      return NextResponse.json(bookings)
    }

    const publicStatuses = statusFilter.length
      ? statusFilter.filter((status) => PUBLIC_BOOKING_STATUSES.includes(status))
      : PUBLIC_BOOKING_STATUSES

    if (!publicStatuses.length) {
      return NextResponse.json([])
    }

    const bookings = await prisma.booking.findMany({
      where: {
        listingId,
        status: { in: publicStatuses },
      },
      select: {
        id: true,
        checkIn: true,
        checkOut: true,
        status: true,
      },
      orderBy: {
        checkIn: 'asc',
      },
    })

    return NextResponse.json(bookings)
  } catch (error) {
    console.error('Failed to fetch bookings:', error)
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
  }
}
