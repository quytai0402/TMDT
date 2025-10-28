import { prisma } from "./prisma"

type QuestSeed = {
  title: string
  description: string
  type: string
  category: string
  targetCount: number
  rewardPoints: number
  isDaily?: boolean
  isWeekly?: boolean
  icon?: string
  color?: string
}

const defaultQuests: QuestSeed[] = [
  {
    title: "Hoàn tất booking đầu tiên",
    description: "Đặt chuyến nghỉ đầu tiên trên LuxeStay để mở khóa ưu đãi thành viên.",
    type: "BOOKING",
    category: "ONBOARDING",
    targetCount: 1,
    rewardPoints: 300,
    icon: "CheckCircle2",
    color: "#4f46e5",
  },
  {
    title: "Check-in cuối tuần",
    description: "Hoàn thành một booking nhận phòng vào cuối tuần này.",
    type: "BOOKING",
    category: "ENGAGEMENT",
    targetCount: 1,
    rewardPoints: 200,
    isWeekly: true,
    icon: "Calendar",
    color: "#ea580c",
  },
  {
    title: "Viết review đầu tiên",
    description: "Đánh giá một homestay bạn đã trải nghiệm để giúp cộng đồng.",
    type: "REVIEW",
    category: "SOCIAL",
    targetCount: 1,
    rewardPoints: 150,
    icon: "Star",
    color: "#f59e0b",
  },
  {
    title: "Thêm 3 homestay vào wishlist",
    description: "Ghim những homestay ưng ý để sẵn sàng đặt ngay khi cần.",
    type: "EXPLORATION",
    category: "LOYALTY",
    targetCount: 3,
    rewardPoints: 180,
    icon: "Heart",
    color: "#ec4899",
  },
  {
    title: "Daily check-in",
    description: "Mỗi ngày ghé LuxeStay để nhận thưởng streak.",
    type: "DAILY_CHECK_IN",
    category: "ENGAGEMENT",
    targetCount: 1,
    rewardPoints: 40,
    isDaily: true,
    icon: "Flame",
    color: "#f97316",
  },
  {
    title: "Giới thiệu bạn bè",
    description: "Mời một người bạn đặt homestay thông qua mã giới thiệu của bạn.",
    type: "REFERRAL",
    category: "SOCIAL",
    targetCount: 1,
    rewardPoints: 400,
    icon: "Users",
    color: "#0ea5e9",
  },
]

export async function ensureDefaultQuests() {
  for (const quest of defaultQuests) {
    const data = {
      title: quest.title,
      description: quest.description,
      type: quest.type,
      category: quest.category,
      targetCount: quest.targetCount,
      rewardPoints: quest.rewardPoints,
      isDaily: quest.isDaily ?? false,
      isWeekly: quest.isWeekly ?? false,
      icon: quest.icon,
      color: quest.color,
      isActive: true,
    }
  

    const existing = await prisma.quest.findMany({
      where: { title: quest.title },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    })

    if (existing.length > 0) {
      const [primary, ...duplicates] = existing
      await prisma.quest.update({
        where: { id: primary.id },
        data,
      })

      if (duplicates.length > 0) {
        await prisma.quest.deleteMany({
          where: { id: { in: duplicates.map((d) => d.id) } },
        })
      }
    } else {
      await prisma.quest.create({ data })
    }
  }
}
