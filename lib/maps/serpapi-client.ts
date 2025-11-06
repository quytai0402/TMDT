import { calculateDistance } from "@/lib/maps-utils"

const serpApiKey = process.env.SERPAPI_KEY

interface CacheEntry<T> {
  expiresAt: number
  payload: T
}

const cacheStore = new Map<string, CacheEntry<unknown>>()
const DEFAULT_SEARCH_TTL = 1000 * 60 * 60 * 6 // 6 hours
const DEFAULT_GEOCODE_TTL = 1000 * 60 * 60 * 24 // 24 hours

const CATEGORY_KEYWORDS: Array<{
  category: string
  keywords: string[]
  fallbackQuery: string
}> = [
  {
    category: "restaurant",
    keywords: [
      "restaurant",
      "nhà hàng",
      "an uong",
      "ăn uống",
      "an toi",
      "ăn tối",
      "food",
      "buffet",
      "fine dining",
    ],
    fallbackQuery: "restaurants",
  },
  {
    category: "cafe",
    keywords: [
      "cafe",
      "coffee",
      "ca phe",
      "cà phê",
      "quan ca phe",
      "quán cà phê",
      "coffee shop",
    ],
    fallbackQuery: "cafes",
  },
  {
    category: "bar",
    keywords: ["bar", "cocktail", "pub", "bia", "beer"],
    fallbackQuery: "bars",
  },
  {
    category: "attraction",
    keywords: [
      "attraction",
      "tham quan",
      "diem du lich",
      "điểm du lịch",
      "tourist",
      "landmark",
      "sightseeing",
    ],
    fallbackQuery: "tourist attractions",
  },
  {
    category: "transport",
    keywords: [
      "transport",
      "dịch vụ xe",
      "xe dua don",
      "đưa đón",
      "airport",
      "sân bay",
      "taxi",
      "grab",
      "car rental",
      "thuê xe",
    ],
    fallbackQuery: "transportation",
  },
  {
    category: "shopping",
    keywords: [
      "shopping",
      "mua sắm",
      "mall",
      "trung tâm thương mại",
      "market",
      "chợ",
    ],
    fallbackQuery: "shopping",
  },
  {
    category: "spa",
    keywords: ["spa", "massage", "wellness", "chăm sóc", "làm đẹp"],
    fallbackQuery: "spa",
  },
  {
    category: "pharmacy",
    keywords: ["pharmacy", "drugstore", "nhà thuốc", "drug store"],
    fallbackQuery: "pharmacy",
  },
  {
    category: "hospital",
    keywords: ["hospital", "clinic", "bệnh viện", "benh vien", "clinics"],
    fallbackQuery: "hospital",
  },
]

type SerpApiPlace = {
  title?: string
  place_id?: string
  data_id?: string
  position?: number
  address?: string
  type?: string
  types?: string[]
  type_id?: string
  type_ids?: string[]
  rating?: number
  reviews?: number
  price_level?: string | number
  price?: string
  phone?: string
  website?: string
  open_state?: string
  gps_coordinates?: {
    latitude: number
    longitude: number
  }
  hours?: string
  operating_hours?: {
    weekday_text?: string[]
  }
  distance?: string
  thumbnail?: string
  description?: string
  editorial_summary?: {
    overview?: string
  }
}

export interface NormalizedPlace {
  id: string
  name: string
  category: string
  address?: string
  rating?: number
  reviewCount?: number
  priceLevel?: number | null
  phoneNumber?: string
  website?: string
  coordinates?: {
    latitude: number
    longitude: number
  }
  distanceMeters?: number | null
  displayDistance?: string | null
  openState?: string
  workingHours?: string[]
  thumbnail?: string
  description?: string | null
  googleMapsUrl?: string | null
  rawTypes?: string[]
  relevanceScore: number
}

export interface PlaceSearchParams {
  query: string
  latitude?: number
  longitude?: number
  radiusMeters?: number
  limit?: number
  language?: string
  openNow?: boolean
  explicitCategory?: string | null
  cacheTtlMs?: number
}

export interface PlaceSearchResult {
  query: string
  resolvedQuery: string
  category: string | null
  places: NormalizedPlace[]
  suggestions: string[]
}

export interface NearbySearchOptions {
  latitude: number
  longitude: number
  city?: string
  categories?: string[]
  radiusMeters?: number
  limit?: number
  language?: string
}

export interface NearbySearchResult {
  latitude: number
  longitude: number
  categories: string[]
  places: NormalizedPlace[]
}

export interface GeocodeParams {
  address: string
  city?: string
  country?: string
  language?: string
}

export interface GeocodeResult {
  latitude: number
  longitude: number
  displayName: string
  address?: string
  placeId?: string
  raw?: unknown
}

function getCached<T>(key: string): T | null {
  const cached = cacheStore.get(key) as CacheEntry<T> | undefined
  if (!cached) return null
  if (cached.expiresAt < Date.now()) {
    cacheStore.delete(key)
    return null
  }
  return cached.payload
}

function setCached<T>(key: string, payload: T, ttl: number) {
  cacheStore.set(key, {
    payload,
    expiresAt: Date.now() + ttl,
  })
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()
}

function inferCategory(query: string, explicit?: string | null): { category: string | null; keyword?: string } {
  if (explicit) {
    return { category: explicit.toLowerCase() }
  }

  const normalized = normalizeText(query)

  for (const candidate of CATEGORY_KEYWORDS) {
    if (candidate.keywords.some((keyword) => normalized.includes(normalizeText(keyword)))) {
      return { category: candidate.category, keyword: candidate.fallbackQuery }
    }
  }

  return { category: null }
}

function buildResolvedQuery(query: string, fallbackKeyword?: string) {
  return fallbackKeyword && !query.toLowerCase().includes(fallbackKeyword)
    ? `${query} ${fallbackKeyword}`
    : query
}

function parseDistance(distance?: string): number | null {
  if (!distance) return null
  const match = distance.match(/([\d.,]+)\s*(km|m)/i)
  if (!match) return null
  const raw = parseFloat(match[1].replace(",", "."))
  if (!Number.isFinite(raw)) return null
  return match[2].toLowerCase() === "km" ? raw * 1000 : raw
}

function parsePriceLevel(value?: string | number): number | null {
  if (value === undefined || value === null) return null
  if (typeof value === "number") return value
  const count = (value.match(/\$/g) || []).length
  return count > 0 ? count : null
}

function determineZoom(radius?: number) {
  if (!radius) return 15
  if (radius <= 500) return 16
  if (radius <= 1000) return 15
  if (radius <= 3000) return 14
  if (radius <= 7000) return 13
  return 12
}

async function serpApiRequest(params: Record<string, string>) {
  if (!serpApiKey) {
    throw new Error("SERPAPI_KEY is not configured")
  }

  const url = new URL("https://serpapi.com/search.json")
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, value)
    }
  })
  url.searchParams.set("api_key", serpApiKey)

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`SerpAPI error ${response.status}: ${response.statusText}`)
  }

  return response.json() as Promise<{ [key: string]: unknown }>
}

function normalizePlace(
  place: SerpApiPlace,
  index: number,
  origin?: { latitude: number; longitude: number }
): NormalizedPlace {
  const id = place.place_id || place.data_id || `place-${index}`
  const lat = place.gps_coordinates?.latitude
  const lng = place.gps_coordinates?.longitude
  const distanceFromSource = origin && lat !== undefined && lng !== undefined
    ? calculateDistance(origin.latitude, origin.longitude, lat, lng)
    : parseDistance(place.distance ?? undefined)

  const displayDistance = distanceFromSource
    ? distanceFromSource < 1000
      ? `${Math.round(distanceFromSource)}m`
      : `${(distanceFromSource / 1000).toFixed(1)} km`
    : place.distance ?? null

  const reviewCount = typeof place.reviews === "number" ? place.reviews : undefined

  const normalized: NormalizedPlace = {
    id,
    name: place.title ?? "Địa điểm",
    category: place.type || place.types?.[0] || "attraction",
    address: place.address,
    rating: place.rating,
    reviewCount,
    priceLevel: parsePriceLevel(place.price_level),
    phoneNumber: place.phone,
    website: place.website,
    coordinates:
      lat !== undefined && lng !== undefined
        ? {
            latitude: lat,
            longitude: lng,
          }
        : undefined,
    distanceMeters: distanceFromSource ?? null,
    displayDistance,
    openState: place.open_state,
    workingHours: place.operating_hours?.weekday_text ?? (place.hours ? [place.hours] : undefined),
    thumbnail: place.thumbnail,
    description: place.description || place.editorial_summary?.overview || null,
    googleMapsUrl: place.place_id ? `https://www.google.com/maps/place/?q=place_id:${place.place_id}` : null,
    rawTypes: place.types,
    relevanceScore: computeRelevanceScore({
      rating: place.rating,
      reviewCount,
      distance: distanceFromSource ?? undefined,
      position: place.position,
    }),
  }

  return normalized
}

function computeRelevanceScore(params: {
  rating?: number
  reviewCount?: number
  distance?: number
  position?: number
}) {
  const ratingScore = params.rating ? (params.rating / 5) * 0.5 : 0.2
  const reviewScore = params.reviewCount ? Math.min(params.reviewCount / 1000, 1) * 0.2 : 0.05
  const distanceScore = params.distance !== undefined ? Math.max(0, 1 - Math.min(params.distance, 5000) / 5000) * 0.2 : 0.05
  const positionScore = params.position ? Math.max(0, 1 - (params.position - 1) * 0.05) * 0.1 : 0.05
  return Number((ratingScore + reviewScore + distanceScore + positionScore).toFixed(3))
}

function buildCacheKey(prefix: string, parts: Record<string, unknown>) {
  return `${prefix}:${JSON.stringify(parts)}`
}

export async function searchPlaces(params: PlaceSearchParams): Promise<PlaceSearchResult> {
  const { category, keyword } = inferCategory(params.query, params.explicitCategory)
  const resolvedQuery = buildResolvedQuery(params.query, keyword)
  const cacheKey = buildCacheKey("maps-search", {
    query: resolvedQuery,
    lat: params.latitude?.toFixed(4),
    lng: params.longitude?.toFixed(4),
    radius: params.radiusMeters,
    limit: params.limit,
    openNow: params.openNow,
    category,
  })

  const cached = getCached<PlaceSearchResult>(cacheKey)
  if (cached) {
    return cached
  }

  try {
    const data = await serpApiRequest({
      engine: "google_maps",
      type: "search",
      q: resolvedQuery,
      hl: params.language || "vi",
      gl: "vn",
      ...(params.openNow ? { open_now: "true" } : {}),
      ...(params.latitude !== undefined && params.longitude !== undefined
        ? { ll: `@${params.latitude},${params.longitude},${determineZoom(params.radiusMeters)}z` }
        : {}),
    })

    const results = Array.isArray((data as any)?.local_results) ? ((data as any).local_results as SerpApiPlace[]) : []
    const origin = params.latitude !== undefined && params.longitude !== undefined
      ? { latitude: params.latitude, longitude: params.longitude }
      : undefined

    const normalized = results
      .map((place, index) => normalizePlace(place, index, origin))
      .sort((a, b) => b.relevanceScore - a.relevanceScore)

    const sliced = typeof params.limit === "number" ? normalized.slice(0, params.limit) : normalized

    const payload: PlaceSearchResult = {
      query: params.query,
      resolvedQuery,
      category,
      places: sliced,
      suggestions: Array.isArray((data as any)?.related_questions)
        ? (data as any).related_questions.map((question: any) => question.question as string).filter(Boolean)
        : [],
    }

    setCached(cacheKey, payload, params.cacheTtlMs ?? DEFAULT_SEARCH_TTL)
    return payload
  } catch (error) {
    console.error("SerpAPI search error:", error)
    throw error
  }
}

export async function searchNearbyPlaces(options: NearbySearchOptions): Promise<NearbySearchResult> {
  const categories = options.categories && options.categories.length > 0
    ? options.categories
    : ["restaurants", "cafes", "attractions", "transport"]

  const perCategoryLimit = Math.max(3, Math.floor((options.limit ?? 12) / categories.length))
  const aggregated = new Map<string, NormalizedPlace>()

  for (const category of categories) {
    const baseQuery = `${category} near ${options.city ?? "me"}`
    try {
      const result = await searchPlaces({
        query: baseQuery,
        latitude: options.latitude,
        longitude: options.longitude,
        radiusMeters: options.radiusMeters,
        language: options.language,
        limit: perCategoryLimit,
        explicitCategory: category,
      })

      for (const place of result.places) {
        if (!aggregated.has(place.id)) {
          aggregated.set(place.id, place)
        }
      }
    } catch (error) {
      console.error(`Failed to fetch category ${category}:`, error)
    }
  }

  const places = Array.from(aggregated.values())
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, options.limit ?? 12)

  return {
    latitude: options.latitude,
    longitude: options.longitude,
    categories,
    places,
  }
}

export async function geocodeAddress(params: GeocodeParams): Promise<GeocodeResult> {
  const queryParts = [params.address]
  if (params.city) queryParts.push(params.city)
  if (params.country) queryParts.push(params.country)
  const resolved = queryParts.filter(Boolean).join(", ")

  const cacheKey = buildCacheKey("maps-geocode", {
    address: resolved,
    language: params.language || "vi",
  })

  const cached = getCached<GeocodeResult>(cacheKey)
  if (cached) {
    return cached
  }

  try {
    const data = await serpApiRequest({
      engine: "google_maps",
      type: "search",
      q: resolved,
      hl: params.language || "vi",
      gl: "vn",
    })

    const placeResult = (data as any)?.place_results as SerpApiPlace | undefined
    const localResults = Array.isArray((data as any)?.local_results) ? ((data as any).local_results as SerpApiPlace[]) : []

    const bestMatch = placeResult ?? localResults[0]

    if (!bestMatch?.gps_coordinates) {
      throw new Error("Location not found")
    }

    const result: GeocodeResult = {
      latitude: bestMatch.gps_coordinates.latitude,
      longitude: bestMatch.gps_coordinates.longitude,
      displayName: bestMatch.title || resolved,
      address: bestMatch.address ?? resolved,
      placeId: bestMatch.place_id,
      raw: bestMatch,
    }

    setCached(cacheKey, result, DEFAULT_GEOCODE_TTL)
    return result
  } catch (error) {
    console.error("SerpAPI geocode error:", error)
    throw error
  }
}
