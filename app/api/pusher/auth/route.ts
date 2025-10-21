import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { pusherServer } from '@/lib/pusher'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.text()
    const params = new URLSearchParams(body)
    const socketId = params.get('socket_id')!
    const channel = params.get('channel_name')!

    // Verify user has access to this channel
    const userId = session.user.id
    if (!channel.includes(userId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const authResponse = pusherServer.authorizeChannel(socketId, channel, {
      user_id: userId,
      user_info: {
        name: session.user.name,
        email: session.user.email,
      },
    })

    return NextResponse.json(authResponse)
  } catch (error) {
    console.error('Pusher auth error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
