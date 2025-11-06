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

    const [profile, recentApplication] = await Promise.all([
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
    ])

    const locationSlug = profile?.primaryLocationSlug ?? recentApplication?.locationSlug ?? null
    const locationName = profile?.primaryLocationName ?? recentApplication?.locationName ?? null
    const resolvedLocation = resolveLocation(locationSlug, locationName)

    return NextResponse.json({
      profile,
      application: recentApplication,
      location: resolvedLocation,
    })
  } catch (error) {
    console.error("Host profile GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
