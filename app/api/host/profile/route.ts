import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { DESTINATIONS } from "@/data/destinations"
import { generateSlug } from "@/lib/helpers"

type ResolvedLocation = {
  slug: string | null
  name: string | null
  city: string | null
  state: string | null
  country: string | null
  latitude: number | null
  longitude: number | null
}

function resolveLocation(slug?: string | null, name?: string | null): ResolvedLocation | null {
  if (!slug && !name) {
    return null
  }

  const normalizedSlug = slug?.trim().toLowerCase()
  const normalizedName = name?.trim().toLowerCase()

  const destinationMatch = DESTINATIONS.find((destination) => {
    const destinationSlug = destination.slug.trim().toLowerCase()
    if (normalizedSlug && destinationSlug === normalizedSlug) {
      return true
    }

    if (normalizedSlug && generateSlug(destination.name) === normalizedSlug) {
      return true
    }

    if (normalizedSlug && generateSlug(`${destination.name}-${destination.province ?? ""}`) === normalizedSlug) {
      return true
    }

    if (normalizedName && destination.name.trim().toLowerCase() === normalizedName) {
      return true
    }

    const provinceName = destination.province?.trim().toLowerCase()
    if (normalizedName && provinceName && provinceName === normalizedName) {
      return true
    }

    return false
  })

  if (destinationMatch) {
    const sampleStay = destinationMatch.stays[0]
    const sampleExperience = destinationMatch.experiences[0]

    return {
      slug: slug ?? destinationMatch.slug,
      name: name ?? destinationMatch.name,
      city: destinationMatch.name,
      state: destinationMatch.province ?? null,
      country: "Vietnam",
      latitude: sampleStay?.latitude ?? sampleExperience?.latitude ?? null,
      longitude: sampleStay?.longitude ?? sampleExperience?.longitude ?? null,
    }
  }

  return {
    slug: slug ?? null,
    name: name ?? null,
    city: name ?? slug ?? null,
    state: name ?? null,
    country: "Vietnam",
    latitude: null,
    longitude: null,
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [profile, recentApplication, approvedLocationRequests] = await Promise.all([
      prisma.hostProfile.findUnique({
        where: { userId: session.user.id },
        select: {
          primaryLocationSlug: true,
          primaryLocationName: true,
        },
      }),
      prisma.hostApplication.findFirst({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          locationSlug: true,
          locationName: true,
          reviewedAt: true,
        },
      }),
      prisma.locationRequest.findMany({
        where: {
          requestedBy: session.user.id,
          status: "APPROVED",
        },
        select: {
          id: true,
          city: true,
          state: true,
          country: true,
          approvedAt: true,
        },
        orderBy: [
          { approvedAt: "desc" },
          { createdAt: "desc" },
        ],
      }),
    ])

    const locationSlug = profile?.primaryLocationSlug ?? recentApplication?.locationSlug ?? null
    const locationName = profile?.primaryLocationName ?? recentApplication?.locationName ?? null
    const resolvedLocation = resolveLocation(locationSlug, locationName)

    const availableLocations = (() => {
      const labelFor = (city?: string | null, state?: string | null, country?: string | null) =>
        [city, state, country && country !== "Vietnam" ? country : null].filter(Boolean).join(", ")

      const entries: Array<{
        id: string
        slug?: string | null
        city: string
        state?: string | null
        country?: string | null
        label: string
        type: "PRIMARY" | "EXPANSION"
      }> = []

      if (resolvedLocation?.city) {
        entries.push({
          id: `primary-${session.user.id}`,
          slug: resolvedLocation.slug,
          city: resolvedLocation.city,
          state: resolvedLocation.state,
          country: resolvedLocation.country ?? "Vietnam",
          label: resolvedLocation.name ?? labelFor(resolvedLocation.city, resolvedLocation.state, resolvedLocation.country),
          type: "PRIMARY",
        })
      }

      approvedLocationRequests.forEach((request) => {
        if (!request.city) {
          return
        }

        entries.push({
          id: request.id,
          city: request.city,
          state: request.state,
          country: request.country ?? "Vietnam",
          label: labelFor(request.city, request.state, request.country),
          type: "EXPANSION",
        })
      })

      const uniqueByKey = new Map<string, (typeof entries)[number]>()
      entries.forEach((location) => {
        const key = `${location.city?.toLowerCase() ?? ""}|${location.state?.toLowerCase() ?? ""}|${location.country?.toLowerCase() ?? ""}`
        if (!uniqueByKey.has(key)) {
          uniqueByKey.set(key, location)
        }
      })

      return Array.from(uniqueByKey.values())
    })()

    return NextResponse.json({
      profile,
      application: recentApplication,
      location: resolvedLocation,
      availableLocations,
    })
  } catch (error) {
    console.error("Host profile GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
