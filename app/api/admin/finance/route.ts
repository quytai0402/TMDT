import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

function startOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function startOfYear(date: Date) {
  return new Date(date.getFullYear(), 0, 1)
}

const PLATFORM_FEE_RATE = 0.1

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const now = new Date()
    const todayStart = startOfDay(now)
    const monthStart = startOfMonth(now)
    const yearStart = startOfYear(now)

    const [completedPayments, monthlyBookings, yearlyBookings, topListings] = await Promise.all([
      prisma.payment.findMany({
        where: { status: "COMPLETED" },
        select: {
          amount: true,
          paidAt: true,
        },
      }),
      prisma.booking.findMany({
        where: {
          status: { in: ["CONFIRMED", "COMPLETED"] },
          createdAt: { gte: monthStart },
        },
        select: {
          id: true,
          totalPrice: true,
        },
      }),
      prisma.booking.findMany({
        where: {
          status: { in: ["CONFIRMED", "COMPLETED"] },
          createdAt: { gte: yearStart },
        },
        select: {
          id: true,
          totalPrice: true,
          createdAt: true,
        },
      }),
      prisma.listing.findMany({
        where: {
          bookings: {
            some: {
              status: { in: ["CONFIRMED", "COMPLETED"] },
              createdAt: { gte: yearStart },
            },
          },
        },
        select: {
          id: true,
          title: true,
          city: true,
          bookings: {
            where: {
              status: { in: ["CONFIRMED", "COMPLETED"] },
              createdAt: { gte: yearStart },
            },
            select: {
              totalPrice: true,
            },
          },
        },
      }),
    ])

    let totalRevenue = 0
    let todayRevenue = 0
    let monthRevenue = 0

    for (const payment of completedPayments) {
      totalRevenue += payment.amount

      if (payment.paidAt && payment.paidAt >= todayStart) {
        todayRevenue += payment.amount
      }

      if (payment.paidAt && payment.paidAt >= monthStart) {
        monthRevenue += payment.amount
      }
    }

    const monthlyRevenueByDay = Array.from({ length: 31 }, (_, index) => ({
      day: index + 1,
      revenue: 0,
    }))

    for (const booking of monthlyBookings) {
      const created = new Date(booking.id.slice(0, 8) ? booking.createdAt : monthStart)
      const dayIndex = created.getDate() - 1
      if (monthlyRevenueByDay[dayIndex]) {
        monthlyRevenueByDay[dayIndex].revenue += booking.totalPrice ?? 0
      }
    }

    const yearlyRevenueByMonth = Array.from({ length: 12 }, (_, index) => ({
      month: index + 1,
      revenue: 0,
      bookings: 0,
    }))

    for (const booking of yearlyBookings) {
      const created = new Date(booking.createdAt)
      const monthIndex = created.getMonth()
      yearlyRevenueByMonth[monthIndex].revenue += booking.totalPrice ?? 0
      yearlyRevenueByMonth[monthIndex].bookings += 1
    }

    const listingsSummary = topListings
      .map((listing) => {
        const revenue = listing.bookings.reduce((sum, booking) => sum + (booking.totalPrice ?? 0), 0)
        return {
          id: listing.id,
          title: listing.title,
          city: listing.city,
          revenue,
          bookings: listing.bookings.length,
        }
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6)

    const response = {
      revenue: {
        total: totalRevenue,
        today: todayRevenue,
        month: monthRevenue,
        commission: totalRevenue * PLATFORM_FEE_RATE,
        net: totalRevenue * (1 - PLATFORM_FEE_RATE),
      },
      bookings: {
        monthTotal: monthlyBookings.length,
        yearTotal: yearlyBookings.length,
        avgBookingValue:
          yearlyBookings.length > 0
            ? yearlyBookings.reduce((sum, booking) => sum + (booking.totalPrice ?? 0), 0) /
              yearlyBookings.length
            : 0,
        chartByDay: monthlyRevenueByDay,
        chartByMonth: yearlyRevenueByMonth,
      },
      topListings: listingsSummary,
      payoutRequests: [],
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Admin finance error:", error)
    return NextResponse.json({ error: "Failed to load finance data" }, { status: 500 })
  }
}
