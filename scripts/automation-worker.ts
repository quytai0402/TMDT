import { AutomationMessageStatus, AutomationMessageTrigger, BookingStatus, Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { sendAutomationMessageForBooking } from "@/lib/host/automation"

type BookingWithRelations = Prisma.BookingGetPayload<{
  include: { listing: true; guest: true; host: true }
}>

type ScheduledMessageWithTemplate = Prisma.HostScheduledMessageGetPayload<{
  include: { template: true }
}>

const GRACE_PERIOD_MINUTES = Number(process.env.AUTOMATION_WORKER_GRACE_MINUTES ?? 10)
const BOOKING_WINDOW_DAYS = Number(process.env.AUTOMATION_WORKER_WINDOW_DAYS ?? 14)

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000)
}

function computeScheduledAt(booking: BookingWithRelations, message: ScheduledMessageWithTemplate) {
  const offset = message.offsetMinutes ?? 0
  let referenceDate: Date | null = null

  switch (message.trigger) {
    case AutomationMessageTrigger.BEFORE_CHECK_IN:
    case AutomationMessageTrigger.CHECK_IN:
    case AutomationMessageTrigger.DURING_STAY:
      referenceDate = booking.checkIn
      break
    case AutomationMessageTrigger.CHECK_OUT:
    case AutomationMessageTrigger.AFTER_CHECK_OUT:
      referenceDate = booking.checkOut
      break
    case AutomationMessageTrigger.CUSTOM_TIME:
      referenceDate = booking.confirmedAt ?? booking.createdAt
      break
    default:
      referenceDate = booking.confirmedAt ?? booking.createdAt
      break
  }

  if (!referenceDate) {
    return null
  }

  return addMinutes(referenceDate, offset)
}

async function fetchCandidateBookings(hostId: string) {
  const now = new Date()
  const windowStart = new Date(now.getTime() - BOOKING_WINDOW_DAYS * 24 * 60 * 60 * 1000)
  const windowEnd = new Date(now.getTime() + BOOKING_WINDOW_DAYS * 24 * 60 * 60 * 1000)

  return prisma.booking.findMany({
    where: {
      hostId,
      status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
      OR: [
        { checkIn: { gte: windowStart, lte: windowEnd } },
        { checkOut: { gte: windowStart, lte: windowEnd } },
      ],
    },
    include: {
      listing: true,
      guest: true,
      host: true,
    },
  })
}

async function alreadyDispatched(bookingId: string, scheduledMessageId: string) {
  const existing = await prisma.automationDeliveryLog.findUnique({
    where: {
      bookingId_scheduledMessageId: {
        bookingId,
        scheduledMessageId,
      },
    },
  })

  return Boolean(existing)
}

async function logDelivery(
  booking: BookingWithRelations,
  scheduledMessage: ScheduledMessageWithTemplate,
  error?: string,
) {
  try {
    await prisma.automationDeliveryLog.create({
      data: {
        hostId: booking.hostId,
        bookingId: booking.id,
        scheduledMessageId: scheduledMessage.id,
        templateId: scheduledMessage.templateId ?? undefined,
        trigger: scheduledMessage.trigger,
        error: error ? error.slice(0, 500) : undefined,
      },
    })
  } catch (logError) {
    console.error("Failed to log automation delivery", logError)
  }
}

async function processScheduledMessage(message: ScheduledMessageWithTemplate) {
  if (!message.templateId || !message.template) return

  const bookings = await fetchCandidateBookings(message.hostId)
  if (!bookings.length) {
    return
  }

  const now = new Date()
  const windowStart = addMinutes(now, -GRACE_PERIOD_MINUTES)

  for (const booking of bookings) {
    const scheduledAt = computeScheduledAt(booking, message)
    if (!scheduledAt) {
      continue
    }

    if (scheduledAt > now || scheduledAt < windowStart) {
      continue
    }

    const dispatched = await alreadyDispatched(booking.id, message.id)
    if (dispatched) {
      continue
    }

    try {
      await sendAutomationMessageForBooking(booking, message.trigger, { scheduledMessageId: message.id })
      await logDelivery(booking, message)
      console.info(
        `[automation-worker] Sent ${message.name} to booking ${booking.id} (${booking.checkIn.toISOString()})`,
      )
    } catch (error) {
      const messageText = error instanceof Error ? error.message : "Unknown error"
      await logDelivery(booking, message, messageText)
      console.error(
        `[automation-worker] Failed to send ${message.name} to booking ${booking.id}:`,
        error,
      )
    }
  }
}

async function cleanupAutomationLogs() {
  const retentionDays = Number(process.env.AUTOMATION_LOG_RETENTION_DAYS ?? 90)
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)
  await prisma.automationDeliveryLog.deleteMany({
    where: {
      sentAt: { lt: cutoff },
    },
  })
}

async function run() {
  const scheduledMessages = await prisma.hostScheduledMessage.findMany({
    where: {
      status: AutomationMessageStatus.ACTIVE,
      templateId: { not: null },
      trigger: { not: AutomationMessageTrigger.BOOKING_CONFIRMED },
    },
    include: {
      template: true,
    },
  })

  for (const message of scheduledMessages) {
    await processScheduledMessage(message)
  }

  await cleanupAutomationLogs()
}

run()
  .catch((error) => {
    console.error("[automation-worker] Unhandled error", error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
