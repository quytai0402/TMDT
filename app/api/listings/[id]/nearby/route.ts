import { NextRequest, NextResponse } from 'next/server'
import { searchMultipleCategories } from '@/lib/serpapi-nearby'
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

    // Try to get nearby places from SerpApi first
    let places = await searchMultipleCategories(lat, lng)

    // If SerpApi fails or returns no results, fallback to curated data
    if (!places || places.length === 0) {
      console.log('Falling back to curated data')
      places = getNearbyPlaces(city, lat, lng)
    }

    return NextResponse.json({
      places,
      total: places.length,
    })
  } catch (error: any) {
    console.error('Error fetching nearby places:', error)
    
    // Fallback to curated data on error
    try {
      const { searchParams } = new URL(req.url)
      const city = searchParams.get('city') || ''
      const lat = parseFloat(searchParams.get('lat') || '0')
      const lng = parseFloat(searchParams.get('lng') || '0')
      
      const places = getNearbyPlaces(city, lat, lng)
      return NextResponse.json({
        places,
        total: places.length,
      })
    } catch (fallbackError) {
      return NextResponse.json(
        { error: 'Failed to fetch nearby places' },
        { status: 500 }
      )
    }
  }
}
