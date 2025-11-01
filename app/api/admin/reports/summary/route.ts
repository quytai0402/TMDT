import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { computeBookingFinancials } from "@/lib/finance"

function startOfMonth(date: Date, offset = 0) {
  const d = new Date(date.getFullYear(), date.getMonth() + offset, 1)
  d.setHours(0, 0, 0, 0)
  return d
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const now = new Date()
    const currentMonthStart = startOfMonth(now)
    const previousMonthStart = startOfMonth(now, -1)
    const sixMonthsAgo = startOfMonth(now, -5)

    const [recentCompletedBookings, monthBookings, previousMonthBookings, newUsersThisMonth, newUsersLastMonth, listings] =
      await Promise.all([
        prisma.booking.findMany({
          where: {
            status: "COMPLETED",
            completedAt: { gte: sixMonthsAgo },
          },
          select: {
            completedAt: true,
            createdAt: true,
            status: true,
            totalPrice: true,
            serviceFee: true,
            platformCommission: true,
            hostEarnings: true,
          },
        }),
        prisma.booking.findMany({
          where: {
            createdAt: { gte: currentMonthStart },
          },
          select: {
            status: true,
          },
        }),
        prisma.booking.findMany({
          where: {
            createdAt: {
              gte: previousMonthStart,
              lt: currentMonthStart,
            },
          },
          select: {
            status: true,
          },
        }),
        prisma.user.count({
          where: { createdAt: { gte: currentMonthStart } },
        }),
        prisma.user.count({
          where: {
            createdAt: {
              gte: previousMonthStart,
              lt: currentMonthStart,
            },
          },
        }),
        prisma.listing.findMany({
          where: { status: "ACTIVE" },
          select: {
            propertyType: true,
          },
        }),
      ])

    const monthRevenueBookings = recentCompletedBookings.filter(
      (booking) => booking.completedAt && booking.completedAt >= currentMonthStart,
    )
    const previousRevenueBookings = recentCompletedBookings.filter(
      (booking) =>
        booking.completedAt &&
        booking.completedAt >= previousMonthStart &&
        booking.completedAt < currentMonthStart,
    )

    const revenueThisMonth = monthRevenueBookings.reduce((sum, booking) => {
      const { commission } = computeBookingFinancials(booking)
      return sum + commission
    }, 0)

    const revenueLastMonth = previousRevenueBookings.reduce((sum, booking) => {
      const { commission } = computeBookingFinancials(booking)
      return sum + commission
    }, 0)

    const bookingsThisMonth = monthRevenueBookings.length
    const bookingsLastMonth = previousRevenueBookings.length

    const completionRateCurrent = monthBookings.length
      ? (monthBookings.filter((booking) => booking.status === "COMPLETED").length /
          monthBookings.length) *
        100
      : 0
    const completionRatePrevious = previousMonthBookings.length
      ? (previousMonthBookings.filter((booking) => booking.status === "COMPLETED").length /
          previousMonthBookings.length) *
        100
      : 0

    const revenueSeriesMap = new Map<string, { revenue: number; bookings: number }>()

    for (let i = 5; i >= 0; i--) {
      const date = startOfMonth(now, -i)
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`
      revenueSeriesMap.set(key, { revenue: 0, bookings: 0 })
    }

    for (const booking of recentCompletedBookings) {
      if (!booking.completedAt) continue
      const key = `${booking.completedAt.getFullYear()}-${booking.completedAt.getMonth() + 1}`
      if (!revenueSeriesMap.has(key)) {
        continue
      }
      const entry = revenueSeriesMap.get(key)!
      entry.revenue += computeBookingFinancials(booking).commission
      entry.bookings += 1
    }

    const revenueSeries = Array.from(revenueSeriesMap.entries()).map(([key, value]) => {
      const [year, month] = key.split("-").map(Number)
      return {
        label: `T${month}`,
        revenue: value.revenue,
        bookings: value.bookings,
        year,
        month,
      }
    })

    const propertyCounts = listings.reduce<Record<string, number>>((acc, listing) => {
      const key = listing.propertyType || "Khác"
      acc[key] = (acc[key] ?? 0) + 1
      return acc
    }, {})

    const propertyDistribution = Object.entries(propertyCounts).map(([name, value]) => ({
      name,
      value,
    }))

    return NextResponse.json({
      cards: {
        revenue: {
          current: revenueThisMonth,
          previous: revenueLastMonth,
          growth:
            revenueLastMonth > 0 ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100 : 0,
        },
        bookings: {
          current: bookingsThisMonth,
          previous: bookingsLastMonth,
          growth: bookingsLastMonth > 0 ? ((bookingsThisMonth - bookingsLastMonth) / bookingsLastMonth) * 100 : 0,
        },
        newUsers: {
          current: newUsersThisMonth,
          previous: newUsersLastMonth,
          growth: newUsersLastMonth > 0 ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100 : 0,
        },
        completionRate: {
          current: completionRateCurrent,
          previous: completionRatePrevious,
          growth:
            completionRatePrevious > 0
              ? ((completionRateCurrent - completionRatePrevious) / completionRatePrevious) * 100
              : completionRateCurrent,
        },
      },
      revenueSeries,
      propertyDistribution,
    })
  } catch (error) {
    console.error("Admin reports summary error:", error)
    return NextResponse.json({ error: "Failed to load reports data" }, { status: 500 })
  }
}
