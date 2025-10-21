import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const posts = await prisma.post.findMany({
      where: {
        status: 'ACTIVE',
        isPublic: true,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true,
            isVerified: true,
          },
        },
        listing: {
          select: {
            id: true,
            title: true,
            city: true,
            state: true,
            images: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })

    const transformedPosts = posts.map((post) => ({
      id: post.id,
      author: {
        id: post.author.id,
        name: post.author.name || 'Anonymous',
        avatar: post.author.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author.name ?? 'guest'}`,
        role: post.author.role === 'HOST' ? 'host' : 'guest',
        verified: post.author.isVerified ?? false,
      },
      content: post.content,
      media: Array.isArray(post.media)
        ? post.media.map((item) => ({
            type: typeof item === 'object' && item !== null && 'type' in item ? (item as { type: string }).type : 'image',
            url: typeof item === 'object' && item !== null && 'url' in item ? (item as { url: string }).url : '',
            caption: typeof item === 'object' && item !== null && 'caption' in item ? (item as { caption?: string }).caption : undefined,
          }))
        : [],
      listing: post.listing
        ? {
            id: post.listing.id,
            title: post.listing.title,
            location: `${post.listing.city}, ${post.listing.state ?? ''}`.trim(),
            image: post.listing.images?.[0] ?? '',
          }
        : null,
      location: post.location || '',
      likes: post.likesCount,
      comments: post.commentsCount,
      shares: post.sharesCount,
      timestamp: post.createdAt.toISOString(),
      isLiked: false,
    }))

    return NextResponse.json({
      posts: transformedPosts,
      hasMore: posts.length === limit,
    })
  } catch (error) {
    console.error('Error fetching social posts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Create new post
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { content, media, listingId, location, latitude, longitude, isPublic = true } = await req.json()

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const post = await prisma.post.create({
      data: {
        authorId: session.user.id,
        content,
        listingId: listingId || null,
        location: location || null,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        isPublic,
        media: Array.isArray(media)
          ? media.map((item: any) => ({
              type: item?.type ?? 'image',
              url: item?.url ?? '',
              caption: item?.caption ?? undefined,
            }))
          : [],
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true,
            isVerified: true,
          },
        },
        listing: {
          select: {
            id: true,
            title: true,
            city: true,
            state: true,
            images: true,
          },
        },
      },
    })

    return NextResponse.json({
      id: post.id,
      author: {
        id: post.author.id,
        name: post.author.name || 'Anonymous',
        avatar: post.author.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author.name ?? 'guest'}`,
        role: post.author.role === 'HOST' ? 'host' : 'guest',
        verified: post.author.isVerified ?? false,
      },
      content: post.content,
      media: Array.isArray(post.media)
        ? post.media.map((item) => ({
            type: typeof item === 'object' && item !== null && 'type' in item ? (item as { type: string }).type : 'image',
            url: typeof item === 'object' && item !== null && 'url' in item ? (item as { url: string }).url : '',
            caption: typeof item === 'object' && item !== null && 'caption' in item ? (item as { caption?: string }).caption : undefined,
          }))
        : [],
      listing: post.listing
        ? {
            id: post.listing.id,
            title: post.listing.title,
            location: `${post.listing.city}, ${post.listing.state ?? ''}`.trim(),
            image: post.listing.images?.[0] ?? '',
          }
        : null,
      likes: post.likesCount,
      comments: post.commentsCount,
      shares: post.sharesCount,
      timestamp: post.createdAt.toISOString(),
      isLiked: false,
    })
  } catch (error) {
    console.error('Error creating social post:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
