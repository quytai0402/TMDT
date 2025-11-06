import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Schema validation
const createLocationSchema = z.object({
  city: z.string().min(1, "Tên thành phố là bắt buộc"),
  state: z.string().min(1, "Tên tỉnh/bang là bắt buộc"),
  country: z.string().default("Vietnam"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
})

// GET - List all locations (Admin only)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const isActive = searchParams.get("isActive")
    const country = searchParams.get("country")

    const locations = await prisma.location.findMany({
      where: {
        ...(isActive !== null && { isActive: isActive === "true" }),
        ...(country && { country }),
      },
      orderBy: [
        { country: "asc" },
        { state: "asc" },
        { city: "asc" },
      ],
    })

    return NextResponse.json({ locations })
  } catch (error: any) {
    console.error("Error fetching locations:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch locations" },
      { status: 500 }
    )
  }
}

// POST - Create new location (Admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin only" },
        { status: 403 }
      )
    }

    const body = await req.json()
    const validated = createLocationSchema.parse(body)

    // Check if location already exists
    const existing = await prisma.location.findFirst({
      where: {
        city: validated.city,
        state: validated.state,
        country: validated.country,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Location already exists" },
        { status: 409 }
      )
    }

    const location = await prisma.location.create({
      data: {
        ...validated,
        createdBy: session.user.id,
      },
    })

    return NextResponse.json({
      location,
      message: "Location created successfully",
    })
  } catch (error: any) {
    console.error("Error creating location:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || "Failed to create location" },
      { status: 500 }
    )
  }
}

// PATCH - Update location (Admin only)
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin only" },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json(
        { error: "Location ID is required" },
        { status: 400 }
      )
    }

    const location = await prisma.location.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      location,
      message: "Location updated successfully",
    })
  } catch (error: any) {
    console.error("Error updating location:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update location" },
      { status: 500 }
    )
  }
}

// DELETE - Delete location (Admin only)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin only" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Location ID is required" },
        { status: 400 }
      )
    }

    // Check if any listings use this location
    const listingsCount = await prisma.listing.count({
      where: {
        city: {
          in: (await prisma.location.findUnique({ where: { id } }))?.city,
        },
      },
    })

    if (listingsCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete location with ${listingsCount} active listings` },
        { status: 409 }
      )
    }

    await prisma.location.delete({ where: { id } })

    return NextResponse.json({
      message: "Location deleted successfully",
    })
  } catch (error: any) {
    console.error("Error deleting location:", error)
    return NextResponse.json(
      { error: error.message || "Failed to delete location" },
      { status: 500 }
    )
  }
}
