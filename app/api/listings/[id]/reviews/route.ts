import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Fetch reviews from database
    const reviews = await prisma.review.findMany({
      where: {
        listingId: id,
      },
      include: {
        reviewer: {
          select: {
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Calculate rating breakdown
    const allRatings = reviews.map(r => Math.round(r.overallRating))
    const total = reviews.length
    const ratingBreakdown = [5, 4, 3, 2, 1].map(stars => {
      const count = allRatings.filter(r => r === stars).length
      return {
        stars,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }
    })

    // Format reviews
    const formattedReviews = reviews.map(review => ({
      id: review.id,
      user: {
        name: review.reviewer.name || 'Anonymous',
        avatar: review.reviewer.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.reviewerId}`,
        date: new Date(review.createdAt).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }),
      },
      rating: Math.round(review.overallRating),
      comment: review.comment,
      helpful: 0, // This would require a separate likes/helpful table
    }))

    return NextResponse.json({
      reviews: formattedReviews,
      ratingBreakdown,
    })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      { reviews: [], ratingBreakdown: [] },
      { status: 200 }
    )
  }
}
