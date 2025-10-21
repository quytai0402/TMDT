import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generatePricingSuggestions } from '@/lib/ai'

interface PricingSuggestion {
  suggestedPrice: number
  reasoning: string
  adjustmentPercentage: number
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { listingId } = body as { listingId?: string }

    if (!listingId) {
      return NextResponse.json({ error: 'Listing ID is required' }, { status: 400 })
    }

    // Get listing
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        bookings: {
          where: {
            status: { in: ['CONFIRMED', 'COMPLETED'] },
            checkOut: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }, // Last 90 days
          },
        },
      },
    })

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    if (listing.hostId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Calculate occupancy rate
    const totalDays = 90
    const bookedDays = listing.bookings.reduce((sum, booking) => {
      const days = Math.ceil(
        (booking.checkOut.getTime() - booking.checkIn.getTime()) / (1000 * 60 * 60 * 24)
      )
      return sum + days
    }, 0)
    const occupancyRate = totalDays > 0 ? (bookedDays / totalDays) * 100 : 0

    // Find similar listings (competitors)
    const competitors = await prisma.listing.findMany({
      where: {
        city: listing.city,
        propertyType: listing.propertyType,
        maxGuests: {
          gte: listing.maxGuests - 2,
          lte: listing.maxGuests + 2,
        },
        status: 'ACTIVE',
        id: { not: listing.id },
      },
      select: {
        basePrice: true,
        occupancyRate: true,
      },
      take: 10,
    })

    const competitorPrices = competitors.map(c => c.basePrice).filter(price => typeof price === 'number')

    // Determine season
    const month = new Date().getMonth()
    let season = 'low'
    if ([6, 7, 8, 11, 12].includes(month)) {
      season = 'peak' // Summer and year-end holidays
    } else if ([3, 4, 5, 9, 10].includes(month)) {
      season = 'high'
    }

    // Mock upcoming events (in production, integrate with events API)
    const upcomingEvents: string[] = []
    if (listing.city.toLowerCase().includes('da nang')) {
      upcomingEvents.push('Fireworks Festival')
    }

    // Rule-based pricing suggestions
    let suggestedPrice = listing.basePrice
    let adjustmentPercentage = 0
    let reasoning = ''

    // Occupancy-based adjustment
    if (occupancyRate < 60) {
      adjustmentPercentage -= 15
      reasoning = 'Tỷ lệ lấp đầy thấp (dưới 60%), giảm giá để thu hút khách. '
    } else if (occupancyRate > 85) {
      adjustmentPercentage += 20
      reasoning = 'Tỷ lệ lấp đầy cao (trên 85%), tăng giá để tối ưu doanh thu. '
    }

    // Season adjustment
    if (season === 'peak') {
      adjustmentPercentage += 30
      reasoning += 'Mùa cao điểm, nhu cầu lớn. '
    } else if (season === 'low') {
      adjustmentPercentage -= 10
      reasoning += 'Mùa thấp điểm. '
    }

    // Event adjustment
    if (upcomingEvents.length > 0) {
      adjustmentPercentage += 25
      reasoning += `Sự kiện đặc biệt sắp diễn ra: ${upcomingEvents.join(', ')}. `
    }

    // Competitor comparison
    if (competitorPrices.length > 0) {
      const avgCompetitorPrice = competitorPrices.reduce((a, b) => a + b, 0) / competitorPrices.length
      if (listing.basePrice > avgCompetitorPrice * 1.2) {
        adjustmentPercentage -= 10
        reasoning += 'Giá cao hơn đối thủ đáng kể. '
      } else if (listing.basePrice < avgCompetitorPrice * 0.8) {
        adjustmentPercentage += 10
        reasoning += 'Giá thấp hơn đối thủ, có thể tăng. '
      }
    }

    suggestedPrice = Math.round(listing.basePrice * (1 + adjustmentPercentage / 100))

    // Use AI for more sophisticated analysis (if available)
    let aiSuggestion: PricingSuggestion | null = null
    try {
      if (process.env.OPENAI_API_KEY && competitorPrices.length > 0) {
        const response = await generatePricingSuggestions({
          basePrice: listing.basePrice,
          propertyType: listing.propertyType,
          city: listing.city,
          season,
          events: upcomingEvents,
          occupancyRate,
          competitorPrices,
        })
        aiSuggestion = sanitizePricingSuggestion(response)
      }
    } catch (error) {
      console.log('AI pricing not available', error)
    }

    // Historical pricing data
    const pricingHistory = await prisma.pricingRule.findMany({
      where: { listingId: listing.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    return NextResponse.json({
      currentPrice: listing.basePrice,
      suggestedPrice: aiSuggestion?.suggestedPrice || suggestedPrice,
      adjustmentPercentage: aiSuggestion?.adjustmentPercentage || adjustmentPercentage,
      reasoning: aiSuggestion?.reasoning || reasoning,
      analysis: {
        occupancyRate: Math.round(occupancyRate * 10) / 10,
        season,
        upcomingEvents,
        competitorAnalysis: {
          averagePrice: competitorPrices.length > 0 
            ? Math.round(competitorPrices.reduce((a, b) => a + b, 0) / competitorPrices.length)
            : null,
          minPrice: competitorPrices.length > 0 ? Math.min(...competitorPrices) : null,
          maxPrice: competitorPrices.length > 0 ? Math.max(...competitorPrices) : null,
          totalCompetitors: competitorPrices.length,
        },
      },
      pricingHistory,
    })
  } catch (error) {
    console.error('Pricing suggestions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function sanitizePricingSuggestion(suggestion: PricingSuggestion): PricingSuggestion {
  const normalizedPrice = Number(suggestion.suggestedPrice)
  const normalizedAdjustment = Number(suggestion.adjustmentPercentage)

  return {
    suggestedPrice: Number.isFinite(normalizedPrice)
      ? Math.round(normalizedPrice)
      : Math.round(suggestion.suggestedPrice),
    reasoning: suggestion.reasoning || 'Không có giải thích từ AI',
    adjustmentPercentage: Number.isFinite(normalizedAdjustment)
      ? normalizedAdjustment
      : 0,
  }
}
