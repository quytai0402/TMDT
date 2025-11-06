import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/search/advanced - Advanced search with comprehensive filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    
    // Location filters
    const location = searchParams.get('location')
    const city = searchParams.get('city')
    const country = searchParams.get('country')
    const latitude = searchParams.get('latitude')
    const longitude = searchParams.get('longitude')
    const radius = parseInt(searchParams.get('radius') || '10') // km
    
    // Date filters
    const checkIn = searchParams.get('checkIn')
    const checkOut = searchParams.get('checkOut')
    
    // Guest count
    const guests = parseInt(searchParams.get('guests') || '1')
    
    // Price filters
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined
    
    // Property type filters
    const propertyType = searchParams.get('propertyType')
    const roomType = searchParams.get('roomType')
    
    // Amenities filters (comma-separated)
    const amenities = searchParams.get('amenities')?.split(',').filter(Boolean) || []
    
    // Room filters
    const bedrooms = searchParams.get('bedrooms') ? parseInt(searchParams.get('bedrooms')!) : undefined
    const beds = searchParams.get('beds') ? parseInt(searchParams.get('beds')!) : undefined
    const bathrooms = searchParams.get('bathrooms') ? parseFloat(searchParams.get('bathrooms')!) : undefined
    
    // Feature filters
    const instantBookable = searchParams.get('instantBookable') === 'true'
    const allowPets = searchParams.get('allowPets') === 'true'
    const allowSmoking = searchParams.get('allowSmoking') === 'true'
    const hasSmartLock = searchParams.get('hasSmartLock') === 'true'
    const hasPool = searchParams.get('hasPool') === 'true'
    const hasGym = searchParams.get('hasGym') === 'true'
    const hasParking = searchParams.get('hasParking') === 'true'
    const hasWifi = searchParams.get('hasWifi') === 'true'
    
    // Rating filter
    const minRating = searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')!) : undefined
    
    // Sorting
    const sortBy = searchParams.get('sortBy') || 'relevance' // relevance, price_low, price_high, rating, newest
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      status: 'ACTIVE',
      maxGuests: { gte: guests }
    }

    // Location filters
    if (city) {
      where.city = { contains: city, mode: 'insensitive' }
    }
    if (country) {
      where.country = { contains: country, mode: 'insensitive' }
    }
    if (location) {
      where.OR = [
        { city: { contains: location, mode: 'insensitive' } },
        { country: { contains: location, mode: 'insensitive' } },
        { state: { contains: location, mode: 'insensitive' } },
        { neighborhood: { contains: location, mode: 'insensitive' } }
      ]
    }

    // Geographic radius search
    if (latitude && longitude) {
      // This is a simplified radius search - for production use a proper geospatial index
      const lat = parseFloat(latitude)
      const lng = parseFloat(longitude)
      const latDelta = radius / 111 // 1 degree lat = ~111km
      const lngDelta = radius / (111 * Math.cos(lat * Math.PI / 180))
      
      where.latitude = { gte: lat - latDelta, lte: lat + latDelta }
      where.longitude = { gte: lng - lngDelta, lte: lng + lngDelta }
    }

    // Price filters
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.basePrice = {}
      if (minPrice !== undefined) where.basePrice.gte = minPrice
      if (maxPrice !== undefined) where.basePrice.lte = maxPrice
    }

    // Property type
    if (propertyType) {
      where.propertyType = propertyType
    }
    if (roomType) {
      where.roomType = roomType
    }

    // Room count filters
    if (bedrooms !== undefined) {
      where.bedrooms = { gte: bedrooms }
    }
    if (beds !== undefined) {
      where.beds = { gte: beds }
    }
    if (bathrooms !== undefined) {
      where.bathrooms = { gte: bathrooms }
    }

    // Feature filters
    if (instantBookable) where.instantBookable = true
    if (allowPets) where.allowPets = true
    if (allowSmoking) where.allowSmoking = true
    if (hasSmartLock) where.hasSmartLock = true

    // Amenities filter (must have all specified amenities)
    if (amenities.length > 0) {
      where.amenities = {
        hasEvery: amenities
      }
    }

    // Availability check (if dates provided)
    // Only check CONFIRMED and COMPLETED bookings
    if (checkIn && checkOut) {
      // Find listings that don't have conflicting bookings
      const unavailableListings = await prisma.booking.findMany({
        where: {
          status: { in: ['CONFIRMED', 'COMPLETED'] },
          OR: [
            {
              checkIn: { lte: new Date(checkOut) },
              checkOut: { gte: new Date(checkIn) }
            }
          ]
        },
        select: { listingId: true },
        distinct: ['listingId']
      })

      if (unavailableListings.length > 0) {
        where.id = {
          notIn: unavailableListings.map(b => b.listingId)
        }
      }
    }

    // Build orderBy clause
    let orderBy: any = {}
    switch (sortBy) {
      case 'price_low':
        orderBy = { basePrice: 'asc' }
        break
      case 'price_high':
        orderBy = { basePrice: 'desc' }
        break
      case 'rating':
        orderBy = { averageRating: 'desc' }
        break
      case 'newest':
        orderBy = { createdAt: 'desc' }
        break
      default: // relevance
        orderBy = { averageRating: 'desc' } // Simple relevance = highest rated
    }

    // Execute query
    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          host: {
            select: {
              id: true,
              name: true,
              image: true,
              isSuperHost: true
            }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.listing.count({ where })
    ])

    // Enrich listings with data
    const enrichedListings = listings.map(listing => {
      return {
        id: listing.id,
        title: listing.title,
        description: listing.description,
        propertyType: listing.propertyType,
        roomType: listing.roomType,
        city: listing.city,
        country: listing.country,
        state: listing.state,
        neighborhood: listing.neighborhood,
        latitude: listing.latitude,
        longitude: listing.longitude,
        basePrice: listing.basePrice,
        currency: listing.currency,
        images: listing.images,
        maxGuests: listing.maxGuests,
        bedrooms: listing.bedrooms,
        beds: listing.beds,
        bathrooms: listing.bathrooms,
        amenities: listing.amenities,
        rating: listing.averageRating,
        reviewCount: listing.totalReviews,
        bookingCount: listing.totalBookings,
        instantBookable: listing.instantBookable,
        allowPets: listing.allowPets,
        hasSmartLock: listing.hasSmartLock,
        host: {
          id: listing.host.id,
          name: listing.host.name,
          image: listing.host.image,
          isSuperHost: listing.host.isSuperHost
        }
      }
    })

    // Apply rating filter after enrichment (if specified)
    const filteredListings = minRating !== undefined
      ? enrichedListings.filter(l => l.rating >= minRating)
      : enrichedListings

    return NextResponse.json({
      listings: filteredListings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      filters: {
        location,
        city,
        country,
        checkIn,
        checkOut,
        guests,
        minPrice,
        maxPrice,
        propertyType,
        roomType,
        amenities,
        bedrooms,
        beds,
        bathrooms,
        minRating,
        sortBy
      }
    })

  } catch (error) {
    console.error('Error in advanced search:', error)
    return NextResponse.json(
      { error: 'Failed to search listings' },
      { status: 500 }
    )
  }
}
