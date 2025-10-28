import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import {
  ensureSystemSettingsDefaults,
  getSystemSettings,
  saveSystemSettings,
} from "@/lib/settings"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await ensureSystemSettingsDefaults()
    const settings = await getSystemSettings()
    return NextResponse.json(settings)
  } catch (error) {
    console.error("Admin settings GET error:", error)
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await request.json()
    await saveSystemSettings(payload, session.user.id)

    const settings = await getSystemSettings()
    return NextResponse.json(settings)
  } catch (error) {
    console.error("Admin settings PUT error:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
