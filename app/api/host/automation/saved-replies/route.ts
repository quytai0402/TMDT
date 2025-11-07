import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import {
  createHostSavedReply,
  duplicateHostSavedReply,
  getHostSavedReplies,
} from "@/lib/host/automation"
import { isAuthorizationError, requireHostSession } from "@/lib/authorization"

const createReplySchema = z.object({
  title: z.string().min(2).max(160),
  shortcut: z.string().min(2).max(40),
  content: z.string().min(5),
  tags: z.array(z.string()).optional(),
})

const duplicateSchema = z.object({
  sourceReplyId: z.string(),
})

export async function GET() {
  try {
    const session = await requireHostSession()
    const replies = await getHostSavedReplies(session.user.id)
    return NextResponse.json({ replies })
  } catch (error) {
    if (isAuthorizationError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error("Failed to load host saved replies", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireHostSession()
    const body = await req.json()

    if (body?.sourceReplyId) {
      const { sourceReplyId } = duplicateSchema.parse(body)
      const reply = await duplicateHostSavedReply(session.user.id, sourceReplyId)
      return NextResponse.json({ reply }, { status: 201 })
    }

    const payload = createReplySchema.parse(body)
    const reply = await createHostSavedReply(session.user.id, payload)
    return NextResponse.json({ reply }, { status: 201 })
  } catch (error) {
    if (isAuthorizationError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error("Failed to create saved reply", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Invalid data" }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
