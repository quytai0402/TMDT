import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { PayoutStatus } from "@prisma/client"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { computeBookingFinancials } from "@/lib/finance"

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

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const now = new Date()
    const todayStart = startOfDay(now)
    const monthStart = startOfMonth(now)
    const yearStart = startOfYear(now)
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()

    const [completedBookings, monthlyBookings, yearlyBookings, topListings, payoutRequests] =
      await Promise.all([
        prisma.booking.findMany({
          where: { status: "COMPLETED" },
          select: {
            completedAt: true,
            totalPrice: true,
            serviceFee: true,
            platformCommission: true,
            hostEarnings: true,
          },
        }),
        prisma.booking.findMany({
          where: {
            status: "COMPLETED",
            completedAt: { gte: monthStart },
          },
          select: {
            completedAt: true,
            totalPrice: true,
            serviceFee: true,
            platformCommission: true,
            hostEarnings: true,
          },
        }),
        prisma.booking.findMany({
          where: {
            status: "COMPLETED",
            completedAt: { gte: yearStart },
          },
          select: {
            completedAt: true,
            totalPrice: true,
            serviceFee: true,
            platformCommission: true,
            hostEarnings: true,
          },
        }),
        prisma.listing.findMany({
          where: {
            bookings: {
              some: {
                status: "COMPLETED",
                completedAt: { gte: yearStart },
              },
            },
          },
          select: {
            id: true,
            title: true,
            city: true,
            bookings: {
              where: {
                status: "COMPLETED",
                completedAt: { gte: yearStart },
              },
              select: {
                totalPrice: true,
              },
            },
          },
        }),
        prisma.hostPayout.findMany({
          where: {
            status: {
              in: [PayoutStatus.PENDING, PayoutStatus.APPROVED],
            },
          },
          include: {
            host: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { requestedAt: "asc" },
          take: 25,
        }),
      ])

    let grossTotal = 0
    let commissionTotal = 0
    let todayGross = 0
    let monthGross = 0
    let todayCommission = 0
    let monthCommission = 0

    for (const booking of completedBookings) {
      const { commission, hostShare } = computeBookingFinancials(booking)
      const gross = commission + hostShare
      grossTotal += gross
      commissionTotal += commission

      if (booking.completedAt && booking.completedAt >= todayStart) {
        todayGross += gross
        todayCommission += commission
      }

      if (booking.completedAt && booking.completedAt >= monthStart) {
        monthGross += gross
        monthCommission += commission
      }
    }

    const monthlyRevenueByDay = Array.from({ length: daysInMonth }, (_, index) => ({
      day: index + 1,
      revenue: 0,
    }))

    for (const booking of monthlyBookings) {
      if (!booking.completedAt) continue
      const { commission } = computeBookingFinancials(booking)
      const dayIndex = booking.completedAt.getDate() - 1
      if (monthlyRevenueByDay[dayIndex]) {
        monthlyRevenueByDay[dayIndex].revenue += commission
      }
    }

    const yearlyRevenueByMonth = Array.from({ length: 12 }, (_, index) => ({
      month: index + 1,
      revenue: 0,
      bookings: 0,
    }))

    for (const booking of yearlyBookings) {
      if (!booking.completedAt) continue
      const { commission } = computeBookingFinancials(booking)
      const monthIndex = booking.completedAt.getMonth()
      yearlyRevenueByMonth[monthIndex].revenue += commission
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
        total: grossTotal,
        today: todayGross,
        month: monthGross,
        commission: commissionTotal,
        todayCommission,
        monthCommission,
        net: grossTotal - commissionTotal,
      },
      bookings: {
        monthTotal: monthlyBookings.length,
        yearTotal: yearlyBookings.length,
        avgBookingValue:
          yearlyBookings.length > 0
            ? yearlyBookings.reduce((sum, booking) => {
                const { commission, hostShare } = computeBookingFinancials(booking)
                return sum + commission + hostShare
              }, 0) / yearlyBookings.length
            : 0,
        chartByDay: monthlyRevenueByDay,
        chartByMonth: yearlyRevenueByMonth,
      },
      topListings: listingsSummary,
      payoutRequests,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Admin finance error:", error)
    return NextResponse.json({ error: "Failed to load finance data" }, { status: 500 })
  }
}
