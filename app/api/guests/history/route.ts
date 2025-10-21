import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const normalizePhone = (value: string) => value.replace(/\D/g, '')

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

    let memberTier = 'Bronze'
    let discount = 0

    if (totalBookings >= 10) {
      memberTier = 'Gold'
      discount = 10
    } else if (totalBookings >= 5) {
      memberTier = 'Silver'
      discount = 5
    }

    return NextResponse.json({
      totalBookings,
      totalSpent,
      memberTier,
      discount,
    })
  } catch (error) {
    console.error('Error fetching guest history:', error)
    return NextResponse.json({
      totalBookings: 0,
      totalSpent: 0,
      memberTier: 'Bronze',
      discount: 0,
    })
  }
}
