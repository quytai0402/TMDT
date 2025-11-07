import { NextRequest, NextResponse } from "next/server"
import { deleteHostSavedReply, updateHostSavedReply } from "@/lib/host/automation"
import { z } from "zod"
import { isAuthorizationError, requireHostSession } from "@/lib/authorization"

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
    const session = await requireHostSession()
    const body = await req.json()
    const payload = updateReplySchema.parse(body)
    const reply = await updateHostSavedReply(session.user.id, params.replyId, payload)
    return NextResponse.json({ reply })
  } catch (error) {
    if (isAuthorizationError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error("Failed to update saved reply", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Invalid data" }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { replyId: string } }) {
  try {
    const session = await requireHostSession()
    await deleteHostSavedReply(session.user.id, params.replyId)
    return NextResponse.json({ success: true })
  } catch (error) {
    if (isAuthorizationError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error("Failed to delete saved reply", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
