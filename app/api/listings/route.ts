import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateSlug } from '@/lib/helpers'
import { getMembershipForUser } from '@/lib/membership'
import { notifyAdmins, notifyUser } from '@/lib/notifications'
import { NotificationType } from '@prisma/client'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'

// Aggressive cache for public listings with smart TTL
const listingsCache = new Map<string, { data: any[]; timestamp: number }>()
const CACHE_TTL = 60000 // 60 seconds for regular requests
const CACHE_TTL_LONG = 300000 // 5 minutes for large requests (50+ items)

function buildCategoryQuery(category: string | null) {
  const where: Prisma.ListingWhereInput = {
    status: 'ACTIVE',
  }

  let orderBy: Prisma.ListingOrderByWithRelationInput[] = [{ createdAt: 'desc' }]

  switch ((category || '').toLowerCase()) {
    case 'luxury':
      where.featured = true
      orderBy = [{ averageRating: 'desc' }, { basePrice: 'desc' }]
      break
    case 'beach':
      where.city = {
        in: ['Đà Nẵng', 'Nha Trang', 'Phú Quốc', 'Vũng Tàu', 'Hội An', 'Quy Nhơn'],
        mode: 'insensitive',
      }
      orderBy = [{ averageRating: 'desc' }, { totalBookings: 'desc' }]
      break
    case 'mountain':
      where.city = {
        in: ['Đà Lạt', 'Sa Pa', 'Tam Đảo', 'Mộc Châu', 'Bảo Lộc'],
        mode: 'insensitive',
      }
      orderBy = [{ totalBookings: 'desc' }, { averageRating: 'desc' }]
      break
    case 'countryside':
      where.propertyType = {
        in: ['FARM_STAY', 'BUNGALOW', 'CABIN'],
      }
      orderBy = [{ createdAt: 'desc' }]
      break
    case 'city':
      where.propertyType = {
        in: ['APARTMENT', 'CONDO'],
      }
      orderBy = [{ views: 'desc' }, { createdAt: 'desc' }]
      break
    case 'villa':
      where.propertyType = 'VILLA'
      orderBy = [{ basePrice: 'desc' }, { averageRating: 'desc' }]
      break
    case 'favorite':
      orderBy = [{ averageRating: 'desc' }, { totalReviews: 'desc' }]
      break
    case 'trending':
    default:
      orderBy = [{ totalBookings: 'desc' }, { createdAt: 'desc' }]
      break
  }

  return { where, orderBy }
}

const createListingSchema = z.object({
  title: z.string().min(10, 'Tiêu đề phải có ít nhất 10 ký tự'),
  description: z.string().min(50, 'Mô tả phải có ít nhất 50 ký tự'),
  propertyType: z.enum([
    'APARTMENT',
    'HOUSE',
    'VILLA',
    'CONDO',
    'TOWNHOUSE',
    'BUNGALOW',
    'CABIN',
    'FARM_STAY',
    'BOAT',
    'UNIQUE',
  ]),
  roomType: z.enum(['ENTIRE_PLACE', 'PRIVATE_ROOM', 'SHARED_ROOM']),
  maxGuests: z.number().min(1),
  bedrooms: z.number().min(0),
  beds: z.number().min(1),
  bathrooms: z.number().min(0.5),
  country: z.string(),
  city: z.string(),
  address: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  basePrice: z.number().min(0),
  cleaningFee: z.number().min(0).optional(),
  images: z.array(z.string()).min(5, 'Cần ít nhất 5 ảnh'),
  amenities: z.array(z.string()),
  nearbyPlaces: z.array(z.any()).optional(), // Auto-detected nearby places from SerpAPI
})

// GET all listings (public or host-specific)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const hostId = searchParams.get('hostId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit
    const category = searchParams.get('category')
    const secretOnly = searchParams.get('secretOnly') === 'true'
    const session = await getServerSession(authOptions)

    // If requesting specific host's listings (including "me")
    if (hostId) {
      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const actualHostId = hostId === 'me' ? session.user.id : hostId

      const listings = await prisma.listing.findMany({
        where: { hostId: actualHostId },
        include: {
          _count: {
            select: {
              bookings: true,
              reviews: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      return NextResponse.json({ listings })
    }

    // Public listings - return active listings with pagination
    const { where: categoryWhere, orderBy } = buildCategoryQuery(category)
    if (secretOnly) {
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      const membership = await getMembershipForUser(session.user.id)
      const isAdmin = session.user.role === 'ADMIN'

      if (!membership?.isActive && !isAdmin) {
        return NextResponse.json({ error: 'Membership required' }, { status: 403 })
      }
      categoryWhere.isSecret = true
    } else {
      categoryWhere.isSecret = false
    }

    // Check cache for public listings with smart TTL
    const cacheKey = `${category}-${page}-${limit}-${secretOnly}`
    const cached = listingsCache.get(cacheKey)
    const now = Date.now()
    
    // Use longer cache for large requests (50+ items)
    const cacheTTL = limit >= 50 ? CACHE_TTL_LONG : CACHE_TTL
    
    if (cached && now - cached.timestamp < cacheTTL && !secretOnly) {
      return NextResponse.json(cached.data)
    }

    // Optimize: Only select needed fields with timeout protection
    // Longer timeout for large requests
    const timeoutDuration = limit >= 50 ? 8000 : 5000
    
    const queryPromise = prisma.listing.findMany({
      where: categoryWhere,
      select: {
        id: true,
        title: true,
        slug: true,
        images: true,
        city: true,
        country: true,
        basePrice: true,
        averageRating: true,
        totalReviews: true,
        maxGuests: true,
        bedrooms: true,
        bathrooms: true,
        propertyType: true,
        instantBookable: true,
        featured: true,
        isSecret: true,
        host: {
          select: {
            id: true,
            name: true,
            image: true,
            isSuperHost: true,
          },
        },
      },
      take: limit,
      skip: skip,
      orderBy,
    })

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout')), timeoutDuration)
    )

    const listings = await Promise.race([queryPromise, timeoutPromise]).catch(async (error) => {
      console.warn('Listings query exceeded timeout, retrying once without race condition:', error)
      try {
        return await queryPromise
      } catch (fallbackError) {
        console.error('Database error in listings after fallback:', fallbackError)
        return []
      }
    })

    // Cache public listings
    if (!secretOnly) {
      listingsCache.set(cacheKey, {
        data: listings,
        timestamp: now
      })
    }

    return NextResponse.json(listings)
  } catch (error) {
    console.error('Get listings error:', error)
    // Return empty array instead of error for better UX
    return NextResponse.json([])
  }
}

// CREATE new listing
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = createListingSchema.parse(body)

    // Generate slug
    const slug = generateSlug(validatedData.title)

    // Create listing
    const listing = await prisma.listing.create({
      data: {
        ...validatedData,
        slug,
        hostId: session.user.id,
        status: 'PENDING_REVIEW',
      },
      include: {
        host: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Update user to host if not already
    if (!session.user.isHost) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          isHost: true,
          hostProfile: {
            create: {},
          },
        },
      })
    }

    const hostName = listing.host?.name || session.user.name || 'Host'

    await notifyAdmins({
      type: NotificationType.SYSTEM,
      title: 'Listing mới chờ duyệt',
      message: `${hostName} vừa gửi "${listing.title}" để duyệt.`,
      link: `/admin/listings?highlight=${listing.id}`,
      data: {
        listingId: listing.id,
        hostId: listing.hostId,
      },
    })

    await notifyUser(listing.hostId, {
      type: NotificationType.SYSTEM,
      title: 'Đã gửi listing để duyệt',
      message: `Listing "${listing.title}" đang chờ quản trị viên phê duyệt.`,
      link: `/host/listings/${listing.id}`,
      data: {
        listingId: listing.id,
        status: listing.status,
      },
    })

    return NextResponse.json({ listing }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    console.error('Create listing error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
