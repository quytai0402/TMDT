import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { HostApplicationStatus, UserRole, UserStatus } from "@prisma/client"

const hostApplicationSchema = z.object({
  locationSlug: z.string().min(1),
  locationName: z.string().min(1),
  introduction: z.string().max(2000).optional(),
  experience: z.string().max(2000).optional(),
  maintenanceAcknowledged: z.boolean().refine((val) => val === true, {
    message: "Bạn cần đồng ý với chi phí duy trì và lệ phí nền tảng",
  }),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const application = await prisma.hostApplication.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ application })
  } catch (error) {
    console.error("Host application GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role === "HOST") {
      return NextResponse.json({ error: "Bạn đã là host trên hệ thống" }, { status: 400 })
    }

    const body = await request.json()
    const payload = hostApplicationSchema.parse(body)

    const existingHost = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isHost: true, role: true },
    })

    if (existingHost?.isHost || existingHost?.role === UserRole.HOST) {
      return NextResponse.json({ error: "Bạn đã được kích hoạt quyền host" }, { status: 400 })
    }

    const existingApplication = await prisma.hostApplication.findFirst({
      where: {
        userId: session.user.id,
        status: { in: [HostApplicationStatus.PENDING, HostApplicationStatus.APPROVED] },
      },
    })

    if (existingApplication && existingApplication.status === HostApplicationStatus.PENDING) {
      const updated = await prisma.hostApplication.update({
        where: { id: existingApplication.id },
        data: {
          locationSlug: payload.locationSlug,
          locationName: payload.locationName,
          introduction: payload.introduction,
          experience: payload.experience,
          maintenanceAcknowledged: payload.maintenanceAcknowledged,
          status: HostApplicationStatus.PENDING,
          reviewedAt: null,
          adminNotes: null,
        },
      })

      return NextResponse.json({ application: updated })
    }

    const application = await prisma.hostApplication.create({
      data: {
        userId: session.user.id,
        locationSlug: payload.locationSlug,
        locationName: payload.locationName,
        introduction: payload.introduction,
        experience: payload.experience,
        maintenanceAcknowledged: payload.maintenanceAcknowledged,
        status: HostApplicationStatus.PENDING,
      },
    })

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        status: UserStatus.ACTIVE,
      },
    })

    return NextResponse.json({ application })
  } catch (error) {
    console.error("Host application POST error:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message ?? "Invalid payload" }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
