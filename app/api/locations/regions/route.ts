import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { generateSlug } from "@/lib/helpers"
import { ListingStatus } from "@prisma/client"

export async function GET() {
  try {
    const regions = await prisma.listing.groupBy({
      by: ["city", "state", "country"],
      where: {
        city: { not: null },
        status: {
          in: [ListingStatus.ACTIVE, ListingStatus.PENDING_REVIEW, ListingStatus.INACTIVE],
        },
      },
      _count: { _all: true },
      orderBy: { _count: { _all: "desc" } },
    })

    const data = regions
      .filter((region) => region.city)
      .map((region) => ({
        slug: generateSlug(`${region.city}-${region.state ?? ""}-${region.country ?? ""}`),
        name: region.city ?? "",
        state: region.state,
        country: region.country,
        listingCount: region._count._all,
      }))

    return NextResponse.json({ regions: data })
  } catch (error) {
    console.error("Regions API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
