import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Cache user profiles (10 seconds TTL - short because it changes often)
const profileCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 10000

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check cache
    const cached = profileCache.get(session.user.id)
    const now = Date.now()

    if (cached && now - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data)
    }

    const queryPromise = prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        phone: true,
        bio: true,
        role: true,
        isVerified: true,
        createdAt: true,
        _count: {
          select: {
            bookingsAsGuest: true,
            listings: true,
            reviewsWritten: true,
          },
        },
      },
    })

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout')), 2000)
    )

    const user = await Promise.race([queryPromise, timeoutPromise]).catch((error) => {
      console.error('Profile query error:', error)
      return null
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Cache result
    profileCache.set(session.user.id, { data: user, timestamp: now })

    return NextResponse.json(user)
  } catch (error: any) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

// PUT /api/user/profile - Update user profile
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, phone, bio, image } = body

    // Get current user state
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        phone: true,
        bio: true,
        image: true,
      }
    })

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(bio && { bio }),
        ...(image && { image }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        phone: true,
        bio: true,
      },
    })

    // Clear cache for this user
    profileCache.delete(session.user.id)

    // Check if profile just became complete
    const wasIncomplete = !currentUser?.name || !currentUser?.phone || !currentUser?.bio || !currentUser?.image
    const isNowComplete = updatedUser.name && updatedUser.phone && updatedUser.bio && updatedUser.image

    // Award points for profile completion (async, don't block response)
    if (wasIncomplete && isNowComplete) {
      fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/rewards/actions`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': req.headers.get('cookie') || ''
        },
        body: JSON.stringify({
          actionType: 'PROFILE_COMPLETED',
          metadata: {
            timestamp: new Date().toISOString()
          }
        })
      }).catch(err => {
        console.error('Failed to award profile completion points:', err)
      })
    }

    return NextResponse.json(updatedUser)
  } catch (error: any) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
