import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { triggerPusherEvent } from "@/lib/pusher"
import { z } from "zod"

// GET /api/community/posts/[id] - Get specific post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const post = await prisma.post.findUnique({
      where: { id },
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
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    })

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    return NextResponse.json(post)
  } catch (error) {
    console.error("Error fetching post:", error)
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 }
    )
  }
}

// DELETE /api/community/posts/[id] - Delete post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const post = await prisma.post.findUnique({
      where: { id },
      select: { authorId: true },
    })

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Check if user is the author or admin
    if (post.authorId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.post.delete({
      where: { id },
    })

    await triggerPusherEvent("community-feed", "post-deleted", { id })

    return NextResponse.json({ message: "Post deleted successfully" })
  } catch (error) {
    console.error("Error deleting post:", error)
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    )
  }
}

// PATCH /api/community/posts/[id] - Like/unlike post
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const action = body?.action as string | undefined
    const userId = session.user.id

    const likeResponse = await handleLikeActions(action, id, userId)
    if (likeResponse) {
      return likeResponse
    }

    if (action === "update") {
      const updateSchema = z.object({
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
        location: z.string().optional(),
        listingId: z.string().optional(),
      })

      const validated = updateSchema.parse(body)

      const post = await prisma.post.findUnique({
        where: { id },
        select: { authorId: true },
      })

      if (!post) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 })
      }

      if (post.authorId !== session.user.id && session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }

      const updated = await prisma.post.update({
        where: { id },
        data: {
          content: validated.content,
          media: validated.media ?? [],
          location: validated.location,
          listingId: validated.listingId,
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

      const formatted = {
        id: updated.id,
        author: {
          id: updated.author.id,
          name: updated.author.name || "User",
          avatar: updated.author.image,
          role: updated.author.role.toLowerCase(),
          verified: Boolean(updated.author.isVerified || updated.author.isSuperHost),
        },
        content: updated.content,
        media: Array.isArray(updated.media)
          ? updated.media.map((mediaItem: unknown) => {
              const item = mediaItem as { type?: string; url?: string; caption?: string }
              return {
                type: item?.type ?? "image",
                url: item?.url ?? "",
                caption: item?.caption,
              }
            })
          : [],
        listing: updated.listing
          ? {
              id: updated.listing.id,
              title: updated.listing.title,
              location: `${updated.listing.city}${
                updated.listing.state ? ", " + updated.listing.state : ""
              }`,
              image: updated.listing.images[0],
            }
          : undefined,
        location: updated.location,
        likes: updated.likesCount,
        comments: updated._count.comments,
        shares: updated.sharesCount,
        timestamp: updated.createdAt.toISOString(),
        isLiked: false,
        isBookmarked: false,
      }

      await triggerPusherEvent("community-feed", "post-updated", formatted)
      return NextResponse.json(formatted)
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error updating post:", error)
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    )
  }
}

async function handleLikeActions(
  action: string | undefined,
  postId: string,
  userId: string
) {
  if (action !== "like" && action !== "unlike") {
    return null
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { likes: true, likesCount: true },
  })

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 })
  }

  const hasLiked = post.likes.includes(userId)

  if (action === "like" && !hasLiked) {
    const updated = await prisma.post.update({
      where: { id: postId },
      data: {
        likes: { push: userId },
        likesCount: { increment: 1 },
      },
      select: { likesCount: true },
    })

    await triggerPusherEvent("community-feed", "post-engagement", {
      id: postId,
      likesCount: updated.likesCount,
      userId,
      liked: true,
    })

    return NextResponse.json({ liked: true, likesCount: updated.likesCount })
  }

  if (action === "unlike" && hasLiked) {
    const newLikes = post.likes.filter((id) => id !== userId)
    const updated = await prisma.post.update({
      where: { id: postId },
      data: {
        likes: newLikes,
        likesCount: { decrement: 1 },
      },
      select: { likesCount: true },
    })

    await triggerPusherEvent("community-feed", "post-engagement", {
      id: postId,
      likesCount: updated.likesCount,
      userId,
      liked: false,
    })

    return NextResponse.json({ liked: false, likesCount: updated.likesCount })
  }

  return NextResponse.json({
    liked: hasLiked,
    likesCount: post.likesCount,
  })
}
