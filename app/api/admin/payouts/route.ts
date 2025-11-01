import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { HostPayoutStatus, PayoutStatus, TransactionStatus, TransactionType } from "@prisma/client"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const statusFilter = request.nextUrl.searchParams.get("status")

    const payouts = await prisma.hostPayout.findMany({
      where: statusFilter ? { status: statusFilter as PayoutStatus } : {},
      include: {
        host: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { requestedAt: "desc" },
      take: 100,
    })

    return NextResponse.json({ payouts })
  } catch (error) {
    console.error("Admin payouts GET error:", error)
    return NextResponse.json({ error: "Failed to load payout requests" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const payoutId = String(body?.payoutId || "")
    const action = String(body?.action || "").toUpperCase()
    const adminNotes =
      typeof body?.note === "string" && body.note.trim().length > 0 ? body.note.trim() : undefined

    if (!payoutId) {
      return NextResponse.json({ error: "Thiếu mã yêu cầu rút tiền" }, { status: 400 })
    }

    if (!["APPROVE", "REJECT", "PAY"].includes(action)) {
      return NextResponse.json({ error: "Hành động không hợp lệ" }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      const payout = await tx.hostPayout.findUnique({
        where: { id: payoutId },
      })

      if (!payout) {
        throw new Error("Yêu cầu rút tiền không tồn tại")
      }

      if (action === "APPROVE") {
        if (payout.status !== PayoutStatus.PENDING) {
          throw new Error("Chỉ có thể duyệt các yêu cầu đang chờ xử lý")
        }

        return tx.hostPayout.update({
          where: { id: payoutId },
          data: {
            status: PayoutStatus.APPROVED,
            adminNotes,
          },
        })
      }

      if (action === "REJECT") {
        if (payout.status === PayoutStatus.PAID) {
          throw new Error("Không thể từ chối yêu cầu đã thanh toán")
        }

        await tx.hostProfile.update({
          where: { userId: payout.hostId },
          data: {
            availableBalance: { increment: payout.amount },
            pendingPayoutBalance: { decrement: payout.amount },
          },
        })

        await tx.booking.updateMany({
          where: { id: { in: payout.bookingIds } },
          data: {
            hostPayoutStatus: HostPayoutStatus.PENDING,
            hostPayoutRequestId: null,
          },
        })

        return tx.hostPayout.update({
          where: { id: payoutId },
          data: {
            status: PayoutStatus.REJECTED,
            adminNotes,
            processedAt: new Date(),
          },
        })
      }

      if (action === "PAY") {
        if (payout.status !== PayoutStatus.APPROVED && payout.status !== PayoutStatus.PENDING) {
          throw new Error("Chỉ có thể thanh toán các yêu cầu đang chờ hoặc đã duyệt")
        }

        await tx.hostProfile.update({
          where: { userId: payout.hostId },
          data: {
            pendingPayoutBalance: { decrement: payout.amount },
          },
        })

        await tx.booking.updateMany({
          where: { id: { in: payout.bookingIds } },
          data: {
            hostPayoutStatus: HostPayoutStatus.PAID,
            hostPayoutSettledAt: new Date(),
          },
        })

        await tx.transaction.create({
          data: {
            userId: payout.hostId,
            type: TransactionType.PAYOUT,
            amount: -Math.abs(payout.amount),
            status: TransactionStatus.COMPLETED,
            description: `Thanh toán yêu cầu rút tiền ${payoutId}`,
            referenceId: payoutId,
          },
        })

        return tx.hostPayout.update({
          where: { id: payoutId },
          data: {
            status: PayoutStatus.PAID,
            processedAt: new Date(),
            adminNotes,
          },
        })
      }

      return payout
    })

    return NextResponse.json({ payout: result })
  } catch (error) {
    console.error("Admin payouts PATCH error:", error)
    return NextResponse.json({ error: (error as Error).message || "Failed to update payout" }, { status: 500 })
  }
}
