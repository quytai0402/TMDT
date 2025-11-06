// @ts-nocheck - Seed file with generated Prisma types
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
import { getNearbyPlaces } from '../lib/nearby-places'

const prisma = new PrismaClient()
const prismaAny = prisma as any

const ensureJsonObject = (value: Prisma.JsonValue | null | undefined): Prisma.JsonObject => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Prisma.JsonObject
  }

  return {}
}

const buildNearbyPlaces = (city: string, latitude: number, longitude: number) => {
  try {
    const places = getNearbyPlaces(city, latitude, longitude)
    if (!places.length) {
      return []
    }

    return places.map((place) => ({
      name: place.name,
      type: place.type,
      distance: place.distance,
      rating: typeof place.rating === 'number' ? place.rating : null,
      description: place.description ?? null,
      lat: place.lat,
      lng: place.lng,
    }))
  } catch (error) {
    console.warn('Unable to build nearby places for seed entry:', city, error)
    return []
  }
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

  const guideApplicant = await prisma.user.upsert({
    where: { email: 'quytaii424@gmail.com' },
    update: {
      name: 'Quý Tài',
      bio: 'Đam mê dẫn tour khám phá Sài Gòn về đêm với các trải nghiệm ẩm thực bản địa.',
      phone: '0978123456',
      languages: ['Tiếng Việt', 'English'],
    },
    create: {
      email: 'quytaii424@gmail.com',
      name: 'Quý Tài',
      password: hashedPassword,
      role: 'GUEST',
      emailVerified: new Date(),
      phone: '0978123456',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=guidetai',
      bio: 'Đam mê dẫn tour khám phá Sài Gòn về đêm với các trải nghiệm ẩm thực bản địa.',
      languages: ['Tiếng Việt', 'English'],
    },
  })

  const guideApplicationPayload = {
    displayName: 'Tai Quy Experiences',
    tagline: 'Khám phá Sài Gòn về đêm cùng local insider',
    introduction:
      'Tôi là Quý Tài, sinh ra và lớn lên tại Sài Gòn. Suốt 6 năm qua tôi dẫn khách trải nghiệm những khu phố đêm, ẩm thực đường phố và câu chuyện văn hoá bản địa độc đáo.',
    experienceSummary:
      'Hơn 200 buổi tour ẩm thực và nghệ thuật đường phố trong 3 năm gần đây, hợp tác cùng các hướng dẫn viên trẻ và nhà báo địa phương.',
    languages: ['Tiếng Việt', 'English'],
    serviceAreas: ['TP.HCM', 'Quận 1', 'Quận 3'],
    specialties: ['Ẩm thực', 'Văn hoá', 'Nightlife'],
    availabilityNotes: 'Có thể dẫn tour buổi tối từ thứ Ba đến Chủ Nhật, nhận nhóm tối đa 6 khách.',
    portfolioLinks: ['https://instagram.com/tai.saigon.nightlife'],
    subscriptionAcknowledged: true,
    status: 'PENDING' as const,
    adminNotes: null,
    reviewedAt: null,
    guideProfileId: null,
    sponsorId: null,
  }

  const existingGuideApplication = await prisma.guideApplication.findFirst({
    where: { applicantId: guideApplicant.id },
  })

  if (existingGuideApplication) {
    await prisma.guideApplication.update({
      where: { id: existingGuideApplication.id },
      data: guideApplicationPayload,
    })
  } else {
    await prisma.guideApplication.create({
      data: {
        applicantId: guideApplicant.id,
        ...guideApplicationPayload,
      },
    })
  }

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
  membershipPlanRecords.forEach((plan: (typeof membershipPlanRecords)[number]) => membershipPlanMap.set(plan.slug, plan))

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
    cashValue?: number
    quantityAvailable?: number | null
    maxPerUser?: number | null
    image?: string
    terms?: string
    badgeSlug?: string
    promotionCode?: string
    validityDays?: number
    requiredTier?: string
    startAt?: Date | null
    endAt?: Date | null
    metadata?: any
  }> = [
    // UPGRADE category
    {
      slug: 'weekend-upgrade',
      name: 'Nâng hạng cuối tuần',
      description: 'Đổi 2.000 điểm để được nâng hạng phòng khả dụng cuối tuần. Áp dụng cho booking từ 2 đêm trở lên.',
      category: 'UPGRADE',
      pointsCost: 2000,
      cashValue: 500000,
      quantityAvailable: null, // Unlimited
      maxPerUser: 3,
      image: 'https://images.unsplash.com/photo-1505691723518-36a5ac3be353?w=1200',
      terms: 'Áp dụng cho booking tối thiểu 2 đêm, tuỳ tình trạng phòng. Không áp dụng kèm voucher khác.',
      validityDays: 90,
      requiredTier: 'SILVER',
      metadata: {
        highlight: 'Phổ biến',
        icon: '⬆️',
      },
    },
    {
      slug: 'early-checkin',
      name: 'Check-in sớm',
      description: 'Check-in sớm từ 12:00 (tiết kiệm 2 giờ chờ đợi)',
      category: 'UPGRADE',
      pointsCost: 1500,
      cashValue: 300000,
      quantityAvailable: null,
      maxPerUser: 5,
      image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1200',
      terms: 'Áp dụng khi phòng sẵn sàng. Không hoàn lại điểm nếu không thể check-in sớm.',
      validityDays: 60,
    },
    {
      slug: 'late-checkout',
      name: 'Check-out muộn',
      description: 'Check-out muộn đến 15:00 (thêm 4 giờ tận hưởng)',
      category: 'UPGRADE',
      pointsCost: 1800,
      cashValue: 400000,
      quantityAvailable: null,
      maxPerUser: 5,
      image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=1200',
      terms: 'Áp dụng khi không có booking tiếp theo. Xác nhận với host trước khi check-out.',
      validityDays: 60,
    },
    // EXPERIENCE category
    {
      slug: 'airport-pickup',
      name: 'Đưa đón sân bay miễn phí',
      description: 'Dịch vụ đưa đón sân bay một chiều với xe 4-7 chỗ. Tận hưởng chuyến đi thoải mái.',
      category: 'EXPERIENCE',
      pointsCost: 3500,
      cashValue: 800000,
      quantityAvailable: null,
      maxPerUser: 2,
      image: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1200',
      terms: 'Cần đặt tối thiểu trước 48 giờ so với lịch bay. Áp dụng cho các sân bay chính.',
      validityDays: 180,
      metadata: {
        highlight: 'Phổ biến',
        icon: '🚗',
      },
    },
    {
      slug: 'guided-tour',
      name: 'Tour hướng dẫn địa phương',
      description: 'Tour hướng dẫn 4 giờ khám phá điểm nổi bật địa phương với hướng dẫn viên chuyên nghiệp.',
      category: 'EXPERIENCE',
      pointsCost: 4500,
      cashValue: 1000000,
      quantityAvailable: 50,
      maxPerUser: 1,
      image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200',
      terms: 'Đặt tour trước 7 ngày. Nhóm tối đa 8 người. Bao gồm vé tham quan.',
      validityDays: 365,
      requiredTier: 'GOLD',
    },
    {
      slug: 'cooking-class',
      name: 'Lớp nấu ăn địa phương',
      description: 'Tham gia lớp nấu ăn 3 giờ học các món ăn truyền thống với đầu bếp địa phương.',
      category: 'EXPERIENCE',
      pointsCost: 4000,
      cashValue: 900000,
      quantityAvailable: 30,
      maxPerUser: 2,
      image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1200',
      terms: 'Đặt trước 5 ngày. Bao gồm nguyên liệu và bữa ăn.',
      validityDays: 365,
    },
    // VOUCHER category
    {
      slug: 'spa-credit',
      name: 'Phiếu spa 60 phút',
      description: 'Voucher spa 60 phút tại đối tác cao cấp của LuxeStay. Massage và facial trị liệu.',
      category: 'VOUCHER',
      pointsCost: 2500,
      cashValue: 600000,
      quantityAvailable: 100,
      maxPerUser: 3,
      image: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=1200',
      terms: 'Có hiệu lực trong 60 ngày kể từ khi đổi. Cần đặt lịch trước.',
      validityDays: 60,
      metadata: {
        highlight: 'Yêu thích',
        icon: '💆',
      },
    },
    {
      slug: 'restaurant-voucher',
      name: 'Voucher nhà hàng 500K',
      description: 'Voucher ăn uống 500.000₫ tại nhà hàng đối tác. Áp dụng cho bữa tối cao cấp.',
      category: 'VOUCHER',
      pointsCost: 2200,
      cashValue: 500000,
      quantityAvailable: null,
      maxPerUser: 5,
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200',
      terms: 'Có hiệu lực trong 90 ngày. Không áp dụng với các chương trình khuyến mãi khác.',
      validityDays: 90,
    },
    {
      slug: 'coffee-voucher',
      name: 'Voucher cafe 200K',
      description: 'Voucher cafe 200.000₫ tại các quán cà phê đối tác. Thưởng thức cafe và bánh ngọt.',
      category: 'VOUCHER',
      pointsCost: 800,
      cashValue: 200000,
      quantityAvailable: null,
      maxPerUser: 10,
      image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1200',
      terms: 'Có hiệu lực trong 90 ngày. Áp dụng tại tất cả đối tác.',
      validityDays: 90,
      metadata: {
        highlight: 'Mới',
        icon: '☕',
      },
    },
    // DISCOUNT category
    {
      slug: 'booking-discount-10',
      name: 'Giảm giá 10% booking',
      description: 'Voucher giảm giá 10% cho đơn booking tiếp theo. Tối đa 2.000.000₫.',
      category: 'DISCOUNT',
      pointsCost: 3000,
      cashValue: null,
      quantityAvailable: null,
      maxPerUser: 2,
      image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200',
      terms: 'Có hiệu lực trong 60 ngày. Áp dụng cho booking tối thiểu 2 đêm. Không cộng dồn với voucher khác.',
      validityDays: 60,
      requiredTier: 'GOLD',
      metadata: {
        highlight: 'Độc quyền',
        icon: '🎁',
      },
    },
    {
      slug: 'booking-discount-5',
      name: 'Giảm giá 5% booking',
      description: 'Voucher giảm giá 5% cho đơn booking tiếp theo. Tối đa 1.000.000₫.',
      category: 'DISCOUNT',
      pointsCost: 1500,
      cashValue: null,
      quantityAvailable: null,
      maxPerUser: 3,
      image: 'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?w=1200',
      terms: 'Có hiệu lực trong 90 ngày. Áp dụng cho booking tối thiểu 1 đêm.',
      validityDays: 90,
    },
    // CASHBACK category
    {
      slug: 'cashback-100k',
      name: 'Hoàn tiền 100K',
      description: 'Nhận 100.000₫ hoàn tiền vào tài khoản để sử dụng cho booking tiếp theo.',
      category: 'CASHBACK',
      pointsCost: 4000,
      cashValue: 100000,
      quantityAvailable: null,
      maxPerUser: 5,
      image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1200',
      terms: 'Số tiền hoàn sẽ được cộng vào tài khoản trong vòng 3 ngày. Có hiệu lực 6 tháng.',
      validityDays: 180,
      requiredTier: 'PLATINUM',
      metadata: {
        highlight: 'VIP',
        icon: '💰',
      },
    },
    // MERCHANDISE category
    {
      slug: 'luxestay-tote',
      name: 'Túi vải LuxeStay',
      description: 'Túi vải eco-friendly có logo LuxeStay. Thiết kế đẹp, bền, thân thiện môi trường.',
      category: 'MERCHANDISE',
      pointsCost: 500,
      cashValue: 150000,
      quantityAvailable: 200,
      maxPerUser: 2,
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1200',
      terms: 'Miễn phí vận chuyển. Giao hàng trong 7-10 ngày làm việc.',
      metadata: {
        icon: '🛍️',
      },
    },
    {
      slug: 'luxestay-mug',
      name: 'Cốc giữ nhiệt LuxeStay',
      description: 'Cốc giữ nhiệt cao cấp in logo LuxeStay. Giữ nhiệt 12 giờ, dung tích 500ml.',
      category: 'MERCHANDISE',
      pointsCost: 600,
      cashValue: 180000,
      quantityAvailable: 150,
      maxPerUser: 2,
      image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=1200',
      terms: 'Miễn phí vận chuyển. Giao hàng trong 7-10 ngày làm việc.',
      metadata: {
        icon: '☕',
      },
    },
    // OTHER category
    {
      slug: 'pet-sitting',
      name: 'Dịch vụ trông thú cưng',
      description: 'Dịch vụ trông thú cưng 1 ngày tại đối tác uy tín khi bạn đi du lịch.',
      category: 'OTHER',
      pointsCost: 2800,
      cashValue: 700000,
      quantityAvailable: null,
      maxPerUser: 2,
      image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=1200',
      terms: 'Đặt trước 7 ngày. Bao gồm chỗ ở, thức ăn và chăm sóc cơ bản.',
      validityDays: 90,
    },
    {
      slug: 'laundry-service',
      name: 'Dịch vụ giặt là',
      description: 'Dịch vụ giặt là cho 5kg quần áo tại homestay hoặc đối tác gần nhất.',
      category: 'OTHER',
      pointsCost: 1200,
      cashValue: 300000,
      quantityAvailable: null,
      maxPerUser: 5,
      image: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=1200',
      terms: 'Đặt trước 24 giờ. Bao gồm giặt, sấy và gấp.',
      validityDays: 60,
    },
  ]

  // Get badges and promotions for linking
  const bronzeBadge = badgeMap.get('bronze-explorer')
  const goldBadge = badgeMap.get('gold-ambassador')
  
  const catalogItems = await Promise.all(
    catalogConfigs.map(async (reward) => {
      let badgeId = null
      if (reward.badgeSlug) {
        const badge = badgeMap.get(reward.badgeSlug)
        badgeId = badge?.id ?? null
      }

      let promotionId = null
      if (reward.promotionCode) {
        const promotion = await prisma.promotion.findUnique({
          where: { code: reward.promotionCode },
        })
        promotionId = promotion?.id ?? null
      }

      const metadata: any = {
        validityDays: reward.validityDays,
        requiredTier: reward.requiredTier,
        ...reward.metadata,
      }

      return prismaAny.rewardCatalogItem.upsert({
        where: { slug: reward.slug },
        update: {
          name: reward.name,
          description: reward.description,
          category: reward.category,
          pointsCost: reward.pointsCost,
          cashValue: reward.cashValue ?? null,
          quantityAvailable: reward.quantityAvailable ?? null,
          maxPerUser: reward.maxPerUser ?? null,
          image: reward.image ?? null,
          terms: reward.terms ?? null,
          badgeId: badgeId,
          promotionId: promotionId,
          startAt: reward.startAt ?? null,
          endAt: reward.endAt ?? null,
          isActive: true,
          metadata: metadata as Prisma.JsonObject,
        },
        create: {
          slug: reward.slug,
          name: reward.name,
          description: reward.description,
          category: reward.category,
          pointsCost: reward.pointsCost,
          cashValue: reward.cashValue ?? null,
          quantityAvailable: reward.quantityAvailable ?? null,
          maxPerUser: reward.maxPerUser ?? null,
          image: reward.image ?? null,
          terms: reward.terms ?? null,
          badgeId: badgeId,
          promotionId: promotionId,
          startAt: reward.startAt ?? null,
          endAt: reward.endAt ?? null,
          isActive: true,
          metadata: metadata as Prisma.JsonObject,
        },
      })
      })
  )

  console.log(`✅ Catalog items created (${catalogItems.length} items)`)

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
    update: {
      hostId: host1.id,
      title: 'Villa Sang Trọng View Biển Nha Trang',
      description:
        'Villa 4 phòng ngủ tuyệt đẹp với view biển toàn cảnh Nha Trang. Thiết kế hiện đại, đầy đủ tiện nghi cao cấp. Hồ bơi riêng, BBQ ngoài trời. Cách bãi biển chỉ 2 phút đi bộ.',
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
  nearbyPlaces: buildNearbyPlaces('Nha Trang', 12.2388, 109.1967),
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
    },
    create: {
      hostId: host1.id,
      title: 'Villa Sang Trọng View Biển Nha Trang',
      slug: 'villa-sang-trong-view-bien-nha-trang',
      description:
        'Villa 4 phòng ngủ tuyệt đẹp với view biển toàn cảnh Nha Trang. Thiết kế hiện đại, đầy đủ tiện nghi cao cấp. Hồ bơi riêng, BBQ ngoài trời. Cách bãi biển chỉ 2 phút đi bộ.',
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
  nearbyPlaces: buildNearbyPlaces('Nha Trang', 12.2388, 109.1967),
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
    },
  })

  const listing2 = await prisma.listing.upsert({
    where: { slug: 'biet-thu-da-lat-view-doi-thong' },
    update: {
      hostId: host1.id,
      title: 'Biệt Thự Đà Lạt View Đồi Thông',
      description:
        'Biệt thự phong cách châu Âu giữa lòng Đà Lạt. 3 phòng ngủ rộng rãi, lò sưởi, bếp đầy đủ. Khu vườn hoa đẹp, view đồi thông thơ mộng. Gần chợ Đà Lạt 5 phút lái xe.',
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
  nearbyPlaces: buildNearbyPlaces('Đà Lạt', 11.9404, 108.4583),
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
    },
    create: {
      hostId: host1.id,
      title: 'Biệt Thự Đà Lạt View Đồi Thông',
      slug: 'biet-thu-da-lat-view-doi-thong',
      description:
        'Biệt thự phong cách châu Âu giữa lòng Đà Lạt. 3 phòng ngủ rộng rãi, lò sưởi, bếp đầy đủ. Khu vườn hoa đẹp, view đồi thông thơ mộng. Gần chợ Đà Lạt 5 phút lái xe.',
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
  nearbyPlaces: buildNearbyPlaces('Đà Lạt', 11.9404, 108.4583),
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
    },
  })

  const listing3 = await prisma.listing.upsert({
    where: { slug: 'resort-phu-quoc-bai-sao-villa-bien' },
    update: {
      hostId: host2.id,
      title: 'Resort Phú Quốc Bãi Sao - Villa Biển',
      description:
        'Villa 5 sao ngay bãi Sao Phú Quốc. 5 phòng ngủ sang trọng, hồ bơi vô cực, bếp hiện đại. Dịch vụ butler 24/7. Tầm nhìn biển tuyệt đẹp, riêng tư tuyệt đối.',
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
  nearbyPlaces: buildNearbyPlaces('Phú Quốc', 10.1699, 103.9676),
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
    },
    create: {
      hostId: host2.id,
      title: 'Resort Phú Quốc Bãi Sao - Villa Biển',
      slug: 'resort-phu-quoc-bai-sao-villa-bien',
      description:
        'Villa 5 sao ngay bãi Sao Phú Quốc. 5 phòng ngủ sang trọng, hồ bơi vô cực, bếp hiện đại. Dịch vụ butler 24/7. Tầm nhìn biển tuyệt đẹp, riêng tư tuyệt đối.',
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
  nearbyPlaces: buildNearbyPlaces('Phú Quốc', 10.1699, 103.9676),
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
    },
  })

  const listing4 = await prisma.listing.upsert({
    where: { slug: 'penthouse-saigon-landmark-81' },
    update: {
      hostId: host2.id,
      title: 'Penthouse Saigon Landmark 81',
      description:
        'Penthouse cao cấp tầng 68 Landmark 81. 3 phòng ngủ, thiết kế sang trọng. View toàn cảnh Sài Gòn 360 độ. Hồ bơi riêng, phòng gym, rạp phim mini.',
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
  nearbyPlaces: buildNearbyPlaces('Hồ Chí Minh', 10.7946, 106.7218),
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
    },
    create: {
      hostId: host2.id,
      title: 'Penthouse Saigon Landmark 81',
      slug: 'penthouse-saigon-landmark-81',
      description:
        'Penthouse cao cấp tầng 68 Landmark 81. 3 phòng ngủ, thiết kế sang trọng. View toàn cảnh Sài Gòn 360 độ. Hồ bơi riêng, phòng gym, rạp phim mini.',
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
  nearbyPlaces: buildNearbyPlaces('Hồ Chí Minh', 10.7946, 106.7218),
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
    },
  })

  const listing5 = await prisma.listing.upsert({
    where: { slug: 'homestay-hoi-an-pho-co-nha-co-truyen' },
    update: {
      hostId: host1.id,
      title: 'Homestay Hội An Phố Cổ - Nhà Cổ Truyền',
      description:
        'Nhà cổ truyền thống Hội An được trùng tu. 2 phòng ngủ, sân vườn nhỏ, giếng trời. Cách phố cổ 3 phút đi bộ. Trải nghiệm văn hóa Việt Nam đích thực.',
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
  nearbyPlaces: buildNearbyPlaces('Hội An', 15.8801, 108.3380),
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
    },
    create: {
      hostId: host1.id,
      title: 'Homestay Hội An Phố Cổ - Nhà Cổ Truyền',
      slug: 'homestay-hoi-an-pho-co-nha-co-truyen',
      description:
        'Nhà cổ truyền thống Hội An được trùng tu. 2 phòng ngủ, sân vườn nhỏ, giếng trời. Cách phố cổ 3 phút đi bộ. Trải nghiệm văn hóa Việt Nam đích thực.',
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
  nearbyPlaces: buildNearbyPlaces('Hội An', 15.8801, 108.3380),
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
    },
  })

  const listing6 = await prisma.listing.upsert({
    where: { slug: 'can-ho-studio-view-ho-tay-ha-noi' },
    update: {
      hostId: host1.id,
      title: 'Căn Hộ Studio View Hồ Tây Hà Nội',
      description:
        'Studio hiện đại view Hồ Tây tuyệt đẹp. Đầy đủ tiện nghi, gần Phố Cổ. Thích hợp cho cặp đôi hoặc 1-2 người. Ban công riêng ngắm hoàng hôn.',
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
    nearbyPlaces: buildNearbyPlaces('Hà Nội', 21.0545, 105.8212),
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
    },
    create: {
      hostId: host1.id,
      title: 'Căn Hộ Studio View Hồ Tây Hà Nội',
      slug: 'can-ho-studio-view-ho-tay-ha-noi',
      description:
        'Studio hiện đại view Hồ Tây tuyệt đẹp. Đầy đủ tiện nghi, gần Phố Cổ. Thích hợp cho cặp đôi hoặc 1-2 người. Ban công riêng ngắm hoàng hôn.',
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
  nearbyPlaces: buildNearbyPlaces('Hà Nội', 21.0545, 105.8212),
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
    },
  })

  const listing7 = await prisma.listing.upsert({
    where: { slug: 'bungalow-mui-ne-view-bien-truc-dien' },
    update: {
      hostId: host2.id,
      title: 'Bungalow Mũi Né View Biển Trực Diện',
      description:
        'Bungalow gỗ trên bãi biển Mũi Né. Bước chân ra là biển, view bình minh tuyệt đẹp. BBQ riêng, kayak miễn phí. Trải nghiệm resort giá hợp lý.',
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
    nearbyPlaces: buildNearbyPlaces('Phan Thiết', 10.9333, 108.2833),
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
    },
    create: {
      hostId: host2.id,
      title: 'Bungalow Mũi Né View Biển Trực Diện',
      slug: 'bungalow-mui-ne-view-bien-truc-dien',
      description:
        'Bungalow gỗ trên bãi biển Mũi Né. Bước chân ra là biển, view bình minh tuyệt đẹp. BBQ riêng, kayak miễn phí. Trải nghiệm resort giá hợp lý.',
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
  nearbyPlaces: buildNearbyPlaces('Phan Thiết', 10.9333, 108.2833),
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
    },
  })

  const listing8 = await prisma.listing.upsert({
    where: { slug: 'nha-vuon-can-tho-trai-nghiem-mien-tay' },
    update: {
      hostId: host1.id,
      title: 'Nhà Vườn Cần Thơ - Trải Nghiệm Miền Tây',
      description:
        'Nhà vườn rộng 500m2 ven sông Hậu. Vườn trái cây, ao cá, bếp ngoài trời. Trải nghiệm văn hóa miền Tây đích thực. Chủ nhà nhiệt tình hướng dẫn nấu ăn.',
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
  nearbyPlaces: buildNearbyPlaces('Cần Thơ', 10.0341, 105.7722),
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
    },
    create: {
      hostId: host1.id,
      title: 'Nhà Vườn Cần Thơ - Trải Nghiệm Miền Tây',
      slug: 'nha-vuon-can-tho-trai-nghiem-mien-tay',
      description:
        'Nhà vườn rộng 500m2 ven sông Hậu. Vườn trái cây, ao cá, bếp ngoài trời. Trải nghiệm văn hóa miền Tây đích thực. Chủ nhà nhiệt tình hướng dẫn nấu ăn.',
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
  nearbyPlaces: buildNearbyPlaces('Cần Thơ', 10.0341, 105.7722),
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
    },
  })

  const listing9 = await prisma.listing.upsert({
    where: { slug: 'condo-vung-tau-front-beach-tang-cao' },
    update: {
      hostId: host2.id,
      title: 'Condo Vũng Tàu Front Beach - Tầng Cao',
      description:
        'Condo 2 phòng ngủ tầng 25 view biển panorama. Hồ bơi rooftop, gym, sauna. Gần bãi sau 2 phút đi bộ. Đầy đủ tiện nghi như khách sạn 5 sao.',
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
  nearbyPlaces: buildNearbyPlaces('Vũng Tàu', 10.3458, 107.0843),
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
    },
    create: {
      hostId: host2.id,
      title: 'Condo Vũng Tàu Front Beach - Tầng Cao',
      slug: 'condo-vung-tau-front-beach-tang-cao',
      description:
        'Condo 2 phòng ngủ tầng 25 view biển panorama. Hồ bơi rooftop, gym, sauna. Gần bãi sau 2 phút đi bộ. Đầy đủ tiện nghi như khách sạn 5 sao.',
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
  nearbyPlaces: buildNearbyPlaces('Vũng Tàu', 10.3458, 107.0843),
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
    },
  })

  const listing10 = await prisma.listing.upsert({
    where: { slug: 'cabin-sapa-view-ruong-bac-thang' },
    update: {
      hostId: host1.id,
      title: 'Cabin Sapa View Ruộng Bậc Thang',
      description:
        'Cabin gỗ ấm áp giữa núi rừng Sapa. View ruộng bậc thang tuyệt đẹp. Lò sưởi, bếp đầy đủ. Trải nghiệm sống chậm giữa thiên nhiên. Trekking, visit bản làng.',
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
  nearbyPlaces: buildNearbyPlaces('Sa Pa', 22.3364, 103.8438),
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
    },
    create: {
      hostId: host1.id,
      title: 'Cabin Sapa View Ruộng Bậc Thang',
      slug: 'cabin-sapa-view-ruong-bac-thang',
      description:
        'Cabin gỗ ấm áp giữa núi rừng Sapa. View ruộng bậc thang tuyệt đẹp. Lò sưởi, bếp đầy đủ. Trải nghiệm sống chậm giữa thiên nhiên. Trekking, visit bản làng.',
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
  nearbyPlaces: buildNearbyPlaces('Sa Pa', 22.3364, 103.8438),
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
    },
  })

  // Add more listings for better region coverage
  console.log('🏠 Adding more listings for region coverage...')
  
  const additionalListings = [
    {
      slug: 'apartment-da-nang-beach-front',
      hostId: host1.id,
      title: 'Căn Hộ Đà Nẵng View Biển',
      city: 'Đà Nẵng',
      state: 'Đà Nẵng',
      country: 'Việt Nam',
      address: '123 Võ Nguyên Giáp, Ngũ Hành Sơn',
      latitude: 16.0544,
      longitude: 108.2269,
      basePrice: 1800000,
      propertyType: 'APARTMENT' as PropertyType,
      bedrooms: 2,
      beds: 2,
      bathrooms: 2,
      maxGuests: 4,
    },
    {
      slug: 'villa-hue-ancient-city',
      hostId: host2.id,
      title: 'Villa Huế Gần Hoàng Thành',
      city: 'Huế',
      state: 'Thừa Thiên Huế',
      country: 'Việt Nam',
      address: '45 Lê Lợi, Phú Hội',
      latitude: 16.4637,
      longitude: 107.5908,
      basePrice: 2200000,
      propertyType: 'VILLA' as PropertyType,
      bedrooms: 3,
      beds: 4,
      bathrooms: 2,
      maxGuests: 8,
    },
    {
      slug: 'homestay-quy-nhon-seaside',
      hostId: host1.id,
      title: 'Homestay Quy Nhơn Gần Biển',
      city: 'Quy Nhơn',
      state: 'Bình Định',
      country: 'Việt Nam',
      address: '78 Trần Hưng Đạo, Nguyễn Văn Cừ',
      latitude: 13.7629,
      longitude: 109.2197,
      basePrice: 1200000,
      propertyType: 'HOUSE' as PropertyType,
      bedrooms: 2,
      beds: 3,
      bathrooms: 2,
      maxGuests: 6,
    },
  ]

  await Promise.all(
    additionalListings.map((listingData) =>
      prisma.listing.upsert({
        where: { slug: listingData.slug },
        update: {
          status: 'ACTIVE',
          publishedAt: new Date(),
          nearbyPlaces: buildNearbyPlaces(listingData.city, listingData.latitude, listingData.longitude),
        },
        create: {
          hostId: listingData.hostId,
          title: listingData.title,
          slug: listingData.slug,
          description: `${listingData.title} - Chỗ ở lý tưởng cho kỳ nghỉ của bạn.`,
          propertyType: listingData.propertyType,
          roomType: 'ENTIRE_PLACE',
          maxGuests: listingData.maxGuests,
          bedrooms: listingData.bedrooms,
          beds: listingData.beds,
          bathrooms: listingData.bathrooms,
          country: listingData.country,
          city: listingData.city,
          state: listingData.state,
          address: listingData.address,
          zipCode: '000000',
          latitude: listingData.latitude,
          longitude: listingData.longitude,
          neighborhood: listingData.city,
          nearbyPlaces: buildNearbyPlaces(listingData.city, listingData.latitude, listingData.longitude),
          basePrice: listingData.basePrice,
          cleaningFee: listingData.basePrice * 0.15,
          serviceFee: listingData.basePrice * 0.1,
          currency: 'VND',
          images: [
            'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200',
            'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200',
          ],
          amenities: [],
          checkInTime: '14:00',
          checkOutTime: '11:00',
          minNights: 1,
          maxNights: 30,
          instantBookable: true,
          cancellationPolicy: 'FLEXIBLE',
          allowPets: false,
          allowSmoking: false,
          allowEvents: false,
          allowChildren: true,
          hasSmartLock: true,
          wifiName: `WiFi_${listingData.city.replace(/\s/g, '')}`,
          wifiPassword: 'welcome2024',
          isVerified: true,
          status: 'ACTIVE',
          featured: false,
          averageRating: 4.6,
          totalReviews: 15,
          totalBookings: 25,
          occupancyRate: 70,
          publishedAt: new Date(),
        },
      })
    )
  )

  console.log(`✅ Additional ${additionalListings.length} listings created for regions`)

  console.log('✅ Listings created')

  console.log('🧭 Creating curated collections...')

  const curatedCollectionsConfig = [
    {
      slug: 'romantic-getaways',
      title: 'Romantic Getaways',
      subtitle: 'Những homestay lãng mạn hoàn hảo cho các cặp đôi.',
      description:
        'Bộ sưu tập tập trung vào không gian riêng tư, ánh sáng ấm áp và những trải nghiệm dành riêng cho hai người. Các homestay đều có bồn tắm thư giãn, khu vườn yên tĩnh cùng dịch vụ dinner lãng mạn theo yêu cầu.',
      tags: ['Couple-friendly', 'Private', 'View đẹp', 'Bồn tắm'],
      location: 'Đà Lạt, Phú Quốc',
      category: 'experience',
      featured: true,
      curator: {
        name: 'Thu Phương',
        title: 'Travel Editor',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop',
      },
      listingSlugs: [
        'biet-thu-da-lat-view-doi-thong',
        'resort-phu-quoc-bai-sao-villa-bien',
        'villa-sang-trong-view-bien-nha-trang',
      ],
    },
    {
      slug: 'workation-spots',
      title: 'Workation Paradise',
      subtitle: 'Không gian làm việc truyền cảm hứng với WiFi mạnh và view đẹp.',
      description:
        'Các chỗ ở được tuyển chọn đều có bàn làm việc riêng, ghế ergonomic, WiFi từ 100Mbps trở lên cùng các tiện ích hỗ trợ remote work. Gần quán café, co-working và dịch vụ vệ sinh định kỳ.',
      tags: ['WiFi cao tốc', 'Workspace', 'Yên tĩnh', 'Long stay'],
      location: 'Đà Nẵng, TP.HCM',
      category: 'workation',
      featured: true,
      curator: {
        name: 'Minh Tuấn',
        title: 'Digital Nomad',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop',
      },
      listingSlugs: [
        'penthouse-saigon-landmark-81',
        'can-ho-studio-view-ho-tay-ha-noi',
        'apartment-da-nang-beach-front',
      ],
    },
    {
      slug: 'beach-vibes',
      title: 'Beach Vibes',
      subtitle: 'Thức dậy cùng tiếng sóng và bãi biển trong tầm mắt.',
      description:
        'Các căn gần biển với ban công hoặc hồ bơi hướng biển, chỉ mất dưới 5 phút đi bộ để chạm cát. Phù hợp cho nhóm bạn mê hoạt động nước, BBQ tối và các trải nghiệm hồ bơi vô cực.',
      tags: ['View biển', 'Beach club', 'Kayak', 'BBQ'],
      location: 'Nha Trang, Vũng Tàu, Phú Quốc',
      category: 'location',
      featured: true,
      curator: {
        name: 'Hải Yến',
        title: 'Beach Explorer',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&auto=format&fit=crop',
      },
      listingSlugs: [
        'villa-sang-trong-view-bien-nha-trang',
        'resort-phu-quoc-bai-sao-villa-bien',
        'condo-vung-tau-front-beach-tang-cao',
        'bungalow-mui-ne-view-bien-truc-dien',
        'homestay-quy-nhon-seaside',
      ],
    },
    {
      slug: 'mountain-retreat',
      title: 'Mountain Retreat',
      subtitle: 'Chốn nghỉ dưỡng giữa núi rừng với khí hậu mát lạnh quanh năm.',
      description:
        'Các homestay tọa lạc tại Đà Lạt, Sa Pa với tầm nhìn ruộng bậc thang hoặc đồi thông. Mỗi nơi đều có không gian ngoài trời rộng, lò sưởi, dịch vụ picnic sáng và hướng dẫn trekking bản địa.',
      tags: ['Ruộng bậc thang', 'Lò sưởi', 'Picnic', 'Trekking'],
      location: 'Đà Lạt, Sa Pa',
      category: 'experience',
      featured: false,
      curator: {
        name: 'Khánh An',
        title: 'Experience Curator',
        avatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=200&auto=format&fit=crop',
      },
      listingSlugs: [
        'biet-thu-da-lat-view-doi-thong',
        'cabin-sapa-view-ruong-bac-thang',
        'cloud-villa-fansipan',
      ],
    },
    {
      slug: 'eco-stays',
      title: 'Eco-Friendly Stays',
      subtitle: 'Trải nghiệm lưu trú bền vững, hài hòa cùng thiên nhiên.',
      description:
        'Lựa chọn các căn sử dụng vật liệu tái chế, hệ thống năng lượng xanh và chương trình giảm thiểu rác thải. Khách có thể tham gia workshop trồng cây, thu hoạch nông sản cùng người bản địa.',
      tags: ['Eco', 'Vườn trái cây', 'Workshop', 'Local'],
      location: 'Cần Thơ, Mũi Né',
      category: 'special',
      featured: false,
      curator: {
        name: 'Gia Linh',
        title: 'Sustainability Lead',
        avatar: 'https://images.unsplash.com/photo-1544723795-1f342f02e6d0?w=200&auto=format&fit=crop',
      },
      listingSlugs: [
        'nha-vuon-can-tho-trai-nghiem-mien-tay',
        'bungalow-mui-ne-view-bien-truc-dien',
      ],
    },
  ] as const

  const curatedListingSlugs = Array.from(
    new Set(curatedCollectionsConfig.flatMap((collection) => collection.listingSlugs))
  )

  const curatedListings = await prisma.listing.findMany({
    where: { slug: { in: curatedListingSlugs } },
    select: {
      id: true,
      slug: true,
      images: true,
    },
  })

  const listingLookup = new Map(curatedListings.map((listing) => [listing.slug, listing]))
  const defaultImage = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200'

  await prisma.curatedCollection.deleteMany()

  for (const collection of curatedCollectionsConfig) {
    const linkedListings = collection.listingSlugs
      .map((slug) => listingLookup.get(slug))
      .filter((listing): listing is typeof curatedListings[number] => Boolean(listing))

    if (linkedListings.length === 0) {
      console.warn(`⚠️  Skipping curated collection ${collection.slug} vì không tìm thấy listing phù hợp`)
      continue
    }

    const heroImage = linkedListings[0]?.images?.[0] ?? defaultImage
    const cardImage = linkedListings[0]?.images?.[1] ?? heroImage

    await prisma.curatedCollection.upsert({
      where: { slug: collection.slug },
      update: {
        title: collection.title,
        subtitle: collection.subtitle,
        description: collection.description,
        heroImage,
        cardImage,
        tags: collection.tags,
        location: collection.location,
        category: collection.category,
        listingsCount: linkedListings.length,
        listingIds: linkedListings.map((listing) => listing.id),
        featured: collection.featured,
        curatorName: collection.curator?.name ?? null,
        curatorTitle: collection.curator?.title ?? null,
        curatorAvatar: collection.curator?.avatar ?? null,
      },
      create: {
        slug: collection.slug,
        title: collection.title,
        subtitle: collection.subtitle,
        description: collection.description,
        heroImage,
        cardImage,
        tags: collection.tags,
        location: collection.location,
        category: collection.category,
        listingsCount: linkedListings.length,
        listingIds: linkedListings.map((listing) => listing.id),
        featured: collection.featured,
        curatorName: collection.curator?.name ?? null,
        curatorTitle: collection.curator?.title ?? null,
        curatorAvatar: collection.curator?.avatar ?? null,
      },
    })
  }

  console.log('✅ Curated collections created')

  // Create Amenities
  console.log('✨ Creating amenities...')
  const amenityConfigs = [
    { name: 'WiFi', nameVi: 'WiFi', icon: 'wifi', category: 'BASIC', isPopular: true, description: 'Kết nối internet miễn phí' },
    { name: 'Air Conditioning', nameVi: 'Điều hòa', icon: 'snowflake', category: 'FACILITIES', isPopular: true, description: 'Điều hòa nhiệt độ' },
    { name: 'Swimming Pool', nameVi: 'Hồ bơi', icon: 'pool', category: 'FACILITIES', isPopular: true, description: 'Hồ bơi riêng hoặc chung' },
    { name: 'Kitchen', nameVi: 'Bếp', icon: 'utensils', category: 'DINING', isPopular: true, description: 'Bếp đầy đủ tiện nghi' },
    { name: 'Parking', nameVi: 'Bãi đỗ xe', icon: 'car', category: 'LOGISTICS', isPopular: true, description: 'Chỗ đậu xe miễn phí' },
    { name: 'Washing Machine', nameVi: 'Máy giặt', icon: 'tshirt', category: 'FACILITIES', isPopular: true, description: 'Máy giặt và sấy' },
    { name: 'TV', nameVi: 'TV', icon: 'tv', category: 'ENTERTAINMENT', isPopular: true, description: 'Smart TV với streaming' },
    { name: 'Hot Tub', nameVi: 'Bồn tắm nước nóng', icon: 'hot-tub', category: 'FACILITIES', isPopular: false, description: 'Bồn tắm nước nóng' },
    { name: 'Gym', nameVi: 'Phòng gym', icon: 'dumbbell', category: 'FACILITIES', isPopular: false, description: 'Phòng tập thể dục' },
    { name: 'BBQ Grill', nameVi: 'Lò nướng BBQ', icon: 'fire', category: 'DINING', isPopular: false, description: 'Lò nướng ngoài trời' },
  ]

  const amenities = await Promise.all(
    amenityConfigs.map((amenity) =>
      prismaAny.amenity.upsert({
        where: { name: amenity.name },
        update: amenity,
        create: amenity,
      })
    )
  )
  
  // Update listings with amenities
  const amenityIds = amenities.map((a: any) => a.id)
  await prisma.listing.updateMany({
    where: { slug: { in: ['villa-sang-trong-view-bien-nha-trang', 'biet-thu-da-lat-view-doi-thong', 'resort-phu-quoc-bai-sao-villa-bien'] } },
    data: { amenities: amenityIds.slice(0, 7) },
  })
  
  console.log('✅ Amenities created')

  // Create Host Profiles
  console.log('👤 Creating host profiles...')
  const hostProfile1 = await prismaAny.hostProfile.upsert({
    where: { userId: host1.id },
    update: {},
    create: {
      userId: host1.id,
      responseRate: 98,
      responseTime: 30,
      acceptanceRate: 95,
      isSuperHost: true,
      superHostSince: new Date('2023-01-01'),
      totalEarnings: 500000000,
      availableBalance: 15000000,
      pendingPayoutBalance: 5000000,
      averageRating: 4.9,
      totalReviews: 250,
      instantBookEnabled: true,
      governmentIdVerified: true,
      emailVerified: true,
      phoneVerified: true,
      primaryLocationSlug: 'nha-trang',
      primaryLocationName: 'Nha Trang',
    },
  })

  const hostProfile2 = await prismaAny.hostProfile.upsert({
    where: { userId: host2.id },
    update: {},
    create: {
      userId: host2.id,
      responseRate: 96,
      responseTime: 45,
      acceptanceRate: 92,
      isSuperHost: false,
      totalEarnings: 800000000,
      availableBalance: 25000000,
      pendingPayoutBalance: 8000000,
      averageRating: 4.8,
      totalReviews: 180,
      instantBookEnabled: false,
      governmentIdVerified: true,
      emailVerified: true,
      phoneVerified: true,
      primaryLocationSlug: 'phu-quoc',
      primaryLocationName: 'Phú Quốc',
    },
  })

  console.log('✅ Host profiles created')

  // Create Host Applications
  console.log('📝 Creating host applications...')
  await prismaAny.hostApplication.createMany({
    data: [
      {
        userId: guest2.id,
        locationSlug: 'ho-chi-minh',
        locationName: 'Hồ Chí Minh',
        introduction: 'Tôi muốn trở thành host để chia sẻ căn hộ của mình tại Hồ Chí Minh.',
        experience: 'Đã có kinh nghiệm tiếp đón khách du lịch quốc tế.',
        status: 'APPROVED',
        maintenanceAcknowledged: true,
        createdAt: new Date('2024-12-01'),
        reviewedAt: new Date('2024-12-05'),
      },
      {
        userId: guest1.id,
        locationSlug: 'da-nang',
        locationName: 'Đà Nẵng',
        introduction: 'Có biệt thự ven biển muốn cho thuê.',
        experience: 'Mới bắt đầu trong lĩnh vực homestay.',
        status: 'PENDING',
        maintenanceAcknowledged: false,
        createdAt: new Date(),
      },
    ],
  })

  console.log('✅ Host applications created')

  // Create Team Members
  console.log('👥 Creating team members...')
  await prismaAny.teamMember.createMany({
    data: [
      {
        hostProfileId: hostProfile1.id,
        userId: guest1.id,
        role: 'CLEANER',
        permissions: ['VIEW_LISTINGS', 'VIEW_BOOKINGS', 'VIEW_CALENDAR'],
      },
      {
        hostProfileId: hostProfile1.id,
        userId: guest2.id,
        role: 'COORDINATOR',
        permissions: ['VIEW_LISTINGS', 'EDIT_LISTINGS', 'VIEW_BOOKINGS', 'MANAGE_BOOKINGS', 'VIEW_MESSAGES', 'SEND_MESSAGES'],
      },
    ],
  })

  console.log('✅ Team members created')

  // Create Blocked Dates and Pricing Rules
  console.log('📅 Creating blocked dates & pricing rules...')
  const futureDate = new Date()
  futureDate.setMonth(futureDate.getMonth() + 2)
  const futureDate2 = new Date(futureDate)
  futureDate2.setDate(futureDate2.getDate() + 3)

  await prismaAny.blockedDate.createMany({
    data: [
      {
        listingId: listing1.id,
        startDate: futureDate,
        endDate: futureDate2,
        reason: 'Bảo trì',
      },
      {
        listingId: listing3.id,
        startDate: new Date('2025-12-24'),
        endDate: new Date('2025-12-26'),
        reason: 'Kỳ nghỉ lễ',
      },
    ],
  })

  await prismaAny.pricingRule.createMany({
    data: [
      {
        listingId: listing1.id,
        name: 'Giá cao điểm mùa hè',
        startDate: new Date('2025-06-01'),
        endDate: new Date('2025-08-31'),
        multiplier: 1.5,
        isActive: true,
      },
      {
        listingId: listing2.id,
        name: 'Tết Nguyên Đán',
        startDate: new Date('2026-01-28'),
        endDate: new Date('2026-02-03'),
        multiplier: 2.0,
        isActive: true,
      },
    ],
  })

  console.log('✅ Blocked dates & pricing rules created')

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
    },
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
    },
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
    },
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
    },
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
    },
  })

  console.log('✅ Bookings created')

  // Create Payments and Payment Methods
  console.log('💳 Creating payments & payment methods...')
  const paymentMethod1 = await prismaAny.paymentMethod.create({
    data: {
      userId: guest1.id,
      type: 'VNPAY',
      walletType: 'VNPAY',
      isDefault: true,
    },
  })

  const paymentMethod2 = await prismaAny.paymentMethod.create({
    data: {
      userId: guest2.id,
      type: 'MOMO',
      walletType: 'MOMO',
      walletPhone: '0934567890',
      isDefault: true,
    },
  })

  const payments = await Promise.all([
    prismaAny.payment.create({
      data: {
        bookingId: booking1.id,
        amount: booking1.totalPrice,
        currency: 'VND',
        paymentMethod: 'VNPAY',
        paymentGateway: 'VNPAY',
        status: 'COMPLETED',
        transactionId: 'VNPAY_' + Date.now(),
        paidAt: booking1.createdAt,
      },
    }),
    prismaAny.payment.create({
      data: {
        bookingId: booking2.id,
        amount: booking2.totalPrice,
        currency: 'VND',
        paymentMethod: 'MOMO',
        paymentGateway: 'MOMO',
        status: 'COMPLETED',
        transactionId: 'MOMO_' + Date.now(),
        paidAt: booking2.createdAt,
      },
    }),
    prismaAny.payment.create({
      data: {
        bookingId: booking3.id,
        amount: booking3.totalPrice,
        currency: 'VND',
        paymentMethod: 'BANK_TRANSFER',
        paymentGateway: 'VNPAY',
        status: 'COMPLETED',
        transactionId: 'BANK_' + Date.now(),
        paidAt: booking3.createdAt,
      },
    }),
  ])

  // Create Transactions
  await Promise.all([
    prismaAny.transaction.create({
      data: {
        userId: guest1.id,
        type: 'BOOKING_PAYMENT',
        amount: -booking1.totalPrice,
        currency: 'VND',
        description: 'Thanh toán booking villa Nha Trang',
        status: 'COMPLETED',
        referenceId: booking1.id,
      },
    }),
    prismaAny.transaction.create({
      data: {
        userId: host1.id,
        type: 'PAYOUT',
        amount: booking1.hostEarnings || booking1.totalPrice * 0.85,
        currency: 'VND',
        description: 'Thu nhập từ booking',
        status: 'COMPLETED',
        referenceId: booking1.id,
      },
    }),
  ])

  console.log('✅ Payments & payment methods created')

  // Create Host Payouts
  console.log('💰 Creating host payouts...')
  const hostPayout1 = await prismaAny.hostPayout.create({
    data: {
      hostId: host1.id,
      amount: 50000000,
      status: 'PAID',
      bookingIds: [booking1.id, booking3.id],
      payoutMethod: 'BANK_TRANSFER',
      requestedAt: new Date('2025-01-20'),
      processedAt: new Date('2025-01-21'),
    },
  })

  const hostPayout2 = await prismaAny.hostPayout.create({
    data: {
      hostId: host2.id,
      amount: 35000000,
      status: 'PENDING',
      bookingIds: [booking4.id],
      payoutMethod: 'BANK_TRANSFER',
      requestedAt: new Date(),
    },
  })

  console.log('✅ Host payouts created')

  // Create Conversations and Messages
  console.log('💬 Creating conversations & messages...')
  const conversation1 = await prismaAny.conversation.create({
    data: {
      participants: [guest1.id, host1.id],
      listingId: listing1.id,
      lastMessage: 'Cảm ơn bạn đã đón tiếp!',
      lastMessageAt: new Date(),
      unreadCount: { [guest1.id]: 0, [host1.id]: 1 },
    },
  })

  await prismaAny.message.createMany({
    data: [
      {
        conversationId: conversation1.id,
        senderId: guest1.id,
        bookingId: booking1.id,
        content: 'Xin chào! Tôi muốn hỏi về check-in time.',
        messageType: 'TEXT',
        isRead: true,
        readAt: new Date(),
      },
      {
        conversationId: conversation1.id,
        senderId: host1.id,
        bookingId: booking1.id,
        content: 'Chào bạn! Check-in từ 14:00, bạn có thể đến sớm hơn nếu phòng sẵn sàng.',
        messageType: 'TEXT',
        isRead: true,
        readAt: new Date(),
      },
      {
        conversationId: conversation1.id,
        senderId: guest1.id,
        bookingId: booking1.id,
        content: 'Cảm ơn bạn đã đón tiếp!',
        messageType: 'TEXT',
        isRead: false,
      },
    ],
  })

  console.log('✅ Conversations & messages created')

  // Create Notifications
  console.log('🔔 Creating notifications...')
  await prismaAny.notification.createMany({
    data: [
      {
        userId: guest1.id,
        type: 'BOOKING_CONFIRMED',
        title: 'Đặt phòng đã được xác nhận',
        message: 'Booking tại Villa Nha Trang đã được xác nhận thành công!',
        link: `/booking/${booking1.id}`,
        isRead: true,
        readAt: new Date(),
        sentEmail: true,
        sentPush: true,
      },
      {
        userId: host1.id,
        type: 'BOOKING_REQUEST',
        title: 'Yêu cầu đặt phòng mới',
        message: 'Bạn có một yêu cầu đặt phòng mới từ Lê Thị Thu',
        link: `/host/bookings/${booking1.id}`,
        isRead: false,
        sentEmail: false,
        sentPush: true,
      },
      {
        userId: guest2.id,
        type: 'REVIEW_RECEIVED',
        title: 'Bạn đã nhận được đánh giá mới',
        message: 'Host đã để lại đánh giá cho chuyến đi của bạn!',
        link: `/reviews`,
        isRead: false,
        sentEmail: false,
        sentPush: false,
      },
    ],
  })

  console.log('✅ Notifications created')

  // Create Wishlists and Collections
  console.log('❤️ Creating wishlists & collections...')
  const wishlist1 = await prismaAny.wishlist.findFirst({ where: { userId: guest1.id } })
  if (wishlist1) {
    await prismaAny.wishlist.update({
      where: { id: wishlist1.id },
      data: { listingIds: [listing1.id, listing2.id, listing5.id] },
    })
  } else {
    await prismaAny.wishlist.create({
      data: {
        userId: guest1.id,
        listingIds: [listing1.id, listing2.id, listing5.id],
      },
    })
  }

  const wishlist2 = await prismaAny.wishlist.findFirst({ where: { userId: guest2.id } })
  if (wishlist2) {
    await prismaAny.wishlist.update({
      where: { id: wishlist2.id },
      data: { listingIds: [listing1.id, listing3.id] },
    })
  } else {
    await prismaAny.wishlist.create({
      data: {
        userId: guest2.id,
        listingIds: [listing1.id, listing3.id],
      },
    })
  }

  await prismaAny.collection.createMany({
    data: [
      {
        userId: guest1.id,
        name: 'Những nơi tôi muốn đến',
        description: 'Danh sách các homestay yêu thích',
        coverImage: listing1.images[0],
        listingIds: [listing1.id, listing3.id, listing10.id],
        isPublic: true,
      },
      {
        userId: guest2.id,
        name: 'Beach Resorts',
        description: 'Các resort biển tuyệt vời',
        coverImage: listing3.images[0],
        listingIds: [listing3.id, listing9.id],
        isPublic: true,
      },
    ],
  })

  console.log('✅ Wishlists & collections created')

  // Create User Follows
  console.log('👥 Creating user follows...')
  const userFollowPairs = [
    { followerId: guest1.id, followingId: host1.id },
    { followerId: guest2.id, followingId: host1.id },
    { followerId: guest1.id, followingId: host2.id },
  ]

  for (const pair of userFollowPairs) {
    const existingFollow = await prismaAny.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId: pair.followerId,
          followingId: pair.followingId,
        },
      },
    })

    if (!existingFollow) {
      await prismaAny.userFollow.create({ data: pair })
    }
  }

  console.log('✅ User follows created')

  // Create Services
  console.log('🛍️ Creating services...')
  const services = await Promise.all([
    prismaAny.service.create({
      data: {
        name: 'Pet Care Center Nha Trang',
        description: 'Dịch vụ chăm sóc thú cưng chuyên nghiệp',
        category: 'PET_VET',
        subcategory: 'Veterinary',
        address: '123 Nguyễn Thị Minh Khai, Nha Trang',
        city: 'Nha Trang',
        country: 'Vietnam',
        latitude: 12.2388,
        longitude: 109.1967,
        phone: '02583881234',
        openHours: '8:00 - 20:00 (T2-CN)',
        images: ['https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800'],
        basePrice: 500000,
        features: ['Khám tổng quát', 'Tiêm phòng', 'Phẫu thuật'],
        amenities: ['Parking', 'WiFi'],
        isBookable: true,
        nearbyListings: [listing1.id],
      },
    }),
    prismaAny.service.create({
      data: {
        name: 'Spa & Wellness Đà Lạt',
        description: 'Trung tâm spa và chăm sóc sức khỏe',
        category: 'OTHER',
        subcategory: 'Spa',
        address: '45 Trần Hưng Đạo, Đà Lạt',
        city: 'Đà Lạt',
        country: 'Vietnam',
        latitude: 11.9404,
        longitude: 108.4583,
        phone: '02633888888',
        openHours: '9:00 - 21:00 (Hàng ngày)',
        images: ['https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800'],
        basePrice: 800000,
        features: ['Massage', 'Facial', 'Body Treatment'],
        isBookable: true,
        nearbyListings: [listing2.id],
      },
    }),
  ])

  console.log('✅ Services created')

  // Create Service Bookings
  console.log('📋 Creating service bookings...')
  await prismaAny.serviceBooking.createMany({
    data: [
      {
        serviceId: services[0].id,
        bookingId: booking1.id,
        guestId: guest1.id,
        bookingDate: booking1.checkIn,
        timeSlot: '10:00 - 11:00',
        price: 500000,
        status: 'CONFIRMED',
        confirmedAt: booking1.createdAt,
      },
    ],
  })

  console.log('✅ Service bookings created')

  // Create Posts and Comments
  console.log('📝 Creating posts & comments...')
  const post1 = await prismaAny.post.create({
    data: {
      authorId: guest1.id,
      content: 'Vừa trải nghiệm một kỳ nghỉ tuyệt vời tại villa Nha Trang! View biển đẹp không tì vết. Highly recommend! 🌊✨',
      media: [
        { type: 'image', url: listing1.images[0], caption: 'View từ phòng ngủ chính' },
        { type: 'image', url: listing1.images[1], caption: 'Hồ bơi riêng' },
      ],
      listingId: listing1.id,
      location: 'Nha Trang',
      latitude: listing1.latitude,
      longitude: listing1.longitude,
      likes: [guest2.id, host1.id],
      likesCount: 2,
      commentsCount: 3,
      isPublic: true,
    },
  })

  await prismaAny.comment.createMany({
    data: [
      {
        postId: post1.id,
        authorId: guest2.id,
        content: 'Wow, view đẹp quá! Mình cũng muốn đến đây 😍',
        likesCount: 1,
        likes: [guest1.id],
      },
      {
        postId: post1.id,
        authorId: host1.id,
        content: 'Cảm ơn bạn đã chọn villa của chúng tôi! Rất vui được đón tiếp bạn! 🙏',
        likesCount: 2,
        likes: [guest1.id, guest2.id],
      },
      {
        postId: post1.id,
        authorId: guest1.id,
        parentId: undefined,
        content: 'Mình sẽ quay lại sớm thôi! 🏖️',
        likesCount: 0,
        likes: [],
      },
    ],
  })

  // Update post comments count
  await prismaAny.post.update({
    where: { id: post1.id },
    data: { commentsCount: 3 },
  })

  console.log('✅ Posts & comments created')

  // Create Experiences
  console.log('🎯 Creating experiences...')
  const experience1 = await prismaAny.experience.create({
    data: {
      hostId: host1.id,
      title: 'Tour Ẩm Thực Đà Lạt - Nấu Ăn Cùng Gia Đình',
      description: 'Tham gia lớp nấu ăn đặc biệt, học cách làm các món ăn địa phương Đà Lạt và thưởng thức cùng gia đình.',
      category: 'FOOD_DRINK',
      city: 'Đà Lạt',
      location: 'Biệt thự Đà Lạt',
      latitude: 11.9404,
      longitude: 108.4583,
      image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800',
      images: [
        'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800',
        'https://images.unsplash.com/photo-1551782450-17144efb9c50?w=800',
      ],
      price: 500000,
      currency: 'VND',
      duration: '3 giờ',
      groupSize: 'Tối đa 8 người',
      minGuests: 2,
      maxGuests: 8,
      includedItems: ['Nguyên liệu', 'Công cụ nấu ăn', 'Bữa ăn', 'Nước uống'],
      notIncluded: ['Vận chuyển'],
      requirements: ['Trên 12 tuổi'],
      languages: ['Tiếng Việt', 'English'],
      tags: ['Ẩm thực', 'Văn hóa', 'Gia đình'],
      status: 'ACTIVE',
      isVerified: true,
      averageRating: 4.9,
      totalReviews: 45,
      totalBookings: 120,
    },
  })

  const experience2 = await prismaAny.experience.create({
    data: {
      hostId: host2.id,
      title: 'Snorkeling Tour Phú Quốc',
      description: 'Khám phá thế giới dưới nước tuyệt đẹp tại Phú Quốc với tour snorkeling chuyên nghiệp.',
      category: 'WATER_SPORTS',
      city: 'Phú Quốc',
      location: 'Bãi Sao',
      latitude: 10.1699,
      longitude: 103.9676,
      image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
      images: [
        'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
        'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=800',
      ],
      price: 800000,
      currency: 'VND',
      duration: 'Cả ngày',
      groupSize: 'Tối đa 10 người',
      minGuests: 4,
      maxGuests: 10,
      includedItems: ['Thiết bị lặn', 'Thuyền', 'Hướng dẫn viên', 'Bữa trưa'],
      notIncluded: ['Bảo hiểm'],
      requirements: ['Biết bơi', 'Trên 10 tuổi'],
      languages: ['Tiếng Việt', 'English'],
      tags: ['Lặn biển', 'Tham quan', 'Thể thao'],
      status: 'ACTIVE',
      isVerified: true,
      averageRating: 4.8,
      totalReviews: 78,
      totalBookings: 156,
    },
  })

  console.log('✅ Experiences created')

  // Create Experience Bookings and Reviews
  console.log('📅 Creating experience bookings...')
  const expBooking1 = await prismaAny.experienceBooking.create({
    data: {
      experienceId: experience1.id,
      guestId: guest1.id,
      date: new Date('2025-03-11'),
      timeSlot: '14:00 - 17:00',
      numberOfGuests: 4,
      pricePerPerson: 500000,
      totalPrice: 2000000,
      status: 'COMPLETED',
      paid: true,
    },
  })

  await prismaAny.experienceReview.create({
    data: {
      experienceId: experience1.id,
      bookingId: expBooking1.id,
      authorId: guest1.id,
      rating: 5,
      content: 'Trải nghiệm tuyệt vời! Chúng tôi đã học được nhiều món ăn ngon và có thời gian vui vẻ cùng gia đình.',
      images: ['https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400'],
    },
  })

  console.log('✅ Experience bookings & reviews created')

  // Create Concierge Plans
  console.log('🎩 Creating concierge plans...')
  await prismaAny.conciergePlan.createMany({
    data: [
      {
        bookingId: booking4.id,
        listingId: listing3.id,
        guestId: guest2.id,
        hostId: host2.id,
        status: 'CONFIRMED',
        planDetails: {
          services: ['Airport pickup', 'Daily breakfast', 'Spa session'],
          specialRequests: 'Trẻ em cần giường phụ',
        },
        loyaltyOffer: 'Gold member discount applied',
        hostNotes: 'Khách VIP, ưu tiên chăm sóc',
      },
    ],
  })

  console.log('✅ Concierge plans created')

  // Create Neighborhood Guides
  console.log('🗺️ Creating neighborhood guides...')
  const neighborhoodGuideData = [
    {
      listingId: listing1.id,
      overview: 'Khu vực này nằm ngay trung tâm Nha Trang, gần bãi biển và các điểm du lịch nổi tiếng.',
      gettingAround: 'Dễ dàng đi bộ đến bãi biển, có thể thuê xe máy hoặc taxi.',
      restaurants: [
        { name: 'Nhà Hàng Nướng BBQ', description: 'Nhà hàng BBQ nổi tiếng', distance: 0.5, placeId: 'ChIJ123' },
        { name: 'Lac Canh Restaurant', description: 'Hải sản tươi sống', distance: 1.2 },
      ],
      cafes: [
        { name: 'Rainbow Coffee', description: 'Coffee view biển', distance: 0.8 },
      ],
      attractions: [
        { name: 'Vinpearl Land', description: 'Công viên giải trí', distance: 5.0 },
        { name: 'Chùa Long Sơn', description: 'Di tích lịch sử', distance: 2.5 },
      ],
      shopping: [
        { name: 'Big C Nha Trang', description: 'Siêu thị lớn', distance: 1.5 },
      ],
    },
    {
      listingId: listing2.id,
      overview: 'Khu vực yên tĩnh, gần trung tâm Đà Lạt, view đồi thông đẹp mắt.',
      gettingAround: 'Có thể đi bộ đến chợ Đà Lạt, thuê xe máy để tham quan.',
      restaurants: [
        { name: 'Nhà Hàng Đồng Quê', description: 'Ẩm thực địa phương', distance: 1.0 },
      ],
      cafes: [
        { name: 'Cafe An', description: 'Cafe view đẹp', distance: 0.5 },
      ],
      attractions: [
        { name: 'Hồ Xuân Hương', description: 'Hồ đẹp giữa thành phố', distance: 2.0 },
        { name: 'Dinh Bảo Đại', description: 'Di tích lịch sử', distance: 3.5 },
      ],
    },
  ]

  for (const guide of neighborhoodGuideData) {
    const { listingId, ...guideData } = guide
    await prismaAny.neighborhoodGuide.upsert({
      where: { listingId },
      update: guideData,
      create: { listingId, ...guideData },
    })
  }

  console.log('✅ Neighborhood guides created')

  // Create User Quests
  console.log('🎮 Creating user quests...')
  const quest1 = await prisma.quest.findFirst({ where: { title: 'Đặt phòng đầu tiên' } })
  const quest2 = await prisma.quest.findFirst({ where: { title: 'Viết 3 đánh giá chân thành' } })
  
  if (quest1) {
    await prismaAny.userQuest.upsert({
      where: {
        userId_questId: {
          userId: guest1.id,
          questId: quest1.id,
        },
      },
      update: {
        currentCount: 1,
        isCompleted: true,
        completedAt: booking1.createdAt,
      },
      create: {
        userId: guest1.id,
        questId: quest1.id,
        currentCount: 1,
        isCompleted: true,
        completedAt: booking1.createdAt,
      },
    })
  }

  if (quest2) {
    await prismaAny.userQuest.upsert({
      where: {
        userId_questId: {
          userId: guest1.id,
          questId: quest2.id,
        },
      },
      update: {
        currentCount: 2,
        isCompleted: false,
      },
      create: {
        userId: guest1.id,
        questId: quest2.id,
        currentCount: 2,
        isCompleted: false,
      },
    })
  }

  console.log('✅ User quests created')

  // Create System Settings
  console.log('⚙️ Creating system settings...')
  const systemSettings = [
    {
      key: 'platform_commission_rate',
      value: { rate: 0.15, description: 'Phí hoa hồng nền tảng 15%' },
      updatedBy: admin.id,
    },
    {
      key: 'min_booking_amount',
      value: { amount: 500000, currency: 'VND' },
      updatedBy: admin.id,
    },
    {
      key: 'max_booking_advance_days',
      value: { days: 365 },
      updatedBy: admin.id,
    },
    {
      key: 'auto_confirm_instant_book',
      value: { enabled: true },
      updatedBy: admin.id,
    },
  ]

  for (const setting of systemSettings) {
    const { key, ...settingData } = setting
    await prismaAny.systemSetting.upsert({
      where: { key },
      update: settingData,
      create: { key, ...settingData },
    })
  }

  console.log('✅ System settings created')

  // Create Payment Gateway Configs
  console.log('💳 Creating payment gateway configs...')
  const gatewayConfigs = [
    {
      gateway: 'VNPAY',
      config: {
        merchantId: 'demo_merchant',
        secretKey: 'demo_secret',
        apiUrl: 'https://sandbox.vnpayment.vn',
      },
      isEnabled: true,
      updatedBy: admin.id,
    },
    {
      gateway: 'MOMO',
      config: {
        partnerCode: 'demo_partner',
        accessKey: 'demo_access',
        secretKey: 'demo_secret',
      },
      isEnabled: true,
      updatedBy: admin.id,
    },
  ]

  for (const config of gatewayConfigs) {
    const { gateway, ...configData } = config
    await prismaAny.paymentGatewayConfig.upsert({
      where: { gateway },
      update: configData,
      create: { gateway, ...configData },
    })
  }

  console.log('✅ Payment gateway configs created')

  // Create CMS Blocks
  console.log('📄 Creating CMS blocks...')
  const cmsBlocks = [
    {
      key: 'homepage_hero',
      label: 'Homepage Hero Section',
      data: {
        title: 'Chào mừng đến với LuxeStay',
        subtitle: 'Khám phá những homestay độc đáo tại Việt Nam',
        ctaText: 'Bắt đầu tìm kiếm',
        backgroundImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920',
      },
      updatedBy: admin.id,
    },
    {
      key: 'about_us',
      label: 'About Us Content',
      data: {
        content: 'LuxeStay là nền tảng đặt homestay hàng đầu tại Việt Nam...',
      },
      updatedBy: admin.id,
    },
  ]

  for (const block of cmsBlocks) {
    const { key, ...blockData } = block
    await prismaAny.cmsBlock.upsert({
      where: { key },
      update: blockData,
      create: { key, ...blockData },
    })
  }

  console.log('✅ CMS blocks created')

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

  // Create Disputes (sample)
  console.log('⚖️ Creating disputes...')
  await prismaAny.dispute.create({
    data: {
      bookingId: booking2.id,
      reporterId: guest2.id,
      respondentId: host1.id,
      type: 'REFUND_REQUEST',
      status: 'RESOLVED',
      priority: 'MEDIUM',
      subject: 'Yêu cầu hoàn tiền',
      description: 'Phòng không đúng như mô tả, yêu cầu hoàn tiền một phần.',
      evidence: [],
      resolution: 'Đã hoàn tiền 50% cho khách hàng',
      resolvedBy: admin.id,
      resolvedAt: new Date(),
      refundAmount: booking2.totalPrice * 0.5,
    },
  })

  console.log('✅ Disputes created')

  // Create Audit Logs
  console.log('📋 Creating audit logs...')
  await prismaAny.auditLog.createMany({
    data: [
      {
        userId: admin.id,
        action: 'CREATE_USER',
        entityType: 'User',
        entityId: guest1.id,
        changes: { email: 'khach1@gmail.com', role: 'GUEST' },
        ipAddress: '127.0.0.1',
        userAgent: 'Seed Script',
      },
      {
        userId: admin.id,
        action: 'UPDATE_LISTING',
        entityType: 'Listing',
        entityId: listing1.id,
        changes: { status: 'ACTIVE', featured: true },
        ipAddress: '127.0.0.1',
        userAgent: 'Seed Script',
      },
    ],
  })

  console.log('✅ Audit logs created')

  console.log('🎉 Database seeding completed!')
  console.log('\n📊 Summary:')
  console.log(`- Users: ${await prisma.user.count()}`)
  console.log(`- Listings: ${await prisma.listing.count()}`)
  console.log(`- Bookings: ${await prisma.booking.count()}`)
  console.log(`- Reviews: ${await prisma.review.count()}`)
  console.log(`- Amenities: ${await prismaAny.amenity.count()}`)
  console.log(`- Host Profiles: ${await prismaAny.hostProfile.count()}`)
  console.log(`- Payments: ${await prismaAny.payment.count()}`)
  console.log(`- Messages: ${await prismaAny.message.count()}`)
  console.log(`- Notifications: ${await prismaAny.notification.count()}`)
  console.log(`- Services: ${await prismaAny.service.count()}`)
  console.log(`- Posts: ${await prismaAny.post.count()}`)
  console.log(`- Experiences: ${await prismaAny.experience.count()}`)
  console.log(`- Concierge Plans: ${await prismaAny.conciergePlan.count()}`)
  console.log(`- User Quests: ${await prismaAny.userQuest.count()}`)
  console.log(`- System Settings: ${await prismaAny.systemSetting.count()}`)
  console.log(`- Reward Catalog Items: ${await prismaAny.rewardCatalogItem.count()}`)
  console.log(`- Promotions/Vouchers: ${await prisma.promotion.count()}`)
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
    // @ts-ignore - process is available in Node.js runtime
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
