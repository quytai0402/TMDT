import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { BookingStatus } from "@prisma/client"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(_request: NextRequest, context: { params: { experienceId: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!session.user.isGuide) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const experienceId = context.params?.experienceId
    if (!experienceId) {
      return NextResponse.json({ error: "Experience ID is required" }, { status: 400 })
    }

    const experience = await prisma.experience.findFirst({
      where: {
        id: experienceId,
        OR: [
          { guideProfile: { userId: session.user.id } },
          { guideProfileId: null, hostId: session.user.id },
        ],
      },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        city: true,
        state: true,
        location: true,
        latitude: true,
        longitude: true,
        image: true,
        images: true,
        videoUrl: true,
        price: true,
        currency: true,
        duration: true,
        groupSize: true,
        minGuests: true,
        maxGuests: true,
        includedItems: true,
        notIncluded: true,
        requirements: true,
        languages: true,
        tags: true,
        status: true,
        isVerified: true,
        featured: true,
        isMembersOnly: true,
        totalBookings: true,
        totalReviews: true,
        averageRating: true,
        createdAt: true,
        updatedAt: true,
        guideProfile: {
          select: {
            id: true,
            displayName: true,
            adminCommissionRate: true,
          },
        },
        bookings: {
          select: {
            id: true,
            date: true,
            timeSlot: true,
            status: true,
            totalPrice: true,
            currency: true,
            numberOfGuests: true,
            paid: true,
            guest: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { date: "desc" },
          take: 20,
        },
      },
    })

    if (!experience) {
      return NextResponse.json({ error: "Experience not found" }, { status: 404 })
    }

    const revenue = experience.bookings.reduce(
      (acc, booking) => {
        if (booking.totalPrice && [BookingStatus.CONFIRMED, BookingStatus.COMPLETED].includes(booking.status)) {
          acc.gross += booking.totalPrice
          acc.net += booking.totalPrice * (1 - (experience.guideProfile?.adminCommissionRate ?? 0.1))
        }
        if (!booking.paid && booking.totalPrice && booking.status === BookingStatus.CONFIRMED) {
          acc.outstanding += booking.totalPrice
        }
        return acc
      },
      { gross: 0, net: 0, outstanding: 0 },
    )

    return NextResponse.json({ experience, revenue })
  } catch (error) {
    console.error("Guide experience detail error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
