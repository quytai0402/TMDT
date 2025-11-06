import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { searchNearbyPlaces } from "@/lib/maps/serpapi-client"

const requestSchema = z.object({
  latitude: z.number({ invalid_type_error: "Thiếu tọa độ" }),
  longitude: z.number({ invalid_type_error: "Thiếu tọa độ" }),
  city: z.string().optional(),
  categories: z.array(z.string()).optional(),
  radius: z.number().optional(),
  limit: z.number().int().min(1).max(30).optional(),
  language: z.string().optional(),
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

    const { latitude, longitude, city, categories, radius, limit, language } = parsed.data

    const nearby = await searchNearbyPlaces({
      latitude,
      longitude,
      city,
      categories,
      radiusMeters: radius,
      limit,
      language,
    })

    return NextResponse.json({
      latitude,
      longitude,
      city: city ?? null,
      categories: nearby.categories,
      places: nearby.places.map((place) => ({
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
    console.error("Nearby places error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
