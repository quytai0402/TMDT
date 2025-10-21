import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Define enums locally until Prisma Client is regenerated
enum ServiceCategory {
  PET_VET = 'PET_VET',
  PET_PARK = 'PET_PARK',
  PET_STORE = 'PET_STORE',
  PET_GROOMING = 'PET_GROOMING',
  PET_HOTEL = 'PET_HOTEL',
  COWORKING_SPACE = 'COWORKING_SPACE',
  WORKSPACE = 'WORKSPACE',
  GYM = 'GYM',
  RESTAURANT = 'RESTAURANT',
  CAFE = 'CAFE',
  TRANSPORT = 'TRANSPORT',
  TOUR = 'TOUR',
  ENTERTAINMENT = 'ENTERTAINMENT',
  OTHER = 'OTHER'
}

enum ServiceStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  TEMPORARILY_CLOSED = 'TEMPORARILY_CLOSED'
}

console.log('🏢 Seeding Services (Pet, Coworking, Workspaces)...\n')

// Real Vietnam locations for services
const VIETNAM_CITIES = [
  { city: 'Đà Lạt', state: 'Lâm Đồng', lat: 11.9404, lng: 108.4583 },
  { city: 'Nha Trang', state: 'Khánh Hòa', lat: 12.2388, lng: 109.1967 },
  { city: 'Hội An', state: 'Quảng Nam', lat: 15.8801, lng: 108.3380 },
  { city: 'Phú Quốc', state: 'Kiên Giang', lat: 10.2899, lng: 103.9840 },
  { city: 'Đà Nẵng', state: '', lat: 16.0544, lng: 108.2022 },
  { city: 'Hà Nội', state: '', lat: 21.0285, lng: 105.8542 },
  { city: 'TP.HCM', state: '', lat: 10.8231, lng: 106.6297 },
  { city: 'Huế', state: 'Thừa Thiên Huế', lat: 16.4637, lng: 107.5909 },
]

const PET_SERVICES = [
  {
    category: ServiceCategory.PET_VET,
    names: ['Phòng khám Thú y Pet Care', 'Bệnh viện Thú y 24/7', 'Pet Clinic Việt Nam'],
    basePrice: 200000,
    features: ['Khám tổng quát', 'Tiêm phòng', 'Phẫu thuật', 'Cấp cứu 24/7', 'X-quang', 'Siêu âm'],
    openHours: '8:00 - 20:00 (T2-CN)',
  },
  {
    category: ServiceCategory.PET_PARK,
    names: ['Công viên Thảo Cầm Viên', 'Công viên Cầu Giấy', 'Vườn hoa Lê Nin'],
    basePrice: 0, // Free
    features: ['Khu vực chó chạy tự do', 'Ghế ngồi nghỉ', 'Túi rác miễn phí', 'Vòi nước', 'Hàng rào an toàn'],
    openHours: '5:00 - 22:00',
  },
  {
    category: ServiceCategory.PET_STORE,
    names: ['Pet Mart', 'Cửa hàng Thú cưng Sài Gòn', 'Pet Shop 24h'],
    basePrice: 50000,
    features: ['Thức ăn cao cấp', 'Đồ chơi', 'Phụ kiện', 'Thuốc & vitamin', 'Lồng & chuồng'],
    openHours: '9:00 - 21:00',
  },
  {
    category: ServiceCategory.PET_GROOMING,
    names: ['Paws & Claws Spa', 'Pet Grooming VN', 'Spa Thú Cưng'],
    basePrice: 150000,
    features: ['Tắm & sấy', 'Cắt tỉa lông chuyên nghiệp', 'Cắt móng', 'Vệ sinh răng miệng', 'Massage thư giãn'],
    openHours: '8:00 - 18:00 (T2-CN)',
  },
  {
    category: ServiceCategory.PET_HOTEL,
    names: ['Khách sạn Thú Cưng 5 Sao', 'Pet Hotel Premium', 'Nhà trọ Thú Cưng'],
    basePrice: 300000,
    features: ['Phòng riêng có camera', 'Chăm sóc 24/7', 'Đồ ăn premium', 'Dắt dạo 3 lần/ngày', 'Báo cáo hằng ngày'],
    openHours: '24/7',
    isOpen24Hours: true,
  },
]

const COWORKING_SERVICES = [
  {
    category: ServiceCategory.COWORKING_SPACE,
    names: ['The Hive Coworking', 'Toong Coworking Space', 'Work Saigon'],
    basePrice: 100000, // per day
    features: ['WiFi 300Mbps', 'Bàn làm việc riêng', 'Phòng họp', 'Cafe miễn phí', 'Máy in/scan', 'Điều hòa'],
    amenities: ['WiFi', 'Coffee', 'Printer', 'Meeting Room', 'Air Conditioning', 'Parking'],
    openHours: '8:00 - 22:00',
  },
  {
    category: ServiceCategory.WORKSPACE,
    names: ['Co-Lab Workspace', 'Dreamplex', 'Start Network'],
    basePrice: 150000,
    features: ['Hot desk', 'Dedicated desk available', 'High-speed internet', 'Phone booth', 'Networking events'],
    amenities: ['WiFi', 'Coffee', 'Tea', 'Snacks', 'Lockers', '24/7 Access'],
    openHours: '24/7',
    isOpen24Hours: true,
  },
]

const GYM_SERVICES = [
  {
    category: ServiceCategory.GYM,
    names: ['California Fitness & Yoga', 'Gym Center VN', 'Fitness First'],
    basePrice: 200000, // per session or day pass
    features: ['Máy tập hiện đại', 'Phòng Yoga', 'Sauna', 'HLV cá nhân', 'Lớp group class'],
    amenities: ['Locker', 'Shower', 'Towel', 'Water', 'Parking'],
    openHours: '6:00 - 22:00',
  },
]

async function main() {
  console.log('📍 Getting existing listings for location matching...')
  const listings = await prisma.listing.findMany({
    select: { id: true, city: true, state: true, latitude: true, longitude: true },
    take: 150,
  })

  let totalCreated = 0

  // Create Pet Services
  console.log('\n🐾 Creating Pet Services...')
  for (const city of VIETNAM_CITIES) {
    for (const petServiceType of PET_SERVICES) {
      const serviceName = petServiceType.names[Math.floor(Math.random() * petServiceType.names.length)]
      
      // Find nearby listings (within same city)
      const nearbyListings = listings
        .filter(l => l.city === city.city || l.state === city.state)
        .slice(0, 10)
        .map(l => l.id)

      // Random location offset (within 2km radius)
      const latOffset = (Math.random() - 0.5) * 0.02
      const lngOffset = (Math.random() - 0.5) * 0.02

      await prisma.service.create({
        data: {
          name: `${serviceName} - ${city.city}`,
          description: `Dịch vụ ${petServiceType.category.replace('PET_', '').toLowerCase()} chuyên nghiệp tại ${city.city}. Đội ngũ giàu kinh nghiệm, trang thiết bị hiện đại, giá cả hợp lý.`,
          category: petServiceType.category,
          address: `${Math.floor(Math.random() * 500) + 1} Đường ${['Trần Phú', 'Lê Lợi', 'Nguyễn Huệ', 'Hai Bà Trưng'][Math.floor(Math.random() * 4)]}, ${city.city}`,
          city: city.city,
          state: city.state,
          country: 'Vietnam',
          latitude: city.lat + latOffset,
          longitude: city.lng + lngOffset,
          phone: `09${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
          openHours: petServiceType.openHours,
          isOpen24Hours: petServiceType.isOpen24Hours || false,
          images: [
            `https://images.unsplash.com/photo-${Math.floor(Math.random() * 9000000000) + 1000000000}-${Math.random().toString(36).substring(7)}?w=800`,
            `https://images.unsplash.com/photo-${Math.floor(Math.random() * 9000000000) + 1000000000}-${Math.random().toString(36).substring(7)}?w=800`,
          ],
          basePrice: petServiceType.basePrice,
          currency: 'VND',
          averageRating: parseFloat((Math.random() * 1.5 + 3.5).toFixed(1)),
          totalReviews: Math.floor(Math.random() * 200) + 50,
          features: petServiceType.features,
          amenities: ['Parking', 'AC', 'WiFi'],
          isBookable: petServiceType.basePrice > 0,
          requiresDeposit: petServiceType.basePrice >= 200000,
          depositAmount: petServiceType.basePrice >= 200000 ? Math.floor(petServiceType.basePrice * 0.3) : undefined,
          status: ServiceStatus.ACTIVE,
          verifiedAt: new Date(),
          nearbyListings,
        },
      })
      totalCreated++
    }
  }

  console.log(`✅ Created ${totalCreated} Pet Services`)

  // Create Coworking Spaces
  console.log('\n💼 Creating Coworking Spaces...')
  const coworkingCreated = totalCreated
  for (const city of VIETNAM_CITIES.slice(0, 5)) { // Only major cities
    for (const coworkingType of COWORKING_SERVICES) {
      const serviceName = coworkingType.names[Math.floor(Math.random() * coworkingType.names.length)]
      
      const nearbyListings = listings
        .filter(l => l.city === city.city)
        .slice(0, 15)
        .map(l => l.id)

      const latOffset = (Math.random() - 0.5) * 0.02
      const lngOffset = (Math.random() - 0.5) * 0.02

      await prisma.service.create({
        data: {
          name: `${serviceName} - ${city.city}`,
          description: `Không gian làm việc chung hiện đại tại ${city.city}. Môi trường chuyên nghiệp, cộng đồng năng động, hỗ trợ khởi nghiệp.`,
          category: coworkingType.category,
          address: `${Math.floor(Math.random() * 300) + 1} Đường ${['Võ Văn Kiệt', 'Pasteur', 'Nguyễn Thị Minh Khai', 'Điện Biên Phủ'][Math.floor(Math.random() * 4)]}, ${city.city}`,
          city: city.city,
          state: city.state,
          country: 'Vietnam',
          latitude: city.lat + latOffset,
          longitude: city.lng + lngOffset,
          phone: `09${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
          website: `https://www.${serviceName.toLowerCase().replace(/\s/g, '')}.com`,
          openHours: coworkingType.openHours,
          isOpen24Hours: coworkingType.isOpen24Hours || false,
          images: [
            `https://images.unsplash.com/photo-${Math.floor(Math.random() * 9000000000) + 1000000000}-${Math.random().toString(36).substring(7)}?w=800`,
            `https://images.unsplash.com/photo-${Math.floor(Math.random() * 9000000000) + 1000000000}-${Math.random().toString(36).substring(7)}?w=800`,
            `https://images.unsplash.com/photo-${Math.floor(Math.random() * 9000000000) + 1000000000}-${Math.random().toString(36).substring(7)}?w=800`,
          ],
          basePrice: coworkingType.basePrice,
          currency: 'VND',
          averageRating: parseFloat((Math.random() * 1 + 4).toFixed(1)),
          totalReviews: Math.floor(Math.random() * 400) + 100,
          features: coworkingType.features,
          amenities: coworkingType.amenities,
          isBookable: true,
          requiresDeposit: false,
          status: ServiceStatus.ACTIVE,
          verifiedAt: new Date(),
          nearbyListings,
        },
      })
      totalCreated++
    }
  }

  console.log(`✅ Created ${totalCreated - coworkingCreated} Coworking Spaces`)

  // Create Gyms
  console.log('\n💪 Creating Gym Services...')
  const gymCreated = totalCreated
  for (const city of VIETNAM_CITIES.slice(0, 6)) {
    for (const gymType of GYM_SERVICES) {
      const serviceName = gymType.names[Math.floor(Math.random() * gymType.names.length)]
      
      const nearbyListings = listings
        .filter(l => l.city === city.city)
        .slice(0, 12)
        .map(l => l.id)

      const latOffset = (Math.random() - 0.5) * 0.02
      const lngOffset = (Math.random() - 0.5) * 0.02

      await prisma.service.create({
        data: {
          name: `${serviceName} - ${city.city}`,
          description: `Phòng tập gym hiện đại tại ${city.city}. Trang thiết bị Mỹ, HLV chuyên nghiệp, nhiều gói tập linh hoạt.`,
          category: gymType.category,
          address: `${Math.floor(Math.random() * 400) + 1} ${['Lê Duẩn', 'Ba Tháng Hai', 'Cách Mạng Tháng Tám', 'Hoàng Văn Thụ'][Math.floor(Math.random() * 4)]}, ${city.city}`,
          city: city.city,
          state: city.state,
          country: 'Vietnam',
          latitude: city.lat + latOffset,
          longitude: city.lng + lngOffset,
          phone: `09${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
          openHours: gymType.openHours,
          images: [
            `https://images.unsplash.com/photo-${Math.floor(Math.random() * 9000000000) + 1000000000}-${Math.random().toString(36).substring(7)}?w=800`,
          ],
          basePrice: gymType.basePrice,
          currency: 'VND',
          averageRating: parseFloat((Math.random() * 1.2 + 3.8).toFixed(1)),
          totalReviews: Math.floor(Math.random() * 300) + 80,
          features: gymType.features,
          amenities: gymType.amenities,
          isBookable: true,
          requiresDeposit: false,
          status: ServiceStatus.ACTIVE,
          verifiedAt: new Date(),
          nearbyListings,
        },
      })
      totalCreated++
    }
  }

  console.log(`✅ Created ${totalCreated - gymCreated} Gym Services`)

  console.log(`\n✨ Total Services Created: ${totalCreated}`)
  console.log('🎉 Services seeding completed!\n')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
