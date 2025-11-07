import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const FALLBACK_LOCATIONS = [
  {
    id: "fallback-hanoi",
    city: "Hà Nội",
    state: "Hà Nội",
    country: "Vietnam",
    latitude: 21.0278,
    longitude: 105.8342,
    description: "Trung tâm thủ đô, phù hợp cho các homestay phố cổ & hồ Tây.",
    imageUrl: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "fallback-hcmc",
    city: "Quận 1",
    state: "TP. Hồ Chí Minh",
    country: "Vietnam",
    latitude: 10.7758,
    longitude: 106.7009,
    description: "Khu vực trung tâm Sài Gòn, nhu cầu cao quanh năm.",
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "fallback-dalat",
    city: "Đà Lạt",
    state: "Lâm Đồng",
    country: "Vietnam",
    latitude: 11.9404,
    longitude: 108.4583,
    description: "Điểm đến nghỉ dưỡng cao nguyên, phù hợp villa & homestay ấm cúng.",
    imageUrl: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "fallback-danang",
    city: "Đà Nẵng",
    state: "Đà Nẵng",
    country: "Vietnam",
    latitude: 16.0471,
    longitude: 108.2068,
    description: "Thành phố biển phát triển mạnh về du lịch & MICE.",
    imageUrl: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "fallback-phuquoc",
    city: "Phú Quốc",
    state: "Kiên Giang",
    country: "Vietnam",
    latitude: 10.2899,
    longitude: 103.984,
    description: "Thiên đường nghỉ dưỡng với nhu cầu homestay ven biển tăng cao.",
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
  },
]

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
      locations = FALLBACK_LOCATIONS.filter((item) => !country || item.country === country)
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
