import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const locations = [
  {
    city: 'Hà Nội',
    state: 'Hà Nội',
    country: 'Vietnam',
    latitude: 21.0285,
    longitude: 105.8542,
    description: 'Thủ đô của Việt Nam, nổi tiếng với lịch sử hàng nghìn năm tuổi, Hồ Gươm, Phố Cổ và văn hóa ẩm thực đa dạng.',
    imageUrl: 'https://images.unsplash.com/photo-1569928864548-006b2e852ae5?w=800',
  },
  {
    city: 'Thành phố Hồ Chí Minh',
    state: 'Hồ Chí Minh',
    country: 'Vietnam',
    latitude: 10.8231,
    longitude: 106.6297,
    description: 'Thành phố lớn nhất Việt Nam, trung tâm kinh tế, văn hóa và giáo dục, nổi tiếng với đời sống năng động và hiện đại.',
    imageUrl: 'https://images.unsplash.com/photo-1583417267826-aebc4d1542e1?w=800',
  },
  {
    city: 'Đà Nẵng',
    state: 'Đà Nẵng',
    country: 'Vietnam',
    latitude: 16.0544,
    longitude: 108.2022,
    description: 'Thành phố biển miền Trung, có Cầu Rồng, Bà Nà Hills, và những bãi biển đẹp nhất Việt Nam như Mỹ Khê, Non Nước.',
    imageUrl: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800',
  },
  {
    city: 'Đà Lạt',
    state: 'Lâm Đồng',
    country: 'Vietnam',
    latitude: 11.9404,
    longitude: 108.4583,
    description: 'Thành phố ngàn hoa với khí hậu mát mẻ quanh năm, nổi tiếng với Hồ Xuân Hương, Valley of Love và kiến trúc Pháp cổ.',
    imageUrl: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800',
  },
  {
    city: 'Nha Trang',
    state: 'Khánh Hòa',
    country: 'Vietnam',
    latitude: 12.2388,
    longitude: 109.1967,
    description: 'Thành phố biển xinh đẹp với bãi tắm dài, Vinpearl, Tháp Bà Ponagar và các hoạt động lặn biển hấp dẫn.',
    imageUrl: 'https://images.unsplash.com/photo-1583417205818-fda8205ce3d9?w=800',
  },
  {
    city: 'Hội An',
    state: 'Quảng Nam',
    country: 'Vietnam',
    latitude: 15.8801,
    longitude: 108.3380,
    description: 'Phố cổ Di sản Thế giới với đèn lồng rực rỡ, Chùa Cầu, và nền ẩm thực đa dạng. Lý tưởng cho du lịch văn hóa.',
    imageUrl: 'https://images.unsplash.com/photo-1557750255-c76072a7aad1?w=800',
  },
  {
    city: 'Phú Quốc',
    state: 'Kiên Giang',
    country: 'Vietnam',
    latitude: 10.2899,
    longitude: 103.9840,
    description: 'Đảo Ngọc với bãi biển hoang sơ, Vinpearl Safari, chợ đêm sầm uất và hải sản tươi ngon. Thiên đường nghỉ dưỡng.',
    imageUrl: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800',
  },
  {
    city: 'Huế',
    state: 'Thừa Thiên Huế',
    country: 'Vietnam',
    latitude: 16.4637,
    longitude: 107.5909,
    description: 'Cố đô Việt Nam với Đại Nội, lăng tẩm các vua Nguyễn, sông Hương thơ mộng và ẩm thực cung đình độc đáo.',
    imageUrl: 'https://images.unsplash.com/photo-1572979860689-3dd21d7bbd4d?w=800',
  },
  {
    city: 'Sa Pa',
    state: 'Lào Cai',
    country: 'Vietnam',
    latitude: 22.3364,
    longitude: 103.8438,
    description: 'Thị trấn miền núi với ruộng bậc thang tuyệt đẹp, Fansipan - nóc nhà Đông Dương, và văn hóa dân tộc thiểu số.',
    imageUrl: 'https://images.unsplash.com/photo-1559592213-9f59d2cc7b5e?w=800',
  },
  {
    city: 'Vũng Tàu',
    state: 'Bà Rịa - Vũng Tàu',
    country: 'Vietnam',
    latitude: 10.3460,
    longitude: 107.0843,
    description: 'Thành phố biển gần Sài Gòn với Tượng Chúa Kitô, Hải Đăng, bãi Sau và hải sản tươi ngon. Điểm đến cuối tuần lý tưởng.',
    imageUrl: 'https://images.unsplash.com/photo-1583417319330-f6ec9d50d0cc?w=800',
  },
  {
    city: 'Cần Thơ',
    state: 'Cần Thơ',
    country: 'Vietnam',
    latitude: 10.0452,
    longitude: 105.7469,
    description: 'Thủ phủ miền Tây với chợ nổi Cái Răng, vườn trái cây, và nền văn hóa sông nước đậm đà.',
    imageUrl: 'https://images.unsplash.com/photo-1583417319301-89a923a1f1b1?w=800',
  },
  {
    city: 'Hạ Long',
    state: 'Quảng Ninh',
    country: 'Vietnam',
    latitude: 20.9101,
    longitude: 107.1839,
    description: 'Kỳ quan thế giới với vịnh Hạ Long - 1000 đảo đá vôi kỳ ảo, hang động tuyệt đẹp và du thuyền sang trọng.',
    imageUrl: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800',
  },
  {
    city: 'Phan Thiết',
    state: 'Bình Thuận',
    country: 'Vietnam',
    latitude: 10.9265,
    longitude: 108.1014,
    description: 'Thành phố biển với đồi cát bay Mũi Né, Bàu Trắng, làng chài và resort nghỉ dưỡng cao cấp.',
    imageUrl: 'https://images.unsplash.com/photo-1583417319301-89a923a1f1b1?w=800',
  },
]

async function seedLocations() {
  console.log('🌍 Starting location seeding...')

  let created = 0
  let skipped = 0

  for (const location of locations) {
    try {
      // Check if location exists
      const existing = await prisma.location.findFirst({
        where: {
          city: location.city,
          state: location.state,
          country: location.country,
        },
      })

      if (existing) {
        console.log(`⏭️  Skipped: ${location.city}, ${location.state} (already exists)`)
        skipped++
      } else {
        await prisma.location.create({
          data: location,
        })
        console.log(`✅ Created: ${location.city}, ${location.state}`)
        created++
      }
    } catch (error) {
      console.error(`❌ Error creating ${location.city}:`, error)
    }
  }

  console.log(`\n📊 Summary:`)
  console.log(`   ✅ Created: ${created}`)
  console.log(`   ⏭️  Skipped: ${skipped}`)
  console.log(`   📍 Total: ${locations.length}`)
}

async function main() {
  try {
    await seedLocations()
    console.log('\n🎉 Location seeding completed!')
  } catch (error) {
    console.error('❌ Error during seeding:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
