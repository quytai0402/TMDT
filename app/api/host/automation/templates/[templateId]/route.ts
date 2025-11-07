import { NextRequest, NextResponse } from "next/server"
import { deleteHostMessageTemplate } from "@/lib/host/automation"
import { isAuthorizationError, requireHostSession } from "@/lib/authorization"

export async function DELETE(_: NextRequest, { params }: { params: { templateId: string } }) {
  try {
    const session = await requireHostSession()
    await deleteHostMessageTemplate(session.user.id, params.templateId)
    return NextResponse.json({ success: true })
  } catch (error) {
    if (isAuthorizationError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error("Failed to delete host message template", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
