import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { buildConciergeContext } from "@/lib/concierge/context"

const querySchema = z.object({
  bookingId: z.string().min(1, "Thiếu bookingId"),
})

type PlannerSuggestion = {
  id: string
  title: string
  type: "accommodation" | "dining" | "activity" | "shopping" | "sightseeing"
  location: string
  notes?: string | null
  time?: string | null
  dayOffset?: number | null
  distanceKm?: number | null
}

function mapCategoryToType(category?: string | null): PlannerSuggestion["type"] {
  switch (category) {
    case "restaurant":
      return "dining"
    case "cafe":
      return "dining"
    case "attraction":
      return "sightseeing"
    default:
      return "activity"
  }
}

function formatDayOffset(target: Date, checkIn: Date) {
  const start = new Date(checkIn)
  start.setHours(0, 0, 0, 0)
  const normalized = new Date(target)
  normalized.setHours(0, 0, 0, 0)
  const diffMs = normalized.getTime() - start.getTime()
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const parsedQuery = querySchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams)
    )

    if (!parsedQuery.success) {
      return NextResponse.json({ error: "Invalid query" }, { status: 400 })
    }

    const { bookingId } = parsedQuery.data

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        guestId: true,
        hostId: true,
        checkIn: true,
        checkOut: true,
        listing: {
          select: {
            title: true,
            city: true,
            country: true,
            address: true,
          },
        },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    const userId = session.user.id
    const role = session.user.role
    const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN"
    const isGuest = booking.guestId === userId
    const isHost = booking.hostId === userId

    if (!isAdmin && !isGuest && !isHost) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const conciergeContext = await buildConciergeContext({
      bookingId,
      userId,
      includeLatestBooking: true,
    })

    const checkIn = booking.checkIn
    const suggestions: PlannerSuggestion[] = []

    if (booking.listing) {
      suggestions.push({
        id: `${bookingId}-checkin`,
        title: `Check-in tại ${booking.listing.title ?? "homestay"}`,
        type: "accommodation",
        location: booking.listing.address ?? booking.listing.city ?? "Đang cập nhật",
        time: "15:00",
        notes: "Liên hệ concierge nếu cần hỗ trợ nhận phòng sớm hoặc gửi hành lý.",
        dayOffset: 0,
      })

      suggestions.push({
        id: `${bookingId}-checkout`,
        title: "Chuẩn bị check-out",
        type: "accommodation",
        location: booking.listing.title ?? "Homestay",
        time: "11:00",
        notes: "Kiểm tra lại hành lý, trả chìa khóa và nhờ concierge đặt xe ra sân bay nếu cần.",
        dayOffset: Math.max(0, formatDayOffset(booking.checkOut, checkIn)),
      })
    }

    const listingContext = conciergeContext.listingContext

    const recommendationSources = [
      ...(listingContext?.recommendations.restaurants ?? []),
      ...(listingContext?.recommendations.cafes ?? []),
      ...(listingContext?.recommendations.attractions ?? []),
    ]

    recommendationSources.slice(0, 6).forEach((recommendation, index) => {
      if (!recommendation?.name) return
      suggestions.push({
        id: `${bookingId}-recommendation-${index}`,
        title: recommendation.name,
        type: mapCategoryToType(recommendation.category),
        location: booking.listing?.city ?? booking.listing?.country ?? "",
        notes: recommendation.description ?? null,
        time: "18:00",
        dayOffset: index < 2 ? 0 : 1,
        distanceKm:
          typeof recommendation.distanceKm === "number"
            ? Math.round(recommendation.distanceKm * 10) / 10
            : null,
      })
    })

    if (conciergeContext.quickReplies.length) {
      conciergeContext.quickReplies.slice(0, 3).forEach((message, index) => {
        suggestions.push({
          id: `${bookingId}-quick-${index}`,
          title: message,
          type: "activity",
          location: booking.listing?.city ?? booking.listing?.country ?? "",
          notes: "Gợi ý concierge",
          time: "10:00",
          dayOffset: 1,
        })
      })
    }

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error("Planner suggestions error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
