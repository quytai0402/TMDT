import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateDistance } from '@/lib/helpers'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    
    // Basic filters
    const query = searchParams.get('q') || ''
    const city = searchParams.get('city')
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
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      status: 'ACTIVE',
      maxGuests: { gte: guests },
    }

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
      orderBy: {
        [sortBy]: sortOrder,
      },
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
