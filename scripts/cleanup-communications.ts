import { MessageType } from "@prisma/client"
import { prisma } from "@/lib/prisma"

const NOTIFICATION_RETENTION_DAYS = Number(process.env.NOTIFICATION_RETENTION_DAYS ?? 120)
const MESSAGE_RETENTION_DAYS = Number(process.env.MESSAGE_RETENTION_DAYS ?? 365)

async function cleanupNotifications() {
  const cutoff = new Date(Date.now() - NOTIFICATION_RETENTION_DAYS * 24 * 60 * 60 * 1000)
  const deleted = await prisma.notification.deleteMany({
    where: {
      isRead: true,
      readAt: { lt: cutoff },
    },
  })
  console.info(`[cleanup] Deleted ${deleted.count} read notifications older than ${NOTIFICATION_RETENTION_DAYS} days`)
}

async function cleanupMessages() {
  const cutoff = new Date(Date.now() - MESSAGE_RETENTION_DAYS * 24 * 60 * 60 * 1000)

  const inactiveConversations = await prisma.conversation.findMany({
    where: {
      lastMessageAt: { lt: cutoff },
    },
    select: { id: true },
  })

  const conversationIds = inactiveConversations.map((conv) => conv.id)
  if (!conversationIds.length) {
    return
  }

  const deletedMessages = await prisma.message.deleteMany({
    where: {
      conversationId: { in: conversationIds },
      createdAt: { lt: cutoff },
      messageType: { notIn: [MessageType.SYSTEM] },
    },
  })

  await prisma.conversation.deleteMany({
    where: {
      id: { in: conversationIds },
      messages: { none: {} },
    },
  })

  console.info(`[cleanup] Deleted ${deletedMessages.count} old messages across ${conversationIds.length} conversations`)
}

async function run() {
  await cleanupNotifications()
  await cleanupMessages()
}

run()
  .catch((error) => {
    console.error("[cleanup] Failed to purge messaging data", error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
