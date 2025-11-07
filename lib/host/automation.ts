import { prisma } from "@/lib/prisma"
import {
  AutomationMessageStatus,
  AutomationMessageTrigger,
  AutomationRecipientScope,
  type AutomationTemplateCategory,
} from "@prisma/client"

interface HostContextDetails {
  propertyName: string
  propertyAddress: string
  city: string
  checkInTime: string
  checkOutTime: string
  wifiName?: string | null
  wifiPassword?: string | null
  hostName?: string | null
  hostPhone?: string | null
}

const TEMPLATE_CATEGORIES = {
  WELCOME: "WELCOME",
  CHECKIN: "CHECKIN",
  CHECKOUT: "CHECKOUT",
  FAQ: "FAQ",
  REMINDER: "REMINDER",
  CUSTOM: "CUSTOM",
} as const satisfies Record<string, AutomationTemplateCategory>

const templateVariablesByCategory: Record<AutomationTemplateCategory, string[]> = {
  [TEMPLATE_CATEGORIES.WELCOME]: [
    "guestName",
    "propertyName",
    "checkInDate",
    "checkInTime",
    "checkOutDate",
    "checkOutTime",
    "guestCount",
    "bookingId",
    "hostName",
  ],
  [TEMPLATE_CATEGORIES.CHECKIN]: [
    "guestName",
    "propertyName",
    "propertyAddress",
    "checkInTime",
    "hostPhone",
    "doorCode",
    "wifiName",
    "wifiPassword",
    "parkingInstructions",
    "hostName",
  ],
  [TEMPLATE_CATEGORIES.CHECKOUT]: [
    "guestName",
    "propertyName",
    "checkOutTime",
    "reviewLink",
    "discountCode",
    "hostName",
  ],
  [TEMPLATE_CATEGORIES.FAQ]: [
    "guestName",
    "propertyName",
    "maxGuests",
    "emergencyPhone",
    "wasteLocation",
    "hostName",
  ],
  [TEMPLATE_CATEGORIES.REMINDER]: [
    "guestName",
    "checkInDate",
    "checkInTime",
    "propertyAddress",
    "guestCount",
    "hostPhone",
    "hostName",
  ],
  [TEMPLATE_CATEGORIES.CUSTOM]: [],
}

function composeAddress(listing: {
  address?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
}) {
  const chunks = [listing.address, listing.city, listing.state, listing.country]
    .filter((value): value is string => Boolean(value && value.trim()))
  return chunks.join(", ")
}

async function resolveHostContext(hostId: string): Promise<HostContextDetails> {
  const host = await prisma.user.findUnique({
    where: { id: hostId },
    select: {
      name: true,
      phone: true,
      listings: {
        orderBy: { createdAt: "asc" },
        take: 1,
        select: {
          id: true,
          title: true,
          address: true,
          city: true,
          state: true,
          country: true,
          checkInTime: true,
          checkOutTime: true,
          wifiName: true,
          wifiPassword: true,
        },
      },
    },
  })

  const primaryListing = host?.listings?.[0]

  return {
    propertyName: primaryListing?.title || "Homestay của bạn",
    propertyAddress: primaryListing ? composeAddress(primaryListing) : "",
    city: primaryListing?.city || "",
    checkInTime: primaryListing?.checkInTime || "14:00",
    checkOutTime: primaryListing?.checkOutTime || "11:00",
    wifiName: primaryListing?.wifiName,
    wifiPassword: primaryListing?.wifiPassword,
    hostName: host?.name,
    hostPhone: host?.phone,
  }
}

export async function ensureHostAutomationSeed(hostId: string) {
  const [templateCount, replyCount, scheduledCount] = await prisma.$transaction([
    prisma.hostMessageTemplate.count({ where: { hostId } }),
    prisma.hostSavedReply.count({ where: { hostId } }),
    prisma.hostScheduledMessage.count({ where: { hostId } }),
  ])

  if (templateCount && replyCount && scheduledCount) {
    return
  }

  const context = await resolveHostContext(hostId)

  const seededTemplates = templateCount
    ? await prisma.hostMessageTemplate.findMany({ where: { hostId } })
    : await seedTemplates(hostId, context)

  if (!replyCount) {
    await seedSavedReplies(hostId, context)
  }

  if (!scheduledCount) {
    await seedScheduledMessages(hostId, context, seededTemplates)
  }
}

async function seedTemplates(hostId: string, context: HostContextDetails) {
  const templatesData = [
    {
      name: "Chào mừng khách mới",
      category: TEMPLATE_CATEGORIES.WELCOME,
      subject: `Chào mừng đến với ${context.propertyName}!`,
      content: `Xin chào {{guestName}}!\n\nCảm ơn bạn đã đặt phòng tại ${context.propertyName}. Chúng tôi rất vui được chào đón bạn tại ${context.city}.\n\nChi tiết đặt phòng:\n• Check-in: {{checkInDate}} lúc {{checkInTime}}\n• Check-out: {{checkOutDate}} lúc {{checkOutTime}}\n• Số khách: {{guestCount}} người\n• Mã đặt phòng: {{bookingId}}\n\nNếu cần hỗ trợ gì thêm, cứ nhắn cho ${context.hostName || "mình"} nhé!`,
    },
    {
      name: "Hướng dẫn nhận phòng",
      category: TEMPLATE_CATEGORIES.CHECKIN,
      subject: `Hướng dẫn nhận phòng tại ${context.propertyName}`,
      content: `Xin chào {{guestName}},\n\nĐể nhận phòng thuận tiện, bạn vui lòng lưu ý:\n• Địa chỉ: ${context.propertyAddress}\n• Giờ nhận phòng: {{checkInTime}}\n• Liên hệ khi đến: ${context.hostPhone || "(cập nhật số điện thoại)"}\n• Mã cửa: {{doorCode}}\n\nWiFi: ${context.wifiName || "(tên mạng)"} / ${context.wifiPassword || "(mật khẩu)"}\nChỗ đỗ xe: {{parkingInstructions}}\n\nChúc bạn chuyến đi vui vẻ!`,
    },
    {
      name: "Cảm ơn & nhắc đánh giá",
      category: TEMPLATE_CATEGORIES.CHECKOUT,
      subject: `Cảm ơn bạn đã lưu trú tại ${context.propertyName}`,
      content: `Xin chào {{guestName}},\n\nCảm ơn bạn đã chọn ${context.propertyName} cho kỳ nghỉ vừa rồi. ${context.hostName || "Mình"} hy vọng bạn đã có trải nghiệm tuyệt vời.\n\n👉 Đừng quên để lại đánh giá tại {{reviewLink}} nhé.\n🎁 Tặng bạn mã {{discountCode}} giảm 15% cho lần đặt tiếp theo.\n\nHẹn gặp lại bạn sớm!`,
    },
    {
      name: "Checklist trước 24h",
      category: TEMPLATE_CATEGORIES.REMINDER,
      subject: `Nhắc nhở trước khi check-in tại ${context.propertyName}`,
      content: `Xin chào {{guestName}},\n\nChỉ còn 24h nữa là đến ngày nhận phòng của bạn tại ${context.propertyName}.\n\nChecklist:\n□ Xác nhận giờ đến: {{checkInTime}}\n□ Số khách: {{guestCount}}\n□ Liên hệ host: ${context.hostPhone || "(cập nhật số)"}\n□ Địa chỉ: ${context.propertyAddress}\n\nHẹn gặp bạn tại ${context.city}!`,
    },
    {
      name: "FAQ & nội quy",
      category: TEMPLATE_CATEGORIES.FAQ,
      subject: `Nội quy và hướng dẫn tại ${context.propertyName}`,
      content: `Xin chào {{guestName}},\n\nMột vài nội quy giúp kỳ nghỉ diễn ra suôn sẻ:\n• Không hút thuốc trong nhà\n• Không gây ồn sau 22h\n• Tối đa {{maxGuests}} khách\n• Khóa cửa khi ra ngoài\n\nLiên hệ khẩn: {{emergencyPhone}}\nĐiểm tập kết rác: {{wasteLocation}}\n\nCảm ơn bạn đã hợp tác cùng ${context.hostName || "chúng tôi"}!`,
    },
  ]

  const createdTemplates = []
  for (const template of templatesData) {
    createdTemplates.push(
      await prisma.hostMessageTemplate.create({
        data: {
          hostId,
          name: template.name,
          category: template.category,
          subject: template.subject,
          content: template.content,
          variables: templateVariablesByCategory[template.category],
        },
      }),
    )
  }

  return createdTemplates
}

async function seedSavedReplies(hostId: string, context: HostContextDetails) {
  const repliesData = [
    {
      title: "Thông tin Wi-Fi",
      shortcut: "/wifi",
      content: `Wi-Fi tại ${context.propertyName}:\n• Tên: ${context.wifiName || "(tên mạng)"}\n• Mật khẩu: ${context.wifiPassword || "(mật khẩu)"}\n• Router nằm tại phòng khách.`,
      tags: ["wifi", "internet"],
    },
    {
      title: "Hỏi về check-in sớm",
      shortcut: "/checkin",
      content: `Chào bạn! Check-in tiêu chuẩn từ ${context.checkInTime}. Nếu bạn muốn đến sớm, mình sẽ cố gắng sắp xếp nếu phòng sẵn sàng. Hãy cập nhật giúp mình giờ đến nhé!`,
      tags: ["check-in", "linh hoạt"],
    },
    {
      title: "Địa điểm ăn uống",
      shortcut: "/food",
      content: `Một số địa điểm ăn uống gần ${context.propertyName}:\n• Quán ăn địa phương ngon nhất cách 200m\n• Quán cà phê view đẹp ngay ngã tư ${context.city}\n• Đặc sản địa phương tại chợ trung tâm (10 phút đi bộ)`,
      tags: ["ăn uống", "gợi ý"],
    },
  ]

  for (const reply of repliesData) {
    await prisma.hostSavedReply.create({
      data: {
        hostId,
        title: reply.title,
        shortcut: reply.shortcut,
        content: reply.content,
        tags: reply.tags,
      },
    })
  }
}

async function seedScheduledMessages(
  hostId: string,
  context: HostContextDetails,
  templates: { id: string; category: AutomationTemplateCategory }[],
) {
  const templateByCategory = new Map<AutomationTemplateCategory, string>()
  templates.forEach((template) => {
    templateByCategory.set(template.category, template.id)
  })

  const data = [
    {
      name: "Xác nhận đặt phòng",
      trigger: AutomationMessageTrigger.BOOKING_CONFIRMED,
      timingLabel: "Ngay sau khi xác nhận",
      offsetMinutes: 0,
      templateId: templateByCategory.get(TEMPLATE_CATEGORIES.WELCOME),
    },
    {
      name: "Nhắc trước 24h",
      trigger: AutomationMessageTrigger.BEFORE_CHECK_IN,
      timingLabel: "24 giờ trước check-in",
      offsetMinutes: -1440,
      templateId: templateByCategory.get(TEMPLATE_CATEGORIES.REMINDER),
    },
    {
      name: "Hướng dẫn check-in",
      trigger: AutomationMessageTrigger.CHECK_IN,
      timingLabel: "2 giờ trước check-in",
      offsetMinutes: -120,
      templateId: templateByCategory.get(TEMPLATE_CATEGORIES.CHECKIN),
    },
    {
      name: "Hỏi thăm giữa kỳ",
      trigger: AutomationMessageTrigger.DURING_STAY,
      timingLabel: "Ngày thứ 2 của kỳ lưu trú",
      offsetMinutes: 1440,
      templateId: templateByCategory.get(TEMPLATE_CATEGORIES.REMINDER),
    },
    {
      name: "Cảm ơn sau check-out",
      trigger: AutomationMessageTrigger.CHECK_OUT,
      timingLabel: "2 giờ sau check-out",
      offsetMinutes: 120,
      templateId: templateByCategory.get(TEMPLATE_CATEGORIES.CHECKOUT),
    },
    {
      name: "Nhắc đánh giá",
      trigger: AutomationMessageTrigger.AFTER_CHECK_OUT,
      timingLabel: "1 ngày sau check-out",
      offsetMinutes: 1440,
      templateId: templateByCategory.get(TEMPLATE_CATEGORIES.CHECKOUT),
    },
  ]

  for (const item of data) {
    await prisma.hostScheduledMessage.create({
      data: {
        hostId,
        name: item.name,
        trigger: item.trigger,
        timingLabel: item.timingLabel,
        offsetMinutes: item.offsetMinutes,
        recipients: AutomationRecipientScope.ALL_GUESTS,
        status: AutomationMessageStatus.ACTIVE,
        templateId: item.templateId || null,
        config: {
          city: context.city,
        },
      },
    })
  }
}

export async function getHostMessageTemplates(hostId: string) {
  await ensureHostAutomationSeed(hostId)
  return prisma.hostMessageTemplate.findMany({
    where: { hostId },
    orderBy: { createdAt: "desc" },
  })
}

export async function getHostSavedReplies(hostId: string) {
  await ensureHostAutomationSeed(hostId)
  return prisma.hostSavedReply.findMany({
    where: { hostId },
    orderBy: { updatedAt: "desc" },
  })
}

export async function getHostScheduledMessages(hostId: string) {
  await ensureHostAutomationSeed(hostId)
  return prisma.hostScheduledMessage.findMany({
    where: { hostId },
    include: {
      template: {
        select: {
          id: true,
          name: true,
          category: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  })
}

export async function deleteHostMessageTemplate(hostId: string, templateId: string) {
  const template = await prisma.hostMessageTemplate.findUnique({
    where: { id: templateId },
    select: { hostId: true },
  })

  if (!template || template.hostId !== hostId) {
    throw new Error("Template not found")
  }

  await prisma.hostScheduledMessage.updateMany({
    where: { hostId, templateId },
    data: { templateId: null },
  })

  await prisma.hostMessageTemplate.delete({ where: { id: templateId } })
}

export async function createHostMessageTemplate(hostId: string, payload: {
  name: string
  category: AutomationTemplateCategory
  subject?: string | null
  content: string
}) {
  return prisma.hostMessageTemplate.create({
    data: {
      hostId,
      name: payload.name,
      category: payload.category,
      subject: payload.subject || null,
      content: payload.content,
      variables: templateVariablesByCategory[payload.category] || [],
    },
  })
}

export async function duplicateHostMessageTemplate(hostId: string, templateId: string) {
  const template = await prisma.hostMessageTemplate.findUnique({ where: { id: templateId } })
  if (!template || template.hostId !== hostId) {
    throw new Error("Template not found")
  }

  return prisma.hostMessageTemplate.create({
    data: {
      hostId,
      name: `${template.name} (Copy)`,
      category: template.category,
      subject: template.subject,
      content: template.content,
      variables: template.variables,
    },
  })
}

export async function deleteHostSavedReply(hostId: string, replyId: string) {
  const reply = await prisma.hostSavedReply.findUnique({
    where: { id: replyId },
    select: { hostId: true },
  })

  if (!reply || reply.hostId !== hostId) {
    throw new Error("Reply not found")
  }

  await prisma.hostSavedReply.delete({ where: { id: replyId } })
}

export async function createHostSavedReply(hostId: string, payload: {
  title: string
  shortcut: string
  content: string
  tags?: string[]
}) {
  return prisma.hostSavedReply.create({
    data: {
      hostId,
      title: payload.title,
      shortcut: payload.shortcut,
      content: payload.content,
      tags: payload.tags ?? [],
    },
  })
}

export async function duplicateHostSavedReply(hostId: string, replyId: string) {
  const reply = await prisma.hostSavedReply.findUnique({ where: { id: replyId } })
  if (!reply || reply.hostId !== hostId) {
    throw new Error("Reply not found")
  }

  return prisma.hostSavedReply.create({
    data: {
      hostId,
      title: `${reply.title} (Copy)`,
      shortcut: `${reply.shortcut}_copy`,
      content: reply.content,
      tags: reply.tags,
    },
  })
}

export async function updateHostSavedReply(
  hostId: string,
  replyId: string,
  payload: {
    title?: string
    shortcut?: string
    content?: string
    tags?: string[]
  },
) {
  const reply = await prisma.hostSavedReply.findUnique({
    where: { id: replyId },
    select: { hostId: true },
  })

  if (!reply || reply.hostId !== hostId) {
    throw new Error("Reply not found")
  }

  const updateData: Record<string, unknown> = {}
  if (payload.title !== undefined) updateData.title = payload.title
  if (payload.shortcut !== undefined) updateData.shortcut = payload.shortcut
  if (payload.content !== undefined) updateData.content = payload.content
  if (payload.tags !== undefined) updateData.tags = payload.tags

  if (!Object.keys(updateData).length) {
    throw new Error("No changes provided")
  }

  return prisma.hostSavedReply.update({
    where: { id: replyId },
    data: updateData,
  })
}

export async function toggleScheduledMessageStatus(hostId: string, messageId: string) {
  const scheduled = await prisma.hostScheduledMessage.findUnique({ where: { id: messageId } })
  if (!scheduled || scheduled.hostId !== hostId) {
    throw new Error("Scheduled message not found")
  }

  const nextStatus = scheduled.status === AutomationMessageStatus.ACTIVE
    ? AutomationMessageStatus.PAUSED
    : AutomationMessageStatus.ACTIVE

  return prisma.hostScheduledMessage.update({
    where: { id: messageId },
    data: { status: nextStatus },
  })
}
