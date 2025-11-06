import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { isAfter } from "date-fns"
import { BookingStatus, ExperienceCategory, ExperienceStatus, Prisma } from "@prisma/client"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const COMPLETED_BOOKING_STATUSES: BookingStatus[] = [
  BookingStatus.CONFIRMED,
  BookingStatus.COMPLETED,
]

const CreateExperienceSchema = z.object({
  title: z.string().min(6, "Tiêu đề tối thiểu 6 ký tự"),
  description: z.string().min(20, "Mô tả tối thiểu 20 ký tự"),
  category: z.nativeEnum(ExperienceCategory),
  city: z.string().min(2, "Thành phố không hợp lệ"),
  state: z.string().optional().nullable(),
  location: z.string().min(4, "Địa điểm quá ngắn"),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  image: z.string().url("Ảnh bìa phải là URL hợp lệ"),
  images: z.array(z.string().url()).optional(),
  videoUrl: z.string().url().optional().nullable(),
  price: z.number().min(0),
  currency: z.string().default("VND"),
  duration: z.string().min(2),
  groupSize: z.string().min(2),
  minGuests: z.number().int().min(1),
  maxGuests: z.number().int().min(1),
  includedItems: z.array(z.string()).default([]),
  notIncluded: z.array(z.string()).default([]),
  requirements: z.array(z.string()).default([]),
  languages: z.array(z.string()).min(1),
  tags: z.array(z.string()).default([]),
  status: z.nativeEnum(ExperienceStatus).default(ExperienceStatus.DRAFT),
  isMembersOnly: z.boolean().default(false),
  featured: z.boolean().default(false),
})

type ExperienceStatusCounts = Record<ExperienceStatus, number>

type ExperienceBookingSummary = {
  total: number
  pending: number
  upcoming: number
  grossRevenue: number
  netRevenue: number
  lastBookingAt: Date | null
}

const defaultStatusCounts = (): ExperienceStatusCounts => ({
  [ExperienceStatus.DRAFT]: 0,
  [ExperienceStatus.ACTIVE]: 0,
  [ExperienceStatus.PAUSED]: 0,
  [ExperienceStatus.INACTIVE]: 0,
})

const toUniqueList = (value: string[]): string[] => {
  return Array.from(
    new Set(
      value
        .map((item) => item.trim())
        .filter((item) => item.length > 0),
    ),
  )
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!session.user.isGuide) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const guideProfile = await prisma.guideProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        status: true,
        adminCommissionRate: true,
        averageRating: true,
        totalReviews: true,
      },
    })

    if (!guideProfile) {
      return NextResponse.json({ error: "Guide profile not found" }, { status: 404 })
    }

    const search = request.nextUrl.searchParams.get("q")?.trim()
    const statusParam = request.nextUrl.searchParams.get("status")?.toUpperCase()
    const limit = Number(request.nextUrl.searchParams.get("limit") || 100)

    const ownershipCondition: Prisma.ExperienceWhereInput = {
      OR: [
        { guideProfileId: guideProfile.id },
        { guideProfileId: null, hostId: session.user.id },
      ],
    }

    const conditions: Prisma.ExperienceWhereInput[] = [ownershipCondition]

    if (statusParam && statusParam in ExperienceStatus) {
      conditions.push({ status: statusParam as ExperienceStatus })
    }

    if (search && search.length > 1) {
      conditions.push({
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { city: { contains: search, mode: "insensitive" } },
          { location: { contains: search, mode: "insensitive" } },
          { tags: { has: search.toLowerCase() } },
        ],
      })
    }

    const where: Prisma.ExperienceWhereInput =
      conditions.length > 1 ? { AND: conditions } : ownershipCondition

    const experiences = await prisma.experience.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        city: true,
        state: true,
        location: true,
        image: true,
        images: true,
        price: true,
        currency: true,
        duration: true,
        groupSize: true,
        minGuests: true,
        maxGuests: true,
        includedItems: true,
        notIncluded: true,
        requirements: true,
        languages: true,
        tags: true,
        status: true,
        isVerified: true,
        featured: true,
        isMembersOnly: true,
        totalBookings: true,
        totalReviews: true,
        averageRating: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
      take: Math.max(20, Math.min(limit, 200)),
    })

    if (experiences.length === 0) {
      return NextResponse.json({
        experiences: [],
        stats: {
          total: 0,
          statusCounts: defaultStatusCounts(),
          pendingBookings: 0,
          upcomingSessions: 0,
          grossRevenue: 0,
          netRevenue: 0,
        },
        navMetrics: {
          upcomingExperiences: 0,
          pendingBookings: 0,
          rating: guideProfile.averageRating,
        },
      })
    }

    const experienceIds = experiences.map((experience) => experience.id)

    const bookings = await prisma.experienceBooking.findMany({
      where: { experienceId: { in: experienceIds } },
      select: {
        id: true,
        experienceId: true,
        status: true,
        date: true,
        totalPrice: true,
        createdAt: true,
      },
    })

    const now = new Date()
    const statusCounts = defaultStatusCounts()
    const summaryByExperience = new Map<string, ExperienceBookingSummary>()

    let pendingBookings = 0
    let upcomingSessions = 0
    let grossRevenue = 0

    for (const experience of experiences) {
      statusCounts[experience.status] += 1
      summaryByExperience.set(experience.id, {
        total: 0,
        pending: 0,
        upcoming: 0,
        grossRevenue: 0,
        netRevenue: 0,
        lastBookingAt: null,
      })
    }

    for (const booking of bookings) {
      const summary = summaryByExperience.get(booking.experienceId)
      if (!summary) continue

      summary.total += 1
      summary.lastBookingAt = !summary.lastBookingAt || isAfter(booking.createdAt, summary.lastBookingAt)
        ? booking.createdAt
        : summary.lastBookingAt

      if (booking.status === BookingStatus.PENDING) {
        summary.pending += 1
        pendingBookings += 1
      }

      if (booking.date && isAfter(booking.date, now)) {
        summary.upcoming += 1
        upcomingSessions += 1
      }

      if (COMPLETED_BOOKING_STATUSES.includes(booking.status) && typeof booking.totalPrice === "number") {
        summary.grossRevenue += booking.totalPrice
        grossRevenue += booking.totalPrice
      }
    }

    const commissionRate = guideProfile.adminCommissionRate ?? 0.1
    const netRevenue = grossRevenue * (1 - commissionRate)

    const responseExperiences = experiences.map((experience) => {
      const summary = summaryByExperience.get(experience.id) ?? {
        total: 0,
        pending: 0,
        upcoming: 0,
        grossRevenue: 0,
        netRevenue: 0,
        lastBookingAt: null,
      }

      return {
        ...experience,
        bookingsSummary: {
          ...summary,
          netRevenue: summary.grossRevenue * (1 - commissionRate),
        },
      }
    })

    return NextResponse.json({
      experiences: responseExperiences,
      stats: {
        total: experiences.length,
        statusCounts,
        pendingBookings,
        upcomingSessions,
        grossRevenue,
        netRevenue,
      },
      navMetrics: {
        upcomingExperiences: upcomingSessions,
        pendingBookings,
        rating: guideProfile.averageRating,
      },
    })
  } catch (error) {
    console.error("Guide experiences GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!session.user.isGuide) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const guideProfile = await prisma.guideProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        status: true,
        hostUserId: true,
        adminCommissionRate: true,
      },
    })

    if (!guideProfile) {
      return NextResponse.json({ error: "Guide profile not found" }, { status: 404 })
    }

    if (guideProfile.status !== "APPROVED") {
      return NextResponse.json({
        error: "Hồ sơ hướng dẫn viên cần được duyệt trước khi tạo trải nghiệm",
      }, { status: 403 })
    }

    const json = await request.json()
    const parsed = CreateExperienceSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const payload = parsed.data

    if (payload.minGuests > payload.maxGuests) {
      return NextResponse.json({ error: "Số lượng khách tối thiểu không thể lớn hơn tối đa" }, { status: 400 })
    }

    const hostId = guideProfile.hostUserId ?? session.user.id

    const images = payload.images && payload.images.length > 0
      ? toUniqueList([payload.image, ...payload.images])
      : [payload.image]

    const experience = await prisma.experience.create({
      data: {
        hostId,
        guideProfileId: guideProfile.id,
        title: payload.title,
        description: payload.description,
        category: payload.category,
        city: payload.city,
        state: payload.state ?? undefined,
        location: payload.location,
        latitude: payload.latitude ?? undefined,
        longitude: payload.longitude ?? undefined,
        image: payload.image,
        images,
        videoUrl: payload.videoUrl ?? undefined,
        price: payload.price,
        currency: payload.currency,
        duration: payload.duration,
        groupSize: payload.groupSize,
        minGuests: payload.minGuests,
        maxGuests: payload.maxGuests,
        includedItems: toUniqueList(payload.includedItems),
        notIncluded: toUniqueList(payload.notIncluded),
        requirements: toUniqueList(payload.requirements),
        languages: toUniqueList(payload.languages),
        tags: toUniqueList(payload.tags.map((tag) => tag.toLowerCase())),
        status: payload.status,
        isMembersOnly: payload.isMembersOnly,
        featured: payload.featured,
      },
    })

    await prisma.guideProfile.update({
      where: { id: guideProfile.id },
      data: { updatedAt: new Date() },
    })

    return NextResponse.json({ experience }, { status: 201 })
  } catch (error) {
    console.error("Guide experiences POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
