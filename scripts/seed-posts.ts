import { PrismaClient, PostStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function seedPosts() {
  console.log('🌱 Seeding community posts...')

  // Get a few users and listings to reference
  const users = await prisma.user.findMany({ take: 5 })
  const listings = await prisma.listing.findMany({ take: 10 })

  if (users.length === 0 || listings.length === 0) {
    console.log('⚠️  No users or listings found. Please seed users and listings first.')
    return
  }

  const postsData = [
    {
      authorId: users[0].id,
      content: 'Vừa trải qua 3 ngày tuyệt vời tại homestay này ở Đà Lạt! View núi đẹp không thể tin được, sáng nào cũng thức dậy trong tiếng chim hót. Chủ nhà rất nhiệt tình và chu đáo. Sẽ quay lại lần sau! 🏔️💚',
      media: [
        {
          type: 'image',
          url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
        },
        {
          type: 'image',
          url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
        },
      ],
      listingId: listings[0]?.id,
      location: 'Đà Lạt, Lâm Đồng',
      status: PostStatus.ACTIVE,
      isPublic: true,
    },
    {
      authorId: users[1].id,
      content: 'Workation vibe ở Đà Nẵng quá chill! WiFi nhanh, view biển, cafe ngon. Làm việc remote chưa bao giờ productive đến thế 💻🌊\n\nTips cho ai muốn workation:\n- Chọn homestay có workspace riêng\n- Check WiFi speed trước khi book\n- Gần quán cafe để đổi không khí\n- Book dài hạn để giá tốt hơn',
      media: [
        {
          type: 'image',
          url: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800',
        },
      ],
      location: 'Đà Nẵng',
      status: PostStatus.ACTIVE,
      isPublic: true,
    },
    {
      authorId: users[2].id,
      content: 'Kỳ nghỉ gia đình tại Phú Quốc! Các bé mê biển lắm 🏖️👨‍👩‍👧‍👦 Homestay rộng rãi, an toàn cho trẻ em, còn có hồ bơi riêng nữa. Highly recommended cho gia đình có con nhỏ!',
      media: [
        {
          type: 'image',
          url: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
        },
        {
          type: 'image',
          url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
        },
      ],
      listingId: listings[1]?.id,
      location: 'Phú Quốc, Kiên Giang',
      status: PostStatus.ACTIVE,
      isPublic: true,
    },
    {
      authorId: users[3].id,
      content: 'Romantic getaway đúng nghĩa! Homestay này perfect cho couples muốn có không gian riêng tư. Jacuzzi với view núi, candlelight dinner do chủ nhà chuẩn bị... Everything was magical ✨💕',
      media: [
        {
          type: 'image',
          url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800',
        },
      ],
      location: 'Đà Lạt',
      status: PostStatus.ACTIVE,
      isPublic: true,
    },
    {
      authorId: users[4].id,
      content: 'Sa Pa trong mùa lúa chín đẹp như tranh vẽ! 🌾 Mọi người nên đến vào tháng 9-10 để thấy ruộng bậc thang vàng rực. Homestay của người dân tộc H\'Mông rất đáng để trải nghiệm, được ăn những món ăn truyền thống và nghe câu chuyện về văn hóa địa phương.',
      media: [
        {
          type: 'image',
          url: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800',
        },
      ],
      location: 'Sa Pa, Lào Cai',
      status: PostStatus.ACTIVE,
      isPublic: true,
    },
  ]

  for (const postData of postsData) {
    await prisma.post.create({
      data: postData,
    })
  }

  console.log(`✅ Created ${postsData.length} sample posts`)
}

seedPosts()
  .catch((e) => {
    console.error('Error seeding posts:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
