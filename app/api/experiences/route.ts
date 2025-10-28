import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getMembershipForUser } from "@/lib/membership"

// GET /api/experiences - Fetch experiences with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const city = searchParams.get("city")
    const minPrice = searchParams.get("minPrice")
    const maxPrice = searchParams.get("maxPrice")
    const limit = parseInt(searchParams.get("limit") || "20")
    const featured = searchParams.get("featured") === "true"
    const membersOnlyParam = searchParams.get("membersOnly")

    let membersOnly: boolean | null = null
    if (membersOnlyParam === "true") membersOnly = true
    if (membersOnlyParam === "false") membersOnly = false

    if (membersOnly === true) {
      const session = await getServerSession(authOptions)
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Membership required" }, { status: 401 })
      }
      const membership = await getMembershipForUser(session.user.id)
      if (!membership?.isActive) {
        return NextResponse.json({ error: "Membership required" }, { status: 403 })
      }
    }

    const where: any = {
      status: "ACTIVE",
    }

    if (category && category !== "all") {
      where.category = category
    }

    if (city) {
      where.city = { contains: city, mode: "insensitive" }
    }

    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) where.price.gte = parseFloat(minPrice)
      if (maxPrice) where.price.lte = parseFloat(maxPrice)
    }

    if (featured) {
      where.featured = true
    }

    if (membersOnly === true) {
      where.isMembersOnly = true
    } else {
      where.isMembersOnly = false
    }

    const experiences = await prisma.experience.findMany({
      where,
      take: limit,
      include: {
        host: {
          select: {
            id: true,
            name: true,
            image: true,
            isVerified: true,
            isSuperHost: true,
          },
        },
      },
      orderBy: [
        { featured: "desc" },
        { averageRating: "desc" },
        { createdAt: "desc" },
      ],
    })

    // Format response to match frontend expectations
    const formattedExperiences = experiences.map((exp) => ({
      id: exp.id,
      title: exp.title,
      description: exp.description,
      image: exp.image,
      images: exp.images,
      host: {
        name: exp.host.name || "Host",
        avatar: exp.host.image,
        verified: exp.host.isVerified || exp.host.isSuperHost,
      },
      category: exp.category,
      location: exp.city + (exp.state ? `, ${exp.state}` : ""),
      city: exp.city,
      duration: exp.duration,
      groupSize: exp.groupSize,
      price: exp.price,
      rating: exp.averageRating,
      reviewCount: exp.totalReviews,
      tags: exp.tags,
      featured: exp.featured,
      membersOnly: exp.isMembersOnly ?? false,
    }))

    return NextResponse.json({
      experiences: formattedExperiences,
      total: formattedExperiences.length,
    })
  } catch (error) {
    console.error("Error fetching experiences:", error)
    return NextResponse.json(
      { error: "Failed to fetch experiences" },
      { status: 500 }
    )
  }
}
