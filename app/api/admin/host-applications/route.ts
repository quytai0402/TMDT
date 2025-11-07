import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notifyUser } from "@/lib/notifications"
import { HostApplicationStatus, NotificationType, UserRole, UserStatus } from "@prisma/client"
import { sendHostApplicationStatusEmail } from "@/lib/email"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const statusFilter = request.nextUrl.searchParams.get("status")

    // First, find all applications
    const allApplications = await prisma.hostApplication.findMany({
      where: statusFilter ? { status: statusFilter as HostApplicationStatus } : {},
      orderBy: { createdAt: "desc" },
    })

    console.log(`[Admin Host Applications] Found ${allApplications.length} total applications`)

    // Get all user IDs
    const userIds = allApplications.map(app => app.userId)
    
    // Find existing users
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds }
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        role: true,
        isVerified: true,
      }
    })

    // Create a map of users by ID
    const userMap = new Map(users.map(u => [u.id, u]))

    // Filter applications that have valid users and attach user data
    const validApplications = allApplications
      .filter(app => userMap.has(app.userId))
      .map(app => ({
        ...app,
        user: userMap.get(app.userId)!
      }))

    console.log(`[Admin Host Applications] Applications with users: ${validApplications.length}`)
    console.log(`[Admin Host Applications] Orphaned applications: ${allApplications.length - validApplications.length}`)

    // Delete orphaned applications in the background (don't wait)
    const orphanedIds = allApplications
      .filter(app => !userMap.has(app.userId))
      .map(app => app.id)
    
    if (orphanedIds.length > 0) {
      prisma.hostApplication.deleteMany({
        where: { id: { in: orphanedIds } }
      }).then(() => {
        console.log(`[Admin Host Applications] Cleaned up ${orphanedIds.length} orphaned applications`)
      }).catch(err => {
        console.error('[Admin Host Applications] Failed to cleanup orphaned applications:', err)
      })
    }

    return NextResponse.json({ applications: validApplications })
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

        await notifyUser(updatedApplication.userId, {
          type: NotificationType.SYSTEM,
          title: "Hồ sơ host đã được duyệt",
          message:
            adminNotes && adminNotes.length > 0
              ? `Admin đã duyệt hồ sơ của bạn. Ghi chú: ${adminNotes}`
              : "Admin đã duyệt hồ sơ host của bạn. Bạn có thể bắt đầu đăng listings ngay.",
          link: "/host/dashboard",
          data: {
            applicationId,
            status: HostApplicationStatus.APPROVED,
          },
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

      await notifyUser(rejectedApplication.userId, {
        type: NotificationType.SYSTEM,
        title: "Hồ sơ host bị từ chối",
        message:
          adminNotes && adminNotes.length > 0
            ? `Rất tiếc, hồ sơ của bạn chưa đạt yêu cầu. Lý do: ${adminNotes}`
            : "Rất tiếc, hồ sơ của bạn chưa đáp ứng tiêu chí xét duyệt. Vui lòng cập nhật và gửi lại sau.",
        link: "/become-host",
        data: {
          applicationId,
          status: HostApplicationStatus.REJECTED,
        },
      })

      return { application: rejectedApplication }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Admin host applications PATCH error:", error)
    return NextResponse.json({ error: (error as Error).message || "Internal server error" }, { status: 500 })
  }
}
