import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import {
  appendLiveChatMessage,
  getLiveChatMessages,
  getLiveChatSession,
} from "@/lib/live-chat"
import { canAccessAdmin } from "@/lib/rbac"

const postMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, { message: "Tin nhắn không được để trống" })
    .max(2000, { message: "Tin nhắn quá dài" }),
  metadata: z.any().optional(),
})

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await params

    const searchParams = req.nextUrl.searchParams
    const sinceParam = searchParams.get("since")
    let since: Date | undefined

    if (sinceParam) {
      const parsed = new Date(sinceParam)
      if (Number.isNaN(parsed.getTime())) {
        return NextResponse.json({ error: "Thời gian không hợp lệ" }, { status: 400 })
      }
      since = parsed
    }

    const session = await getLiveChatSession(sessionId)
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    const messages = await getLiveChatMessages(sessionId, since)

    return NextResponse.json({ messages })
  } catch (error) {
    console.error("Failed to fetch live chat messages:", error)
    return NextResponse.json({ error: "Không thể tải tin nhắn." }, { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await params
    const session = await getLiveChatSession(sessionId)

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    const payload = postMessageSchema.safeParse(await req.json())
    if (!payload.success) {
      return NextResponse.json(
        { error: payload.error.issues[0]?.message ?? "Tin nhắn không hợp lệ" },
        { status: 400 },
      )
    }

    const authSession = await getServerSession(authOptions)
    const isAdmin = canAccessAdmin(authSession?.user?.role)
    const isSessionOwner = session.userId
      ? authSession?.user?.id === session.userId
      : true

    if (!isAdmin && !isSessionOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const message = await appendLiveChatMessage({
      sessionId,
      sender: isAdmin ? "admin" : "user",
      content: payload.data.content,
      metadata: payload.data.metadata,
    })

    return NextResponse.json(message)
  } catch (error) {
    console.error("Failed to append live chat message:", error)
    return NextResponse.json({ error: "Không thể gửi tin nhắn." }, { status: 500 })
  }
}
