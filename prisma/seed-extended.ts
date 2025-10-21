import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { getPropertyImages, calculateMarketPrice } from '../lib/unsplash-images'

const prisma = new PrismaClient()

// Vietnam locations data
const locations = [
  { city: 'Nha Trang', state: 'Khánh Hòa', lat: 12.2388, lng: 109.1967 },
  { city: 'Đà Lạt', state: 'Lâm Đồng', lat: 11.9404, lng: 108.4583 },
  { city: 'Phú Quốc', state: 'Kiên Giang', lat: 10.2222, lng: 103.9676 },
  { city: 'Quận 1', state: 'TP. Hồ Chí Minh', lat: 10.7756, lng: 106.7019 },
  { city: 'Hội An', state: 'Quảng Nam', lat: 15.8801, lng: 108.338 },
  { city: 'Tây Hồ', state: 'Hà Nội', lat: 21.0552, lng: 105.8164 },
  { city: 'Mũi Né', state: 'Bình Thuận', lat: 10.9333, lng: 108.2833 },
  { city: 'Cần Thơ', state: 'Cần Thơ', lat: 10.0452, lng: 105.7469 },
  { city: 'Vũng Tàu', state: 'Bà Rịa - Vũng Tàu', lat: 10.3459, lng: 107.0842 },
  { city: 'Sapa', state: 'Lào Cai', lat: 22.3364, lng: 103.8438 },
  { city: 'Hạ Long', state: 'Quảng Ninh', lat: 20.9503, lng: 107.0833 },
  { city: 'Đà Nẵng', state: 'Đà Nẵng', lat: 16.0544, lng: 108.2022 },
  { city: 'Huế', state: 'Thừa Thiên Huế', lat: 16.4637, lng: 107.5909 },
  { city: 'Quy Nhơn', state: 'Bình Định', lat: 13.7829, lng: 109.2196 },
  { city: 'Cát Bà', state: 'Hải Phòng', lat: 20.7279, lng: 107.0447 },
]

const propertyTypes = ['APARTMENT', 'HOUSE', 'VILLA', 'CONDO', 'BUNGALOW', 'CABIN', 'FARM_STAY'] as const
const roomTypes = ['ENTIRE_PLACE', 'PRIVATE_ROOM', 'SHARED_ROOM'] as const

const amenities = [
  'Wifi', 'Bếp', 'Máy giặt', 'Điều hòa', 'TV', 'Bàn làm việc',
  'Hồ bơi', 'Bãi đậu xe miễn phí', 'Gym', 'Ban công/Sân thượng',
  'BBQ', 'Vườn', 'View biển', 'View núi', 'Gần bãi biển',
  'Thang máy', 'Dụng cụ nấu ăn', 'Máy sấy tóc', 'Két sắt',
  'Camera an ninh', 'Bảo vệ 24/7', 'Nhà hàng', 'Spa', 'Phòng xông hơi'
]

const listingTitles = [
  'Villa sang trọng view biển',
  'Căn hộ hiện đại trung tâm',
  'Homestay ấm cúng',
  'Biệt thự vườn yên tĩnh',
  'Penthouse cao cấp',
  'Studio tiện nghi',
  'Nhà gỗ truyền thống',
  'Bungalow bãi biển',
  'Condo view sông',
  'Farmstay sinh thái',
]

function randomElement<T>(array: readonly T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomPrice(): number {
  const prices = [500000, 800000, 1000000, 1200000, 1500000, 1800000, 2000000, 2500000, 3000000, 3500000, 4000000, 5000000, 8000000, 10000000]
  return randomElement(prices)
}

async function main() {
  console.log('🌱 Starting extended database seeding...')

  // Create additional users (20 hosts, 30 guests)
  console.log('👥 Creating users...')
  
  const hashedPassword = await bcrypt.hash('password123', 10)
  const hosts: any[] = []
  const guests: any[] = []

  // Create 20 hosts
  for (let i = 1; i <= 20; i++) {
    const host = await prisma.user.upsert({
      where: { email: `host${i}@luxestay.com` },
      update: {},
      create: {
        email: `host${i}@luxestay.com`,
        name: `Host ${i}`,
        password: hashedPassword,
        role: 'HOST',
        isHost: true,
        isSuperHost: i <= 5, // First 5 are super hosts
        emailVerified: new Date(),
        phone: `090${String(i).padStart(7, '0')}`,
        image: `https://api.dicebear.com/7.x/avataaars/svg?seed=host${i}`,
        bio: `Chủ nhà với ${randomNumber(1, 10)} năm kinh nghiệm`,
        referralCode: `HOST${i}`,
        loyaltyPoints: randomNumber(0, 5000),
      }
    })
    hosts.push(host)
  }

  // Create 30 guests
  for (let i = 1; i <= 30; i++) {
    const guest = await prisma.user.upsert({
      where: { email: `guest${i}@luxestay.com` },
      update: {},
      create: {
        email: `guest${i}@luxestay.com`,
        name: `Guest ${i}`,
        password: hashedPassword,
        role: 'GUEST',
        emailVerified: new Date(),
        phone: `091${String(i).padStart(7, '0')}`,
        image: `https://api.dicebear.com/7.x/avataaars/svg?seed=guest${i}`,
        referralCode: `GUEST${i}`,
        loyaltyPoints: randomNumber(0, 3000),
      }
    })
    guests.push(guest)
  }

  console.log(`✅ Created ${hosts.length} hosts and ${guests.length} guests`)

  // Create 60 listings
  console.log('🏠 Creating listings...')
  const listings: any[] = []

  for (let i = 1; i <= 60; i++) {
    const location = randomElement(locations)
    const propertyType = randomElement(propertyTypes)
    const roomType = randomElement(roomTypes)
    const title = `${randomElement(listingTitles)} ${location.city}`
    const slug = `${title.toLowerCase().replace(/\s+/g, '-')}-${i}`
    const host = randomElement(hosts)
    
    const bedrooms = randomNumber(1, 6)
    const beds = bedrooms + randomNumber(0, 2)
    const bathrooms = randomNumber(1, Math.ceil(bedrooms / 2))
    const maxGuests = bedrooms * 2 + randomNumber(0, 2)
    const rating = (Math.random() * (5 - 4) + 4).toFixed(1)
    const reviewsCount = randomNumber(5, 200)
    const bookingsCount = randomNumber(10, 300)

    // Use ML-based pricing
    const basePrice = calculateMarketPrice(
      propertyType,
      bedrooms,
      location.city,
      parseFloat(rating),
      i <= 10
    )

    // Get real images based on property type and location
    const images = getPropertyImages(propertyType, location.city, 5)

    const listing = await prisma.listing.create({
      data: {
        title,
        slug,
        description: `${title} với đầy đủ tiện nghi hiện đại. Không gian rộng rãi, thoáng mát, view đẹp. Phù hợp cho gia đình, nhóm bạn. Gần các điểm du lịch nổi tiếng.`,
        hostId: host.id,
        propertyType,
        roomType,
        maxGuests,
        bedrooms,
        beds,
        bathrooms,
        country: 'Vietnam',
        city: location.city,
        state: location.state,
        address: `${randomNumber(1, 500)} Đường ${randomNumber(1, 100)}, ${location.city}`,
        latitude: location.lat + (Math.random() - 0.5) * 0.1,
        longitude: location.lng + (Math.random() - 0.5) * 0.1,
        basePrice,
        cleaningFee: Math.round(basePrice * 0.15),
        currency: 'VND',
        images,
        amenities: [], // Will be populated later with Amenity records
        status: 'ACTIVE',
        cancellationPolicy: randomElement(['FLEXIBLE', 'MODERATE', 'STRICT']),
        averageRating: parseFloat(rating),
        totalReviews: reviewsCount,
        totalBookings: bookingsCount,
        featured: i <= 10, // First 10 are featured
      }
    })
    listings.push(listing)
  }

  console.log(`✅ Created ${listings.length} listings`)

  // Create 150 bookings
  console.log('📅 Creating bookings...')
  const bookings: any[] = []

  for (let i = 1; i <= 150; i++) {
    const listing = randomElement(listings)
    const guest = randomElement(guests)
    
    const now = new Date()
    const daysAgo = randomNumber(1, 365)
    const checkIn = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
    const nights = randomNumber(2, 14)
    const checkOut = new Date(checkIn.getTime() + nights * 24 * 60 * 60 * 1000)
    
    const adults = randomNumber(1, listing.maxGuests)
    const children = randomNumber(0, Math.min(2, listing.maxGuests - adults))
    
    const basePrice = listing.basePrice * nights
    const cleaningFee = listing.cleaningFee
    const serviceFee = Math.round(basePrice * 0.12)
    const totalPrice = basePrice + cleaningFee + serviceFee

    const statuses: Array<'COMPLETED' | 'PENDING' | 'CONFIRMED'> = ['COMPLETED', 'COMPLETED', 'COMPLETED', 'PENDING', 'CONFIRMED']
    const status = randomElement(statuses)

    const booking = await prisma.booking.create({
      data: {
        listingId: listing.id,
        guestId: guest.id,
        hostId: listing.hostId,
        checkIn,
        checkOut,
        adults,
        children,
        infants: 0,
        pets: 0,
        nights,
        basePrice,
        cleaningFee,
        serviceFee,
        totalPrice,
        status,
      }
    })
    bookings.push(booking)
  }

  console.log(`✅ Created ${bookings.length} bookings`)

  // Create 200+ reviews
  console.log('⭐ Creating reviews...')
  const reviews: any[] = []

  const reviewComments = [
    'Nơi ở tuyệt vời, sạch sẽ và thoải mái!',
    'Chủ nhà rất thân thiện và nhiệt tình.',
    'Vị trí thuận tiện, gần nhiều địa điểm du lịch.',
    'Không gian đẹp, view tuyệt vời!',
    'Đúng như mô tả, rất hài lòng.',
    'Sẽ quay lại lần sau!',
    'Giá cả hợp lý, đáng đồng tiền.',
    'Tiện nghi đầy đủ, hiện đại.',
    'Trải nghiệm tuyệt vời cùng gia đình.',
    'Highly recommended!',
  ]

  const completedBookings = bookings.filter(b => b.status === 'COMPLETED')
  
  for (const booking of completedBookings) {
    const overallRating = randomNumber(8, 10) / 2 // 4.0 - 5.0
    
    const review = await prisma.review.create({
      data: {
        bookingId: booking.id,
        listingId: booking.listingId,
        reviewerId: booking.guestId,
        revieweeId: booking.hostId,
        type: 'GUEST_TO_HOST',
        overallRating,
        cleanlinessRating: randomNumber(8, 10) / 2,
        accuracyRating: randomNumber(8, 10) / 2,
        checkInRating: randomNumber(8, 10) / 2,
        communicationRating: randomNumber(8, 10) / 2,
        locationRating: randomNumber(8, 10) / 2,
        valueRating: randomNumber(8, 10) / 2,
        comment: randomElement(reviewComments),
      }
    })
    reviews.push(review)
  }

  console.log(`✅ Created ${reviews.length} reviews`)

  console.log('🎉 Extended database seeding completed!')
  console.log('')
  console.log('📊 Summary:')
  console.log(`- Users: ${hosts.length + guests.length} (${hosts.length} hosts + ${guests.length} guests)`)
  console.log(`- Listings: ${listings.length}`)
  console.log(`- Bookings: ${bookings.length}`)
  console.log(`- Reviews: ${reviews.length}`)
  console.log('')
  console.log('✨ Featured Listings (Top 10):')
  const featuredListings = listings.filter(l => l.isFeatured).slice(0, 5)
  featuredListings.forEach(l => {
    console.log(`  • ${l.title} (${l.averageRating}⭐)`)
  })
  console.log('')
  console.log('✅ All done! Use login: host1@luxestay.com / guest1@luxestay.com with password: password123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
