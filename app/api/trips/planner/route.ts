import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const PLANNER_TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/
const MAX_PLANNER_DAYS = 60

const plannerItemTypeEnum = z.enum([
  'accommodation',
  'dining',
  'activity',
  'shopping',
  'sightseeing',
] as const)

const plannerItemTypeSet = new Set(plannerItemTypeEnum.options)

const plannerItemSchema = z.object({
  day: z.coerce.number().int().min(1).max(MAX_PLANNER_DAYS),
  time: z
    .string()
    .regex(PLANNER_TIME_REGEX, 'Thời gian phải ở định dạng HH:MM'),
  type: plannerItemTypeEnum,
  title: z.string().trim().min(1, 'Vui lòng nhập tiêu đề').max(120),
  location: z.string().trim().min(1, 'Vui lòng nhập địa điểm').max(200),
  notes: z.string().trim().max(500).optional(),
  duration: z.string().trim().max(120).optional(),
  cost: z.number().min(0).max(1_000_000_000).nullable().optional(),
})

const createItemSchema = z.object({
  bookingId: z.string().min(1, 'Thiếu bookingId'),
  item: plannerItemSchema,
})

const updateItemSchema = z.object({
  bookingId: z.string().min(1, 'Thiếu bookingId'),
  itemId: z.string().min(1, 'Thiếu itemId'),
  patch: plannerItemSchema.partial().refine(
    (value) => Object.keys(value).length > 0,
    'Không có dữ liệu để cập nhật',
  ),
})

const deleteItemSchema = z.object({
  bookingId: z.string().min(1, 'Thiếu bookingId'),
  itemId: z.string().min(1, 'Thiếu itemId'),
})

const querySchema = z.object({
  bookingId: z.string().optional(),
  includeHistory: z.string().optional(),
})

const bookingInclude = {
  listing: {
    select: {
      id: true,
      title: true,
      city: true,
      state: true,
      country: true,
      address: true,
      images: true,
      latitude: true,
      longitude: true,
    },
  },
  guest: {
    select: {
      loyaltyTier: true,
    },
  },
} as const

function parseBoolean(value?: string) {
  if (!value) return false
  return value === 'true' || value === '1'
}

function cloneMetadata(source: unknown) {
  if (!source || typeof source !== 'object') {
    return {}
  }
  try {
    return JSON.parse(JSON.stringify(source))
  } catch (error) {
    console.warn('Unable to clone booking metadata, fallback to empty object', error)
    return {}
  }
}

function normalizePlannerItems(rawItems: unknown) {
  if (!Array.isArray(rawItems)) return []

  return rawItems
    .filter((item): item is Record<string, any> => Boolean(item) && typeof item === 'object')
    .map((item, index) => {
      const normalizedCost = typeof item.cost === 'number'
        ? item.cost
        : typeof item.cost === 'string' && item.cost.trim() !== ''
          ? Number(item.cost)
          : null

      const rawType = typeof item.type === 'string' ? item.type : ''
      const type = plannerItemTypeSet.has(rawType) ? rawType : 'activity'

      const time = typeof item.time === 'string' && PLANNER_TIME_REGEX.test(item.time)
        ? item.time
        : '10:00'

      const title = typeof item.title === 'string' && item.title.trim() ? item.title.trim() : 'Hoạt động concierge'
      const location = typeof item.location === 'string' && item.location.trim() ? item.location.trim() : ''

      const normalized: Record<string, any> = {
        id: typeof item.id === 'string' && item.id.trim() ? item.id : `planner-${index}`,
        day: Number.isFinite(Number(item.day)) ? Number(item.day) : 1,
        time,
        type,
        title,
        location,
        notes: typeof item.notes === 'string' && item.notes.trim() ? item.notes.trim() : null,
        duration: typeof item.duration === 'string' && item.duration.trim() ? item.duration.trim() : null,
        cost: Number.isFinite(normalizedCost) ? Number(normalizedCost) : null,
      }

      if (typeof item.status === 'string') normalized.status = item.status
      if (typeof item.source === 'string') normalized.source = item.source
      if (typeof item.serviceRef === 'string') normalized.serviceRef = item.serviceRef
      if (typeof item.createdAt === 'string') normalized.createdAt = item.createdAt
      if (typeof item.updatedAt === 'string') normalized.updatedAt = item.updatedAt
      if (item.metadata && typeof item.metadata === 'object') normalized.metadata = item.metadata

      return normalized
    })
    .sort((a, b) => (a.day - b.day) || a.time.localeCompare(b.time))
}

function formatTrip(booking: any) {
  const plannerItems = normalizePlannerItems(booking?.metadata?.tripPlanner?.items)
  const services = Array.isArray(booking?.additionalServices) ? booking.additionalServices : []
  const totalServiceValue = Number(booking?.additionalServicesTotal || 0)

  const listing = booking?.listing

  return {
    id: booking.id,
    status: booking.status,
    checkIn: booking.checkIn instanceof Date ? booking.checkIn.toISOString() : new Date(booking.checkIn).toISOString(),
    checkOut: booking.checkOut instanceof Date ? booking.checkOut.toISOString() : new Date(booking.checkOut).toISOString(),
    nights: booking.nights,
    listing: listing
      ? {
          id: listing.id,
          title: listing.title,
          city: listing.city,
          state: listing.state,
          country: listing.country,
          address: listing.address ?? null,
          image: Array.isArray(listing.images) ? listing.images[0] ?? null : null,
          latitude: typeof listing.latitude === 'number' ? listing.latitude : null,
          longitude: typeof listing.longitude === 'number' ? listing.longitude : null,
        }
      : null,
    services,
    servicesTotal: totalServiceValue,
    plannerItems,
    membershipTier: booking?.guest?.loyaltyTier ?? null,
  }
}

function computeSummary(trips: Array<ReturnType<typeof formatTrip>>) {
  const accumulator = trips.reduce(
    (acc, trip) => {
      acc.totalServices += Array.isArray(trip.services) ? trip.services.length : 0
      acc.totalServiceValue += trip.servicesTotal ?? 0
      acc.totalPlannerItems += Array.isArray(trip.plannerItems) ? trip.plannerItems.length : 0
      if (trip.listing?.city) {
        acc.destinations.add(trip.listing.city)
      }
      return acc
    },
    {
      totalServices: 0,
      totalServiceValue: 0,
      totalPlannerItems: 0,
      destinations: new Set<string>(),
    },
  )

  const readiness = trips.length
    ? Math.min(100, Math.round((accumulator.totalPlannerItems / (trips.length * 5 || 1)) * 100))
    : 0

  return {
    totalTrips: trips.length,
    totalDestinations: accumulator.destinations.size,
    totalPlannerItems: accumulator.totalPlannerItems,
    totalServices: accumulator.totalServices,
    totalServiceValue: accumulator.totalServiceValue,
    readiness,
  }
}

function createPlannerItemId() {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return `planner-${crypto.randomUUID()}`
    }
  } catch (error) {
    // ignore and fallback below
  }
  return `planner-${Math.random().toString(36).slice(2, 10)}`
}

function clampPlannerDay(day: number, booking: { nights?: number | null }) {
  const nightsValue = Number.isFinite(Number(booking?.nights)) ? Number(booking?.nights) : null
  const maxByStay = nightsValue !== null ? Math.max(1, Math.min(nightsValue, MAX_PLANNER_DAYS)) : MAX_PLANNER_DAYS
  const requested = Number.isFinite(day) ? day : 1
  return Math.min(Math.max(requested, 1), maxByStay)
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parsedQuery = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams))

    if (!parsedQuery.success) {
      return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 })
    }

    const { bookingId, includeHistory } = parsedQuery.data
    const includeCompleted = parseBoolean(includeHistory)

    const statuses = includeCompleted
      ? ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']
      : ['PENDING', 'CONFIRMED', 'COMPLETED']

    const where: Record<string, unknown> = {
      guestId: session.user.id,
      status: { in: statuses },
    }

    if (bookingId) {
      where.id = bookingId
    }

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { checkIn: 'asc' },
      include: bookingInclude,
      take: bookingId ? 1 : 12,
    })

    const trips = bookings.map(formatTrip)
    const summary = computeSummary(trips)
    const now = Date.now()
    const upcomingTrip = trips.find((trip) => new Date(trip.checkIn).getTime() >= now) ?? trips[0] ?? null

    return NextResponse.json({
      trips,
      summary,
      suggestedActiveTripId: upcomingTrip?.id ?? null,
    })
  } catch (error) {
    console.error('Planner fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const parsed = createItemSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? 'Dữ liệu không hợp lệ' },
        { status: 400 },
      )
    }

    const { bookingId, item } = parsed.data

    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        guestId: session.user.id,
      },
      include: bookingInclude,
    })

    if (!booking) {
      return NextResponse.json({ error: 'Không tìm thấy booking phù hợp' }, { status: 404 })
    }

    const metadata = cloneMetadata(booking.metadata)
    const planner = metadata.tripPlanner && typeof metadata.tripPlanner === 'object'
      ? { ...metadata.tripPlanner }
      : {}
    const existingItems = Array.isArray(planner.items) ? [...planner.items] : []

    const nowIso = new Date().toISOString()
    const newItem = {
      id: createPlannerItemId(),
      day: clampPlannerDay(item.day, booking),
      time: item.time,
      type: item.type,
      title: item.title.trim(),
      location: item.location.trim(),
      notes: item.notes?.trim() ?? null,
      duration: item.duration?.trim() ?? null,
      cost: item.cost ?? null,
      status: 'PLANNED',
      source: 'manual',
      createdAt: nowIso,
    }

    existingItems.push(newItem)
    planner.items = existingItems
    planner.lastUpdated = nowIso
    metadata.tripPlanner = planner

    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        metadata,
        updatedAt: new Date(),
      },
      include: bookingInclude,
    })

    const trip = formatTrip(updatedBooking)
    return NextResponse.json({ trip })
  } catch (error) {
    console.error('Planner create error:', error)
    return NextResponse.json({ error: 'Không thể thêm hoạt động' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const parsed = updateItemSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? 'Dữ liệu không hợp lệ' },
        { status: 400 },
      )
    }

    const { bookingId, itemId, patch } = parsed.data

    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        guestId: session.user.id,
      },
      include: bookingInclude,
    })

    if (!booking) {
      return NextResponse.json({ error: 'Không tìm thấy booking phù hợp' }, { status: 404 })
    }

    const metadata = cloneMetadata(booking.metadata)
    const planner = metadata.tripPlanner && typeof metadata.tripPlanner === 'object'
      ? { ...metadata.tripPlanner }
      : {}
    const items = Array.isArray(planner.items) ? [...planner.items] : []

    const index = items.findIndex((existing: any) => existing && existing.id === itemId)
    if (index === -1) {
      return NextResponse.json({ error: 'Không tìm thấy hoạt động' }, { status: 404 })
    }

    const existingItem = items[index] ?? {}
    const nowIso = new Date().toISOString()

    const updatedItem = {
      ...existingItem,
      day: patch.day ?? existingItem.day ?? 1,
      time: patch.time ?? existingItem.time ?? '10:00',
      type: patch.type ?? existingItem.type ?? 'activity',
      title: (patch.title ?? existingItem.title ?? 'Hoạt động concierge').trim(),
      location: (patch.location ?? existingItem.location ?? '').trim(),
      notes: patch.notes !== undefined ? (patch.notes?.trim() || null) : existingItem.notes ?? null,
      duration: patch.duration !== undefined ? (patch.duration?.trim() || null) : existingItem.duration ?? null,
      cost: patch.cost !== undefined ? patch.cost : existingItem.cost ?? null,
      updatedAt: nowIso,
    }

    updatedItem.day = clampPlannerDay(Number(updatedItem.day) || 1, booking)

    items[index] = updatedItem
    planner.items = items
    planner.lastUpdated = nowIso
    metadata.tripPlanner = planner

    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        metadata,
        updatedAt: new Date(),
      },
      include: bookingInclude,
    })

    const trip = formatTrip(updatedBooking)
    return NextResponse.json({ trip })
  } catch (error) {
    console.error('Planner update error:', error)
    return NextResponse.json({ error: 'Không thể cập nhật hoạt động' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const parsed = deleteItemSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? 'Dữ liệu không hợp lệ' },
        { status: 400 },
      )
    }

    const { bookingId, itemId } = parsed.data

    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        guestId: session.user.id,
      },
      include: bookingInclude,
    })

    if (!booking) {
      return NextResponse.json({ error: 'Không tìm thấy booking phù hợp' }, { status: 404 })
    }

    const metadata = cloneMetadata(booking.metadata)
    const planner = metadata.tripPlanner && typeof metadata.tripPlanner === 'object'
      ? { ...metadata.tripPlanner }
      : {}
    const items = Array.isArray(planner.items) ? [...planner.items] : []

    const index = items.findIndex((existing: any) => existing && existing.id === itemId)
    if (index === -1) {
      return NextResponse.json({ error: 'Không tìm thấy hoạt động' }, { status: 404 })
    }

    items.splice(index, 1)
    planner.items = items
    planner.lastUpdated = new Date().toISOString()
    metadata.tripPlanner = planner

    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        metadata,
        updatedAt: new Date(),
      },
      include: bookingInclude,
    })

    const trip = formatTrip(updatedBooking)
    return NextResponse.json({ trip })
  } catch (error) {
    console.error('Planner delete error:', error)
    return NextResponse.json({ error: 'Không thể xoá hoạt động' }, { status: 500 })
  }
}
