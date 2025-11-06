import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { endOfMonth, format, isAfter, isWithinInterval, startOfDay, startOfMonth, subDays, subMonths } from "date-fns"
import { BookingStatus } from "@prisma/client"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const REVENUE_STATUSES = [BookingStatus.CONFIRMED, BookingStatus.COMPLETED]

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
        totalEarnings: true,
        totalPayouts: true,
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
        status: true,
        totalPrice: true,
        currency: true,
        paid: true,
        createdAt: true,
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
      },
      orderBy: { date: "desc" },
      take: 500,
    })

    if (bookings.length === 0) {
      return NextResponse.json({
        summary: {
          lifetimeGross: 0,
          lifetimeNet: 0,
          outstandingBalance: 0,
          last30DaysGross: 0,
          last30DaysNet: 0,
          totalBookings: 0,
          totalPayouts: guideProfile.totalPayouts ?? 0,
        },
        monthly: [],
        transactions: [],
        navMetrics: {
          upcomingExperiences: 0,
          pendingBookings: 0,
          rating: guideProfile.averageRating,
        },
      })
    }

    const commissionRate = guideProfile.adminCommissionRate ?? 0.1
    const now = new Date()
  const thirtyDaysAgo = startOfDay(subDays(now, 30))

    let lifetimeGross = 0
    let lifetimeNet = 0
    let last30Gross = 0
    let last30Net = 0
    let outstandingBalance = 0
    let pendingBookings = 0
    const upcomingBookings = [] as typeof bookings

    for (const booking of bookings) {
      if (booking.status === BookingStatus.PENDING) {
        pendingBookings += 1
      }

      if (booking.date && isAfter(booking.date, now)) {
        upcomingBookings.push(booking)
      }

      if (!REVENUE_STATUSES.includes(booking.status) || typeof booking.totalPrice !== "number") {
        continue
      }

      lifetimeGross += booking.totalPrice
      const netValue = booking.totalPrice * (1 - commissionRate)
      lifetimeNet += netValue

  if (booking.date && isWithinInterval(booking.date, { start: thirtyDaysAgo, end: now })) {
        last30Gross += booking.totalPrice
        last30Net += netValue
      }

      if (!booking.paid) {
        outstandingBalance += booking.totalPrice
      }
    }

    const monthly: Array<{
      month: string
      gross: number
      net: number
      bookingCount: number
    }> = []

    for (let index = 5; index >= 0; index -= 1) {
      const monthStart = startOfMonth(subMonths(now, index))
      const monthEnd = endOfMonth(monthStart)
      let gross = 0
      let net = 0
      let bookingCount = 0

      for (const booking of bookings) {
        if (!booking.date || !REVENUE_STATUSES.includes(booking.status) || typeof booking.totalPrice !== "number") {
          continue
        }

        if (isWithinInterval(booking.date, { start: monthStart, end: monthEnd })) {
          gross += booking.totalPrice
          net += booking.totalPrice * (1 - commissionRate)
          bookingCount += 1
        }
      }

      monthly.push({
        month: format(monthStart, "MM/yyyy"),
        gross,
        net,
        bookingCount,
      })
    }

    const transactions = bookings.slice(0, 40).map((booking) => ({
      id: booking.id,
      date: booking.date,
      status: booking.status,
      totalPrice: booking.totalPrice,
      currency: booking.currency,
      paid: booking.paid,
      experience: booking.experience,
      guest: booking.guest,
    }))

    return NextResponse.json({
      summary: {
        lifetimeGross,
        lifetimeNet,
        outstandingBalance,
        last30DaysGross: last30Gross,
        last30DaysNet: last30Net,
        totalBookings: bookings.length,
        totalPayouts: guideProfile.totalPayouts ?? 0,
      },
      monthly,
      transactions,
      navMetrics: {
        upcomingExperiences: upcomingBookings.length,
        pendingBookings,
        rating: guideProfile.averageRating,
      },
    })
  } catch (error) {
    console.error("Guide earnings GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
