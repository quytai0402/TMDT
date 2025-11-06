import { randomUUID } from "crypto"
import { z } from "zod"

export const plannerItemSchema = z.object({
  title: z.string().min(1, "Tiêu đề không được để trống"),
  location: z.string().min(1, "Vị trí không được để trống"),
  type: z
    .enum(["accommodation", "dining", "activity", "shopping", "sightseeing"])
    .default("activity"),
  day: z.number().int().min(1).optional(),
  time: z
    .string()
    .regex(/^\d{2}:\d{2}$/u, "Thời gian phải theo định dạng HH:MM")
    .optional(),
  date: z.string().optional(),
  notes: z.string().max(500).optional(),
  duration: z.string().max(100).optional(),
  cost: z.number().min(0).max(1000000000).optional(),
  suggestionId: z.string().optional(),
})

export type PlannerItemInput = z.infer<typeof plannerItemSchema>

export type StoredPlannerItem = ReturnType<typeof normalizePlannerItem>

export function diffDaysInclusive(checkIn: Date, target?: string | null) {
  if (!target) return 1
  const parsed = new Date(target)
  if (Number.isNaN(parsed.getTime())) return 1
  const startMidnight = new Date(checkIn)
  startMidnight.setHours(0, 0, 0, 0)
  const targetMidnight = new Date(parsed)
  targetMidnight.setHours(0, 0, 0, 0)
  const diffMs = targetMidnight.getTime() - startMidnight.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  return Math.max(1, diffDays + 1)
}

export function extractPlanner(metadata: unknown) {
  if (!metadata || typeof metadata !== "object") {
    return { items: [], lastUpdated: null as string | null }
  }

  const record = metadata as Record<string, unknown>
  const planner = record.tripPlanner

  if (!planner || typeof planner !== "object") {
    return { items: [], lastUpdated: null as string | null }
  }

  const plannerRecord = planner as Record<string, unknown>
  const items = Array.isArray(plannerRecord.items) ? plannerRecord.items : []
  const lastUpdated =
    typeof plannerRecord.lastUpdated === "string" ? plannerRecord.lastUpdated : null

  return {
    items: items as unknown[],
    lastUpdated,
  }
}

export function cloneMetadata(metadata: unknown) {
  if (!metadata || typeof metadata !== "object") {
    return {}
  }

  return JSON.parse(JSON.stringify(metadata)) as Record<string, unknown>
}

export function normalizePlannerItem(input: PlannerItemInput, booking: { checkIn: Date }) {
  const nowIso = new Date().toISOString()
  const day = input.day ?? diffDaysInclusive(booking.checkIn, input.date)

  return {
    id: `planner-${randomUUID()}`,
    day,
    time: input.time ?? "10:00",
    type: input.type,
    title: input.title,
    location: input.location,
    notes: input.notes ?? null,
    duration: input.duration ?? null,
    cost: input.cost ?? null,
    suggestionId: input.suggestionId ?? null,
    createdAt: nowIso,
    updatedAt: nowIso,
  }
}
