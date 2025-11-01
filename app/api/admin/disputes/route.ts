import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import type { Prisma } from "@prisma/client"
import { NotificationType } from "@prisma/client"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notifyUser } from "@/lib/notifications"

const patchSchema = z.object({
  disputeId: z.string().min(1, "Thiếu mã tranh chấp"),
  status: z.enum(["OPEN", "IN_REVIEW", "AWAITING_RESPONSE", "RESOLVED", "CLOSED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  resolution: z.string().optional(),
  refundAmount: z.number().min(0).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "20", 10)
    const status = searchParams.get("status")
    const priority = searchParams.get("priority")
    const keyword = searchParams.get("search")

    const skip = (page - 1) * limit

    const where: Prisma.DisputeWhereInput = {}

    if (status && status !== "all") {
      where.status = status as Prisma.DisputeStatus
    }

    if (priority && priority !== "all") {
      where.priority = priority as Prisma.DisputePriority
    }

    if (keyword) {
      where.OR = [
        { subject: { contains: keyword, mode: "insensitive" } },
        { description: { contains: keyword, mode: "insensitive" } },
        { resolution: { contains: keyword, mode: "insensitive" } },
      ]
    }

    const [disputes, total] = await Promise.all([
      prisma.dispute.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          reporter: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              role: true,
            },
          },
        },
      }),
      prisma.dispute.count({ where }),
    ])

    if (disputes.length === 0) {
      return NextResponse.json({
        disputes: [],
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      })
    }

    const respondentIds = disputes
      .map((dispute) => dispute.respondentId)
      .filter(Boolean) as string[]
    const bookingIds = disputes.map((dispute) => dispute.bookingId)

    const [respondents, bookings] = await Promise.all([
      respondentIds.length
        ? prisma.user.findMany({
            where: { id: { in: respondentIds } },
            select: { id: true, name: true, email: true, image: true, role: true },
          })
        : Promise.resolve([]),
      prisma.booking.findMany({
        where: { id: { in: bookingIds } },
        include: {
          listing: {
            select: {
              id: true,
              title: true,
              city: true,
              country: true,
              images: true,
            },
          },
          guest: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          host: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      }),
    ])

    const respondentMap = new Map(respondents.map((user) => [user.id, user]))
    const bookingMap = new Map(bookings.map((booking) => [booking.id, booking]))

    const enriched = disputes.map((dispute) => {
      const booking = bookingMap.get(dispute.bookingId)
      const respondent = respondentMap.get(dispute.respondentId)

      return {
        ...dispute,
        booking: booking
          ? {
              id: booking.id,
              checkIn: booking.checkIn,
              checkOut: booking.checkOut,
              status: booking.status,
              totalPrice: booking.totalPrice,
              listing: booking.listing,
              guest: booking.guest,
              host: booking.host,
            }
          : null,
        respondent: respondent || null,
      }
    })

    return NextResponse.json({
      disputes: enriched,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Admin disputes GET error:", error)
    return NextResponse.json({ error: "Failed to load disputes" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = patchSchema.safeParse(await request.json())
    if (!payload.success) {
      return NextResponse.json(
        { error: payload.error.issues[0]?.message ?? "Thông tin không hợp lệ" },
        { status: 400 },
      )
    }

    const { disputeId, refundAmount, ...rest } = payload.data

    const updated = await prisma.dispute.update({
      where: { id: disputeId },
      data: {
        ...rest,
        ...(typeof refundAmount === "number" ? { refundAmount } : {}),
        resolvedBy: rest.status === "RESOLVED" || rest.status === "CLOSED" ? session.user.id : undefined,
        resolvedAt:
          rest.status === "RESOLVED" || rest.status === "CLOSED" ? new Date() : undefined,
      },
    })

    const detailed = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        reporter: {
          select: { id: true, name: true },
        },
        booking: {
          select: {
            id: true,
            listing: { select: { id: true, title: true } },
            hostId: true,
            guestId: true,
          },
        },
      },
    })

    if (detailed) {
      const statusLabel = updated.status.toLowerCase().replace(/_/g, " ")
      const baseLink =
        detailed.booking?.hostId === detailed.reporterId
          ? `/host/bookings/${detailed.booking?.id}`
          : `/trips/${detailed.booking?.id}`

      const notificationMessage =
        rest.status === "RESOLVED" || rest.status === "CLOSED"
          ? `Tranh chấp "${detailed.subject}" đã được ${rest.status === "RESOLVED" ? "giải quyết" : "đóng"}.`
          : `Tranh chấp "${detailed.subject}" được cập nhật trạng thái ${statusLabel}.`

      await notifyUser(detailed.reporterId, {
        type: NotificationType.SYSTEM,
        title: "Cập nhật tranh chấp",
        message: notificationMessage,
        link: baseLink,
        data: {
          disputeId,
          status: updated.status,
          resolution: rest.resolution,
        },
      })

      if (detailed.respondentId) {
        const respondentLink =
          detailed.booking?.hostId === detailed.respondentId
            ? `/host/bookings/${detailed.booking?.id}`
            : `/trips/${detailed.booking?.id}`

        await notifyUser(detailed.respondentId, {
          type: NotificationType.SYSTEM,
          title: "Tranh chấp được cập nhật",
          message: notificationMessage,
          link: respondentLink,
          data: {
            disputeId,
            status: updated.status,
            resolution: rest.resolution,
          },
        })
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE_DISPUTE",
        entityType: "Dispute",
        entityId: disputeId,
        changes: {
          ...rest,
          refundAmount,
        },
      },
    })

    return NextResponse.json({ dispute: updated })
  } catch (error) {
    console.error("Admin disputes PATCH error:", error)
    return NextResponse.json({ error: "Failed to update dispute" }, { status: 500 })
  }
}
