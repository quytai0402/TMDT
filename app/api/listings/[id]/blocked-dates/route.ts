import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listingId } = await params

    const blockedDates = await prisma.blockedDate.findMany({
      where: {
        listingId,
        endDate: {
          gte: new Date(), // Only future blocked dates
        },
      },
      orderBy: {
        startDate: 'asc',
      },
    })

    return NextResponse.json(blockedDates)
  } catch (error: any) {
    console.error('Error fetching blocked dates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch blocked dates' },
      { status: 500 }
    )
  }
}
