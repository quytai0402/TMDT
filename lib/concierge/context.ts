import { addDays, differenceInCalendarDays, format, isWithinInterval } from 'date-fns'
import { vi } from 'date-fns/locale'

import { prisma } from '@/lib/prisma'

type BookingStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED'

const FUTURE_LOOKAHEAD_DAYS = 60

const AVAILABILITY_STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED'] satisfies BookingStatus[]

function isHexObjectId(value: string) {
  return /^[a-fA-F0-9]{24}$/.test(value)
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function coerceNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

function buildGuideRecommendations(
  places: unknown,
  category: ConciergeRecommendation['category'],
): ConciergeRecommendation[] {
  if (!Array.isArray(places)) {
    return []
  }

  return places
    .filter(isPlainObject)
    .map((place) => {
      const distance = coerceNumber(place.distance)

      return {
        name: typeof place.name === 'string' ? place.name : 'Điểm tham quan nổi bật',
        distanceKm: distance ?? null,
        description: typeof place.description === 'string' ? place.description : null,
        rating: null,
        category,
      }
    })
}

function normalizeNearbyCategory(type: unknown): 'restaurant' | 'cafe' | 'attraction' | null {
  if (typeof type !== 'string') {
    return null
  }

  const normalized = type.toLowerCase()
  if (normalized === 'restaurant') return 'restaurant'
  if (normalized === 'cafe') return 'cafe'
  if (normalized === 'attraction' || normalized === 'beach' || normalized === 'transport') {
    return 'attraction'
  }

  return null
}

function categorizeNearbyPlaces(
  places: unknown[],
): Record<'restaurant' | 'cafe' | 'attraction', ConciergeRecommendation[]> {
  const result = {
    restaurant: [] as ConciergeRecommendation[],
    cafe: [] as ConciergeRecommendation[],
    attraction: [] as ConciergeRecommendation[],
  }

  for (const place of places) {
    if (!isPlainObject(place)) continue

    const category = normalizeNearbyCategory(place.type)
    if (!category) continue

    const distanceMeters = coerceNumber(place.distance)
    const distanceKm = distanceMeters !== null
      ? Math.round(((distanceMeters / 1000) + Number.EPSILON) * 10) / 10
      : null

    result[category].push({
      name: typeof place.name === 'string' ? place.name : 'Địa điểm nổi bật',
      distanceKm,
      description: typeof place.description === 'string' ? place.description : null,
      rating: coerceNumber(place.rating),
      category,
    })
  }

  return result
}

function mergeRecommendations(
  primary: ConciergeRecommendation[],
  fallback: ConciergeRecommendation[],
): ConciergeRecommendation[] {
  const merged: ConciergeRecommendation[] = []
  const seen = new Set<string>()

  for (const recommendation of [...primary, ...fallback]) {
    const name = recommendation.name?.toLowerCase() ?? ''
    const key = `${recommendation.category ?? ''}:${name}`
    if (seen.has(key)) continue
    seen.add(key)
    merged.push(recommendation)
    if (merged.length >= 3) break
  }

  return merged
}

interface ConciergeContextOptions {
  listingIdentifier?: string
  bookingId?: string
  userId?: string
  includeLatestBooking?: boolean
}

export interface ConciergeListingContext {
  id: string
  slug?: string | null
  title: string
  city: string
  country: string
  address?: string | null
  nightlyRate: {
    amount: number
    currency: string
    formatted: string
  }
  host: {
    id: string
    name?: string | null
    phone?: string | null
    responseRate?: number | null
    responseTimeMinutes?: number | null
    isSuperHost?: boolean
  }
  availability: {
    status: 'AVAILABLE_NOW' | 'BOOKED' | 'UPCOMING_BLOCKED'
    summary: string
    nextAvailableFrom?: string | null
    nextUnavailableFrom?: string | null
    nightsAvailable?: number | null
  }
  amenities: string[]
  highlights: string[]
  recommendations: {
    restaurants: ConciergeRecommendation[]
    cafes: ConciergeRecommendation[]
    attractions: ConciergeRecommendation[]
  }
}

export interface ConciergeRecommendation {
  name: string
  distanceKm?: number | null
  description?: string | null
  rating?: number | null
  category?: string | null
}

export interface ConciergeBookingContext {
  id: string
  status: string
  checkIn: string
  checkOut: string
  nights: number
  totalPrice: number
  currency: string
  listing: {
    id: string
    title: string
    slug?: string | null
    city: string
    country: string
    image?: string | null
  }
}

export interface ConciergeAssistantPayload {
  listingContext?: ConciergeListingContext | null
  latestBooking?: ConciergeBookingContext | null
  introMessage: string
  quickReplies: string[]
}

async function resolveListing(identifier: string) {
  const listing = await prisma.listing.findFirst({
    where: isHexObjectId(identifier)
      ? { id: identifier }
      : {
          OR: [{ id: identifier }, { slug: identifier }],
        },
    include: {
      host: {
        select: {
          id: true,
          name: true,
          phone: true,
          isSuperHost: true,
          hostProfile: {
            select: {
              responseRate: true,
              responseTime: true,
              isSuperHost: true,
            },
          },
        },
      },
      neighborhoodGuide: true,
    },
  })

  return listing
}

async function resolveAmenityNames(amenityIds: string[]) {
  if (!amenityIds.length) return []

  const amenities = await prisma.amenity.findMany({
    where: { id: { in: amenityIds } },
    select: { name: true, nameVi: true },
  })

  return amenities.map((amenity) => amenity.nameVi || amenity.name)
}

async function computeAvailability(listingId: string) {
  const now = new Date()
  const futureLimit = addDays(now, FUTURE_LOOKAHEAD_DAYS)

  const bookings = await prisma.booking.findMany({
    where: {
      listingId,
      status: { in: AVAILABILITY_STATUSES },
      checkOut: { gte: now },
    },
    orderBy: { checkIn: 'asc' },
    select: {
      checkIn: true,
      checkOut: true,
    },
  })

  const ongoing = bookings.find((booking) =>
    isWithinInterval(now, { start: booking.checkIn, end: booking.checkOut }),
  )

  if (!bookings.length) {
    return {
      status: 'AVAILABLE_NOW' as const,
      summary: 'Chỗ ở đang sẵn sàng cho đặt phòng ngay lập tức.',
      nextAvailableFrom: format(now, "d MMMM", { locale: vi }),
      nightsAvailable: FUTURE_LOOKAHEAD_DAYS,
    }
  }

  if (ongoing) {
    const nextAvailable = ongoing.checkOut
    const upcomingBooking = bookings.find(
      (booking) => booking.checkIn > ongoing.checkOut,
    )

    const nextUnavailable = upcomingBooking?.checkIn ?? null
    const nightsAvailable = nextUnavailable
      ? differenceInCalendarDays(nextUnavailable, nextAvailable)
      : differenceInCalendarDays(futureLimit, nextAvailable)

    return {
      status: 'BOOKED' as const,
      summary: `Hiện căn đang được đặt đến hết ngày ${format(
        ongoing.checkOut,
        'd MMMM',
        { locale: vi },
      )}.` ,
      nextAvailableFrom: format(nextAvailable, 'd MMMM', { locale: vi }),
      nextUnavailableFrom: nextUnavailable
        ? format(nextUnavailable, 'd MMMM', { locale: vi })
        : null,
      nightsAvailable: nightsAvailable > 0 ? nightsAvailable : null,
    }
  }

  const firstBooking = bookings[0]
  const nightsAvailable = differenceInCalendarDays(firstBooking.checkIn, now)

  return {
    status: 'AVAILABLE_NOW' as const,
    summary: `Căn đang trống đến ngày ${format(firstBooking.checkIn, 'd MMMM', {
      locale: vi,
    })}.`,
    nextAvailableFrom: format(now, 'd MMMM', { locale: vi }),
    nextUnavailableFrom: format(firstBooking.checkIn, 'd MMMM', { locale: vi }),
    nightsAvailable,
  }
}

async function buildListingContext(listingId: string) {
  const listing = await resolveListing(listingId)
  if (!listing) {
    return null
  }

  const amenityNames = Array.isArray(listing.amenities) && listing.amenities.length
    ? await resolveAmenityNames(listing.amenities as string[])
    : listing.amenities

  const availability = await computeAvailability(listing.id)

  const neighborhood = listing.neighborhoodGuide
  const nearbyPlaces = Array.isArray(listing.nearbyPlaces)
    ? (listing.nearbyPlaces as unknown[])
    : []

  const nearbyRecommendations = categorizeNearbyPlaces(nearbyPlaces)
  const guideRecommendations = {
    restaurants: buildGuideRecommendations(neighborhood?.restaurants, 'restaurant'),
    cafes: buildGuideRecommendations(neighborhood?.cafes, 'cafe'),
    attractions: buildGuideRecommendations(neighborhood?.attractions, 'attraction'),
  }

  const restaurants = mergeRecommendations(
    guideRecommendations.restaurants,
    nearbyRecommendations.restaurant,
  )
  const cafes = mergeRecommendations(
    guideRecommendations.cafes,
    nearbyRecommendations.cafe,
  )
  const attractions = mergeRecommendations(
    guideRecommendations.attractions,
    nearbyRecommendations.attraction,
  )

  const hostProfile = listing.host?.hostProfile
  const host = listing.host

  const context: ConciergeListingContext = {
    id: listing.id,
    slug: listing.slug,
    title: listing.title,
    city: listing.city,
    country: listing.country,
    address: listing.address,
    nightlyRate: {
      amount: listing.basePrice,
      currency: listing.currency ?? 'VND',
      formatted: new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: listing.currency ?? 'VND',
        maximumFractionDigits: 0,
      }).format(listing.basePrice),
    },
    host: {
      id: host?.id ?? 'unknown',
      name: host?.name,
      phone: host?.phone,
      responseRate: hostProfile?.responseRate ?? null,
      responseTimeMinutes: hostProfile?.responseTime ?? null,
      isSuperHost: host?.isSuperHost ?? hostProfile?.isSuperHost ?? false,
    },
    availability,
    amenities: amenityNames,
    highlights: [
      `${listing.bedrooms} phòng ngủ`,
      `${listing.bathrooms} phòng tắm`,
      `${listing.maxGuests} khách`,
    ],
    recommendations: {
      restaurants,
      cafes,
      attractions,
    },
  }

  return context
}

async function getLatestBookingContext(userId: string) {
  const booking = await prisma.booking.findFirst({
    where: {
      guestId: userId,
      status: { in: ['CONFIRMED', 'PENDING', 'COMPLETED'] },
    },
    orderBy: { createdAt: 'desc' },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          slug: true,
          city: true,
          country: true,
          images: true,
        },
      },
    },
  })

  if (!booking) return null

  return {
    id: booking.id,
    status: booking.status,
    checkIn: booking.checkIn.toISOString(),
    checkOut: booking.checkOut.toISOString(),
    nights: booking.nights,
    totalPrice: booking.totalPrice,
    currency: booking.currency ?? 'VND',
    listing: {
      id: booking.listing?.id ?? booking.listingId,
      title: booking.listing?.title ?? 'Homestay',
      slug: booking.listing?.slug,
      city: booking.listing?.city ?? '',
      country: booking.listing?.country ?? '',
      image: booking.listing?.images?.[0] ?? null,
    },
  } satisfies ConciergeBookingContext
}

function buildIntroMessage(
  listingContext?: ConciergeListingContext | null,
  latestBooking?: ConciergeBookingContext | null,
) {
  if (listingContext) {
    const parts = [
      `Xin chào! Tôi đang hỗ trợ cho "${listingContext.title}" tại ${listingContext.city}.`,
      listingContext.availability.summary,
    ]

    if (latestBooking && latestBooking.listing.id === listingContext.id) {
      const checkIn = format(new Date(latestBooking.checkIn), 'd MMMM', { locale: vi })
      parts.push(`Lịch lưu trú gần nhất của bạn tại đây bắt đầu từ ${checkIn}.`)
    }

    parts.push('Bạn muốn tôi chuẩn bị bữa sáng, đặt xe sân bay hay đề xuất nhà hàng quanh khu vực chứ?')

    return parts.join(' ')
  }

  if (latestBooking) {
    const checkIn = format(new Date(latestBooking.checkIn), 'd MMMM', { locale: vi })
    const checkOut = format(new Date(latestBooking.checkOut), 'd MMMM', { locale: vi })
    return `Xin chào! Tôi thấy bạn vừa đặt ${latestBooking.listing.title} từ ${checkIn} tới ${checkOut}. Bạn muốn tôi hỗ trợ điều gì cho chuyến đi này?`
  }

  return 'Xin chào! Tôi là Concierge 24/7 của LuxeStay. Bạn muốn trợ giúp về hành trình hoặc dịch vụ bổ sung nào không?'
}

function buildQuickReplies(
  listingContext?: ConciergeListingContext | null,
  latestBooking?: ConciergeBookingContext | null,
): string[] {
  if (!listingContext) {
    if (latestBooking) {
      return [
        `Thêm dịch vụ vào chuyến đi ${latestBooking.listing.title}`,
        'Đặt xe sân bay',
        'Nhắn host xác nhận lại lịch',
      ]
    }

    return [
      'Gợi ý nhà hàng gần nhất',
      'Đặt xe sân bay',
      'Thêm dịch vụ vào chuyến đi',
    ]
  }

  const replies = [
    `Thêm bữa sáng cho ${listingContext.title}`,
    'Đặt xe sân bay',
    `Nhà hàng tại ${listingContext.city}`,
  ]

  if (listingContext.availability.status === 'BOOKED') {
    replies.push('Thông báo khi phòng trống lại')
  } else {
    replies.push('Giữ phòng và thanh toán')
  }

  return replies
}

export async function buildConciergeContext(
  options: ConciergeContextOptions,
): Promise<ConciergeAssistantPayload> {
  const [initialListingContext, latestBooking] = await Promise.all([
    options.listingIdentifier
      ? buildListingContext(options.listingIdentifier)
      : options.bookingId
      ? (async () => {
          const booking = await prisma.booking.findUnique({
            where: { id: options.bookingId },
            select: { listingId: true },
          })
          if (!booking) return null
          return buildListingContext(booking.listingId)
        })()
      : Promise.resolve(null),
    options.userId && (options.includeLatestBooking || options.bookingId)
      ? getLatestBookingContext(options.userId)
      : Promise.resolve(null),
  ])

  let listingContext = initialListingContext

  if (!listingContext && latestBooking?.listing?.id) {
    listingContext = await buildListingContext(latestBooking.listing.id)
  }

  const introMessage = buildIntroMessage(listingContext, latestBooking)
  const quickReplies = buildQuickReplies(listingContext, latestBooking)

  return {
    listingContext,
    latestBooking,
    introMessage,
    quickReplies,
  }
}

