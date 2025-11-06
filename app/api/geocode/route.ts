import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { geocodeAddress } from "@/lib/maps/serpapi-client"

const geocodeSchema = z.object({
  address: z.string().min(3, "Địa chỉ chưa hợp lệ"),
  city: z.string().min(1, "Thiếu thành phố"),
  country: z.string().optional(),
  language: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const parsed = geocodeSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Dữ liệu không hợp lệ" }, { status: 400 })
    }

    const { address, city, country, language } = parsed.data

    try {
      const result = await geocodeAddress({
        address,
        city,
        country,
        language,
      })

      return NextResponse.json(result)
    } catch (error) {
      console.error("Geocode lookup failed:", error)
      return NextResponse.json(
        { error: "Không thể tìm thấy địa điểm" },
        { status: 404 },
      )
    }
  } catch (error) {
    console.error("Geocode error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
