import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { NotificationType } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notifyAdmins, notifyUser } from "@/lib/notifications"

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> },
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { bookingId } = await params
    if (!bookingId) {
      return NextResponse.json({ error: "Missing bookingId" }, { status: 400 })
    }

    const booking = await prisma.experienceBooking.findUnique({
      where: { id: bookingId },
      include: {
        experience: {
          select: {
            id: true,
            title: true,
            hostId: true,
            guideProfile: {
              select: {
                userId: true,
              },
            },
          },
        },
        guest: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!booking || booking.guestId !== session.user.id) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    if (booking.paid) {
      return NextResponse.json({ bookingId: booking.id, message: "Payment already confirmed." })
    }

    await prisma.experienceBooking.update({
      where: { id: booking.id },
      data: { paid: true },
    })

    const bookingDateLabel = format(booking.date, "EEEE, dd MMMM yyyy", { locale: vi })
    const guestName = booking.guest?.name ?? "Khách LuxeStay"
    const baseMessage = `${guestName} xác nhận đã chuyển khoản cho trải nghiệm "${booking.experience.title}" vào ${bookingDateLabel}.`

    const jobs: Promise<unknown>[] = []

    jobs.push(
      notifyUser(booking.experience.hostId, {
        type: NotificationType.PAYMENT_RECEIVED,
        title: "Khách xác nhận thanh toán trải nghiệm",
        message: baseMessage,
        link: `/host/experiences/${booking.experience.id}?booking=${booking.id}`,
        data: { bookingId: booking.id, experienceId: booking.experience.id },
      }),
    )

    if (booking.experience.guideProfile?.userId) {
      jobs.push(
        notifyUser(booking.experience.guideProfile.userId, {
          type: NotificationType.BOOKING_REQUEST,
          title: "Có trải nghiệm chờ bạn xác nhận",
          message: baseMessage,
          link: `/guide/bookings?booking=${booking.id}`,
          data: { bookingId: booking.id, experienceId: booking.experience.id },
        }),
      )
    }

    jobs.push(
      notifyAdmins({
        type: NotificationType.PAYMENT_RECEIVED,
        title: "Cần kiểm tra thanh toán trải nghiệm",
        message: `Booking ${booking.id} cần xác thực giao dịch.`,
        link: `/admin/guides/experiences`,
        data: { bookingId: booking.id, experienceId: booking.experience.id },
      }),
    )

    jobs.push(
      notifyUser(session.user.id, {
        type: NotificationType.SYSTEM,
        title: "Chúng tôi đang xác nhận giao dịch",
        message: "Concierge sẽ thông báo sau khi hướng dẫn viên xác nhận.",
        link: `/experiences/bookings/${booking.id}/success`,
        data: { bookingId: booking.id },
      }),
    )

    void Promise.all(jobs).catch((error) => {
      console.error("Experience booking confirmation notification error:", error)
    })

    return NextResponse.json({ bookingId: booking.id })
  } catch (error) {
    console.error("Experience booking confirm payment error:", error)
    return NextResponse.json(
      { error: "Không thể xác nhận thanh toán. Vui lòng thử lại sau." },
      { status: 500 },
    )
  }
}
