import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateSlug } from '@/lib/helpers'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'

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

    const listings = await prisma.listing.findMany({
      where: categoryWhere,
      include: {
        host: {
          select: {
            id: true,
            name: true,
            image: true,
            isSuperHost: true,
          },
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
      take: limit,
      skip: skip,
      orderBy,
    }).catch((error) => {
      console.error('Database timeout in listings:', error)
      return []
    })

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
        status: 'DRAFT',
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

    return NextResponse.json({ listing }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    console.error('Create listing error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
