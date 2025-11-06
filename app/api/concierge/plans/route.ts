import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const planSegmentSchema = z.object({
  id: z.string(),
  type: z.enum(["primary", "gap"]),
  startDate: z.string(),
  endDate: z.string(),
  nights: z.number().min(1),
  estimatedTotal: z.number().optional(),
  conflicts: z
    .array(
      z.object({
        type: z.enum(["booking", "blocked"]),
        range: z.object({
          startDate: z.string(),
          endDate: z.string(),
        }),
        note: z.string().nullable().optional(),
      }),
    )
    .optional(),
  alternatives: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        slug: z.string().optional(),
        image: z.string().nullable().optional(),
        city: z.string(),
        state: z.string().nullable().optional(),
        country: z.string(),
        basePrice: z.number(),
        estimatedTotal: z.number(),
        priceDifference: z.number(),
        distanceKm: z.number().nullable().optional(),
      }),
    )
    .optional(),
})

const conciergePlanSchema = z.object({
  bookingId: z.string().optional(),
  listingId: z.string(),
  loyaltyOffer: z.string().optional(),
  guestNotes: z.string().optional(),
  hostNotes: z.string().optional(),
  conciergeNotes: z.string().optional(),
  segments: z.array(planSegmentSchema).min(1),
  selectedAlternatives: z.record(z.string()).optional(),
})

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(req.url)
    const bookingId = searchParams.get("bookingId")
    const listingId = searchParams.get("listingId")

    if (!session?.user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 })
    }

    const membershipTier = session.user.membership ?? null
    const userRole = session.user.role
    const hasConciergePrivileges = userRole && userRole !== "GUEST" ? true : membershipTier === "DIAMOND"

    if (!hasConciergePrivileges) {
      return NextResponse.json(
        { error: "Concierge chỉ dành cho thành viên Diamond" },
        { status: 403 },
      )
    }

    if (!bookingId && !listingId) {
      return NextResponse.json(
        { error: "Vui lòng cung cấp bookingId hoặc listingId" },
        { status: 400 },
      )
    }

    const whereClause: any = {}
    if (bookingId) {
      whereClause.bookingId = bookingId
    }
    if (listingId) {
      whereClause.listingId = listingId
    }
    if (session?.user?.id) {
      whereClause.OR = [
        { guestId: session.user.id },
        { conciergeAgentId: session.user.id },
        { hostId: session.user.id },
      ]
    }

    const plans = await prisma.conciergePlan.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: 5,
    })

    return NextResponse.json({ plans })
  } catch (error) {
    console.error("Concierge plan fetch error:", error)
    return NextResponse.json({ error: "Không thể tải concierge plan" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 })
    }

    const membershipTier = session.user.membership ?? null
    const userRole = session.user.role
    const hasConciergePrivileges = userRole && userRole !== "GUEST" ? true : membershipTier === "DIAMOND"

    if (!hasConciergePrivileges) {
      return NextResponse.json(
        { error: "Concierge chỉ dành cho thành viên Diamond" },
        { status: 403 },
      )
    }

    const body = await req.json()
    const payload = conciergePlanSchema.parse(body)

    const listing = await prisma.listing.findUnique({
      where: { id: payload.listingId },
      select: {
        id: true,
        hostId: true,
        title: true,
        basePrice: true,
        cleaningFee: true,
        city: true,
        state: true,
        country: true,
      },
    })

    if (!listing) {
      return NextResponse.json({ error: "Không tìm thấy chỗ ở" }, { status: 404 })
    }

    const selectedAlternativeIds = Object.values(payload.selectedAlternatives ?? {}).filter(Boolean)
    const partnerListings =
      selectedAlternativeIds.length > 0
        ? await prisma.listing.findMany({
            where: { id: { in: selectedAlternativeIds } },
            select: {
              id: true,
              title: true,
              hostId: true,
              city: true,
              state: true,
              country: true,
              basePrice: true,
              cleaningFee: true,
              status: true,
            },
          })
        : []

    const partnerInfo = partnerListings.map((partner) => ({
      id: partner.id,
      title: partner.title,
      location: [partner.city, partner.state, partner.country].filter(Boolean).join(", "),
      basePrice: partner.basePrice,
      cleaningFee: partner.cleaningFee,
      status: partner.status,
      sameHost: partner.hostId === listing.hostId,
    }))

    const requestedNights = payload.segments.reduce((sum, segment) => sum + segment.nights, 0)
    const primarySegments = payload.segments.filter((segment) => segment.type === "primary")
    const gapSegments = payload.segments.filter((segment) => segment.type === "gap")

    const defaultHostNotes = [
      `Khách mong muốn lưu trú từ ${primarySegments[0]?.startDate} đến ${
        primarySegments[primarySegments.length - 1]?.endDate
      } tại ${listing.title}.`,
      gapSegments.length > 0
        ? `Có ${gapSegments.length} đêm trùng lịch cần hỗ trợ chuyển phòng: ${gapSegments
            .map((segment) => `${segment.startDate} → ${segment.endDate}`)
            .join(", ")}.`
        : null,
      partnerListings.length > 0
        ? `Đề xuất chuyển sang đối tác: ${partnerListings
            .map((partner) => partner.title)
            .join(", ")}`
        : null,
      `Tổng số đêm: ${requestedNights}.`,
    ]
      .filter(Boolean)
      .join(" ")

    const guestNotes = payload.guestNotes?.trim() || undefined
    const hostNotes = payload.hostNotes?.trim() || defaultHostNotes
    const loyaltyOffer =
      payload.loyaltyOffer?.trim() ||
      (gapSegments.length > 0
        ? "Tặng nâng hạng phòng/ưu đãi quay lại cho đêm tiếp theo khi khách trở về."
        : undefined)

    const conciergePlan = await prisma.conciergePlan.create({
      data: {
        bookingId: payload.bookingId,
        listingId: payload.listingId,
        guestId: session?.user?.id ?? null,
        hostId: listing.hostId,
        planDetails: {
          segments: payload.segments,
          selectedAlternatives: payload.selectedAlternatives ?? {},
          generatedAt: new Date().toISOString(),
        },
        loyaltyOffer,
        partnerInfo: partnerInfo.length > 0 ? partnerInfo : undefined,
        hostNotes,
        guestNotes,
      },
    })

    return NextResponse.json({ plan: conciergePlan }, { status: 201 })
  } catch (error) {
    console.error("Concierge plan create error:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: "Không thể tạo concierge plan" }, { status: 500 })
  }
}
