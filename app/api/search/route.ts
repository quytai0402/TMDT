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
    const regionParam = normalizeRegionInput(searchParams.get('region'))
    const checkIn = searchParams.get('checkIn')
    const checkOut = searchParams.get('checkOut')
    const guests = parseInt(searchParams.get('guests') || '1')
    
    // Advanced filters
    const minPrice = parseFloat(searchParams.get('minPrice') || '0')
    const maxPrice = parseFloat(searchParams.get('maxPrice') || '999999999')
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

    if (city) {
      where.city = { contains: city, mode: 'insensitive' }
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

    if (propertyTypes && propertyTypes.length > 0) {
      where.propertyType = { in: propertyTypes }
    }

    if (bedrooms > 0) {
      where.bedrooms = { gte: bedrooms }
    }

    if (bathrooms > 0) {
      where.bathrooms = { gte: bathrooms }
    }

    where.basePrice = {
      gte: minPrice,
      lte: maxPrice,
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
      const listingsWithConflicts = await prisma.listing.findMany({
        where: {
          id: { in: listings.map((l) => l.id) },
          OR: [
            {
              bookings: {
                some: {
                  status: { in: ['CONFIRMED', 'PENDING'] },
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
