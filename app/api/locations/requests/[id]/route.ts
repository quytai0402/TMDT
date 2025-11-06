import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notifyUser } from '@/lib/notifications'
import { NotificationType } from '@prisma/client'

// PATCH - Approve or reject location request
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can approve/reject
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { action, rejectionReason } = body

    if (!['APPROVED', 'REJECTED'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const request = await prisma.locationRequest.findUnique({
      where: { id },
      include: {
        requestedByUser: true,
      },
    })

    if (!request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    if (request.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Request has already been processed' },
        { status: 400 }
      )
    }

    // Update request status
    const updatedRequest = await prisma.locationRequest.update({
      where: { id },
      data: {
        status: action,
        approvedBy: session.user.id,
        approvedAt: new Date(),
        rejectionReason: action === 'REJECTED' ? rejectionReason : null,
      },
    })

    // If approved, create the location
    if (action === 'APPROVED') {
      await prisma.location.create({
        data: {
          city: request.city,
          state: request.state,
          country: request.country,
          isActive: true,
        },
      })

      // Notify host
      await notifyUser(request.requestedBy, {
        type: NotificationType.SYSTEM,
        title: 'Khu vực được phê duyệt',
        message: `Yêu cầu khu vực ${request.city}, ${request.state} đã được phê duyệt. Bạn có thể bắt đầu đăng listing tại đây.`,
        link: '/host/listings/create',
        data: {
          requestId: request.id,
          city: request.city,
          state: request.state,
          country: request.country,
        },
      })
    } else {
      // Notify host about rejection
      await notifyUser(request.requestedBy, {
        type: NotificationType.SYSTEM,
        title: 'Yêu cầu khu vực bị từ chối',
        message: `Yêu cầu khu vực ${request.city}, ${request.state} đã bị từ chối. ${rejectionReason ? `Lý do: ${rejectionReason}` : ''}`,
        link: '/host/listings/create',
        data: {
          requestId: request.id,
          rejectionReason,
        },
      })
    }

    return NextResponse.json({
      request: updatedRequest,
      message: `Location request ${action.toLowerCase()} successfully`,
    })
  } catch (error) {
    console.error('Error updating location request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
