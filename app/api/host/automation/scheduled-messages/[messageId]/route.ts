import { NextRequest, NextResponse } from "next/server"
import { toggleScheduledMessageStatus } from "@/lib/host/automation"
import { isAuthorizationError, requireHostSession } from "@/lib/authorization"

export async function PATCH(_: NextRequest, { params }: { params: { messageId: string } }) {
  try {
    const session = await requireHostSession()
    const message = await toggleScheduledMessageStatus(session.user.id, params.messageId)
    return NextResponse.json({ message })
  } catch (error) {
    if (isAuthorizationError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error("Failed to update scheduled message", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
