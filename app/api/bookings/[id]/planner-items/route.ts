import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import type { Prisma } from "@prisma/client"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  plannerItemSchema,
  extractPlanner,
  cloneMetadata,
  normalizePlannerItem,
} from "./utils"

type BookingParams = {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, { params }: BookingParams) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      select: {
        id: true,
        guestId: true,
        hostId: true,
        metadata: true,
      },
    })

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    const userId = session.user.id
    const role = session.user.role
    const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN"
    const isGuest = booking.guestId === userId
    const isHost = booking.hostId === userId

    if (!isAdmin && !isGuest && !isHost) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const planner = extractPlanner(booking.metadata)

    return NextResponse.json({
      items: planner.items,
      lastUpdated: planner.lastUpdated,
    })
  } catch (error) {
    console.error("Planner items fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: BookingParams) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      select: {
        id: true,
        guestId: true,
        hostId: true,
        checkIn: true,
        checkOut: true,
        metadata: true,
      },
    })

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    const userId = session.user.id
    const role = session.user.role
    const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN"
    const isGuest = booking.guestId === userId
    const isHost = booking.hostId === userId

    if (!isAdmin && !isGuest && !isHost) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const payloadJson = await request.json().catch(() => ({}))
    const parsed = plannerItemSchema.safeParse(payloadJson)

    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      return NextResponse.json(
        { error: issue?.message ?? "Dữ liệu không hợp lệ" },
        { status: 400 },
      )
    }

    const plannerItem = normalizePlannerItem(parsed.data, booking)
    const metadata = cloneMetadata(booking.metadata)
    const existingPlanner =
      metadata.tripPlanner && typeof metadata.tripPlanner === "object"
        ? (metadata.tripPlanner as Record<string, unknown>)
        : {}

    const items = Array.isArray(existingPlanner.items)
      ? [...existingPlanner.items, plannerItem]
      : [plannerItem]

    const nowIso = new Date().toISOString()

    metadata.tripPlanner = {
      ...existingPlanner,
      items,
      lastUpdated: nowIso,
    }

    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        metadata: metadata as Prisma.JsonValue,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      item: plannerItem,
      items,
      lastUpdated: nowIso,
    })
  } catch (error) {
    console.error("Planner item create error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
