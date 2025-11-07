import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { deleteHostMessageTemplate } from "@/lib/host/automation"

export async function DELETE(_: NextRequest, { params }: { params: { templateId: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!(session.user.isHost || session.user.role === "HOST")) {
      return NextResponse.json({ error: "Host access required" }, { status: 403 })
    }

    await deleteHostMessageTemplate(session.user.id, params.templateId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete host message template", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
