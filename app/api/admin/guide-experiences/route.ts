import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { ExperienceStatus, Prisma } from "@prisma/client"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notifyUser } from "@/lib/notifications"

const STATUS_ALIASES: Record<string, ExperienceStatus> = {
  PENDING: ExperienceStatus.DRAFT,
  REVIEW: ExperienceStatus.DRAFT,
  REVIEWING: ExperienceStatus.DRAFT,
  APPROVED: ExperienceStatus.ACTIVE,
  ACTIVE: ExperienceStatus.ACTIVE,
  PAUSED: ExperienceStatus.PAUSED,
  INACTIVE: ExperienceStatus.INACTIVE,
  REJECTED: ExperienceStatus.INACTIVE,
  ARCHIVED: ExperienceStatus.INACTIVE,
}

const VALID_STATUSES = new Set<string>(Object.values(ExperienceStatus))

const normalizeStatus = (value: string | null): ExperienceStatus | null => {
  if (!value) return null
  const normalized = value.trim().toUpperCase()
  if (normalized === "ALL") return null
  if (STATUS_ALIASES[normalized]) {
    return STATUS_ALIASES[normalized]
  }
  if (VALID_STATUSES.has(normalized)) {
    return normalized as ExperienceStatus
  }
  return null
}

type SummaryPayload = {
  total: number
  pending: number
  active: number
  paused: number
  inactive: number
  submittedLast24Hours: number
}

const buildSummary = async (): Promise<SummaryPayload> => {
  const now = new Date()
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  const [total, pending, active, paused, inactive, submittedLast24Hours] = await Promise.all([
    prisma.experience.count(),
    prisma.experience.count({ where: { status: ExperienceStatus.DRAFT } }),
    prisma.experience.count({ where: { status: ExperienceStatus.ACTIVE } }),
    prisma.experience.count({ where: { status: ExperienceStatus.PAUSED } }),
    prisma.experience.count({ where: { status: ExperienceStatus.INACTIVE } }),
    prisma.experience.count({ where: { createdAt: { gte: last24Hours } } }),
  ])

  return {
    total,
    pending,
    active,
    paused,
    inactive,
    submittedLast24Hours,
  }
}

const ensureAdmin = async () => {
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

export async function GET(request: NextRequest) {
  try {
    const verification = await ensureAdmin()
    if ("error" in verification) {
      return verification.error
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10))
    const limit = Math.max(1, Math.min(100, Number.parseInt(searchParams.get("limit") || "20", 10)))
    const search = searchParams.get("search")?.trim() || ""
    const statusParam = searchParams.get("status")

    const skip = (page - 1) * limit

    const filters: Prisma.ExperienceWhereInput[] = []

    const normalizedStatus = normalizeStatus(statusParam)
    if (normalizedStatus) {
      filters.push({ status: normalizedStatus })
    }

    if (search) {
      filters.push({
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { city: { contains: search, mode: "insensitive" } },
          { location: { contains: search, mode: "insensitive" } },
          { guideProfile: { displayName: { contains: search, mode: "insensitive" } } },
          { host: { name: { contains: search, mode: "insensitive" } } },
          { host: { email: { contains: search, mode: "insensitive" } } },
        ],
      })
    }

    const where: Prisma.ExperienceWhereInput = filters.length > 0 ? { AND: filters } : {}

    const [experiences, totalCount, summary] = await Promise.all([
      prisma.experience.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          guideProfile: {
            select: {
              id: true,
              userId: true,
              displayName: true,
              status: true,
              adminCommissionRate: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
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
          _count: {
            select: {
              bookings: true,
              reviews: true,
            },
          },
        },
      }),
      prisma.experience.count({ where }),
      buildSummary(),
    ])

    return NextResponse.json({
      experiences: experiences.map((experience) => ({
        id: experience.id,
        title: experience.title,
        description: experience.description,
        category: experience.category,
        city: experience.city,
        state: experience.state,
        location: experience.location,
        image: experience.image,
        images: experience.images,
        price: experience.price,
        currency: experience.currency,
        duration: experience.duration,
        groupSize: experience.groupSize,
        minGuests: experience.minGuests,
        maxGuests: experience.maxGuests,
        languages: experience.languages,
        tags: experience.tags,
        status: experience.status,
        isVerified: experience.isVerified,
        featured: experience.featured,
        isMembersOnly: experience.isMembersOnly,
        averageRating: experience.averageRating,
        totalReviews: experience.totalReviews,
        totalBookings: experience.totalBookings,
        createdAt: experience.createdAt,
        updatedAt: experience.updatedAt,
        guideProfile: experience.guideProfile
          ? {
              id: experience.guideProfile.id,
              userId: experience.guideProfile.userId,
              displayName: experience.guideProfile.displayName,
              status: experience.guideProfile.status,
              adminCommissionRate: experience.guideProfile.adminCommissionRate,
              user: experience.guideProfile.user,
            }
          : null,
        host: experience.host,
        counts: {
          bookings: experience._count.bookings,
          reviews: experience._count.reviews,
        },
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      summary,
    })
  } catch (error) {
    console.error("Admin guide experiences GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

const messagesByStatus: Record<ExperienceStatus, { title: string; message: (title: string, note?: string | null) => string }> = {
  [ExperienceStatus.DRAFT]: {
    title: "Trải nghiệm đã được cập nhật",
    message: (experienceTitle) =>
      `Trạng thái trải nghiệm "${experienceTitle}" đã được cập nhật bởi LuxeStay. Vui lòng kiểm tra chi tiết để đảm bảo thông tin chính xác.`,
  },
  [ExperienceStatus.ACTIVE]: {
    title: "Trải nghiệm đã được duyệt",
    message: (experienceTitle, note) =>
      `Trải nghiệm "${experienceTitle}" đã được kích hoạt và hiển thị cho khách hàng. ${note ? `Ghi chú từ đội LuxeStay: ${note}` : ""}`.trim(),
  },
  [ExperienceStatus.PAUSED]: {
    title: "Trải nghiệm tạm dừng",
    message: (experienceTitle, note) =>
      `Trải nghiệm "${experienceTitle}" đang được tạm dừng để rà soát chất lượng. ${note ? `Ghi chú: ${note}` : ""}`.trim(),
  },
  [ExperienceStatus.INACTIVE]: {
    title: "Trải nghiệm bị vô hiệu hóa",
    message: (experienceTitle, note) =>
      `Trải nghiệm "${experienceTitle}" chưa đủ điều kiện hoạt động. ${note ? `Lý do: ${note}` : "Vui lòng cập nhật lại thông tin theo yêu cầu."}`.trim(),
  },
}

export async function PATCH(request: NextRequest) {
  try {
    const verification = await ensureAdmin()
    if ("error" in verification) {
      return verification.error
    }

    const body = await request.json()
    const { experienceId, status, isVerified, featured, adminMessage } = body as {
      experienceId?: string
      status?: string
      isVerified?: boolean
      featured?: boolean
      adminMessage?: string | null
    }

    if (!experienceId) {
      return NextResponse.json({ error: "experienceId is required" }, { status: 400 })
    }

    const updatePayload: Prisma.ExperienceUpdateInput = {}

    if (typeof featured === "boolean") {
      updatePayload.featured = featured
    }

    if (typeof isVerified === "boolean") {
      updatePayload.isVerified = isVerified
    }

    let nextStatus: ExperienceStatus | null = null
    if (typeof status === "string") {
      const normalized = normalizeStatus(status)
      if (!normalized) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 })
      }
      updatePayload.status = normalized
      nextStatus = normalized
      if (normalized === ExperienceStatus.ACTIVE && typeof updatePayload.isVerified === "undefined") {
        updatePayload.isVerified = true
      }
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: "No changes provided" }, { status: 400 })
    }

    const experience = await prisma.experience.update({
      where: { id: experienceId },
      data: updatePayload,
      include: {
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
    })

    const note = adminMessage?.toString().trim() || null

    if (nextStatus) {
      const template = messagesByStatus[nextStatus]
      if (template) {
        const recipients = new Set<string>()
        if (experience.hostId) {
          recipients.add(experience.hostId)
        }
        if (experience.guideProfile?.userId) {
          recipients.add(experience.guideProfile.userId)
        }

        if (recipients.size > 0) {
          await Promise.all(
            Array.from(recipients).map((userId) =>
              notifyUser(userId, {
                title: template.title,
                message: template.message(experience.title, note),
                link: `/guide/experiences/${experience.id}`,
              }),
            ),
          )
        }
      }
    }

    return NextResponse.json({ experience })
  } catch (error) {
    console.error("Admin guide experiences PATCH error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
