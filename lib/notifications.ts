import { GuideStatus, NotificationType, Prisma, UserRole } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { triggerPusherEvent } from "@/lib/pusher"

type NotificationPayload = {
  type?: NotificationType
  title: string
  message: string
  link?: string | null
  data?: Prisma.JsonValue
}

const DEFAULT_TYPE: NotificationType = "SYSTEM"

const buildChannelName = (userId: string) => `private-user-${userId}-notifications`

export async function createNotificationForUser(userId: string, payload: NotificationPayload) {
  const notification = await prisma.notification.create({
    data: {
      userId,
      type: payload.type ?? DEFAULT_TYPE,
      title: payload.title,
      message: payload.message,
      link: payload.link ?? undefined,
      data: payload.data,
    },
  })

  await triggerPusherEvent(buildChannelName(userId), "notification:created", {
    notification: {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      link: notification.link,
      createdAt: notification.createdAt,
      data: notification.data,
    },
  })

  return notification
}

export async function notifyUser(userId: string, payload: NotificationPayload) {
  return createNotificationForUser(userId, payload)
}

export async function notifyUsers(userIds: string[], payload: NotificationPayload) {
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)))
  if (uniqueIds.length === 0) return
  await Promise.all(uniqueIds.map((id) => createNotificationForUser(id, payload)))
}

export async function notifyAdmins(payload: NotificationPayload) {
  const admins = await prisma.user.findMany({
    where: { role: { in: [UserRole.ADMIN, UserRole.SUPER_ADMIN] } },
    select: { id: true },
  })

  if (admins.length === 0) {
    return
  }

  await notifyUsers(
    admins.map((admin) => admin.id),
    payload,
  )
}

export async function notifyHosts(payload: NotificationPayload) {
  const hosts = await prisma.user.findMany({
    where: { role: UserRole.HOST },
    select: { id: true },
  })

  if (hosts.length === 0) return
  await notifyUsers(
    hosts.map((host) => host.id),
    payload,
  )
}

export async function notifyGuests(payload: NotificationPayload) {
  const guests = await prisma.user.findMany({
    where: { role: UserRole.GUEST },
    select: { id: true },
  })

  if (guests.length === 0) return
  await notifyUsers(
    guests.map((guest) => guest.id),
    payload,
  )
}

export async function notifyGuides(payload: NotificationPayload, options?: { onlyApproved?: boolean }) {
  const guideProfiles = await prisma.guideProfile.findMany({
    where: options?.onlyApproved ? { status: GuideStatus.ACTIVE } : undefined,
    select: { userId: true },
  })

  if (guideProfiles.length === 0) return
  await notifyUsers(
    guideProfiles.map((guide) => guide.userId),
    payload,
  )
}
