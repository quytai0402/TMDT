import { randomUUID } from 'crypto'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notifyAdmins, notifyUser } from '@/lib/notifications'
import { NotificationType } from '@prisma/client'

const SERVICE_STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED'] as const

type ServiceStatus = (typeof SERVICE_STATUSES)[number]

const STATUS_LABEL: Record<ServiceStatus, string> = {
  PENDING: 'Chờ xử lý',
  CONFIRMED: 'Đang thực hiện',
  COMPLETED: 'Đã hoàn thành',
}

const HOST_SERVICE_TRANSITIONS: Record<ServiceStatus, ServiceStatus[]> = {
  PENDING: ['CONFIRMED', 'COMPLETED'],
  CONFIRMED: ['PENDING', 'COMPLETED'],
  COMPLETED: [],
}

const ADMIN_SERVICE_TRANSITIONS: Record<ServiceStatus, ServiceStatus[]> = {
  PENDING: ['CONFIRMED', 'COMPLETED'],
  CONFIRMED: ['PENDING', 'COMPLETED'],
  COMPLETED: ['PENDING', 'CONFIRMED'],
}

const createServiceSchema = z.object({
  serviceId: z.string().optional(),
  catalogId: z.string().optional(),
  name: z.string().min(2, 'Vui lòng nhập tên dịch vụ'),
  type: z.string().optional(),
  price: z.number().min(0).default(0),
  currency: z.string().optional(),
  quantityLabel: z.string().optional(),
  notes: z.string().optional(),
  scheduledFor: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  pickup: z
    .object({
      location: z.string().optional(),
      time: z.string().optional(),
      date: z.string().optional(),
    })
    .optional(),
  dropoffLocation: z.string().optional(),
  planner: z
    .object({
      type: z.enum(['accommodation', 'dining', 'activity', 'shopping', 'sightseeing']).optional(),
      date: z.string().optional(),
      time: z.string().optional(),
      dayOffset: z.number().int().optional(),
      location: z.string().optional(),
      notes: z.string().optional(),
    })
    .optional(),
})

type PlannerInput = z.infer<typeof createServiceSchema>['planner']

function diffDaysInclusive(checkIn: string, target?: string | null) {
  if (!target) return 1
  const start = new Date(checkIn)
  const end = new Date(target)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 1
  }

  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate())
  const diff = Math.floor((endUtc - startUtc) / (24 * 60 * 60 * 1000))
  return diff >= 0 ? diff + 1 : 1
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const serviceId = String(body?.serviceId || '')
    const status = String(body?.status || '').toUpperCase() as ServiceStatus

    if (!serviceId || !SERVICE_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        listing: true,
        guest: true,
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const isAdmin = session.user.role === 'ADMIN'
    const isHost = booking.hostId === session.user.id

    if (!isAdmin && !isHost) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const services = Array.isArray(booking.additionalServices)
      ? [...booking.additionalServices]
      : []

    const serviceIndex = services.findIndex((service: any) => service.id === serviceId)

    if (serviceIndex === -1) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    const now = new Date().toISOString()
    const service = services[serviceIndex] ?? {}
    const previousStatus = (service.status || 'PENDING').toString().toUpperCase() as ServiceStatus

    if (previousStatus === status) {
      return NextResponse.json({
        message: 'Service status unchanged',
        booking,
        service,
      })
    }

    const transitions =
      (isAdmin ? ADMIN_SERVICE_TRANSITIONS : HOST_SERVICE_TRANSITIONS)[previousStatus] ?? []

    if (!transitions.includes(status)) {
      return NextResponse.json(
        {
          error: 'Không thể chuyển trạng thái dịch vụ',
          allowed: transitions.map((target) => ({
            value: target,
            label: STATUS_LABEL[target],
          })),
        },
        { status: 409 },
      )
    }

    services[serviceIndex] = {
      ...service,
      status,
      updatedAt: now,
      statusHistory: Array.isArray(service.statusHistory)
        ? [...service.statusHistory, { status, at: now, by: session.user.id }]
        : [{ status, at: now, by: session.user.id }],
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        additionalServices: services,
        updatedAt: new Date(),
      },
      include: {
        listing: true,
        guest: true,
        host: true,
      },
    })

    const bookingRef = updatedBooking.id.slice(-6).toUpperCase()
    const updatedService = services[serviceIndex]

    if (previousStatus !== status) {
      if (updatedBooking.guestId) {
        await notifyUser(updatedBooking.guestId, {
          type: NotificationType.SYSTEM,
          title: `Dịch vụ ${STATUS_LABEL[status]}`,
          message: `${updatedService.name || 'Dịch vụ bổ sung'} trong đơn ${bookingRef} hiện ở trạng thái "${STATUS_LABEL[status]}".`,
          link: `/trips/${updatedBooking.id}`,
          data: {
            bookingId: updatedBooking.id,
            serviceId,
            status,
          },
        })
      }

      await notifyAdmins({
        type: NotificationType.SYSTEM,
        title: 'Cập nhật dịch vụ bổ sung',
        message: `Đơn ${bookingRef} đã được cập nhật dịch vụ ${updatedService.name || serviceId} → ${STATUS_LABEL[status]}.`,
        link: `/admin/bookings?highlight=${updatedBooking.id}`,
        data: {
          bookingId: updatedBooking.id,
          serviceId,
          status,
        },
      })

      if (!isHost) {
        await notifyUser(booking.hostId, {
          type: NotificationType.SYSTEM,
          title: 'Dịch vụ bổ sung cập nhật',
          message: `Admin đã cập nhật ${updatedService.name || serviceId} trong đơn ${bookingRef} → ${STATUS_LABEL[status]}.`,
          link: `/host/bookings/${booking.id}`,
          data: {
            bookingId: booking.id,
            serviceId,
            status,
          },
        })
      }
    }

    return NextResponse.json({
      message: 'Service status updated',
      booking: updatedBooking,
      service: {
        ...updatedService,
        statusLabel: STATUS_LABEL[status],
      },
      statusLabel: STATUS_LABEL[status],
    })
  } catch (error) {
    console.error('Update service status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payloadJson = await request.json().catch(() => ({}))
    const parsedPayload = createServiceSchema.safeParse(payloadJson)

    if (!parsedPayload.success) {
      return NextResponse.json(
        { error: parsedPayload.error.errors[0]?.message ?? 'Dữ liệu không hợp lệ' },
        { status: 400 },
      )
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
            state: true,
            country: true,
          },
        },
        guest: {
          select: {
            id: true,
            loyaltyTier: true,
          },
        },
        host: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const membershipTier = session.user.membership ?? null
    const userRole = session.user.role
    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN'
    const isHost = booking.hostId === session.user.id
    const isGuest = booking.guestId === session.user.id
    const hasConciergePrivileges = isAdmin || isHost || (isGuest && membershipTier === 'DIAMOND')

    if (!hasConciergePrivileges) {
      return NextResponse.json(
        { error: 'Concierge chỉ dành cho thành viên Diamond hoặc host/admin' },
        { status: 403 },
      )
    }

    const payload = parsedPayload.data

    const resolvedServiceId = payload.serviceId ?? `svc_${randomUUID()}`
    const nowIso = new Date().toISOString()

    let catalogService: {
      name: string
      price: number | null
      currency: string
      category: string
    } | null = null

    if (payload.catalogId) {
      const service = await prisma.service.findUnique({
        where: { id: payload.catalogId },
        select: {
          name: true,
          basePrice: true,
          currency: true,
          category: true,
        },
      })
      if (service) {
        catalogService = {
          name: service.name,
          price: service.basePrice ?? null,
          currency: service.currency,
          category: service.category,
        }
      }
    }

    const totalPrice = payload.price ?? catalogService?.price ?? 0
    const currency = payload.currency ?? catalogService?.currency ?? booking.currency
    const rawType = payload.type ?? catalogService?.category ?? 'custom'
    const serviceType = typeof rawType === 'string' ? rawType.toLowerCase() : 'custom'
    const serviceName = payload.name || catalogService?.name || 'Dịch vụ concierge'

    const newService = {
      id: resolvedServiceId,
      name: serviceName,
      type: serviceType,
      status: 'PENDING',
      totalPrice,
      currency,
      quantityLabel: payload.quantityLabel,
      notes: payload.notes,
      scheduledFor: payload.scheduledFor ?? payload.pickup?.date ?? null,
      pickup: payload.pickup,
      dropoffLocation: payload.dropoffLocation,
      metadata: {
        ...payload.metadata,
        catalogId: payload.catalogId ?? payload.serviceId ?? undefined,
      },
      createdAt: nowIso,
      updatedAt: nowIso,
      requestedBy: session.user.id,
    }

    const additionalServices = Array.isArray(booking.additionalServices)
      ? [...booking.additionalServices, newService]
      : [newService]

    const plannerInput = payload.planner
    const targetDate = plannerInput?.date ?? payload.pickup?.date ?? payload.scheduledFor ?? booking.checkIn.toISOString()
    const plannerDay = plannerInput?.dayOffset !== undefined
      ? Math.max(1, plannerInput.dayOffset + 1)
      : diffDaysInclusive(booking.checkIn.toISOString(), targetDate)

    const fallbackPlannerType = (() => {
      if (serviceType.includes('dining') || serviceType.includes('restaurant')) return 'dining'
      if (serviceType.includes('shop')) return 'shopping'
      if (serviceType.includes('sight') || serviceType.includes('tour')) return 'sightseeing'
      if (serviceType.includes('stay')) return 'accommodation'
      return 'activity'
    })()

    const plannerType = plannerInput?.type ?? fallbackPlannerType
    const plannerTime = plannerInput?.time ?? payload.pickup?.time ?? '10:00'
    const plannerLocation = plannerInput?.location
      ?? payload.pickup?.location
      ?? payload.dropoffLocation
      ?? booking.listing?.address
      ?? booking.listing?.city
      ?? ''

    const plannerItem = {
      id: `planner-${resolvedServiceId}`,
      day: plannerDay,
      time: plannerTime,
      type: plannerType,
      title: serviceName,
      location: plannerLocation,
      notes: plannerInput?.notes ?? payload.notes ?? null,
      duration: payload.metadata?.duration ?? null,
      cost: totalPrice,
      currency,
      status: 'PENDING',
      createdAt: nowIso,
      serviceRef: resolvedServiceId,
    }

    const metadata: Record<string, any> = booking.metadata
      ? JSON.parse(JSON.stringify(booking.metadata))
      : {}

    const existingPlanner = (metadata.tripPlanner as Record<string, any>) ?? {}
    const plannerItems: any[] = Array.isArray(existingPlanner.items)
      ? [...existingPlanner.items, plannerItem]
      : [plannerItem]

    metadata.tripPlanner = {
      ...existingPlanner,
      items: plannerItems,
      lastUpdated: nowIso,
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        additionalServices,
        additionalServicesTotal: Number(booking.additionalServicesTotal || 0) + totalPrice,
        metadata,
        updatedAt: new Date(),
      },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            city: true,
          },
        },
        guest: {
          select: {
            id: true,
            loyaltyTier: true,
          },
        },
        host: {
          select: {
            id: true,
          },
        },
      },
    })

    const bookingRef = updatedBooking.id.slice(-6).toUpperCase()

    await notifyAdmins({
      type: NotificationType.SYSTEM,
      title: 'Yêu cầu dịch vụ mới',
      message: `Đơn ${bookingRef} vừa thêm dịch vụ "${serviceName}"`,
      link: `/admin/bookings?highlight=${updatedBooking.id}`,
      data: {
        bookingId: updatedBooking.id,
        serviceId: resolvedServiceId,
        price: totalPrice,
      },
    })

    if (booking.hostId && booking.hostId !== session.user.id) {
      await notifyUser(booking.hostId, {
        type: NotificationType.SYSTEM,
        title: 'Khách yêu cầu dịch vụ mới',
        message: `Khách đã yêu cầu "${serviceName}" cho đơn ${bookingRef}.`,
        link: `/host/bookings/${booking.id}`,
        data: {
          bookingId: booking.id,
          serviceId: resolvedServiceId,
        },
      })
    }

    return NextResponse.json({
      message: 'Đã ghi nhận yêu cầu concierge',
      service: {
        ...newService,
        statusLabel: STATUS_LABEL.PENDING,
      },
      plannerItem,
      booking: {
        id: updatedBooking.id,
        additionalServices: updatedBooking.additionalServices,
        additionalServicesTotal: updatedBooking.additionalServicesTotal,
        metadata: updatedBooking.metadata,
      },
    })
  } catch (error) {
    console.error('Create service error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
