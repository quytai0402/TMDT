import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const SUGGESTION_LIMIT = 6
const FALLBACK_LIMIT = 6

const HOST_ROLES = ["HOST", "ADMIN"] as const

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const currentUserId = session?.user?.id ?? null

    const baseFollowing = currentUserId
      ? await prisma.userFollow.findMany({
          where: { followerId: currentUserId },
          select: { followingId: true },
        })
      : []

    const followingIds = new Set(baseFollowing.map((item) => item.followingId))
    const excludeIds = new Set<string>()
    if (currentUserId) excludeIds.add(currentUserId)
    baseFollowing.forEach((item) => excludeIds.add(item.followingId))

    let suggestionCandidates = await prisma.user.findMany({
      where: {
        ...(excludeIds.size && {
          id: {
            notIn: Array.from(excludeIds),
          },
        }),
        role: { in: ["HOST", "GUEST"] },
      },
      orderBy: [
        { loyaltyPoints: "desc" },
        { createdAt: "desc" },
      ],
      take: SUGGESTION_LIMIT,
      select: {
        id: true,
        name: true,
        image: true,
        role: true,
        bio: true,
        isVerified: true,
        isSuperHost: true,
        loyaltyTier: true,
        loyaltyPoints: true,
        languages: true,
        hostProfile: {
          select: {
            city: true,
            province: true,
            tagline: true,
          },
        },
        _count: {
          select: {
            listings: true,
            bookingsAsGuest: true,
            followers: true,
          },
        },
      },
    })

    if (suggestionCandidates.length === 0) {
      suggestionCandidates = await prisma.user.findMany({
        where: {
          role: { in: ["HOST", "GUEST"] },
        },
        orderBy: [{ createdAt: "desc" }],
        take: FALLBACK_LIMIT,
        select: {
          id: true,
          name: true,
          image: true,
          role: true,
          bio: true,
          isVerified: true,
          isSuperHost: true,
          loyaltyTier: true,
          loyaltyPoints: true,
          languages: true,
          hostProfile: {
            select: {
              city: true,
              province: true,
              tagline: true,
            },
          },
          _count: {
            select: {
              listings: true,
              bookingsAsGuest: true,
              followers: true,
            },
          },
        },
      })
    }

    if (suggestionCandidates.length === 0) {
      return NextResponse.json({ suggestions: [] })
    }

    const completedBookingsResults = await Promise.allSettled(
      suggestionCandidates.map((user) =>
        prisma.booking.count({
          where: {
            guestId: user.id,
            status: { in: ["COMPLETED", "CONFIRMED"] },
          },
        })
      )
    )

    const completedBookings = completedBookingsResults.map((result) =>
      result.status === "fulfilled" ? result.value : 0
    )

    const mutualConnectionsCounts = currentUserId && followingIds.size
      ? await Promise.allSettled(
          suggestionCandidates.map((user) =>
            prisma.userFollow.count({
              where: {
                followerId: { in: Array.from(followingIds) },
                followingId: user.id,
              },
            })
          )
        )
      : suggestionCandidates.map(() => ({ status: "fulfilled", value: 0 } as const))

    const mutualCountsResolved = mutualConnectionsCounts.map((result) =>
      result.status === "fulfilled" ? result.value : 0
    )

    const suggestions = suggestionCandidates.map((user, index) => {
      const hostCity = user.hostProfile?.city
      const hostTagline = user.hostProfile?.tagline
      const isHost = HOST_ROLES.includes(user.role as typeof HOST_ROLES[number]) || user.isSuperHost
      const language = user.languages?.[0]

      const headline = isHost
        ? hostTagline || (hostCity ? `Chủ nhà tại ${hostCity}` : "Chủ nhà LuxeStay")
        : language
        ? `Ưa xê dịch • ${language}`
        : user.bio || "Thành viên LuxeStay"

      const stats = {
        listings: user._count.listings,
        completedTrips: completedBookings[index] ?? 0,
        followers: user._count.followers ?? 0,
      }

      return {
        id: user.id,
        name: user.name ?? "Thành viên LuxeStay",
        avatar:
          user.image ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name ?? "guest")}`,
        verified: Boolean(user.isVerified || user.isSuperHost),
        role: isHost ? "host" : "guest",
        headline,
        stats,
        loyaltyTier: user.loyaltyTier,
        mutualConnections: mutualCountsResolved[index] ?? 0,
        isFollowing: false,
      }
    })

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error("Error fetching connection suggestions:", error)
    return NextResponse.json({ error: "Failed to load suggestions" }, { status: 500 })
  }
}
