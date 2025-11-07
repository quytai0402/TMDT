import { NextResponse } from "next/server"
import { getHostScheduledMessages } from "@/lib/host/automation"
import { isAuthorizationError, requireHostSession } from "@/lib/authorization"

export async function GET() {
  try {
    const session = await requireHostSession()
    const messages = await getHostScheduledMessages(session.user.id)
    return NextResponse.json({ messages })
  } catch (error) {
    if (isAuthorizationError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error("Failed to load scheduled messages", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
