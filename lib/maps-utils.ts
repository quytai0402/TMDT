/**
 * SerpAPI Maps Integration Utility
 * Centralized helper for geocoding and place search across the entire app
 */

export interface GeocodedLocation {
  latitude: number
  longitude: number
  displayName?: string
  address?: string
}

export interface NearbyPlace {
  name: string
  type: string
  distance: string
  rating?: number
  address?: string
  placeId?: string
  latitude?: number
  longitude?: number
}

export interface SearchPlacesOptions {
  query: string
  latitude?: number
  longitude?: number
  radius?: number
  limit?: number
}

/**
 * Geocode an address to coordinates using SerpAPI
 */
export async function geocodeAddress(
  address: string,
  city: string,
  country?: string
): Promise<GeocodedLocation> {
  const response = await fetch("/api/geocode", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      address,
      city,
      country: country || "Vietnam",
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || `Geocoding failed: ${response.status}`)
  }

  return response.json()
}

/**
 * Find nearby places using SerpAPI
 */
export async function findNearbyPlaces(
  latitude: number,
  longitude: number,
  city?: string
): Promise<NearbyPlace[]> {
  const response = await fetch("/api/nearby-places", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      latitude,
      longitude,
      city,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || `Nearby places search failed: ${response.status}`)
  }

  const data = await response.json()
  return data.places || []
}

/**
 * Search for places by query using SerpAPI
 */
export async function searchPlaces(
  options: SearchPlacesOptions
): Promise<NearbyPlace[]> {
  const response = await fetch("/api/search-places", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(options),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || `Place search failed: ${response.status}`)
  }

  const data = await response.json()
  return data.places || []
}

/**
 * Get place details by place ID
 */
export async function getPlaceDetails(placeId: string): Promise<any> {
  const response = await fetch(`/api/place-details?placeId=${encodeURIComponent(placeId)}`)

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || `Place details failed: ${response.status}`)
  }

  return response.json()
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`
  }
  return `${(meters / 1000).toFixed(1)} km`
}

/**
 * Generate Google Maps URL for directions
 */
export function getDirectionsUrl(
  destinationLat: number,
  destinationLng: number,
  destinationName?: string,
  placeId?: string
): string {
  if (placeId) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destinationName || "")}&query_place_id=${placeId}`
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${destinationLat},${destinationLng}`
}

/**
 * Generate static map image URL using Google Maps Static API
 * Falls back to SerpAPI if Google API key not available
 */
export function getStaticMapUrl(
  latitude: number,
  longitude: number,
  zoom: number = 15,
  width: number = 600,
  height: number = 400,
  markers?: Array<{ lat: number; lng: number; label?: string }>
): string {
  const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  
  if (googleApiKey) {
    let url = `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=${zoom}&size=${width}x${height}`
    
    if (markers && markers.length > 0) {
      markers.forEach((marker) => {
        url += `&markers=color:red%7Clabel:${marker.label || ""}%7C${marker.lat},${marker.lng}`
      })
    } else {
      url += `&markers=color:red%7C${latitude},${longitude}`
    }
    
    url += `&key=${googleApiKey}`
    return url
  }
  
  // Fallback to OpenStreetMap static map
  return `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.01},${latitude - 0.01},${longitude + 0.01},${latitude + 0.01}&layer=mapnik&marker=${latitude},${longitude}`
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in meters
}
