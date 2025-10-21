import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { Prisma, PrismaClient } from "@prisma/client"
import { z } from "zod"
import { triggerPusherEvent } from "@/lib/pusher"

const postClient = (prisma as PrismaClient & { post: Prisma.PostDelegate }).post

function formatPost(
  post: any,
  currentUserId: string | null = null
) {
  return {
    id: post.id,
    author: {
      id: post.author.id,
      name: post.author.name || "User",
      avatar: post.author.image,
      role: post.author.role.toLowerCase(),
      verified: Boolean(post.author.isVerified || post.author.isSuperHost),
    },
    content: post.content,
    media: Array.isArray(post.media)
      ? post.media.map((mediaItem: unknown) => {
          const item = mediaItem as { type?: string; url?: string; caption?: string }
          return {
            type: item?.type ?? "image",
            url: item?.url ?? "",
            caption: item?.caption,
          }
        })
      : [],
    listing: post.listing
      ? {
          id: post.listing.id,
          title: post.listing.title,
          location: `${post.listing.city}${
            post.listing.state ? ", " + post.listing.state : ""
          }`,
          image: post.listing.images[0],
        }
      : undefined,
    location: post.location,
    likes: post.likesCount,
    comments: post._count?.comments ?? post.commentsCount ?? 0,
    shares: post.sharesCount,
    timestamp: post.createdAt.toISOString(),
    isLiked: currentUserId ? post.likes.includes(currentUserId) : false,
    isBookmarked: false,
  }
}

// GET /api/community/posts - Fetch posts (with pagination)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const currentUserId = session?.user?.id ?? null

    const { searchParams } = new URL(request.url)
    const cursor = searchParams.get("cursor")
    const limit = parseInt(searchParams.get("limit") || "10", 10)
    const authorId = searchParams.get("authorId")
    const listingId = searchParams.get("listingId")

    const where: Prisma.PostWhereInput = {
      status: "ACTIVE",
      isPublic: true,
      ...(authorId ? { authorId } : {}),
      ...(listingId ? { listingId } : {}),
    }

    const posts = await postClient.findMany({
      where,
      take: limit,
      ...(cursor && {
        skip: 1,
        cursor: { id: cursor },
      }),
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true,
            isVerified: true,
            isSuperHost: true,
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
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    const formattedPosts = posts.map((post) => formatPost(post, currentUserId))

    return NextResponse.json({
      posts: formattedPosts,
      nextCursor: posts.length === limit ? posts[posts.length - 1].id : null,
    })
  } catch (error) {
    console.error("Error fetching posts:", error)
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 })
  }
}

const createPostSchema = z.object({
  content: z.string().min(1).max(5000),
  media: z
    .array(
      z.object({
        type: z.enum(["image", "video"]),
        url: z.string().url(),
        caption: z.string().optional(),
      })
    )
    .optional(),
  listingId: z.string().optional(),
  location: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
})

// POST /api/community/posts - Create new post
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validated = createPostSchema.parse(body)

    const post = await postClient.create({
      data: {
        authorId: session.user.id,
        content: validated.content,
        media: validated.media ?? [],
        listingId: validated.listingId,
        location: validated.location,
        latitude: validated.latitude,
        longitude: validated.longitude,
        status: "ACTIVE",
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
            isSuperHost: true,
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
        _count: {
          select: {
            comments: true,
          },
        },
      },
    })

    const formattedPost = formatPost(post, session.user.id)

    await triggerPusherEvent("community-feed", "post-created", formattedPost)

    return NextResponse.json(formattedPost, { status: 201 })
  } catch (error) {
    console.error("Error creating post:", error)
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 })
  }
}
