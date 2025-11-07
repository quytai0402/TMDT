import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptions } from "@/lib/auth"
import {
  createHostMessageTemplate,
  duplicateHostMessageTemplate,
  getHostMessageTemplates,
} from "@/lib/host/automation"
import { AutomationTemplateCategory } from "@prisma/client"

const createTemplateSchema = z.object({
  name: z.string().min(2).max(120),
  category: z.nativeEnum(AutomationTemplateCategory),
  subject: z.string().max(160).optional(),
  content: z.string().min(10),
})

const duplicateSchema = z.object({
  sourceTemplateId: z.string(),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!(session.user.isHost || session.user.role === "HOST")) {
      return NextResponse.json({ error: "Host access required" }, { status: 403 })
    }

    const templates = await getHostMessageTemplates(session.user.id)
    return NextResponse.json({ templates })
  } catch (error) {
    console.error("Failed to load host message templates", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!(session.user.isHost || session.user.role === "HOST")) {
      return NextResponse.json({ error: "Host access required" }, { status: 403 })
    }

    const body = await req.json()

    if (body?.sourceTemplateId) {
      const { sourceTemplateId } = duplicateSchema.parse(body)
      const template = await duplicateHostMessageTemplate(session.user.id, sourceTemplateId)
      return NextResponse.json({ template }, { status: 201 })
    }

    const payload = createTemplateSchema.parse(body)
    const template = await createHostMessageTemplate(session.user.id, payload)
    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    console.error("Failed to create host message template", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Invalid data" }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
