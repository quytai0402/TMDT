import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type TopicAccumulator = {
  label: string
  count: number
  category: string
  sampleLocation?: string | null
  lastUsed: Date
}

const HASHTAG_REGEX = /#[\p{L}0-9_]+/gu
const FALLBACK_LIMIT = 5

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = Number.parseInt(searchParams.get("days") || "30", 10)
    const lookbackDays = Number.isFinite(days) && days > 0 ? days : 30

    const since = new Date()
    since.setDate(since.getDate() - lookbackDays)

    const posts = await prisma.post.findMany({
      where: {
        createdAt: { gte: since },
        status: "ACTIVE",
        isPublic: true,
      },
      select: {
        content: true,
        location: true,
        createdAt: true,
        listing: {
          select: {
            title: true,
            city: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 400,
    })

    const topicsMap = new Map<string, TopicAccumulator>()

    for (const post of posts) {
      const matches = post.content.match(HASHTAG_REGEX) ?? []
      if (matches.length === 0) continue

      const category = post.location
        ? "Địa điểm"
        : post.listing
        ? "Homestay"
        : "Cộng đồng"

      for (const tag of matches) {
        const normalized = tag.toLowerCase()
        const existing = topicsMap.get(normalized)
        if (existing) {
          existing.count += 1
          if (post.createdAt > existing.lastUsed) {
            existing.lastUsed = post.createdAt
            existing.sampleLocation = post.location ?? post.listing?.city ?? existing.sampleLocation
          }
        } else {
          topicsMap.set(normalized, {
            label: tag,
            count: 1,
            category,
            sampleLocation: post.location ?? post.listing?.city ?? null,
            lastUsed: post.createdAt,
          })
        }
      }
    }

    let topics = Array.from(topicsMap.values())
      .sort((a, b) => {
        if (b.count === a.count) {
          return b.lastUsed.getTime() - a.lastUsed.getTime()
        }
        return b.count - a.count
      })
      .slice(0, FALLBACK_LIMIT)
      .map((topic, index) => ({
        id: `${topic.label}-${index}`,
        title: topic.label,
        category: topic.category,
        postsCount: topic.count,
        location: topic.sampleLocation,
      }))

    if (topics.length < FALLBACK_LIMIT) {
      const fallbackListings = await prisma.listing.findMany({
        where: { status: "ACTIVE" },
        orderBy: { totalBookings: "desc" },
        take: FALLBACK_LIMIT,
        select: {
          id: true,
          city: true,
          title: true,
          totalBookings: true,
        },
      })

      const existingLabels = new Set(topics.map((topic) => topic.title.toLowerCase()))

      for (const listing of fallbackListings) {
        if (topics.length >= FALLBACK_LIMIT) break
        const cityOrTitle = listing.city || listing.title
        const label = `#${cityOrTitle.replace(/\s+/g, "")}`
        if (existingLabels.has(label.toLowerCase())) continue

        topics.push({
          id: listing.id,
          title: label,
          category: "Địa điểm",
          postsCount: listing.totalBookings ?? 0,
          location: cityOrTitle,
        })
      }
    }

    return NextResponse.json({ topics })
  } catch (error) {
    console.error("Error generating trending topics:", error)
    return NextResponse.json({ error: "Failed to load topics" }, { status: 500 })
  }
}
