import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema validation
const createConversationSchema = z.object({
  participantId: z.string().min(1, 'Participant ID is required'),
  listingId: z.string().optional(),
})

// GET - Fetch user's conversations
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Fetch conversations where user is a participant
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          has: userId,
        },
      },
      include: {
        messages: {
          take: 1,
          orderBy: {
            createdAt: 'desc',
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
        },
      },
      orderBy: {
        lastMessageAt: 'desc',
      },
    })

    // Enrich with other participant info and listing info
    const enrichedConversations = await Promise.all(
      conversations.map(async (conversation) => {
        // Get other participant
        const otherParticipantId = conversation.participants.find(
          (id) => id !== userId
        )
        
        let otherParticipant = null
        if (otherParticipantId) {
          otherParticipant = await prisma.user.findUnique({
            where: { id: otherParticipantId },
            select: {
              id: true,
              name: true,
              image: true,
              isVerified: true,
              role: true,
            },
          })
        }

        // Get listing info if exists
        let listing = null
        if (conversation.listingId) {
          listing = await prisma.listing.findUnique({
            where: { id: conversation.listingId },
            select: {
              id: true,
              title: true,
              images: true,
            },
          })
        }

        // Calculate unread count for current user
        const unreadCount = conversation.unreadCount as any
        const userUnreadCount = unreadCount?.[userId] || 0

        return {
          id: conversation.id,
          participants: conversation.participants,
          otherParticipant,
          listing,
          lastMessage: conversation.lastMessage,
          lastMessageAt: conversation.lastMessageAt,
          unreadCount: userUnreadCount,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
        }
      })
    )

    return NextResponse.json({
      conversations: enrichedConversations,
    })
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}

// POST - Create or get existing conversation
export async function POST(req: NextRequest) {
  try {
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
    const validation = createConversationSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { participantId, listingId } = validation.data

    // Check if user is trying to create conversation with themselves
    if (participantId === userId) {
      return NextResponse.json(
        { error: 'Cannot create conversation with yourself' },
        { status: 400 }
      )
    }

    // Check if other user exists
    const otherUser = await prisma.user.findUnique({
      where: { id: participantId },
      select: {
        id: true,
        name: true,
        image: true,
        isVerified: true,
        role: true,
      },
    })

    if (!otherUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if conversation already exists between these users
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          {
            participants: {
              has: userId,
            },
          },
          {
            participants: {
              has: participantId,
            },
          },
        ],
      },
    })

    if (existingConversation) {
      // Return existing conversation
      let listing = null
      if (existingConversation.listingId) {
        listing = await prisma.listing.findUnique({
          where: { id: existingConversation.listingId },
          select: {
            id: true,
            title: true,
            images: true,
          },
        })
      }

      return NextResponse.json({
        conversation: {
          ...existingConversation,
          otherParticipant: otherUser,
          listing,
        },
        isNew: false,
      })
    }

    // Create new conversation
    const newConversation = await prisma.conversation.create({
      data: {
        participants: [userId, participantId],
        listingId: listingId || null,
        unreadCount: {
          [userId]: 0,
          [participantId]: 0,
        },
      },
    })

    // Get listing info if provided
    let listing = null
    if (listingId) {
      listing = await prisma.listing.findUnique({
        where: { id: listingId },
        select: {
          id: true,
          title: true,
          images: true,
        },
      })
    }

    return NextResponse.json({
      conversation: {
        ...newConversation,
        otherParticipant: otherUser,
        listing,
      },
      isNew: true,
    })
  } catch (error) {
    console.error('Error creating conversation:', error)
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    )
  }
}
