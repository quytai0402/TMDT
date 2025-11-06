import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notifyAdmins } from '@/lib/notifications'
import { NotificationType } from '@prisma/client'

interface LocationRequest {
  city: string
  state: string
  country: string
  reason: string
}

// GET - List all location requests
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isAdmin = session.user.role === 'ADMIN'
    
    const where = isAdmin 
      ? {} // Admin sees all
      : { requestedBy: session.user.id } // Host sees only their requests

    const requests = await prisma.locationRequest.findMany({
      where,
      include: {
        requestedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        approvedByUser: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ requests })
  } catch (error) {
    console.error('Error fetching location requests:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new location request
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only hosts can request new locations
    if (session.user.role !== 'HOST' && !session.user.isHost) {
      return NextResponse.json(
        { error: 'Only hosts can request new locations' },
        { status: 403 }
      )
    }

    const body: LocationRequest = await req.json()

    // Validate required fields
    if (!body.city || !body.state || !body.country || !body.reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if location already exists
    const existingLocation = await prisma.location.findFirst({
      where: {
        city: body.city,
        state: body.state,
        country: body.country,
      },
    })

    if (existingLocation) {
      return NextResponse.json(
        { error: 'This location already exists in our system' },
        { status: 409 }
      )
    }

    // Check for duplicate pending request
    const pendingRequest = await prisma.locationRequest.findFirst({
      where: {
        city: body.city,
        state: body.state,
        country: body.country,
        status: 'PENDING',
      },
    })

    if (pendingRequest) {
      return NextResponse.json(
        { error: 'There is already a pending request for this location' },
        { status: 409 }
      )
    }

    // Create location request
    const request = await prisma.locationRequest.create({
      data: {
        city: body.city,
        state: body.state,
        country: body.country,
        reason: body.reason,
        requestedBy: session.user.id,
        status: 'PENDING',
      },
      include: {
        requestedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Notify admins
    await notifyAdmins({
      type: NotificationType.SYSTEM,
      title: 'Yêu cầu khu vực mới',
      message: `${request.requestedByUser?.name || 'Host'} muốn đăng listing tại ${body.city}, ${body.state}, ${body.country}. Lý do: ${body.reason}`,
      link: '/admin/locations',
      data: {
        requestId: request.id,
        city: body.city,
        state: body.state,
        country: body.country,
      },
    })

    return NextResponse.json({
      request,
      message: 'Location request submitted successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating location request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
