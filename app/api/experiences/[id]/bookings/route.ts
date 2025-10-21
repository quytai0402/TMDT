import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createBookingSchema = z.object({
  date: z.string(),
  numberOfGuests: z.number().int().min(1),
  timeSlot: z.string().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: experienceId } = await params
    if (!experienceId) {
      return NextResponse.json({ error: "Missing experienceId" }, { status: 400 })
    }

    const body = await request.json()
    const validated = createBookingSchema.parse({
      ...body,
      numberOfGuests:
        typeof body.numberOfGuests === "string"
          ? Number.parseInt(body.numberOfGuests, 10)
          : body.numberOfGuests,
    })

    const bookingDate = new Date(validated.date)
    if (Number.isNaN(bookingDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid booking date" },
        { status: 400 }
      )
    }

    const experience = await prisma.experience.findUnique({
      where: { id: experienceId, status: "ACTIVE" },
      select: {
        id: true,
        price: true,
        currency: true,
        minGuests: true,
        maxGuests: true,
      },
    })

    if (!experience) {
      return NextResponse.json({ error: "Experience not found" }, { status: 404 })
    }

    if (
      validated.numberOfGuests < experience.minGuests ||
      validated.numberOfGuests > experience.maxGuests
    ) {
      return NextResponse.json(
        {
          error: `Số khách phải trong khoảng từ ${experience.minGuests} đến ${experience.maxGuests}.`,
        },
        { status: 400 }
      )
    }

    const totalPrice = experience.price * validated.numberOfGuests

    const booking = await prisma.experienceBooking.create({
      data: {
        experienceId: experience.id,
        guestId: session.user.id,
        date: bookingDate,
        timeSlot: validated.timeSlot,
        numberOfGuests: validated.numberOfGuests,
        pricePerPerson: experience.price,
        totalPrice,
        currency: experience.currency,
        status: "PENDING",
      },
    })

    await prisma.experience.update({
      where: { id: experience.id },
      data: {
        totalBookings: { increment: 1 },
      },
    })

    return NextResponse.json(
      {
        booking: {
          id: booking.id,
          status: booking.status,
          date: booking.date,
          numberOfGuests: booking.numberOfGuests,
          totalPrice: booking.totalPrice,
          currency: booking.currency,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Experience booking error:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json(
      { error: "Không thể đặt trải nghiệm. Vui lòng thử lại." },
      { status: 500 }
    )
  }
}
