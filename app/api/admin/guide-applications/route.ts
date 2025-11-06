import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { addMonths } from "date-fns"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notifyUser } from "@/lib/notifications"
import { sendGuideApplicationStatusEmail } from "@/lib/email"
import {
  GuideApplicationStatus,
  GuideStatus,
  GuideSubscriptionStatus,
  NotificationType,
  TransactionStatus,
  TransactionType,
  UserRole,
} from "@prisma/client"

const MONTHLY_GUIDE_FEE = 399_000
const PLATFORM_COMMISSION_RATE = 0.1

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const statusParam = request.nextUrl.searchParams.get("status")

    const applications = await prisma.guideApplication.findMany({
      where: statusParam ? { status: statusParam as GuideApplicationStatus } : {},
      include: {
        applicant: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            isGuide: true,
            isHost: true,
          },
        },
        sponsor: {
          select: {
            id: true,
            name: true,
            email: true,
            isHost: true,
          },
        },
        guideProfile: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    })

    return NextResponse.json({
      applications,
      meta: {
        fee: MONTHLY_GUIDE_FEE,
        commissionRate: PLATFORM_COMMISSION_RATE,
      },
    })
  } catch (error) {
    console.error("Admin guide applications GET error:", error)
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

    if (!applicationId || !["APPROVE", "REJECT", "NEEDS_REVISION"].includes(action)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      const application = await tx.guideApplication.findUnique({
        where: { id: applicationId },
        include: {
          applicant: true,
          sponsor: true,
          guideProfile: true,
        },
      })

      if (!application) {
        throw new Error("Guide application not found")
      }

      if (action === "APPROVE") {
        const now = new Date()
        const subscriptionExpires = addMonths(now, 1)

        const profile = await tx.guideProfile.upsert({
          where: { userId: application.applicantId },
          update: {
            hostUserId: application.sponsorId ?? undefined,
            displayName: application.displayName,
            tagline: application.tagline,
            bio: application.introduction,
            languages: application.languages,
            serviceAreas: application.serviceAreas,
            specialties: application.specialties,
            status: GuideStatus.APPROVED,
            subscriptionStatus: GuideSubscriptionStatus.ACTIVE,
            subscriptionStarted: now,
            subscriptionExpires,
            monthlyFee: MONTHLY_GUIDE_FEE,
            adminCommissionRate: PLATFORM_COMMISSION_RATE,
          },
          create: {
            userId: application.applicantId,
            hostUserId: application.sponsorId ?? undefined,
            displayName: application.displayName,
            tagline: application.tagline,
            bio: application.introduction,
            languages: application.languages,
            serviceAreas: application.serviceAreas,
            specialties: application.specialties,
            yearsExperience: null,
            pricingStructure: null,
            status: GuideStatus.APPROVED,
            subscriptionStatus: GuideSubscriptionStatus.ACTIVE,
            subscriptionStarted: now,
            subscriptionExpires,
            monthlyFee: MONTHLY_GUIDE_FEE,
            adminCommissionRate: PLATFORM_COMMISSION_RATE,
          },
        })

        const updatedApplication = await tx.guideApplication.update({
          where: { id: applicationId },
          data: {
            status: GuideApplicationStatus.APPROVED,
            adminNotes,
            reviewedAt: now,
            guideProfileId: profile.id,
          },
          include: {
            applicant: true,
            sponsor: true,
          },
        })

        await tx.user.update({
          where: { id: application.applicantId },
          data: {
            isGuide: true,
            role: application.applicant.role === "GUEST" ? UserRole.GUEST : application.applicant.role,
          },
        })

        await tx.transaction.create({
          data: {
            userId: application.applicantId,
            type: TransactionType.FEE,
            amount: MONTHLY_GUIDE_FEE,
            status: TransactionStatus.COMPLETED,
            description: "Phí kích hoạt hướng dẫn viên tháng đầu",
            referenceId: profile.id,
          },
        })

        await sendGuideApplicationStatusEmail({
          email: application.applicant.email ?? undefined,
          name: application.displayName,
          status: "approved",
          notes: adminNotes,
          subscriptionFee: MONTHLY_GUIDE_FEE,
          commissionRate: PLATFORM_COMMISSION_RATE,
        })

        await notifyUser(application.applicantId, {
          type: NotificationType.SYSTEM,
          title: "Hồ sơ hướng dẫn viên đã được duyệt",
          message:
            adminNotes && adminNotes.length > 0
              ? `Admin đã duyệt hồ sơ. Ghi chú: ${adminNotes}`
              : "Chúc mừng! Bạn đã trở thành hướng dẫn viên chính thức. Trung tâm hướng dẫn viên đã sẵn sàng trong dashboard.",
          link: "/guide/dashboard",
          data: {
            applicationId,
            profileId: profile.id,
            status: GuideApplicationStatus.APPROVED,
          },
        })

        if (application.sponsorId && application.sponsorId !== application.applicantId) {
          await notifyUser(application.sponsorId, {
            type: NotificationType.SYSTEM,
            title: "Hướng dẫn viên đội ngũ đã được duyệt",
            message: `${application.displayName} đã được duyệt trở thành hướng dẫn viên. Bạn có thể phân công tour ngay bây giờ.`,
            link: "/host/team",
            data: {
              applicationId,
              profileId: profile.id,
            },
          })
        }

        return { application: updatedApplication, profile }
      }

      const newStatus = action === "REJECT" ? GuideApplicationStatus.REJECTED : GuideApplicationStatus.NEEDS_REVISION

      const updatedApplication = await tx.guideApplication.update({
        where: { id: applicationId },
        data: {
          status: newStatus,
          adminNotes,
          reviewedAt: new Date(),
        },
        include: {
          applicant: true,
        },
      })

      await sendGuideApplicationStatusEmail({
        email: updatedApplication.applicant.email ?? undefined,
        name: updatedApplication.displayName,
        status: newStatus === GuideApplicationStatus.REJECTED ? "rejected" : "needs_revision",
        notes: adminNotes,
        subscriptionFee: MONTHLY_GUIDE_FEE,
        commissionRate: PLATFORM_COMMISSION_RATE,
      })

      await notifyUser(application.applicantId, {
        type: NotificationType.SYSTEM,
        title:
          newStatus === GuideApplicationStatus.REJECTED
            ? "Hồ sơ hướng dẫn viên bị từ chối"
            : "Hồ sơ hướng dẫn viên cần điều chỉnh",
        message:
          adminNotes && adminNotes.length > 0
            ? adminNotes
            : newStatus === GuideApplicationStatus.REJECTED
              ? "Rất tiếc hồ sơ chưa đủ điều kiện. Hãy cập nhật và gửi lại sau."
              : "Vui lòng cập nhật hồ sơ theo góp ý và gửi lại để được duyệt lại.",
        link: "/become-guide",
        data: {
          applicationId,
          status: newStatus,
        },
      })

      return { application: updatedApplication }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Admin guide applications PATCH error:", error)
    return NextResponse.json({ error: (error as Error).message || "Internal server error" }, { status: 500 })
  }
}
