import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import {
  createLiveChatSession,
  getLiveChatSession,
} from "@/lib/live-chat"

const createSessionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Vui lòng nhập tên của bạn" })
    .max(120, { message: "Tên quá dài" })
    .optional(),
  email: z.string().trim().email({ message: "Email không hợp lệ" }).optional(),
  sessionId: z.string().trim().optional(),
  metadata: z.any().optional(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const payload = createSessionSchema.safeParse(body || {})

    if (!payload.success) {
      return NextResponse.json(
        { error: payload.error.issues[0]?.message ?? "Thông tin không hợp lệ" },
        { status: 400 },
      )
    }

    const session = await getServerSession(authOptions)

    if (payload.data.sessionId) {
      const existing = await getLiveChatSession(payload.data.sessionId)
      if (existing) {
        return NextResponse.json(existing)
      }
    }

    const created = await createLiveChatSession({
      userId: session?.user?.id,
      userName: session?.user?.name ?? payload.data.name,
      userEmail: session?.user?.email ?? payload.data.email,
      metadata: payload.data.metadata,
    })

    return NextResponse.json(created)
  } catch (error) {
    console.error("Failed to create live chat session:", error)
    return NextResponse.json(
      { error: "Không thể khởi tạo cuộc trò chuyện. Vui lòng thử lại." },
      { status: 500 },
    )
  }
}
