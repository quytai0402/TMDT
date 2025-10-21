import { PrismaClient, QuestType, QuestCategory } from '@prisma/client'

const prisma = new PrismaClient()

const quests = [
  // Onboarding Quests
  {
    title: "Hoàn thành hồ sơ",
    description: "Thêm ảnh đại diện và cập nhật thông tin cá nhân",
    type: QuestType.PROFILE_COMPLETION,
    category: QuestCategory.ONBOARDING,
    targetCount: 1,
    rewardPoints: 50,
    rewardBadge: "newcomer",
    isDaily: false,
    isWeekly: false,
    isActive: true,
    icon: "👤",
    color: "#3B82F6"
  },
  {
    title: "Xác thực email",
    description: "Xác nhận địa chỉ email của bạn",
    type: QuestType.PROFILE_COMPLETION,
    category: QuestCategory.ONBOARDING,
    targetCount: 1,
    rewardPoints: 30,
    isDaily: false,
    isWeekly: false,
    isActive: true,
    icon: "✉️",
    color: "#8B5CF6"
  },

  // Daily Quests
  {
    title: "Check-in hàng ngày",
    description: "Đăng nhập vào LuxeStay mỗi ngày",
    type: QuestType.DAILY_CHECK_IN,
    category: QuestCategory.ENGAGEMENT,
    targetCount: 1,
    rewardPoints: 10,
    isDaily: true,
    isWeekly: false,
    isActive: true,
    icon: "📅",
    color: "#10B981"
  },
  {
    title: "Streak Master 7 ngày",
    description: "Đăng nhập liên tục 7 ngày",
    type: QuestType.STREAK,
    category: QuestCategory.ENGAGEMENT,
    targetCount: 7,
    rewardPoints: 100,
    rewardBadge: "week_warrior",
    isDaily: false,
    isWeekly: false,
    isActive: true,
    icon: "🔥",
    color: "#F59E0B"
  },
  {
    title: "Streak Master 30 ngày",
    description: "Đăng nhập liên tục 30 ngày",
    type: QuestType.STREAK,
    category: QuestCategory.LOYALTY,
    targetCount: 30,
    rewardPoints: 500,
    rewardBadge: "month_champion",
    isDaily: false,
    isWeekly: false,
    isActive: true,
    icon: "🏆",
    color: "#EF4444"
  },

  // Booking Quests
  {
    title: "Booking đầu tiên",
    description: "Hoàn thành booking đầu tiên của bạn",
    type: QuestType.BOOKING,
    category: QuestCategory.ONBOARDING,
    targetCount: 1,
    rewardPoints: 100,
    rewardBadge: "first_stay",
    isDaily: false,
    isWeekly: false,
    isActive: true,
    icon: "🎉",
    color: "#EC4899"
  },
  {
    title: "Travel Explorer",
    description: "Đặt 5 chỗ ở khác nhau",
    type: QuestType.BOOKING,
    category: QuestCategory.ENGAGEMENT,
    targetCount: 5,
    rewardPoints: 250,
    rewardBadge: "explorer",
    isDaily: false,
    isWeekly: false,
    isActive: true,
    icon: "🗺️",
    color: "#06B6D4"
  },
  {
    title: "Globetrotter",
    description: "Đặt 10 chỗ ở",
    type: QuestType.BOOKING,
    category: QuestCategory.LOYALTY,
    targetCount: 10,
    rewardPoints: 500,
    rewardBadge: "globetrotter",
    isDaily: false,
    isWeekly: false,
    isActive: true,
    icon: "🌍",
    color: "#6366F1"
  },

  // Review Quests
  {
    title: "Reviewer đầu tiên",
    description: "Viết đánh giá đầu tiên sau chuyến đi",
    type: QuestType.REVIEW,
    category: QuestCategory.ENGAGEMENT,
    targetCount: 1,
    rewardPoints: 50,
    rewardBadge: "reviewer",
    isDaily: false,
    isWeekly: false,
    isActive: true,
    icon: "⭐",
    color: "#FBBF24"
  },
  {
    title: "Trusted Reviewer",
    description: "Viết 5 đánh giá chi tiết",
    type: QuestType.REVIEW,
    category: QuestCategory.LOYALTY,
    targetCount: 5,
    rewardPoints: 200,
    rewardBadge: "trusted_reviewer",
    isDaily: false,
    isWeekly: false,
    isActive: true,
    icon: "✍️",
    color: "#14B8A6"
  },

  // Social Quests
  {
    title: "Social Butterfly",
    description: "Tạo bài viết đầu tiên trong cộng đồng",
    type: QuestType.SOCIAL,
    category: QuestCategory.SOCIAL,
    targetCount: 1,
    rewardPoints: 30,
    isDaily: false,
    isWeekly: false,
    isActive: true,
    icon: "🦋",
    color: "#A855F7"
  },
  {
    title: "Community Star",
    description: "Nhận 50 likes cho các bài viết của bạn",
    type: QuestType.SOCIAL,
    category: QuestCategory.SOCIAL,
    targetCount: 50,
    rewardPoints: 150,
    rewardBadge: "community_star",
    isDaily: false,
    isWeekly: false,
    isActive: true,
    icon: "🌟",
    color: "#F97316"
  },

  // Referral Quests
  {
    title: "Chia sẻ là yêu thương",
    description: "Giới thiệu bạn bè đầu tiên đến LuxeStay",
    type: QuestType.REFERRAL,
    category: QuestCategory.SOCIAL,
    targetCount: 1,
    rewardPoints: 100,
    rewardBadge: "referrer",
    isDaily: false,
    isWeekly: false,
    isActive: true,
    icon: "🤝",
    color: "#84CC16"
  },
  {
    title: "Ambassador",
    description: "Giới thiệu 5 bạn bè thành công",
    type: QuestType.REFERRAL,
    category: QuestCategory.LOYALTY,
    targetCount: 5,
    rewardPoints: 500,
    rewardBadge: "ambassador",
    isDaily: false,
    isWeekly: false,
    isActive: true,
    icon: "👥",
    color: "#22C55E"
  },

  // Special Quests
  {
    title: "Weekend Warrior",
    description: "Đặt chỗ nghỉ cuối tuần",
    type: QuestType.BOOKING,
    category: QuestCategory.SPECIAL,
    targetCount: 3,
    rewardPoints: 150,
    rewardBadge: "weekend_warrior",
    isDaily: false,
    isWeekly: true,
    isActive: true,
    icon: "🎊",
    color: "#DC2626"
  },
  {
    title: "Early Bird",
    description: "Đặt phòng trước 30 ngày",
    type: QuestType.BOOKING,
    category: QuestCategory.SPECIAL,
    targetCount: 1,
    rewardPoints: 75,
    isDaily: false,
    isWeekly: false,
    isActive: true,
    icon: "🐦",
    color: "#0EA5E9"
  }
]

async function main() {
  console.log('🎯 Seeding quests...')

  // Clear existing quests
  await prisma.quest.deleteMany({})
  console.log('🗑️  Cleared existing quests')

  for (const quest of quests) {
    await prisma.quest.create({
      data: quest,
    })
    console.log(`✅ Created quest: ${quest.title}`)
  }

  console.log('✨ Quests seeding completed!')
  console.log(`📊 Total quests: ${quests.length}`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding quests:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
