import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptions } from "@/lib/auth"
import {
  createHostSavedReply,
  duplicateHostSavedReply,
  getHostSavedReplies,
} from "@/lib/host/automation"

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
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!(session.user.isHost || session.user.role === "HOST")) {
      return NextResponse.json({ error: "Host access required" }, { status: 403 })
    }

    const replies = await getHostSavedReplies(session.user.id)
    return NextResponse.json({ replies })
  } catch (error) {
    console.error("Failed to load host saved replies", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!(session.user.isHost || session.user.role === "HOST")) {
      return NextResponse.json({ error: "Host access required" }, { status: 403 })
    }

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
    console.error("Failed to create saved reply", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Invalid data" }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
