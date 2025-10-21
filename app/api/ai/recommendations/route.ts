import type { Listing, Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateRecommendations } from '@/lib/ai'

interface RecommendationInsight {
  [key: string]: unknown
}

interface UserHistoryEntry {
  city: string
  propertyType: Listing['propertyType']
  priceRange: 'budget' | 'mid' | 'luxury'
}

interface PreferenceSummary {
  favoriteCity: string | null
  favoritePropertyType: Listing['propertyType'] | null
  averagePriceRange: number
  preferredAmenities: string[]
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's booking history
    const bookings = await prisma.booking.findMany({
      where: {
        guestId: session.user.id,
        status: 'COMPLETED',
      },
      include: {
        listing: {
          select: {
            city: true,
            propertyType: true,
            basePrice: true,
            amenities: true,
          },
        },
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
    })

    // If no history, return popular listings
    if (bookings.length === 0) {
      const popularListings = await prisma.listing.findMany({
        where: { status: 'ACTIVE' },
        orderBy: [
          { averageRating: 'desc' },
          { totalBookings: 'desc' },
        ],
        take: 20,
        include: {
          host: {
            select: {
              id: true,
              name: true,
              image: true,
              isSuperHost: true,
            },
          },
        },
      })

      return NextResponse.json({
        type: 'popular',
        message: 'Các chỗ nghỉ phổ biến',
        listings: popularListings,
      })
    }

    // Analyze user preferences
    const userHistory: UserHistoryEntry[] = bookings.map(b => ({
      city: b.listing.city,
      propertyType: b.listing.propertyType,
      priceRange: b.listing.basePrice < 1000000 ? 'budget' : 
                  b.listing.basePrice < 2000000 ? 'mid' : 'luxury',
    }))

    // Get all unique amenities from user's history
    const preferredAmenities: string[] = Array.from(
      new Set(bookings.flatMap(b => b.listing.amenities))
    )

    // Use AI to generate recommendations (if API key available)
    let aiRecommendations: RecommendationInsight | null = null
    try {
      if (process.env.OPENAI_API_KEY) {
        const aiResult = await generateRecommendations({
          userHistory,
          preferences: preferredAmenities,
        })
        const parsed = safeParseJSON<RecommendationInsight>(aiResult)
        if (parsed) {
          aiRecommendations = parsed
        }
      }
    } catch (error) {
      console.log('AI recommendations not available, using rule-based', error)
    }

    // Find similar listings based on preferences
    const cityPreference = getMostFrequent(bookings.map(b => b.listing.city))
    const typePreference = getMostFrequent(bookings.map(b => b.listing.propertyType))
    const avgPrice =
      bookings.reduce((sum, b) => sum + b.listing.basePrice, 0) / (bookings.length || 1)

    const orConditions: Prisma.ListingWhereInput[] = [
      {
        basePrice: {
          gte: avgPrice * 0.7,
          lte: avgPrice * 1.3,
        },
      },
    ]

    if (cityPreference) {
      orConditions.push({ city: cityPreference })
    }

    if (typePreference) {
      orConditions.push({ propertyType: typePreference })
    }

    const recommendedListings = await prisma.listing.findMany({
      where: {
        status: 'ACTIVE',
        OR: orConditions,
        id: {
          notIn: bookings.map(b => b.listingId),
        },
      },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            image: true,
            isSuperHost: true,
          },
        },
      },
      take: 20,
      orderBy: { averageRating: 'desc' },
    })

    // Filter by preferred amenities
    const filteredListings = recommendedListings.filter(listing => {
      const matchCount = preferredAmenities.filter(amenity => 
        listing.amenities.includes(amenity)
      ).length
      return matchCount >= Math.min(2, preferredAmenities.length)
    })

    return NextResponse.json({
      type: 'personalized',
      message: 'Gợi ý dành riêng cho bạn',
      preferences: formatPreferenceSummary({
        favoriteCity: cityPreference,
        favoritePropertyType: typePreference,
        averagePriceRange: avgPrice,
        preferredAmenities: preferredAmenities.slice(0, 5),
      }),
      aiInsights: aiRecommendations,
      listings: filteredListings.length > 0 ? filteredListings : recommendedListings,
    })
  } catch (error) {
    console.error('Recommendations error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getMostFrequent<T>(arr: T[]): T | null {
  if (arr.length === 0) {
    return null
  }

  const counts = arr.reduce<Record<string, { value: T; count: number }>>((acc, item) => {
    const key = String(item)
    const existing = acc[key]
    if (existing) {
      existing.count += 1
    } else {
      acc[key] = { value: item, count: 1 }
    }
    return acc
  }, {})

  const [topEntry] = Object.values(counts).sort((a, b) => b.count - a.count)
  return topEntry ? topEntry.value : null
}

function safeParseJSON<T>(raw: string): T | null {
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') {
      return parsed as T
    }
    return null
  } catch {
    return null
  }
}

function formatPreferenceSummary(summary: PreferenceSummary) {
  return {
    favoriteCity: summary.favoriteCity,
    favoritePropertyType: summary.favoritePropertyType,
    averagePriceRange: Math.round(summary.averagePriceRange),
    preferredAmenities: summary.preferredAmenities.filter(Boolean),
  }
}
