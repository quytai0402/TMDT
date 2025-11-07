import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { GuideApplicationStatus, NotificationType, Prisma } from "@prisma/client"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notifyAdmins } from "@/lib/notifications"

const guideApplicationSchema = z.object({
  displayName: z.string().min(2, "Tên hiển thị cần tối thiểu 2 ký tự").max(80, "Tên hiển thị quá dài"),
  tagline: z.string().max(160).optional(),
  introduction: z.string().min(40, "Vui lòng mô tả kỹ năng và phong cách hướng dẫn của bạn (tối thiểu 40 ký tự)").max(4000),
  experienceSummary: z.string().min(40, "Hãy chia sẻ kinh nghiệm dẫn tour của bạn (tối thiểu 40 ký tự)").max(4000),
  languages: z.array(z.string().min(1)).min(1, "Chọn ít nhất 1 ngôn ngữ"),
  serviceAreas: z.array(z.string().min(1)).min(1, "Chọn ít nhất 1 khu vực hoạt động"),
  specialties: z.array(z.string().min(1)).min(1, "Chọn ít nhất 1 chủ đề trải nghiệm"),
  availabilityNotes: z.string().max(2000).optional(),
  portfolioLinks: z.array(z.string().url("Liên kết portfolio phải hợp lệ")).max(5).optional().default([]),
  subscriptionAcknowledged: z.boolean().refine((value) => value === true, {
    message: "Bạn cần đồng ý mức phí 399.000đ/tháng để trở thành hướng dẫn viên",
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

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [application, profile] = await Promise.all([
      prisma.guideApplication.findFirst({
        where: { applicantId: session.user.id },
        orderBy: { createdAt: "desc" },
      }),
      prisma.guideProfile.findUnique({
        where: { userId: session.user.id },
      }),
    ])

    return NextResponse.json({ application, profile })
  } catch (error) {
    console.error("Guide application GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const payload = guideApplicationSchema.parse(body)

    // Check if user still exists in database
    const existingGuide = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        isGuide: true,
        guideProfile: {
          select: { status: true },
        },
      },
    })

    // If user doesn't exist, session is stale
    if (!existingGuide) {
      return NextResponse.json({ 
        error: "Phiên đăng nhập đã hết hạn. Vui lòng đăng xuất và đăng nhập lại." 
      }, { status: 401 })
    }

    if (existingGuide.isGuide && existingGuide.guideProfile?.status === "APPROVED") {
      return NextResponse.json({ error: "Bạn đã được kích hoạt vai trò hướng dẫn viên" }, { status: 400 })
    }

    const existingApplication = await prisma.guideApplication.findFirst({
      where: {
        applicantId: session.user.id,
        status: { in: [GuideApplicationStatus.PENDING, GuideApplicationStatus.NEEDS_REVISION] },
      },
    })

    const unique = (values: string[]) => Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))

    const paymentReference = payload.paymentReference?.trim() || null

    const currentDocuments: Record<string, unknown> =
      existingApplication?.documents &&
      typeof existingApplication.documents === "object" &&
      !Array.isArray(existingApplication.documents)
        ? { ...(existingApplication.documents as Record<string, unknown>) }
        : {}

    if (paymentReference) {
      currentDocuments.paymentReference = paymentReference
    }

    const documents: Prisma.JsonValue | null =
      Object.keys(currentDocuments).length > 0
        ? (currentDocuments as Prisma.JsonObject)
        : paymentReference
        ? ({ paymentReference } as Prisma.JsonObject)
        : null

    const data = {
      displayName: payload.displayName.trim(),
      tagline: payload.tagline?.trim() ?? null,
      introduction: payload.introduction.trim(),
      experienceSummary: payload.experienceSummary.trim(),
      languages: unique(payload.languages),
      serviceAreas: unique(payload.serviceAreas),
      specialties: unique(payload.specialties),
      availabilityNotes: payload.availabilityNotes?.trim() ?? null,
      portfolioLinks: unique(payload.portfolioLinks ?? []),
      subscriptionAcknowledged: payload.subscriptionAcknowledged,
      status: GuideApplicationStatus.PENDING,
      adminNotes: null,
      reviewedAt: null,
      guideProfileId: null,
      documents,
    }

    const application = existingApplication
      ? await prisma.guideApplication.update({
          where: { id: existingApplication.id },
          data,
        })
      : await prisma.guideApplication.create({
          data: {
            applicantId: session.user.id,
            sponsorId: session.user.isHost ? session.user.id : null,
            ...data,
          },
        })

    // Only update user if they exist and are not already a guide
    if (existingGuide && !existingGuide.isGuide) {
      try {
        await prisma.user.update({
          where: { id: session.user.id },
          data: {
            isGuide: false,
          },
        })
      } catch (error) {
        console.error('Failed to update user guide status:', error)
        // Continue even if update fails - application is already created
      }
    }

    await notifyAdmins({
      type: NotificationType.SYSTEM,
      title: "Yêu cầu hướng dẫn viên mới",
      message: `${payload.displayName} vừa gửi hồ sơ trở thành hướng dẫn viên${
        paymentReference ? ` • Mã tham chiếu: ${paymentReference}` : ""
      }`,
      link: "/admin/guides/applications",
      data: {
        applicantId: session.user.id,
        applicationId: application.id,
      },
    })

    return NextResponse.json({ application })
  } catch (error) {
    console.error("Guide application POST error:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message ?? "Invalid payload" }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
