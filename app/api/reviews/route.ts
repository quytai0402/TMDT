import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Aggressive cache for reviews (90 seconds TTL)
const reviewsCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 90000 // 90 seconds - reviews don't change frequently

const createReviewSchema = z.object({
  bookingId: z.string(),
  type: z.enum(['GUEST_TO_HOST', 'HOST_TO_GUEST', 'GUEST_TO_LISTING']),
  overallRating: z.number().min(1).max(5),
  cleanlinessRating: z.number().min(1).max(5).optional(),
  accuracyRating: z.number().min(1).max(5).optional(),
  checkInRating: z.number().min(1).max(5).optional(),
  communicationRating: z.number().min(1).max(5).optional(),
  locationRating: z.number().min(1).max(5).optional(),
  valueRating: z.number().min(1).max(5).optional(),
  comment: z.string().min(10, 'Comment phải có ít nhất 10 ký tự'),
})

// GET reviews
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const listingId = searchParams.get('listingId')
    const userId = searchParams.get('userId')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Generate cache key
    const cacheKey = `${listingId || 'all'}-${userId || 'all'}-${type || 'all'}-${limit}`
    const cached = reviewsCache.get(cacheKey)
    const now = Date.now()

    if (cached && now - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data)
    }

    const where: any = {}

    if (listingId) {
      where.listingId = listingId
    }

    if (userId) {
      where.OR = [{ reviewerId: userId }, { revieweeId: userId }]
    }

    if (type) {
      where.type = type
    }

    const queryPromise = prisma.review.findMany({
      where,
      select: {
        id: true,
        type: true,
        overallRating: true,
        cleanlinessRating: true,
        accuracyRating: true,
        checkInRating: true,
        communicationRating: true,
        locationRating: true,
        valueRating: true,
        comment: true,
        createdAt: true,
        reviewer: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        reviewee: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        booking: {
          select: {
            checkIn: true,
            checkOut: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout')), 2000) // Reduce to 2s
    )

    const reviews = await Promise.race([queryPromise, timeoutPromise]).catch((error) => {
      console.error('Reviews query error:', error)
      return []
    })

    const result = { reviews }

    // Cache the result
    reviewsCache.set(cacheKey, { data: result, timestamp: now })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Get reviews error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// CREATE review
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = createReviewSchema.parse(body)

    // Get booking
    const booking = await prisma.booking.findUnique({
      where: { id: validatedData.bookingId },
      include: { listing: true },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Check if booking is completed
    if (booking.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Chỉ có thể đánh giá sau khi hoàn thành chuyến đi' },
        { status: 400 }
      )
    }

    // Check authorization based on review type
    let reviewerId = session.user.id
    let revieweeId = ''
    let listingId = booking.listingId

    if (validatedData.type === 'GUEST_TO_HOST' || validatedData.type === 'GUEST_TO_LISTING') {
      if (booking.guestId !== session.user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
      revieweeId = booking.hostId
    } else if (validatedData.type === 'HOST_TO_GUEST') {
      if (booking.hostId !== session.user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
      revieweeId = booking.guestId
    }

    // Check if review already exists
    const existingReview = await prisma.review.findUnique({
      where: { bookingId: validatedData.bookingId },
    })

    if (existingReview) {
      return NextResponse.json(
        { error: 'Bạn đã đánh giá cho booking này rồi' },
        { status: 400 }
      )
    }

    // Basic AI sentiment analysis (simple keyword-based)
    const comment = validatedData.comment.toLowerCase()
    let aiSentiment = 'neutral'
    
    const positiveWords = ['tuyệt vời', 'tốt', 'đẹp', 'sạch sẽ', 'nhiệt tình', 'amazing', 'great', 'excellent', 'clean', 'beautiful']
    const negativeWords = ['tệ', 'bẩn', 'xấu', 'thất vọng', 'bad', 'dirty', 'terrible', 'disappointed']
    
    const positiveCount = positiveWords.filter(word => comment.includes(word)).length
    const negativeCount = negativeWords.filter(word => comment.includes(word)).length
    
    if (positiveCount > negativeCount) {
      aiSentiment = 'positive'
    } else if (negativeCount > positiveCount) {
      aiSentiment = 'negative'
    }

    // Extract keywords
    const allKeywords = [...positiveWords, ...negativeWords, 'location', 'vị trí', 'host', 'chủ nhà']
    const aiKeywords = allKeywords.filter(word => comment.includes(word))

    // Create review
    const review = await prisma.review.create({
      data: {
        ...validatedData,
        reviewerId,
        revieweeId,
        listingId,
        aiSentiment,
        aiKeywords,
        isVerified: true,
      },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    })

    // Update listing rating
    const listingReviews = await prisma.review.findMany({
      where: {
        listingId,
        type: 'GUEST_TO_LISTING',
      },
    })

    const avgRating =
      listingReviews.reduce((sum, r) => sum + r.overallRating, 0) / listingReviews.length

    await prisma.listing.update({
      where: { id: listingId },
      data: {
        averageRating: avgRating,
        totalReviews: listingReviews.length,
      },
    })

    // Update host profile rating if it's a host review
    if (validatedData.type === 'GUEST_TO_HOST') {
      const hostReviews = await prisma.review.findMany({
        where: {
          revieweeId,
          type: 'GUEST_TO_HOST',
        },
      })

      const hostAvgRating =
        hostReviews.reduce((sum, r) => sum + r.overallRating, 0) / hostReviews.length

      await prisma.hostProfile.updateMany({
        where: { userId: revieweeId },
        data: {
          averageRating: hostAvgRating,
          totalReviews: hostReviews.length,
        },
      })
    }

    // Send notification
    await prisma.notification.create({
      data: {
        userId: revieweeId,
        type: 'REVIEW_RECEIVED',
        title: 'Đánh giá mới',
        message: `${session.user.name} đã đánh giá bạn ${validatedData.overallRating} sao`,
        link: `/reviews/${review.id}`,
      },
    })

    return NextResponse.json({ review }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    console.error('Create review error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
