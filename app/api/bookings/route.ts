import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateNights, calculateTotalPrice } from '@/lib/helpers'
import { sendBookingConfirmationEmail } from '@/lib/email'
import { z } from 'zod'

const createBookingSchema = z
  .object({
    listingId: z.string(),
    checkIn: z
      .coerce
      .date()
      .refine((date) => !Number.isNaN(date.getTime()), {
        message: 'Invalid check-in date',
      })
      .refine((date) => date.getFullYear() >= 2000 && date.getFullYear() <= 2100, {
        message: 'Check-in date is out of range',
      }),
    checkOut: z
      .coerce
      .date()
      .refine((date) => !Number.isNaN(date.getTime()), {
        message: 'Invalid check-out date',
      })
      .refine((date) => date.getFullYear() >= 2000 && date.getFullYear() <= 2100, {
        message: 'Check-out date is out of range',
      }),
    adults: z.number().min(1),
    children: z.number().min(0).optional(),
    infants: z.number().min(0).optional(),
    pets: z.number().min(0).optional(),
    specialRequests: z.string().optional(),
    guestName: z
      .string()
      .trim()
      .min(2, { message: 'Vui lòng nhập họ tên tối thiểu 2 ký tự' })
      .max(120, { message: 'Họ tên quá dài' })
      .optional(),
    guestPhone: z
      .string()
      .trim()
      .min(8, { message: 'Số điện thoại không hợp lệ' })
      .max(20, { message: 'Số điện thoại không hợp lệ' })
      .optional(),
    guestEmail: z
      .string()
      .trim()
      .email({ message: 'Email không hợp lệ' })
      .optional(),
  })
  .refine((data) => data.checkOut > data.checkIn, {
    path: ['checkOut'],
    message: 'Check-out date must be after check-in date',
  })

// GET bookings
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || 'guest' // guest or host

    const where: any = {}
    if (type === 'guest') {
      where.guestId = session.user.id
    } else {
      where.hostId = session.user.id
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            images: true,
            city: true,
            country: true,
            propertyType: true,
          },
        },
        guest: {
          select: {
            id: true,
            name: true,
            image: true,
            email: true,
            phone: true,
          },
        },
        host: {
          select: {
            id: true,
            name: true,
            image: true,
            phone: true,
          },
        },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ bookings })
  } catch (error) {
    console.error('Get bookings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// CREATE booking
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await req.json()
    const validatedData = createBookingSchema.parse(body)

    const checkInDate = new Date(validatedData.checkIn)
    const checkOutDate = new Date(validatedData.checkOut)

    const isValidBookingDate = (date: Date) =>
      Number.isFinite(date.getTime()) &&
      date.getFullYear() >= 2000 &&
      date.getFullYear() <= 2100

    if (!isValidBookingDate(checkInDate) || !isValidBookingDate(checkOutDate)) {
      return NextResponse.json(
        { error: 'Selected dates are invalid or out of range' },
        { status: 400 }
      )
    }

    // Validate dates
    if (checkInDate >= checkOutDate) {
      return NextResponse.json(
        { error: 'Check-out date must be after check-in date' },
        { status: 400 }
      )
    }

    // Flexible date validation - Allow bookings starting from today
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    if (checkInDate < today) {
      return NextResponse.json(
        { error: 'Check-in date cannot be in the past' },
        { status: 400 }
      )
    }

    const guestUser = session?.user?.id
      ? await prisma.user.findUnique({
          where: { id: session.user.id },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        })
      : null

    if (session?.user && !guestUser) {
      return NextResponse.json(
        { error: 'User profile không tồn tại. Vui lòng đăng nhập lại.' },
        { status: 404 }
      )
    }

    const rawGuestName = validatedData.guestName?.trim()
    const rawGuestEmail = validatedData.guestEmail?.trim()
    const rawGuestPhone = validatedData.guestPhone?.trim()

    const contactName =
      guestUser?.name?.trim() ||
      rawGuestName ||
      'Khách vãng lai'
    const contactEmail = guestUser?.email || rawGuestEmail || null
    const contactPhone = (guestUser?.phone || rawGuestPhone)?.trim() || null
    const contactPhoneNormalized = contactPhone
      ? contactPhone.replace(/\D/g, '')
      : null

    if (!contactPhone && !guestUser) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp số điện thoại để hoàn tất đặt phòng' },
        { status: 400 }
      )
    }

    // Get listing
    const listing = await prisma.listing.findUnique({
      where: { id: validatedData.listingId },
      include: { host: true },
    })

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    if (listing.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Listing is not available' }, { status: 400 })
    }

    // Check guest capacity
    const totalGuests = 
      validatedData.adults + 
      (validatedData.children || 0) + 
      (validatedData.infants || 0)

    if (totalGuests > listing.maxGuests) {
      return NextResponse.json(
        { error: `Maximum ${listing.maxGuests} guests allowed` },
        { status: 400 }
      )
    }

    // Check pets
    if ((validatedData.pets || 0) > 0 && !listing.allowPets) {
      return NextResponse.json(
        { error: 'Pets are not allowed at this property' },
        { status: 400 }
      )
    }

    // Check availability
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        listingId: validatedData.listingId,
        status: { in: ['CONFIRMED', 'PENDING'] },
        OR: [
          {
            AND: [
              { checkIn: { lte: checkInDate } },
              { checkOut: { gte: checkInDate } },
            ],
          },
          {
            AND: [
              { checkIn: { lte: checkOutDate } },
              { checkOut: { gte: checkOutDate } },
            ],
          },
          {
            AND: [
              { checkIn: { gte: checkInDate } },
              { checkOut: { lte: checkOutDate } },
            ],
          },
        ],
      },
    })

    if (conflictingBooking) {
      return NextResponse.json(
        {
          error: 'Khoảng thời gian này đã có khách đặt trước',
          conflict: {
            checkIn: conflictingBooking.checkIn,
            checkOut: conflictingBooking.checkOut,
          },
        },
        { status: 400 }
      )
    }

    // Check blocked dates
    const blockedDate = await prisma.blockedDate.findFirst({
      where: {
        listingId: validatedData.listingId,
        OR: [
          {
            AND: [
              { startDate: { lte: checkInDate } },
              { endDate: { gte: checkInDate } },
            ],
          },
          {
            AND: [
              { startDate: { lte: checkOutDate } },
              { endDate: { gte: checkOutDate } },
            ],
          },
        ],
      },
    })

    if (blockedDate) {
      return NextResponse.json(
        {
          error: 'Khoảng thời gian này đã được host chặn',
          blocked: {
            startDate: blockedDate.startDate,
            endDate: blockedDate.endDate,
          },
        },
        { status: 400 }
      )
    }

    // Calculate pricing
    const nights = calculateNights(checkInDate, checkOutDate)
    const totalPrice = calculateTotalPrice(
      listing.basePrice,
      nights,
      listing.cleaningFee
    )

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        listingId: validatedData.listingId,
        guestId: guestUser?.id ?? undefined,
        hostId: listing.hostId,
        guestType: guestUser ? 'REGISTERED' : 'WALK_IN',
        contactName,
        contactEmail: contactEmail || undefined,
        contactPhone: contactPhone || undefined,
        contactPhoneNormalized: contactPhoneNormalized || undefined,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        nights,
        adults: validatedData.adults,
        children: validatedData.children || 0,
        infants: validatedData.infants || 0,
        pets: validatedData.pets || 0,
        basePrice: listing.basePrice,
        cleaningFee: listing.cleaningFee,
        serviceFee: totalPrice - (listing.basePrice * nights) - listing.cleaningFee,
        totalPrice,
        status: listing.instantBookable ? 'CONFIRMED' : 'PENDING',
        instantBook: listing.instantBookable,
        specialRequests: validatedData.specialRequests,
      },
      include: {
        listing: true,
        guest: true,
        host: true,
      },
    })

    // Send notification to host
    await prisma.notification.create({
      data: {
        userId: listing.hostId,
        type: 'BOOKING_REQUEST',
        title: 'New Booking Request',
        message: `${contactName} đã yêu cầu đặt ${listing.title}`,
        link: `/host/bookings/${booking.id}`,
        data: { bookingId: booking.id, contactPhone },
      },
    })

    // Send confirmation email
    const guestEmailForConfirmation = booking.contactEmail || booking.guest?.email
    if (booking.status === 'CONFIRMED' && guestEmailForConfirmation) {
      await sendBookingConfirmationEmail({
        guestName: booking.guest?.name || booking.contactName || 'Guest',
        guestEmail: guestEmailForConfirmation,
        listingTitle: booking.listing.title,
        listingAddress: `${booking.listing.city}, ${booking.listing.country}`,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        nights: booking.nights,
        guests: {
          adults: booking.adults,
          children: booking.children,
          infants: booking.infants,
        },
        totalPrice: booking.totalPrice,
        currency: booking.currency,
        bookingId: booking.id,
        hostName: booking.host.name || 'Host',
        hostEmail: booking.host.email || '',
      }).catch(error => {
        console.error('Failed to send booking confirmation email:', error)
      })
    }

    return NextResponse.json({ booking }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    console.error('Create booking error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
