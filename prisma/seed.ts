import {
  PrismaClient,
  QuestType,
  QuestCategory,
  PromotionType,
  PromotionSource,
  DiscountType,
  LoyaltyTier,
  PropertyType,
} from '@prisma/client'
import type { Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()
const prismaAny = prisma as any

const ensureJsonObject = (value: Prisma.JsonValue | null | undefined): Prisma.JsonObject => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Prisma.JsonObject
  }

  return {}
}

async function main() {
  console.log('🌱 Starting database seeding...')

  // Clean existing data (optional - uncomment if you want to reset)
  // await prisma.$transaction([
  //   prisma.booking.deleteMany(),
  //   prisma.review.deleteMany(),
  //   prisma.listing.deleteMany(),
  //   prisma.user.deleteMany(),
  // ])

  // Create Users
  console.log('👥 Creating users...')
  
  const hashedPassword = await bcrypt.hash('password123', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@luxestay.com' },
    update: {},
    create: {
      email: 'admin@luxestay.com',
      name: 'Admin LuxeStay',
      password: hashedPassword,
      role: 'ADMIN',
      isHost: true,
      emailVerified: new Date(),
      phone: '0901234567',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
      bio: 'Quản trị viên hệ thống LuxeStay',
      referralCode: 'ADMIN2024',
    }
  })

  const host1 = await prisma.user.upsert({
    where: { email: 'nguyen.minh.anh@gmail.com' },
    update: {},
    create: {
      email: 'nguyen.minh.anh@gmail.com',
      name: 'Nguyễn Minh Anh',
      password: hashedPassword,
      role: 'HOST',
      isHost: true,
      isSuperHost: true,
      emailVerified: new Date(),
      phone: '0912345678',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=host1',
      bio: 'Super Host với hơn 5 năm kinh nghiệm cho thuê homestay tại Đà Lạt và Nha Trang',
      languages: ['Tiếng Việt', 'English', '한국어'],
      referralCode: 'HOST1ANH',
    }
  })

  const host2 = await prisma.user.upsert({
    where: { email: 'tran.van.binh@gmail.com' },
    update: {},
    create: {
      email: 'tran.van.binh@gmail.com',
      name: 'Trần Văn Bình',
      password: hashedPassword,
      role: 'HOST',
      isHost: true,
      emailVerified: new Date(),
      phone: '0923456789',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=host2',
      bio: 'Chủ sở hữu các villa cao cấp tại Phú Quốc',
      languages: ['Tiếng Việt', 'English'],
      referralCode: 'HOST2BINH',
    }
  })

  const guest1 = await prisma.user.upsert({
    where: { email: 'khach1@gmail.com' },
    update: {},
    create: {
      email: 'khach1@gmail.com',
      name: 'Lê Thị Thu',
      password: hashedPassword,
      role: 'GUEST',
      emailVerified: new Date(),
      phone: '0934567890',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=guest1',
      referralCode: 'GUESTTHU',
    }
  })

  const guest2 = await prisma.user.upsert({
    where: { email: 'khach2@gmail.com' },
    update: {},
    create: {
      email: 'khach2@gmail.com',
      name: 'Phạm Đức Hải',
      password: hashedPassword,
      role: 'GUEST',
      emailVerified: new Date(),
      phone: '0945678901',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=guest2',
      referralCode: 'GUESTHAI',
    }
  })

  console.log('✅ Users created')

  console.log('🎁 Configuring rewards program...')

  const badgeConfigs: Array<{
    slug: string
    name: string
    description?: string
    tier?: string
    icon?: string
    color?: string
    pointsRequired?: number
    isLimited?: boolean
  }> = [
    {
      slug: 'bronze-explorer',
      name: 'Bronze Explorer',
      description: 'Khởi động hành trình cùng LuxeStay với những ưu đãi đầu tiên.',
      tier: 'BRONZE',
      icon: '🧭',
      color: '#CD7F32',
    },
    {
      slug: 'silver-jetsetter',
      name: 'Silver Jetsetter',
      description: 'Đạt mốc điểm thưởng để unlock ưu đãi linh hoạt hơn.',
      tier: 'SILVER',
      icon: '✈️',
      color: '#C0C0C0',
    },
    {
      slug: 'gold-ambassador',
      name: 'Gold Ambassador',
      description: 'Thành viên trung thành với quyền lợi nâng cấp và dịch vụ ưu tiên.',
      tier: 'GOLD',
      icon: '👑',
      color: '#D4AF37',
    },
    {
      slug: 'loyalty-trailblazer',
      name: 'Loyalty Trailblazer',
      description: 'Hoàn thành các nhiệm vụ trung thành đặc biệt.',
      icon: '🔥',
      pointsRequired: 3000,
      color: '#FF6B35',
      isLimited: true,
    },
  ] as const

  const badgeRecords = await Promise.all(
    badgeConfigs.map((badge) =>
      prismaAny.rewardBadge.upsert({
        where: { slug: badge.slug },
        update: {
          name: badge.name,
          description: badge.description,
          tier: badge.tier ?? null,
          pointsRequired: badge.pointsRequired ?? null,
          icon: badge.icon ?? null,
          color: badge.color ?? null,
          isLimited: badge.isLimited ?? false,
        },
        create: {
          slug: badge.slug,
          name: badge.name,
          description: badge.description,
          tier: badge.tier ?? null,
          pointsRequired: badge.pointsRequired ?? null,
          icon: badge.icon ?? null,
          color: badge.color ?? null,
          isLimited: badge.isLimited ?? false,
        },
      })
    )
  )

  const badgeMap = new Map<string, (typeof badgeRecords)[number]>()
  badgeRecords.forEach((badge: any) => {
    badgeMap.set(badge.slug, badge)
  })

  const tierConfigs: Array<{
    tier: string
    name: string
    description?: string
    minPoints: number
    maxPoints: number | null
    bonusMultiplier: number
    benefits: string[]
    displayOrder: number
    badgeSlug?: string
  }> = [
    {
      tier: 'BRONZE',
      name: 'Bronze Explorer',
      minPoints: 0,
      maxPoints: 999,
      bonusMultiplier: 1,
      benefits: [
        'Giảm giá 5% cho booking đầu tiên',
        'Ưu tiên hỗ trợ qua chat',
      ],
      displayOrder: 1,
      badgeSlug: 'bronze-explorer',
    },
    {
      tier: 'SILVER',
      name: 'Silver Voyager',
      minPoints: 1000,
      maxPoints: 2999,
      bonusMultiplier: 1.05,
      benefits: [
        'Tích luỹ điểm nhanh hơn 5%',
        'Ưu đãi check-in sớm tuỳ chọn',
        'Tặng quà sinh nhật đặc biệt',
      ],
      displayOrder: 2,
      badgeSlug: 'silver-jetsetter',
    },
    {
      tier: 'GOLD',
      name: 'Gold Ambassador',
      minPoints: 3000,
      maxPoints: 6999,
      bonusMultiplier: 1.1,
      benefits: [
        'Tích luỹ điểm nhanh hơn 10%',
        'Ưu tiên nâng hạng phòng khi còn chỗ',
        'Đường dây hỗ trợ riêng',
      ],
      displayOrder: 3,
      badgeSlug: 'gold-ambassador',
    },
    {
      tier: 'PLATINUM',
      name: 'Platinum Elite',
      minPoints: 7000,
      maxPoints: 11999,
      bonusMultiplier: 1.2,
      benefits: [
        'Tích luỹ điểm nhanh hơn 20%',
        'Ưu đãi check-out trễ miễn phí',
        'Tặng đêm nghỉ miễn phí mỗi năm',
      ],
      displayOrder: 4,
    },
    {
      tier: 'DIAMOND',
      name: 'Diamond Signature',
      minPoints: 12000,
      maxPoints: null,
      bonusMultiplier: 1.3,
      benefits: [
        'Chăm sóc khách hàng 24/7 chuyên biệt',
        'Nâng cấp hạng phòng đảm bảo',
        'Trải nghiệm concierge cá nhân hoá',
      ],
      displayOrder: 5,
    },
  ] as const

  await Promise.all(
    tierConfigs.map((tier) =>
  prismaAny.rewardTier.upsert({
        where: { tier: tier.tier },
        update: {
          name: tier.name,
          description: tier.description ?? null,
          minPoints: tier.minPoints,
          maxPoints: tier.maxPoints,
          bonusMultiplier: tier.bonusMultiplier,
          benefits: tier.benefits,
          displayOrder: tier.displayOrder,
          badgeId: tier.badgeSlug ? badgeMap.get(tier.badgeSlug)?.id ?? null : null,
        },
        create: {
          tier: tier.tier,
          name: tier.name,
          description: tier.description ?? null,
          minPoints: tier.minPoints,
          maxPoints: tier.maxPoints,
          bonusMultiplier: tier.bonusMultiplier,
          benefits: tier.benefits,
          displayOrder: tier.displayOrder,
          badgeId: tier.badgeSlug ? badgeMap.get(tier.badgeSlug)?.id ?? null : null,
        },
      })
    )
  )


  const membershipPlanConfigs = [
    {
      slug: 'luxe-silver',
      name: 'Luxe Silver',
      tagline: 'Ưu đãi linh hoạt cho khách thân thiết',
      description: 'Giảm giá cơ bản và quyền lợi ưu tiên khi đặt homestay trên LuxeStay.',
      icon: '🥈',
      color: '#B0BEC5',
      monthlyPrice: 299000,
      annualPrice: 2990000,
      savings: 10,
      isPopular: false,
      features: [
        'Giảm 5% cho mọi booking',
        'Ưu tiên hỗ trợ qua chat',
        'Miễn phí nâng hạng cuối tuần (tuỳ tình trạng phòng)',
      ],
      exclusiveFeatures: [
        'Miễn phí check-in sớm (tuỳ tình trạng phòng)',
      ],
      bookingDiscountRate: 5,
      applyDiscountToServices: false,
      displayOrder: 1,
    },
    {
      slug: 'luxe-gold',
      name: 'Luxe Gold',
      tagline: 'Trải nghiệm nâng hạng và dịch vụ concierge',
      description: 'Được thiết kế cho khách hàng trung thành với nhu cầu nâng hạng phòng và dịch vụ cao cấp.',
      icon: '🥇',
      color: '#F1C40F',
      monthlyPrice: 499000,
      annualPrice: 4990000,
      savings: 15,
      isPopular: true,
      features: [
        'Giảm 10% cho mọi booking',
        'Priority concierge 24/7',
        'Miễn phí nâng hạng phòng khi còn trống',
      ],
      exclusiveFeatures: [
        'Tặng 1 voucher spa mỗi quý',
        'Giảm 10% cho dịch vụ bổ sung',
      ],
      bookingDiscountRate: 10,
      applyDiscountToServices: true,
      displayOrder: 2,
    },
    {
      slug: 'luxe-platinum',
      name: 'Luxe Platinum',
      tagline: 'Quyền lợi độc quyền & concierge cá nhân hoá',
      description: 'Tối ưu cho khách doanh nhân và gia đình cao cấp cần dịch vụ riêng biệt.',
      icon: '💎',
      color: '#8E24AA',
      monthlyPrice: 899000,
      annualPrice: 8990000,
      savings: 20,
      isPopular: false,
      features: [
        'Giảm 12% cho mọi booking',
        'Concierge cá nhân hoá',
        'Ưu tiên check-in/out linh hoạt',
      ],
      exclusiveFeatures: [
        'Tặng 1 đêm miễn phí mỗi năm',
        'Giảm 15% cho dịch vụ bổ sung',
        'Trải nghiệm partner cao cấp',
      ],
      bookingDiscountRate: 12,
      applyDiscountToServices: true,
      displayOrder: 3,
    },
  ]

  const membershipPlanRecords = await Promise.all(
    membershipPlanConfigs.map((plan) =>
      prisma.membershipPlan.upsert({
        where: { slug: plan.slug },
        update: {
          name: plan.name,
          tagline: plan.tagline ?? null,
          description: plan.description ?? null,
          icon: plan.icon ?? null,
          color: plan.color ?? null,
          monthlyPrice: plan.monthlyPrice,
          annualPrice: plan.annualPrice,
          savings: plan.savings ?? null,
          isPopular: plan.isPopular ?? false,
          features: plan.features,
          exclusiveFeatures: plan.exclusiveFeatures,
          bookingDiscountRate: plan.bookingDiscountRate,
          applyDiscountToServices: plan.applyDiscountToServices,
          displayOrder: plan.displayOrder,
        },
        create: {
          slug: plan.slug,
          name: plan.name,
          tagline: plan.tagline ?? null,
          description: plan.description ?? null,
          icon: plan.icon ?? null,
          color: plan.color ?? null,
          monthlyPrice: plan.monthlyPrice,
          annualPrice: plan.annualPrice,
          savings: plan.savings ?? null,
          isPopular: plan.isPopular ?? false,
          features: plan.features,
          exclusiveFeatures: plan.exclusiveFeatures,
          bookingDiscountRate: plan.bookingDiscountRate,
          applyDiscountToServices: plan.applyDiscountToServices,
          displayOrder: plan.displayOrder,
        },
      })
    )
  )

  const membershipPlanMap = new Map<string, (typeof membershipPlanRecords)[number]>()
  membershipPlanRecords.forEach((plan) => membershipPlanMap.set(plan.slug, plan))

  const goldPlan = membershipPlanMap.get('luxe-gold')
  if (goldPlan) {
    const nowTimestamp = new Date()
    const nextYear = new Date(nowTimestamp)
    nextYear.setFullYear(nextYear.getFullYear() + 1)

    await prisma.user.update({
      where: { id: guest1.id },
      data: {
        membershipPlanId: goldPlan.id,
        membershipStatus: 'ACTIVE',
        membershipStartedAt: nowTimestamp,
        membershipExpiresAt: nextYear,
        membershipBillingCycle: 'ANNUAL',
        membershipFeatures: [...goldPlan.features, ...goldPlan.exclusiveFeatures],
        loyaltyPoints: 4800,
        loyaltyTier: 'GOLD',
      },
    })
  }

  const actionConfigs: Array<{
    slug: string
    title: string
    description?: string
    type: string
    source: string
    points: number
    maxTimesPerDay?: number
    maxTimesPerWeek?: number
    cooldownHours?: number
    isRecurring?: boolean
    badgeSlug?: string
  }> = [
    {
      slug: 'booking-completed',
      title: 'Hoàn tất đặt phòng',
      description: 'Nhận điểm thưởng khi hoàn tất mỗi đơn đặt phòng.',
      type: 'BOOKING_COMPLETED',
      source: 'BOOKING',
      points: 400,
      maxTimesPerDay: 5,
    },
    {
      slug: 'review-submitted',
      title: 'Đánh giá sau chuyến đi',
      description: 'Chia sẻ trải nghiệm để nhận điểm thưởng.',
      type: 'REVIEW_SUBMITTED',
      source: 'REVIEW',
      points: 150,
      maxTimesPerDay: 3,
    },
    {
      slug: 'daily-check-in',
      title: 'Điểm danh mỗi ngày',
      description: 'Đăng nhập ứng dụng mỗi ngày để nhận điểm.',
      type: 'DAILY_CHECK_IN',
      source: 'DAILY',
      points: 25,
      maxTimesPerDay: 1,
      cooldownHours: 24,
      isRecurring: true,
    },
    {
      slug: 'quest-completion',
      title: 'Hoàn thành nhiệm vụ',
      description: 'Khi hoàn thành một quest trong trung tâm nhiệm vụ.',
      type: 'QUEST_COMPLETED',
      source: 'QUEST',
      points: 300,
      badgeSlug: 'loyalty-trailblazer',
    },
  ] as const

  const actionRecords = await Promise.all(
    actionConfigs.map((action) =>
      prismaAny.rewardAction.upsert({
        where: { slug: action.slug },
        update: {
          title: action.title,
          description: action.description,
          type: action.type,
          source: action.source,
          points: action.points,
          maxTimesPerDay: action.maxTimesPerDay ?? null,
          maxTimesPerWeek: action.maxTimesPerWeek ?? null,
          cooldownHours: action.cooldownHours ?? null,
          isRecurring: action.isRecurring ?? true,
          isActive: true,
          badgeId: action.badgeSlug ? badgeMap.get(action.badgeSlug)?.id ?? null : null,
        },
        create: {
          slug: action.slug,
          title: action.title,
          description: action.description,
          type: action.type,
          source: action.source,
          points: action.points,
          maxTimesPerDay: action.maxTimesPerDay ?? null,
          maxTimesPerWeek: action.maxTimesPerWeek ?? null,
          cooldownHours: action.cooldownHours ?? null,
          isRecurring: action.isRecurring ?? true,
          isActive: true,
          badgeId: action.badgeSlug ? badgeMap.get(action.badgeSlug)?.id ?? null : null,
        },
      })
    )
  )

  const actionMap = new Map<string, (typeof actionRecords)[number]>()
  actionRecords.forEach((action: any) => {
    actionMap.set(action.slug, action)
  })

  const questConfigs: Array<{
    title: string
    description: string
    type: QuestType
    category: QuestCategory
    targetCount: number
    rewardPoints: number
    rewardBadgeSlug?: string
    isDaily?: boolean
    isWeekly?: boolean
    icon?: string
    color?: string
  }> = [
    {
      title: 'Đặt phòng đầu tiên',
      description: 'Hoàn tất đơn đặt phòng đầu tiên cùng LuxeStay.',
      type: QuestType.BOOKING,
      category: QuestCategory.ONBOARDING,
      targetCount: 1,
      rewardPoints: 400,
      rewardBadgeSlug: 'bronze-explorer',
      icon: '🧳',
      color: '#0EA5E9',
    },
    {
      title: 'Viết 3 đánh giá chân thành',
      description: 'Chia sẻ trải nghiệm của bạn sau mỗi chuyến đi.',
      type: QuestType.REVIEW,
      category: QuestCategory.ENGAGEMENT,
      targetCount: 3,
      rewardPoints: 450,
      rewardBadgeSlug: 'silver-jetsetter',
      icon: '📝',
      color: '#F97316',
    },
    {
      title: 'Điểm danh 5 ngày liên tiếp',
      description: 'Đăng nhập LuxeStay liên tục 5 ngày để duy trì streak.',
      type: QuestType.DAILY_CHECK_IN,
      category: QuestCategory.LOYALTY,
      targetCount: 5,
      rewardPoints: 300,
      rewardBadgeSlug: 'silver-jetsetter',
      isDaily: true,
      icon: '📅',
      color: '#6366F1',
    },
    {
      title: 'Khám phá 10 homestay tiềm năng',
      description: 'Lưu hoặc xem chi tiết 10 homestay thân thiện.',
      type: QuestType.EXPLORATION,
      category: QuestCategory.SOCIAL,
      targetCount: 10,
      rewardPoints: 350,
      icon: '🗺️',
      color: '#22C55E',
    },
    {
      title: 'Chia sẻ 3 homestay với bạn bè',
      description: 'Giới thiệu homestay yêu thích của bạn tới cộng đồng.',
      type: QuestType.SOCIAL,
      category: QuestCategory.SOCIAL,
      targetCount: 3,
      rewardPoints: 280,
      icon: '🤝',
      color: '#EC4899',
    },
  ]

  for (const quest of questConfigs) {
    const existingQuest = await prisma.quest.findFirst({
      where: { title: quest.title },
    })

    const questData = {
      title: quest.title,
      description: quest.description,
      type: quest.type,
      category: quest.category,
      targetCount: quest.targetCount,
      rewardPoints: quest.rewardPoints,
      rewardBadge: quest.rewardBadgeSlug ? badgeMap.get(quest.rewardBadgeSlug)?.name ?? null : null,
      rewardBadgeId: quest.rewardBadgeSlug ? badgeMap.get(quest.rewardBadgeSlug)?.id ?? null : null,
      isDaily: quest.isDaily ?? false,
      isWeekly: quest.isWeekly ?? false,
      isActive: true,
      icon: quest.icon ?? null,
      color: quest.color ?? null,
    }

    if (existingQuest) {
      await prisma.quest.update({
        where: { id: existingQuest.id },
        data: questData,
      })
    } else {
      await prisma.quest.create({
        data: questData,
      })
    }
  }

  const catalogConfigs: Array<{
    slug: string
    name: string
    description?: string
    category: string
    pointsCost: number
    image?: string
    terms?: string
  }> = [
    {
      slug: 'weekend-upgrade',
      name: 'Nâng hạng cuối tuần',
      description: 'Đổi 2.000 điểm để được nâng hạng phòng khả dụng cuối tuần.',
      category: 'UPGRADE',
      pointsCost: 2000,
      image: 'https://images.unsplash.com/photo-1505691723518-36a5ac3be353?w=1200',
      terms: 'Áp dụng cho booking tối thiểu 2 đêm, tuỳ tình trạng phòng.',
    },
    {
      slug: 'airport-pickup',
      name: 'Đưa đón sân bay miễn phí',
      description: 'Đổi 3.500 điểm cho dịch vụ đưa đón sân bay một chiều.',
      category: 'EXPERIENCE',
      pointsCost: 3500,
      image: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1200',
      terms: 'Cần đặt tối thiểu trước 48 giờ so với lịch bay.',
    },
    {
      slug: 'spa-credit',
      name: 'Phiếu spa 60 phút',
      description: 'Thư giãn với liệu trình spa tại đối tác của LuxeStay.',
      category: 'VOUCHER',
      pointsCost: 2500,
      image: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=1200',
      terms: 'Có hiệu lực trong 60 ngày kể từ khi đổi.',
    },
  ] as const

  await Promise.all(
    catalogConfigs.map((reward) =>
  prismaAny.rewardCatalogItem.upsert({
        where: { slug: reward.slug },
        update: {
          name: reward.name,
          description: reward.description,
          category: reward.category,
          pointsCost: reward.pointsCost,
          image: reward.image ?? null,
          terms: reward.terms ?? null,
          isActive: true,
        },
        create: {
          slug: reward.slug,
          name: reward.name,
          description: reward.description,
          category: reward.category,
          pointsCost: reward.pointsCost,
          image: reward.image ?? null,
          terms: reward.terms ?? null,
          isActive: true,
        },
      })
    )
  )

  console.log('🪙 Creating sample reward histories...')

  const bookingAction = actionMap.get('booking-completed')
  const reviewAction = actionMap.get('review-submitted')

  if (bookingAction && reviewAction) {
  await prismaAny.rewardTransaction.deleteMany({
      where: {
        userId: { in: [guest1.id, guest2.id] },
      },
    })

  await prismaAny.rewardTransaction.create({
      data: {
        userId: guest1.id,
        actionId: bookingAction.id,
        transactionType: 'CREDIT',
        source: 'BOOKING',
        points: 1200,
        balanceAfter: 1200,
        description: 'Điểm thưởng cho booking đầu tiên.',
      },
    })

  await prismaAny.rewardTransaction.create({
      data: {
        userId: guest1.id,
        actionId: reviewAction.id,
        transactionType: 'CREDIT',
        source: 'REVIEW',
        points: 300,
        balanceAfter: 1500,
        description: 'Điểm thưởng khi gửi đánh giá.',
      },
    })

    await prisma.user.update({
      where: { id: guest1.id },
      data: {
        loyaltyPoints: 1500,
        loyaltyTier: 'SILVER',
      },
    })

  await prismaAny.rewardTransaction.create({
      data: {
        userId: guest2.id,
        actionId: bookingAction.id,
        transactionType: 'CREDIT',
        source: 'BOOKING',
        points: 1600,
        balanceAfter: 1600,
        description: 'Điểm thưởng cho kỳ nghỉ dài ngày.',
      },
    })

  await prismaAny.rewardTransaction.create({
      data: {
        userId: guest2.id,
        actionId: bookingAction.id,
        transactionType: 'CREDIT',
        source: 'BOOKING',
        points: 1800,
        balanceAfter: 3400,
        description: 'Điểm thưởng cho booking villa cao cấp.',
      },
    })

  await prismaAny.rewardTransaction.create({
      data: {
        userId: guest2.id,
        actionId: reviewAction.id,
        transactionType: 'CREDIT',
        source: 'REVIEW',
        points: 400,
        balanceAfter: 3800,
        description: 'Điểm thưởng cho bài review chi tiết.',
      },
    })

    await prisma.user.update({
      where: { id: guest2.id },
      data: {
        loyaltyPoints: 3800,
        loyaltyTier: 'GOLD',
      },
    })

    const silverBadge = badgeMap.get('silver-jetsetter')
    const goldBadge = badgeMap.get('gold-ambassador')

    if (silverBadge) {
  await prismaAny.userBadge.upsert({
        where: {
          userId_badgeId: {
            userId: guest1.id,
            badgeId: silverBadge.id,
          },
        },
        update: {},
        create: {
          userId: guest1.id,
          badgeId: silverBadge.id,
          source: 'QUEST',
        },
      })
    }

    if (goldBadge) {
  await prismaAny.userBadge.upsert({
        where: {
          userId_badgeId: {
            userId: guest2.id,
            badgeId: goldBadge.id,
          },
        },
        update: {},
        create: {
          userId: guest2.id,
          badgeId: goldBadge.id,
          source: 'BOOKING',
        },
      })
    }
  }

  console.log('✅ Rewards program configured')

  // Create Listings
  console.log('🏠 Creating listings...')

  const listing1 = await prisma.listing.upsert({
    where: { slug: 'villa-sang-trong-view-bien-nha-trang' },
    update: {},
    create: {
      hostId: host1.id,
      title: 'Villa Sang Trọng View Biển Nha Trang',
      slug: 'villa-sang-trong-view-bien-nha-trang',
      description: 'Villa 4 phòng ngủ tuyệt đẹp với view biển toàn cảnh Nha Trang. Thiết kế hiện đại, đầy đủ tiện nghi cao cấp. Hồ bơi riêng, BBQ ngoài trời. Cách bãi biển chỉ 2 phút đi bộ.',
      propertyType: 'VILLA',
      roomType: 'ENTIRE_PLACE',
      maxGuests: 10,
      bedrooms: 4,
      beds: 5,
      bathrooms: 3.5,
      country: 'Việt Nam',
      city: 'Nha Trang',
      state: 'Khánh Hòa',
      address: '123 Trần Phú, Lộc Thọ',
      zipCode: '650000',
      latitude: 12.2388,
      longitude: 109.1967,
      neighborhood: 'Bãi biển Trần Phú',
      basePrice: 3500000,
      cleaningFee: 500000,
      serviceFee: 350000,
      weeklyDiscount: 10,
      monthlyDiscount: 20,
      currency: 'VND',
      images: [
        'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200',
        'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200',
        'https://images.unsplash.com/photo-1615873968403-89e068629265?w=1200',
        'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=1200',
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200',
      ],
      amenities: [],
      checkInTime: '14:00',
      checkOutTime: '11:00',
      minNights: 2,
      maxNights: 30,
      instantBookable: true,
      cancellationPolicy: 'FLEXIBLE',
      allowPets: false,
      allowSmoking: false,
      allowEvents: true,
      allowChildren: true,
      hasSmartLock: true,
      wifiName: 'VillaNhaTrang_5G',
      wifiPassword: 'welcome2024',
      isVerified: true,
      status: 'ACTIVE',
      featured: true,
      averageRating: 4.9,
      totalReviews: 127,
      totalBookings: 89,
      occupancyRate: 85,
      publishedAt: new Date(),
    }
  })

  const listing2 = await prisma.listing.create({
    data: {
      hostId: host1.id,
      title: 'Biệt Thự Đà Lạt View Đồi Thông',
      slug: 'biet-thu-da-lat-view-doi-thong',
      description: 'Biệt thự phong cách châu Âu giữa lòng Đà Lạt. 3 phòng ngủ rộng rãi, lò sưởi, bếp đầy đủ. Khu vườn hoa đẹp, view đồi thông thơ mộng. Gần chợ Đà Lạt 5 phút lái xe.',
      propertyType: 'VILLA',
      roomType: 'ENTIRE_PLACE',
      maxGuests: 8,
      bedrooms: 3,
      beds: 4,
      bathrooms: 2,
      country: 'Việt Nam',
      city: 'Đà Lạt',
      state: 'Lâm Đồng',
      address: '45 Đường Trần Hưng Đạo',
      zipCode: '670000',
      latitude: 11.9404,
      longitude: 108.4583,
      neighborhood: 'Trung tâm Đà Lạt',
      basePrice: 2800000,
      cleaningFee: 400000,
      serviceFee: 280000,
      weeklyDiscount: 15,
      monthlyDiscount: 25,
      currency: 'VND',
      images: [
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200',
        'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1200',
        'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=1200',
      ],
      amenities: [],
      checkInTime: '14:00',
      checkOutTime: '12:00',
      minNights: 2,
      maxNights: 14,
      instantBookable: true,
      cancellationPolicy: 'MODERATE',
      allowPets: true,
      allowSmoking: false,
      allowEvents: false,
      allowChildren: true,
      hasSmartLock: false,
      wifiName: 'DaLatVilla',
      wifiPassword: 'dalat123',
      isVerified: true,
      status: 'ACTIVE',
      featured: true,
      averageRating: 4.8,
      totalReviews: 95,
      totalBookings: 76,
      occupancyRate: 78,
      publishedAt: new Date(),
    }
  })

  const listing3 = await prisma.listing.create({
    data: {
      hostId: host2.id,
      title: 'Resort Phú Quốc Bãi Sao - Villa Biển',
      slug: 'resort-phu-quoc-bai-sao-villa-bien',
      description: 'Villa 5 sao ngay bãi Sao Phú Quốc. 5 phòng ngủ sang trọng, hồ bơi vô cực, bếp hiện đại. Dịch vụ butler 24/7. Tầm nhìn biển tuyệt đẹp, riêng tư tuyệt đối.',
      propertyType: 'VILLA',
      roomType: 'ENTIRE_PLACE',
      maxGuests: 12,
      bedrooms: 5,
      beds: 6,
      bathrooms: 4,
      country: 'Việt Nam',
      city: 'Phú Quốc',
      state: 'Kiên Giang',
      address: 'Bãi Sao, An Thới',
      zipCode: '920000',
      latitude: 10.1699,
      longitude: 103.9676,
      neighborhood: 'Bãi Sao',
      basePrice: 8500000,
      cleaningFee: 1000000,
      serviceFee: 850000,
      weeklyDiscount: 10,
      monthlyDiscount: 20,
      currency: 'VND',
      images: [
        'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1200',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200',
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200',
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200',
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200',
      ],
      amenities: [],
      checkInTime: '15:00',
      checkOutTime: '12:00',
      minNights: 3,
      maxNights: 30,
      instantBookable: false,
      cancellationPolicy: 'STRICT',
      allowPets: false,
      allowSmoking: false,
      allowEvents: true,
      allowChildren: true,
      hasSmartLock: true,
      wifiName: 'PhuQuocResort_VIP',
      wifiPassword: 'resort2024',
      isVerified: true,
      status: 'ACTIVE',
      featured: true,
      averageRating: 5.0,
      totalReviews: 68,
      totalBookings: 45,
      occupancyRate: 92,
      publishedAt: new Date(),
    }
  })

  const listing4 = await prisma.listing.create({
    data: {
      hostId: host2.id,
      title: 'Penthouse Saigon Landmark 81',
      slug: 'penthouse-saigon-landmark-81',
      description: 'Penthouse cao cấp tầng 68 Landmark 81. 3 phòng ngủ, thiết kế sang trọng. View toàn cảnh Sài Gòn 360 độ. Hồ bơi riêng, phòng gym, rạp phim mini.',
      propertyType: 'APARTMENT',
      roomType: 'ENTIRE_PLACE',
      maxGuests: 6,
      bedrooms: 3,
      beds: 3,
      bathrooms: 3,
      country: 'Việt Nam',
      city: 'Hồ Chí Minh',
      state: 'Hồ Chí Minh',
      address: 'Landmark 81, 720A Điện Biên Phủ, Bình Thạnh',
      zipCode: '700000',
      latitude: 10.7946,
      longitude: 106.7218,
      neighborhood: 'Vinhomes Central Park',
      basePrice: 5500000,
      cleaningFee: 600000,
      serviceFee: 550000,
      weeklyDiscount: 10,
      monthlyDiscount: 15,
      currency: 'VND',
      images: [
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200',
        'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200',
        'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=1200',
      ],
      amenities: [],
      checkInTime: '14:00',
      checkOutTime: '11:00',
      minNights: 1,
      maxNights: 30,
      instantBookable: true,
      cancellationPolicy: 'MODERATE',
      allowPets: false,
      allowSmoking: false,
      allowEvents: false,
      allowChildren: true,
      hasSmartLock: true,
      wifiName: 'Landmark81_Premium',
      wifiPassword: 'saigon2024',
      isVerified: true,
      status: 'ACTIVE',
      featured: false,
      averageRating: 4.7,
      totalReviews: 82,
      totalBookings: 134,
      occupancyRate: 88,
      publishedAt: new Date(),
    }
  })

  const listing5 = await prisma.listing.create({
    data: {
      hostId: host1.id,
      title: 'Homestay Hội An Phố Cổ - Nhà Cổ Truyền',
      slug: 'homestay-hoi-an-pho-co-nha-co-truyen',
      description: 'Nhà cổ truyền thống Hội An được trùng tu. 2 phòng ngủ, sân vườn nhỏ, giếng trời. Cách phố cổ 3 phút đi bộ. Trải nghiệm văn hóa Việt Nam đích thực.',
      propertyType: 'HOUSE',
      roomType: 'ENTIRE_PLACE',
      maxGuests: 4,
      bedrooms: 2,
      beds: 2,
      bathrooms: 2,
      country: 'Việt Nam',
      city: 'Hội An',
      state: 'Quảng Nam',
      address: '89 Trần Phú, Minh An',
      zipCode: '560000',
      latitude: 15.8801,
      longitude: 108.3380,
      neighborhood: 'Phố cổ Hội An',
      basePrice: 1200000,
      cleaningFee: 200000,
      serviceFee: 120000,
      weeklyDiscount: 15,
      monthlyDiscount: 25,
      currency: 'VND',
      images: [
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200',
        'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200',
        'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200',
      ],
      amenities: [],
      checkInTime: '14:00',
      checkOutTime: '12:00',
      minNights: 2,
      maxNights: 14,
      instantBookable: true,
      cancellationPolicy: 'FLEXIBLE',
      allowPets: false,
      allowSmoking: false,
      allowEvents: false,
      allowChildren: true,
      hasSmartLock: false,
      wifiName: 'HoiAn_Homestay',
      wifiPassword: 'hoian123',
      isVerified: true,
      status: 'ACTIVE',
      featured: false,
      averageRating: 4.9,
      totalReviews: 156,
      totalBookings: 201,
      occupancyRate: 90,
      publishedAt: new Date(),
    }
  })

  console.log('✅ Listings created')

  // Add more listings for diverse locations
  const listing6 = await prisma.listing.create({
    data: {
      hostId: host1.id,
      title: 'Căn Hộ Studio View Hồ Tây Hà Nội',
      slug: 'can-ho-studio-view-ho-tay-ha-noi',
      description: 'Studio hiện đại view Hồ Tây tuyệt đẹp. Đầy đủ tiện nghi, gần Phố Cổ. Thích hợp cho cặp đôi hoặc 1-2 người. Ban công riêng ngắm hoàng hôn.',
      propertyType: 'APARTMENT',
      roomType: 'ENTIRE_PLACE',
      maxGuests: 2,
      bedrooms: 1,
      beds: 1,
      bathrooms: 1,
      country: 'Việt Nam',
      city: 'Hà Nội',
      state: 'Hà Nội',
      address: '98 Yên Phụ, Tây Hồ',
      zipCode: '100000',
      latitude: 21.0545,
      longitude: 105.8212,
      neighborhood: 'Hồ Tây',
      basePrice: 800000,
      cleaningFee: 150000,
      serviceFee: 80000,
      currency: 'VND',
      images: [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200',
        'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=1200',
        'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=1200',
      ],
      amenities: [],
      checkInTime: '14:00',
      checkOutTime: '12:00',
      minNights: 1,
      maxNights: 30,
      instantBookable: true,
      cancellationPolicy: 'FLEXIBLE',
      allowPets: false,
      allowSmoking: false,
      allowEvents: false,
      allowChildren: true,
      hasSmartLock: true,
      wifiName: 'HanoiStudio_5G',
      wifiPassword: 'hanoi2024',
      isVerified: true,
      status: 'ACTIVE',
      featured: false,
      averageRating: 4.6,
      totalReviews: 42,
      totalBookings: 67,
      occupancyRate: 75,
      publishedAt: new Date(),
    }
  })

  const listing7 = await prisma.listing.create({
    data: {
      hostId: host2.id,
      title: 'Bungalow Mũi Né View Biển Trực Diện',
      slug: 'bungalow-mui-ne-view-bien-truc-dien',
      description: 'Bungalow gỗ trên bãi biển Mũi Né. Bước chân ra là biển, view bình minh tuyệt đẹp. BBQ riêng, kayak miễn phí. Trải nghiệm resort giá hợp lý.',
      propertyType: 'BUNGALOW',
      roomType: 'ENTIRE_PLACE',
      maxGuests: 4,
      bedrooms: 2,
      beds: 2,
      bathrooms: 1,
      country: 'Việt Nam',
      city: 'Phan Thiết',
      state: 'Bình Thuận',
      address: 'Nguyễn Đình Chiểu, Mũi Né',
      zipCode: '800000',
      latitude: 10.9333,
      longitude: 108.2833,
      neighborhood: 'Bãi biển Mũi Né',
      basePrice: 1500000,
      cleaningFee: 250000,
      serviceFee: 150000,
      currency: 'VND',
      images: [
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200',
        'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1200',
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200',
      ],
      amenities: [],
      checkInTime: '14:00',
      checkOutTime: '11:00',
      minNights: 2,
      maxNights: 14,
      instantBookable: true,
      cancellationPolicy: 'MODERATE',
      allowPets: false,
      allowSmoking: false,
      allowEvents: false,
      allowChildren: true,
      hasSmartLock: false,
      wifiName: 'MuiNe_Beach',
      wifiPassword: 'muine123',
      isVerified: true,
      status: 'ACTIVE',
      featured: false,
      averageRating: 4.7,
      totalReviews: 58,
      totalBookings: 89,
      occupancyRate: 82,
      publishedAt: new Date(),
    }
  })

  const listing8 = await prisma.listing.create({
    data: {
      hostId: host1.id,
      title: 'Nhà Vườn Cần Thơ - Trải Nghiệm Miền Tây',
      slug: 'nha-vuon-can-tho-trai-nghiem-mien-tay',
      description: 'Nhà vườn rộng 500m2 ven sông Hậu. Vườn trái cây, ao cá, bếp ngoài trời. Trải nghiệm văn hóa miền Tây đích thực. Chủ nhà nhiệt tình hướng dẫn nấu ăn.',
      propertyType: 'FARM_STAY',
      roomType: 'ENTIRE_PLACE',
      maxGuests: 6,
      bedrooms: 3,
      beds: 3,
      bathrooms: 2,
      country: 'Việt Nam',
      city: 'Cần Thơ',
      state: 'Cần Thơ',
      address: 'Đường Trần Văn Khéo, Cái Răng',
      zipCode: '900000',
      latitude: 10.0341,
      longitude: 105.7722,
      neighborhood: 'Ven sông Hậu',
      basePrice: 1800000,
      cleaningFee: 300000,
      serviceFee: 180000,
      currency: 'VND',
      images: [
        'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200',
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200',
      ],
      amenities: [],
      checkInTime: '13:00',
      checkOutTime: '12:00',
      minNights: 2,
      maxNights: 7,
      instantBookable: false,
      cancellationPolicy: 'FLEXIBLE',
      allowPets: true,
      allowSmoking: false,
      allowEvents: false,
      allowChildren: true,
      hasSmartLock: false,
      wifiName: 'CanTho_Garden',
      wifiPassword: 'cantho2024',
      isVerified: true,
      status: 'ACTIVE',
      featured: false,
      averageRating: 4.9,
      totalReviews: 73,
      totalBookings: 95,
      occupancyRate: 88,
      publishedAt: new Date(),
    }
  })

  const listing9 = await prisma.listing.create({
    data: {
      hostId: host2.id,
      title: 'Condo Vũng Tàu Front Beach - Tầng Cao',
      slug: 'condo-vung-tau-front-beach-tang-cao',
      description: 'Condo 2 phòng ngủ tầng 25 view biển panorama. Hồ bơi rooftop, gym, sauna. Gần bãi sau 2 phút đi bộ. Đầy đủ tiện nghi như khách sạn 5 sao.',
      propertyType: 'CONDO',
      roomType: 'ENTIRE_PLACE',
      maxGuests: 5,
      bedrooms: 2,
      beds: 3,
      bathrooms: 2,
      country: 'Việt Nam',
      city: 'Vũng Tàu',
      state: 'Bà Rịa - Vũng Tàu',
      address: 'Thi Sách, Thắng Tam',
      zipCode: '790000',
      latitude: 10.3458,
      longitude: 107.0843,
      neighborhood: 'Bãi sau',
      basePrice: 2200000,
      cleaningFee: 350000,
      serviceFee: 220000,
      currency: 'VND',
      images: [
        'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=1200',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200',
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200',
      ],
      amenities: [],
      checkInTime: '14:00',
      checkOutTime: '12:00',
      minNights: 2,
      maxNights: 30,
      instantBookable: true,
      cancellationPolicy: 'MODERATE',
      allowPets: false,
      allowSmoking: false,
      allowEvents: false,
      allowChildren: true,
      hasSmartLock: true,
      wifiName: 'VungTau_Condo',
      wifiPassword: 'vungtau24',
      isVerified: true,
      status: 'ACTIVE',
      featured: true,
      averageRating: 4.8,
      totalReviews: 91,
      totalBookings: 145,
      occupancyRate: 87,
      publishedAt: new Date(),
    }
  })

  const listing10 = await prisma.listing.create({
    data: {
      hostId: host1.id,
      title: 'Cabin Sapa View Ruộng Bậc Thang',
      slug: 'cabin-sapa-view-ruong-bac-thang',
      description: 'Cabin gỗ ấm áp giữa núi rừng Sapa. View ruộng bậc thang tuyệt đẹp. Lò sưởi, bếp đầy đủ. Trải nghiệm sống chậm giữa thiên nhiên. Trekking, visit bản làng.',
      propertyType: 'CABIN',
      roomType: 'ENTIRE_PLACE',
      maxGuests: 4,
      bedrooms: 2,
      beds: 2,
      bathrooms: 1,
      country: 'Việt Nam',
      city: 'Sa Pa',
      state: 'Lào Cai',
      address: 'Thôn Tả Van, Xã Hầu Thào',
      zipCode: '330000',
      latitude: 22.3364,
      longitude: 103.8438,
      neighborhood: 'Vùng cao Sapa',
      basePrice: 1000000,
      cleaningFee: 200000,
      serviceFee: 100000,
      currency: 'VND',
      images: [
        'https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=1200',
        'https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=1200',
        'https://images.unsplash.com/photo-1499696010180-025ef6e1a8f9?w=1200',
      ],
      amenities: [],
      checkInTime: '14:00',
      checkOutTime: '11:00',
      minNights: 2,
      maxNights: 7,
      instantBookable: false,
      cancellationPolicy: 'MODERATE',
      allowPets: false,
      allowSmoking: false,
      allowEvents: false,
      allowChildren: true,
      hasSmartLock: false,
      wifiName: 'Sapa_Cabin',
      wifiPassword: 'sapa1234',
      isVerified: true,
      status: 'ACTIVE',
      featured: true,
      averageRating: 4.9,
      totalReviews: 112,
      totalBookings: 156,
      occupancyRate: 91,
      publishedAt: new Date(),
    }
  })

  console.log('✅ Extended listings created')

  console.log('🎟️ Creating vouchers & coupons...')

  const seedNow = new Date()
  const addDays = (days: number) => {
    const date = new Date(seedNow)
    date.setDate(date.getDate() + days)
    return date
  }

  const adminVoucherConfig = {
    code: 'LUXE10',
    name: 'Ưu đãi thành viên toàn hệ thống',
    description: 'Giảm 10% cho đơn từ 2 đêm, tối đa 2.000.000₫.',
    type: PromotionType.GENERAL,
    discountType: DiscountType.PERCENTAGE,
    discountValue: 10,
    maxDiscount: 2_000_000,
    minBookingValue: 4_000_000,
    maxUses: 500,
    maxUsesPerUser: 3,
    pointCost: 0,
    source: PromotionSource.ADMIN,
    hostId: null,
    stackWithMembership: true,
    stackWithPromotions: false,
    allowedMembershipTiers: [
      LoyaltyTier.SILVER,
      LoyaltyTier.GOLD,
      LoyaltyTier.PLATINUM,
      LoyaltyTier.DIAMOND,
    ],
    listingIds: [] as string[],
    propertyTypes: [] as PropertyType[],
    metadata: {
      highlight: 'Giảm 10% toàn bộ hệ thống',
    } as Prisma.JsonObject,
    validFrom: seedNow,
    validUntil: addDays(120),
    isActive: true,
  } satisfies Prisma.PromotionUncheckedCreateInput

  const loyaltyVoucherConfig = {
    code: 'POINTS15',
    name: 'Đổi điểm nhận voucher 15%',
    description: 'Voucher giảm 15% tối đa 1.500.000₫ dành cho thành viên đổi điểm.',
    type: PromotionType.GENERAL,
    discountType: DiscountType.PERCENTAGE,
    discountValue: 15,
    maxDiscount: 1_500_000,
    minBookingValue: 3_000_000,
    maxUses: 300,
    maxUsesPerUser: 2,
    pointCost: 2_500,
    source: PromotionSource.LOYALTY_EXCHANGE,
    hostId: null,
    stackWithMembership: true,
    stackWithPromotions: false,
    allowedMembershipTiers: [] as LoyaltyTier[],
    listingIds: [] as string[],
    propertyTypes: [] as PropertyType[],
    metadata: {
      highlight: 'Đổi 2.500 điểm để nhận ưu đãi 15%',
    } as Prisma.JsonObject,
    validFrom: seedNow,
    validUntil: addDays(90),
    isActive: true,
  } satisfies Prisma.PromotionUncheckedCreateInput

  const hostVoucherConfig = {
    code: 'VILLA20',
    name: 'Ưu đãi riêng villa Nha Trang',
    description: 'Giảm 20% cho kỳ nghỉ tối thiểu 3 đêm tại villa Nha Trang.',
    type: PromotionType.GENERAL,
    discountType: DiscountType.PERCENTAGE,
    discountValue: 20,
    maxDiscount: 3_000_000,
    minBookingValue: 6_000_000,
    maxUses: 120,
    maxUsesPerUser: 1,
    pointCost: 0,
    source: PromotionSource.HOST,
    hostId: host1.id,
    stackWithMembership: true,
    stackWithPromotions: false,
    allowedMembershipTiers: [] as LoyaltyTier[],
    listingIds: [listing1.id],
    propertyTypes: [listing1.propertyType],
    metadata: {
      feature: 'Host-specific coupon',
    } as Prisma.JsonObject,
    validFrom: seedNow,
    validUntil: addDays(60),
    isActive: true,
  } satisfies Prisma.PromotionUncheckedCreateInput

  const { code: adminVoucherCode, ...adminVoucherData } = adminVoucherConfig
  const { code: loyaltyVoucherCode, ...loyaltyVoucherData } = loyaltyVoucherConfig
  const { code: hostVoucherCode, ...hostVoucherData } = hostVoucherConfig

  const [adminVoucher, loyaltyVoucher, hostVoucher] = await Promise.all([
    prisma.promotion.upsert({
      where: { code: adminVoucherCode },
      update: adminVoucherData,
      create: adminVoucherConfig,
    }),
    prisma.promotion.upsert({
      where: { code: loyaltyVoucherCode },
      update: loyaltyVoucherData,
      create: loyaltyVoucherConfig,
    }),
    prisma.promotion.upsert({
      where: { code: hostVoucherCode },
      update: hostVoucherData,
      create: hostVoucherConfig,
    }),
  ])

  const spaReward = await prisma.rewardCatalogItem.findUnique({
    where: { slug: 'spa-credit' },
  })

  if (spaReward && spaReward.promotionId !== loyaltyVoucher.id) {
    const existingMetadata = ensureJsonObject(spaReward.metadata)

    await prisma.rewardCatalogItem.update({
      where: { id: spaReward.id },
      data: {
        promotionId: loyaltyVoucher.id,
        pointsCost: loyaltyVoucher.pointCost ?? spaReward.pointsCost,
        metadata: {
          ...existingMetadata,
          promotionCode: loyaltyVoucher.code,
        } as Prisma.JsonObject,
      },
    })
  }

  const existingRedemption = await prisma.promotionRedemption.findFirst({
    where: {
      promotionId: loyaltyVoucher.id,
      userId: guest2.id,
    },
  })

  if (!existingRedemption && spaReward) {
    const currentGuest2 = await prisma.user.findUnique({
      where: { id: guest2.id },
      select: { loyaltyPoints: true },
    })

    const redemptionCost = loyaltyVoucher.pointCost ?? spaReward.pointsCost ?? 0
    const balanceAfter = Math.max((currentGuest2?.loyaltyPoints ?? 0) - redemptionCost, 0)

    const rewardRedemption = await prisma.rewardRedemption.create({
      data: {
        userId: guest2.id,
        rewardId: spaReward.id,
        status: 'FULFILLED',
        pointsSpent: redemptionCost,
        fulfilledAt: seedNow,
        metadata: {
          promotionId: loyaltyVoucher.id,
          catalogItemSlug: spaReward.slug,
        },
      },
    })

    const promotionRedemption = await prisma.promotionRedemption.create({
      data: {
        promotionId: loyaltyVoucher.id,
        userId: guest2.id,
        status: 'ACTIVE',
        pointsSpent: redemptionCost,
        redeemedAt: seedNow,
        expiresAt: loyaltyVoucher.validUntil,
        metadata: {
          rewardRedemptionId: rewardRedemption.id,
          catalogItemSlug: spaReward.slug,
        },
      },
    })

    await prisma.rewardTransaction.create({
      data: {
        userId: guest2.id,
        transactionType: 'DEBIT',
        source: 'REDEMPTION',
        points: -redemptionCost,
        balanceAfter,
        description: `Đổi voucher ${loyaltyVoucher.code}`,
        referenceId: promotionRedemption.id,
        metadata: {
          promotionId: loyaltyVoucher.id,
          catalogItemSlug: spaReward.slug,
        },
      },
    })

    await prisma.user.update({
      where: { id: guest2.id },
      data: { loyaltyPoints: balanceAfter },
    })

    await prisma.promotion.update({
      where: { id: loyaltyVoucher.id },
      data: {
        usedCount: { increment: 1 },
      },
    })
  }

  console.log('✅ Vouchers seeded')

  // Create Bookings
  console.log('📅 Creating bookings...')
  
  const booking1 = await prisma.booking.create({
    data: {
      guestId: guest1.id,
      hostId: host1.id,
      listingId: listing1.id,
      checkIn: new Date('2025-01-15'),
      checkOut: new Date('2025-01-18'),
      nights: 3,
      adults: 4,
      basePrice: 3500000,
      cleaningFee: 500000,
      serviceFee: 350000,
      totalPrice: 10500000,
      status: 'COMPLETED',
      completedAt: new Date('2025-01-18'),
    }
  })

  const booking2 = await prisma.booking.create({
    data: {
      guestId: guest2.id,
      hostId: host1.id,
      listingId: listing1.id,
      checkIn: new Date('2025-02-20'),
      checkOut: new Date('2025-02-23'),
      nights: 3,
      adults: 4,
      children: 2,
      basePrice: 3500000,
      cleaningFee: 500000,
      serviceFee: 350000,
      totalPrice: 10500000,
      status: 'COMPLETED',
      completedAt: new Date('2025-02-23'),
    }
  })

  const booking3 = await prisma.booking.create({
    data: {
      guestId: guest1.id,
      hostId: host1.id,
      listingId: listing2.id,
      checkIn: new Date('2025-03-10'),
      checkOut: new Date('2025-03-13'),
      nights: 3,
      adults: 4,
      basePrice: 2800000,
      cleaningFee: 400000,
      serviceFee: 280000,
      totalPrice: 8400000,
      status: 'COMPLETED',
      completedAt: new Date('2025-03-13'),
    }
  })

  const booking4 = await prisma.booking.create({
    data: {
      guestId: guest2.id,
      hostId: host2.id,
      listingId: listing3.id,
      checkIn: new Date('2025-04-05'),
      checkOut: new Date('2025-04-10'),
      nights: 5,
      adults: 6,
      children: 2,
      basePrice: 8500000,
      cleaningFee: 1000000,
      serviceFee: 850000,
      totalPrice: 42500000,
      status: 'COMPLETED',
      completedAt: new Date('2025-04-10'),
    }
  })

  const booking5 = await prisma.booking.create({
    data: {
      guestId: guest1.id,
      hostId: host1.id,
      listingId: listing5.id,
      checkIn: new Date('2025-05-01'),
      checkOut: new Date('2025-05-04'),
      nights: 3,
      adults: 2,
      basePrice: 1200000,
      cleaningFee: 200000,
      serviceFee: 120000,
      totalPrice: 3600000,
      status: 'COMPLETED',
      completedAt: new Date('2025-05-04'),
    }
  })

  console.log('✅ Bookings created')

  // Create Reviews
  console.log('⭐ Creating reviews...')

  await prisma.review.createMany({
    data: [
      {
        listingId: listing1.id,
        reviewerId: guest1.id,
        revieweeId: host1.id,
        bookingId: booking1.id,
        type: 'GUEST_TO_HOST',
        overallRating: 5,
        comment: 'Villa tuyệt vời! View biển đẹp không tì vết. Chủ nhà nhiệt tình, check-in dễ dàng. Nhất định sẽ quay lại!',
        cleanlinessRating: 5,
        accuracyRating: 5,
        checkInRating: 5,
        communicationRating: 5,
        locationRating: 5,
        valueRating: 5,
      },
      {
        listingId: listing1.id,
        reviewerId: guest2.id,
        revieweeId: host1.id,
        bookingId: booking2.id,
        type: 'GUEST_TO_HOST',
        overallRating: 5,
        comment: 'Gia đình mình đã có 3 ngày tuyệt vời tại villa. Hồ bơi sạch sẽ, phòng rộng rãi. Rất đáng tiền!',
        cleanlinessRating: 5,
        accuracyRating: 5,
        checkInRating: 5,
        communicationRating: 5,
        locationRating: 5,
        valueRating: 4,
      },
      {
        listingId: listing2.id,
        reviewerId: guest1.id,
        revieweeId: host1.id,
        bookingId: booking3.id,
        type: 'GUEST_TO_HOST',
        overallRating: 5,
        comment: 'Biệt thự đẹp như mơ! Không khí Đà Lạt mát mẻ, view đồi thông thơ mộng. Chủ nhà rất chu đáo.',
        cleanlinessRating: 5,
        accuracyRating: 5,
        checkInRating: 5,
        communicationRating: 5,
        locationRating: 4,
        valueRating: 5,
      },
      {
        listingId: listing3.id,
        reviewerId: guest2.id,
        revieweeId: host2.id,
        bookingId: booking4.id,
        type: 'GUEST_TO_HOST',
        overallRating: 5,
        comment: 'Resort đẳng cấp 5 sao! Butler phục vụ tận tình 24/7. Bãi biển riêng tuyệt đẹp. Đáng từng đồng!',
        cleanlinessRating: 5,
        accuracyRating: 5,
        checkInRating: 5,
        communicationRating: 5,
        locationRating: 5,
        valueRating: 5,
      },
      {
        listingId: listing5.id,
        reviewerId: guest1.id,
        revieweeId: host1.id,
        bookingId: booking5.id,
        type: 'GUEST_TO_HOST',
        overallRating: 5,
        comment: 'Nhà cổ Hội An rất đẹp và authentic. Gần phố cổ nhưng vẫn yên tĩnh. Trải nghiệm tuyệt vời!',
        cleanlinessRating: 5,
        accuracyRating: 5,
        checkInRating: 5,
        communicationRating: 5,
        locationRating: 5,
        valueRating: 5,
      },
    ]
  })

  console.log('✅ Reviews created')

  console.log('🎉 Database seeding completed!')
  console.log('\n📊 Summary:')
  console.log(`- Users: ${await prisma.user.count()}`)
  console.log(`- Listings: ${await prisma.listing.count()}`)
  console.log(`- Bookings: ${await prisma.booking.count()}`)
  console.log(`- Reviews: ${await prisma.review.count()}`)
  console.log('\n✨ Featured Listings:')
  console.log('  • Villa Nha Trang (4.9⭐)')
  console.log('  • Biệt thự Đà Lạt (4.8⭐)')
  console.log('  • Resort Phú Quốc (5.0⭐)')
  console.log('  • Condo Vũng Tàu (4.8⭐)')
  console.log('  • Cabin Sapa (4.9⭐)')
  console.log('\n✅ All done!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
