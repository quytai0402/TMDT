import { NextResponse } from "next/server"

import { DESTINATIONS } from "@/data/destinations"
import { prisma } from "@/lib/prisma"
import { generateSlug } from "@/lib/helpers"
import { ListingStatus } from "@prisma/client"

type RegionRecord = {
  slug: string
  name: string
  state: string | null
  country: string | null
  listingCount: number
}

const FALLBACK_COUNTRY = "Vietnam"

const mapToRegions = (records: Array<{ city: string; state: string | null; country: string | null; count: number }>) =>
  records
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

const buildFallbackRegions = (): RegionRecord[] => {
  const regionMap = new Map<string, RegionRecord>()

  for (const destination of DESTINATIONS) {
    const state = destination.province || null
    const existing = regionMap.get(destination.name)

    if (existing) {
      existing.listingCount = Math.max(existing.listingCount, destination.listingCount)
      continue
    }

    regionMap.set(destination.name, {
      slug: generateSlug(`${destination.name}-${state ?? ""}`),
      name: destination.name,
      state,
      country: FALLBACK_COUNTRY,
      listingCount: destination.listingCount,
    })
  }

  return Array.from(regionMap.values()).sort((a, b) => a.name.localeCompare(b.name, "vi", { sensitivity: "base" }))
}

export async function GET() {
  try {
    // Manual aggregation because MongoDB connector does not support groupBy
    const listings = await prisma.listing.findMany({
      where: {
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

    const regionMap = new Map<string, { city: string; state: string | null; country: string | null; count: number }>()

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

    const data = mapToRegions(Array.from(regionMap.values()))

    if (data.length === 0) {
      return NextResponse.json({ regions: buildFallbackRegions(), fallback: true })
    }

    return NextResponse.json({ regions: data })
  } catch (error) {
    console.error("Regions API error:", error)
    return NextResponse.json({ regions: buildFallbackRegions(), fallback: true })
  }
}
