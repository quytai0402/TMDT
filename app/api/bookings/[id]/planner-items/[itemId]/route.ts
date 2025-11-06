import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import type { Prisma } from "@prisma/client"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  plannerItemSchema,
  cloneMetadata,
  extractPlanner,
  diffDaysInclusive,
} from "../utils"

const updateSchema = plannerItemSchema
  .partial()
  .extend({
    cost: z.number().min(0).max(1000000000).nullable().optional(),
  })
  .refine((payload) => Object.values(payload).some((value) => value !== undefined), {
    message: "Không có dữ liệu để cập nhật",
  })

type RouteParams = {
  params: Promise<{ id: string; itemId: string }>
}

type MinimalSession = {
  user?: {
    id?: string | null
    role?: string | null
  } | null
} | null

async function resolveBooking(id: string) {
  return prisma.booking.findUnique({
    where: { id },
    select: {
      id: true,
      guestId: true,
      hostId: true,
      checkIn: true,
      metadata: true,
    },
  })
}

function assertAccess(
  booking: NonNullable<Awaited<ReturnType<typeof resolveBooking>>>,
  session: MinimalSession
) {
  const sessionUser = session?.user
  if (!sessionUser?.id) {
    return { allowed: false, status: 401 as const }
  }

  const userId = sessionUser.id
  const role = sessionUser.role
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN"
  const isGuest = booking.guestId === userId
  const isHost = booking.hostId === userId

  if (!isAdmin && !isGuest && !isHost) {
    return { allowed: false, status: 403 as const }
  }

  return { allowed: true, status: 200 as const }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, itemId } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const booking = await resolveBooking(id)

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    const access = assertAccess(booking, session)
    if (!access.allowed) {
      return NextResponse.json({ error: access.status === 401 ? "Unauthorized" : "Forbidden" }, { status: access.status })
    }

    const payloadJson = await request.json().catch(() => ({}))
    const parsed = updateSchema.safeParse(payloadJson)

    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      return NextResponse.json(
        { error: issue?.message ?? "Dữ liệu không hợp lệ" },
        { status: 400 },
      )
    }

    const metadata = cloneMetadata(booking.metadata)
    const planner = metadata.tripPlanner && typeof metadata.tripPlanner === "object"
      ? (metadata.tripPlanner as Record<string, unknown>)
      : {}

    const items = Array.isArray(planner.items) ? [...planner.items] : []
    const itemIndex = items.findIndex((item: any) => item?.id === itemId)

    if (itemIndex === -1) {
      return NextResponse.json({ error: "Planner item not found" }, { status: 404 })
    }

    const existing = items[itemIndex] as Record<string, any>
    const updates = parsed.data
    const nowIso = new Date().toISOString()

    const resolvedDay = updates.day
      ?? (updates.date ? diffDaysInclusive(booking.checkIn, updates.date) : existing.day)

    items[itemIndex] = {
      ...existing,
      day: resolvedDay ?? existing.day ?? 1,
      time: updates.time ?? existing.time ?? "10:00",
      type: updates.type ?? existing.type ?? "activity",
      title: updates.title ?? existing.title ?? "Hoạt động",
      location: updates.location ?? existing.location ?? "",
      notes: updates.notes ?? existing.notes ?? null,
      duration: updates.duration ?? existing.duration ?? null,
      cost:
        updates.cost !== undefined
          ? updates.cost
          : existing.cost ?? null,
      suggestionId: updates.suggestionId ?? existing.suggestionId ?? null,
      updatedAt: nowIso,
    }

    metadata.tripPlanner = {
      ...planner,
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

    const updatedItem = items[itemIndex]

    return NextResponse.json({
      item: updatedItem,
      items,
      lastUpdated: nowIso,
    })
  } catch (error) {
    console.error("Planner item update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id, itemId } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const booking = await resolveBooking(id)

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    const access = assertAccess(booking, session)
    if (!access.allowed) {
      return NextResponse.json({ error: access.status === 401 ? "Unauthorized" : "Forbidden" }, { status: access.status })
    }

    const metadata = cloneMetadata(booking.metadata)
    const planner = metadata.tripPlanner && typeof metadata.tripPlanner === "object"
      ? (metadata.tripPlanner as Record<string, unknown>)
      : {}

    const items = Array.isArray(planner.items) ? planner.items.filter((item: any) => item?.id !== itemId) : []

    if (Array.isArray(planner.items) && planner.items.length === items.length) {
      return NextResponse.json({ error: "Planner item not found" }, { status: 404 })
    }

    const nowIso = new Date().toISOString()

    metadata.tripPlanner = {
      ...planner,
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
      success: true,
      items,
      lastUpdated: nowIso,
    })
  } catch (error) {
    console.error("Planner item delete error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
