import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const normalizePhone = (value: string) => value.replace(/\D/g, '')

const TIERS = [
  {
    id: 'BRONZE',
    name: 'Bronze',
    minBookings: 0,
    minSpend: 0,
    discount: 0,
    perks: ['Ưu đãi flash sale độc quyền', 'Tích điểm 1x cho mỗi 1.000₫ chi tiêu'],
  },
  {
    id: 'SILVER',
    name: 'Silver',
    minBookings: 3,
    minSpend: 8_000_000,
    discount: 5,
    perks: ['Ưu đãi flash sale độc quyền', 'Tặng late check-out (tùy theo tình trạng phòng)', 'Tích điểm 1.2x cho mỗi 1.000₫ chi tiêu'],
  },
  {
    id: 'GOLD',
    name: 'Gold',
    minBookings: 7,
    minSpend: 18_000_000,
    discount: 8,
    perks: ['Ưu đãi flash sale độc quyền', 'Late check-out đảm bảo', 'Miễn phí nâng hạng phòng (khi còn trống)', 'Tích điểm 1.5x cho mỗi 1.000₫ chi tiêu'],
  },
  {
    id: 'PLATINUM',
    name: 'Platinum',
    minBookings: 12,
    minSpend: 35_000_000,
    discount: 12,
    perks: ['Ưu đãi flash sale độc quyền', 'Ưu tiên concierge 24/7', 'Miễn phí nâng hạng phòng', 'Voucher trải nghiệm địa phương mỗi quý', 'Tích điểm 2x cho mỗi 1.000₫ chi tiêu'],
  },
]

const resolveTier = (bookings: number, spend: number) => {
  let tier = TIERS[0]
  for (const candidate of TIERS) {
    const meetsBookings = bookings >= candidate.minBookings
    const meetsSpend = spend >= candidate.minSpend
    if (meetsBookings || meetsSpend) {
      tier = candidate
    }
  }

  const tierIndex = TIERS.findIndex((t) => t.id === tier.id)
  const nextTier = tierIndex >= 0 && tierIndex < TIERS.length - 1 ? TIERS[tierIndex + 1] : null

  const bookingsToNext = nextTier ? Math.max(0, nextTier.minBookings - bookings) : 0
  const spendToNext = nextTier ? Math.max(0, nextTier.minSpend - spend) : 0

  const progress = nextTier
    ? Math.min(1, Math.max(0, Math.max(bookings / Math.max(1, nextTier.minBookings), spend / Math.max(1, nextTier.minSpend))))
    : 1

  return {
    current: tier,
    next: nextTier,
    bookingsToNext,
    spendToNext,
    progress,
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get('phone')

    if (!phone) {
      return NextResponse.json({ error: 'Phone required' }, { status: 400 })
    }

    const normalizedPhone = normalizePhone(phone)

    const user = await prisma.user.findFirst({
      where: {
        phone: phone,
      },
      select: {
        id: true,
        name: true,
      },
    })

    const phoneConditions: any[] = [
      { contactPhone: phone },
      { contactPhoneNormalized: normalizedPhone },
      { guest: { phone: phone } },
    ]

    if (user) {
      phoneConditions.push({ guestId: user.id })
    }

    const bookings = await prisma.booking.findMany({
      where: {
        status: {
          in: ['COMPLETED', 'CONFIRMED'],
        },
        OR: phoneConditions,
      },
      select: {
        totalPrice: true,
      },
    })

    const totalBookings = bookings.length
    const totalSpent = bookings.reduce((sum, b) => sum + b.totalPrice, 0)

    const tierInfo = resolveTier(totalBookings, totalSpent)
    const memberTier = tierInfo.current.name
    const discount = tierInfo.current.discount

    const responsePayload = {
      totalBookings,
      totalSpent,
      memberTier,
      discount,
      perks: tierInfo.current.perks,
      progress: tierInfo.progress,
      nextTier: tierInfo.next
        ? {
            name: tierInfo.next.name,
            bookingsToUnlock: tierInfo.bookingsToNext,
            spendToUnlock: tierInfo.spendToNext,
            discount: tierInfo.next.discount,
            perks: tierInfo.next.perks,
          }
        : null,
    }

    return NextResponse.json(responsePayload)
  } catch (error) {
    console.error('Error fetching guest history:', error)
    return NextResponse.json({
      totalBookings: 0,
      totalSpent: 0,
      memberTier: 'Bronze',
      discount: 0,
      perks: TIERS[0].perks,
      progress: 0,
      nextTier: {
        name: TIERS[1].name,
        bookingsToUnlock: TIERS[1].minBookings,
        spendToUnlock: TIERS[1].minSpend,
        discount: TIERS[1].discount,
        perks: TIERS[1].perks,
      },
    })
  }
}
