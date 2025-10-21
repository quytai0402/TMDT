import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/user/notifications - Get notification settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's notification preferences (stored in user model or separate table)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        emailVerified: true,
        // Notification preferences would be stored here if schema has them
      },
    })

    // Return default settings for now
    const settings = {
      emailNotifications: true,
      smsNotifications: false,
      bookingUpdates: true,
      promotions: false,
      messageNotifications: true,
      reviewNotifications: true,
    }

    return NextResponse.json(settings)
  } catch (error: any) {
    console.error('Error fetching notification settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// PUT /api/user/notifications - Update notification settings
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await req.json()

    // In a real implementation, you would save these to database
    // For now, just return success
    console.log('Notification settings updated for user:', session.user.id, settings)

    return NextResponse.json({
      success: true,
      settings,
    })
  } catch (error: any) {
    console.error('Error updating notification settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
