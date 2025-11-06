import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { searchPlaces } from "@/lib/maps/serpapi-client"

const requestSchema = z.object({
  query: z.string().min(2, "Vui lòng nhập nội dung tìm kiếm"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  radius: z.number().optional(),
  limit: z.number().int().min(1).max(30).optional(),
  language: z.string().optional(),
  openNow: z.boolean().optional(),
  category: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const parsed = requestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Dữ liệu không hợp lệ" }, { status: 400 })
    }

    const { query, latitude, longitude, radius, limit, language, openNow, category } = parsed.data

    const result = await searchPlaces({
      query,
      latitude,
      longitude,
      radiusMeters: radius,
      limit,
      language,
      openNow,
      explicitCategory: category,
    })

    return NextResponse.json({
      query: result.query,
      resolvedQuery: result.resolvedQuery,
      category: result.category,
      suggestions: result.suggestions,
      count: result.places.length,
      places: result.places.map((place) => ({
        name: place.name,
        type: place.category,
        distance: place.displayDistance ?? "Gần đây",
        rating: place.rating,
        address: place.address,
        placeId: place.id,
        latitude: place.coordinates?.latitude,
        longitude: place.coordinates?.longitude,
      })),
    })
  } catch (error) {
    console.error("Search places error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
