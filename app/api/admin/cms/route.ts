import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { ensureCmsDefaults, getCmsData, saveCmsData } from "@/lib/cms"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await ensureCmsDefaults()

    const data = await getCmsData()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Admin CMS GET error:", error)
    return NextResponse.json({ error: "Failed to load CMS content" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await request.json()
    await saveCmsData(payload, session.user.id)

    const data = await getCmsData()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Admin CMS PUT error:", error)
    return NextResponse.json({ error: "Failed to update CMS content" }, { status: 500 })
  }
}
