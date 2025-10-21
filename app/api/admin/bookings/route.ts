import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"

const normalizePhone = (value?: string | null) =>
  value ? value.replace(/\D/g, "") : null

// GET /api/admin/bookings - Get all bookings with filters
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
    const status = searchParams.get("status") || ""
    const search = searchParams.get("search") || ""
    const normalizedSearch = search.replace(/\D/g, "")

    const skip = (page - 1) * limit

    // Build where clause
    const where: Prisma.BookingWhereInput = {}

    if (status && status !== "all") {
      where.status = status
    }

    if (search) {
      const orConditions: Prisma.BookingWhereInput[] = [
        {
          guest: {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          },
        },
        {
          listing: {
            title: { contains: search, mode: "insensitive" },
          },
        },
        { contactName: { contains: search, mode: "insensitive" } },
        { contactPhone: { contains: search } },
      ]

      if (normalizedSearch) {
        orConditions.push({
          contactPhoneNormalized: { contains: normalizedSearch },
        })
        orConditions.push({
          guest: {
            phone: { contains: search },
          },
        })
      }

      where.OR = orConditions
    }

    // Get bookings
    const [bookings, totalCount] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          guest: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          listing: {
            select: {
              id: true,
              title: true,
              address: true,
              images: true,
              host: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          payment: {
            select: {
              id: true,
              amount: true,
              status: true,
              paymentMethod: true,
            },
          },
        },
      }),
      prisma.booking.count({ where }),
    ])

    const phoneInfoMap = new Map<
      string,
      { normalized: string | null; raw: string | null }
    >()
    for (const booking of bookings) {
      const rawPhone = booking.contactPhone || booking.guest?.phone || null
      const normalized = booking.contactPhoneNormalized || normalizePhone(rawPhone)
      const key = normalized || rawPhone
      if (key && !phoneInfoMap.has(key)) {
        phoneInfoMap.set(key, { normalized, raw: rawPhone })
      }
    }

    const guestHistoryByKey = new Map<
      string,
      { totalBookings: number; totalSpent: number }
    >()
    await Promise.all(
      Array.from(phoneInfoMap.entries()).map(async ([key, info]) => {
        const phoneConditions: Prisma.BookingWhereInput[] = []
        if (info.normalized) {
          phoneConditions.push({ contactPhoneNormalized: info.normalized })
        }
        if (info.raw) {
          phoneConditions.push({ contactPhone: info.raw })
          phoneConditions.push({ guest: { phone: info.raw } })
        }
        if (phoneConditions.length === 0) {
          return
        }

        const history = await prisma.booking.findMany({
          where: {
            status: { in: ['CONFIRMED', 'COMPLETED'] },
            OR: phoneConditions,
          },
          select: {
            id: true,
            totalPrice: true,
          },
        })

        guestHistoryByKey.set(key, {
          totalBookings: history.length,
          totalSpent: history.reduce((sum, item) => sum + item.totalPrice ?? 0, 0),
        })
      })
    )

    const formattedBookings = bookings.map((booking) => {
      const rawPhone = booking.contactPhone || booking.guest?.phone || null
      const normalized = booking.contactPhoneNormalized || normalizePhone(rawPhone)
      const historyKey = normalized || rawPhone || undefined
      const guestHistory = historyKey ? guestHistoryByKey.get(historyKey) : undefined
      const guestName = booking.contactName || booking.guest?.name || 'Khách vãng lai'
      const guestEmail = booking.contactEmail || booking.guest?.email || ''
      const guestPhone = booking.contactPhone || booking.guest?.phone || ''
      const guestsCount =
        booking.adults +
        (booking.children || 0) +
        (booking.infants || 0)

      return {
        id: booking.id,
        bookingRef: booking.id.slice(-8).toUpperCase(),
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        adults: booking.adults,
        children: booking.children,
        infants: booking.infants,
        nights: booking.nights,
        guests: guestsCount,
        totalPrice: booking.totalPrice,
        total: booking.totalPrice,
        status: booking.status,
        guest: booking.guest,
        listing: booking.listing,
        payment: booking.payment,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        guestName,
        guestEmail,
        guestPhone,
        guestType: booking.guestType,
        isGuestBooking: booking.guestType === 'WALK_IN',
        guestHistory: guestHistory
          ? {
              totalBookings: guestHistory.totalBookings,
              totalSpent: guestHistory.totalSpent,
            }
          : null,
      }
    })

    return NextResponse.json({
      bookings: formattedBookings,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    })
  } catch (error) {
    console.error("Admin bookings error:", error)
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/bookings - Update booking status
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
    const { bookingId, status } = body

    if (!bookingId || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    if (!["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      )
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status },
    })

    return NextResponse.json({
      message: "Booking updated successfully",
      booking: updatedBooking,
    })
  } catch (error) {
    console.error("Admin update booking error:", error)
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/bookings - Cancel booking
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
    const bookingId = searchParams.get("bookingId")

    if (!bookingId) {
      return NextResponse.json(
        { error: "Booking ID required" },
        { status: 400 }
      )
    }

    // Update booking status to CANCELLED
    const cancelledBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "CANCELLED" },
    })

    return NextResponse.json({
      message: "Booking cancelled successfully",
      booking: cancelledBooking,
    })
  } catch (error) {
    console.error("Admin cancel booking error:", error)
    return NextResponse.json(
      { error: "Failed to cancel booking" },
      { status: 500 }
    )
  }
}
