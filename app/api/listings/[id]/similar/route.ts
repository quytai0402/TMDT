import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSimilarListings } from '@/lib/ml-recommendations'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listingId } = await params
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '4')

    // Get current listing
    const currentListing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        host: {
          select: {
            name: true,
          },
        },
      },
    })

    if (!currentListing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    // Get all active listings for comparison
    const allListings = await prisma.listing.findMany({
      where: {
        status: 'ACTIVE',
        id: { not: listingId }, // Exclude current listing
      },
      include: {
        host: {
          select: {
            name: true,
          },
        },
      },
      take: 100, // Limit for performance
    })

    // Use ML algorithm to find similar listings
    const similarListings = getSimilarListings(
      currentListing as any,
      allListings as any,
      limit
    )

    return NextResponse.json(similarListings)
  } catch (error: any) {
    console.error('Error fetching similar listings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch similar listings' },
      { status: 500 }
    )
  }
}
