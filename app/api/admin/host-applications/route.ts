import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { HostApplicationStatus, UserRole, UserStatus } from "@prisma/client"
import { sendHostApplicationStatusEmail } from "@/lib/email"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const statusFilter = request.nextUrl.searchParams.get("status")

    const applications = await prisma.hostApplication.findMany({
      where: statusFilter ? { status: statusFilter as HostApplicationStatus } : {},
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
            role: true,
            isVerified: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    })

    return NextResponse.json({ applications })
  } catch (error) {
    console.error("Admin host applications GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const applicationId = String(body?.applicationId || "")
    const action = String(body?.action || "").toUpperCase()
    const adminNotes = typeof body?.adminNotes === "string" ? body.adminNotes.trim() : undefined

    if (!applicationId || !["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      const application = await tx.hostApplication.findUnique({
        where: { id: applicationId },
        include: { user: true },
      })

      if (!application) {
        throw new Error("Host application not found")
      }

      if (action === "APPROVE") {
        const updatedApplication = await tx.hostApplication.update({
          where: { id: applicationId },
          data: {
            status: HostApplicationStatus.APPROVED,
            adminNotes,
            reviewedAt: new Date(),
          },
          include: { user: true },
        })

        const hostProfile = await tx.hostProfile.upsert({
          where: { userId: updatedApplication.userId },
          create: {
            userId: updatedApplication.userId,
            primaryLocationSlug: updatedApplication.locationSlug,
            primaryLocationName: updatedApplication.locationName,
          },
          update: {
            primaryLocationSlug: updatedApplication.locationSlug,
            primaryLocationName: updatedApplication.locationName,
          },
        })

        await tx.user.update({
          where: { id: updatedApplication.userId },
          data: {
            role: UserRole.HOST,
            isHost: true,
            isVerified: true,
            status: UserStatus.ACTIVE,
          },
        })

        await sendHostApplicationStatusEmail({
          email: updatedApplication.user.email ?? undefined,
          name: updatedApplication.user.name ?? "Host",
          status: "approved",
          locationName: updatedApplication.locationName,
          notes: adminNotes,
        })

        return { application: updatedApplication, hostProfile }
      }

      const rejectedApplication = await tx.hostApplication.update({
        where: { id: applicationId },
        data: {
          status: HostApplicationStatus.REJECTED,
          adminNotes,
          reviewedAt: new Date(),
        },
        include: { user: true },
      })

      await sendHostApplicationStatusEmail({
        email: rejectedApplication.user.email ?? undefined,
        name: rejectedApplication.user.name ?? "Host",
        status: "rejected",
        locationName: rejectedApplication.locationName,
        notes: adminNotes,
      })

      return { application: rejectedApplication }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Admin host applications PATCH error:", error)
    return NextResponse.json({ error: (error as Error).message || "Internal server error" }, { status: 500 })
  }
}
