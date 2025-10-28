import { Prisma, LiveChatStatus } from "@prisma/client"
import { prisma } from "@/lib/prisma"

type Transaction = Prisma.TransactionClient

type CreateSessionInput = {
  userId?: string | null
  userName?: string | null
  userEmail?: string | null
  metadata?: Prisma.JsonValue
}

type AppendMessageInput = {
  sessionId: string
  sender: "user" | "admin" | "system"
  content: string
  metadata?: Prisma.JsonValue
}

const DEFAULT_QUEUE_POSITION = 1

async function recalculateQueuePositions(tx: Transaction = prisma) {
  const waitingSessions = await tx.liveChatSession.findMany({
    where: { status: LiveChatStatus.WAITING },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  })

  await Promise.all(
    waitingSessions.map((session, index) =>
      tx.liveChatSession.update({
        where: { id: session.id },
        data: { queuePosition: index + DEFAULT_QUEUE_POSITION },
      }),
    ),
  )
}

export async function createLiveChatSession(input: CreateSessionInput) {
  const { userId, userEmail } = input

  const existing = await prisma.liveChatSession.findFirst({
    where: {
      status: { in: [LiveChatStatus.WAITING, LiveChatStatus.CONNECTED] },
      OR: [
        userId ? { userId } : undefined,
        userEmail ? { userEmail } : undefined,
      ].filter(Boolean) as Prisma.LiveChatSessionWhereInput[],
    },
  })

  if (existing) {
    return prisma.liveChatSession.update({
      where: { id: existing.id },
      data: {
        userName: input.userName ?? existing.userName,
        userEmail: input.userEmail ?? existing.userEmail,
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    })
  }

  return prisma.$transaction(async (tx) => {
    const queueBase = await tx.liveChatSession.count({
      where: { status: LiveChatStatus.WAITING },
    })

    const session = await tx.liveChatSession.create({
      data: {
        userId: userId ?? undefined,
        userName: input.userName ?? null,
        userEmail: input.userEmail ?? null,
        status: LiveChatStatus.WAITING,
        queuePosition: queueBase + DEFAULT_QUEUE_POSITION,
        metadata: input.metadata ?? undefined,
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    })

    return session
  })
}

export async function getLiveChatSession(sessionId: string) {
  return prisma.liveChatSession.findUnique({
    where: { id: sessionId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  })
}

export async function listLiveChatSessions(status?: LiveChatStatus) {
  return prisma.liveChatSession.findMany({
    where: status ? { status } : undefined,
    orderBy: [
      { status: "asc" },
      { createdAt: "asc" },
    ],
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  })
}

export async function appendLiveChatMessage(input: AppendMessageInput) {
  const session = await prisma.liveChatSession.findUnique({
    where: { id: input.sessionId },
  })

  if (!session) {
    throw new Error("Session not found")
  }

  const now = new Date()

  const newStatus =
    input.sender === "admin" && session.status === LiveChatStatus.WAITING
      ? LiveChatStatus.CONNECTED
      : session.status

  const [message] = await prisma.$transaction(async (tx) => {
    const createdMessage = await tx.liveChatMessage.create({
      data: {
        sessionId: input.sessionId,
        sender: input.sender,
        content: input.content,
        metadata: input.metadata,
      },
    })

    await tx.liveChatSession.update({
      where: { id: input.sessionId },
      data: {
        status: newStatus,
        connectedAt:
          newStatus === LiveChatStatus.CONNECTED && !session.connectedAt
            ? now
            : session.connectedAt,
        queuePosition:
          newStatus === LiveChatStatus.CONNECTED ? null : session.queuePosition,
        updatedAt: now,
      },
    })

    if (newStatus === LiveChatStatus.CONNECTED && session.status === LiveChatStatus.WAITING) {
      await recalculateQueuePositions(tx)
    }

    return [createdMessage]
  })

  return message
}

export async function endLiveChatSession(sessionId: string, endedBy: "user" | "admin") {
  const session = await prisma.liveChatSession.findUnique({
    where: { id: sessionId },
  })

  if (!session) {
    throw new Error("Session not found")
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.liveChatSession.update({
      where: { id: sessionId },
      data: {
        status: LiveChatStatus.ENDED,
        endedAt: new Date(),
        queuePosition: null,
        metadata: {
          ...(typeof session.metadata === "object" && session.metadata !== null ? session.metadata : {}),
          endedBy,
        },
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    })

    await recalculateQueuePositions(tx)

    return updated
  })
}

export async function connectLiveChatSession(sessionId: string, adminId: string) {
  const session = await prisma.liveChatSession.findUnique({
    where: { id: sessionId },
  })

  if (!session) {
    throw new Error("Session not found")
  }

  if (session.status === LiveChatStatus.ENDED) {
    return session
  }

  const adminUser = await prisma.user.findUnique({
    where: { id: adminId },
    select: {
      id: true,
      name: true,
      image: true,
    },
  })

  return prisma.$transaction(async (tx) => {
    const metadata =
      typeof session.metadata === "object" && session.metadata !== null
        ? { ...(session.metadata as Record<string, unknown>) }
        : {}

    metadata.lastAssignedAdminId = adminUser?.id ?? adminId
    if (adminUser?.name) {
      metadata.lastAssignedAdminName = adminUser.name
    }
    if (adminUser?.image) {
      metadata.lastAssignedAdminAvatar = adminUser.image
    }

    const updated = await tx.liveChatSession.update({
      where: { id: sessionId },
      data: {
        status: LiveChatStatus.CONNECTED,
        connectedAt: session.connectedAt ?? new Date(),
        queuePosition: null,
        metadata,
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    })

    await recalculateQueuePositions(tx)

    return updated
  })
}

export async function getLiveChatMessages(sessionId: string, since?: Date) {
  return prisma.liveChatMessage.findMany({
    where: {
      sessionId,
      createdAt: since ? { gt: since } : undefined,
    },
    orderBy: { createdAt: "asc" },
  })
}

export async function deleteLiveChatSession(sessionId: string) {
  await prisma.liveChatMessage.deleteMany({ where: { sessionId } })
  await prisma.liveChatSession.delete({ where: { id: sessionId } })
  await recalculateQueuePositions()
}
