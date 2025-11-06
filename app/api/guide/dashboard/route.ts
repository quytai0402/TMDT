import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { endOfMonth, isAfter, startOfMonth } from "date-fns"
import { BookingStatus } from "@prisma/client"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const COMPLETED_BOOKING_STATUSES: BookingStatus[] = [
  BookingStatus.CONFIRMED,
  BookingStatus.COMPLETED,
]

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!session.user.isGuide) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const guideProfile = await prisma.guideProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        displayName: true,
        tagline: true,
        bio: true,
        languages: true,
        serviceAreas: true,
        specialties: true,
        status: true,
        subscriptionStatus: true,
        subscriptionExpires: true,
        monthlyFee: true,
        adminCommissionRate: true,
        averageRating: true,
        totalReviews: true,
      },
    })

    if (!guideProfile) {
      return NextResponse.json({ error: "Guide profile not found" }, { status: 404 })
    }

    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)

    const [experiences, bookings, recentReviews] = await Promise.all([
      prisma.experience.findMany({
        where: { guideProfileId: guideProfile.id },
        select: {
          id: true,
          title: true,
          status: true,
          price: true,
          currency: true,
          averageRating: true,
          totalBookings: true,
          featured: true,
          city: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 12,
      }),
      prisma.experienceBooking.findMany({
        where: {
          experience: { guideProfileId: guideProfile.id },
        },
        select: {
          id: true,
          status: true,
          totalPrice: true,
          currency: true,
          date: true,
          numberOfGuests: true,
          experience: {
            select: {
              id: true,
              title: true,
            },
          },
          guest: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 40,
      }),
      prisma.experienceReview.findMany({
        where: { experience: { guideProfileId: guideProfile.id } },
        select: {
          id: true,
          rating: true,
          content: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              name: true,
            },
          },
          experience: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ])

    const pendingBookings = bookings.filter((booking) => booking.status === BookingStatus.PENDING).length
    const upcomingExperiences = bookings.filter((booking) => {
      if (!booking.date) return false
      return isAfter(booking.date, now) && COMPLETED_BOOKING_STATUSES.includes(booking.status)
    }).length

    let grossRevenue = 0
    let grossRevenueMonth = 0

    bookings.forEach((booking) => {
      if (!COMPLETED_BOOKING_STATUSES.includes(booking.status)) return
      const amount = booking.totalPrice ?? 0
      grossRevenue += amount
      if (booking.date && booking.date >= monthStart && booking.date <= monthEnd) {
        grossRevenueMonth += amount
      }
    })

    const netRate = 1 - (guideProfile.adminCommissionRate ?? 0.1)
    const netRevenue = grossRevenue * netRate
    const netRevenueMonth = grossRevenueMonth * netRate

    const monthlyBookings = bookings.filter((booking) => booking.date && booking.date >= monthStart && booking.date <= monthEnd)
      .length

    const upcomingBookings = bookings
      .filter((booking) => booking.date && isAfter(booking.date, now))
      .slice(0, 8)

    return NextResponse.json({
      profile: guideProfile,
      metrics: {
        experiences: experiences.length,
        pendingBookings,
        upcomingExperiences,
        grossRevenue,
        netRevenue,
        grossRevenueMonth,
        netRevenueMonth,
        monthlyBookings,
        averageRating: guideProfile.averageRating,
        totalReviews: guideProfile.totalReviews,
        subscriptionStatus: guideProfile.subscriptionStatus,
        subscriptionExpires: guideProfile.subscriptionExpires,
      },
      experiences,
      bookings: upcomingBookings,
      recentReviews,
    })
  } catch (error) {
    console.error("Guide dashboard GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
