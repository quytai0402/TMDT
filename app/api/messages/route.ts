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
        select: {
          id: true,
          content: true,
          messageType: true,
          attachments: true,
          isRead: true,
          readAt: true,
          createdAt: true,
          senderId: true,
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

    // Get all conversations for user from Conversation model
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          has: session.user.id,
        },
      },
      select: {
        id: true,
        participants: true,
        listingId: true,
        lastMessage: true,
        lastMessageAt: true,
        unreadCount: true,
        createdAt: true,
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            content: true,
            messageType: true,
            isRead: true,
            createdAt: true,
            senderId: true,
            sender: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    })

    // Format conversations
    const formattedConversations = conversations.map(conv => {
      const otherParticipantId = conv.participants.find(p => p !== session.user.id)
      const lastMsg = conv.messages[0]
      
      return {
        conversationId: conv.id,
        participants: conv.participants,
        lastMessage: lastMsg || null,
        unreadCount: conv.unreadCount ? (conv.unreadCount as any)[session.user.id] || 0 : 0,
        createdAt: conv.createdAt,
      }
    })

    return NextResponse.json({ conversations: formattedConversations })
  } catch (error) {
    console.error('Get messages error:', error)
    
    // Return proper error format that the hook expects
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        conversations: [],
        messages: []
      }, 
      { status: 500 }
    )
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
