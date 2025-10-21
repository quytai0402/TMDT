import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Real Unsplash photo IDs for different property types
const PROPERTY_IMAGES = {
  // Vietnam homestays & villas
  villa: [
    'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200', // Luxury villa
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200', // Modern villa pool
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200', // White villa
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200', // Villa with garden
    'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=1200', // Luxury bedroom
  ],
  house: [
    'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1200', // Modern house
    'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200', // House exterior
    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200', // Living room
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200', // Kitchen
    'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1200', // Bathroom
  ],
  apartment: [
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200', // City apartment
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200', // Modern apartment
    'https://images.unsplash.com/photo-1574643156929-51fa098b0394?w=1200', // Apartment view
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200', // Apartment interior
    'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200', // Living space
  ],
  bungalow: [
    'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1200', // Beach bungalow
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200', // Tropical bungalow
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200', // Bungalow interior
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200', // Bungalow bedroom
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200', // Bungalow exterior
  ],
  cabin: [
    'https://images.unsplash.com/photo-1449158743715-0a90efa45792?w=1200', // Mountain cabin
    'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=1200', // Cozy cabin
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200', // Cabin interior
    'https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=1200', // Cabin living room
    'https://images.unsplash.com/photo-1506102383123-c8ef1e872756?w=1200', // Cabin bedroom
  ],
  homestay: [
    'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=1200', // Vietnamese house
    'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=1200', // Asian interior
    'https://images.unsplash.com/photo-1615873968403-89e068629265?w=1200', // Traditional room
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200', // Cozy bedroom
    'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=1200', // Homestay kitchen
  ]
}

// Amenity icons mapping to real amenities
const REAL_AMENITIES = [
  'WiFi',
  'Parking',
  'Air Conditioning',
  'Kitchen',
  'Washer',
  'Dryer',
  'Pool',
  'Hot Tub',
  'TV',
  'Gym',
  'BBQ Grill',
  'Beach Access',
  'Mountain View',
  'City View',
  'Garden',
  'Balcony',
  'Workspace',
  'Coffee Maker',
  'Refrigerator',
  'Microwave',
  'Dishwasher',
  'Heating',
  'Fireplace',
  'Iron',
  'Hair Dryer',
  'Toiletries',
  'Towels',
  'Bed Linens',
  'Hangers',
  'Smoke Alarm',
  'Carbon Monoxide Alarm',
  'Fire Extinguisher',
  'First Aid Kit'
]

async function main() {
  console.log('🖼️  Updating listing images and amenities...')

  // Get all amenities first
  const allAmenities = await prisma.amenity.findMany({
    select: { id: true, name: true }
  })
  
  console.log(`📦 Found ${allAmenities.length} amenities in database`)

  // Get all listings
  const listings = await prisma.listing.findMany({
    select: {
      id: true,
      propertyType: true,
      roomType: true,
      title: true,
      amenities: true,
    }
  })

  let updated = 0

  for (const listing of listings) {
    // Determine property category
    const propertyType = listing.propertyType.toLowerCase()
    let imagePool: string[] = []

    if (propertyType.includes('villa')) {
      imagePool = PROPERTY_IMAGES.villa
    } else if (propertyType.includes('house')) {
      imagePool = PROPERTY_IMAGES.house
    } else if (propertyType.includes('apartment') || propertyType.includes('flat')) {
      imagePool = PROPERTY_IMAGES.apartment
    } else if (propertyType.includes('bungalow')) {
      imagePool = PROPERTY_IMAGES.bungalow
    } else if (propertyType.includes('cabin')) {
      imagePool = PROPERTY_IMAGES.cabin
    } else {
      imagePool = PROPERTY_IMAGES.homestay
    }

    // Select 5 random images from pool
    const selectedImages: string[] = []
    const poolCopy = [...imagePool]
    
    for (let i = 0; i < 5 && poolCopy.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * poolCopy.length)
      selectedImages.push(poolCopy[randomIndex])
      poolCopy.splice(randomIndex, 1)
    }

    // Select random amenities (use existing amenity IDs)
    const numAmenities = Math.floor(Math.random() * 10) + 8 // 8-17 amenities
    const selectedAmenities: string[] = []
    const amenitiesCopy = [...allAmenities]
    
    for (let i = 0; i < numAmenities && amenitiesCopy.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * amenitiesCopy.length)
      selectedAmenities.push(amenitiesCopy[randomIndex].id)
      amenitiesCopy.splice(randomIndex, 1)
    }

    // Update listing
    await prisma.listing.update({
      where: { id: listing.id },
      data: {
        images: selectedImages,
        amenities: selectedAmenities
      }
    })

    updated++
    if (updated % 10 === 0) {
      console.log(`✅ Updated ${updated}/${listings.length} listings`)
    }
  }

  console.log(`✨ Successfully updated ${updated} listings with real images and amenities!`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
