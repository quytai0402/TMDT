import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { toggleScheduledMessageStatus } from "@/lib/host/automation"

export async function PATCH(_: NextRequest, { params }: { params: { messageId: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!(session.user.isHost || session.user.role === "HOST")) {
      return NextResponse.json({ error: "Host access required" }, { status: 403 })
    }

    const message = await toggleScheduledMessageStatus(session.user.id, params.messageId)
    return NextResponse.json({ message })
  } catch (error) {
    console.error("Failed to update scheduled message", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
