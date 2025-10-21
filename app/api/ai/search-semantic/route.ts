import type { Prisma, PropertyType } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { semanticSearch } from '@/lib/ai'
import { prisma } from '@/lib/prisma'

interface SemanticSearchParams {
  location?: string
  propertyType?: string
  guests?: number
  priceRange?: {
    min?: number
    max?: number
  }
  amenities?: string[]
}

const PROPERTY_TYPE_MAP: Record<string, string> = {
  villa: 'VILLA',
  'biệt thự': 'VILLA',
  apartment: 'APARTMENT',
  'căn hộ': 'APARTMENT',
  house: 'HOUSE',
  'nhà riêng': 'HOUSE',
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { query } = body

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    // Use AI to parse natural language query
    let searchParams: SemanticSearchParams = {}

    try {
      if (process.env.OPENAI_API_KEY) {
        const aiResult = await semanticSearch(query)
        const parsed = safeParseSemanticParams(aiResult)
        if (parsed) {
          searchParams = parsed
        } else {
          searchParams = parseQueryKeywords(query)
        }
      } else {
        searchParams = parseQueryKeywords(query)
      }
    } catch (error) {
      console.log('AI parsing not available, using keyword matching', error)
      // Fallback to simple keyword matching
      searchParams = parseQueryKeywords(query)
    }

    // Build Prisma query
    const where: Prisma.ListingWhereInput = {
      status: 'ACTIVE',
    }

    if (searchParams.location?.trim()) {
      const locationValue = searchParams.location.trim()
      where.OR = [
        { city: { contains: locationValue, mode: 'insensitive' } },
        { address: { contains: locationValue, mode: 'insensitive' } },
      ]
    }

    if (searchParams.propertyType) {
      const normalized = PROPERTY_TYPE_MAP[searchParams.propertyType.toLowerCase()] || searchParams.propertyType.toUpperCase()
      where.propertyType = normalized as PropertyType
    }

    if (typeof searchParams.guests === 'number' && !Number.isNaN(searchParams.guests)) {
      where.maxGuests = { gte: searchParams.guests }
    }

    if (searchParams.priceRange) {
      const priceFilter: Prisma.FloatFilter = {}
      if (typeof searchParams.priceRange.min === 'number') {
        priceFilter.gte = searchParams.priceRange.min
      }
      if (typeof searchParams.priceRange.max === 'number') {
        priceFilter.lte = searchParams.priceRange.max
      }
      if (Object.keys(priceFilter).length > 0) {
        where.basePrice = priceFilter
      }
    }

    // Search listings
    let listings = await prisma.listing.findMany({
      where,
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

    // Filter by amenities if specified
    const amenityKeywords = searchParams.amenities?.filter(Boolean) ?? []
    if (amenityKeywords.length > 0) {
      const amenityConditions = amenityKeywords.map(keyword => ({
        OR: [
          { name: { contains: keyword, mode: 'insensitive' as const } },
          { nameVi: { contains: keyword, mode: 'insensitive' as const } },
        ],
      }))

      if (amenityConditions.length > 0) {
        const matchingAmenities = await prisma.amenity.findMany({
          where: { OR: amenityConditions },
          select: { id: true },
        })

        const amenityIds = new Set(matchingAmenities.map(amenity => amenity.id))

        if (amenityIds.size > 0) {
          listings = listings.filter(listing =>
            listing.amenities.some(amenityId => amenityIds.has(amenityId))
          )
        }
      }
    }

    return NextResponse.json({
      query,
      parsedParams: searchParams,
      totalResults: listings.length,
      listings,
    })
  } catch (error) {
    console.error('Semantic search error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Simple keyword-based parsing as fallback
function parseQueryKeywords(query: string): SemanticSearchParams {
  const params: SemanticSearchParams = { amenities: [] }
  const lowerQuery = query.toLowerCase()

  // Extract location
  const cities = ['hà nội', 'sài gòn', 'đà nẵng', 'nha trang', 'phú quốc', 'đà lạt', 'vũng tàu', 'hội an']
  for (const city of cities) {
    if (lowerQuery.includes(city)) {
      params.location = city
      break
    }
  }

  // Extract property type
  if (lowerQuery.includes('villa') || lowerQuery.includes('biệt thự')) {
    params.propertyType = 'VILLA'
  } else if (lowerQuery.includes('apartment') || lowerQuery.includes('căn hộ')) {
    params.propertyType = 'APARTMENT'
  } else if (lowerQuery.includes('house') || lowerQuery.includes('nhà')) {
    params.propertyType = 'HOUSE'
  }

  // Extract guest count
  const guestMatch = query.match(/(\d+)\s*(người|guests?|pax)/i)
  if (guestMatch) {
    params.guests = Number.parseInt(guestMatch[1], 10)
  }

  // Extract amenities
  if (lowerQuery.includes('hồ bơi') || lowerQuery.includes('pool')) {
    params.amenities.push('pool')
  }
  if (lowerQuery.includes('biển') || lowerQuery.includes('beach')) {
    params.amenities.push('beach')
  }
  if (lowerQuery.includes('wifi')) {
    params.amenities.push('wifi')
  }
  if (lowerQuery.includes('bếp') || lowerQuery.includes('kitchen')) {
    params.amenities.push('kitchen')
  }

  return params
}

function safeParseSemanticParams(raw: string): SemanticSearchParams | null {
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') {
      return null
    }

    const {
      location,
      propertyType,
      guests,
      priceRange,
      amenities,
    } = parsed as Record<string, unknown>

    const normalized: SemanticSearchParams = {}

    if (typeof location === 'string') {
      normalized.location = location
    }

    if (typeof propertyType === 'string') {
      normalized.propertyType = propertyType
    }

    if (typeof guests === 'number') {
      normalized.guests = guests
    } else if (typeof guests === 'string' && guests.trim() !== '' && !Number.isNaN(Number.parseInt(guests, 10))) {
      normalized.guests = Number.parseInt(guests, 10)
    }

    if (priceRange && typeof priceRange === 'object') {
      const range = priceRange as Record<string, unknown>
      const min = typeof range.min === 'number' ? range.min : Number(range.min)
      const max = typeof range.max === 'number' ? range.max : Number(range.max)

      normalized.priceRange = {}
      if (!Number.isNaN(min)) {
        normalized.priceRange.min = Number(min)
      }
      if (!Number.isNaN(max)) {
        normalized.priceRange.max = Number(max)
      }

      if (
        normalized.priceRange.min === undefined &&
        normalized.priceRange.max === undefined
      ) {
        delete normalized.priceRange
      }
    }

    if (Array.isArray(amenities)) {
      normalized.amenities = amenities
        .filter((item): item is string => typeof item === 'string' && item.trim() !== '')
        .map(item => item.trim())
    }

    return normalized
  } catch {
    return null
  }
}
