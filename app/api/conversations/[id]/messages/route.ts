import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { pusherServer } from '@/lib/pusher'
import { notifyUser } from '@/lib/notifications'

const objectIdRegex = /^[a-f\d]{24}$/i
const isValidObjectId = (value: string) => objectIdRegex.test(value)

// Schema validation
const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required').max(2000, 'Message too long'),
  messageType: z.enum(['TEXT', 'IMAGE', 'FILE', 'AUTOMATED', 'SYSTEM']).optional(),
  attachments: z.array(z.string()).optional(),
})

// GET - Fetch messages for a conversation
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params
    if (!conversationId || !isValidObjectId(conversationId)) {
      return NextResponse.json({ error: 'Invalid conversation id' }, { status: 400 })
    }
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Check if conversation exists and user is a participant
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    })

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    if (!conversation.participants.includes(userId)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Fetch messages
    const messages = await prisma.message.findMany({
      where: {
        conversationId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
            isVerified: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    // Mark unread messages as read
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: {
          not: userId,
        },
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    })

    // Reset unread count for current user
    const unreadCount = conversation.unreadCount as any || {}
    unreadCount[userId] = 0
    
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        unreadCount,
      },
    })

    return NextResponse.json({
      messages,
    })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

// POST - Send a new message
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params
    if (!conversationId || !isValidObjectId(conversationId)) {
      return NextResponse.json({ error: 'Invalid conversation id' }, { status: 400 })
    }
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const body = await req.json()

    // Validate request
    const validation = sendMessageSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { content, messageType = 'TEXT', attachments = [] } = validation.data

    // Check if conversation exists and user is a participant
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    })

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    if (!conversation.participants.includes(userId)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content,
        messageType,
        attachments,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
            isVerified: true,
            role: true,
          },
        },
      },
    })

    // Get other participant ID
    const otherParticipantId = conversation.participants.find(
      (id) => id !== userId
    )

    // Update conversation metadata
    const unreadCount = conversation.unreadCount as any || {}
    if (otherParticipantId) {
      unreadCount[otherParticipantId] = (unreadCount[otherParticipantId] || 0) + 1
    }

    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessage: content.substring(0, 100),
        lastMessageAt: new Date(),
        unreadCount,
      },
    })

    // Trigger Pusher event for realtime delivery
    try {
      await pusherServer.trigger(`conversation-${conversationId}`, 'new-message', {
        message,
      })

      // Also trigger event for other user's inbox
      if (otherParticipantId) {
        await pusherServer.trigger(`user-${otherParticipantId}`, 'new-conversation-message', {
          conversationId,
          message,
        })
      }
    } catch (pusherError) {
      console.error('Pusher error:', pusherError)
      // Don't fail the request if Pusher fails
    }

    if (otherParticipantId) {
      const otherUser = await prisma.user.findUnique({
        where: { id: otherParticipantId },
        select: { role: true, name: true },
      })

      const link =
        otherUser?.role === 'HOST'
          ? `/host/messages?conversation=${conversationId}`
          : `/messages?conversation=${conversationId}`

      await notifyUser(otherParticipantId, {
        type: 'MESSAGE_RECEIVED',
        title: `${message.sender?.name ?? 'Khách LuxeStay'} vừa gửi tin nhắn`,
        message: content.slice(0, 140),
        link,
        data: {
          conversationId,
        },
      })
    }

    return NextResponse.json({
      message,
    })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
