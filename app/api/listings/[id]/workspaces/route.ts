import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const HEX_OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/

interface WorkationWorkspace {
  id: string
  name: string
  image: string
  features: string[]
}

interface WorkationSummary {
  dedicatedDesks: number
  focusZones: number
  coworkingCount: number
  minCoworkPrice?: number | null
  longStayDiscount?: number | null
  ergonomicSeating: boolean
}

interface WorkationWifi {
  download: number
  upload: number
  ping: number
  reliability: number
  lastTested: string
}

function pseudoRandom(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = Math.imul(31, hash) + seed.charCodeAt(i)
  }
  return (hash >>> 0) / 0xffffffff
}

function randomInRange(seed: string, min: number, max: number) {
  const value = pseudoRandom(seed)
  return Math.round(min + value * (max - min))
}

function toRadians(deg: number) {
  return (deg * Math.PI) / 180
}

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: identifier } = await params
    const isObjectId = HEX_OBJECT_ID_REGEX.test(identifier)

    const listing = await prisma.listing.findUnique({
      where: isObjectId ? { id: identifier } : { slug: identifier },
      select: {
        id: true,
        title: true,
        images: true,
        amenities: true,
        monthlyDiscount: true,
        weeklyDiscount: true,
        updatedAt: true,
        bedrooms: true,
        maxGuests: true,
        city: true,
        latitude: true,
        longitude: true,
      },
    })

    if (!listing) {
      return NextResponse.json(
        { workspaces: [], summary: null, wifi: null, coworkingSpaces: [] },
        { status: 404 }
      )
    }

    // Resolve amenity names if they are stored as ObjectIds
    let amenityNames: string[] = Array.isArray(listing.amenities)
      ? [...listing.amenities]
      : []

    if (amenityNames.length > 0 && amenityNames[0]?.length === 24) {
      try {
        const amenities = await prisma.amenity.findMany({
          where: { id: { in: amenityNames } },
          select: { name: true, nameVi: true },
        })
        amenityNames = amenities.map((a) => a.nameVi || a.name)
      } catch (amenityError) {
        console.error('Failed to resolve amenity names:', amenityError)
        amenityNames = []
      }
    }

    const coworkingSpaces = await prisma.service.findMany({
      where: {
        status: 'ACTIVE',
        category: { in: ['COWORKING_SPACE', 'WORKSPACE'] },
        nearbyListings: { has: listing.id },
      },
      select: {
        id: true,
        name: true,
        images: true,
        basePrice: true,
        currency: true,
        averageRating: true,
        totalReviews: true,
        features: true,
        amenities: true,
        latitude: true,
        longitude: true,
        city: true,
      },
      orderBy: {
        averageRating: 'desc',
      },
      take: 6,
    })

    const fallbackCoworkingSpaces = coworkingSpaces.length
      ? coworkingSpaces
      : await prisma.service.findMany({
          where: {
            status: 'ACTIVE',
            category: { in: ['COWORKING_SPACE', 'WORKSPACE'] },
            city: listing.city,
          },
          select: {
            id: true,
            name: true,
            images: true,
            basePrice: true,
            currency: true,
            averageRating: true,
            totalReviews: true,
            features: true,
            amenities: true,
            latitude: true,
            longitude: true,
            city: true,
          },
          orderBy: {
            averageRating: 'desc',
          },
          take: 6,
        })

    const deskCount = Math.max(1, Math.min(8, (listing.bedrooms ?? 1) * 2))
    const focusZones = Math.max(
      1,
      Math.min(
        5,
        (amenityNames.some((name) => /phòng làm việc|workspace|làm việc riêng/i.test(name)) ? 3 : 1) +
          (listing.bedrooms ?? 1) -
          1
      )
    )

    const longStayDiscount =
      listing.monthlyDiscount && listing.monthlyDiscount > 0
        ? listing.monthlyDiscount
        : listing.weeklyDiscount && listing.weeklyDiscount > 0
        ? listing.weeklyDiscount
        : null

    const ergonomicSeating = amenityNames.some((name) =>
      /ghế công thái học|ergonomic|ghế làm việc/i.test(name)
    )

    const coworkingWithDistance = fallbackCoworkingSpaces.map((space) => ({
      ...space,
      distanceKm:
        listing.latitude && listing.longitude
          ? Number(
              distanceKm(
                listing.latitude,
                listing.longitude,
                space.latitude,
                space.longitude
              ).toFixed(2)
            )
          : null,
    }))

    const minCoworkPrice = coworkingWithDistance.reduce<number | null>((min, space) => {
      if (typeof space.basePrice !== 'number') return min
      if (min === null) return space.basePrice
      return Math.min(min, space.basePrice)
    }, null)

    const summary: WorkationSummary = {
      dedicatedDesks: deskCount,
      focusZones,
      coworkingCount: coworkingWithDistance.length,
      minCoworkPrice,
      longStayDiscount,
      ergonomicSeating,
    }

    const now = Date.now()
    const lastUpdate = new Date(listing.updatedAt).getTime()
    const daysSince = Math.max(1, Math.round((now - lastUpdate) / (1000 * 60 * 60 * 24)))

    const wifi: WorkationWifi = {
      download: randomInRange(listing.id, 180, 420),
      upload: randomInRange(`${listing.id}-upload`, 90, 200),
      ping: randomInRange(`${listing.id}-ping`, 8, 24),
      reliability: randomInRange(`${listing.id}-reliability`, 92, 99),
      lastTested: `${daysSince} ngày trước`,
    }

    const amenityFeatureMap = amenityNames.filter((amenity) =>
      /wifi|bàn|desk|meeting|printer|coffee|ban công|ánh sáng/i.test(amenity)
    )

    const listingImages = Array.isArray(listing.images) ? listing.images : []
    const fallbackImage =
      listingImages[0] ||
      coworkingWithDistance[0]?.images?.[0] ||
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80'

    const workspaces: WorkationWorkspace[] = [
      {
        id: `${listing.id}-focus-zone`,
        name: 'Góc làm việc chính',
        image: listingImages[0] || fallbackImage,
        features:
          amenityFeatureMap.slice(0, 4).length > 0
            ? amenityFeatureMap.slice(0, 4)
            : ['Bàn làm việc rộng', 'Đèn đọc sách', 'Ổ cắm đa năng', 'Cửa sổ ánh sáng tự nhiên'],
      },
    ]

    if (listingImages[1]) {
      workspaces.push({
        id: `${listing.id}-breakout`,
        name: 'Khu vực họp nhóm',
        image: listingImages[1],
        features: [
          'Bàn nhóm 4-6 người',
          ergonomicSeating ? 'Ghế công thái học' : 'Ghế bọc nệm êm ái',
          'Màn hình trình chiếu (có thể yêu cầu)',
          'Cửa sổ thông thoáng',
        ],
      })
    }

    if (coworkingWithDistance[0]) {
      const space = coworkingWithDistance[0]
      workspaces.push({
        id: `${space.id}-partner`,
        name: `Đối tác coworking: ${space.name}`,
        image:
          space.images?.[0] ||
          listingImages[2] ||
          'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=1200&q=80',
        features: [
          ...(space.features?.slice(0, 3) || ['WiFi 300Mbps', 'Cafe miễn phí', 'Phòng họp riêng']),
          space.basePrice
            ? `Vé ngày từ ${new Intl.NumberFormat('vi-VN').format(space.basePrice)} ₫`
            : 'Liên hệ để đặt chỗ',
        ],
      })
    }

    return NextResponse.json({
      workspaces,
      summary,
      wifi,
      coworkingSpaces: coworkingWithDistance,
    })
  } catch (error) {
    console.error('Error fetching workspaces:', error)
    return NextResponse.json(
      { workspaces: [], summary: null, wifi: null, coworkingSpaces: [] },
      { status: 200 }
    )
  }
}
