import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const listingId = searchParams.get('listingId')

    if (!listingId) {
      return NextResponse.json({ error: 'Listing ID required' }, { status: 400 })
    }

    // Get all reviews for listing
    const reviews = await prisma.review.findMany({
      where: {
        listingId,
        type: 'GUEST_TO_LISTING',
      },
      select: {
        overallRating: true,
        cleanlinessRating: true,
        accuracyRating: true,
        checkInRating: true,
        communicationRating: true,
        locationRating: true,
        valueRating: true,
        comment: true,
        aiSentiment: true,
        aiKeywords: true,
        createdAt: true,
      },
    })

    if (reviews.length === 0) {
      return NextResponse.json({
        summary: 'Chưa có đánh giá nào',
        totalReviews: 0,
        averageRating: 0,
        sentimentBreakdown: {},
        topPositives: [],
        topNegatives: [],
        categoryRatings: {},
      })
    }

    // Calculate averages
    const totalReviews = reviews.length
    const averageRating = reviews.reduce((sum, r) => sum + r.overallRating, 0) / totalReviews

    // Category ratings
    const categoryRatings = {
      cleanliness: calculateAverage(reviews, 'cleanlinessRating'),
      accuracy: calculateAverage(reviews, 'accuracyRating'),
      checkIn: calculateAverage(reviews, 'checkInRating'),
      communication: calculateAverage(reviews, 'communicationRating'),
      location: calculateAverage(reviews, 'locationRating'),
      value: calculateAverage(reviews, 'valueRating'),
    }

    // Sentiment breakdown
    const sentimentCounts = reviews.reduce((acc: any, r) => {
      acc[r.aiSentiment || 'neutral'] = (acc[r.aiSentiment || 'neutral'] || 0) + 1
      return acc
    }, {})

    const sentimentBreakdown = {
      positive: Math.round((sentimentCounts.positive || 0) / totalReviews * 100),
      neutral: Math.round((sentimentCounts.neutral || 0) / totalReviews * 100),
      negative: Math.round((sentimentCounts.negative || 0) / totalReviews * 100),
    }

    // Extract common keywords
    const allKeywords = reviews.flatMap(r => r.aiKeywords)
    const keywordCounts = allKeywords.reduce((acc: any, keyword) => {
      acc[keyword] = (acc[keyword] || 0) + 1
      return acc
    }, {})

    // Separate positive and negative mentions
    const positiveKeywords = ['tuyệt vời', 'tốt', 'đẹp', 'sạch sẽ', 'nhiệt tình', 'amazing', 'great', 'excellent', 'clean', 'beautiful']
    const negativeKeywords = ['tệ', 'bẩn', 'xấu', 'thất vọng', 'bad', 'dirty', 'terrible', 'disappointed']

    const topPositives = Object.entries(keywordCounts)
      .filter(([key]) => positiveKeywords.includes(key))
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 5)
      .map(([keyword, count]) => ({
        keyword,
        count,
        percentage: Math.round((count as number) / totalReviews * 100),
      }))

    const topNegatives = Object.entries(keywordCounts)
      .filter(([key]) => negativeKeywords.includes(key))
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 5)
      .map(([keyword, count]) => ({
        keyword,
        count,
        percentage: Math.round((count as number) / totalReviews * 100),
      }))

    // Generate AI summary
    let summary = ''
    if (averageRating >= 4.5) {
      summary = `Khách hàng rất hài lòng với chỗ nghỉ này (${averageRating.toFixed(1)}/5). `
    } else if (averageRating >= 4) {
      summary = `Khách hàng đánh giá tốt về chỗ nghỉ này (${averageRating.toFixed(1)}/5). `
    } else if (averageRating >= 3) {
      summary = `Khách hàng có đánh giá trung bình về chỗ nghỉ này (${averageRating.toFixed(1)}/5). `
    } else {
      summary = `Chỗ nghỉ cần cải thiện (${averageRating.toFixed(1)}/5). `
    }

    // Add top positive mentions
    if (topPositives.length > 0) {
      summary += `${sentimentBreakdown.positive}% khách khen về: ${topPositives.map(p => p.keyword).join(', ')}. `
    }

    // Add concerns if any
    if (topNegatives.length > 0) {
      summary += `Một số khách góp ý về: ${topNegatives.map(n => n.keyword).join(', ')}. `
    }

    // Highlight best categories
    const bestCategory = Object.entries(categoryRatings)
      .filter(([_, rating]) => rating > 0)
      .sort((a: any, b: any) => b[1] - a[1])[0]

    if (bestCategory) {
      const categoryNames: any = {
        cleanliness: 'độ sạch sẽ',
        accuracy: 'mô tả chính xác',
        checkIn: 'thủ tục nhận phòng',
        communication: 'giao tiếp',
        location: 'vị trí',
        value: 'giá trị',
      }
      summary += `Điểm mạnh nhất là ${categoryNames[bestCategory[0]]} (${bestCategory[1].toFixed(1)}/5).`
    }

    return NextResponse.json({
      summary,
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10,
      sentimentBreakdown,
      topPositives,
      topNegatives,
      categoryRatings,
    })
  } catch (error) {
    console.error('AI summary error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function calculateAverage(reviews: any[], field: string): number {
  const validReviews = reviews.filter(r => r[field] != null)
  if (validReviews.length === 0) return 0
  const sum = validReviews.reduce((acc, r) => acc + r[field], 0)
  return Math.round((sum / validReviews.length) * 10) / 10
}
