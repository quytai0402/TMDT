import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface Params {
  id: string
}

// GET single listing
export async function GET(
  req: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = params

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            image: true,
            bio: true,
            languages: true,
            isVerified: true,
            isSuperHost: true,
            createdAt: true,
            hostProfile: {
              select: {
                responseRate: true,
                responseTime: true,
                totalReviews: true,
                averageRating: true,
              },
            },
          },
        },
        reviews: {
          include: {
            reviewer: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        neighborhoodGuide: true,
        _count: {
          select: {
            bookings: true,
            reviews: true,
          },
        },
      },
    })

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    // Increment views
    await prisma.listing.update({
      where: { id },
      data: { views: { increment: 1 } },
    })

    return NextResponse.json({ listing })
  } catch (error) {
    console.error('Get listing error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// UPDATE listing
export async function PATCH(
  req: NextRequest,
  { params }: { params: Params }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await req.json()

    // Check ownership
    const existingListing = await prisma.listing.findUnique({
      where: { id },
    })

    if (!existingListing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    if (existingListing.hostId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update listing
    const listing = await prisma.listing.update({
      where: { id },
      data: body,
    })

    return NextResponse.json({ listing })
  } catch (error) {
    console.error('Update listing error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE listing
export async function DELETE(
  req: NextRequest,
  { params }: { params: Params }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Check ownership
    const existingListing = await prisma.listing.findUnique({
      where: { id },
    })

    if (!existingListing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    if (existingListing.hostId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Soft delete by archiving
    await prisma.listing.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    })

    return NextResponse.json({ message: 'Listing deleted successfully' })
  } catch (error) {
    console.error('Delete listing error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
