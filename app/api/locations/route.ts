import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET - List active locations for hosts to choose from
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const country = searchParams.get("country") || "Vietnam"

    const locations = await prisma.location.findMany({
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
    const grouped = locations.reduce((acc: any, location) => {
      const state = location.state
      if (!acc[state]) {
        acc[state] = []
      }
      acc[state].push(location)
      return acc
    }, {})

    return NextResponse.json({
      locations,
      grouped,
      states: Object.keys(grouped).sort(),
    })
  } catch (error: any) {
    console.error("Error fetching locations:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch locations" },
      { status: 500 }
    )
  }
}
