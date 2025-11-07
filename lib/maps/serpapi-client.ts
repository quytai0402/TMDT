import { DESTINATIONS } from "@/data/destinations"
import { calculateDistance } from "@/lib/maps-utils"

const resolvedSerpApiKey =
  process.env.SERPAPI_KEY?.trim() ||
  process.env.NEXT_PUBLIC_SERPAPI_KEY?.trim() ||
  process.env.SERPAPI_SECRET?.trim() ||
  (process.env.NODE_ENV !== "production"
    ? "c9a780475689b58c630e29cda1d212f581d4417b38afed7dd45922b2b19614f4"
    : undefined)

const serpApiKey = resolvedSerpApiKey && resolvedSerpApiKey.length > 10 ? resolvedSerpApiKey : undefined

if (!serpApiKey && process.env.NODE_ENV !== "production") {
  console.warn("SERPAPI_KEY is not configured. Set SERPAPI_KEY in your env to enable geocoding.")
}

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

interface CandidateContext {
  query: string
  address?: string
  city?: string
  country?: string
}

function computeCandidateScore(place: SerpApiPlace, context: CandidateContext): number {
  if (!place?.gps_coordinates?.latitude || !place?.gps_coordinates?.longitude) {
    return Number.NEGATIVE_INFINITY
  }

  const normalizedTitle = normalizeText(place.title ?? "")
  const normalizedCandidateAddress = normalizeText(place.address ?? "")
  const normalizedQuery = normalizeText(context.query)
  const normalizedStreet = context.address ? normalizeText(context.address) : ""
  const normalizedCity = context.city ? normalizeText(context.city) : ""
  const normalizedCountry = context.country ? normalizeText(context.country) : ""

  let score = 0

  const types = Array.isArray(place.types) ? place.types.map((type) => type.toLowerCase()) : []
  const primaryType = (place.type ?? "").toLowerCase()
  const allTypeTokens = [...types, primaryType]
  const isAdministrative = allTypeTokens.some((token) =>
    token.includes("administrative_area") || token.includes("locality") || token.includes("political"),
  )
  const isLodging = allTypeTokens.some((token) => token.includes("lodging") || token.includes("point_of_interest"))
  const containsStreetNumber = /\d/.test(place.address ?? "") || /\d/.test(place.title ?? "")

  if (normalizedStreet) {
    if (normalizedCandidateAddress.includes(normalizedStreet) || normalizedTitle.includes(normalizedStreet)) {
      score += 40
    }

    const streetTokens = normalizedStreet.split(/\s+/).filter((token) => token.length > 2)
    const streetMatches = streetTokens.filter((token) =>
      normalizedCandidateAddress.includes(token) || normalizedTitle.includes(token),
    )
    score += streetMatches.length * 5

    if (/\d/.test(context.address ?? "")) {
      if (containsStreetNumber) {
        score += 10
      } else {
        score -= 6
      }
    }
  }

  if (normalizedCity) {
    if (normalizedCandidateAddress.includes(normalizedCity) || normalizedTitle.includes(normalizedCity)) {
      score += 8
    } else {
      score -= 4
    }
  }

  if (normalizedCountry && normalizedCandidateAddress.includes(normalizedCountry)) {
    score += 3
  }

  if (normalizedQuery && (normalizedCandidateAddress.includes(normalizedQuery) || normalizedTitle.includes(normalizedQuery))) {
    score += 6
  }

  if (place.rating) {
    score += place.rating
  }

  if (place.position) {
    score += Math.max(0, 6 - place.position)
  }

  if (place.distance) {
    const parsedDistance = parseDistance(place.distance)
    if (parsedDistance !== null) {
      score += parsedDistance < 1000 ? 6 : parsedDistance < 3000 ? 4 : Math.max(1, 5000 / parsedDistance)
    }
  }

  if (isAdministrative) {
    score -= 25
  }

  if (isLodging) {
    score += 4
  }

  if (!containsStreetNumber && normalizedStreet && /\d/.test(normalizedStreet)) {
    score -= 4
  }

  return score
}

function pickPlaceCandidate(primary: SerpApiPlace | undefined, list: SerpApiPlace[] | undefined, context: CandidateContext): SerpApiPlace | undefined {
  const candidates: Array<{ place: SerpApiPlace; score: number; preferred: boolean }> = []

  const pushCandidate = (place: SerpApiPlace | undefined, preferred: boolean) => {
    if (!place?.gps_coordinates?.latitude || !place.gps_coordinates?.longitude) {
      return
    }
    const score = computeCandidateScore(place, context)
    if (Number.isFinite(score)) {
      candidates.push({ place, score, preferred })
    }
  }

  pushCandidate(primary, true)

  if (Array.isArray(list)) {
    for (const candidate of list) {
      pushCandidate(candidate, false)
    }
  }

  if (candidates.length === 0) {
    return undefined
  }

  candidates.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score
    }
    if (a.preferred !== b.preferred) {
      return Number(b.preferred) - Number(a.preferred)
    }
    return 0
  })

  const positiveCandidate = candidates.find((candidate) => candidate.score > 0)
  return positiveCandidate?.place ?? candidates[0]?.place
}

function fallbackDestinationMatch(query: string): GeocodeResult | null {
  const normalizedQuery = normalizeText(query)
  if (!normalizedQuery) {
    return null
  }

  for (const destination of DESTINATIONS) {
    const tokens = [
      destination.name,
      destination.slug,
      destination.province,
      ...(destination.keywords ?? []),
    ]
      .filter(Boolean)
      .map((token) => normalizeText(String(token)))

    const matched = tokens.some((token) => normalizedQuery.includes(token) || token.includes(normalizedQuery))
    if (!matched) {
      continue
    }

    const stayWithCoordinates = destination.stays.find(
      (stay) => Number.isFinite(stay.latitude) && Number.isFinite(stay.longitude),
    )
    const experienceWithCoordinates = destination.experiences.find(
      (experience) => Number.isFinite(experience.latitude) && Number.isFinite(experience.longitude),
    )

    const coordinateSource = stayWithCoordinates ?? experienceWithCoordinates

    if (coordinateSource?.latitude !== undefined && coordinateSource?.longitude !== undefined) {
      return {
        latitude: coordinateSource.latitude,
        longitude: coordinateSource.longitude,
        displayName: destination.name,
        address:
          (coordinateSource as any).address ??
          `${destination.name}${destination.province ? `, ${destination.province}` : ""}`,
        raw: {
          source: "destination-fallback",
          slug: destination.slug,
        },
      }
    }
  }

  return null
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
    const localResults = Array.isArray((data as any)?.local_results)
      ? ((data as any).local_results as SerpApiPlace[])
      : []

    const selectBest = () =>
      pickPlaceCandidate(placeResult, localResults, {
        query: resolved,
        address: params.address,
        city: params.city,
        country: params.country,
      })
    let bestMatch = selectBest()

    const fallbackQueries = Array.from(
      new Set(
        [
          params.city && params.country ? `${params.city}, ${params.country}` : undefined,
          params.city,
          params.country,
        ]
          .filter(Boolean)
          .map((value) => value?.trim())
          .filter((value) => value && normalizeText(value) !== normalizeText(resolved)),
      ),
    )

    if (!bestMatch && fallbackQueries.length > 0) {
      for (const fallbackQuery of fallbackQueries) {
        if (!fallbackQuery) continue
        try {
          const fallbackData = await serpApiRequest({
            engine: "google_maps",
            type: "search",
            q: fallbackQuery,
            hl: params.language || "vi",
            gl: "vn",
          })

          const fallbackPlaceResult = (fallbackData as any)?.place_results as SerpApiPlace | undefined
          const fallbackLocalResults = Array.isArray((fallbackData as any)?.local_results)
            ? ((fallbackData as any).local_results as SerpApiPlace[])
            : []

          bestMatch = pickPlaceCandidate(fallbackPlaceResult, fallbackLocalResults, {
            query: fallbackQuery,
            address: params.address,
            city: params.city,
            country: params.country,
          })
          if (bestMatch) {
            break
          }
        } catch (fallbackError) {
          console.warn("Fallback geocode request failed:", fallbackError)
        }
      }
    }

    if (!bestMatch) {
      const destinationFallback =
        fallbackDestinationMatch(resolved) ||
        (params.city ? fallbackDestinationMatch(params.city) : null) ||
        (params.country ? fallbackDestinationMatch(params.country) : null)

      if (destinationFallback) {
        setCached(cacheKey, destinationFallback, DEFAULT_GEOCODE_TTL)
        return destinationFallback
      }

      throw new Error(`Location not found for query: ${resolved}`)
    }

    if (!bestMatch?.gps_coordinates?.latitude || !bestMatch.gps_coordinates?.longitude) {
      throw new Error(`Best match missing coordinates for query: ${resolved}`)
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
