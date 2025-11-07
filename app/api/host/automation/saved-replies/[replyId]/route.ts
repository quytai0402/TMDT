import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { deleteHostSavedReply, updateHostSavedReply } from "@/lib/host/automation"
import { z } from "zod"

const updateReplySchema = z
  .object({
    title: z.string().min(2).max(160).optional(),
    shortcut: z.string().min(2).max(40).optional(),
    content: z.string().min(5).optional(),
    tags: z.array(z.string()).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Không có dữ liệu cần cập nhật",
  })

export async function PATCH(req: NextRequest, { params }: { params: { replyId: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!(session.user.isHost || session.user.role === "HOST")) {
      return NextResponse.json({ error: "Host access required" }, { status: 403 })
    }

    const body = await req.json()
    const payload = updateReplySchema.parse(body)
    const reply = await updateHostSavedReply(session.user.id, params.replyId, payload)
    return NextResponse.json({ reply })
  } catch (error) {
    console.error("Failed to update saved reply", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Invalid data" }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { replyId: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!(session.user.isHost || session.user.role === "HOST")) {
      return NextResponse.json({ error: "Host access required" }, { status: 403 })
    }

    await deleteHostSavedReply(session.user.id, params.replyId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete saved reply", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
