import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

// GET /api/services - Get services with filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    
    // Filters
    const category = searchParams.get('category')
    const city = searchParams.get('city')
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    const radius = parseFloat(searchParams.get('radius') || '10') // km
    const isBookable = searchParams.get('isBookable')
    const minRating = parseFloat(searchParams.get('minRating') || '0')
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      status: 'ACTIVE',
    }

    if (category) {
      where.category = category
    }

    if (city) {
      where.city = city
    }

    if (isBookable === 'true') {
      where.isBookable = true
    }

    if (minRating > 0) {
      where.averageRating = {
        gte: minRating
      }
    }

    // Get services
    // @ts-ignore - Service model exists in schema but TS server needs reload
    let services = await prisma.service.findMany({
      where,
      skip,
      take: limit,
      orderBy: [
        { averageRating: 'desc' },
        { totalReviews: 'desc' }
      ]
    })

    // Filter by location radius if lat/lng provided
    if (lat && lng) {
      const centerLat = parseFloat(lat)
      const centerLng = parseFloat(lng)
      
      services = services.filter((service: any) => {
        const distance = calculateDistance(
          centerLat,
          centerLng,
          service.latitude,
          service.longitude
        )
        return distance <= radius
      })
    }

    // Get total count
    // @ts-ignore - Service model exists in schema but TS server needs reload
    const total = await prisma.service.count({ where })

    return NextResponse.json({
      success: true,
      data: services,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching services:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch services',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Earth's radius in km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180)
}
