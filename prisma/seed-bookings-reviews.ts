import { PrismaClient, BookingStatus } from '@prisma/client'

const prisma = new PrismaClient()

console.log('📅 Creating additional bookings and reviews...\n')

async function main() {
  const guests = await prisma.user.findMany({ where: { role: 'GUEST' }})
  const listings = await prisma.listing.findMany({ take: 150 })
  
  console.log(`   - Found ${guests.length} guests`)
  console.log(`   - Found ${listings.length} listings`)
  
  if (guests.length === 0) {
    console.log('❌ No guests found!')
    return
  }

  let bookingsCreated = 0
  let reviewsCreated = 0
  
  // Create 2-3 bookings per listing (300-450 bookings)
  for (const listing of listings) {
    const numBookings = Math.floor(Math.random() * 2) + 2 // 2-3 bookings per listing
    
    for (let i = 0; i < numBookings; i++) {
      const guest = guests[Math.floor(Math.random() * guests.length)]
      
      // Random dates
      const daysFromNow = Math.floor(Math.random() * 120) - 60 // -60 to +60 days
      const checkIn = new Date()
      checkIn.setDate(checkIn.getDate() + daysFromNow)
      
      const nights = Math.floor(Math.random() * 6) + 2 // 2-7 nights
      const checkOut = new Date(checkIn)
      checkOut.setDate(checkOut.getDate() + nights)
      
      const adults = Math.min(listing.maxGuests, Math.floor(Math.random() * 4) + 1)
      const totalPrice = listing.basePrice * nights + (listing.cleaningFee || 0)
      const serviceFee = Math.floor(totalPrice * 0.10)
      
      // Status based on date
      let status: BookingStatus
      if (daysFromNow < -7) status = BookingStatus.COMPLETED
      else if (daysFromNow < 0) status = BookingStatus.CONFIRMED
      else status = Math.random() > 0.3 ? BookingStatus.CONFIRMED : BookingStatus.PENDING
      
      const booking = await prisma.booking.create({
        data: {
          listingId: listing.id,
          guestId: guest.id,
          hostId: listing.hostId,
          checkIn,
          checkOut,
          nights,
          adults,
          children: 0,
          totalPrice: totalPrice + serviceFee,
          basePrice: listing.basePrice * nights,
          cleaningFee: listing.cleaningFee || 0,
          serviceFee,
          currency: 'VND',
          status,
        }
      })
      
      bookingsCreated++
      
      // Create reviews for completed bookings (70% chance)
      if (status === BookingStatus.COMPLETED && Math.random() > 0.3) {
        const overallRating = Math.floor(Math.random() * 2) + 4 // 4-5 stars
        
        const vietnameseComments = [
          'Chỗ nghỉ tuyệt vời! Chủ nhà rất nhiệt tình và chu đáo.',
          'Không gian sạch sẽ, view đẹp. Sẽ quay lại lần sau!',
          'Homestay đáng giá tiền. WiFi nhanh, vị trí thuận tiện.',
          'Trải nghiệm tuyệt vời! Phòng đẹp, giường êm ái.',
          'Check-in nhanh gọn, chủ nhà dễ thương. Highly recommended!',
          'Vị trí đẹp, gần nhiều điểm tham quan. Very satisfied!',
          'Perfect stay! Clean, comfortable và value for money.',
          'Amazing place! Host is super helpful and friendly.',
        ]
        
        await prisma.review.create({
          data: {
            bookingId: booking.id,
            listingId: listing.id,
            reviewerId: guest.id,
            revieweeId: listing.hostId,
            type: 'GUEST_TO_HOST',
            overallRating,
            cleanlinessRating: Math.max(3, overallRating + Math.floor(Math.random() * 2) - 1),
            accuracyRating: Math.max(3, overallRating + Math.floor(Math.random() * 2) - 1),
            checkInRating: Math.max(3, overallRating + Math.floor(Math.random() * 2) - 1),
            communicationRating: Math.max(3, overallRating + Math.floor(Math.random() * 2) - 1),
            locationRating: Math.max(3, overallRating + Math.floor(Math.random() * 2) - 1),
            valueRating: Math.max(3, overallRating + Math.floor(Math.random() * 2) - 1),
            comment: vietnameseComments[Math.floor(Math.random() * vietnameseComments.length)],
          }
        })
        
        reviewsCreated++
      }
    }
    
    if (bookingsCreated % 50 === 0) {
      console.log(`   ✅ Created ${bookingsCreated} bookings, ${reviewsCreated} reviews...`)
    }
  }

  console.log(`\n✨ Successfully created:`)
  console.log(`   - ${bookingsCreated} bookings`)
  console.log(`   - ${reviewsCreated} reviews`)
  console.log(`🎉 Database fully populated!\n`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
