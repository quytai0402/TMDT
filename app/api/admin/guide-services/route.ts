import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { BookingStatus, NotificationType, Prisma } from "@prisma/client"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notifyUser } from "@/lib/notifications"
import { formatTransferReference } from "@/lib/payments"

const VALID_STATUSES = new Set<string>(Object.values(BookingStatus))

const bookingSelect = {
  id: true,
  experienceId: true,
  guestId: true,
  date: true,
  timeSlot: true,
  numberOfGuests: true,
  pricePerPerson: true,
  totalPrice: true,
  currency: true,
  discountRate: true,
  discountAmount: true,
  membershipPlanId: true,
  membershipPlanSnapshot: true,
  membershipPlan: {
    select: {
      id: true,
      slug: true,
      name: true,
    },
  },
  status: true,
  paid: true,
  createdAt: true,
  updatedAt: true,
  experience: {
    select: {
      id: true,
      title: true,
      city: true,
      state: true,
      image: true,
      hostId: true,
      guideProfileId: true,
      guideProfile: {
        select: {
          id: true,
          userId: true,
          displayName: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      host: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  },
  guest: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
    },
  },
} satisfies Prisma.ExperienceBookingSelect

type BookingRecord = Prisma.ExperienceBookingGetPayload<{ select: typeof bookingSelect }>

type EnsureAdminResult =
  | { error: NextResponse }
  | { session: Awaited<ReturnType<typeof getServerSession>> }

const emptyCounts = (): Record<BookingStatus, number> => ({
  [BookingStatus.PENDING]: 0,
  [BookingStatus.CONFIRMED]: 0,
  [BookingStatus.CANCELLED]: 0,
  [BookingStatus.COMPLETED]: 0,
  [BookingStatus.DECLINED]: 0,
  [BookingStatus.EXPIRED]: 0,
})

const ensureAdmin = async (): Promise<EnsureAdminResult> => {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  const admin = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })

  if (admin?.role !== "ADMIN" && admin?.role !== "SUPER_ADMIN") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }

  return { session }
}

const mapBooking = (booking: BookingRecord) => ({
  id: booking.id,
  experienceId: booking.experienceId,
  guestId: booking.guestId,
  date: booking.date ? booking.date.toISOString() : null,
  timeSlot: booking.timeSlot,
  numberOfGuests: booking.numberOfGuests,
  pricePerPerson: booking.pricePerPerson,
  totalPrice: booking.totalPrice,
  currency: booking.currency,
  discountRate: booking.discountRate,
  discountAmount: booking.discountAmount,
  status: booking.status,
  paid: booking.paid,
  createdAt: booking.createdAt.toISOString(),
  updatedAt: booking.updatedAt.toISOString(),
  referenceCode: formatTransferReference("EXPERIENCE", booking.id.slice(-8).toUpperCase()),
  membershipPlan: booking.membershipPlan
    ? {
        id: booking.membershipPlan.id,
        slug: booking.membershipPlan.slug,
        name: booking.membershipPlan.name,
      }
    : null,
  membershipPlanSnapshot: booking.membershipPlanSnapshot,
  experience: booking.experience
    ? {
        id: booking.experience.id,
        title: booking.experience.title,
        city: booking.experience.city,
        state: booking.experience.state,
        image: booking.experience.image,
        hostId: booking.experience.hostId,
        host: booking.experience.host
          ? {
              id: booking.experience.host.id,
              name: booking.experience.host.name,
              email: booking.experience.host.email,
            }
          : null,
        guideProfile: booking.experience.guideProfile
          ? {
              id: booking.experience.guideProfile.id,
              userId: booking.experience.guideProfile.userId,
              displayName: booking.experience.guideProfile.displayName,
              user: booking.experience.guideProfile.user
                ? {
                    id: booking.experience.guideProfile.user.id,
                    name: booking.experience.guideProfile.user.name,
                    email: booking.experience.guideProfile.user.email,
                  }
                : null,
            }
          : null,
      }
    : null,
  guest: booking.guest
    ? {
        id: booking.guest.id,
        name: booking.guest.name,
        email: booking.guest.email,
        phone: booking.guest.phone,
      }
    : null,
})

export async function GET(request: NextRequest) {
  try {
    const verification = await ensureAdmin()
    if ("error" in verification) {
      return verification.error
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10))
    const limit = Math.min(200, Math.max(1, Number.parseInt(searchParams.get("limit") || "50", 10)))
    const statusParam = searchParams.get("status")?.trim().toUpperCase()
    const search = searchParams.get("search")?.trim() ?? ""
    const paidParam = searchParams.get("paid")?.trim().toLowerCase()

    const filters: Prisma.ExperienceBookingWhereInput[] = []

    if (statusParam && VALID_STATUSES.has(statusParam)) {
      filters.push({ status: statusParam as BookingStatus })
    }

    if (paidParam === "true" || paidParam === "false") {
      filters.push({ paid: paidParam === "true" })
    }

    if (search) {
      const sanitized = search.replace(/[^A-Za-z0-9]/g, "").toLowerCase()
      const searchConditions: Prisma.ExperienceBookingWhereInput[] = [
        { guest: { name: { contains: search, mode: "insensitive" } } },
        { guest: { email: { contains: search, mode: "insensitive" } } },
        { guest: { phone: { contains: search } } },
        { experience: { title: { contains: search, mode: "insensitive" } } },
        { experience: { city: { contains: search, mode: "insensitive" } } },
        { experience: { guideProfile: { displayName: { contains: search, mode: "insensitive" } } } },
      ]

      if (sanitized.length >= 6) {
        searchConditions.push({ id: { contains: sanitized } })
      }

      filters.push({ OR: searchConditions })
    }

    const where: Prisma.ExperienceBookingWhereInput = filters.length > 0 ? { AND: filters } : {}
    const skip = (page - 1) * limit

    const unpaidWhere: Prisma.ExperienceBookingWhereInput = filters.length > 0
      ? { AND: [...filters, { paid: false }] }
      : { paid: false }

    const paidWhere: Prisma.ExperienceBookingWhereInput = filters.length > 0
      ? { AND: [...filters, { paid: true }] }
      : { paid: true }

    const [bookings, totalCount, groupedCounts, totalRevenueAgg, outstandingAgg, paidCount] = await Promise.all([
      prisma.experienceBooking.findMany({
        where,
        select: bookingSelect,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.experienceBooking.count({ where }),
      prisma.experienceBooking.groupBy({
        where,
        by: ["status"],
        _count: { status: true },
      }),
      prisma.experienceBooking.aggregate({
        where,
        _sum: { totalPrice: true },
      }),
      prisma.experienceBooking.aggregate({
        where: unpaidWhere,
        _sum: { totalPrice: true },
      }),
      prisma.experienceBooking.count({ where: paidWhere }),
    ])

    const counts = emptyCounts()
    for (const entry of groupedCounts) {
      counts[entry.status] = entry._count.status
    }

    const summary = {
      total: totalCount,
      counts,
      grossRevenue: Number(totalRevenueAgg._sum.totalPrice ?? 0),
      outstanding: Number(outstandingAgg._sum.totalPrice ?? 0),
      paidCount,
    }

    return NextResponse.json({
      bookings: bookings.map(mapBooking),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
      summary,
    })
  } catch (error) {
    console.error("Admin guide services GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

const buildStatusNotifications = (
  booking: BookingRecord,
  nextStatus: BookingStatus,
) => {
  const title = booking.experience?.title ?? "Trải nghiệm LuxeStay"
  const dateLabel = booking.date
    ? booking.date.toLocaleDateString("vi-VN", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "thời gian linh hoạt"

  switch (nextStatus) {
    case BookingStatus.CONFIRMED:
      return {
        guest: {
          type: NotificationType.BOOKING_CONFIRMED,
          title: "Booking trải nghiệm đã được xác nhận",
          message: `Đặt lịch "${title}" vào ${dateLabel} đã được đội concierge xác nhận. Chúng tôi sẽ giữ liên lạc để bạn chuẩn bị tốt nhất.`,
        },
        provider: {
          type: NotificationType.BOOKING_CONFIRMED,
          title: "Booking trải nghiệm cần bạn chuẩn bị",
          message: `Booking "${title}" vào ${dateLabel} đã được duyệt. Vui lòng xác nhận lịch trình với khách.`,
        },
      }
    case BookingStatus.COMPLETED:
      return {
        guest: {
          type: NotificationType.SYSTEM,
          title: "Cảm ơn bạn đã trải nghiệm cùng LuxeStay",
          message: `Chúng tôi đã ghi nhận booking "${title}" ngày ${dateLabel} hoàn tất. Hẹn gặp bạn ở hành trình tiếp theo!`,
        },
        provider: {
          type: NotificationType.SYSTEM,
          title: "Đã ghi nhận booking hoàn thành",
          message: `Booking "${title}" ngày ${dateLabel} đã hoàn tất. Đừng quên cập nhật đánh giá từ khách nếu có.`,
        },
      }
    case BookingStatus.CANCELLED:
    case BookingStatus.DECLINED:
      return {
        guest: {
          type: NotificationType.BOOKING_CANCELLED,
          title: "Booking trải nghiệm bị hủy",
          message: `Rất tiếc, booking "${title}" vào ${dateLabel} đã bị hủy. Vui lòng chọn lịch khác hoặc liên hệ concierge để được hỗ trợ.`,
        },
        provider: {
          type: NotificationType.BOOKING_CANCELLED,
          title: "Booking trải nghiệm đã bị hủy",
          message: `Booking "${title}" vào ${dateLabel} đã bị hủy bởi đội vận hành. Kiểm tra hộp thư để xem thêm chi tiết.`,
        },
      }
    case BookingStatus.EXPIRED:
      return {
        provider: {
          type: NotificationType.SYSTEM,
          title: "Booking trải nghiệm quá hạn",
          message: `Booking "${title}" vào ${dateLabel} đã hết hạn xử lý. Hãy cập nhật lịch mới nếu cần.`,
        },
      }
    default:
      return null
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const verification = await ensureAdmin()
    if ("error" in verification) {
      return verification.error
    }

    const body = await request.json()
    const { bookingId, status, paid } = body as {
      bookingId?: string
      status?: string | null
      paid?: boolean
    }

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId is required" }, { status: 400 })
    }

    const existing = await prisma.experienceBooking.findUnique({
      where: { id: bookingId },
      select: bookingSelect,
    })

    if (!existing) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    const updatePayload: Prisma.ExperienceBookingUpdateInput = {}
    let statusChanged = false
    let nextStatus: BookingStatus | null = null

    if (typeof status === "string" && status.trim().length > 0) {
      const normalized = status.trim().toUpperCase()
      if (!VALID_STATUSES.has(normalized)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 })
      }
      if (existing.status !== normalized) {
        updatePayload.status = normalized as BookingStatus
        statusChanged = true
        nextStatus = normalized as BookingStatus
      }
    }

    let paidChanged = false
    if (typeof paid === "boolean" && paid !== existing.paid) {
      updatePayload.paid = paid
      paidChanged = true
    }

    if (!statusChanged && !paidChanged) {
      return NextResponse.json({
        message: "No changes applied",
        booking: mapBooking(existing),
      })
    }

    const updated = await prisma.experienceBooking.update({
      where: { id: bookingId },
      data: updatePayload,
      select: bookingSelect,
    })

    const notificationJobs: Promise<unknown>[] = []

    if (statusChanged && nextStatus) {
      const content = buildStatusNotifications(updated, nextStatus)
      const linkForGuest = `/experiences/bookings/${updated.id}/success`
      const linkForProvider = `/guide/bookings?booking=${updated.id}`

      if (content?.guest && updated.guestId) {
        notificationJobs.push(
          notifyUser(updated.guestId, {
            type: content.guest.type,
            title: content.guest.title,
            message: content.guest.message,
            link: linkForGuest,
            data: {
              bookingId: updated.id,
              experienceId: updated.experienceId,
              status: nextStatus,
            },
          }),
        )
      }

      const providerIds = new Set<string>()
      if (updated.experience?.hostId) {
        providerIds.add(updated.experience.hostId)
      }
      if (updated.experience?.guideProfile?.userId) {
        providerIds.add(updated.experience.guideProfile.userId)
      }

      if (content?.provider && providerIds.size > 0) {
        for (const providerId of providerIds) {
          notificationJobs.push(
            notifyUser(providerId, {
              type: content.provider.type,
              title: content.provider.title,
              message: content.provider.message,
              link: linkForProvider,
              data: {
                bookingId: updated.id,
                experienceId: updated.experienceId,
                status: nextStatus,
              },
            }),
          )
        }
      }
    }

    if (paidChanged && updated.paid) {
      const title = updated.experience?.title ?? "trải nghiệm"
      const dateLabel = updated.date
        ? updated.date.toLocaleDateString("vi-VN", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
          })
        : "thời gian linh hoạt"

      const recipients = new Set<string>()
      if (updated.experience?.guideProfile?.userId) {
        recipients.add(updated.experience.guideProfile.userId)
      } else if (updated.experience?.hostId) {
        recipients.add(updated.experience.hostId)
      }

      for (const userId of recipients) {
        notificationJobs.push(
          notifyUser(userId, {
            type: NotificationType.SYSTEM,
            title: "Thanh toán booking đã được ghi nhận",
            message: `Đội vận hành đã đánh dấu booking "${title}" ngày ${dateLabel} là đã thanh toán. Bạn có thể kiểm tra số dư rút tiền trong trang tài chính.`,
            link: `/guide/bookings?booking=${updated.id}`,
            data: {
              bookingId: updated.id,
              experienceId: updated.experienceId,
              paid: true,
            },
          }),
        )
      }
    }

    if (notificationJobs.length > 0) {
      void Promise.allSettled(notificationJobs)
    }

    return NextResponse.json({
      message: "Booking updated",
      booking: mapBooking(updated),
    })
  } catch (error) {
    console.error("Admin guide services PATCH error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
