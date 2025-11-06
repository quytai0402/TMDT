import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { reviewId, response } = body

    if (!reviewId || !response?.trim()) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify the review belongs to one of the host's listings
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        listing: {
          select: { hostId: true },
        },
      },
    })

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 })
    }

    if (review.listing.hostId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Update review with host response
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        hostResponse: response.trim(),
        hostRespondedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true, review: updatedReview })
  } catch (error) {
    console.error("Error responding to review:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
