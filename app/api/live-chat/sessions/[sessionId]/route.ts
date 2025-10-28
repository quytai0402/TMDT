import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { LiveChatStatus } from "@prisma/client"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import {
  connectLiveChatSession,
  endLiveChatSession,
  getLiveChatSession,
} from "@/lib/live-chat"
import { canAccessAdmin } from "@/lib/rbac"

const updateSchema = z.object({
  status: z.nativeEnum(LiveChatStatus),
  endedBy: z.enum(["user", "admin"]).optional(),
})

export async function GET(
  _: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await params
    const session = await getLiveChatSession(sessionId)

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    return NextResponse.json(session)
  } catch (error) {
    console.error("Failed to fetch live chat session:", error)
    return NextResponse.json({ error: "Không thể tải cuộc trò chuyện." }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await params
    const payload = updateSchema.safeParse(await req.json())

    if (!payload.success) {
      return NextResponse.json(
        { error: payload.error.issues[0]?.message ?? "Thông tin không hợp lệ" },
        { status: 400 },
      )
    }

    const session = await getLiveChatSession(sessionId)
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    const authSession = await getServerSession(authOptions)
    const isAdmin = canAccessAdmin(authSession?.user?.role)

    switch (payload.data.status) {
      case LiveChatStatus.ENDED: {
        const endedBy = payload.data.endedBy ?? (isAdmin ? "admin" : "user")
        const updated = await endLiveChatSession(sessionId, endedBy)
        return NextResponse.json(updated)
      }
      case LiveChatStatus.CONNECTED: {
        if (!isAdmin || !authSession?.user?.id) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }
        const updated = await connectLiveChatSession(sessionId, authSession.user.id)
        return NextResponse.json(updated)
      }
      default:
        return NextResponse.json(
          { error: "Không hỗ trợ cập nhật trạng thái này" },
          { status: 400 },
        )
    }
  } catch (error) {
    console.error("Failed to update live chat session:", error)
    return NextResponse.json({ error: "Không thể cập nhật cuộc trò chuyện." }, { status: 500 })
  }
}
