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
  paymentReference: z
    .string()
    .min(6, "Mã tham chiếu không hợp lệ")
    .max(64, "Mã tham chiếu quá dài")
    .optional(),
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

    // If user doesn't exist, session is stale
    if (!existingHost) {
      return NextResponse.json({ 
        error: "Phiên đăng nhập đã hết hạn. Vui lòng đăng xuất và đăng nhập lại." 
      }, { status: 401 })
    }

    if (existingHost.isHost || existingHost.role === UserRole.HOST) {
      return NextResponse.json({ error: "Bạn đã được kích hoạt quyền host" }, { status: 400 })
    }

    const existingApplication = await prisma.hostApplication.findFirst({
      where: {
        userId: session.user.id,
        status: { in: [HostApplicationStatus.PENDING, HostApplicationStatus.APPROVED] },
      },
    })

    const paymentReference = payload.paymentReference?.trim() || null

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
          paymentReference,
        },
      })

      // Tạo notification cho admin về đơn đã cập nhật
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, email: true },
      })

      const admins = await prisma.user.findMany({
        where: { role: UserRole.ADMIN },
        select: { id: true },
      })

      if (admins.length > 0) {
        await prisma.notification.createMany({
          data: admins.map((admin) => ({
            userId: admin.id,
            type: 'SYSTEM',
            title: 'Đơn đăng ký host đã cập nhật',
            message: `${user?.name || user?.email || 'Người dùng'} đã cập nhật đơn đăng ký host tại ${payload.locationName}. Mã tham chiếu: ${paymentReference || 'Chưa cập nhật'}`,
            link: `/admin/hosts/applications`,
            isRead: false,
          })),
        })
      }

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
        paymentReference,
      },
    })

    // Update user status if exists
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true },
    })
    
    if (user) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          status: UserStatus.ACTIVE,
        },
      })
    }

    // Tạo notification cho tất cả admin
    const admins = await prisma.user.findMany({
      where: { role: UserRole.ADMIN },
      select: { id: true },
    })

    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          type: 'SYSTEM',
          title: 'Đơn đăng ký host mới',
          message: `${user?.name || user?.email || 'Người dùng'} đã gửi đơn đăng ký trở thành host tại ${payload.locationName}. Mã tham chiếu: ${paymentReference || 'Chưa cập nhật'}`,
          link: `/admin/hosts/applications`,
          isRead: false,
        })),
      })
    }

    return NextResponse.json({ application })
  } catch (error) {
    console.error("Host application POST error:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message ?? "Invalid payload" }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
