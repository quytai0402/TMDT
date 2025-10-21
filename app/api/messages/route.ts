import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getConversationId, triggerPusherEvent } from '@/lib/pusher'
import { z } from 'zod'

const sendMessageSchema = z.object({
  receiverId: z.string(),
  content: z.string().min(1, 'Message cannot be empty'),
  bookingId: z.string().optional(),
  messageType: z.enum(['TEXT', 'IMAGE', 'FILE', 'AUTOMATED', 'SYSTEM']).optional(),
  attachments: z.array(z.string()).optional(),
})

// GET conversations
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const conversationId = searchParams.get('conversationId')

    if (conversationId) {
      // Get messages for a specific conversation
      const messages = await prisma.message.findMany({
        where: { conversationId },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          booking: {
            select: {
              id: true,
              listing: {
                select: {
                  title: true,
                  images: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      })

      // Mark as read
      await prisma.message.updateMany({
        where: {
          conversationId,
          senderId: { not: session.user.id },
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      })

      return NextResponse.json({ messages })
    }

    // Get all conversations for user
    const messages = await prisma.message.findMany({
      where: {
        conversationId: {
          contains: session.user.id,
        },
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Group by conversation and get latest message
    const conversationsMap = new Map()
    
    messages.forEach(message => {
      if (!conversationsMap.has(message.conversationId)) {
        conversationsMap.set(message.conversationId, {
          conversationId: message.conversationId,
          lastMessage: message,
          unreadCount: 0,
        })
      }

      // Count unread
      if (!message.isRead && message.senderId !== session.user.id) {
        const conv = conversationsMap.get(message.conversationId)
        conv.unreadCount++
      }
    })

    const conversations = Array.from(conversationsMap.values())

    return NextResponse.json({ conversations })
  } catch (error) {
    console.error('Get messages error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// SEND message
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = sendMessageSchema.parse(body)

    // Get receiver info
    const receiver = await prisma.user.findUnique({
      where: { id: validatedData.receiverId },
    })

    if (!receiver) {
      return NextResponse.json({ error: 'Receiver not found' }, { status: 404 })
    }

    // Create conversation ID
    const conversationId = getConversationId(session.user.id, validatedData.receiverId)

    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: session.user.id,
        content: validatedData.content,
        bookingId: validatedData.bookingId,
        messageType: validatedData.messageType || 'TEXT',
        attachments: validatedData.attachments || [],
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    })

    // Trigger Pusher event
    await triggerPusherEvent(
      `private-${conversationId}`,
      'new-message',
      message
    )

    // Send notification
    await prisma.notification.create({
      data: {
        userId: validatedData.receiverId,
        type: 'MESSAGE_RECEIVED',
        title: 'Tin nhắn mới',
        message: `${session.user.name}: ${validatedData.content.substring(0, 50)}${validatedData.content.length > 50 ? '...' : ''}`,
        link: `/messages/${conversationId}`,
      },
    })

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    console.error('Send message error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
