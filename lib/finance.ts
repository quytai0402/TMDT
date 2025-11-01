import { prisma } from "@/lib/prisma"
import { HostPayoutStatus, TransactionStatus, TransactionType } from "@prisma/client"

export function computeBookingFinancials(booking: {
  platformCommission?: number | null
  serviceFee?: number | null
  totalPrice?: number | null
  hostEarnings?: number | null
}) {
  const totalPrice = booking.totalPrice ?? 0
  const recordedCommission = booking.platformCommission ?? 0
  const serviceFee = booking.serviceFee ?? 0
  const commission =
    recordedCommission > 0 ? recordedCommission : serviceFee > 0 ? serviceFee : totalPrice * 0.1
  const recordedHostShare = booking.hostEarnings ?? 0
  const hostShare = recordedHostShare > 0 ? recordedHostShare : Math.max(totalPrice - commission, 0)
  return {
    commission: Math.max(commission, 0),
    hostShare: Math.max(hostShare, 0),
  }
}

export async function settleCompletedBookingFinancials(bookingId: string) {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: {
        listing: {
          select: {
            title: true,
          },
        },
      },
    })

    if (!booking) {
      return null
    }

    if (booking.platformCommission > 0 || booking.hostEarnings > 0) {
      return booking
    }

    const { commission: platformCommission, hostShare } = computeBookingFinancials(booking)

    const [updatedBooking] = await Promise.all([
      tx.booking.update({
        where: { id: bookingId },
        data: {
          platformCommission,
          hostEarnings: hostShare,
          hostPayoutStatus: HostPayoutStatus.PENDING,
          hostPayoutSettledAt: new Date(),
        },
      }),
      tx.hostProfile.upsert({
        where: { userId: booking.hostId },
        create: {
          userId: booking.hostId,
          totalEarnings: hostShare,
          availableBalance: hostShare,
        },
        update: {
          totalEarnings: { increment: hostShare },
          availableBalance: { increment: hostShare },
        },
      }),
      tx.transaction.create({
        data: {
          userId: booking.hostId,
          type: TransactionType.BOOKING_PAYMENT,
          amount: hostShare,
          status: TransactionStatus.COMPLETED,
          description: booking.listing
            ? `Thu nhập từ đơn ${booking.listing.title}`
            : "Thu nhập từ đơn hoàn tất",
          referenceId: booking.id,
        },
      }),
    ])

    return updatedBooking
  })
}
