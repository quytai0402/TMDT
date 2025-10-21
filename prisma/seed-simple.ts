import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting simple seed (no transactions)...')

  // Skip cleaning - MongoDB standalone doesn't support it
  // Just create new data
  
  console.log('👥 Creating users...')
  
  const hashedPassword = await bcrypt.hash('password123', 10)

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@homestay.com',
      password: hashedPassword,
      role: 'ADMIN',
      emailVerified: new Date(),
      phone: '0900000000',
    },
  })
  console.log('✅ Created admin:', admin.email)

  // Create host user
  const host1 = await prisma.user.create({
    data: {
      name: 'Nguyễn Văn A',
      email: 'host1@homestay.com',
      password: hashedPassword,
      role: 'HOST',
      emailVerified: new Date(),
      phone: '0901234567',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=host1',
    },
  })
  console.log('✅ Created host:', host1.email)

  const host2 = await prisma.user.create({
    data: {
      name: 'Trần Thị B',
      email: 'host2@homestay.com',
      password: hashedPassword,
      role: 'HOST',
      emailVerified: new Date(),
      phone: '0912345678',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=host2',
    },
  })
  console.log('✅ Created host:', host2.email)

  // Create guest users
  const guest1 = await prisma.user.create({
    data: {
      name: 'Lê Văn C',
      email: 'guest1@homestay.com',
      password: hashedPassword,
      role: 'GUEST',
      emailVerified: new Date(),
      phone: '0923456789',
    },
  })
  console.log('✅ Created guest:', guest1.email)

  console.log('🏠 Creating listings...')

  // Listing 1
  const listing1 = await prisma.listing.create({
    data: {
      title: 'Villa sang trọng view biển Nha Trang',
      slug: 'villa-sang-trong-view-bien-nha-trang',
      description: 'Villa đẹp với view biển tuyệt vời, phù hợp cho gia đình và nhóm bạn. Đầy đủ tiện nghi cao cấp.',
      propertyType: 'VILLA',
      hostId: host1.id,
      
      // Location
      country: 'Việt Nam',
      city: 'Nha Trang',
      address: '123 Trần Phú, Nha Trang',
      latitude: 12.2388,
      longitude: 109.1967,
      
      // Capacity
      maxGuests: 8,
      bedrooms: 4,
      beds: 5,
      bathrooms: 3,
      
      // Pricing
      basePrice: 3500000,
      currency: 'VND',
      cleaningFee: 500000,
      
      // Amenities
      amenities: ['Wifi', 'Bể bơi', 'Điều hòa', 'Bếp', 'Bãi đỗ xe', 'View biển'],
      
      // Images
      images: [
        'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800',
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
        'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
      ],
      coverImage: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800',
      
      // Status
      status: 'ACTIVE',
      isInstantBook: true,
      
      // Stats
      averageRating: 4.9,
      totalReviews: 127,
      totalBookings: 45,
    },
  })
  console.log('✅ Created listing:', listing1.title)

  // Listing 2
  const listing2 = await prisma.listing.create({
    data: {
      title: 'Căn hộ hiện đại trung tâm Hà Nội',
      slug: 'can-ho-hien-dai-trung-tam-ha-noi',
      description: 'Căn hộ 2 phòng ngủ, nội thất hiện đại, gần Hồ Gươm. Thuận tiện đi lại và mua sắm.',
      propertyType: 'APARTMENT',
      hostId: host2.id,
      
      // Location
      country: 'Việt Nam',
      city: 'Hà Nội',
      address: '456 Hoàn Kiếm, Hà Nội',
      latitude: 21.0285,
      longitude: 105.8542,
      
      // Capacity
      maxGuests: 4,
      bedrooms: 2,
      beds: 2,
      bathrooms: 1,
      
      // Pricing
      basePrice: 1200000,
      currency: 'VND',
      cleaningFee: 200000,
      
      // Amenities
      amenities: ['Wifi', 'Điều hòa', 'Tivi', 'Máy giặt', 'Thang máy'],
      
      // Images
      images: [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      ],
      coverImage: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      
      // Status
      status: 'PUBLISHED',
      isInstantBook: true,
      
      // Stats
      averageRating: 4.7,
      totalReviews: 89,
      totalBookings: 34,
    },
  })
  console.log('✅ Created listing:', listing2.title)

  // Listing 3
  const listing3 = await prisma.listing.create({
    data: {
      title: 'Nhà vườn yên tĩnh Đà Lạt',
      slug: 'nha-vuon-yen-tinh-da-lat',
      description: 'Nhà vườn không gian xanh mát, view đồi núi. Thích hợp cho những ai muốn nghỉ ngơi thư giãn.',
      propertyType: 'HOUSE',
      hostId: host1.id,
      
      // Location
      country: 'Việt Nam',
      city: 'Đà Lạt',
      address: '789 Trần Hưng Đạo, Đà Lạt',
      latitude: 11.9404,
      longitude: 108.4583,
      
      // Capacity
      maxGuests: 6,
      bedrooms: 3,
      beds: 4,
      bathrooms: 2,
      
      // Pricing
      basePrice: 1800000,
      currency: 'VND',
      cleaningFee: 300000,
      
      // Amenities
      amenities: ['Wifi', 'Lò sưởi', 'Sân vườn', 'BBQ', 'Bãi đỗ xe', 'View núi'],
      
      // Images
      images: [
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
      ],
      coverImage: 'https://images.unsplash.com/photo-600585154340-be6161a56a0c?w=800',
      
      // Status
      status: 'PUBLISHED',
      isInstantBook: false,
      
      // Stats
      averageRating: 4.8,
      totalReviews: 56,
      totalBookings: 28,
    },
  })
  console.log('✅ Created listing:', listing3.title)

  console.log('📊 Creating sample bookings...')
  
  const booking1 = await prisma.booking.create({
    data: {
      listingId: listing1.id,
      guestId: guest1.id,
      hostId: host1.id,
      
      checkIn: new Date('2025-11-01'),
      checkOut: new Date('2025-11-04'),
      nights: 3,
      adults: 4,
      
      basePrice: listing1.basePrice,
      cleaningFee: listing1.cleaningFee || 0,
      totalPrice: (listing1.basePrice * 3) + (listing1.cleaningFee || 0),
      
      status: 'CONFIRMED',
      instantBook: true,
    },
  })
  console.log('✅ Created booking for guest:', guest1.name)

  console.log('⭐ Creating sample reviews...')
  
  const review1 = await prisma.review.create({
    data: {
      listingId: listing1.id,
      bookingId: booking1.id,
      reviewerId: guest1.id,
      revieweeId: host1.id,
      
      type: 'GUEST_TO_HOST',
      
      overallRating: 5.0,
      cleanlinessRating: 5.0,
      accuracyRating: 5.0,
      checkInRating: 4.5,
      communicationRating: 5.0,
      locationRating: 5.0,
      valueRating: 4.5,
      
      comment: 'Villa tuyệt vời! View biển đẹp, phòng rộng rãi và sạch sẽ. Chủ nhà rất nhiệt tình và chu đáo. Chắc chắn sẽ quay lại!',
      
      isVerified: true,
    },
  })
  console.log('✅ Created review for:', listing1.title)

  console.log('\n✅ Seed completed successfully!')
  console.log('\n📊 Summary:')
  console.log('- Users:', 4)
  console.log('- Listings:', 3)
  console.log('- Bookings:', 1)
  console.log('- Reviews:', 1)
  console.log('\n🔐 Test accounts:')
  console.log('Admin: admin@homestay.com / password123')
  console.log('Host: host1@homestay.com / password123')
  console.log('Guest: guest1@homestay.com / password123')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
