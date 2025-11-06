import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Cache for wishlist (30 seconds TTL)
const wishlistCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 30000

// GET /api/wishlist - Get user wishlist
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check cache
    const cacheKey = `wishlist-${session.user.id}`
    const cached = wishlistCache.get(cacheKey)
    const now = Date.now()

    if (cached && now - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data)
    }

    // Get user's wishlist
    const wishlist = await prisma.wishlist.findFirst({
      where: { userId: session.user.id },
    }).catch((error) => {
      console.error('Database timeout in wishlist:', error)
      return null
    })

    if (!wishlist || wishlist.listingIds.length === 0) {
      wishlistCache.set(cacheKey, { data: [], timestamp: now })
      return NextResponse.json([])
    }

    // Get all listings in wishlist with optimized select
    const listings = await prisma.listing.findMany({
      where: {
        id: { in: wishlist.listingIds },
      },
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
        host: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    }).catch((error) => {
      console.error('Database timeout in wishlist listings:', error)
      return []
    })

    // Cache the result
    wishlistCache.set(cacheKey, { data: listings, timestamp: now })

    return NextResponse.json(listings)
  } catch (error: any) {
    console.error('Error fetching wishlist:', error)
    // Return empty array instead of error for better UX
    return NextResponse.json([])
  }
}

// POST /api/wishlist - Add to wishlist
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { listingId } = await req.json()

    if (!listingId) {
      return NextResponse.json(
        { error: 'Listing ID is required' },
        { status: 400 }
      )
    }

    // Get or create user's wishlist
    let wishlist = await prisma.wishlist.findFirst({
      where: { userId: session.user.id },
    })

    if (!wishlist) {
      wishlist = await prisma.wishlist.create({
        data: {
          userId: session.user.id,
          listingIds: [listingId],
        },
      })
    } else {
      // Check if already in wishlist
      if (wishlist.listingIds.includes(listingId)) {
        return NextResponse.json(
          { error: 'Already in wishlist' },
          { status: 400 }
        )
      }

      // Add to wishlist
      wishlist = await prisma.wishlist.update({
        where: { id: wishlist.id },
        data: {
          listingIds: {
            push: listingId,
          },
        },
      })
    }

    // Track quest progress for wishlist (async, don't block response)
    fetch(`${process.env.NEXTAUTH_URL}/api/quests/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': req.headers.get('cookie') || ''
      },
      body: JSON.stringify({
        trigger: 'WISHLIST_ADDED',
        metadata: { listingId }
      })
    }).catch(err => {
      console.error("Failed to track wishlist quest:", err)
    })

    return NextResponse.json(wishlist)
  } catch (error: any) {
    console.error('Error adding to wishlist:', error)
    return NextResponse.json(
      { error: 'Failed to add to wishlist' },
      { status: 500 }
    )
  }
}
