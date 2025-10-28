import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import {
  connectLiveChatSession,
  endLiveChatSession,
  getLiveChatSession,
} from "@/lib/live-chat"
import { canAccessAdmin } from "@/lib/rbac"

const adminActionSchema = z.object({
  action: z.enum(["connect", "end"]),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const session = await getServerSession(authOptions)

    if (!canAccessAdmin(session?.user?.role) || !session?.user?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { sessionId } = await params
    const payload = adminActionSchema.safeParse(await req.json())

    if (!payload.success) {
      return NextResponse.json(
        { error: payload.error.issues[0]?.message ?? "Thông tin không hợp lệ" },
        { status: 400 },
      )
    }

    const chatSession = await getLiveChatSession(sessionId)
    if (!chatSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    if (payload.data.action === "connect") {
      const updated = await connectLiveChatSession(sessionId, session.user.id)
      return NextResponse.json(updated)
    }

    const updated = await endLiveChatSession(sessionId, "admin")
    return NextResponse.json(updated)
  } catch (error) {
    console.error("Failed to run admin live chat action:", error)
    return NextResponse.json({ error: "Không thể cập nhật chat." }, { status: 500 })
  }
}
