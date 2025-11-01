import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { generateSlug } from "@/lib/helpers"
import { ListingStatus } from "@prisma/client"

export async function GET() {
  try {
  // Manual aggregation because MongoDB connector does not support groupBy
  const listings = await prisma.listing.findMany({
      where: {
        city: { not: null },
        status: {
          in: [ListingStatus.ACTIVE, ListingStatus.PENDING_REVIEW, ListingStatus.INACTIVE],
        },
      },
      select: {
        city: true,
        state: true,
        country: true,
      },
    })

    const regionMap = new Map<
      string,
      { city: string; state: string | null; country: string | null; count: number }
    >()

    for (const listing of listings) {
      if (!listing.city) continue

      const state = listing.state ?? null
      const country = listing.country ?? null
      const key = `${listing.city}|${state ?? ""}|${country ?? ""}`

      const current = regionMap.get(key)
      if (current) {
        current.count += 1
        continue
      }

      regionMap.set(key, {
        city: listing.city,
        state,
        country,
        count: 1,
      })
    }

    const data = Array.from(regionMap.values())
      .map((region) => ({
        slug: generateSlug(`${region.city}-${region.state ?? ""}-${region.country ?? ""}`),
        name: region.city,
        state: region.state,
        country: region.country,
        listingCount: region.count,
      }))
      .sort((a, b) => {
        if (b.listingCount !== a.listingCount) return b.listingCount - a.listingCount
        return a.name.localeCompare(b.name, "vi", { sensitivity: "base" })
      })

    return NextResponse.json({ regions: data })
  } catch (error) {
    console.error("Regions API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
