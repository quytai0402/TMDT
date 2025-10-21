import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type ReviewRecord = {
  id: string
  overallRating: number | null
  cleanlinessRating: number | null
  accuracyRating: number | null
  checkInRating: number | null
  communicationRating: number | null
  locationRating: number | null
  valueRating: number | null
  comment: string | null
  aiSentiment: string | null
  createdAt: Date
}

type TrendPoint = {
  month: string
  averageRating: number
}

type CategoryKey =
  | 'cleanliness'
  | 'accuracy'
  | 'checkIn'
  | 'communication'
  | 'location'
  | 'value'

const CATEGORY_FIELDS: Record<CategoryKey, keyof ReviewRecord> = {
  cleanliness: 'cleanlinessRating',
  accuracy: 'accuracyRating',
  checkIn: 'checkInRating',
  communication: 'communicationRating',
  location: 'locationRating',
  value: 'valueRating',
}

const SENTIMENT_MAP: Record<string, number> = {
  positive: 1,
  neutral: 0.5,
  negative: 0.1,
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listingId } = await context.params
    const { searchParams } = new URL(req.url)
    const requestedCity = searchParams.get('city') ?? undefined

    if (!listingId) {
      return NextResponse.json({ error: 'Missing listingId parameter' }, { status: 400 })
    }

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: {
        city: true,
        reviews: {
          select: {
            id: true,
            overallRating: true,
            cleanlinessRating: true,
            accuracyRating: true,
            checkInRating: true,
            communicationRating: true,
            locationRating: true,
            valueRating: true,
            comment: true,
            aiSentiment: true,
            createdAt: true,
          },
        },
      },
    })

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    const city = requestedCity ?? listing.city ?? ''
    const reviews: ReviewRecord[] = listing.reviews || []
    const totalReviews = reviews.length

    if (totalReviews === 0) {
      return NextResponse.json({
        sentimentScore: 0,
        totalReviews: 0,
        categories: {
          cleanliness: 0,
          accuracy: 0,
          checkIn: 0,
          communication: 0,
          location: 0,
          value: 0,
        },
        highlights: [],
        improvements: [],
        aiSummary: `Chưa có đánh giá nào cho chỗ nghỉ tại ${city}. Hãy là người đầu tiên chia sẻ trải nghiệm của bạn!`,
        trends: [],
      })
    }

    const overallAverage =
      reviews.reduce((sum, review) => sum + (review.overallRating ?? 0), 0) / totalReviews

    const sentimentScore =
      reviews.reduce((sum, review) => {
        if (review.aiSentiment && SENTIMENT_MAP[review.aiSentiment]) {
          return sum + SENTIMENT_MAP[review.aiSentiment]
        }
        return sum + (review.overallRating ?? 0) / 5
      }, 0) / totalReviews

    const categoryScores = reviews.reduce(
      (acc, review) => {
        Object.entries(CATEGORY_FIELDS).forEach(([category, field]) => {
          const value = review[field as keyof typeof review]
          if (typeof value === 'number') {
            acc[category as CategoryKey].total += value
            acc[category as CategoryKey].count += 1
          }
        })
        return acc
      },
      {
        cleanliness: { total: 0, count: 0 },
        accuracy: { total: 0, count: 0 },
        checkIn: { total: 0, count: 0 },
        communication: { total: 0, count: 0 },
        location: { total: 0, count: 0 },
        value: { total: 0, count: 0 },
      } as Record<CategoryKey, { total: number; count: number }>
    )

    const categories = Object.entries(categoryScores).reduce(
      (acc, [key, { total, count }]) => {
        const average = count > 0 ? total / count : overallAverage
        acc[key as CategoryKey] = Number(average.toFixed(2))
        return acc
      },
      {} as Record<CategoryKey, number>
    )

    const sortedByRating = [...reviews].sort(
      (a, b) => (b.overallRating ?? 0) - (a.overallRating ?? 0)
    )
    const positiveComments = sortedByRating
      .filter((review) => (review.overallRating ?? 0) >= 4.5)
      .slice(0, 3)
      .map((review) => review.comment)
      .filter(Boolean)

    const negativeComments = [...reviews]
      .filter((review) => (review.overallRating ?? 0) <= 3.5)
      .slice(0, 3)
      .map((review) => review.comment)
      .filter(Boolean)

    const highlightFallback =
      positiveComments.length > 0
        ? positiveComments
        : [`Khách hàng đánh giá rất cao trải nghiệm tại ${city}.`]

    const improvementFallback =
      negativeComments.length > 0
        ? negativeComments
        : ['Tiếp tục duy trì chất lượng dịch vụ hiện tại để giữ sự hài lòng của khách.']

    const trends = buildMonthlyTrends(reviews)

    const aiSummary =
      process.env.OPENAI_API_KEY && totalReviews >= 3
        ? await generateAISummary({
            city,
            totalReviews,
            averageRating: overallAverage,
            highlights: highlightFallback,
            improvements: improvementFallback,
          })
        : buildHeuristicSummary({
            city,
            totalReviews,
            averageRating: overallAverage,
            sentimentScore,
            topHighlight: highlightFallback[0],
          })

    return NextResponse.json({
      sentimentScore,
      totalReviews,
      categories,
      highlights: highlightFallback,
      improvements: improvementFallback,
      aiSummary,
      trends,
    })
  } catch (error) {
    console.error('Error analyzing reviews:', error)
    return NextResponse.json({ error: 'Failed to analyze reviews' }, { status: 500 })
  }
}

function buildMonthlyTrends(reviews: ReviewRecord[]): TrendPoint[] {
  const buckets = new Map<string, { total: number; count: number }>()

  reviews.forEach((review) => {
    const monthKey = new Date(review.createdAt).toISOString().slice(0, 7) // YYYY-MM
    const bucket = buckets.get(monthKey) ?? { total: 0, count: 0 }
    bucket.total += review.overallRating ?? 0
    bucket.count += 1
    buckets.set(monthKey, bucket)
  })

  return Array.from(buckets.entries())
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .map(([month, { total, count }]) => ({
      month,
      averageRating: Number(((count > 0 ? total / count : 0) || 0).toFixed(2)),
    }))
}

async function generateAISummary({
  city,
  totalReviews,
  averageRating,
  highlights,
  improvements,
}: {
  city: string
  totalReviews: number
  averageRating: number
  highlights: string[]
  improvements: string[]
}): Promise<string> {
  try {
    const { openai } = await import('@/lib/ai')
    const prompt = `Hãy đóng vai chuyên gia vận hành homestay và tóm tắt các đánh giá của khách.
Thành phố: ${city}
Số lượng đánh giá: ${totalReviews}
Điểm trung bình: ${averageRating.toFixed(1)}/5
Điểm nổi bật:
- ${highlights.join('\n- ')}
Điểm cần cải thiện:
- ${improvements.join('\n- ')}

Hãy viết đoạn tóm tắt 3-4 câu bằng tiếng Việt, ngắn gọn, tích cực nhưng trung thực.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6,
      max_tokens: 220,
    })

    const summary = completion.choices[0].message.content?.trim()
    if (summary) return summary
  } catch (error) {
    console.warn('AI summary generation fallback', error)
  }

  return buildHeuristicSummary({
    city,
    totalReviews,
    averageRating,
    sentimentScore: (averageRating || 0) / 5,
    topHighlight: highlights[0],
  })
}

function buildHeuristicSummary({
  city,
  totalReviews,
  averageRating,
  sentimentScore,
  topHighlight,
}: {
  city: string
  totalReviews: number
  averageRating: number
  sentimentScore: number
  topHighlight: string
}): string {
  const positivity =
    sentimentScore >= 0.9
      ? 'mọi người cực kỳ hài lòng'
      : sentimentScore >= 0.8
      ? 'đa số khách đánh giá rất tích cực'
      : sentimentScore >= 0.7
      ? 'khách trải nghiệm tốt nhưng vẫn còn điểm cần cải thiện'
      : 'cần ưu tiên nâng cấp dịch vụ để tăng mức độ hài lòng'

  return `Tổng cộng ${totalReviews} đánh giá tại ${city} cho điểm trung bình ${averageRating.toFixed(
    1
  )}/5, chứng tỏ ${positivity}. Điểm được nhắc tới nhiều nhất là: ${topHighlight}.`
}
