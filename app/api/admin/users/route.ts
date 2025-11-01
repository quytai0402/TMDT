import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type WalkInBookingRecord = {
  id: string
  contactName: string | null
  contactEmail: string | null
  contactPhone: string | null
  contactPhoneNormalized: string | null
  createdAt: Date | null
  checkIn: Date | null
  checkOut: Date | null
  totalPrice: number | null
  listing: {
    title: string | null
    city: string | null
  } | null
}

type WalkInProfile = {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  role: 'WALK_IN'
  totalSpent: number
  bookingsCount: number
  lastBookingAt: string | null
  lastCheckIn?: string | null
  lastCheckOut?: string | null
  lastListingTitle?: string | null
  lastListingCity?: string | null
  createdAt?: string | null
  _count: {
    listings: number
    bookingsAsGuest: number
    bookingsAsHost: number
  }
}

type UserMetrics = {
  totalUsers: number
  hosts: number
  guests: number
  admins: number
  walkInGuests: number
  walkInBookings: number
}

const toISO = (value?: Date | string | null) => {
  if (!value) return null
  if (value instanceof Date) return value.toISOString()
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString()
}

const buildWalkInProfiles = (bookings: WalkInBookingRecord[]) => {
  const map = new Map<string, WalkInProfile>()

  for (const booking of bookings) {
    const key =
      booking.contactEmail?.toLowerCase() ||
      booking.contactPhoneNormalized ||
      booking.contactPhone ||
      booking.id

    const createdAtISO = toISO(booking.createdAt)
    const createdAtTime = createdAtISO ? new Date(createdAtISO).getTime() : 0
    const checkInISO = toISO(booking.checkIn)
    const checkOutISO = toISO(booking.checkOut)
    const listingTitle = booking.listing?.title ?? null
    const listingCity = booking.listing?.city ?? null
    const totalPrice = Number(booking.totalPrice ?? 0)

    if (!map.has(key)) {
      map.set(key, {
        id: key,
        name: booking.contactName || 'Khách vãng lai',
        email: booking.contactEmail,
        phone: booking.contactPhone ?? booking.contactPhoneNormalized,
        role: 'WALK_IN',
        totalSpent: totalPrice,
        bookingsCount: 1,
        lastBookingAt: createdAtISO,
        lastCheckIn: checkInISO,
        lastCheckOut: checkOutISO,
        lastListingTitle: listingTitle,
        lastListingCity: listingCity,
        createdAt: createdAtISO,
        _count: {
          listings: 0,
          bookingsAsGuest: 1,
          bookingsAsHost: 0,
        },
      })
      continue
    }

    const profile = map.get(key)!

    profile.bookingsCount += 1
    profile._count.bookingsAsGuest = profile.bookingsCount
    profile.totalSpent += totalPrice
    profile.email = profile.email ?? booking.contactEmail ?? null
    profile.phone = profile.phone ?? booking.contactPhone ?? booking.contactPhoneNormalized ?? null
    if (profile.name === 'Khách vãng lai' && booking.contactName) {
      profile.name = booking.contactName
    }

    if (!profile.createdAt || (createdAtTime && profile.createdAt && createdAtTime < new Date(profile.createdAt).getTime())) {
      profile.createdAt = createdAtISO
    }

    const lastRecorded = profile.lastBookingAt ? new Date(profile.lastBookingAt).getTime() : 0
    if (createdAtTime > lastRecorded) {
      profile.lastBookingAt = createdAtISO
      profile.lastCheckIn = checkInISO
      profile.lastCheckOut = checkOutISO
      profile.lastListingTitle = listingTitle
      profile.lastListingCity = listingCity
    }
  }

  const profiles = Array.from(map.values()).sort((a, b) => {
    const aTime = a.lastBookingAt ? new Date(a.lastBookingAt).getTime() : 0
    const bTime = b.lastBookingAt ? new Date(b.lastBookingAt).getTime() : 0
    return bTime - aTime
  })

  return {
    profiles,
    totalBookings: bookings.length,
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const type = (searchParams.get('type') || 'all').toLowerCase()
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '20', 10))
    const includeMetrics = searchParams.get('metrics') !== 'false'
    const skip = (page - 1) * limit

    let walkInProfiles: WalkInProfile[] = []
    let walkInBookingsTotal = 0

    if (includeMetrics || type === 'walkin') {
      const walkInBookings = await prisma.booking.findMany({
        where: {
          guestType: 'WALK_IN',
        },
        select: {
          id: true,
          contactName: true,
          contactEmail: true,
          contactPhone: true,
          contactPhoneNormalized: true,
          createdAt: true,
          checkIn: true,
          checkOut: true,
          totalPrice: true,
          listing: {
            select: {
              title: true,
              city: true,
            },
          },
        },
      })

      const result = buildWalkInProfiles(walkInBookings as WalkInBookingRecord[])
      walkInProfiles = result.profiles
      walkInBookingsTotal = result.totalBookings
    }

    const metricsData = includeMetrics
      ? await Promise.all([
          prisma.user.count(),
          prisma.user.count({ where: { role: 'HOST' } }),
          prisma.user.count({ where: { role: 'GUEST' } }),
          prisma.user.count({ where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } } }),
        ])
      : null

    const metrics: UserMetrics | undefined = metricsData
      ? {
          totalUsers: metricsData[0],
          hosts: metricsData[1],
          guests: metricsData[2],
          admins: metricsData[3],
          walkInGuests: walkInProfiles.length,
          walkInBookings: walkInBookingsTotal,
        }
      : undefined

    if (type === 'walkin') {
      const paginatedProfiles = walkInProfiles.slice(skip, skip + limit)
      const payload: Record<string, unknown> = {
        users: paginatedProfiles,
        pagination: {
          page,
          limit,
          total: walkInProfiles.length,
          totalPages: Math.max(1, Math.ceil(walkInProfiles.length / limit)),
        },
      }
      if (metrics) payload.metrics = metrics
      return NextResponse.json(payload)
    }

    const where: Record<string, unknown> = {}
    if (type === 'host') {
      where.role = 'HOST'
    } else if (type === 'guest') {
      where.role = 'GUEST'
    } else if (type === 'admin') {
      where.role = { in: ['ADMIN', 'SUPER_ADMIN'] }
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          phone: true,
          role: true,
          status: true,
          isVerified: true,
          isHost: true,
          isSuperHost: true,
          loyaltyPoints: true,
          loyaltyTier: true,
          createdAt: true,
          lastLoginAt: true,
          _count: {
            select: {
              listings: true,
              bookingsAsGuest: true,
              bookingsAsHost: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ])

    const payload: Record<string, unknown> = {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    }
    if (metrics) payload.metrics = metrics

    return NextResponse.json(payload)
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Update user (verification, role change, etc.)
const mapUser = (user: any) => ({
  ...user,
})

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { userId, action, role, notes } = body

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'

    const updateData: Record<string, unknown> = {}

    if (action) {
      switch (String(action).toUpperCase()) {
        case 'VERIFY':
          updateData.isVerified = true
          break
        case 'UNVERIFY':
          updateData.isVerified = false
          break
        case 'SUSPEND':
          updateData.status = 'SUSPENDED'
          break
        case 'ACTIVATE':
          updateData.status = 'ACTIVE'
          break
        case 'ASSIGN_ROLE':
          if (!isSuperAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
          }
          if (!role || !['GUEST', 'HOST', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
          }
          updateData.role = role
          updateData.isHost = role === 'HOST'
          break
        default:
          return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
      }
    } else if (isSuperAdmin) {
      Object.assign(updateData, body)
      delete updateData.userId
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: action ? `USER_${action}` : 'UPDATE_USER',
        entityType: 'User',
        entityId: userId,
        changes: updateData,
      },
    })

    return NextResponse.json({ user: mapUser(user) })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
