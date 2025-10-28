import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateNights, calculateServiceFee, calculateTotalPrice, calculateDistance } from '@/lib/helpers'
import { sendBookingConfirmationEmail } from '@/lib/email'
import { notifyAdmins, notifyUser } from '@/lib/notifications'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { NotificationType } from '@prisma/client'

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
    additionalServices: z
      .array(
        z.object({
          id: z.string(),
          name: z.string(),
          description: z.string().optional(),
          basePrice: z.number(),
          totalPrice: z.number(),
          unit: z.string(),
          quantity: z.number(),
          quantityLabel: z.string().optional(),
          category: z.string().optional(),
          metadata: z.any().optional(),
        }),
      )
      .optional(),
    additionalServicesTotal: z.number().min(0).optional(),
  })
  .refine((data) => data.checkOut > data.checkIn, {
    path: ['checkOut'],
    message: 'Check-out date must be after check-in date',
  })

interface SplitStayConflictDetail {
  type: 'booking' | 'blocked'
  range: {
    startDate: string
    endDate: string
  }
  note?: string | null
}

interface AlternativeListingSuggestion {
  id: string
  title: string
  slug?: string | null
  image?: string | null
  city: string
  state?: string | null
  country: string
  basePrice: number
  estimatedTotal: number
  priceDifference: number
  distanceKm?: number | null
}

interface SplitStaySegment {
  id: string
  type: 'primary' | 'gap'
  startDate: string
  endDate: string
  nights: number
  estimatedTotal?: number
  conflicts?: SplitStayConflictDetail[]
  alternatives?: AlternativeListingSuggestion[]
}

interface SplitStaySuggestionPayload {
  message: string
  requested: {
    startDate: string
    endDate: string
    nights: number
  }
  primaryListing: {
    id: string
    title: string
    basePrice: number
    cleaningFee: number
    city: string
    state?: string | null
    country: string
  }
  segments: SplitStaySegment[]
}

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

    const sessionUser = session?.user
    const userWhere: Prisma.UserWhereInput[] = []
    if (sessionUser?.id) {
      userWhere.push({ id: sessionUser.id })
    }
    if (sessionUser?.email) {
      userWhere.push({ email: sessionUser.email })
    }

    const guestUser = userWhere.length
      ? await prisma.user.findFirst({
          where: { OR: userWhere },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        })
      : null

    const rawGuestName = validatedData.guestName?.trim()
    const rawGuestEmail = validatedData.guestEmail?.trim()
    const rawGuestPhone = validatedData.guestPhone?.trim()

    if (!guestUser) {
      if (!rawGuestName) {
        return NextResponse.json(
          { error: 'Vui lòng nhập họ tên để hoàn tất đặt phòng.' },
          { status: 400 }
        )
      }

      if (!rawGuestEmail && !rawGuestPhone) {
        return NextResponse.json(
          { error: 'Vui lòng cung cấp ít nhất một email hoặc số điện thoại để liên hệ.' },
          { status: 400 }
        )
      }
    }

    const contactName = guestUser?.name?.trim() || rawGuestName || 'Khách LuxeStay'
    const contactEmail = guestUser?.email || rawGuestEmail || null
    const contactPhone = (guestUser?.phone || rawGuestPhone)?.trim() || null
    const contactPhoneNormalized = contactPhone
      ? contactPhone.replace(/\D/g, '')
      : null

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

    const formatInputDate = (date: Date) => {
      const year = date.getUTCFullYear()
      const month = String(date.getUTCMonth() + 1).padStart(2, '0')
      const day = String(date.getUTCDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    const addDays = (date: Date, amount: number) => {
      const result = new Date(date)
      result.setUTCDate(result.getUTCDate() + amount)
      return result
    }

    const buildSplitStaySuggestion = async (): Promise<SplitStaySuggestionPayload | null> => {
      const overlappingBookings = await prisma.booking.findMany({
        where: {
          listingId: listing.id,
          status: { in: ['CONFIRMED', 'PENDING'] },
          checkIn: { lt: checkOutDate },
          checkOut: { gt: checkInDate },
        },
        select: {
          id: true,
          checkIn: true,
          checkOut: true,
          contactName: true,
        },
        orderBy: { checkIn: 'asc' },
      })

      const overlappingBlockedDates = await prisma.blockedDate.findMany({
        where: {
          listingId: listing.id,
          startDate: { lt: checkOutDate },
          endDate: { gt: checkInDate },
        },
        select: {
          id: true,
          startDate: true,
          endDate: true,
          reason: true,
        },
        orderBy: { startDate: 'asc' },
      })

      const nights: Array<{
        start: Date
        end: Date
        available: boolean
        conflict?: SplitStayConflictDetail
      }> = []

      let cursor = new Date(checkInDate)
      while (cursor < checkOutDate) {
        const nightStart = new Date(cursor)
        const nightEnd = addDays(cursor, 1)

        const bookingConflict = overlappingBookings.find(
          (booking) => booking.checkIn < nightEnd && booking.checkOut > nightStart
        )
        const blockedConflict = overlappingBlockedDates.find(
          (blocked) => blocked.startDate < nightEnd && blocked.endDate > nightStart
        )

        let conflictDetail: SplitStayConflictDetail | undefined
        if (bookingConflict) {
          conflictDetail = {
            type: 'booking',
            range: {
              startDate: formatInputDate(bookingConflict.checkIn),
              endDate: formatInputDate(bookingConflict.checkOut),
            },
            note: bookingConflict.contactName,
          }
        } else if (blockedConflict) {
          conflictDetail = {
            type: 'blocked',
            range: {
              startDate: formatInputDate(blockedConflict.startDate),
              endDate: formatInputDate(blockedConflict.endDate),
            },
            note: blockedConflict.reason,
          }
        }

        nights.push({
          start: nightStart,
          end: nightEnd,
          available: !bookingConflict && !blockedConflict,
          conflict: conflictDetail,
        })

        cursor = nightEnd
      }

      const hasUnavailableNight = nights.some((night) => !night.available)
      if (!hasUnavailableNight) {
        return null
      }

      const segments: SplitStaySegment[] = []
      let currentSegment: SplitStaySegment | null = null

      for (let i = 0; i < nights.length; i++) {
        const night = nights[i]
        const type: 'primary' | 'gap' = night.available ? 'primary' : 'gap'

        if (!currentSegment || currentSegment.type !== type) {
          if (currentSegment) {
            segments.push(currentSegment)
          }

          currentSegment = {
            id: `${type}-${segments.length + 1}`,
            type,
            startDate: formatInputDate(night.start),
            endDate: formatInputDate(night.end),
            nights: 1,
          }

          if (type === 'primary') {
            currentSegment.estimatedTotal = calculateTotalPrice(
              listing.basePrice,
              currentSegment.nights,
              listing.cleaningFee ?? 0
            )
          } else if (night.conflict) {
            currentSegment.conflicts = [night.conflict]
          }
        } else {
          currentSegment.endDate = formatInputDate(night.end)
          currentSegment.nights += 1

          if (currentSegment.type === 'primary') {
            currentSegment.estimatedTotal = calculateTotalPrice(
              listing.basePrice,
              currentSegment.nights,
              listing.cleaningFee ?? 0
            )
          } else if (night.conflict) {
            const existingConflicts = currentSegment.conflicts ?? []
            const alreadyAdded = existingConflicts.some(
              (conflict) =>
                conflict.range.startDate === night.conflict?.range.startDate &&
                conflict.range.endDate === night.conflict?.range.endDate &&
                conflict.type === night.conflict?.type
            )

            if (!alreadyAdded && night.conflict) {
              currentSegment.conflicts = [...existingConflicts, night.conflict]
            }
          }
        }
      }

      if (currentSegment) {
        segments.push(currentSegment)
      }

      const primarySegments = segments.filter((segment) => segment.type === 'primary')
      const gapSegments = segments.filter((segment) => segment.type === 'gap')

      if (primarySegments.length === 0 || gapSegments.length === 0) {
        return null
      }

      const baseSegmentTotalsByNights = new Map<number, number>()

      for (const segment of gapSegments) {
        const gapStart = new Date(segment.startDate)
        const gapEnd = new Date(segment.endDate)

        const alternativeListings = await prisma.listing.findMany({
          where: {
            status: 'ACTIVE',
            id: { not: listing.id },
            maxGuests: { gte: totalGuests },
            city: listing.city,
            propertyType: listing.propertyType,
            bookings: {
              none: {
                status: { in: ['CONFIRMED', 'PENDING'] },
                checkIn: { lt: gapEnd },
                checkOut: { gt: gapStart },
              },
            },
            blockedDates: {
              none: {
                startDate: { lt: gapEnd },
                endDate: { gt: gapStart },
              },
            },
          },
          select: {
            id: true,
            title: true,
            slug: true,
            images: true,
            city: true,
            state: true,
            country: true,
            basePrice: true,
            cleaningFee: true,
            latitude: true,
            longitude: true,
          },
          orderBy: {
            basePrice: 'asc',
          },
          take: 6,
        })

        const baseSegmentTotal =
          baseSegmentTotalsByNights.get(segment.nights) ??
          calculateTotalPrice(listing.basePrice, segment.nights, listing.cleaningFee ?? 0)
        baseSegmentTotalsByNights.set(segment.nights, baseSegmentTotal)

        const alternatives: AlternativeListingSuggestion[] = alternativeListings.map((alt) => {
          const estimatedTotal = calculateTotalPrice(
            alt.basePrice,
            segment.nights,
            alt.cleaningFee ?? 0
          )
          const priceDifference = estimatedTotal - baseSegmentTotal

          let distanceKm: number | null = null
          if (
            typeof listing.latitude === 'number' &&
            typeof listing.longitude === 'number' &&
            typeof alt.latitude === 'number' &&
            typeof alt.longitude === 'number'
          ) {
            distanceKm = Number(
              calculateDistance(
                listing.latitude,
                listing.longitude,
                alt.latitude,
                alt.longitude
              ).toFixed(1)
            )
          }

          return {
            id: alt.id,
            title: alt.title,
            slug: alt.slug ?? undefined,
            image: alt.images?.[0],
            city: alt.city,
            state: alt.state ?? undefined,
            country: alt.country,
            basePrice: alt.basePrice,
            estimatedTotal,
            priceDifference,
            distanceKm,
          }
        })

        segment.alternatives = alternatives
      }

      return {
        message:
          'Một số đêm trong khoảng lưu trú đã kín. Bạn có thể tạm chuyển sang phòng khác cho những đêm này hoặc điều chỉnh lịch.',
        requested: {
          startDate: formatInputDate(checkInDate),
          endDate: formatInputDate(checkOutDate),
          nights: nights.length,
        },
        primaryListing: {
          id: listing.id,
          title: listing.title,
          basePrice: listing.basePrice,
          cleaningFee: listing.cleaningFee ?? 0,
          city: listing.city,
          state: listing.state ?? undefined,
          country: listing.country,
        },
        segments,
      }
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
      const splitSuggestion = await buildSplitStaySuggestion()

      return NextResponse.json(
        {
          error: 'Khoảng thời gian này đã có khách đặt trước',
          conflict: {
            checkIn: conflictingBooking.checkIn,
            checkOut: conflictingBooking.checkOut,
          },
          splitSuggestion,
        },
        { status: 409 }
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
      const splitSuggestion = await buildSplitStaySuggestion()

      return NextResponse.json(
        {
          error: 'Khoảng thời gian này đã được host chặn',
          blocked: {
            startDate: blockedDate.startDate,
            endDate: blockedDate.endDate,
          },
          splitSuggestion,
        },
        { status: 409 }
      )
    }

    const normalizedAdditionalServices = (validatedData.additionalServices ?? []).map((service) => ({
      id: service.id,
      name: service.name,
      description: service.description,
      basePrice: service.basePrice,
      totalPrice: service.totalPrice,
      unit: service.unit,
      quantity: service.quantity,
      quantityLabel: service.quantityLabel,
      category: service.category,
      metadata: service.metadata ?? undefined,
    }))

    const computedAdditionalServicesTotal = normalizedAdditionalServices.reduce(
      (sum, service) => sum + (service.totalPrice ?? 0),
      0,
    )

    const additionalServicesTotal = Math.max(
      0,
      validatedData.additionalServicesTotal ?? computedAdditionalServicesTotal,
    )

    // Calculate pricing
    const nights = calculateNights(checkInDate, checkOutDate)
    const accommodationSubtotal = listing.basePrice * nights
    const cleaningFeeAmount = listing.cleaningFee ?? 0
    const hasCustomServiceFee = typeof listing.serviceFee === 'number' && listing.serviceFee > 0
    const baseServiceFee = hasCustomServiceFee
      ? listing.serviceFee!
      : calculateServiceFee(listing.basePrice, nights)
    const additionalServiceFee = hasCustomServiceFee ? 0 : additionalServicesTotal * 0.1
    const serviceFeeAmount = baseServiceFee + additionalServiceFee
    const totalPrice = accommodationSubtotal + cleaningFeeAmount + serviceFeeAmount + additionalServicesTotal

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
        cleaningFee: cleaningFeeAmount,
        serviceFee: serviceFeeAmount,
        additionalServices: normalizedAdditionalServices,
        additionalServicesTotal,
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

    const bookingRef = booking.id.slice(-6).toUpperCase()

    await notifyUser(listing.hostId, {
      type: NotificationType.BOOKING_REQUEST,
      title: 'Yêu cầu đặt phòng mới',
      message: `${contactName} muốn đặt "${listing.title}" (${bookingRef}).`,
      link: `/host/bookings/${booking.id}`,
      data: {
        bookingId: booking.id,
        listingId: listing.id,
        contactPhone,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
      },
    })

    await notifyAdmins({
      type: NotificationType.BOOKING_REQUEST,
      title: 'Đơn đặt phòng mới',
      message: `Đơn ${bookingRef} cho "${listing.title}" cần theo dõi.`,
      link: `/admin/bookings?highlight=${booking.id}`,
      data: {
        bookingId: booking.id,
        listingId: listing.id,
        hostId: listing.hostId,
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
