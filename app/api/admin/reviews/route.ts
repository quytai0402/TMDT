import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const filter = searchParams.get('filter') || 'all'
    const hostId = searchParams.get('hostId')
    const listingId = searchParams.get('listingId')
    const rating = searchParams.get('rating')
    const search = searchParams.get('search') || ''

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { comment: { contains: search, mode: 'insensitive' } },
        { reviewer: { name: { contains: search, mode: 'insensitive' } } },
        { listing: { title: { contains: search, mode: 'insensitive' } } },
      ]
    }

    if (filter === 'pending') {
      where.isVerified = false
    } else if (filter === 'approved') {
      where.isVerified = true
    } else if (filter === 'flagged') {
      where.isFlagged = true
    }

    if (hostId && hostId !== 'all') {
      where.listing = { hostId }
    }

    if (listingId && listingId !== 'all') {
      where.listingId = listingId
    }

    if (rating && rating !== 'all') {
      const ratingNum = parseInt(rating, 10)
      where.overallRating = {
        gte: ratingNum,
        lt: ratingNum + 1,
      }
    }

    const reviews = await prisma.review.findMany({
      where,
      include: {
        reviewer: {
          select: { id: true, name: true, email: true, image: true }
        },
        listing: {
          select: { 
            id: true, 
            title: true,
            hostId: true,
            host: {
              select: { id: true, name: true, email: true }
            }
          }
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    // Get filter options
    const hosts = await prisma.user.findMany({
      where: {
        listings: {
          some: {}
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      take: 100,
    })

    const listings = await prisma.listing.findMany({
      select: {
        id: true,
        title: true,
        hostId: true,
      },
      take: 200,
    })

    // Get stats
    const totalReviews = await prisma.review.count()
    const pendingReviews = await prisma.review.count({ where: { isVerified: false } })
    const flaggedReviews = await prisma.review.count({ where: { isFlagged: true } })
    
    // Calculate average rating
    const avgRating = await prisma.review.aggregate({
      _avg: { overallRating: true }
    })

    // Transform reviews to include host info at top level
    const transformedReviews = reviews.map(review => ({
      ...review,
      host: review.listing.host,
      listing: {
        id: review.listing.id,
        title: review.listing.title,
        hostId: review.listing.hostId,
      }
    }))

    return NextResponse.json({
      reviews: transformedReviews,
      stats: {
        total: totalReviews,
        pending: pendingReviews,
        flagged: flaggedReviews,
        averageRating: avgRating._avg?.overallRating || 0,
        thisWeek: reviews.filter((r: any) => {
          const weekAgo = new Date()
          weekAgo.setDate(weekAgo.getDate() - 7)
          return new Date(r.createdAt) > weekAgo
        }).length,
      },
      filterOptions: {
        hosts,
        listings,
      }
    })
  } catch (error) {
    console.error('Error fetching admin reviews:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Approve or reject review
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { reviewId, status } = await req.json()

    if (!reviewId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    let data: Record<string, boolean | null> | null = null

    if (status === 'APPROVED') {
      data = { isVerified: true, isFlagged: false }
    } else if (status === 'PENDING') {
      data = { isVerified: false }
    } else if (status === 'FLAGGED') {
      data = { isFlagged: true }
    }

    if (!data) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 })
    }

    const review = await prisma.review.update({
      where: { id: reviewId },
      data,
    })

    return NextResponse.json(review)
  } catch (error) {
    console.error('Error updating review:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { reviewId } = await req.json()

    if (!reviewId) {
      return NextResponse.json({ error: 'Missing reviewId' }, { status: 400 })
    }

    await prisma.review.delete({
      where: { id: reviewId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting review:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
