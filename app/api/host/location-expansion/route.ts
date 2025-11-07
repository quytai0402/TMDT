import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { notifyAdmins } from "@/lib/notifications"
import { formatTransferReference } from "@/lib/payments"
import { NotificationType, type TransactionType } from "@prisma/client"

const LOCATION_EXPANSION_FEE = 500000 // 500,000 VND per new location
const LOCATION_EXPANSION_TRANSACTION_TYPE = "LOCATION_EXPANSION" as TransactionType

const createExpansionRequestSchema = z.object({
  locationId: z.string(),
  reason: z.string().min(20, "Vui lòng mô tả lý do chi tiết hơn"),
  paymentMethod: z.enum(["MOMO", "BANK_TRANSFER", "CREDIT_CARD"]),
  transferReference: z
    .string()
    .min(4)
    .max(32)
    .optional(),
})

// GET - Get host's location expansion requests
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const requests = await prisma.locationRequest.findMany({
      where: {
        requestedBy: session.user.id,
      },
      include: {
        approvedByUser: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({ requests })
  } catch (error: any) {
    console.error("Error fetching expansion requests:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch requests" },
      { status: 500 }
    )
  }
}

// POST - Create new location expansion request
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const validated = createExpansionRequestSchema.parse(body)

    const formattedFee = `${new Intl.NumberFormat("en-US").format(LOCATION_EXPANSION_FEE)}đ`
    const transferReference =
      typeof validated.transferReference === "string" && validated.transferReference.trim().length > 0
        ? validated.transferReference.trim().toUpperCase()
        : formatTransferReference("LOCATION_EXPANSION", session.user.id)

    // Get location details
    const location = await prisma.location.findUnique({
      where: { id: validated.locationId },
    })

    if (!location) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 })
    }

    // Check if already requested
    const existing = await prisma.locationRequest.findFirst({
      where: {
        requestedBy: session.user.id,
        city: location.city,
        state: location.state,
        country: location.country,
        status: {
          in: ["PENDING", "APPROVED"],
        },
      },
    })

    if (existing) {
      if (existing.status === "APPROVED") {
        return NextResponse.json(
          { error: "Bạn đã có quyền đăng tin tại khu vực này" },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { error: "Bạn đã gửi yêu cầu cho khu vực này, vui lòng chờ admin phê duyệt" },
        { status: 409 }
      )
    }

    // Create payment transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId: session.user.id,
  type: LOCATION_EXPANSION_TRANSACTION_TYPE,
        amount: LOCATION_EXPANSION_FEE,
        currency: "VND",
        status: "PENDING",
        referenceId: location.id,
        description: `Mở rộng khu vực ${location.city}, ${location.state} • ${transferReference}`,
      },
    })

    // Create location request
    const request = await prisma.locationRequest.create({
      data: {
        requestedBy: session.user.id,
        city: location.city,
        state: location.state,
        country: location.country,
        reason: validated.reason,
        status: "PENDING",
      },
      include: {
        requestedByUser: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    // Notify admins
    await notifyAdmins({
      type: NotificationType.SYSTEM,
      title: "Hồ sơ host • Yêu cầu mở rộng khu vực",
      message: `${session.user.name ?? "Host"} muốn đăng tin tại ${location.city}, ${location.state}. Phí xử lý: ${formattedFee}.`,
      link: `/admin/hosts/applications`,
      data: {
        requestId: request.id,
        transactionId: transaction.id,
        transferReference,
      },
    })

    return NextResponse.json({
      request,
      transaction,
      transferReference,
      message: "Yêu cầu đã được gửi. Admin sẽ xem xét trong vòng 24-48 giờ.",
      paymentUrl: `/payments/${transaction.id}`,
    })
  } catch (error: any) {
    console.error("Error creating expansion request:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || "Failed to create request" },
      { status: 500 }
    )
  }
}
