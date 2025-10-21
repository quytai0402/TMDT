import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"

// GET /api/admin/listings - Get all listings with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "20", 10)
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""

    const skip = (page - 1) * limit

    // Build where clause
    const where: Prisma.ListingWhereInput = {}

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
      ]
    }

    if (status && status !== "all") {
      where.status = status
    }

    // Get listings
    const [listings, totalCount] = await Promise.all([
      prisma.listing.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          host: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          _count: {
            select: {
              bookings: true,
              reviews: true,
            },
          },
        },
      }),
      prisma.listing.count({ where }),
    ])

    return NextResponse.json({
      listings: listings.map((listing) => ({
        id: listing.id,
        title: listing.title,
        description: listing.description,
        address: listing.address,
        basePrice: listing.basePrice,
        images: listing.images,
        status: listing.status,
        propertyType: listing.propertyType,
        host: listing.host,
        bookingsCount: listing._count.bookings,
        reviewsCount: listing._count.reviews,
        createdAt: listing.createdAt,
        updatedAt: listing.updatedAt,
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    })
  } catch (error) {
    console.error("Admin listings error:", error)
    return NextResponse.json(
      { error: "Failed to fetch listings" },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/listings - Update listing status
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const admin = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (admin?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 })
    }

    const body = await request.json()
    const { listingId, status } = body

    if (!listingId || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    if (!["ACTIVE", "INACTIVE", "PENDING", "REJECTED"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      )
    }

    const updatedListing = await prisma.listing.update({
      where: { id: listingId },
      data: { status },
    })

    return NextResponse.json({
      message: "Listing updated successfully",
      listing: updatedListing,
    })
  } catch (error) {
    console.error("Admin update listing error:", error)
    return NextResponse.json(
      { error: "Failed to update listing" },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/listings - Delete listing
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const admin = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (admin?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const listingId = searchParams.get("listingId")

    if (!listingId) {
      return NextResponse.json(
        { error: "Listing ID required" },
        { status: 400 }
      )
    }

    // Delete listing and cascade delete related records
    await prisma.listing.delete({
      where: { id: listingId },
    })

    return NextResponse.json({
      message: "Listing deleted successfully",
    })
  } catch (error) {
    console.error("Admin delete listing error:", error)
    return NextResponse.json(
      { error: "Failed to delete listing" },
      { status: 500 }
    )
  }
}
