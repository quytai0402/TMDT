import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { LiveChatStatus } from "@prisma/client"

import { authOptions } from "@/lib/auth"
import { listLiveChatSessions } from "@/lib/live-chat"
import { canAccessAdmin } from "@/lib/rbac"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!canAccessAdmin(session?.user?.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const statusParam = req.nextUrl.searchParams.get("status")
    const status = statusParam && statusParam in LiveChatStatus ? (statusParam as LiveChatStatus) : undefined

    const [sessions, counts] = await Promise.all([
      listLiveChatSessions(status),
      prisma.liveChatSession.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
    ])

    const summary = Object.values(LiveChatStatus).reduce<Record<string, number>>((acc, current) => {
      acc[current] =
        counts.find((item) => item.status === current)?._count.status ?? 0
      return acc
    }, {})

    return NextResponse.json({
      sessions,
      summary,
    })
  } catch (error) {
    console.error("Failed to load admin live chat sessions:", error)
    return NextResponse.json({ error: "Không thể tải danh sách chat." }, { status: 500 })
  }
}
