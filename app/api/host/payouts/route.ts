import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { HostPayoutStatus } from "@prisma/client"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { computeBookingFinancials } from "@/lib/finance"
import { notifyAdmins } from "@/lib/notifications"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "HOST") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = prisma as unknown as {
      hostPayoutAccount: {
        findUnique: typeof prisma.hostPayout.findUnique
      }
    }

    const [profile, payouts, bookings, payoutAccount] = await Promise.all([
      prisma.hostProfile.findUnique({
        where: { userId: session.user.id },
        select: {
          availableBalance: true,
          pendingPayoutBalance: true,
          totalEarnings: true,
        },
      }),
      prisma.hostPayout.findMany({
        where: { hostId: session.user.id },
        orderBy: { requestedAt: "desc" },
        take: 50,
      }),
      prisma.booking.findMany({
        where: {
          hostId: session.user.id,
          hostPayoutStatus: HostPayoutStatus.PENDING,
          status: "COMPLETED",
        },
        select: {
          id: true,
          totalPrice: true,
          serviceFee: true,
          platformCommission: true,
          hostEarnings: true,
          completedAt: true,
        },
      }),
      db.hostPayoutAccount.findUnique({
        where: { hostId: session.user.id },
      }),
    ])

    const bookingFinancials = bookings.map((booking) => {
      const { hostShare, commission } = computeBookingFinancials(booking)
      const grossAmount = hostShare + commission
      return {
        id: booking.id,
        amount: hostShare,
        commission,
        grossAmount,
        completedAt: booking.completedAt,
      }
    })

    const totalBookable = bookingFinancials.reduce((sum, item) => sum + item.amount, 0)
    const reportedAvailable = profile?.availableBalance ?? 0
    const availableBalance = reportedAvailable > 0 ? reportedAvailable : totalBookable

    return NextResponse.json({
      balance: {
        available: availableBalance,
        pending: profile?.pendingPayoutBalance ?? 0,
        lifetime: profile?.totalEarnings ?? 0,
      },
      pendingBookings: bookingFinancials,
      payouts,
      requiresPayoutSetup: !payoutAccount,
      payoutAccount,
    })
  } catch (error) {
    console.error("Host payouts GET error:", error)
    return NextResponse.json({ error: "Failed to load payout data" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "HOST") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const requestedBookingIds: string[] | undefined = Array.isArray(body?.bookings)
      ? body.bookings
      : undefined
    const requestedAmount = typeof body?.amount === "number" ? body.amount : undefined
    const payoutMethod =
      typeof body?.method === "string" && body.method.trim().length > 0 ? body.method.trim() : null
    const note =
      typeof body?.note === "string" && body.note.trim().length > 0 ? body.note.trim() : null

    const db = prisma as unknown as {
      hostPayoutAccount: {
        findUnique: typeof prisma.hostPayout.findUnique
      }
    }

    const [profile, bookings, account] = await Promise.all([
      prisma.hostProfile.findUnique({
        where: { userId: session.user.id },
        select: {
          availableBalance: true,
          pendingPayoutBalance: true,
        },
      }),
      prisma.booking.findMany({
        where: {
          hostId: session.user.id,
          status: "COMPLETED",
          hostPayoutStatus: HostPayoutStatus.PENDING,
          ...(requestedBookingIds?.length
            ? { id: { in: requestedBookingIds } }
            : {}),
        },
        select: {
          id: true,
          totalPrice: true,
          serviceFee: true,
          platformCommission: true,
          hostEarnings: true,
        },
      }),
      db.hostPayoutAccount.findUnique({
        where: { hostId: session.user.id },
      }),
    ])

    if (!profile) {
      return NextResponse.json(
        { error: "Host profile chưa được kích hoạt để yêu cầu rút tiền" },
        { status: 400 },
      )
    }

    if (!bookings.length) {
      return NextResponse.json(
        { error: "Không có booking nào đủ điều kiện để yêu cầu rút tiền" },
        { status: 400 },
      )
    }

    if (!account) {
      return NextResponse.json(
        { error: "Vui lòng cập nhật thông tin thanh toán trước khi yêu cầu rút tiền" },
        { status: 400 },
      )
    }

    const bookingFinancials = bookings.map((booking) => {
      const financials = computeBookingFinancials(booking)
      return {
        id: booking.id,
        hostShare: financials.hostShare,
        commission: financials.commission,
      }
    })

    const totalFromBookings = bookingFinancials.reduce(
      (sum, booking) => sum + booking.hostShare,
      0,
    )

    const totalCommission = bookingFinancials.reduce(
      (sum, booking) => sum + booking.commission,
      0,
    )

    const amount = requestedAmount ?? totalFromBookings

    if (amount <= 0) {
      return NextResponse.json({ error: "Số tiền rút phải lớn hơn 0" }, { status: 400 })
    }

    if (amount - totalFromBookings > 1) {
      return NextResponse.json(
        { error: "Số tiền yêu cầu vượt quá tổng giá trị các booking đã chọn" },
        { status: 400 },
      )
    }

    if (amount - (profile.availableBalance ?? 0) > 1) {
      return NextResponse.json(
        { error: "Số dư khả dụng không đủ để thực hiện yêu cầu rút tiền" },
        { status: 400 },
      )
    }

    const bookingIds = bookingFinancials.map((booking) => booking.id)

    const payout = await prisma.$transaction(async (tx) => {
      const createdPayout = await tx.hostPayout.create({
        data: {
          hostId: session.user.id,
          amount,
          feeAmount: totalCommission,
          grossAmount: amount + totalCommission,
          payoutMethod,
          notes: note,
          bookingIds,
          accountSnapshot: {
            bankName: account.bankName,
            bankBranch: account.bankBranch,
            accountNumber: account.accountNumber,
            accountName: account.accountName,
            qrCodeImage: account.qrCodeImage,
            taxId: account.taxId,
          },
        },
      })

      await tx.hostProfile.update({
        where: { userId: session.user.id },
        data: {
          availableBalance: { decrement: amount },
          pendingPayoutBalance: { increment: amount },
        },
      })

      await tx.booking.updateMany({
        where: { id: { in: bookingIds } },
        data: {
          hostPayoutStatus: HostPayoutStatus.REQUESTED,
          hostPayoutRequestId: createdPayout.id,
        },
      })

      return createdPayout
    })

    await notifyAdmins({
      type: "PAYOUT_REQUEST",
      title: "Yêu cầu rút tiền mới",
      message: `${session.user.name ?? "Host"} yêu cầu rút ${amount.toLocaleString("vi-VN")}₫`,
      link: "/admin/payouts",
      data: {
        payoutId: payout.id,
        amount,
        feeAmount: totalCommission,
      },
    })

    return NextResponse.json({ payout })
  } catch (error) {
    console.error("Host payouts POST error:", error)
    return NextResponse.json({ error: "Failed to create payout request" }, { status: 500 })
  }
}
