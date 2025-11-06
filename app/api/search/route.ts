import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateDistance } from '@/lib/helpers'
import { getPersona } from '@/lib/personas'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getMembershipForUser } from '@/lib/membership'
import { DESTINATIONS } from '@/data/destinations'

const REGION_ALIASES: Record<string, string> = {
  north: 'north',
  mienbac: 'north',
  'mien-bac': 'north',
  central: 'central',
  mientrung: 'central',
  'mien-trung': 'central',
  south: 'south',
  miennam: 'south',
  'mien-nam': 'south',
  highlands: 'highlands',
  taynguyen: 'highlands',
  'tay-nguyen': 'highlands',
  islands: 'islands',
  haiquan: 'islands',
}

const REGION_MAP = DESTINATIONS.reduce<Record<string, Set<string>>>((acc, destination) => {
  const region = destination.region
  if (!acc[region]) {
    acc[region] = new Set()
  }
  destination.stays.forEach((stay) => {
    if (stay.city) {
      acc[region].add(stay.city)
    }
  })
  // fallback to the destination name if no stay is defined
  if (!destination.stays.length) {
    acc[region].add(destination.name)
  }
  return acc
}, {})

const DESTINATION_LOOKUP = DESTINATIONS.map((destination) => {
  const normalizedName = normalizeRegionInput(destination.name) ?? destination.name.toLowerCase()
  const normalizedKeywords = destination.keywords
    .map((keyword) => normalizeRegionInput(keyword))
    .filter((value): value is string => Boolean(value))
  const cities = Array.from(new Set(destination.stays.map((stay) => stay.city)))
  if (!cities.length) {
    cities.push(destination.name)
  }
  return {
    slug: destination.slug,
    normalizedName,
    normalizedKeywords,
    cities,
  }
})

const FLEX_MODE_CONFIG: Record<string, { maxNights?: number; minNights?: number; maxPrice?: number; minGuests?: number }> = {
  weekends: { minNights: 1, maxNights: 4, maxPrice: 4000000, minGuests: 2 },
  weeks: { minNights: 3, maxNights: 10, maxPrice: 3000000, minGuests: 2 },
  month: { minNights: 7, maxNights: 21, maxPrice: 3500000, minGuests: 2 },
}

const FLEX_MONTH_CONFIG: Record<
  string,
  {
    region?: string
    maxPrice?: number
    minPrice?: number
  }
> = {
  jan: { region: 'south', maxPrice: 1200000 },
  feb: { region: 'south', maxPrice: 1300000 },
  mar: { region: 'central', maxPrice: 1100000 },
  apr: { region: 'central', maxPrice: 1400000 },
  may: { region: 'islands', maxPrice: 1300000 },
  jun: { region: 'islands', maxPrice: 1600000, minPrice: 600000 },
}

function parseTripLengthRange(value?: string | null) {
  if (!value) return null
  const normalized = value.trim()
  if (!normalized) return null
  const plusMatch = normalized.match(/^(\d+)\+$/)
  if (plusMatch) {
    return { minNights: parseInt(plusMatch[1], 10) || undefined }
  }
  const rangeMatch = normalized.match(/^(\d+)\s*-\s*(\d+)$/)
  if (rangeMatch) {
    const min = parseInt(rangeMatch[1], 10)
    const max = parseInt(rangeMatch[2], 10)
    return {
      minNights: Number.isFinite(min) ? min : undefined,
      maxNights: Number.isFinite(max) ? max : undefined,
    }
  }
  return null
}

const INTENT_FILTERS: Record<
  string,
  {
    region?: string
    cities?: string[]
    minGuests?: number
    minBedrooms?: number
    propertyTypes?: string[]
    maxPrice?: number
    requiresPool?: boolean
  }
> = {
  'family-fun': {
    region: 'south',
    minGuests: 6,
    minBedrooms: 3,
    propertyTypes: ['VILLA', 'HOUSE', 'BUNGALOW'],
    requiresPool: true,
  },
  'coastal-retreat': {
    region: 'islands',
    propertyTypes: ['VILLA', 'BUNGALOW', 'HOUSE'],
    maxPrice: 6000000,
  },
  'executive-workation': {
    minGuests: 2,
    minBedrooms: 1,
    propertyTypes: ['APARTMENT', 'CONDO', 'LOFT', 'STUDIO'],
    maxPrice: 3500000,
  },
  'wellness-retreat': {
    region: 'highlands',
    minGuests: 2,
    minBedrooms: 2,
    propertyTypes: ['VILLA', 'BUNGALOW', 'HOUSE'],
  },
  'personalized': {
    propertyTypes: ['VILLA', 'APARTMENT', 'HOUSE', 'BUNGALOW'],
  },
}

function normalizeRegionInput(value: string | null): string | null {
  if (!value) return null
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, '')
    .replace(/-/g, '')
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    
    const rawQuery = searchParams.get('q') || ''
    const query = rawQuery.trim()
    const city = searchParams.get('city')
    let regionParam = normalizeRegionInput(searchParams.get('region'))
    const checkIn = searchParams.get('checkIn')
    const checkOut = searchParams.get('checkOut')
    const guests = parseInt(searchParams.get('guests') || '1')
    const flexible = searchParams.get('flexible') === 'true'
    const flexModeParam = searchParams.get('flexMode') ?? undefined
    const tripLengthRaw = searchParams.get('tripLength') ?? undefined
    const flexDurationParam = searchParams.get('duration') ?? undefined
    const flexMonthParam = searchParams.get('month')?.toLowerCase() ?? null
    const parsedTripLength = parseTripLengthRange(tripLengthRaw ?? flexDurationParam)
    let requestedMinNights = parsedTripLength?.minNights
    let requestedMaxNights = parsedTripLength?.maxNights
    const intentParam = searchParams.get('intent')?.toLowerCase() ?? null
    const intentFilters = intentParam ? INTENT_FILTERS[intentParam] ?? null : null

    // Advanced filters
    const minPrice = parseFloat(searchParams.get('minPrice') || '0')
    let maxPrice = parseFloat(searchParams.get('maxPrice') || '999999999')
    const propertyTypes = searchParams.get('propertyTypes')?.split(',')
    const amenities = searchParams.get('amenities')?.split(',')
    const bedrooms = parseInt(searchParams.get('bedrooms') || '0')
    const bathrooms = parseInt(searchParams.get('bathrooms') || '0')
    
    // Location-based search
    const latitude = searchParams.get('lat')
    const longitude = searchParams.get('lng')
    const radius = parseFloat(searchParams.get('radius') || '10') // km
    
    // Policies
    const allowPets = searchParams.get('allowPets') === 'true'
    const instantBookable = searchParams.get('instantBookable') === 'true'
    
    // Sorting
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const personaSlug = searchParams.get('persona')
    const persona = personaSlug ? getPersona(personaSlug) : null
    const secretOnly = searchParams.get('secretOnly') === 'true'

    if (secretOnly) {
      const session = await getServerSession(authOptions)
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      const membership = await getMembershipForUser(session.user.id)
      const isAdmin = session.user.role === 'ADMIN'
      if (!membership?.isActive && !isAdmin) {
        return NextResponse.json({ error: 'Membership required' }, { status: 403 })
      }
    }
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    if (!regionParam && intentFilters?.region) {
      regionParam = normalizeRegionInput(intentFilters.region)
    }

    // Build where clause
    const where: any = {
      status: 'ACTIVE',
      maxGuests: { gte: guests },
    }

    where.isSecret = secretOnly ? true : false

    const normalizedQuery = normalizeRegionInput(query)
    const matchedDestination = DESTINATION_LOOKUP.find((item) => {
      if (!normalizedQuery) return false
      if (normalizeRegionInput(item.slug) === normalizedQuery) return true
      if (normalizeRegionInput(item.normalizedName) === normalizedQuery) return true
      return item.normalizedKeywords.some(
        (keyword) => normalizeRegionInput(keyword) === normalizedQuery
      )
    })

    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { city: { contains: query, mode: 'insensitive' } },
        { neighborhood: { contains: query, mode: 'insensitive' } },
      ]
    }

    const preferredCities = !city && intentFilters?.cities?.length ? intentFilters.cities : null
    const flexMonthConfig = flexMonthParam ? FLEX_MONTH_CONFIG[flexMonthParam] : null

    if (city) {
      where.city = { contains: city, mode: 'insensitive' }
    } else if (preferredCities) {
      where.city = {
        in: preferredCities,
        mode: 'insensitive',
      }
    } else if (matchedDestination && matchedDestination.cities.length > 0) {
      where.city = {
        in: matchedDestination.cities,
        mode: 'insensitive',
      }
    } else if (regionParam) {
      const normalizedRegion = REGION_ALIASES[regionParam] ?? regionParam
      const regionCities = REGION_MAP[normalizedRegion]
      if (regionCities && regionCities.size > 0) {
        where.city = {
          in: Array.from(regionCities),
          mode: 'insensitive',
        }
      }
    } else if (normalizedQuery && REGION_ALIASES[normalizedQuery]) {
      const alias = REGION_ALIASES[normalizedQuery]
      const regionCities = REGION_MAP[alias]
      if (regionCities && regionCities.size > 0) {
        where.city = {
          in: Array.from(regionCities),
          mode: 'insensitive',
        }
      }
    } else if (normalizedQuery && REGION_MAP[normalizedQuery]) {
      where.city = {
        in: Array.from(REGION_MAP[normalizedQuery]),
        mode: 'insensitive',
      }
    }

    if (!where.city && flexMonthConfig?.region) {
      const normalizedRegion = REGION_ALIASES[flexMonthConfig.region] ?? flexMonthConfig.region
      const regionCities = REGION_MAP[normalizedRegion]
      if (regionCities && regionCities.size > 0) {
        where.city = {
          in: Array.from(regionCities),
          mode: 'insensitive',
        }
      }
    }

    if (propertyTypes && propertyTypes.length > 0) {
      where.propertyType = { in: propertyTypes }
    } else if (intentFilters?.propertyTypes?.length) {
      where.propertyType = { in: intentFilters.propertyTypes }
    }

    if (bedrooms > 0) {
      where.bedrooms = { gte: bedrooms }
    }

    if (intentFilters?.minBedrooms) {
      const minBedrooms = intentFilters.minBedrooms
      const current = typeof where.bedrooms?.gte === 'number' ? where.bedrooms.gte : 0
      if (!where.bedrooms || minBedrooms > current) {
        where.bedrooms = { gte: minBedrooms }
      }
    }

    if (bathrooms > 0) {
      where.bathrooms = { gte: bathrooms }
    }

    if (intentFilters?.maxPrice) {
      maxPrice = Math.min(maxPrice, intentFilters.maxPrice)
    }

    where.basePrice = {
      gte: minPrice,
      lte: maxPrice,
    }

    if (flexMonthConfig?.maxPrice) {
      where.basePrice.lte = Math.min(where.basePrice.lte, flexMonthConfig.maxPrice)
    }

    if (flexMonthConfig?.minPrice) {
      where.basePrice.gte = Math.max(where.basePrice.gte, flexMonthConfig.minPrice)
    }

    if (intentFilters?.requiresPool) {
      where.amenities = {
        has: 'Hồ bơi',
      }
    }

    if (allowPets) {
      where.allowPets = true
    }

    if (instantBookable) {
      where.instantBookable = true
    }

    if (persona) {
      if (persona.filters.allowPets !== undefined) {
        where.allowPets = persona.filters.allowPets
      }

      if (persona.filters.propertyTypes?.length) {
        where.propertyType = { in: persona.filters.propertyTypes }
      }

      if (persona.filters.minBedrooms) {
        const current = typeof where.bedrooms?.gte === 'number' ? where.bedrooms.gte : 0
        where.bedrooms = { gte: Math.max(current, persona.filters.minBedrooms) }
      }

      if (persona.filters.minGuests) {
        const currentGuests = typeof where.maxGuests?.gte === 'number' ? where.maxGuests.gte : guests
        where.maxGuests = { gte: Math.max(currentGuests, persona.filters.minGuests) }
      }

      if (persona.filters.verifiedAmenities?.length) {
        where.verifiedAmenities = {
          hasSome: persona.filters.verifiedAmenities,
        }
      }

      if (persona.filters.hasSmartLock) {
        where.hasSmartLock = true
      }

      if (persona.filters.requireMonthlyDiscount) {
        where.monthlyDiscount = { gt: 0 }
      }

      if (persona.filters.requireWeeklyDiscount) {
        where.weeklyDiscount = { gt: 0 }
      }

      if (persona.filters.minimumRating) {
        where.averageRating = { gte: persona.filters.minimumRating }
      }

      if (persona.filters.allowEvents !== undefined) {
        where.allowEvents = persona.filters.allowEvents
      }
    }

    let orderings: any = [{ [sortBy]: sortOrder }]

    if (persona?.filters.sortPriority === 'monthlyDiscount') {
      orderings = [
        { monthlyDiscount: 'desc' },
        { weeklyDiscount: 'desc' },
        { averageRating: 'desc' },
        { createdAt: 'desc' },
      ]
    } else if (persona?.filters.sortPriority === 'rating') {
      orderings = [
        { averageRating: 'desc' },
        { totalReviews: 'desc' },
        { createdAt: 'desc' },
      ]
    } else if (persona?.filters.sortPriority === 'price') {
      orderings = [
        { basePrice: 'asc' },
        { averageRating: 'desc' },
      ]
    } else if (persona?.filters.sortPriority === 'recent') {
      orderings = [
        { createdAt: 'desc' },
        { averageRating: 'desc' },
      ]
    }

    if (flexible) {
      const flexConfig = FLEX_MODE_CONFIG[flexModeParam ?? 'weekends']
      if (flexConfig?.maxNights) {
        requestedMaxNights =
          typeof requestedMaxNights === 'number'
            ? Math.min(requestedMaxNights, flexConfig.maxNights)
            : flexConfig.maxNights
      }
      if (flexConfig?.minNights) {
        requestedMinNights =
          typeof requestedMinNights === 'number'
            ? Math.max(requestedMinNights, flexConfig.minNights)
            : flexConfig.minNights
      }
      if (flexConfig?.maxPrice) {
        where.basePrice.lte = Math.min(where.basePrice.lte, flexConfig.maxPrice)
      }
      if (flexConfig?.minGuests) {
        const currentMin = typeof where.maxGuests?.gte === 'number' ? where.maxGuests.gte : guests
        where.maxGuests = { gte: Math.max(currentMin, flexConfig.minGuests) }
      }
      if (!Array.isArray(orderings) || orderings.length === 0) {
        orderings = [{ averageRating: 'desc' }, { basePrice: 'asc' }]
      } else {
        orderings.unshift({ averageRating: 'desc' })
      }
    }

    if (typeof requestedMaxNights === 'number') {
      const currentLte = typeof where.minNights?.lte === 'number' ? where.minNights.lte : Infinity
      const nextLte = Math.min(currentLte, requestedMaxNights)
      where.minNights = { lte: nextLte }
    }

    if (typeof requestedMinNights === 'number') {
      const currentGte = typeof where.maxNights?.gte === 'number' ? where.maxNights.gte : 0
      const nextGte = Math.max(currentGte, requestedMinNights)
      where.maxNights = { gte: nextGte }
    }

    if (intentFilters?.minGuests) {
      const currentMinGuests = typeof where.maxGuests?.gte === 'number' ? where.maxGuests.gte : guests
      where.maxGuests = { gte: Math.max(currentMinGuests, intentFilters.minGuests) }
    }

    // Fetch listings
    let listings = await prisma.listing.findMany({
      where,
      include: {
        host: {
          select: {
            id: true,
            name: true,
            image: true,
            isVerified: true,
            isSuperHost: true,
          },
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
      orderBy: orderings,
      skip,
      take: limit,
    })

    // Filter by amenities if provided
    if (amenities && amenities.length > 0) {
      listings = listings.filter((listing) =>
        amenities.every((amenity) => listing.amenities.includes(amenity))
      )
    }

    // Filter by location radius if coordinates provided
    if (latitude && longitude) {
      const lat = parseFloat(latitude)
      const lng = parseFloat(longitude)
      listings = listings.filter((listing) => {
        const distance = calculateDistance(lat, lng, listing.latitude, listing.longitude)
        return distance <= radius
      }).map((listing) => ({
        ...listing,
        distance: calculateDistance(lat, lng, listing.latitude, listing.longitude),
      }))
    }

    // Filter by availability if dates provided
    if (checkIn && checkOut) {
      const checkInDate = new Date(checkIn)
      const checkOutDate = new Date(checkOut)
      
      // Get listings with conflicting bookings or blocked dates
      // Only check CONFIRMED and COMPLETED bookings
      const listingsWithConflicts = await prisma.listing.findMany({
        where: {
          id: { in: listings.map((l) => l.id) },
          OR: [
            {
              bookings: {
                some: {
                  status: { in: ['CONFIRMED', 'COMPLETED'] },
                  OR: [
                    {
                      AND: [
                        { checkIn: { lte: checkInDate } },
                        { checkOut: { gte: checkInDate } },
                      ],
                    },
                    {
                      AND: [
                        { checkIn: { lte: checkOutDate } },
                        { checkOut: { gte: checkOutDate } },
                      ],
                    },
                    {
                      AND: [
                        { checkIn: { gte: checkInDate } },
                        { checkOut: { lte: checkOutDate } },
                      ],
                    },
                  ],
                },
              },
            },
            {
              blockedDates: {
                some: {
                  OR: [
                    {
                      AND: [
                        { startDate: { lte: checkInDate } },
                        { endDate: { gte: checkInDate } },
                      ],
                    },
                    {
                      AND: [
                        { startDate: { lte: checkOutDate } },
                        { endDate: { gte: checkOutDate } },
                      ],
                    },
                  ],
                },
              },
            },
          ],
        },
        select: { id: true },
      })

      const conflictIds = new Set(listingsWithConflicts.map((l) => l.id))
      listings = listings.filter((listing) => !conflictIds.has(listing.id))
    }

    // Get total count for pagination
    const total = await prisma.listing.count({ where })

    return NextResponse.json({
      listings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Đã có lỗi xảy ra khi tìm kiếm' },
      { status: 500 }
    )
  }
}
