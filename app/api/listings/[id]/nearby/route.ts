import { NextRequest, NextResponse } from 'next/server'
import { getNearbyPlaces } from '@/lib/nearby-places'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listingId } = await params
    const { searchParams } = new URL(req.url)
    const city = searchParams.get('city')
    const lat = parseFloat(searchParams.get('lat') || '0')
    const lng = parseFloat(searchParams.get('lng') || '0')

    if (!city || !lat || !lng) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Get nearby places from our curated data
    const places = getNearbyPlaces(city, lat, lng)

    // If Google Maps API is available, enhance with real-time data
    if (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      // TODO: Integrate Google Places API for real-time nearby places
      // This would provide up-to-date information about businesses, ratings, etc.
    }

    return NextResponse.json({
      places,
      total: places.length,
    })
  } catch (error: any) {
    console.error('Error fetching nearby places:', error)
    return NextResponse.json(
      { error: 'Failed to fetch nearby places' },
      { status: 500 }
    )
  }
}
