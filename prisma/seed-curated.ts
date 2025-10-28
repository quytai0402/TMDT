import {
  AmenityCategory,
  BookingStatus,
  CancellationPolicy,
  ExperienceCategory,
  ExperienceStatus,
  ListingStatus,
  LoyaltyTier,
  PrismaClient,
  PropertyType,
  RoomType,
  ServiceCategory,
  ServiceStatus,
  UserRole,
} from '@prisma/client'
import bcrypt from 'bcryptjs'

const resetClient = new PrismaClient()

type ListingSeed = {
  title: string
  description: string
  propertyType: PropertyType
  roomType: RoomType
  maxGuests: number
  bedrooms: number
  beds: number
  bathrooms: number
  address: string
  neighborhood: string
  basePrice: number
  cleaningFee: number
  serviceFee: number
  latitudeOffset: number
  longitudeOffset: number
  images: string[]
  amenityNames: string[]
  verifiedAmenities: string[]
  featured?: boolean
  instantBookable?: boolean
  allowPets?: boolean
  allowSmoking?: boolean
  allowEvents?: boolean
  allowChildren?: boolean
  weekendMultiplier?: number
  weeklyDiscount?: number
  monthlyDiscount?: number
  averageRating: number
  totalReviews: number
  totalBookings: number
  isSecret?: boolean
}

type ExperienceSeed = {
  title: string
  description: string
  category: ExperienceCategory
  locationLabel: string
  latitudeOffset: number
  longitudeOffset: number
  image: string
  images: string[]
  price: number
  duration: string
  groupSize: string
  minGuests: number
  maxGuests: number
  includedItems: string[]
  notIncluded: string[]
  requirements: string[]
  languages: string[]
  tags: string[]
  featured?: boolean
  averageRating: number
  totalReviews: number
  membersOnly?: boolean
}

type ServiceSeed = {
  name: string
  description: string
  category: ServiceCategory
  address: string
  latitudeOffset: number
  longitudeOffset: number
  phone: string
  openHours: string
  isOpen24Hours?: boolean
  images: string[]
  basePrice?: number
  amenities: string[]
  features: string[]
  isBookable?: boolean
  requiresDeposit?: boolean
  depositAmount?: number
  averageRating: number
  totalReviews: number
}

type LocationSeed = {
  key: string
  city: string
  state?: string
  country: string
  latitude: number
  longitude: number
  host: {
    name: string
    email: string
    phone: string
    image: string
    bio: string
    languages: string[]
    isSuperHost?: boolean
  }
  listings: ListingSeed[]
  experiences: ExperienceSeed[]
  services: ServiceSeed[]
}

type GuestSeed = {
  email: string
  name: string
  avatarSeed: string
  phone: string
  loyaltyTier: LoyaltyTier
  loyaltyPoints: number
  languages: string[]
}

type ReviewTemplate = {
  overallRating: number
  cleanlinessRating: number
  accuracyRating: number
  checkInRating: number
  communicationRating: number
  locationRating: number
  valueRating: number
  comment: string
  monthsAgo: number
  nights: number
  guests: number
  aiSentiment?: 'positive' | 'neutral' | 'negative'
  aiKeywords?: string[]
}

const GUEST_SEEDS: GuestSeed[] = [
  {
    email: 'guest1@luxestay.vn',
    name: 'Lê Thị Minh',
    avatarSeed: 'Minh',
    phone: '0911111111',
    loyaltyTier: LoyaltyTier.SILVER,
    loyaltyPoints: 1450,
    languages: ['Tiếng Việt', 'English'],
  },
  {
    email: 'guest2@luxestay.vn',
    name: 'Phạm Quốc Huy',
    avatarSeed: 'Huy',
    phone: '0922222222',
    loyaltyTier: LoyaltyTier.GOLD,
    loyaltyPoints: 2680,
    languages: ['Tiếng Việt'],
  },
  {
    email: 'guest3@luxestay.vn',
    name: 'Bùi Ngọc Lan',
    avatarSeed: 'Lan',
    phone: '0933333333',
    loyaltyTier: LoyaltyTier.BRONZE,
    loyaltyPoints: 720,
    languages: ['Tiếng Việt', 'English'],
  },
  {
    email: 'guest4@luxestay.vn',
    name: 'Đoàn Mạnh Hùng',
    avatarSeed: 'Hung',
    phone: '0944444444',
    loyaltyTier: LoyaltyTier.GOLD,
    loyaltyPoints: 3050,
    languages: ['Tiếng Việt', 'English', '中文'],
  },
  {
    email: 'guest5@luxestay.vn',
    name: 'Trịnh Thu Hà',
    avatarSeed: 'Ha',
    phone: '0955555555',
    loyaltyTier: LoyaltyTier.SILVER,
    loyaltyPoints: 1890,
    languages: ['Tiếng Việt', '한국어'],
  },
  {
    email: 'guest6@luxestay.vn',
    name: 'Nguyễn Đức Khôi',
    avatarSeed: 'Khoi',
    phone: '0966666666',
    loyaltyTier: LoyaltyTier.PLATINUM,
    loyaltyPoints: 4120,
    languages: ['Tiếng Việt', 'English'],
  },
]

const AMENITIES: Array<{
  name: string
  nameVi: string
  icon: string
  category: AmenityCategory
  description: string
  isPopular?: boolean
}> = [
  {
    name: 'High-speed Wifi',
    nameVi: 'Wifi tốc độ cao',
    icon: 'wifi',
    category: AmenityCategory.BASIC,
    description: 'Kết nối internet cáp quang 200Mbps, phủ sóng toàn bộ căn hộ.',
    isPopular: true,
  },
  {
    name: 'Air Conditioning',
    nameVi: 'Máy lạnh',
    icon: 'air-vent',
    category: AmenityCategory.BASIC,
    description: 'Điều hòa hai chiều tại tất cả phòng ngủ và phòng khách.',
    isPopular: true,
  },
  {
    name: 'Full Kitchen',
    nameVi: 'Bếp đầy đủ tiện nghi',
    icon: 'cooking-pot',
    category: AmenityCategory.DINING,
    description: 'Bếp trang bị đầy đủ dụng cụ nấu ăn, gia vị cơ bản và máy rửa chén.',
  },
  {
    name: 'Washer & Dryer',
    nameVi: 'Máy giặt & sấy',
    icon: 'washing-machine',
    category: AmenityCategory.FACILITIES,
    description: 'Máy giặt lồng ngang và máy sấy hiện đại trong khu vực giặt riêng.',
  },
  {
    name: 'Private Parking',
    nameVi: 'Bãi đỗ xe riêng',
    icon: 'car',
    category: AmenityCategory.FACILITIES,
    description: 'Bãi đậu xe miễn phí an toàn ngay trong khuôn viên.',
    isPopular: true,
  },
  {
    name: 'Outdoor Pool',
    nameVi: 'Hồ bơi ngoài trời',
    icon: 'waves',
    category: AmenityCategory.FACILITIES,
    description: 'Hồ bơi ngoài trời nước ấm, vệ sinh hằng ngày, có ghế tắm nắng.',
    isPopular: true,
  },
  {
    name: 'Balcony View',
    nameVi: 'Ban công view đẹp',
    icon: 'sun',
    category: AmenityCategory.FACILITIES,
    description: 'Ban công rộng với góc nhìn toàn cảnh thành phố và khu vườn.',
  },
  {
    name: 'Outdoor BBQ',
    nameVi: 'Khu BBQ ngoài trời',
    icon: 'flame',
    category: AmenityCategory.DINING,
    description: 'Bộ dụng cụ BBQ và bếp than ngoài trời, có mái che.',
  },
  {
    name: 'Baby Cot',
    nameVi: 'Nôi em bé',
    icon: 'baby',
    category: AmenityCategory.FAMILY,
    description: 'Nôi và ghế ăn cho bé, phù hợp gia đình có trẻ nhỏ.',
  },
  {
    name: 'Security Camera',
    nameVi: 'Camera an ninh',
    icon: 'shield',
    category: AmenityCategory.SAFETY,
    description: 'Hệ thống camera an ninh 24/7 tại khu vực chung.',
  },
  {
    name: 'Workspace Desk',
    nameVi: 'Bàn làm việc',
    icon: 'briefcase',
    category: AmenityCategory.WORKSPACE,
    description: 'Bàn làm việc thoải mái, có đèn và ổ cắm riêng.',
  },
  {
    name: 'Smart TV',
    nameVi: 'Smart TV 4K',
    icon: 'tv',
    category: AmenityCategory.ENTERTAINMENT,
    description: 'Tivi 4K tích hợp Netflix, Spotify và dàn âm thanh Bluetooth.',
  },
  {
    name: 'Smart Lock',
    nameVi: 'Khóa thông minh',
    icon: 'key',
    category: AmenityCategory.SAFETY,
    description: 'Hệ thống khóa số thông minh, check-in tự động bất kỳ giờ nào.',
  },
]

const LOCATIONS: LocationSeed[] = [
  {
    key: 'da-lat',
    city: 'Đà Lạt',
    state: 'Lâm Đồng',
    country: 'Vietnam',
    latitude: 11.9404,
    longitude: 108.4583,
    host: {
      name: 'Trần Thanh Thảo',
      email: 'host.dalat@luxestay.vn',
      phone: '0905123456',
      image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80',
      bio: 'Thảo là host bản địa Đà Lạt với hơn 6 năm kinh nghiệm vận hành homestay xanh giữa rừng thông.',
      languages: ['Tiếng Việt', 'English'],
      isSuperHost: true,
    },
    listings: [
      {
        title: 'Le Rêve Garden Villa Đà Lạt',
        description:
          'Biệt thự sân vườn phong cách châu Âu giữa đồi thông, hồ bơi nước ấm và khu BBQ riêng. Phù hợp nhóm bạn hoặc gia đình lớn muốn tận hưởng không gian xanh mát và riêng tư.',
        propertyType: PropertyType.VILLA,
        roomType: RoomType.ENTIRE_PLACE,
        maxGuests: 10,
        bedrooms: 4,
        beds: 5,
        bathrooms: 3.5,
        address: '56 Hoa Cẩm Tú Cầu, Phường 1, Đà Lạt',
        neighborhood: 'Phường 1',
        basePrice: 3500000,
        cleaningFee: 300000,
        serviceFee: 150000,
        latitudeOffset: 0.015,
        longitudeOffset: 0.01,
        images: [
          'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1521783988139-893354fcd0d5?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80',
        ],
        amenityNames: [
          'High-speed Wifi',
          'Air Conditioning',
          'Full Kitchen',
          'Outdoor BBQ',
          'Balcony View',
          'Outdoor Pool',
          'Smart Lock',
        ],
        verifiedAmenities: ['Tự check-in với khóa số', 'Vệ sinh tiêu chuẩn khách sạn', 'Hồ bơi vệ sinh hằng ngày'],
        featured: true,
        instantBookable: true,
        allowPets: false,
        allowSmoking: false,
        allowEvents: true,
        allowChildren: true,
        weekendMultiplier: 1.25,
        weeklyDiscount: 0.08,
        monthlyDiscount: 0.15,
        averageRating: 4.95,
        totalReviews: 86,
        totalBookings: 192,
      },
      {
        title: 'Laluna Pine Retreat',
        description:
          'Căn nhà gỗ ấm cúng với tường kính nhìn ra đồi thông, bếp mở và phòng đọc sách. Buổi sáng ngập tràn sương mù và ánh nắng nhẹ.',
        propertyType: PropertyType.HOUSE,
        roomType: RoomType.ENTIRE_PLACE,
        maxGuests: 6,
        bedrooms: 3,
        beds: 4,
        bathrooms: 2,
        address: '12 Đồi An Sơn, Phường 4, Đà Lạt',
        neighborhood: 'Đồi An Sơn',
        basePrice: 2200000,
        cleaningFee: 200000,
        serviceFee: 120000,
        latitudeOffset: -0.01,
        longitudeOffset: 0.012,
        images: [
          'https://images.unsplash.com/photo-1475855581690-80accde3ae2b?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
        ],
        amenityNames: [
          'High-speed Wifi',
          'Full Kitchen',
          'Washer & Dryer',
          'Balcony View',
          'Outdoor BBQ',
          'Workspace Desk',
          'Smart TV',
        ],
        verifiedAmenities: ['View đồi thông 180°', 'Bếp tiêu chuẩn chef'],
        instantBookable: true,
        allowPets: false,
        allowSmoking: false,
        allowEvents: false,
        allowChildren: true,
        weeklyDiscount: 0.05,
        averageRating: 4.88,
        totalReviews: 124,
        totalBookings: 210,
      },
      {
        title: 'Downtown Loft Đà Lạt',
        description:
          'Căn hộ loft hiện đại ngay trung tâm, thiết kế tối giản với giếng trời và góc làm việc riêng. Đi bộ 5 phút đến chợ Đà Lạt và hồ Xuân Hương.',
        propertyType: PropertyType.APARTMENT,
        roomType: RoomType.ENTIRE_PLACE,
        maxGuests: 4,
        bedrooms: 2,
        beds: 2,
        bathrooms: 1.5,
        address: '27 Nguyễn Văn Trỗi, Phường 2, Đà Lạt',
        neighborhood: 'Chợ Đà Lạt',
        basePrice: 1700000,
        cleaningFee: 150000,
        serviceFee: 90000,
        latitudeOffset: 0.004,
        longitudeOffset: -0.006,
        images: [
          'https://images.unsplash.com/photo-1616594039964-40b46d64af7f?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1505691723518-36a5ac3be353?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1521783988139-893354fcd0d5?auto=format&fit=crop&w=1200&q=80',
        ],
        amenityNames: [
          'High-speed Wifi',
          'Air Conditioning',
          'Full Kitchen',
          'Smart Lock',
          'Workspace Desk',
          'Smart TV',
        ],
        verifiedAmenities: ['Check-in 24/7', 'Bàn làm việc chuẩn ergonomic'],
        instantBookable: true,
        allowPets: false,
        allowSmoking: false,
        allowChildren: true,
        averageRating: 4.82,
        totalReviews: 97,
        totalBookings: 168,
      },
      {
        title: 'Hillside Cabin Dalat Mist',
        description:
          'Cabin gỗ độc lập giữa đồi thông Trại Mát, ban công rộng và khu vườn ngập hoa. Buổi tối có lò sưởi và set trà nóng.',
        propertyType: PropertyType.CABIN,
        roomType: RoomType.ENTIRE_PLACE,
        maxGuests: 3,
        bedrooms: 1,
        beds: 2,
        bathrooms: 1,
        address: 'Ấp Trường Thọ, Trại Mát, Đà Lạt',
        neighborhood: 'Trại Mát',
        basePrice: 1400000,
        cleaningFee: 120000,
        serviceFee: 80000,
        latitudeOffset: -0.018,
        longitudeOffset: -0.009,
        images: [
          'https://images.unsplash.com/photo-1486308510493-aa64833637b1?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1468824357306-a439d58ccb1c?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
        ],
        amenityNames: [
          'High-speed Wifi',
          'Balcony View',
          'Outdoor BBQ',
          'Baby Cot',
          'Smart Lock',
        ],
        verifiedAmenities: ['View săn mây trực tiếp', 'Trà và cà phê đặc sản miễn phí'],
        instantBookable: false,
        allowPets: true,
        allowSmoking: false,
        allowEvents: false,
        allowChildren: true,
        weeklyDiscount: 0.03,
        averageRating: 4.9,
        totalReviews: 73,
        totalBookings: 142,
      },
    ],
    experiences: [
      {
        title: 'Săn mây đón bình minh Đồi Trại Mát',
        description:
          'Khởi hành 4h sáng đón bình minh và săn mây tại Trại Mát. Hướng dẫn viên bản địa dẫn qua những góc nhìn đẹp nhất, kèm bữa sáng nóng hổi.',
        category: ExperienceCategory.SIGHTSEEING,
        locationLabel: 'Đồi Trại Mát, Đà Lạt',
        latitudeOffset: -0.02,
        longitudeOffset: -0.01,
        image: 'https://images.unsplash.com/photo-1517423440428-a5a00ad493e8?auto=format&fit=crop&w=1200&q=80',
        images: [
          'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
        ],
        price: 480000,
        duration: '4 giờ',
        groupSize: 'Tối đa 10 người',
        minGuests: 2,
        maxGuests: 10,
        includedItems: ['Xe đưa đón nội thành', 'Hướng dẫn viên địa phương', 'Bữa sáng', 'Nước nóng'],
        notIncluded: ['Chi phí cá nhân', 'Ảnh chụp chuyên nghiệp (tuỳ chọn)'],
        requirements: ['Sức khỏe tốt', 'Khởi hành lúc 4h sáng'],
        languages: ['Tiếng Việt', 'English'],
        tags: ['Săn mây', 'Bình minh', 'Địa điểm bí mật'],
        featured: true,
        averageRating: 4.95,
        totalReviews: 112,
      },
      {
        title: 'Workshop rang xay cà phê Arabica Đà Lạt',
        description:
          'Trải nghiệm chọn hạt, rang thủ công và pha pour-over cùng chuyên gia cà phê tại nông trại Cầu Đất. Bạn mang về cà phê do chính tay mình rang.',
        category: ExperienceCategory.WORKSHOP,
        locationLabel: 'Nông trường Cầu Đất, Đà Lạt',
        latitudeOffset: 0.03,
        longitudeOffset: 0.028,
        image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=80',
        images: [
          'https://images.unsplash.com/photo-1422207258071-70754198c4a2?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1459257868276-5e65389e2722?auto=format&fit=crop&w=1200&q=80',
        ],
        price: 620000,
        duration: '3.5 giờ',
        groupSize: 'Tối đa 8 người',
        minGuests: 1,
        maxGuests: 8,
        includedItems: ['Nguyên liệu chọn lọc', 'Dụng cụ rang xay', 'Snack nhẹ', 'Chứng nhận tham gia'],
        notIncluded: ['Đưa đón từ khách sạn'],
        requirements: ['Không dành cho trẻ dưới 12 tuổi'],
        languages: ['Tiếng Việt', 'English'],
        tags: ['Cà phê đặc sản', 'Rang xay', 'Workshop'],
        averageRating: 4.87,
        totalReviews: 74,
        membersOnly: true,
      },
    ],
    services: [
      {
        name: 'Đà Lạt City Tour Private',
        description:
          'Tour riêng 1 ngày tham quan những điểm đẹp nhất Đà Lạt: Đồi Chè Cầu Đất, Hoa Sơn Điền Trang, Fresh Garden và thưởng thức bữa trưa đặc sản.',
        category: ServiceCategory.TOUR,
        address: '48 Bùi Thị Xuân, Phường 2, Đà Lạt',
        latitudeOffset: 0.006,
        longitudeOffset: 0.004,
        phone: '02636223388',
        openHours: '07:00 - 22:00',
        images: [
          'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80',
        ],
        basePrice: 950000,
        amenities: ['Xe du lịch đời mới', 'Nước uống', 'Bảo hiểm'],
        features: ['Hướng dẫn viên địa phương', 'Lịch trình cá nhân hóa', 'Check-in 8 điểm hot'],
        isBookable: true,
        requiresDeposit: true,
        depositAmount: 300000,
        averageRating: 4.9,
        totalReviews: 188,
      },
      {
        name: 'Le Petit Bistro Dalat',
        description:
          'Nhà hàng fusion kết hợp nông sản Đà Lạt và ẩm thực Pháp. Không gian ấm cúng với view vườn hoa, phù hợp bữa tối lãng mạn.',
        category: ServiceCategory.RESTAURANT,
        address: '21 Lê Đại Hành, Phường 1, Đà Lạt',
        latitudeOffset: 0.002,
        longitudeOffset: -0.003,
        phone: '02633997788',
        openHours: '11:00 - 22:30',
        images: [
          'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1559622214-5c94a68f0d8b?auto=format&fit=crop&w=1200&q=80',
        ],
        basePrice: 250000,
        amenities: ['Valet parking', 'Wine collection', 'Live music cuối tuần'],
        features: ['Thực đơn degustation', 'Nguyên liệu hữu cơ', 'Nhạc jazz tối thứ 6'],
        isBookable: true,
        requiresDeposit: false,
        averageRating: 4.82,
        totalReviews: 132,
      },
    ],
  },
  {
    key: 'phu-quoc',
    city: 'Phú Quốc',
    state: 'Kiên Giang',
    country: 'Vietnam',
    latitude: 10.2131,
    longitude: 103.967,
    host: {
      name: 'Ngô Đức Anh',
      email: 'host.phuquoc@luxestay.vn',
      phone: '0909123987',
      image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80',
      bio: 'Đức Anh lớn lên tại đảo Ngọc, vận hành chuỗi villa biển chuyên phục vụ gia đình và cặp đôi.',
      languages: ['Tiếng Việt', 'English', '中文'],
      isSuperHost: true,
    },
    listings: [
      {
        title: 'Azure Tide Beachfront Villa',
        description:
          'Biệt thự biển bãi Sao với hồ bơi vô cực nhìn thẳng ra biển. Thiết kế mở tràn ánh sáng, phòng ngủ master có bồn tắm hướng biển.',
        propertyType: PropertyType.VILLA,
        roomType: RoomType.ENTIRE_PLACE,
        maxGuests: 8,
        bedrooms: 4,
        beds: 5,
        bathrooms: 4,
        address: 'Bãi Sao, xã An Thới, Phú Quốc',
        neighborhood: 'Bãi Sao',
        basePrice: 5600000,
        cleaningFee: 400000,
        serviceFee: 200000,
        latitudeOffset: -0.015,
        longitudeOffset: 0.012,
        images: [
          'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80',
        ],
        amenityNames: [
          'High-speed Wifi',
          'Air Conditioning',
          'Outdoor Pool',
          'Full Kitchen',
          'Private Parking',
          'Smart Lock',
          'Smart TV',
        ],
        verifiedAmenities: ['View biển trực diện', 'Hồ bơi vô cực 40m2', 'Dịch vụ quản gia'],
        featured: true,
        instantBookable: false,
        allowPets: false,
        allowSmoking: false,
        allowEvents: true,
        allowChildren: true,
        weekendMultiplier: 1.3,
        weeklyDiscount: 0.07,
        monthlyDiscount: 0.18,
        averageRating: 4.97,
        totalReviews: 65,
        totalBookings: 128,
      },
      {
        title: 'Palm Breeze Ocean Loft',
        description:
          'Căn hộ loft cao cấp tại Sunset Town với ban công rộng nhìn hoàng hôn. Nội thất phong cách Địa Trung Hải và bếp đầy đủ.',
        propertyType: PropertyType.APARTMENT,
        roomType: RoomType.ENTIRE_PLACE,
        maxGuests: 4,
        bedrooms: 2,
        beds: 3,
        bathrooms: 2,
        address: 'Sunset Town, An Thới, Phú Quốc',
        neighborhood: 'Sunset Town',
        basePrice: 2900000,
        cleaningFee: 250000,
        serviceFee: 120000,
        latitudeOffset: -0.008,
        longitudeOffset: 0.02,
        images: [
          'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1599423300746-b62533397364?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1543486958-d783bfbf7d1a?auto=format&fit=crop&w=1200&q=80',
        ],
        amenityNames: [
          'High-speed Wifi',
          'Air Conditioning',
          'Full Kitchen',
          'Balcony View',
          'Smart TV',
          'Smart Lock',
        ],
        verifiedAmenities: ['Ban công 20m2', 'Check-in tự động'],
        instantBookable: true,
        allowPets: false,
        allowSmoking: false,
        allowChildren: true,
        weeklyDiscount: 0.05,
        averageRating: 4.85,
        totalReviews: 104,
        totalBookings: 174,
      },
      {
        title: 'Coral Garden Pool Villa',
        description:
          'Villa sân vườn nhiệt đới tại Cửa Lấp, hồ bơi riêng, khu BBQ và phòng karaoke gia đình. Dịch vụ nấu ăn tại chỗ theo yêu cầu.',
        propertyType: PropertyType.VILLA,
        roomType: RoomType.ENTIRE_PLACE,
        maxGuests: 12,
        bedrooms: 5,
        beds: 7,
        bathrooms: 5,
        address: 'Đường Trần Hưng Đạo, Cửa Lấp, Phú Quốc',
        neighborhood: 'Cửa Lấp',
        basePrice: 4800000,
        cleaningFee: 400000,
        serviceFee: 180000,
        latitudeOffset: 0.004,
        longitudeOffset: 0.006,
        images: [
          'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1616594039964-40b46d64af7f?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1600047509354-0aac99325614?auto=format&fit=crop&w=1200&q=80',
        ],
        amenityNames: [
          'High-speed Wifi',
          'Outdoor Pool',
          'Full Kitchen',
          'Outdoor BBQ',
          'Private Parking',
          'Baby Cot',
          'Smart TV',
        ],
        verifiedAmenities: ['Đầu bếp tại gia', 'Phòng karaoke cách âm'],
        instantBookable: false,
        allowPets: true,
        allowSmoking: false,
        allowEvents: true,
        allowChildren: true,
        weekendMultiplier: 1.2,
        weeklyDiscount: 0.06,
        monthlyDiscount: 0.16,
        averageRating: 4.92,
        totalReviews: 58,
        totalBookings: 121,
      },
      {
        title: 'Lagoon Breeze Beach Bungalow',
        description:
          'Bungalow sát biển Ông Lang với hiên gỗ và võng tre. Sáng nghe tiếng sóng, tối BBQ hải sản tại sân vườn chung.',
        propertyType: PropertyType.BUNGALOW,
        roomType: RoomType.ENTIRE_PLACE,
        maxGuests: 3,
        bedrooms: 1,
        beds: 2,
        bathrooms: 1,
        address: 'Bãi Ông Lang, Phú Quốc',
        neighborhood: 'Ông Lang',
        basePrice: 1800000,
        cleaningFee: 150000,
        serviceFee: 80000,
        latitudeOffset: 0.019,
        longitudeOffset: -0.01,
        images: [
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1505691723518-36a5ac3be353?auto=format&fit=crop&w=1200&q=80',
        ],
        amenityNames: [
          'High-speed Wifi',
          'Air Conditioning',
          'Balcony View',
          'Outdoor BBQ',
          'Smart Lock',
        ],
        verifiedAmenities: ['Bãi biển riêng 40m', 'Set BBQ hải sản tươi'],
        instantBookable: true,
        allowPets: true,
        allowSmoking: false,
        allowEvents: false,
        allowChildren: true,
        weeklyDiscount: 0.04,
        averageRating: 4.78,
        totalReviews: 119,
        totalBookings: 206,
      },
    ],
    experiences: [
      {
        title: 'Lặn ngắm san hô Hòn Móng Tay',
        description:
          'Trải nghiệm cano riêng đến Hòn Móng Tay, lặn ngắm san hô và check-in bãi cát trắng. Hướng dẫn viên PADI, thiết bị cao cấp.',
        category: ExperienceCategory.WATER_SPORTS,
        locationLabel: 'Hòn Móng Tay, Phú Quốc',
        latitudeOffset: -0.045,
        longitudeOffset: 0.06,
        image: 'https://images.unsplash.com/photo-1493556573286-1b2a89119614?auto=format&fit=crop&w=1200&q=80',
        images: [
          'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=1200&q=80',
        ],
        price: 950000,
        duration: '5 giờ',
        groupSize: 'Tối đa 6 người',
        minGuests: 2,
        maxGuests: 6,
        includedItems: ['Cano riêng', 'Thiết bị lặn cao cấp', 'Hướng dẫn viên PADI', 'Nước và trái cây'],
        notIncluded: ['Ảnh dưới nước (tuỳ chọn)', 'Đưa đón ngoài Dương Đông'],
        requirements: ['Biết bơi cơ bản', 'Từ 12 tuổi trở lên'],
        languages: ['Tiếng Việt', 'English'],
        tags: ['Biển đảo', 'Snorkeling', 'Private tour'],
        featured: true,
        averageRating: 4.93,
        totalReviews: 143,
      },
      {
        title: 'Du thuyền hoàng hôn Sunset Cruise',
        description:
          'Thư giãn trên du thuyền sang trọng ngắm hoàng hôn, thưởng thức tapas và cocktail. Có nhạc live acoustic và câu cá đêm.',
        category: ExperienceCategory.ENTERTAINMENT,
        locationLabel: 'Sunset Town Marina, Phú Quốc',
        latitudeOffset: -0.01,
        longitudeOffset: 0.018,
        image: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80',
        images: [
          'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1521038199265-bc482db0f7d1?auto=format&fit=crop&w=1200&q=80',
        ],
        price: 1250000,
        duration: '3 giờ',
        groupSize: 'Tối đa 20 người',
        minGuests: 1,
        maxGuests: 20,
        includedItems: ['Đồ uống chào mừng', 'Tapas cao cấp', 'Âm nhạc live', 'Bảo hiểm du lịch'],
        notIncluded: ['Đưa đón khách sạn (tuỳ chọn)', 'Đồ uống thêm'],
        requirements: ['Trang phục smart casual'],
        languages: ['Tiếng Việt', 'English'],
        tags: ['Hoàng hôn', 'Du thuyền', 'Âm nhạc sống'],
        averageRating: 4.88,
        totalReviews: 89,
      },
      {
        title: 'Private Chef Sunset Dining tại villa',
        description:
          'Private chef chế biến thực đơn 6 món tại villa của bạn cùng sommelier pairing rượu vang. Bao gồm set up bàn ngoài trời và nhân viên phục vụ.',
        category: ExperienceCategory.FOOD_DRINK,
        locationLabel: 'Azure Tide Beachfront Villa, Phú Quốc',
        latitudeOffset: -0.012,
        longitudeOffset: 0.009,
        image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
        images: [
          'https://images.unsplash.com/photo-1504753793650-d4a2b783c15e?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=1200&q=80',
        ],
        price: 4200000,
        duration: '3 giờ',
        groupSize: 'Tối đa 6 người',
        minGuests: 2,
        maxGuests: 6,
        includedItems: ['Private chef & sous chef', 'Thực đơn 6 món', 'Rượu vang pairing', 'Trang trí nến và hoa'],
        notIncluded: ['Phụ thu nguyên liệu đặc biệt', 'Corkage fee nếu mang rượu riêng'],
        requirements: ['Đặt trước tối thiểu 48 giờ', 'Thông báo dị ứng thực phẩm'],
        languages: ['Tiếng Việt', 'English'],
        tags: ['Private chef', 'Fine dining', 'Member-only'],
        featured: true,
        averageRating: 4.97,
        totalReviews: 36,
        membersOnly: true,
      },
      {
        title: 'Airport transfer 2 chiều với concierge riêng',
        description:
          'Xe SUV hạng sang với concierge cá nhân đón và tiễn sân bay Phú Quốc, hỗ trợ check-in nhanh, minibar trên xe và chăm sóc hành lý.',
        category: ExperienceCategory.SIGHTSEEING,
        locationLabel: 'Sân bay quốc tế Phú Quốc',
        latitudeOffset: -0.028,
        longitudeOffset: 0.034,
        image: 'https://images.unsplash.com/photo-1529078155058-5d716f45d604?auto=format&fit=crop&w=1200&q=80',
        images: [
          'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1529429617124-aee0a93d42f3?auto=format&fit=crop&w=1200&q=80',
        ],
        price: 2800000,
        duration: '2.5 giờ',
        groupSize: 'Tối đa 4 người',
        minGuests: 1,
        maxGuests: 4,
        includedItems: ['SUV hạng sang 2 chiều', 'Concierge song ngữ', 'Minibar và khăn lạnh', 'Hỗ trợ check-in nhanh'],
        notIncluded: ['Phí chờ quá giờ', 'Tip cho tài xế hoặc concierge'],
        requirements: ['Cung cấp thông tin chuyến bay trước 24 giờ'],
        languages: ['Tiếng Việt', 'English'],
        tags: ['Concierge', 'Airport transfer', 'Premium service'],
        averageRating: 4.95,
        totalReviews: 41,
        membersOnly: true,
      },
    ],
    services: [
      {
        name: 'Food Tour Chợ Đêm Phú Quốc',
        description:
          'Hướng dẫn viên dẫn bạn khám phá 8 món đặc sản: bún quậy, còi biên mai, kem cuộn, nước mắm trăm năm... bao gồm đồ uống và câu chuyện địa phương.',
        category: ServiceCategory.TOUR,
        address: 'Chợ Đêm Phú Quốc, Đường Nguyễn Trãi, Dương Đông',
        latitudeOffset: 0.011,
        longitudeOffset: -0.014,
        phone: '02973999888',
        openHours: '17:00 - 23:30',
        images: [
          'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1473093226795-af9932fe5856?auto=format&fit=crop&w=1200&q=80',
        ],
        basePrice: 690000,
        amenities: ['Voucher ăn vặt', 'Nước suối', 'Ảnh kỷ niệm'],
        features: ['8 món đặc sản', 'Nhóm nhỏ 8 khách', 'Hướng dẫn viên bản địa'],
        isBookable: true,
        requiresDeposit: true,
        depositAmount: 200000,
        averageRating: 4.91,
        totalReviews: 156,
      },
      {
        name: 'Sailing Club Beach Lounge',
        description:
          'Beach club cao cấp với giường nằm hướng biển, hồ bơi nước mặn và DJ quốc tế mỗi cuối tuần. Bao gồm welcome drink và khăn tắm.',
        category: ServiceCategory.ENTERTAINMENT,
        address: 'Bãi Trường, Dương Tơ, Phú Quốc',
        latitudeOffset: -0.006,
        longitudeOffset: -0.002,
        phone: '02973777788',
        openHours: '10:00 - 01:00',
        images: [
          'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
        ],
        basePrice: 450000,
        amenities: ['Cabana riêng', 'Khăn tắm', 'Shower nước ngọt'],
        features: ['DJ quốc tế cuối tuần', 'Menu cocktail signature', 'Hồ bơi nước mặn'],
        isBookable: true,
        requiresDeposit: true,
        depositAmount: 150000,
        averageRating: 4.76,
        totalReviews: 98,
      },
    ],
  },
  {
    key: 'vung-tau',
    city: 'Vũng Tàu',
    state: 'Bà Rịa - Vũng Tàu',
    country: 'Vietnam',
    latitude: 10.346,
    longitude: 107.0843,
    host: {
      name: 'Nguyễn Đức Lộc',
      email: 'host.vungtau@luxestay.vn',
      phone: '0903456781',
      image: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=600&q=80',
      bio: 'Lộc điều hành nhiều căn ven biển Vũng Tàu, chú trọng trải nghiệm sang trọng nhưng gần gũi bản địa.',
      languages: ['Tiếng Việt', 'English'],
      isSuperHost: true,
    },
    listings: [
      {
        title: 'Marina Bay Luxury Villa',
        description:
          'Biệt thự biển Marina Bay với hồ bơi nước mặn, phòng chiếu phim gia đình và phòng ngủ master nhìn thẳng biển.',
        propertyType: PropertyType.VILLA,
        roomType: RoomType.ENTIRE_PLACE,
        maxGuests: 10,
        bedrooms: 4,
        beds: 5,
        bathrooms: 4,
        address: '12 Trần Phú, Phường 1, Vũng Tàu',
        neighborhood: 'Bãi Trước',
        basePrice: 4200000,
        cleaningFee: 300000,
        serviceFee: 150000,
        latitudeOffset: 0.012,
        longitudeOffset: 0.015,
        images: [
          'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1600047509354-0aac99325614?auto=format&fit=crop&w=1200&q=80',
        ],
        amenityNames: [
          'High-speed Wifi',
          'Air Conditioning',
          'Outdoor Pool',
          'Private Parking',
          'Outdoor BBQ',
          'Smart Lock',
          'Smart TV',
        ],
        verifiedAmenities: ['Hồ bơi nước mặn', 'Quản gia 24/7'],
        featured: true,
        instantBookable: false,
        allowPets: false,
        allowSmoking: false,
        allowEvents: true,
        allowChildren: true,
        weekendMultiplier: 1.25,
        weeklyDiscount: 0.05,
        monthlyDiscount: 0.12,
        averageRating: 4.9,
        totalReviews: 102,
        totalBookings: 185,
      },
      {
        title: 'Sky Terrace Duplex Vũng Tàu',
        description:
          'Căn hộ duplex cao tầng với ban công rộng, bàn ăn ngoài trời và view toàn bộ bãi Sau. Nội thất sang trọng, thích hợp gia đình.',
        propertyType: PropertyType.APARTMENT,
        roomType: RoomType.ENTIRE_PLACE,
        maxGuests: 6,
        bedrooms: 3,
        beds: 4,
        bathrooms: 2,
        address: 'Sea Breeze Tower, 28 Thi Sách, Thắng Tam, Vũng Tàu',
        neighborhood: 'Bãi Sau',
        basePrice: 2500000,
        cleaningFee: 200000,
        serviceFee: 100000,
        latitudeOffset: -0.008,
        longitudeOffset: 0.02,
        images: [
          'https://images.unsplash.com/photo-1574643156929-51fa098b0394?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1598928636135-d146006ff4be?auto=format&fit=crop&w=1200&q=80',
        ],
        amenityNames: [
          'High-speed Wifi',
          'Air Conditioning',
          'Full Kitchen',
          'Balcony View',
          'Smart Lock',
          'Smart TV',
          'Workspace Desk',
        ],
        verifiedAmenities: ['View 270° ra biển', 'Check-in 24/7'],
        instantBookable: true,
        allowPets: false,
        allowSmoking: false,
        allowChildren: true,
        weeklyDiscount: 0.04,
        averageRating: 4.84,
        totalReviews: 134,
        totalBookings: 210,
      },
      {
        title: 'Lan Rừng Beach House',
        description:
          'Nhà biển phong cách Indochine, sân hiên rợp cây xanh và đường xuống biển riêng. Phù hợp nhóm bạn thân và gia đình đa thế hệ.',
        propertyType: PropertyType.HOUSE,
        roomType: RoomType.ENTIRE_PLACE,
        maxGuests: 8,
        bedrooms: 3,
        beds: 5,
        bathrooms: 3,
        address: '36 Hạ Long, Phường 2, Vũng Tàu',
        neighborhood: 'Bãi Dứa',
        basePrice: 3100000,
        cleaningFee: 250000,
        serviceFee: 120000,
        latitudeOffset: 0.005,
        longitudeOffset: -0.006,
        images: [
          'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80',
        ],
        amenityNames: [
          'High-speed Wifi',
          'Outdoor BBQ',
          'Full Kitchen',
          'Private Parking',
          'Washer & Dryer',
          'Balcony View',
        ],
        verifiedAmenities: ['Bếp hải sản ngoài trời', 'Đường xuống biển riêng'],
        instantBookable: false,
        allowPets: true,
        allowSmoking: false,
        allowEvents: true,
        allowChildren: true,
        weeklyDiscount: 0.05,
        monthlyDiscount: 0.1,
        averageRating: 4.86,
        totalReviews: 78,
        totalBookings: 150,
      },
      {
        title: 'The Lighthouse Studio',
        description:
          'Studio cao cấp trang trí tông trắng - xanh, nhìn thẳng tượng Chúa Kitô và biển. Có góc làm việc, thích hợp cặp đôi hoặc digital nomad.',
        propertyType: PropertyType.APARTMENT,
        roomType: RoomType.ENTIRE_PLACE,
        maxGuests: 2,
        bedrooms: 1,
        beds: 1,
        bathrooms: 1,
        address: '8 Lê Hồng Phong, Thắng Tam, Vũng Tàu',
        neighborhood: 'Thắng Tam',
        basePrice: 1500000,
        cleaningFee: 120000,
        serviceFee: 70000,
        latitudeOffset: -0.002,
        longitudeOffset: 0.005,
        images: [
          'https://images.unsplash.com/photo-1616594039964-40b46d64af7f?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=1200&q=80',
        ],
        amenityNames: [
          'High-speed Wifi',
          'Air Conditioning',
          'Smart TV',
          'Smart Lock',
          'Workspace Desk',
        ],
        verifiedAmenities: ['Góc làm việc chuẩn ergonomic', 'Check-in tự động'],
        instantBookable: true,
        allowPets: false,
        allowSmoking: false,
        allowEvents: false,
        allowChildren: true,
        weeklyDiscount: 0.05,
        averageRating: 4.8,
        totalReviews: 90,
        totalBookings: 190,
      },
    ],
    experiences: [
      {
        title: 'Chèo SUP bình minh Bãi Sau',
        description:
          'Dậy sớm chèo SUP đón bình minh tại Bãi Sau, học kỹ thuật cơ bản và check-in ảnh flycam tuyệt đẹp.',
        category: ExperienceCategory.WATER_SPORTS,
        locationLabel: 'Bãi Sau, Vũng Tàu',
        latitudeOffset: -0.01,
        longitudeOffset: 0.02,
        image: 'https://images.unsplash.com/photo-1617854818583-09e7f077a156?auto=format&fit=crop&w=1200&q=80',
        images: [
          'https://images.unsplash.com/photo-1523978591478-c753949ff840?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80',
        ],
        price: 550000,
        duration: '2.5 giờ',
        groupSize: 'Tối đa 8 người',
        minGuests: 2,
        maxGuests: 8,
        includedItems: ['Ván SUP', 'Áo phao', 'Hướng dẫn viên', 'Ảnh flycam', 'Nước suối'],
        notIncluded: ['Đưa đón khách sạn'],
        requirements: ['Biết bơi cơ bản', 'Khởi hành 5h sáng'],
        languages: ['Tiếng Việt', 'English'],
        tags: ['Bình minh', 'SUP', 'Thể thao biển'],
        featured: true,
        averageRating: 4.92,
        totalReviews: 76,
      },
      {
        title: 'Trekking Hải Đăng & Picnic hoàng hôn',
        description:
          'Leo bộ lên ngọn hải đăng Vũng Tàu, khám phá rừng nhỏ và picnic hoàng hôn với các món địa phương.',
        category: ExperienceCategory.ADVENTURE,
        locationLabel: 'Ngọn Hải Đăng, Phường 2, Vũng Tàu',
        latitudeOffset: 0.01,
        longitudeOffset: 0.008,
        image: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1200&q=80',
        images: [
          'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1200&q=80',
        ],
        price: 420000,
        duration: '3 giờ',
        groupSize: 'Tối đa 12 người',
        minGuests: 2,
        maxGuests: 12,
        includedItems: ['Hướng dẫn viên', 'Picnic snack', 'Nước suối', 'Bảo hiểm'],
        notIncluded: ['Vé tham quan hải đăng (30.000đ)'],
        requirements: ['Sức khỏe tốt', 'Giày thể thao'],
        languages: ['Tiếng Việt', 'English'],
        tags: ['Trekking nhẹ', 'Hoàng hôn', 'Check-in'],
        averageRating: 4.85,
        totalReviews: 61,
      },
    ],
    services: [
      {
        name: 'Trải nghiệm hải sản chợ Xóm Lưới',
        description:
          'Đầu bếp địa phương dẫn bạn chọn hải sản tươi, chế biến tại chỗ với 5 món đặc sản cùng nước chấm gia truyền.',
        category: ServiceCategory.TOUR,
        address: 'Chợ Xóm Lưới, Nguyễn Công Trứ, Vũng Tàu',
        latitudeOffset: 0.003,
        longitudeOffset: -0.004,
        phone: '02543567888',
        openHours: '07:00 - 20:00',
        images: [
          'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=1200&q=80',
        ],
        basePrice: 850000,
        amenities: ['Hải sản tươi', 'Nước uống', 'Gia vị chuẩn Vũng Tàu'],
        features: ['Chef hướng dẫn', '5 món đặc sản', 'Nhóm riêng tối đa 8 khách'],
        isBookable: true,
        requiresDeposit: true,
        depositAmount: 250000,
        averageRating: 4.88,
        totalReviews: 143,
      },
      {
        name: 'Skyline Rooftop Bar Vũng Tàu',
        description:
          'Bar tầng thượng nhìn toàn cảnh thành phố, nhạc DJ mỗi tối thứ 6-7, cocktail signature lấy cảm hứng từ biển.',
        category: ServiceCategory.ENTERTAINMENT,
        address: 'Tầng 25, khách sạn Horizon, 98 Võ Thị Sáu, Vũng Tàu',
        latitudeOffset: -0.004,
        longitudeOffset: 0.009,
        phone: '02543888999',
        openHours: '17:00 - 01:30',
        images: [
          'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
        ],
        basePrice: 320000,
        amenities: ['Sky deck', 'DJ quốc tế', 'Seats VIP'],
        features: ['Cocktail signature', 'Happy hour 17:00-19:00', 'Nhạc house & tropical'],
        isBookable: true,
        requiresDeposit: false,
        averageRating: 4.7,
        totalReviews: 82,
      },
    ],
  },
  {
    key: 'ha-noi',
    city: 'Hà Nội',
    state: 'Hà Nội',
    country: 'Vietnam',
    latitude: 21.0285,
    longitude: 105.8542,
    host: {
      name: 'Phạm Mai Linh',
      email: 'host.hanoi@luxestay.vn',
      phone: '0988123123',
      image: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=600&q=80',
      bio: 'Mai Linh là kiến trúc sư bảo tồn, sở hữu các căn nhà phố cổ cải tạo dành cho du khách cao cấp.',
      languages: ['Tiếng Việt', 'English', 'Français'],
      isSuperHost: true,
    },
    listings: [
      {
        title: 'Old Quarter Boutique Loft',
        description:
          'Căn loft hai tầng nằm trong ngõ nhỏ phố cổ, giữ nguyên tường gạch cổ và điểm xuyết nội thất hiện đại, cách hồ Hoàn Kiếm 3 phút đi bộ.',
        propertyType: PropertyType.APARTMENT,
        roomType: RoomType.ENTIRE_PLACE,
        maxGuests: 4,
        bedrooms: 2,
        beds: 3,
        bathrooms: 2,
        address: '12 Hàng Bạc, Hoàn Kiếm, Hà Nội',
        neighborhood: 'Phố Cổ',
        basePrice: 2400000,
        cleaningFee: 180000,
        serviceFee: 90000,
        latitudeOffset: 0.002,
        longitudeOffset: 0.003,
        images: [
          'https://images.unsplash.com/photo-1599423300746-b62533397364?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
        ],
        amenityNames: [
          'High-speed Wifi',
          'Air Conditioning',
          'Full Kitchen',
          'Smart Lock',
          'Washer & Dryer',
          'Smart TV',
        ],
        verifiedAmenities: ['Check-in 24/7', 'Hướng dẫn phố cổ bản địa'],
        instantBookable: true,
        allowPets: false,
        allowSmoking: false,
        allowChildren: true,
        weeklyDiscount: 0.06,
        averageRating: 4.9,
        totalReviews: 156,
        totalBookings: 268,
      },
      {
        title: 'Tây Hồ Lakeside Retreat',
        description:
          'Biệt thự mini ven hồ Tây với sân vườn xanh, phòng trà và bể sục ngoài trời. Phù hợp gia đình muốn nghỉ dưỡng ngay giữa lòng Hà Nội.',
        propertyType: PropertyType.HOUSE,
        roomType: RoomType.ENTIRE_PLACE,
        maxGuests: 7,
        bedrooms: 3,
        beds: 4,
        bathrooms: 3,
        address: '68 Quảng An, Tây Hồ, Hà Nội',
        neighborhood: 'Quảng An',
        basePrice: 3600000,
        cleaningFee: 250000,
        serviceFee: 150000,
        latitudeOffset: 0.015,
        longitudeOffset: -0.012,
        images: [
          'https://images.unsplash.com/photo-1600047509354-0aac99325614?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1616594039964-40b46d64af7f?auto=format&fit=crop&w=1200&q=80',
        ],
        amenityNames: [
          'High-speed Wifi',
          'Outdoor Pool',
          'Private Parking',
          'Smart Lock',
          'Full Kitchen',
          'Balcony View',
        ],
        verifiedAmenities: ['Phòng trà riêng', 'Bể sục ngoài trời'],
        instantBookable: false,
        allowPets: true,
        allowSmoking: false,
        allowEvents: true,
        allowChildren: true,
        weekendMultiplier: 1.2,
        weeklyDiscount: 0.05,
        monthlyDiscount: 0.14,
        averageRating: 4.88,
        totalReviews: 92,
        totalBookings: 140,
      },
      {
        title: 'French Quarter Heritage Home',
        description:
          'Nhà phố Pháp cổ rộng 180m², trần cao 4m, ban công nhìn Nhà hát Lớn. Nội thất kết hợp cổ điển và hiện đại, có phòng đọc sách riêng.',
        propertyType: PropertyType.TOWNHOUSE,
        roomType: RoomType.ENTIRE_PLACE,
        maxGuests: 6,
        bedrooms: 3,
        beds: 4,
        bathrooms: 2.5,
        address: '15 Lý Thái Tổ, Hoàn Kiếm, Hà Nội',
        neighborhood: 'Khu Pháp Cổ',
        basePrice: 3300000,
        cleaningFee: 240000,
        serviceFee: 140000,
        latitudeOffset: -0.001,
        longitudeOffset: 0.0025,
        images: [
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1616594039964-40b46d64af7f?auto=format&fit=crop&w=1200&q=80',
        ],
        amenityNames: [
          'High-speed Wifi',
          'Air Conditioning',
          'Smart TV',
          'Smart Lock',
          'Workspace Desk',
          'Washer & Dryer',
        ],
        verifiedAmenities: ['Hồ sơ du lịch tự lên kế hoạch', 'Xe đón sân bay trả phí nhẹ'],
        instantBookable: false,
        allowPets: false,
        allowSmoking: false,
        allowEvents: true,
        allowChildren: true,
        averageRating: 4.83,
        totalReviews: 88,
        totalBookings: 137,
      },
      {
        title: 'Modern Skyline Penthouse',
        description:
          'Penthouse tầng 28 tại Vinhomes Metropolis, view toàn cảnh trung tâm Hà Nội, có hồ bơi vô cực và phòng gym tòa nhà.',
        propertyType: PropertyType.CONDO,
        roomType: RoomType.ENTIRE_PLACE,
        maxGuests: 5,
        bedrooms: 2,
        beds: 3,
        bathrooms: 2,
        address: '29 Liễu Giai, Ba Đình, Hà Nội',
        neighborhood: 'Ba Đình',
        basePrice: 2800000,
        cleaningFee: 200000,
        serviceFee: 110000,
        latitudeOffset: -0.008,
        longitudeOffset: 0.01,
        images: [
          'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1521783988139-893354fcd0d5?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1616594039964-40b46d64af7f?auto=format&fit=crop&w=1200&q=80',
        ],
        amenityNames: [
          'High-speed Wifi',
          'Air Conditioning',
          'Smart TV',
          'Smart Lock',
          'Workspace Desk',
          'Private Parking',
        ],
        verifiedAmenities: ['Hồ bơi vô cực tầng 7', 'Phòng gym miễn phí'],
        instantBookable: true,
        allowPets: false,
        allowSmoking: false,
        allowEvents: false,
        allowChildren: true,
        weeklyDiscount: 0.05,
        averageRating: 4.9,
        totalReviews: 121,
        totalBookings: 220,
      },
    ],
    experiences: [
      {
        title: 'Tour ẩm thực phố cổ bằng xe điện',
        description:
          'Khám phá 10 món ăn huyền thoại Hà Nội cùng food blogger bản địa, di chuyển bằng xe điện riêng và ghé những ngõ nhỏ ít khách du lịch.',
        category: ExperienceCategory.FOOD_DRINK,
        locationLabel: 'Phố cổ Hoàn Kiếm, Hà Nội',
        latitudeOffset: 0.0015,
        longitudeOffset: 0.001,
        image: 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=1200&q=80',
        images: [
          'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1481833761820-0509d3217039?auto=format&fit=crop&w=1200&q=80',
        ],
        price: 790000,
        duration: '3.5 giờ',
        groupSize: 'Tối đa 8 người',
        minGuests: 2,
        maxGuests: 8,
        includedItems: ['Xe điện riêng', '10 món ăn & đồ uống', 'Hướng dẫn viên foodie', 'Ảnh chụp tại mỗi điểm'],
        notIncluded: ['Chi phí cá nhân ngoài chương trình'],
        requirements: ['Không dị ứng gluten nghiêm trọng'],
        languages: ['Tiếng Việt', 'English', 'Français'],
        tags: ['Food tour', 'Phố cổ', 'Local only'],
        featured: true,
        averageRating: 4.97,
        totalReviews: 203,
        membersOnly: true,
      },
      {
        title: 'Đêm chèo & nhạc sống Hồ Gươm',
        description:
          'Xem biểu diễn chèo truyền thống tại nhà hát mini, sau đó dạo Hồ Gươm bằng xích lô và thưởng thức cocktail rooftop.',
        category: ExperienceCategory.CULTURE,
        locationLabel: 'Nhà hát Chèo Hà Nội',
        latitudeOffset: -0.002,
        longitudeOffset: 0.002,
        image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80',
        images: [
          'https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1469594292607-7bd90f8d3ba4?auto=format&fit=crop&w=1200&q=80',
        ],
        price: 980000,
        duration: '4 giờ',
        groupSize: 'Tối đa 12 người',
        minGuests: 2,
        maxGuests: 12,
        includedItems: ['Vé xem chèo', 'Xích lô vòng Hồ Gươm', 'Cocktail rooftop', 'Hướng dẫn viên văn hóa'],
        notIncluded: ['Đưa đón khách sạn'],
        requirements: ['Trang phục lịch sự'],
        languages: ['Tiếng Việt', 'English'],
        tags: ['Văn hóa', 'Nightlife sang trọng'],
        averageRating: 4.9,
        totalReviews: 84,
      },
    ],
    services: [
      {
        name: 'Giảng Cafe Express Workshop',
        description:
          'Barista nhà Giảng hướng dẫn pha cà phê trứng công thức nguyên bản, kể câu chuyện gia đình và cho bạn tự tay tạo nên ly cafe signature.',
        category: ServiceCategory.CAFE,
        address: '39 Nguyễn Hữu Huân, Hoàn Kiếm, Hà Nội',
        latitudeOffset: 0.001,
        longitudeOffset: 0.0015,
        phone: '02438250909',
        openHours: '08:00 - 22:00',
        images: [
          'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80',
        ],
        basePrice: 320000,
        amenities: ['Nguyên liệu nguyên bản', 'Chứng nhận nhỏ', 'Ảnh kỷ niệm'],
        features: ['Barista gia truyền', 'Nhóm tối đa 6 khách', 'Tự pha và thưởng thức'],
        isBookable: true,
        requiresDeposit: false,
        averageRating: 4.94,
        totalReviews: 170,
      },
      {
        name: 'Sen Heritage Spa Tây Hồ',
        description:
          'Liệu trình spa 90 phút kết hợp thảo mộc Bắc Bộ, sauna đá muối Himalaya và trà sen Tây Hồ.',
        category: ServiceCategory.OTHER,
        address: '151 Trích Sài, Tây Hồ, Hà Nội',
        latitudeOffset: 0.012,
        longitudeOffset: -0.01,
        phone: '02436288888',
        openHours: '09:00 - 23:00',
        images: [
          'https://images.unsplash.com/photo-1582719478191-2cf4e7c0b13c?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=1200&q=80',
        ],
        basePrice: 980000,
        amenities: ['Phòng riêng', 'Sauna đá muối', 'Trà sen'],
        features: ['Thảo dược Bắc Bộ', 'Kỹ thuật viên 8 năm kinh nghiệm', 'Có phòng couple'],
        isBookable: true,
        requiresDeposit: true,
        depositAmount: 300000,
        averageRating: 4.87,
        totalReviews: 132,
      },
    ],
  },  {
    key: 'hoi-an',
    city: 'Hội An',
    state: 'Quảng Nam',
    country: 'Vietnam',
    latitude: 15.8801,
    longitude: 108.338,
    host: {
      name: 'Trần Hoài Nam',
      email: 'host.hoian@luxestay.vn',
      phone: '0902789001',
      image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80',
      bio: 'Nam là hướng dẫn viên ẩm thực bản địa, vận hành những căn nhà di sản giữa lòng Hội An cổ kính.',
      languages: ['Tiếng Việt', 'English', '日本語'],
      isSuperHost: true,
    },
    listings: [
      {
        title: 'Ancient Lantern Riverside Villa',
        description:
          'Biệt thự bên sông Hoài, sân vườn phủ đèn lồng và hồ bơi gạch men xanh. Không gian giữ nguyên kiến trúc gỗ chạm khắc.',
        propertyType: PropertyType.VILLA,
        roomType: RoomType.ENTIRE_PLACE,
        maxGuests: 8,
        bedrooms: 4,
        beds: 5,
        bathrooms: 4,
        address: '35 Nguyễn Phúc Chu, Phường Minh An, Hội An',
        neighborhood: 'Phố cổ',
        basePrice: 4200000,
        cleaningFee: 250000,
        serviceFee: 150000,
        latitudeOffset: 0.003,
        longitudeOffset: 0.004,
        images: [
          'https://images.unsplash.com/photo-1528909514045-2fa4ac7a08ba?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
        ],
        amenityNames: [
          'High-speed Wifi',
          'Air Conditioning',
          'Outdoor Pool',
          'Full Kitchen',
          'Outdoor BBQ',
          'Smart Lock',
          'Smart TV',
        ],
        verifiedAmenities: ['Thắp đèn lồng mỗi tối', 'Thuyền gỗ riêng đưa đón'],
        instantBookable: true,
        allowPets: false,
        allowSmoking: false,
        allowEvents: true,
        allowChildren: true,
        weekendMultiplier: 1.18,
        weeklyDiscount: 0.06,
        monthlyDiscount: 0.14,
        averageRating: 4.92,
        totalReviews: 132,
        totalBookings: 210,
      },
      {
        title: 'Old Town Heritage Loft',
        description:
          'Nhà cổ 120 năm cải tạo thành loft nghệ thuật. Ban công nhìn chùa Cầu, nội thất gỗ lim và gốm Thanh Hà.',
        propertyType: PropertyType.TOWNHOUSE,
        roomType: RoomType.ENTIRE_PLACE,
        maxGuests: 5,
        bedrooms: 2,
        beds: 3,
        bathrooms: 2,
        address: '118 Trần Phú, Hội An',
        neighborhood: 'Trung tâm phố cổ',
        basePrice: 2600000,
        cleaningFee: 180000,
        serviceFee: 110000,
        latitudeOffset: -0.002,
        longitudeOffset: 0.001,
        images: [
          'https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1599423300746-b62533397364?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1522614288668-a697127e9b54?auto=format&fit=crop&w=1200&q=80',
        ],
        amenityNames: [
          'High-speed Wifi',
          'Air Conditioning',
          'Full Kitchen',
          'Workspace Desk',
          'Smart TV',
          'Smart Lock',
        ],
        verifiedAmenities: ['Hướng dẫn check-in ngõ nhỏ riêng', 'Set trà thảo mộc Hội An'],
        instantBookable: true,
        allowPets: false,
        allowSmoking: false,
        allowChildren: true,
        weeklyDiscount: 0.05,
        averageRating: 4.88,
        totalReviews: 154,
        totalBookings: 260,
      },
      {
        title: 'An Bàng Coastal Retreat',
        description:
          'Villa bãi biển An Bàng cách biển 50m, hồ plunge pool, phòng ngủ kính trượt nhìn thẳng dừa biển.',
        propertyType: PropertyType.VILLA,
        roomType: RoomType.ENTIRE_PLACE,
        maxGuests: 7,
        bedrooms: 3,
        beds: 4,
        bathrooms: 3,
        address: 'Làng An Bàng, Cẩm An, Hội An',
        neighborhood: 'An Bàng',
        basePrice: 3900000,
        cleaningFee: 220000,
        serviceFee: 160000,
        latitudeOffset: 0.012,
        longitudeOffset: 0.018,
        images: [
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80',
        ],
        amenityNames: [
          'High-speed Wifi',
          'Outdoor Pool',
          'Air Conditioning',
          'Outdoor BBQ',
          'Private Parking',
          'Smart TV',
        ],
        verifiedAmenities: ['Chef địa phương nấu ăn', 'Xe đạp miễn phí'],
        instantBookable: false,
        allowPets: false,
        allowSmoking: false,
        allowEvents: true,
        allowChildren: true,
        weekendMultiplier: 1.22,
        weeklyDiscount: 0.07,
        monthlyDiscount: 0.16,
        averageRating: 4.9,
        totalReviews: 121,
        totalBookings: 198,
      },
      {
        title: 'Coco Riverside Bungalow',
        description:
          'Bungalow gỗ giữa rừng dừa Cẩm Thanh, hiên tre nhìn sông, bồn tắm gỗ và võng chòi lưới.',
        propertyType: PropertyType.BUNGALOW,
        roomType: RoomType.ENTIRE_PLACE,
        maxGuests: 3,
        bedrooms: 1,
        beds: 2,
        bathrooms: 1,
        address: 'Thôn 2, Cẩm Thanh, Hội An',
        neighborhood: 'Rừng dừa Bảy Mẫu',
        basePrice: 1500000,
        cleaningFee: 100000,
        serviceFee: 70000,
        latitudeOffset: -0.01,
        longitudeOffset: 0.015,
        images: [
          'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1523419409543-0c1df022bdd1?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80',
        ],
        amenityNames: [
          'High-speed Wifi',
          'Balcony View',
          'Outdoor BBQ',
          'Smart Lock',
          'Smart TV',
        ],
        verifiedAmenities: ['Tour thúng chai riêng', 'Bữa sáng Hội An'],
        instantBookable: true,
        allowPets: true,
        allowSmoking: false,
        allowChildren: true,
        weeklyDiscount: 0.04,
        averageRating: 4.84,
        totalReviews: 110,
        totalBookings: 205,
      },
    ],
    experiences: [
      {
        title: 'Workshop làm đèn lồng Hội An',
        description:
          'Tự tay làm đèn lồng cùng nghệ nhân, tìm hiểu lịch sử và ăn chè bắp cuối buổi.',
        category: ExperienceCategory.WORKSHOP,
        locationLabel: 'Nhà cổ Tấn Ký, Hội An',
        latitudeOffset: -0.003,
        longitudeOffset: 0.002,
        image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
        images: [
          'https://images.unsplash.com/photo-1531188561947-43c5f83d1e33?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80',
        ],
        price: 450000,
        duration: '2 giờ',
        groupSize: 'Tối đa 10 người',
        minGuests: 1,
        maxGuests: 10,
        includedItems: ['Nguyên liệu làm đèn', 'Trà thảo mộc', 'Hướng dẫn viên'],
        notIncluded: ['Vận chuyển'],
        requirements: ['Trẻ em đi kèm người lớn'],
        languages: ['Tiếng Việt', 'English', '日本語'],
        tags: ['Craft', 'Culture', 'Hội An'],
        featured: true,
        averageRating: 4.95,
        totalReviews: 98,
      },
      {
        title: 'Chèo thúng dừa & Cooking class',
        description:
          'Chèo thúng dừa Bảy Mẫu, bắt ghẹ và học nấu cao lầu cùng gia đình bản địa.',
        category: ExperienceCategory.FOOD_DRINK,
        locationLabel: 'Rừng dừa Cẩm Thanh, Hội An',
        latitudeOffset: -0.015,
        longitudeOffset: 0.01,
        image: 'https://images.unsplash.com/photo-1454982523318-4b6396f39d3a?auto=format&fit=crop&w=1200&q=80',
        images: [
          'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80',
        ],
        price: 850000,
        duration: '4 giờ',
        groupSize: 'Tối đa 12 người',
        minGuests: 2,
        maxGuests: 12,
        includedItems: ['Thuyền thúng', 'Chef hướng dẫn', 'Nguyên liệu tươi', 'Bữa ăn trọn gói'],
        notIncluded: ['Đưa đón khách sạn'],
        requirements: ['Trang phục thoải mái', 'Không say sóng'],
        languages: ['Tiếng Việt', 'English'],
        tags: ['Boat', 'Food', 'Hands-on'],
        averageRating: 4.9,
        totalReviews: 122,
      },
    ],
    services: [
      {
        name: 'Tailor Yaly Premium',
        description:
          'May đo suit, áo dài trong 24h với chất liệu lụa Hội An, có dịch vụ fitting tại chỗ nghỉ.',
        category: ServiceCategory.OTHER,
        address: '358 Nguyễn Duy Hiệu, Hội An',
        latitudeOffset: -0.002,
        longitudeOffset: 0.004,
        phone: '02353910088',
        openHours: '08:00 - 21:00',
        images: [
          'https://images.unsplash.com/photo-1528490060256-c345efae4442?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1617032215861-7d392b5d907f?auto=format&fit=crop&w=1200&q=80',
        ],
        basePrice: 750000,
        amenities: ['Fitting tại nhà', 'Tea break', 'Giao tận nơi'],
        features: ['Hoàn thiện 24h', 'Vải lụa Việt Nam', 'Thợ 15 năm kinh nghiệm'],
        isBookable: true,
        requiresDeposit: true,
        depositAmount: 200000,
        averageRating: 4.87,
        totalReviews: 167,
      },
      {
        name: 'Hoi An Night Food Tour',
        description:
          'Tour ăn đêm 10 món đặc sản, hướng dẫn viên đưa bạn qua các con hẻm và quán lâu năm.',
        category: ServiceCategory.TOUR,
        address: 'Chợ Hội An, Trần Phú',
        latitudeOffset: -0.001,
        longitudeOffset: 0.003,
        phone: '0902887766',
        openHours: '17:00 - 22:00',
        images: [
          'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1473093226795-af9932fe5856?auto=format&fit=crop&w=1200&q=80',
        ],
        basePrice: 650000,
        amenities: ['10 món ăn', 'Nước uống', 'Ảnh chuyên nghiệp'],
        features: ['Nhóm nhỏ 8 khách', 'Hướng dẫn viên foodie', 'Trải nghiệm ban đêm'],
        isBookable: true,
        requiresDeposit: false,
        averageRating: 4.93,
        totalReviews: 204,
      },
    ],
  },
  {
    key: 'da-nang',
    city: 'Đà Nẵng',
    state: 'Đà Nẵng',
    country: 'Vietnam',
    latitude: 16.0471,
    longitude: 108.2068,
    host: {
      name: 'Lưu Hồng Phúc',
      email: 'host.danang@luxestay.vn',
      phone: '0913456789',
      image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=600&q=80',
      bio: 'Phúc là travel designer tại Đà Nẵng, chuyên các căn hộ cao cấp view biển Mỹ Khê và Sơn Trà.',
      languages: ['Tiếng Việt', 'English', '한국어'],
      isSuperHost: true,
    },
    listings: [
      {
        title: 'Skyline Marina Suite',
        description:
          'Căn hộ cao tầng hướng sông Hàn, ban công chữ L nhìn Cầu Rồng, nội thất sang trọng kèm smart home.',
        propertyType: PropertyType.CONDO,
        roomType: RoomType.ENTIRE_PLACE,
        maxGuests: 4,
        bedrooms: 2,
        beds: 2,
        bathrooms: 2,
        address: '35 Bạch Đằng, Hải Châu, Đà Nẵng',
        neighborhood: 'Trung tâm',
        basePrice: 2500000,
        cleaningFee: 180000,
        serviceFee: 110000,
        latitudeOffset: 0.003,
        longitudeOffset: -0.002,
        images: [
          'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1521783988139-893354fcd0d5?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1574643156929-51fa098b0394?auto=format&fit=crop&w=1200&q=80',
        ],
        amenityNames: [
          'High-speed Wifi',
          'Air Conditioning',
          'Smart TV',
          'Smart Lock',
          'Workspace Desk',
          'Private Parking',
        ],
        verifiedAmenities: ['View cầu Rồng phun lửa', 'Máy lọc không khí'],
        instantBookable: true,
        allowPets: false,
        allowSmoking: false,
        allowChildren: true,
        weeklyDiscount: 0.05,
        averageRating: 4.85,
        totalReviews: 140,
        totalBookings: 245,
      },
      {
        title: 'My Khe Beachfront Loft',
        description:
          'Loft hai tầng ngay biển Mỹ Khê, thiết kế tropical, bếp mở và góc chill hammock.',
        propertyType: PropertyType.APARTMENT,
        roomType: RoomType.ENTIRE_PLACE,
        maxGuests: 5,
        bedrooms: 2,
        beds: 3,
        bathrooms: 2,
        address: '90 Võ Nguyên Giáp, Sơn Trà, Đà Nẵng',
        neighborhood: 'Mỹ Khê',
        basePrice: 2800000,
        cleaningFee: 200000,
        serviceFee: 120000,
        latitudeOffset: 0.01,
        longitudeOffset: 0.015,
        images: [
          'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1585468274953-cfe26cf4a718?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
        ],
        amenityNames: [
          'High-speed Wifi',
          'Air Conditioning',
          'Full Kitchen',
          'Balcony View',
          'Smart Lock',
          'Smart TV',
        ],
        verifiedAmenities: ['Surfboard & SUP cho thuê', 'Tủ lạnh mini đầy đồ địa phương'],
        instantBookable: true,
        allowPets: false,
        allowSmoking: false,
        allowChildren: true,
        weeklyDiscount: 0.06,
        monthlyDiscount: 0.12,
        averageRating: 4.9,
        totalReviews: 158,
        totalBookings: 278,
      },
      {
        title: 'Son Tra Jungle Villa',
        description:
          'Villa view bán đảo Sơn Trà, hồ bơi đá và sân thượng BBQ nhìn biển. Có phòng yoga và phòng xông hơi.',
        propertyType: PropertyType.VILLA,
        roomType: RoomType.ENTIRE_PLACE,
        maxGuests: 10,
        bedrooms: 5,
        beds: 6,
        bathrooms: 5,
        address: 'Lô 7 Lê Văn Lương, Thọ Quang, Đà Nẵng',
        neighborhood: 'Sơn Trà',
        basePrice: 5200000,
        cleaningFee: 350000,
        serviceFee: 200000,
        latitudeOffset: 0.02,
        longitudeOffset: 0.018,
        images: [
          'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1600047509354-0aac99325614?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1574643156929-51fa098b0394?auto=format&fit=crop&w=1200&q=80',
        ],
        amenityNames: [
          'High-speed Wifi',
          'Outdoor Pool',
          'Full Kitchen',
          'Outdoor BBQ',
          'Private Parking',
          'Smart TV',
          'Workspace Desk',
        ],
        verifiedAmenities: ['Yoga shala nhìn biển', 'Driver đưa đón sân bay'],
        instantBookable: false,
        allowPets: false,
        allowSmoking: false,
        allowEvents: true,
        allowChildren: true,
        weekendMultiplier: 1.25,
        weeklyDiscount: 0.08,
        monthlyDiscount: 0.18,
        averageRating: 4.94,
        totalReviews: 104,
        totalBookings: 176,
      },
      {
        title: 'Han Riverside Smart Studio',
        description:
          'Studio compact nhưng đủ tiện nghi với bếp, giường Murphy và màn hình 75" cho digital nomad.',
        propertyType: PropertyType.APARTMENT,
        roomType: RoomType.ENTIRE_PLACE,
        maxGuests: 2,
        bedrooms: 1,
        beds: 1,
        bathrooms: 1,
        address: '21 Nguyễn Văn Linh, Hải Châu, Đà Nẵng',
        neighborhood: 'Cầu Rồng',
        basePrice: 1600000,
        cleaningFee: 120000,
        serviceFee: 80000,
        latitudeOffset: -0.004,
        longitudeOffset: 0.003,
        images: [
          'https://images.unsplash.com/photo-1616594039964-40b46d64af7f?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
        ],
        amenityNames: [
          'High-speed Wifi',
          'Air Conditioning',
          'Smart Lock',
          'Smart TV',
          'Workspace Desk',
        ],
        verifiedAmenities: ['Bàn làm việc sit-stand', 'Máy pha cà phê specialty'],
        instantBookable: true,
        allowPets: false,
        allowSmoking: false,
        allowChildren: true,
        weeklyDiscount: 0.05,
        averageRating: 4.83,
        totalReviews: 132,
        totalBookings: 220,
      },
    ],
    experiences: [
      {
        title: 'Sunrise Sơn Trà Trek & Yoga',
        description:
          'Leo Sơn Trà đón bình minh, tập yoga trên đỉnh và picnic brunch healthy.',
        category: ExperienceCategory.WELLNESS,
        locationLabel: 'Bán đảo Sơn Trà, Đà Nẵng',
        latitudeOffset: 0.03,
        longitudeOffset: 0.025,
        image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80',
        images: [
          'https://images.unsplash.com/photo-1523419409543-0c1df022bdd1?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
        ],
        price: 780000,
        duration: '5 giờ',
        groupSize: 'Tối đa 12 người',
        minGuests: 2,
        maxGuests: 12,
        includedItems: ['Hướng dẫn viên', 'Yoga teacher', 'Brunch healthy', 'Ảnh drone'],
        notIncluded: ['Đưa đón khách sạn'],
        requirements: ['Thể lực tốt', 'Giày leo núi'],
        languages: ['Tiếng Việt', 'English'],
        tags: ['Trekking', 'Yoga', 'Nature'],
        featured: true,
        averageRating: 4.9,
        totalReviews: 102,
      },
      {
        title: 'Street Food Night on Wheels',
        description:
          'Trải nghiệm ẩm thực Đà Nẵng bằng xe máy với food blogger bản địa, thử 8 món signature.',
        category: ExperienceCategory.FOOD_DRINK,
        locationLabel: 'Quận Hải Châu, Đà Nẵng',
        latitudeOffset: -0.002,
        longitudeOffset: -0.003,
        image: 'https://images.unsplash.com/photo-1528712306091-ed0763094c98?auto=format&fit=crop&w=1200&q=80',
        images: [
          'https://images.unsplash.com/photo-1473093226795-af9932fe5856?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=1200&q=80',
        ],
        price: 690000,
        duration: '3.5 giờ',
        groupSize: 'Tối đa 8 người',
        minGuests: 1,
        maxGuests: 8,
        includedItems: ['Xe máy & tài xế', '8 món ăn', 'Ảnh polaroid', 'Bảo hiểm'],
        notIncluded: ['Tip cho hướng dẫn viên'],
        requirements: ['Không dị ứng hải sản nặng'],
        languages: ['Tiếng Việt', 'English', '한국어'],
        tags: ['Food tour', 'Nightlife'],
        averageRating: 4.93,
        totalReviews: 149,
      },
    ],
    services: [
      {
        name: 'Da Nang Surf School',
        description:
          'Lớp học surf buổi sáng tại Mỹ Khê với HLV Úc, bao gồm ván, wetsuit và ảnh GoPro.',
        category: ServiceCategory.TOUR,
        address: 'Bãi Mỹ Khê, Võ Nguyên Giáp, Đà Nẵng',
        latitudeOffset: 0.012,
        longitudeOffset: 0.02,
        phone: '0934556677',
        openHours: '05:30 - 18:00',
        images: [
          'https://images.unsplash.com/photo-1523419409543-0c1df022bdd1?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80',
        ],
        basePrice: 950000,
        amenities: ['Shower nước ngọt', 'Locker', 'Ảnh GoPro'],
        features: ['Coach quốc tế', 'Nhóm nhỏ 4 khách', 'Thiết bị chất lượng cao'],
        isBookable: true,
        requiresDeposit: true,
        depositAmount: 300000,
        averageRating: 4.86,
        totalReviews: 137,
      },
      {
        name: 'Sky36 Rooftop VIP Lounge',
        description:
          'Đặt bàn VIP Sky36 với view 360 độ, bao gồm combo cocktail signature và DJ quốc tế.',
        category: ServiceCategory.ENTERTAINMENT,
        address: 'Tầng 36 Novotel Danang, 36 Bạch Đằng',
        latitudeOffset: 0.001,
        longitudeOffset: -0.001,
        phone: '0935338855',
        openHours: '18:00 - 02:00',
        images: [
          'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80',
        ],
        basePrice: 620000,
        amenities: ['Bàn VIP', 'Cocktail signature', 'Nhạc DJ live'],
        features: ['View 360°', 'Line-up DJ quốc tế', 'Service charge included'],
        isBookable: true,
        requiresDeposit: true,
        depositAmount: 200000,
        averageRating: 4.78,
        totalReviews: 112,
      },
    ],
  },

]

const REVIEW_LIBRARY: Record<string, ReviewTemplate[]> = {
  'da-lat': [
    {
      overallRating: 4.9,
      cleanlinessRating: 5,
      accuracyRating: 4.8,
      checkInRating: 5,
      communicationRating: 5,
      locationRating: 4.7,
      valueRating: 4.8,
      comment:
        'Villa rất xanh và yên tĩnh, phù hợp gia đình nghỉ dưỡng. Host chuẩn bị trà nóng, lò sưởi và hướng dẫn săn mây cực kỳ chi tiết.',
      monthsAgo: 1,
      nights: 3,
      guests: 6,
      aiSentiment: 'positive',
      aiKeywords: ['green', 'calm', 'host'],
    },
    {
      overallRating: 4.8,
      cleanlinessRating: 5,
      accuracyRating: 4.7,
      checkInRating: 4.8,
      communicationRating: 4.9,
      locationRating: 4.6,
      valueRating: 4.7,
      comment:
        'Không gian ấm áp, thiết kế tinh tế và mùi thơm gỗ cực dễ chịu. Bữa sáng homemade ngon hơn cả nhà hàng.',
      monthsAgo: 2,
      nights: 2,
      guests: 4,
      aiSentiment: 'positive',
      aiKeywords: ['breakfast', 'design', 'warm'],
    },
    {
      overallRating: 4.7,
      cleanlinessRating: 4.8,
      accuracyRating: 4.7,
      checkInRating: 4.9,
      communicationRating: 5,
      locationRating: 4.5,
      valueRating: 4.6,
      comment:
        'View đồi thông tuyệt đẹp, buổi tối có hỗ trợ nhóm BBQ rất tận tình. Phòng ngủ sạch sẽ, chăn nệm thơm.',
      monthsAgo: 3,
      nights: 2,
      guests: 5,
      aiSentiment: 'positive',
      aiKeywords: ['view', 'bbq', 'clean'],
    },
    {
      overallRating: 4.85,
      cleanlinessRating: 4.9,
      accuracyRating: 4.8,
      checkInRating: 5,
      communicationRating: 4.9,
      locationRating: 4.7,
      valueRating: 4.8,
      comment:
        'Host chuẩn bị welcome tea kèm bánh nóng rất dễ thương. Đêm lạnh có sẵn chăn điện và máy sưởi.',
      monthsAgo: 4,
      nights: 3,
      guests: 3,
      aiSentiment: 'positive',
      aiKeywords: ['welcome tea', 'warm', 'host'],
    },
  ],
  'phu-quoc': [
    {
      overallRating: 4.95,
      cleanlinessRating: 5,
      accuracyRating: 4.9,
      checkInRating: 4.9,
      communicationRating: 5,
      locationRating: 4.8,
      valueRating: 4.9,
      comment:
        'Biệt thự sát biển, hồ bơi vô cực đẹp xuất sắc. Nhân viên hỗ trợ BBQ hải sản và dọn phòng mỗi ngày rất chuyên nghiệp.',
      monthsAgo: 1,
      nights: 4,
      guests: 7,
      aiSentiment: 'positive',
      aiKeywords: ['beachfront', 'pool', 'bbq'],
    },
    {
      overallRating: 4.9,
      cleanlinessRating: 4.9,
      accuracyRating: 4.8,
      checkInRating: 5,
      communicationRating: 5,
      locationRating: 4.9,
      valueRating: 4.7,
      comment:
        'Hoàng hôn nhìn từ ban công quá đẹp, nhà trang trí phong cách Địa Trung Hải. Có chuẩn bị trái cây và nước detox mỗi ngày.',
      monthsAgo: 2,
      nights: 3,
      guests: 4,
      aiSentiment: 'positive',
      aiKeywords: ['sunset', 'balcony', 'detox'],
    },
    {
      overallRating: 4.85,
      cleanlinessRating: 4.8,
      accuracyRating: 4.9,
      checkInRating: 4.9,
      communicationRating: 4.9,
      locationRating: 4.7,
      valueRating: 4.8,
      comment:
        'Gia đình mình 3 thế hệ đều rất ưng ý. Phòng rộng, hồ bơi được vệ sinh hằng ngày, có khu vui chơi trẻ em.',
      monthsAgo: 3,
      nights: 4,
      guests: 8,
      aiSentiment: 'positive',
      aiKeywords: ['family', 'pool', 'clean'],
    },
    {
      overallRating: 4.8,
      cleanlinessRating: 4.9,
      accuracyRating: 4.7,
      checkInRating: 4.8,
      communicationRating: 4.9,
      locationRating: 4.8,
      valueRating: 4.7,
      comment:
        'Không gian yên tĩnh, vườn nhiệt đới đẹp. Host hỗ trợ đặt tour lặn ngắm san hô giá tốt và đưa đón tận nơi.',
      monthsAgo: 5,
      nights: 3,
      guests: 5,
      aiSentiment: 'positive',
      aiKeywords: ['tour', 'snorkeling', 'garden'],
    },
  ],
  'vung-tau': [
    {
      overallRating: 4.88,
      cleanlinessRating: 4.9,
      accuracyRating: 4.8,
      checkInRating: 4.9,
      communicationRating: 4.9,
      locationRating: 4.8,
      valueRating: 4.8,
      comment:
        'View biển Bãi Sau rất đẹp, ban công rộng tổ chức tiệc BBQ thoải mái. Host phản hồi trong 5 phút.',
      monthsAgo: 1,
      nights: 2,
      guests: 6,
      aiSentiment: 'positive',
      aiKeywords: ['sea view', 'bbq', 'responsive'],
    },
    {
      overallRating: 4.75,
      cleanlinessRating: 4.8,
      accuracyRating: 4.7,
      checkInRating: 4.9,
      communicationRating: 4.8,
      locationRating: 4.7,
      valueRating: 4.7,
      comment:
        'Căn hộ duplex sáng sủa, đồ dùng bếp đầy đủ. Đi bộ 3 phút ra biển, dưới nhà có nhiều quán ăn ngon.',
      monthsAgo: 3,
      nights: 3,
      guests: 5,
      aiSentiment: 'positive',
      aiKeywords: ['kitchen', 'location', 'duplex'],
    },
    {
      overallRating: 4.82,
      cleanlinessRating: 4.9,
      accuracyRating: 4.8,
      checkInRating: 4.8,
      communicationRating: 4.8,
      locationRating: 4.6,
      valueRating: 4.8,
      comment:
        'Nhà biển phong cách Indochine đẹp, có đường xuống biển riêng. Host chu đáo chuẩn bị hải sản chế biến sẵn.',
      monthsAgo: 4,
      nights: 2,
      guests: 7,
      aiSentiment: 'positive',
      aiKeywords: ['indochine', 'private beach', 'seafood'],
    },
    {
      overallRating: 4.8,
      cleanlinessRating: 4.9,
      accuracyRating: 4.7,
      checkInRating: 4.8,
      communicationRating: 4.9,
      locationRating: 4.7,
      valueRating: 4.8,
      comment:
        'Studio nhỏ nhưng decor xịn xò, nhìn thẳng tượng Chúa và biển. Có góc làm việc, wifi mạnh.',
      monthsAgo: 2,
      nights: 2,
      guests: 2,
      aiSentiment: 'positive',
      aiKeywords: ['studio', 'workspace', 'view'],
    },
  ],
  'ha-noi': [
    {
      overallRating: 4.87,
      cleanlinessRating: 4.9,
      accuracyRating: 4.8,
      checkInRating: 4.8,
      communicationRating: 5,
      locationRating: 4.9,
      valueRating: 4.8,
      comment:
        'Căn loft phố cổ giữ nguyên tường gạch cổ, decor rất art. Host chuẩn bị sẵn list quán ăn quanh hồ Gươm cực hữu ích.',
      monthsAgo: 1,
      nights: 2,
      guests: 3,
      aiSentiment: 'positive',
      aiKeywords: ['old quarter', 'food guide', 'design'],
    },
    {
      overallRating: 4.9,
      cleanlinessRating: 5,
      accuracyRating: 4.9,
      checkInRating: 5,
      communicationRating: 5,
      locationRating: 4.8,
      valueRating: 4.7,
      comment:
        'Biệt thự ven hồ Tây có phòng trà riêng và bể sục ngoài trời. Cảm giác rất thư giãn, phù hợp staycation cuối tuần.',
      monthsAgo: 2,
      nights: 3,
      guests: 5,
      aiSentiment: 'positive',
      aiKeywords: ['tay ho', 'onsen', 'relax'],
    },
    {
      overallRating: 4.78,
      cleanlinessRating: 4.8,
      accuracyRating: 4.7,
      checkInRating: 4.9,
      communicationRating: 4.9,
      locationRating: 4.9,
      valueRating: 4.6,
      comment:
        'Nhà phố Pháp cổ rộng rãi, trần cao và ban công nhìn ra Nhà hát Lớn. Nội thất kết hợp cổ điển - hiện đại rất tinh tế.',
      monthsAgo: 3,
      nights: 2,
      guests: 4,
      aiSentiment: 'positive',
      aiKeywords: ['french quarter', 'balcony', 'classic'],
    },
    {
      overallRating: 4.85,
      cleanlinessRating: 4.9,
      accuracyRating: 4.8,
      checkInRating: 4.8,
      communicationRating: 4.9,
      locationRating: 4.8,
      valueRating: 4.7,
      comment:
        'Penthouse view toàn cảnh trung tâm, hồ bơi vô cực và phòng gym miễn phí. Rất phù hợp vừa làm việc vừa nghỉ dưỡng.',
      monthsAgo: 4,
      nights: 4,
      guests: 3,
      aiSentiment: 'positive',
      aiKeywords: ['skyline', 'pool', 'workation'],
    },
  ],
  'hoi-an': [
    {
      overallRating: 4.9,
      cleanlinessRating: 4.9,
      accuracyRating: 4.8,
      checkInRating: 4.9,
      communicationRating: 5,
      locationRating: 4.9,
      valueRating: 4.8,
      comment:
        'Biệt thự đèn lồng tuyệt đẹp, tối đến thắp đèn lung linh. Host chuẩn bị thuyền đưa gia đình đi dạo sông Hoài.',
      monthsAgo: 1,
      nights: 3,
      guests: 6,
      aiSentiment: 'positive',
      aiKeywords: ['lantern', 'boat', 'riverside'],
    },
    {
      overallRating: 4.85,
      cleanlinessRating: 4.9,
      accuracyRating: 4.8,
      checkInRating: 4.9,
      communicationRating: 4.9,
      locationRating: 4.8,
      valueRating: 4.7,
      comment:
        'Nhà cổ giữ nguyên kiến trúc, buổi sáng nghe chuông chùa Cầu. Chủ nhà chia sẻ list café-bánh mì ngon.',
      monthsAgo: 2,
      nights: 2,
      guests: 3,
      aiSentiment: 'positive',
      aiKeywords: ['heritage', 'old town', 'host'],
    },
    {
      overallRating: 4.88,
      cleanlinessRating: 4.9,
      accuracyRating: 4.8,
      checkInRating: 4.8,
      communicationRating: 4.9,
      locationRating: 4.7,
      valueRating: 4.8,
      comment:
        'Bungalow giữa rừng dừa siêu chill, sáng chèo thúng vô cùng thích. Bữa sáng cao lầu rất ngon.',
      monthsAgo: 3,
      nights: 2,
      guests: 2,
      aiSentiment: 'positive',
      aiKeywords: ['coconut', 'basket boat', 'breakfast'],
    },
    {
      overallRating: 4.92,
      cleanlinessRating: 5,
      accuracyRating: 4.9,
      checkInRating: 5,
      communicationRating: 5,
      locationRating: 4.9,
      valueRating: 4.8,
      comment:
        'Villa ven biển An Bàng có hồ plunge pool siêu đẹp. Host hỗ trợ đặt hải sản và đầu bếp nấu tại chỗ.',
      monthsAgo: 4,
      nights: 4,
      guests: 7,
      aiSentiment: 'positive',
      aiKeywords: ['plunge pool', 'seafood', 'host'],
    },
  ],
  'da-nang': [
    {
      overallRating: 4.87,
      cleanlinessRating: 4.9,
      accuracyRating: 4.8,
      checkInRating: 4.9,
      communicationRating: 4.9,
      locationRating: 4.9,
      valueRating: 4.7,
      comment:
        'Căn hộ view cầu Rồng quá đẹp, tối đứng ban công xem phun lửa. Nhà rất sạch và smart home tiện lợi.',
      monthsAgo: 1,
      nights: 3,
      guests: 4,
      aiSentiment: 'positive',
      aiKeywords: ['dragon bridge', 'smart home', 'view'],
    },
    {
      overallRating: 4.91,
      cleanlinessRating: 4.9,
      accuracyRating: 4.9,
      checkInRating: 4.9,
      communicationRating: 5,
      locationRating: 4.8,
      valueRating: 4.8,
      comment:
        'Loft sát biển Mỹ Khê, decor tropical đẹp mê. Mỗi sáng host gửi cà phê trứng và bánh mì.',
      monthsAgo: 2,
      nights: 4,
      guests: 5,
      aiSentiment: 'positive',
      aiKeywords: ['beach', 'coffee', 'decor'],
    },
    {
      overallRating: 4.84,
      cleanlinessRating: 4.9,
      accuracyRating: 4.8,
      checkInRating: 4.8,
      communicationRating: 4.9,
      locationRating: 4.7,
      valueRating: 4.7,
      comment:
        'Villa Sơn Trà view rừng cực đã, hồ bơi đá chill. Có phòng yoga nên team retreat rất thích.',
      monthsAgo: 3,
      nights: 3,
      guests: 8,
      aiSentiment: 'positive',
      aiKeywords: ['son tra', 'yoga', 'pool'],
    },
    {
      overallRating: 4.82,
      cleanlinessRating: 4.8,
      accuracyRating: 4.8,
      checkInRating: 4.9,
      communicationRating: 4.9,
      locationRating: 4.8,
      valueRating: 4.8,
      comment:
        'Studio nhỏ nhưng đầy đủ, bàn làm việc chuẩn, wifi 250Mbps. Ở đây workation rất sướng.',
      monthsAgo: 4,
      nights: 10,
      guests: 1,
      aiSentiment: 'positive',
      aiKeywords: ['workation', 'wifi', 'studio'],
    },
  ],
}

const MEMBERSHIP_PLAN_SEEDS = [
  {
    slug: 'silver',
    name: 'Silver',
    tagline: 'Khởi động hành trình với ưu đãi thiết thực',
    description: 'Gói dành cho khách đặt homestay thường xuyên cần ưu đãi cơ bản và hỗ trợ nhanh chóng.',
    icon: 'sparkles',
    color: 'from-gray-400 to-gray-600',
    badge: null,
    monthlyPrice: 99000,
    annualPrice: 990000,
    savings: 198000,
    isPopular: false,
    features: [
      'Giảm 5% mọi booking',
      'Hoàn hủy miễn phí trong 24h',
      'Hỗ trợ email ưu tiên',
      'Ưu tiên săn flash sale',
      'Tích luỹ điểm x1.5',
      'Nhận bản tin trải nghiệm địa phương hàng tháng'
    ],
    exclusiveFeatures: [],
    displayOrder: 0,
  },
  {
    slug: 'gold',
    name: 'Gold',
    tagline: 'Trải nghiệm nâng tầm với đặc quyền vượt trội',
    description: 'Gói được yêu thích nhất với ưu đãi tiết kiệm lớn và nhiều đặc quyền độc quyền.',
    icon: 'crown',
    color: 'from-yellow-400 to-yellow-600',
    badge: 'Phổ biến nhất',
    monthlyPrice: 199000,
    annualPrice: 1990000,
    savings: 398000,
    isPopular: true,
    features: [
      'Giảm 10% mọi booking',
      'Hoàn hủy linh hoạt trong 48h',
      'Đường dây hỗ trợ 24/7',
      '2 đêm miễn phí/năm',
      'Late checkout tự động (nếu có)',
      'Welcome gift mỗi lần nhận phòng',
      'Nâng cấp hạng phòng khi còn trống',
      'Tích luỹ điểm x2'
    ],
    exclusiveFeatures: [
      'Truy cập bộ sưu tập Secret Collection',
      'Tham gia workshop & city tour dành riêng cho member'
    ],
    displayOrder: 1,
  },
  {
    slug: 'diamond',
    name: 'Diamond',
    tagline: 'Đặc quyền chuẩn resort 5 sao & concierge riêng',
    description: 'Tối ưu cho khách cao cấp cần dịch vụ concierge cá nhân hóa và quyền lợi tối đa.',
    icon: 'zap',
    color: 'from-purple-400 via-pink-500 to-blue-500',
    badge: 'VIP',
    monthlyPrice: 299000,
    annualPrice: 2990000,
    savings: 598000,
    isPopular: false,
    features: [
      'Giảm 15% mọi booking',
      'Hoàn hủy linh hoạt bất kỳ lúc nào',
      'Concierge riêng 24/7',
      '4 đêm miễn phí/năm',
      'Miễn phí đổi lịch không giới hạn',
      'Late checkout + Early check-in đảm bảo',
      'Premium welcome gift với đặc sản địa phương',
      'Tích luỹ điểm x3'
    ],
    exclusiveFeatures: [
      'Trải nghiệm private chef 1 lần/năm',
      'Airport transfer 2 chiều/năm',
      'Vé mời sự kiện VIP & retreat member'
    ],
    displayOrder: 2,
  },
]

const REWARD_BADGE_SEEDS = [
  {
    slug: 'silver-explorer',
    name: 'Silver Explorer',
    tier: LoyaltyTier.SILVER,
    icon: '🥈',
    color: '#C0C0C0',
    description: 'Khách hàng thân thiết với 10+ đêm lưu trú mỗi năm.',
  },
  {
    slug: 'gold-ambassador',
    name: 'Gold Ambassador',
    tier: LoyaltyTier.GOLD,
    icon: '👑',
    color: '#D4AF37',
    description: 'Đạt 25+ đêm lưu trú và giới thiệu thành công 3 khách mới.',
  },
  {
    slug: 'diamond-elite',
    name: 'Diamond Elite',
    tier: LoyaltyTier.DIAMOND,
    icon: '💎',
    color: '#7F5AF0',
    description: 'Hạng thành viên cao nhất với quyền lợi concierge riêng.',
  },
]

const REWARD_TIER_SEEDS = [
  {
    tier: LoyaltyTier.BRONZE,
    name: 'Bronze',
    description: 'Thành viên mới bắt đầu cùng LuxeStay.',
    minPoints: 0,
    maxPoints: 999,
    bonusMultiplier: 1,
    benefits: [
      'Tích điểm 1x mỗi booking',
      'Nhận ưu đãi theo mùa',
      'Quản lý đặt phòng dễ dàng'
    ],
    displayOrder: 0,
  },
  {
    tier: LoyaltyTier.SILVER,
    name: 'Silver',
    description: 'Thành viên trung thành với ưu đãi tiết kiệm hơn.',
    minPoints: 1000,
    maxPoints: 2499,
    bonusMultiplier: 1.5,
    benefits: [
      'Tích điểm 1.5x mỗi booking',
      'Voucher 500.000đ mỗi năm',
      'Ưu tiên hỗ trợ qua email'
    ],
    displayOrder: 1,
    badgeSlug: 'silver-explorer',
  },
  {
    tier: LoyaltyTier.GOLD,
    name: 'Gold',
    description: 'Ưu tiên dịch vụ & nhiều đặc quyền lưu trú.',
    minPoints: 2500,
    maxPoints: 4999,
    bonusMultiplier: 2,
    benefits: [
      'Tích điểm 2x mỗi booking',
      'Voucher 1.000.000đ mỗi năm',
      'Late checkout linh hoạt',
      'Ưu đãi trải nghiệm địa phương'
    ],
    displayOrder: 2,
    badgeSlug: 'gold-ambassador',
  },
  {
    tier: LoyaltyTier.DIAMOND,
    name: 'Diamond',
    description: 'Tận hưởng concierge và quyền lợi tối đa.',
    minPoints: 5000,
    maxPoints: null,
    bonusMultiplier: 3,
    benefits: [
      'Tích điểm 3x mỗi booking',
      'Miễn phí nâng hạng phòng (nếu có)',
      'Concierge 24/7',
      'Airport transfer 2 chiều/năm'
    ],
    displayOrder: 3,
    badgeSlug: 'diamond-elite',
  },
]

function toSlug(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

async function resetDatabase() {
  console.log('🧨 Đang xóa toàn bộ dữ liệu cũ...')
  try {
    await resetClient.$runCommandRaw({ dropDatabase: 1 })
    console.log('✅ Đã xóa sạch database.')
  } catch (error: any) {
    if (error?.codeName === 'NamespaceNotFound') {
      console.log('ℹ️ Database đang trống, không cần xóa.')
    } else {
      console.error('❌ Không thể xóa database:', error)
      throw error
    }
  } finally {
    await resetClient.$disconnect()
  }
}

async function seedData() {
  const prisma = new PrismaClient()
  let totalListings = 0
  let totalExperiences = 0
  let totalServices = 0

  try {
    console.log('🌱 Bắt đầu seed dữ liệu curated cho LuxeStay...')
    const hashedPassword = await bcrypt.hash('Stay@2024', 10)

    await prisma.user.create({
      data: {
        email: 'admin@luxestay.vn',
        name: 'LuxeStay Admin',
        password: hashedPassword,
        role: UserRole.ADMIN,
        isHost: true,
        isSuperHost: false,
        emailVerified: new Date(),
        phone: '0900000000',
        image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Admin',
        bio: 'Tài khoản quản trị viên hệ thống LuxeStay.',
        languages: ['Tiếng Việt', 'English'],
      },
    })

    console.log('🧳 Tạo khách hàng trải nghiệm thực tế...')
    const guestRecords: any[] = []
    for (const guestSeed of GUEST_SEEDS) {
      const guest = await prisma.user.create({
        data: {
          email: guestSeed.email,
          name: guestSeed.name,
          password: hashedPassword,
          role: UserRole.GUEST,
          emailVerified: new Date(),
          phone: guestSeed.phone,
          image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(guestSeed.avatarSeed)}`,
          languages: guestSeed.languages,
          loyaltyTier: guestSeed.loyaltyTier,
          loyaltyPoints: guestSeed.loyaltyPoints,
        },
      })
      guestRecords.push(guest)
    }

    console.log('🏅 Thiết lập chương trình loyalty & membership...')
    const badgeMap = new Map<string, string>()
    for (const badgeSeed of REWARD_BADGE_SEEDS) {
      const badge = await prisma.rewardBadge.create({
        data: {
          slug: badgeSeed.slug,
          name: badgeSeed.name,
          description: badgeSeed.description,
          tier: badgeSeed.tier,
          icon: badgeSeed.icon,
          color: badgeSeed.color,
          isLimited: false,
        },
      })
      badgeMap.set(badgeSeed.slug, badge.id)
    }

    for (const tierSeed of REWARD_TIER_SEEDS) {
      await prisma.rewardTier.create({
        data: {
          tier: tierSeed.tier,
          name: tierSeed.name,
          description: tierSeed.description,
          minPoints: tierSeed.minPoints,
          maxPoints: tierSeed.maxPoints,
          bonusMultiplier: tierSeed.bonusMultiplier,
          benefits: tierSeed.benefits,
          displayOrder: tierSeed.displayOrder,
          badgeId: tierSeed.badgeSlug ? badgeMap.get(tierSeed.badgeSlug) ?? null : null,
        },
      })
    }

    await prisma.membershipPlan.createMany({
      data: MEMBERSHIP_PLAN_SEEDS.map((plan) => ({
        slug: plan.slug,
        name: plan.name,
        tagline: plan.tagline,
        description: plan.description,
        icon: plan.icon,
        color: plan.color,
        badge: plan.badge,
        monthlyPrice: plan.monthlyPrice,
        annualPrice: plan.annualPrice,
        savings: plan.savings,
        isPopular: plan.isPopular,
        features: plan.features,
        exclusiveFeatures: plan.exclusiveFeatures,
        displayOrder: plan.displayOrder,
      })),
    })

    console.log('👥 Tạo host cho từng địa điểm...')
    const hostMap = new Map<string, string>()
    const hostStats = new Map<string, { totalRating: number; reviewCount: number }>()
    for (const location of LOCATIONS) {
      const host = await prisma.user.create({
        data: {
          email: location.host.email,
          name: location.host.name,
          password: hashedPassword,
          role: UserRole.HOST,
          isHost: true,
          isSuperHost: location.host.isSuperHost ?? false,
          emailVerified: new Date(),
          phone: location.host.phone,
          image: location.host.image,
          bio: location.host.bio,
          languages: location.host.languages,
          isVerified: true,
        },
      })
      await prisma.hostProfile.create({
        data: {
          userId: host.id,
          responseRate: location.host.isSuperHost ? 0.98 : 0.9,
          responseTime: location.host.isSuperHost ? 25 : 60,
          acceptanceRate: location.host.isSuperHost ? 0.96 : 0.88,
          isSuperHost: location.host.isSuperHost ?? false,
          superHostSince: location.host.isSuperHost ? new Date('2021-01-01') : null,
          instantBookEnabled: true,
          governmentIdVerified: true,
          emailVerified: true,
          phoneVerified: true,
        },
      })
      hostMap.set(location.key, host.id)
      hostStats.set(host.id, { totalRating: 0, reviewCount: 0 })
    }

    console.log('🛠️ Tạo danh sách tiện nghi chuẩn hóa...')
    const amenityRecords = await Promise.all(
      AMENITIES.map((amenity) =>
        prisma.amenity.create({
          data: {
            name: amenity.name,
            nameVi: amenity.nameVi,
            icon: amenity.icon,
            category: amenity.category,
            description: amenity.description,
            isPopular: amenity.isPopular ?? false,
          },
        })
      )
    )

    const amenityMap = new Map(amenityRecords.map((record) => [record.name, record]))

    console.log('🏘️ Seed listings, experiences, services theo từng thành phố...')
    for (const location of LOCATIONS) {
      const hostId = hostMap.get(location.key)
      if (!hostId) {
        console.warn(`⚠️ Không tìm thấy host cho địa điểm ${location.city}, bỏ qua.`)
        continue
      }

      const listingsForLocation = []
      for (const listingSeed of location.listings) {
        const amenityIds = listingSeed.amenityNames
          .map((name) => {
            const amenity = amenityMap.get(name)
            if (!amenity) {
              console.warn(`⚠️ Amenity "${name}" chưa được định nghĩa.`)
            }
            return amenity?.id
          })
          .filter((id): id is string => Boolean(id))

        const listing = await prisma.listing.create({
          data: {
            hostId,
            title: listingSeed.title,
            description: listingSeed.description,
            propertyType: listingSeed.propertyType,
            roomType: listingSeed.roomType,
            maxGuests: listingSeed.maxGuests,
            bedrooms: listingSeed.bedrooms,
            beds: listingSeed.beds,
            bathrooms: listingSeed.bathrooms,
            country: location.country,
            city: location.city,
            state: location.state ?? null,
            address: listingSeed.address,
            latitude: location.latitude + listingSeed.latitudeOffset,
            longitude: location.longitude + listingSeed.longitudeOffset,
            neighborhood: listingSeed.neighborhood,
            basePrice: listingSeed.basePrice,
            cleaningFee: listingSeed.cleaningFee,
            serviceFee: listingSeed.serviceFee,
            weeklyDiscount: listingSeed.weeklyDiscount ?? 0,
            monthlyDiscount: listingSeed.monthlyDiscount ?? 0,
            weekendMultiplier: listingSeed.weekendMultiplier ?? 1.2,
            currency: 'VND',
            images: listingSeed.images,
            amenities: amenityIds,
            verifiedAmenities: listingSeed.verifiedAmenities,
            status: ListingStatus.ACTIVE,
            slug: `${toSlug(location.city)}-${toSlug(listingSeed.title)}`,
            featured: listingSeed.featured ?? false,
            isSecret: listingSeed.isSecret ?? listingSeed.basePrice >= 3500000,
            instantBookable: listingSeed.instantBookable ?? false,
            allowPets: listingSeed.allowPets ?? false,
            allowSmoking: listingSeed.allowSmoking ?? false,
            allowEvents: listingSeed.allowEvents ?? false,
            allowChildren: listingSeed.allowChildren ?? true,
            cancellationPolicy: CancellationPolicy.MODERATE,
            checkInTime: '14:00',
            checkOutTime: '11:00',
            houseRules: 'Không hút thuốc trong nhà. Giữ yên tĩnh sau 22:00.',
            averageRating: listingSeed.averageRating,
            totalReviews: listingSeed.totalReviews,
            totalBookings: listingSeed.totalBookings,
            publishedAt: new Date(),
          },
        })

        listingsForLocation.push(listing)
        totalListings++
      }

      for (const experienceSeed of location.experiences) {
        await prisma.experience.create({
          data: {
            hostId,
            title: experienceSeed.title,
            description: experienceSeed.description,
            category: experienceSeed.category,
            city: location.city,
            state: location.state ?? null,
            location: experienceSeed.locationLabel,
            latitude: location.latitude + experienceSeed.latitudeOffset,
            longitude: location.longitude + experienceSeed.longitudeOffset,
            image: experienceSeed.image,
            images: experienceSeed.images,
            price: experienceSeed.price,
            duration: experienceSeed.duration,
            groupSize: experienceSeed.groupSize,
            minGuests: experienceSeed.minGuests,
            maxGuests: experienceSeed.maxGuests,
            includedItems: experienceSeed.includedItems,
            notIncluded: experienceSeed.notIncluded,
            requirements: experienceSeed.requirements,
            languages: experienceSeed.languages,
            tags: experienceSeed.tags,
            status: ExperienceStatus.ACTIVE,
            isVerified: true,
            featured: experienceSeed.featured ?? false,
            isMembersOnly: experienceSeed.membersOnly ?? false,
            averageRating: experienceSeed.averageRating,
            totalReviews: experienceSeed.totalReviews,
            totalBookings: Math.round(experienceSeed.totalReviews * 1.6),
          },
        })
        totalExperiences++
      }

      const nearbyListingIds = listingsForLocation.map((listing) => listing.id)
      for (const serviceSeed of location.services) {
        await prisma.service.create({
          data: {
            name: serviceSeed.name,
            description: serviceSeed.description,
            category: serviceSeed.category,
            address: serviceSeed.address,
            city: location.city,
            state: location.state ?? null,
            country: location.country,
            latitude: location.latitude + serviceSeed.latitudeOffset,
            longitude: location.longitude + serviceSeed.longitudeOffset,
            phone: serviceSeed.phone,
            openHours: serviceSeed.openHours,
            isOpen24Hours: serviceSeed.isOpen24Hours ?? false,
            images: serviceSeed.images,
            basePrice: serviceSeed.basePrice ?? null,
            amenities: serviceSeed.amenities,
            features: serviceSeed.features,
            averageRating: serviceSeed.averageRating,
            totalReviews: serviceSeed.totalReviews,
            isBookable: serviceSeed.isBookable ?? false,
            requiresDeposit: serviceSeed.requiresDeposit ?? false,
            depositAmount: serviceSeed.depositAmount ?? null,
            status: ServiceStatus.ACTIVE,
            verifiedAt: new Date(),
            nearbyListings: nearbyListingIds,
          },
        })
        totalServices++
      }

      const reviewTemplates = REVIEW_LIBRARY[location.key] ?? []
      if (reviewTemplates.length > 0 && guestRecords.length > 0) {
        let reviewCursor = 0
        for (const listing of listingsForLocation) {
          const reviewsForListing = Math.min(reviewTemplates.length, 4)
          if (reviewsForListing === 0) {
            continue
          }

          let listingRatingTotal = 0
          for (let index = 0; index < reviewsForListing; index++) {
            const template = reviewTemplates[(reviewCursor + index) % reviewTemplates.length]
            const guest = guestRecords[(reviewCursor + index) % guestRecords.length]
            const nights = Math.max(template.nights, 1)
            const checkOut = new Date()
            checkOut.setMonth(checkOut.getMonth() - template.monthsAgo)
            checkOut.setDate(checkOut.getDate() - (index % 3))
            const checkIn = new Date(checkOut)
            checkIn.setDate(checkOut.getDate() - nights)

            const nightlySubtotal = listing.basePrice * nights
            const discountAmount = nightlySubtotal * (listing.weeklyDiscount ?? 0)
            const totalPrice = nightlySubtotal - discountAmount + listing.cleaningFee + listing.serviceFee

            const booking = await prisma.booking.create({
              data: {
                listingId: listing.id,
                guestId: guest.id,
                hostId,
                checkIn,
                checkOut,
                nights,
                adults: template.guests,
                basePrice: listing.basePrice,
                cleaningFee: listing.cleaningFee,
                serviceFee: listing.serviceFee,
                discount: 0,
                totalPrice,
                status: BookingStatus.COMPLETED,
                instantBook: listing.instantBookable,
                checkInInstructions: 'Nhận phòng bằng khóa số và liên hệ host khi cần hỗ trợ.',
                accessCode: `LS${listing.id.slice(-4)}`,
                confirmedAt: new Date(checkIn.getTime() - 7 * 24 * 60 * 60 * 1000),
                completedAt: checkOut,
              },
            })

            await prisma.review.create({
              data: {
                listingId: listing.id,
                bookingId: booking.id,
                reviewerId: guest.id,
                revieweeId: hostId,
                type: 'GUEST_TO_LISTING',
                overallRating: template.overallRating,
                cleanlinessRating: template.cleanlinessRating,
                accuracyRating: template.accuracyRating,
                checkInRating: template.checkInRating,
                communicationRating: template.communicationRating,
                locationRating: template.locationRating,
                valueRating: template.valueRating,
                comment: template.comment,
                aiSentiment: template.aiSentiment ?? 'positive',
                aiKeywords: template.aiKeywords ?? [],
                isVerified: true,
              },
            })

            listingRatingTotal += template.overallRating
            const hostAggregate = hostStats.get(hostId)
            if (hostAggregate) {
              hostAggregate.totalRating += template.overallRating
              hostAggregate.reviewCount += 1
              hostStats.set(hostId, hostAggregate)
            }
          }

          const averageForListing = Number((listingRatingTotal / reviewsForListing).toFixed(2))
          await prisma.listing.update({
            where: { id: listing.id },
            data: {
              averageRating: averageForListing,
              totalReviews: reviewsForListing,
              totalBookings: Math.max(listing.totalBookings ?? 0, reviewsForListing * 12),
            },
          })

          reviewCursor += reviewsForListing
        }
      }
    }

    for (const [hostId, stats] of hostStats.entries()) {
      if (stats.reviewCount === 0) continue
      const hostAverage = Number((stats.totalRating / stats.reviewCount).toFixed(2))
      await prisma.hostProfile.updateMany({
        where: { userId: hostId },
        data: {
          averageRating: hostAverage,
          totalReviews: stats.reviewCount,
        },
      })
    }

    console.log(`✅ Seed hoàn tất: ${totalListings} listings, ${totalExperiences} experiences, ${totalServices} services.`)
  } catch (error) {
    console.error('❌ Seed bị lỗi:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

async function main() {
  await resetDatabase()
  await seedData()
}

main().catch((error) => {
  console.error('❌ Hoàn tác seed thất bại:', error)
  process.exit(1)
})
