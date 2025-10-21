import { PrismaClient, PropertyType, ListingStatus, UserRole, BookingStatus, RoomType, AmenityCategory } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// REAL Vietnam locations với thông tin THẬT từ Google
const REAL_LOCATIONS = {
  'Đà Lạt': {
    city: 'Đà Lạt',
    state: 'Lâm Đồng',
    country: 'Vietnam',
    latitude: 11.9404,
    longitude: 108.4583,
    attractions: ['Hồ Xuân Hương', 'Chợ Đà Lạt', 'Thác Datanla', 'Valley of Love', 'Crazy House']
  },
  'Nha Trang': {
    city: 'Nha Trang',
    state: 'Khánh Hòa',
    country: 'Vietnam',
    latitude: 12.2388,
    longitude: 109.1967,
    attractions: ['Vinpearl Land', 'Bãi Biển Nha Trang', 'Tháp Bà Ponagar', 'Hòn Mun', 'Suối Khoáng Nóng I-Resort']
  },
  'Hội An': {
    city: 'Hội An',
    state: 'Quảng Nam',
    country: 'Vietnam',
    latitude: 15.8801,
    longitude: 108.3380,
    attractions: ['Phố Cổ Hội An', 'Chùa Cầu', 'Rừng Dừa Bảy Mẫu', 'Cù Lao Chàm', 'Đảo Ký Ức']
  },
  'Phú Quốc': {
    city: 'Phú Quốc',
    state: 'Kiên Giang',
    country: 'Vietnam',
    latitude: 10.2131,
    longitude: 103.9670,
    attractions: ['Bãi Sao', 'Dinh Cậu', 'Vinpearl Safari', 'Sunset Sanato Beach Club', 'Hòn Thơm Cable Car']
  },
  'Sapa': {
    city: 'Sa Pa',
    state: 'Lào Cai',
    country: 'Vietnam',
    latitude: 22.3364,
    longitude: 103.8438,
    attractions: ['Fansipan', 'Bản Cát Cát', 'Thác Bạc', 'Núi Hàm Rồng', 'Cổng Trời Sapa']
  },
  'Vũng Tàu': {
    city: 'Vũng Tàu',
    state: 'Bà Rịa - Vũng Tàu',
    country: 'Vietnam',
    latitude: 10.3460,
    longitude: 107.0843,
    attractions: ['Tượng Chúa Kitô', 'Bãi Sau', 'Bãi Trước', 'Ngọn Hải Đăng', 'Bạch Dinh']
  },
  'Đà Nẵng': {
    city: 'Đà Nẵng',
    state: 'Đà Nẵng',
    country: 'Vietnam',
    latitude: 16.0544,
    longitude: 108.2022,
    attractions: ['Cầu Rồng', 'Bà Nà Hills', 'Ngũ Hành Sơn', 'Bãi Biển Mỹ Khê', 'Bán Đảo Sơn Trà']
  },
  'Hà Nội': {
    city: 'Hà Nội',
    state: 'Hà Nội',
    country: 'Vietnam',
    latitude: 21.0285,
    longitude: 105.8542,
    attractions: ['Hồ Hoàn Kiếm', 'Phố Cổ', 'Văn Miếu', 'Lăng Bác', 'Chùa Một Cột']
  },
  'TP.HCM': {
    city: 'Thành phố Hồ Chí Minh',
    state: 'Hồ Chí Minh',
    country: 'Vietnam',
    latitude: 10.8231,
    longitude: 106.6297,
    attractions: ['Nhà Thờ Đức Bà', 'Dinh Độc Lập', 'Chợ Bến Thành', 'Phố Đi Bộ Nguyễn Huệ', 'Bitexco Tower']
  },
  'Huế': {
    city: 'Huế',
    state: 'Thừa Thiên Huế',
    country: 'Vietnam',
    latitude: 16.4637,
    longitude: 107.5909,
    attractions: ['Đại Nội', 'Lăng Khải Định', 'Chùa Thiên Mụ', 'Sông Hương', 'Lăng Tự Đức']
  }
}

// REAL property types với mô tả thật
const PROPERTY_TYPES_INFO: Record<string, {
  names: string[]
  descriptions: string[]
  priceRange: [number, number]
  capacity: [number, number]
  bedrooms: [number, number]
  images: string[]
}> = {
  VILLA: {
    names: [
      'Villa Sunset Paradise',
      'Ocean View Villa',
      'Mountain Retreat Villa',
      'Luxury Beachfront Villa',
      'Garden Villa Hideaway',
      'Modern Villa with Pool',
      'Traditional Vietnamese Villa',
      'Villa Panoramic View'
    ],
    descriptions: [
      'Villa sang trọng với hồ bơi riêng, sân vườn rộng rãi và tầm nhìn tuyệt đẹp ra biển. Phòng ngủ master có ban công riêng.',
      'Biệt thự cao cấp thiết kế hiện đại, đầy đủ tiện nghi 5 sao. Khu vực BBQ ngoài trời và phòng gym riêng.',
      'Villa phong cách Indochine với không gian mở, đồ nội thất gỗ tự nhiên và sân hiên rộng lớn.',
      'Biệt thự view núi tuyệt đẹp, có bồn jacuzzi ngoài trời, bếp đầy đủ và phòng giải trí.'
    ],
    priceRange: [3000000, 15000000],
    capacity: [6, 12],
    bedrooms: [3, 6],
    images: [
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'
    ]
  },
  APARTMENT: {
    names: [
      'Studio Cozy Downtown',
      'Modern Loft Apartment',
      'Duplex Sky View',
      'Minimalist Studio',
      'City Center Apartment',
      'Penthouse Luxury',
      'Garden View Apartment',
      'Smart Studio Tech'
    ],
    descriptions: [
      'Căn hộ studio hiện đại, vị trí trung tâm, gần chợ và bãi biển. Đầy đủ nội thất mới 100%.',
      'Căn hộ duplex view thành phố, ban công rộng, bếp mở và phòng khách thoáng đãng.',
      'Studio thiết kế tối giản, smart home, có máy giặt riêng và khu vực làm việc.',
      'Căn hộ penthouse tầng cao, view 360 độ, bếp cao cấp và phòng ngủ lớn.'
    ],
    priceRange: [500000, 2500000],
    capacity: [2, 6],
    bedrooms: [1, 3],
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800',
      'https://images.unsplash.com/photo-1574643156929-51fa098b0394?w=800'
    ]
  },
  HOUSE: {
    names: [
      'Cozy Family House',
      'Traditional House Garden',
      'Rustic Countryside Home',
      'Tropical Beach House',
      'Mountain Cabin House',
      'Urban Modern House',
      'Heritage House Restored',
      'Eco-Friendly House'
    ],
    descriptions: [
      'Nhà gia đình ấm cúng với sân vườn, bếp nấu đầy đủ và không gian chung thoải mái.',
      'Ngôi nhà truyền thống được cải tạo, giữ nguyên nét văn hóa địa phương nhưng tiện nghi hiện đại.',
      'Nhà gỗ phong cách rustic, gần thiên nhiên, có sân thượng ngắm cảnh và góc BBQ.',
      'Beach house view biển trực diện, phòng ngủ có ban công riêng và bãi đỗ xe rộng.'
    ],
    priceRange: [1200000, 4500000],
    capacity: [4, 10],
    bedrooms: [2, 5],
    images: [
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800',
      'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800',
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800'
    ]
  },
  BUNGALOW: {
    names: [
      'Beach Bungalow Paradise',
      'Garden Bungalow Hideaway',
      'Tropical Bungalow Resort',
      'Wooden Bungalow Nature',
      'Overwater Bungalow',
      'Hillside Bungalow View',
      'Eco Bungalow Retreat',
      'Luxury Bungalow Suite'
    ],
    descriptions: [
      'Bungalow gỗ giữa vườn nhiệt đới, có hồ bơi chung và bãi biển riêng cách 50m.',
      'Nhà gỗ độc lập trên núi, view toàn cảnh thung lũng, có bồn tắm ngoài trời.',
      'Bungalow trên mặt nước phong cách Maldives, có bậc thang xuống biển trực tiếp.',
      'Eco bungalow thân thiện môi trường, điện năng lượng mặt trời, vườn rau organic.'
    ],
    priceRange: [800000, 3000000],
    capacity: [2, 6],
    bedrooms: [1, 3],
    images: [
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
      'https://images.unsplash.com/photo-1544908108-f54555315640?w=800',
      'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800',
      'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'
    ]
  },
  CABIN: {
    names: [
      'Boutique Cabin Luxury',
      'Heritage Cabin Charm',
      'Modern Business Cabin',
      'Beach Retreat Cabin',
      'Mountain Lodge Cabin',
      'Urban Chic Cabin',
      'Family-Friendly Cabin',
      'Wellness Spa Cabin'
    ],
    descriptions: [
      'Cabin boutique với thiết kế độc đáo, không gian ấm cúng và view đẹp.',
      'Cabin di sản lịch sử, kiến trúc truyền thống, có khu vườn xanh mát.',
      'Cabin hiện đại với workspace ergonomic, WiFi tốc độ cao và ăn sáng miễn phí.',
      'Beach cabin với hồ bơi chung, gần biển và các hoạt động thể thao nước.'
    ],
    priceRange: [600000, 2800000],
    capacity: [2, 4],
    bedrooms: [1, 2],
    images: [
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800'
    ]
  }
}

// REAL amenities với mô tả chi tiết
const DIVERSE_AMENITIES: Record<string, Array<{ name: string, nameVi: string, icon: string, category: AmenityCategory, isPopular?: boolean }>> = {
  basic: [
    { name: 'WiFi', nameVi: 'WiFi miễn phí tốc độ cao', icon: 'Wifi', category: AmenityCategory.BASIC, isPopular: true },
    { name: 'Air conditioning', nameVi: 'Điều hòa nhiệt độ', icon: 'Wind', category: AmenityCategory.BASIC, isPopular: true },
    { name: 'TV', nameVi: 'Tivi màn hình phẳng', icon: 'Tv', category: AmenityCategory.ENTERTAINMENT },
    { name: 'Hot water', nameVi: 'Nước nóng 24/7', icon: 'Droplet', category: AmenityCategory.BASIC, isPopular: true },
    { name: 'Desk', nameVi: 'Bàn làm việc', icon: 'Desk', category: AmenityCategory.WORKSPACE },
    { name: 'Wardrobe', nameVi: 'Tủ quần áo', icon: 'Cabinet', category: AmenityCategory.BASIC }
  ],
  kitchen: [
    { name: 'Kitchen', nameVi: 'Bếp đầy đủ', icon: 'ChefHat', category: AmenityCategory.DINING, isPopular: true },
    { name: 'Refrigerator', nameVi: 'Tủ lạnh', icon: 'Refrigerator', category: AmenityCategory.DINING },
    { name: 'Microwave', nameVi: 'Lò vi sóng', icon: 'Microwave', category: AmenityCategory.DINING },
    { name: 'Coffee maker', nameVi: 'Máy pha cà phê', icon: 'Coffee', category: AmenityCategory.DINING },
    { name: 'Electric kettle', nameVi: 'Ấm đun nước', icon: 'Coffee', category: AmenityCategory.DINING },
    { name: 'Stove', nameVi: 'Bếp ga/điện', icon: 'Flame', category: AmenityCategory.DINING }
  ],
  outdoor: [
    { name: 'Private pool', nameVi: 'Hồ bơi riêng', icon: 'Waves', category: AmenityCategory.FACILITIES, isPopular: true },
    { name: 'Garden', nameVi: 'Sân vườn', icon: 'Trees', category: AmenityCategory.FACILITIES },
    { name: 'Balcony', nameVi: 'Ban công view đẹp', icon: 'Wind', category: AmenityCategory.FACILITIES },
    { name: 'BBQ area', nameVi: 'Khu BBQ', icon: 'Flame', category: AmenityCategory.FACILITIES }
  ],
  family: [
    { name: 'Crib', nameVi: 'Giường cũi', icon: 'Baby', category: AmenityCategory.FAMILY },
    { name: 'High chair', nameVi: 'Ghế ăn trẻ em', icon: 'Baby', category: AmenityCategory.FAMILY },
    { name: 'Toys', nameVi: 'Đồ chơi trẻ em', icon: 'Gamepad2', category: AmenityCategory.FAMILY }
  ],
  safety: [
    { name: 'Safe box', nameVi: 'Két sắt', icon: 'Lock', category: AmenityCategory.SAFETY },
    { name: 'Security cameras', nameVi: 'Camera an ninh', icon: 'Camera', category: AmenityCategory.SAFETY },
    { name: 'Security guard', nameVi: 'Bảo vệ 24/7', icon: 'Shield', category: AmenityCategory.SAFETY, isPopular: true },
    { name: 'Smart lock', nameVi: 'Khóa cửa thông minh', icon: 'Lock', category: AmenityCategory.SAFETY }
  ],
  luxury: [
    { name: 'Jacuzzi', nameVi: 'Jacuzzi', icon: 'Bath', category: AmenityCategory.FACILITIES, isPopular: true },
    { name: 'Sauna', nameVi: 'Sauna', icon: 'Flame', category: AmenityCategory.FACILITIES },
    { name: 'Private gym', nameVi: 'Phòng gym riêng', icon: 'Dumbbell', category: AmenityCategory.FACILITIES },
    { name: 'Wine cellar', nameVi: 'Wine cellar', icon: 'Wine', category: AmenityCategory.DINING },
    { name: 'Home theater', nameVi: 'Cinema room', icon: 'Film', category: AmenityCategory.ENTERTAINMENT }
  ],
  workspace: [
    { name: 'Dedicated workspace', nameVi: 'Bàn làm việc riêng', icon: 'Desk', category: AmenityCategory.WORKSPACE, isPopular: true },
    { name: 'Ergonomic chair', nameVi: 'Ghế ergonomic', icon: 'Armchair', category: AmenityCategory.WORKSPACE },
    { name: 'Printer', nameVi: 'Máy in/scan', icon: 'Printer', category: AmenityCategory.WORKSPACE }
  ],
  cleaning: [
    { name: 'Daily cleaning', nameVi: 'Dọn phòng hàng ngày', icon: 'Sparkles', category: AmenityCategory.LOGISTICS },
    { name: 'Free laundry', nameVi: 'Giặt là miễn phí', icon: 'WashingMachine', category: AmenityCategory.LOGISTICS }
  ]
}

async function main() {
  console.log('🌟 Starting REAL & DIVERSE data seeding...\n')

  // Clear existing data
  console.log('🗑️  Clearing old data...')
  await prisma.review.deleteMany()
  await prisma.booking.deleteMany()
  await prisma.listing.deleteMany()
  await prisma.amenity.deleteMany()
  await prisma.user.deleteMany()
  
  console.log('✅ Cleared successfully!\n')

  // Create amenities first
  console.log('✨ Creating amenities...')
  const amenityMap: Record<string, string[]> = {}
  
  for (const [category, amenities] of Object.entries(DIVERSE_AMENITIES)) {
    amenityMap[category] = []
    for (const amenity of amenities) {
      const created = await prisma.amenity.create({
        data: amenity
      })
      amenityMap[category].push(created.id)
    }
  }
  console.log(`✅ Created ${Object.values(amenityMap).flat().length} amenities\n`)

  // Create DIVERSE users with REAL Vietnamese names
  console.log('👥 Creating diverse users...')
  
  const realVietnameseNames = {
    male: ['Minh Tuấn', 'Hoàng Long', 'Đức Anh', 'Quang Huy', 'Văn Nam', 'Thành Đạt', 'Trung Kiên', 'Ngọc Sơn'],
    female: ['Thu Hà', 'Lan Anh', 'Mai Phương', 'Hồng Nhung', 'Bích Ngọc', 'Thanh Thảo', 'Kim Oanh', 'Linh Chi']
  }

  const hosts = []
  for (let i = 0; i < 15; i++) {
    const isMale = i % 2 === 0
    const names = isMale ? realVietnameseNames.male : realVietnameseNames.female
    const name = names[i % names.length]
    
    const host = await prisma.user.create({
      data: {
        email: `host${i + 1}@homestay.vn`,
        name: name,
        password: await bcrypt.hash('123456', 10),
        role: UserRole.HOST,
        phone: `09${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
        image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
        referralCode: `HOST${i + 1}${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        bio: i < 3 
          ? `Super Host với ${5 + i} năm kinh nghiệm. Phục vụ hơn ${100 + i * 50} khách hài lòng. Chuyên các khu nghỉ dưỡng cao cấp.`
          : `Chủ nhà nhiệt tình, am hiểu địa phương. Sẵn sàng tư vấn và hỗ trợ khách 24/7.`,
        isSuperHost: i < 3, // 3 super hosts
      }
    })
    hosts.push(host)
  }
  
  console.log(`✅ Created ${hosts.length} diverse hosts\n`)

  // Create REAL & DIVERSE listings
  console.log('🏠 Creating real diverse listings...')
  
  const listings = []
  let listingCount = 0
  
  // Tạo listings đa dạng cho mỗi location
  for (const [locationName, locationData] of Object.entries(REAL_LOCATIONS)) {
    // Mỗi location có 6-8 listings với property types khác nhau
    const propertyTypes = Object.keys(PROPERTY_TYPES_INFO)
    
    for (const propertyType of propertyTypes) {
      const typeInfo = PROPERTY_TYPES_INFO[propertyType as PropertyType]
      if (!typeInfo) continue
      
      const nameIndex = Math.floor(Math.random() * typeInfo.names.length)
      const descIndex = Math.floor(Math.random() * typeInfo.descriptions.length)
      
      // Random capacity và price trong range của property type
      const maxGuests = Math.floor(Math.random() * (typeInfo.capacity[1] - typeInfo.capacity[0] + 1)) + typeInfo.capacity[0]
      const bedrooms = Math.floor(Math.random() * (typeInfo.bedrooms[1] - typeInfo.bedrooms[0] + 1)) + typeInfo.bedrooms[0]
      const bathrooms = Math.max(1, Math.floor(bedrooms * 0.8))
      const basePrice = Math.floor(Math.random() * (typeInfo.priceRange[1] - typeInfo.priceRange[0])) + typeInfo.priceRange[0]
      
      // Chọn random amenities phù hợp với property type
      let amenityIds: string[] = [...amenityMap.basic]
      
      if (propertyType === 'VILLA') {
        amenityIds.push(...amenityMap.luxury)
        amenityIds.push(...amenityMap.outdoor)
      }
      
      if (propertyType === 'APARTMENT' || propertyType === 'HOUSE') {
        amenityIds.push(...amenityMap.kitchen)
        amenityIds.push(...amenityMap.workspace)
      }
      
      if (propertyType === 'BUNGALOW' || propertyType === 'CABIN') {
        amenityIds.push(...amenityMap.outdoor)
      }
      
      if (maxGuests >= 4) {
        amenityIds.push(...amenityMap.family)
      }
      
      amenityIds.push(...amenityMap.safety)
      
      // Random unique amenities
      const uniqueAmenityIds = [...new Set(amenityIds)]
      const finalAmenities = uniqueAmenityIds.slice(0, Math.min(uniqueAmenityIds.length, Math.floor(Math.random() * 5) + 10))
      
      // Chọn 5-8 hình ảnh random từ pool
      const numImages = Math.floor(Math.random() * 4) + 5
      const selectedImages: string[] = []
      const imagePool = [...typeInfo.images]
      for (let i = 0; i < numImages && imagePool.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * imagePool.length)
        selectedImages.push(imagePool[randomIndex])
        imagePool.splice(randomIndex, 1)
      }
      
      // Tạo unique slug
      const slugBase = `${typeInfo.names[nameIndex]}-${locationName}`.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
      const slug = `${slugBase}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
      
      const listing = await prisma.listing.create({
        data: {
          title: `${typeInfo.names[nameIndex]} ${locationName}`,
          slug,
          description: `${typeInfo.descriptions[descIndex]}\n\n🌟 Vị trí đắc địa tại ${locationName}\n📍 Gần các điểm tham quan: ${locationData.attractions.slice(0, 3).join(', ')}\n\n✨ Phù hợp cho: ${maxGuests <= 2 ? 'Cặp đôi, khách công tác' : maxGuests <= 4 ? 'Gia đình nhỏ, nhóm bạn' : 'Gia đình lớn, nhóm đông người'}`,
          propertyType: propertyType as PropertyType,
          roomType: bedrooms >= 2 ? RoomType.ENTIRE_PLACE : (Math.random() > 0.5 ? RoomType.ENTIRE_PLACE : RoomType.PRIVATE_ROOM),
          basePrice,
          cleaningFee: Math.floor(basePrice * 0.1),
          city: locationData.city,
          state: locationData.state,
          country: locationData.country,
          address: `${Math.floor(Math.random() * 500) + 1} Đường ${locationData.attractions[0]}, ${locationData.city}`,
          latitude: locationData.latitude + (Math.random() - 0.5) * 0.1,
          longitude: locationData.longitude + (Math.random() - 0.5) * 0.1,
          maxGuests,
          bedrooms,
          beds: bedrooms + Math.floor(Math.random() * 2),
          bathrooms,
          images: selectedImages,
          amenities: finalAmenities,
          status: ListingStatus.ACTIVE,
          hostId: hosts[Math.floor(Math.random() * hosts.length)].id,
          instantBookable: Math.random() > 0.5,
          minNights: Math.floor(Math.random() * 2) + 1,
          maxNights: Math.floor(Math.random() * 20) + 10,
        }
      })
      
      listings.push(listing)
      listingCount++
      
      if (listingCount % 10 === 0) {
        console.log(`  📝 Created ${listingCount} listings...`)
      }
    }
  }
  
  console.log(`✅ Created ${listings.length} diverse listings across ${Object.keys(REAL_LOCATIONS).length} locations\n`)

  // Create guests
  console.log('👤 Creating guest users...')
  const guests = []
  const guestNames = [
    'Nguyễn Văn An', 'Trần Thị Bình', 'Lê Minh Châu', 'Phạm Thu Dung', 
    'Hoàng Văn Em', 'Đỗ Thị Phương', 'Vũ Quang Giang', 'Bùi Thị Hà',
    'Đặng Văn Hùng', 'Ngô Thị Lan', 'Dương Văn Khoa', 'Lý Thị Mai'
  ]
  
  for (let i = 0; i < guestNames.length; i++) {
    const guest = await prisma.user.create({
      data: {
        email: `guest${i + 1}@email.vn`,
        name: guestNames[i],
        password: await bcrypt.hash('123456', 10),
        role: UserRole.GUEST,
        phone: `09${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
        image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${guestNames[i]}`,
        referralCode: `GUEST${i + 1}${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      }
    })
    guests.push(guest)
  }
  
  console.log(`✅ Created ${guests.length} guests\n`)

  // Create DIVERSE bookings
  console.log('📅 Creating diverse bookings...')
  const bookings = []
  const statuses = [BookingStatus.CONFIRMED, BookingStatus.COMPLETED, BookingStatus.PENDING]
  
  for (let i = 0; i < 100; i++) {
    const listing = listings[Math.floor(Math.random() * listings.length)]
    const guest = guests[Math.floor(Math.random() * guests.length)]
    
    const checkIn = new Date()
    checkIn.setDate(checkIn.getDate() + Math.floor(Math.random() * 60) - 30) // -30 to +30 days
    
    const nights = Math.floor(Math.random() * 6) + 2 // 2-7 nights
    const checkOut = new Date(checkIn)
    checkOut.setDate(checkOut.getDate() + nights)
    
    const totalGuests = Math.min(listing.maxGuests, Math.floor(Math.random() * 4) + 1)
    const totalPrice = listing.basePrice * nights + (listing.cleaningFee || 0)
    const serviceFee = Math.floor(totalPrice * 0.10)
    
    const booking = await prisma.booking.create({
      data: {
        listingId: listing.id,
        guestId: guest.id,
        hostId: listing.hostId,
        checkIn,
        checkOut,
        nights,
        adults: totalGuests,
        children: 0,
        totalPrice: totalPrice + serviceFee,
        basePrice: listing.basePrice * nights,
        cleaningFee: listing.cleaningFee || 0,
        serviceFee,
        currency: 'VND',
        status: statuses[Math.floor(Math.random() * statuses.length)],
      }
    })
    
    bookings.push(booking)
  }
  
  console.log(`✅ Created ${bookings.length} bookings\n`)

  // Create DIVERSE reviews
  console.log('⭐ Creating diverse reviews...')
  const reviewComments = [
    'Chỗ nghỉ tuyệt vời! Chủ nhà rất nhiệt tình và chu đáo. Vị trí thuận tiện, gần các điểm tham quan.',
    'Không gian sạch sẽ, thoáng mát. View đẹp, giá cả hợp lý. Sẽ quay lại lần sau!',
    'Homestay rất đáng giá tiền. Tiện nghi đầy đủ, WiFi nhanh. Chủ nhà dễ thương.',
    'Nơi nghỉ ngơi lý tưởng cho gia đình. Trẻ em rất thích. Bếp đầy đủ đồ dùng.',
    'Check-in nhanh gọn, phòng đúng như hình. Yên tĩnh, riêng tư. Highly recommended!',
    'Trải nghiệm tuyệt vời! Cảnh đẹp, không khí trong lành. Phù hợp để nghỉ dưỡng.',
    'Chỗ ở sạch sẽ, giường êm ái. Điều hòa mát, nước nóng tốt. Giá tốt!',
    'Vị trí đẹp, gần biển. Chủ nhà support nhiệt tình, giới thiệu nhiều quán ăn ngon.'
  ]
  
  const completedBookings = bookings.filter(b => b.status === BookingStatus.COMPLETED)
  
  for (const booking of completedBookings) {
    if (Math.random() > 0.3) { // 70% có review
      const overallRating = Math.floor(Math.random() * 2) + 4 // 4-5 stars
      
      await prisma.review.create({
        data: {
          bookingId: booking.id,
          listingId: booking.listingId,
          reviewerId: booking.guestId,
          revieweeId: booking.hostId,
          type: 'GUEST_TO_HOST',
          overallRating,
          cleanlinessRating: Math.max(3, overallRating + Math.floor(Math.random() * 2) - 1),
          accuracyRating: Math.max(3, overallRating + Math.floor(Math.random() * 2) - 1),
          checkInRating: Math.max(3, overallRating + Math.floor(Math.random() * 2) - 1),
          communicationRating: Math.max(3, overallRating + Math.floor(Math.random() * 2) - 1),
          locationRating: Math.max(3, overallRating + Math.floor(Math.random() * 2) - 1),
          valueRating: Math.max(3, overallRating + Math.floor(Math.random() * 2) - 1),
          comment: reviewComments[Math.floor(Math.random() * reviewComments.length)],
          isVerified: true,
        }
      })
    }
  }
  
  console.log(`✅ Created reviews\n`)

  console.log('✨ Seeding completed successfully!')
  console.log(`📊 Summary:`)
  console.log(`   - Hosts: ${hosts.length}`)
  console.log(`   - Guests: ${guests.length}`)
  console.log(`   - Listings: ${listings.length} (across ${Object.keys(REAL_LOCATIONS).length} locations)`)
  console.log(`   - Bookings: ${bookings.length}`)
  console.log(`   - Reviews: ${completedBookings.length * 0.7} (estimated)`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
