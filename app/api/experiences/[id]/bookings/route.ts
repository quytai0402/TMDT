import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { NotificationType } from "@prisma/client"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notifyAdmins, notifyUser } from "@/lib/notifications"
import { getMembershipForUser } from "@/lib/membership"
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
        title: true,
        price: true,
        currency: true,
        minGuests: true,
        maxGuests: true,
        hostId: true,
        guideProfile: {
          select: {
            userId: true,
          },
        },
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

  const basePrice = experience.price * validated.numberOfGuests
  const currencyCode = experience.currency ?? "VND"

    const membership = await getMembershipForUser(session.user.id)
    const hasActivePlan = Boolean(membership?.isActive && membership.plan)
    const rawExperienceDiscount = hasActivePlan ? Number(membership?.plan?.experienceDiscountRate ?? 0) : 0
    const fallbackDiscount = hasActivePlan ? Number(membership?.plan?.bookingDiscountRate ?? 0) : 0
    const discountRate = Math.max(0, rawExperienceDiscount || fallbackDiscount || 0)
    const rawDiscount = discountRate > 0 ? (basePrice * discountRate) / 100 : 0
    const discountAmount =
      discountRate > 0
        ? currencyCode === "VND"
          ? Math.round(rawDiscount)
          : Number(rawDiscount.toFixed(2))
        : 0
    const totalPrice = Math.max(0, basePrice - discountAmount)
    const membershipPlanId = hasActivePlan && membership?.plan?.id ? membership.plan.id : null
    const membershipPlanSnapshot = hasActivePlan && membership?.plan
      ? {
          id: membership.plan.id,
          slug: membership.plan.slug,
          name: membership.plan.name,
          bookingDiscountRate: membership.plan.bookingDiscountRate,
          experienceDiscountRate: membership.plan.experienceDiscountRate,
        }
      : null

    const booking = await prisma.experienceBooking.create({
      data: {
        experienceId: experience.id,
        guestId: session.user.id,
        date: bookingDate,
        timeSlot: validated.timeSlot,
        numberOfGuests: validated.numberOfGuests,
        pricePerPerson: experience.price,
        totalPrice,
  currency: currencyCode,
        status: "PENDING",
        discountRate,
        discountAmount,
        membershipPlanId,
        membershipPlanSnapshot,
      },
      include: {
        membershipPlan: {
          select: {
            id: true,
            slug: true,
            name: true,
          },
        },
      },
    })

    await prisma.experience.update({
      where: { id: experience.id },
      data: {
        totalBookings: { increment: 1 },
      },
    })

    const bookingDateLabel = bookingDate.toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    })

    const notifyPayload = {
      type: NotificationType.BOOKING_REQUEST,
      title: "Có yêu cầu trải nghiệm mới",
      message: `${session.user.name ?? "Một vị khách"} đặt "${experience.title}" ngày ${bookingDateLabel} cho ${validated.numberOfGuests} khách.`,
      link: `/host/experiences/${experience.id}?booking=${booking.id}`,
      data: {
        bookingId: booking.id,
        experienceId: experience.id,
      } as const,
    }

    const notificationJobs: Promise<unknown>[] = [
      notifyUser(experience.hostId, notifyPayload),
      notifyAdmins({
        type: NotificationType.BOOKING_REQUEST,
        title: "Có trải nghiệm cần xử lý",
        message: `${experience.title} vừa có yêu cầu mới từ khách.`,
        link: `/admin/guides/experiences`,
        data: {
          bookingId: booking.id,
          experienceId: experience.id,
        },
      }),
    ]

    if (experience.guideProfile?.userId) {
      notificationJobs.push(
        notifyUser(experience.guideProfile.userId, {
          ...notifyPayload,
          link: `/guide/bookings?booking=${booking.id}`,
        }),
      )
    }

    void Promise.all(notificationJobs).catch((error) =>
      console.error("Experience booking notification error:", error),
    )

    return NextResponse.json(
      {
        booking: {
          id: booking.id,
          status: booking.status,
          date: booking.date,
          numberOfGuests: booking.numberOfGuests,
          totalPrice: booking.totalPrice,
          currency: booking.currency,
          discountRate: booking.discountRate,
          discountAmount: booking.discountAmount,
          membershipPlan: booking.membershipPlan
            ? {
                id: booking.membershipPlan.id,
                slug: booking.membershipPlan.slug,
                name: booking.membershipPlan.name,
              }
            : null,
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
