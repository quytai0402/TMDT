import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { formatISO } from "date-fns"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!session.user.isGuide) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const guideProfile = await prisma.guideProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        averageRating: true,
        totalReviews: true,
      },
    })

    if (!guideProfile) {
      return NextResponse.json({ error: "Guide profile not found" }, { status: 404 })
    }

    const reviews = await prisma.experienceReview.findMany({
      where: {
        experience: {
          OR: [
            { guideProfileId: guideProfile.id },
            { guideProfileId: null, hostId: session.user.id },
          ],
        },
      },
      select: {
        id: true,
        rating: true,
        content: true,
        images: true,
        createdAt: true,
        experience: {
          select: {
            id: true,
            title: true,
            city: true,
            image: true,
          },
        },
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    })

    const ratingsBreakdown: Record<string, number> = {
      "5": 0,
      "4": 0,
      "3": 0,
      "2": 0,
      "1": 0,
    }

    for (const review of reviews) {
      const bucket = Math.round(review.rating)
      const key = String(Math.min(5, Math.max(1, bucket)))
      ratingsBreakdown[key] += 1
    }

    return NextResponse.json({
      reviews,
      stats: {
        averageRating: guideProfile.averageRating ?? 0,
        totalReviews: guideProfile.totalReviews ?? reviews.length,
        ratingsBreakdown,
        lastReviewAt: reviews[0]?.createdAt ? formatISO(reviews[0].createdAt) : null,
      },
      navMetrics: {
        upcomingExperiences: 0,
        pendingBookings: 0,
        rating: guideProfile.averageRating,
      },
    })
  } catch (error) {
    console.error("Guide reviews GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
