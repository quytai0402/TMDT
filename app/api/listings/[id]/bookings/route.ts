import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listingId } = await params
    const { searchParams } = new URL(req.url)
    const statusFilter = searchParams.get('status')?.split(',') || []

    const where: any = {
      listingId,
    }

    if (statusFilter.length > 0) {
      where.status = {
        in: statusFilter,
      }
    }

    const bookings = await prisma.booking.findMany({
      where,
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
  } catch (error: any) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}
