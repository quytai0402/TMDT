import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

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
