import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { cloneMetadata, formatBookingResponse, normalizePhone } from '../utils'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        listing: {
          include: {
            host: {
              include: {
                hostProfile: true,
              },
            },
          },
        },
        guest: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            phone: true,
          },
        },
        review: true,
        payment: true,
        conciergePlans: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const isGuest = booking.guestId && session.user.id === booking.guestId
    const isHost = session.user.id === booking.hostId
    const isAdmin = session.user.role === 'ADMIN'

    if (!isGuest && !isHost && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(formatBookingResponse(booking, session.user.id))
  } catch (error) {
    console.error('Error fetching booking detail:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        listing: {
          include: {
            host: {
              include: {
                hostProfile: true,
              },
            },
          },
        },
        guest: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            phone: true,
            loyaltyTier: true,
            loyaltyPoints: true,
          },
        },
        review: true,
        payment: true,
        conciergePlans: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const isGuest = booking.guestId && session.user.id === booking.guestId
    const isHost = session.user.id === booking.hostId
    const isAdmin = session.user.role === 'ADMIN'

    if (!isGuest && !isHost && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    const rawName = typeof body.contactName === 'string' ? body.contactName.trim() : ''
    const rawEmail = typeof body.contactEmail === 'string' ? body.contactEmail.trim() : ''
    const rawPhone = typeof body.contactPhone === 'string' ? body.contactPhone.trim() : ''
    const rawRequests = typeof body.specialRequests === 'string' ? body.specialRequests.trim() : ''
    const acceptTerms = Boolean(body.acceptTerms)
    const acceptCancellation = Boolean(body.acceptCancellation)

    if (!rawName) {
      return NextResponse.json({ error: 'Vui lòng cung cấp họ tên liên hệ.' }, { status: 400 })
    }

    if (!rawPhone) {
      return NextResponse.json({ error: 'Vui lòng cung cấp số điện thoại liên hệ.' }, { status: 400 })
    }

    const normalizedPhone = normalizePhone(rawPhone)
    if (!/^\d{8,12}$/.test(normalizedPhone)) {
      return NextResponse.json({ error: 'Số điện thoại chưa hợp lệ.' }, { status: 400 })
    }

    if (!rawEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
      return NextResponse.json({ error: 'Email liên hệ chưa hợp lệ.' }, { status: 400 })
    }

    if (!acceptTerms || !acceptCancellation) {
      return NextResponse.json({ error: 'Cần chấp nhận điều khoản và chính sách hủy trước khi tiếp tục.' }, { status: 400 })
    }

    const metadataSource = cloneMetadata(booking.metadata)

    metadataSource.checkoutAcknowledgements = {
      termsAccepted: true,
      cancellationAccepted: true,
      updatedAt: new Date().toISOString(),
      updatedBy: session.user.id,
    }

    if (body.loyaltySnapshot && typeof body.loyaltySnapshot === 'object' && !Array.isArray(body.loyaltySnapshot)) {
      metadataSource.loyaltySnapshot = {
        ...(body.loyaltySnapshot as Record<string, unknown>),
        capturedAt: new Date().toISOString(),
      }
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        contactName: rawName,
        contactEmail: rawEmail,
        contactPhone: rawPhone,
        contactPhoneNormalized: normalizedPhone,
        specialRequests: rawRequests || null,
  metadata: metadataSource,
      },
      include: {
        listing: {
          include: {
            host: {
              include: {
                hostProfile: true,
              },
            },
          },
        },
        guest: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            phone: true,
            loyaltyTier: true,
            loyaltyPoints: true,
          },
        },
        review: true,
        payment: true,
        conciergePlans: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    return NextResponse.json(formatBookingResponse(updatedBooking, session.user.id))
  } catch (error) {
    console.error('Error updating booking checkout details:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
