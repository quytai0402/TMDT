import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { formatISO, isAfter, startOfDay } from "date-fns"
import { BookingStatus } from "@prisma/client"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const REVENUE_STATUSES = [BookingStatus.CONFIRMED, BookingStatus.COMPLETED]

const emptyStatusCounter = () => ({
  [BookingStatus.PENDING]: 0,
  [BookingStatus.CONFIRMED]: 0,
  [BookingStatus.CANCELLED]: 0,
  [BookingStatus.COMPLETED]: 0,
  [BookingStatus.DECLINED]: 0,
  [BookingStatus.EXPIRED]: 0,
})

type BookingStatusCounter = ReturnType<typeof emptyStatusCounter>

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
        adminCommissionRate: true,
        averageRating: true,
      },
    })

    if (!guideProfile) {
      return NextResponse.json({ error: "Guide profile not found" }, { status: 404 })
    }

    const bookings = await prisma.experienceBooking.findMany({
      where: {
        experience: {
          OR: [
            { guideProfileId: guideProfile.id },
            { guideProfileId: null, hostId: session.user.id },
          ],
        },
      },
      select: {
        id: true,
        date: true,
        timeSlot: true,
        numberOfGuests: true,
        status: true,
        pricePerPerson: true,
        totalPrice: true,
        currency: true,
        paid: true,
        createdAt: true,
        updatedAt: true,
        experience: {
          select: {
            id: true,
            title: true,
            city: true,
            image: true,
          },
        },
        guest: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            image: true,
          },
        },
      },
      orderBy: { date: "desc" },
      take: 250,
    })

    if (bookings.length === 0) {
      return NextResponse.json({
        bookings: [],
        stats: {
          counts: emptyStatusCounter(),
          grossRevenue: 0,
          netRevenue: 0,
          outstandingBalance: 0,
          averageBookingValue: 0,
          upcomingCount: 0,
        },
        calendar: [],
        navMetrics: {
          upcomingExperiences: 0,
          pendingBookings: 0,
          rating: guideProfile.averageRating,
        },
      })
    }

    const statusCounter: BookingStatusCounter = emptyStatusCounter()
    const now = new Date()
    let grossRevenue = 0
    let outstandingBalance = 0
    const upcomingBookings = [] as typeof bookings

    for (const booking of bookings) {
      statusCounter[booking.status] += 1

      if (booking.date && isAfter(booking.date, now)) {
        upcomingBookings.push(booking)
      }

      if (REVENUE_STATUSES.includes(booking.status) && typeof booking.totalPrice === "number") {
        grossRevenue += booking.totalPrice
        if (!booking.paid) {
          outstandingBalance += booking.totalPrice
        }
      }
    }

    const commissionRate = guideProfile.adminCommissionRate ?? 0.1
    const netRevenue = grossRevenue * (1 - commissionRate)
    const averageBookingValue = grossRevenue > 0 ? grossRevenue / Math.max(1, statusCounter[BookingStatus.CONFIRMED] + statusCounter[BookingStatus.COMPLETED]) : 0

    const calendar = upcomingBookings.slice(0, 32).map((booking) => ({
      id: booking.id,
      title: booking.experience.title,
      date: booking.date ? formatISO(startOfDay(booking.date)) : null,
      status: booking.status,
      guests: booking.numberOfGuests,
      city: booking.experience.city,
      timeSlot: booking.timeSlot,
    }))

    return NextResponse.json({
      bookings,
      stats: {
        counts: statusCounter,
        grossRevenue,
        netRevenue,
        outstandingBalance,
        averageBookingValue,
        upcomingCount: upcomingBookings.length,
      },
      calendar,
      navMetrics: {
        upcomingExperiences: upcomingBookings.length,
        pendingBookings: statusCounter[BookingStatus.PENDING],
        rating: guideProfile.averageRating,
      },
    })
  } catch (error) {
    console.error("Guide bookings GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
