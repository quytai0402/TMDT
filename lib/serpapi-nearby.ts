import { getJson } from 'serpapi'

interface SerpApiPlace {
  position: number
  title: string
  place_id?: string
  data_id?: string
  data_cid?: string
  reviews_link?: string
  photos_link?: string
  gps_coordinates?: {
    latitude: number
    longitude: number
  }
  place_id_search?: string
  provider_id?: string
  rating?: number
  reviews?: number
  type?: string
  types?: string[]
  type_id?: string
  type_ids?: string[]
  address?: string
  open_state?: string
  hours?: string
  operating_hours?: any
  phone?: string
  website?: string
  description?: string
  service_options?: any
  thumbnail?: string
  distance?: string
}

interface NearbyPlace {
  name: string
  type: string
  distance: number | string
  rating?: number
  lat?: number
  lng?: number
  address?: string
  placeId?: string
}

const placeTypeMapping: Record<string, string> = {
  restaurant: 'restaurant',
  cafe: 'cafe',
  'coffee shop': 'cafe',
  bank: 'atm',
  atm: 'atm',
  hospital: 'hospital',
  'medical center': 'hospital',
  pharmacy: 'pharmacy',
  'drug store': 'pharmacy',
  supermarket: 'supermarket',
  'convenience store': 'supermarket',
  'shopping mall': 'supermarket',
  beach: 'beach',
  'tourist attraction': 'attraction',
  museum: 'attraction',
  park: 'attraction',
  'bus station': 'transport',
  'train station': 'transport',
  airport: 'transport',
}

function mapPlaceType(types?: string[]): string {
  if (!types || types.length === 0) return 'attraction'
  
  for (const type of types) {
    const lowerType = type.toLowerCase()
    if (placeTypeMapping[lowerType]) {
      return placeTypeMapping[lowerType]
    }
  }
  
  return 'attraction'
}

function parseDistance(distanceStr?: string): number {
  if (!distanceStr) return 0
  
  // Parse "0.5 km" or "500 m" format
  const match = distanceStr.match(/([\d.]+)\s*(km|m)/i)
  if (!match) return 0
  
  const value = parseFloat(match[1])
  const unit = match[2].toLowerCase()
  
  return unit === 'km' ? value * 1000 : value
}

export async function getNearbyPlacesFromSerpApi(
  lat: number,
  lng: number,
  query: string = 'tourist attractions'
): Promise<NearbyPlace[]> {
  const apiKey = process.env.SERPAPI_KEY
  
  if (!apiKey) {
    console.error('SERPAPI_KEY is not configured')
    return []
  }

  try {
    const response = await getJson({
      engine: 'google_maps',
      q: query,
      ll: `@${lat},${lng},15z`,
      type: 'search',
      api_key: apiKey,
    })

    const localResults = response.local_results as SerpApiPlace[] || []
    
    return localResults.slice(0, 12).map((place): NearbyPlace => ({
      name: place.title,
      type: mapPlaceType(place.types),
      distance: place.distance ? parseDistance(place.distance) : 0,
      rating: place.rating,
      lat: place.gps_coordinates?.latitude,
      lng: place.gps_coordinates?.longitude,
      address: place.address,
      placeId: place.place_id,
    }))
  } catch (error) {
    console.error('Error fetching from SerpApi:', error)
    return []
  }
}

export async function searchMultipleCategories(
  lat: number,
  lng: number
): Promise<NearbyPlace[]> {
  const categories = [
    'restaurants',
    'cafes', 
    'supermarkets',
    'hospitals',
    'tourist attractions'
  ]
  
  const results = await Promise.all(
    categories.map(category => 
      getNearbyPlacesFromSerpApi(lat, lng, category)
    )
  )
  
  // Combine and deduplicate by name
  const allPlaces = results.flat()
  const uniquePlaces = Array.from(
    new Map(allPlaces.map(place => [place.name, place])).values()
  )
  
  // Sort by distance
  return uniquePlaces.sort((a, b) => {
    const distA = typeof a.distance === 'number' ? a.distance : 0
    const distB = typeof b.distance === 'number' ? b.distance : 0
    return distA - distB
  })
}
