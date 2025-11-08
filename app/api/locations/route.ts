import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { FALLBACK_LOCATIONS, getFallbackLocationsByCountry } from "@/lib/fallback-locations"

// GET - List active locations for hosts to choose from
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const country = searchParams.get("country") || "Vietnam"

    let locations = await prisma.location.findMany({
      where: {
        isActive: true,
        country,
      },
      select: {
        id: true,
        city: true,
        state: true,
        country: true,
        latitude: true,
        longitude: true,
        description: true,
        imageUrl: true,
      },
      orderBy: [
        { state: "asc" },
        { city: "asc" },
      ],
    })

    // Group by state for easier selection
    if (!locations.length) {
      locations = getFallbackLocationsByCountry(country)
    }

    const grouped = locations.reduce<Record<string, typeof locations>>((acc, location) => {
      const key = location.state || "Khác"
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(location)
      return acc
    }, {})

    return NextResponse.json({
      locations,
      grouped,
      states: Object.keys(grouped).sort(),
    })
  } catch (error: any) {
    console.error("Error fetching locations:", error)
    const groupedFallback = FALLBACK_LOCATIONS.reduce<Record<string, typeof FALLBACK_LOCATIONS>>((acc, location) => {
      const key = location.state || "Khác"
      if (!acc[key]) acc[key] = []
      acc[key].push(location)
      return acc
    }, {})
    return NextResponse.json(
      {
        locations: FALLBACK_LOCATIONS,
        grouped: groupedFallback,
        states: Object.keys(groupedFallback).sort(),
        error: error.message || "Failed to fetch locations, using fallback list",
      },
      { status: 200 }
    )
  }
}
