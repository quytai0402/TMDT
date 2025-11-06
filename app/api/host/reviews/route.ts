import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const filter = searchParams.get("filter") || "all"
    const listingId = searchParams.get("listingId")
    const search = searchParams.get("search")

    // Get all host's listings
    const hostListings = await prisma.listing.findMany({
      where: { hostId: session.user.id },
      select: { id: true, title: true },
    })

    const listingIds = hostListings.map((l) => l.id)

    if (listingIds.length === 0) {
      return NextResponse.json({
        reviews: [],
        stats: {
          total: 0,
          pending: 0,
          responded: 0,
          averageRating: 0,
          ratingTrend: 0,
          totalByRating: {},
        },
        listings: [],
      })
    }

    // Build where clause
    const where: any = {
      listingId: { in: listingIds },
    }

    if (listingId && listingId !== "all") {
      where.listingId = listingId
    }

    if (filter === "pending") {
      where.hostResponse = null
    } else if (filter === "responded") {
      where.hostResponse = { not: null }
    } else if (filter === "high") {
      where.overallRating = { gte: 5 }
    }

    if (search) {
      where.OR = [
        { comment: { contains: search, mode: "insensitive" } },
        { reviewer: { name: { contains: search, mode: "insensitive" } } },
        { listing: { title: { contains: search, mode: "insensitive" } } },
      ]
    }

    // Get reviews
    const reviews = await prisma.review.findMany({
      where,
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        listing: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        booking: {
          select: {
            id: true,
            checkIn: true,
            checkOut: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    })

    // Calculate stats
    const allReviews = await prisma.review.findMany({
      where: {
        listingId: { in: listingIds },
      },
      select: {
        overallRating: true,
        hostResponse: true,
        createdAt: true,
      },
    })

    const total = allReviews.length
    const pending = allReviews.filter((r) => !r.hostResponse).length
    const responded = allReviews.filter((r) => r.hostResponse).length
    const averageRating = total > 0 
      ? allReviews.reduce((sum, r) => sum + r.overallRating, 0) / total 
      : 0

    // Calculate rating trend (compare last 30 days vs previous 30 days)
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

    const recentReviews = allReviews.filter((r) => new Date(r.createdAt) >= thirtyDaysAgo)
    const previousReviews = allReviews.filter(
      (r) => new Date(r.createdAt) >= sixtyDaysAgo && new Date(r.createdAt) < thirtyDaysAgo,
    )

    const recentAvg = recentReviews.length > 0
      ? recentReviews.reduce((sum, r) => sum + r.overallRating, 0) / recentReviews.length
      : averageRating
    const previousAvg = previousReviews.length > 0
      ? previousReviews.reduce((sum, r) => sum + r.overallRating, 0) / previousReviews.length
      : averageRating

    const ratingTrend = previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0

    const stats = {
      total,
      pending,
      responded,
      averageRating,
      ratingTrend,
      totalByRating: allReviews.reduce(
        (acc, r) => {
          const rating = Math.round(r.overallRating)
          acc[rating] = (acc[rating] || 0) + 1
          return acc
        },
        {} as Record<number, number>,
      ),
    }

    return NextResponse.json({
      reviews,
      stats,
      listings: hostListings,
    })
  } catch (error) {
    console.error("Error fetching host reviews:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
