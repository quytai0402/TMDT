import { PrismaClient, AmenityCategory } from "@prisma/client"
import bcrypt from "bcryptjs"
import { DESTINATIONS } from "../data/destinations"

const prisma = new PrismaClient()

async function upsertAmenities() {
  const amenityNames = new Set<string>()
  DESTINATIONS.forEach((destination) => {
    destination.stays.forEach((stay) => {
      stay.amenities.forEach((amenity) => amenityNames.add(amenity))
    })
  })

  const amenityMap = new Map<string, string>()

  for (const name of amenityNames) {
    const amenity = await prisma.amenity.upsert({
      where: { name },
      update: {},
      create: {
        name,
        nameVi: name,
        icon: "Dot",
        category: AmenityCategory.BASIC,
        isPopular: ["Wifi", "Điều hòa", "Bếp", "Máy giặt"].includes(name),
      },
    })
    amenityMap.set(name, amenity.id)
  }

  return amenityMap
}

async function upsertHosts() {
  const passwordHash = await bcrypt.hash("password123", 10)
  const hostMap = new Map<string, string>()

  for (const destination of DESTINATIONS) {
    const host = await prisma.user.upsert({
      where: { email: `host-${destination.slug}@luxestay.com` },
      update: {},
      create: {
        email: `host-${destination.slug}@luxestay.com`,
        name: `Host ${destination.name}`,
        password: passwordHash,
        role: "HOST",
        isHost: true,
        isSuperHost: true,
        emailVerified: new Date(),
        phone: `090${Math.floor(Math.random() * 9_000_000 + 1_000_000)
          .toString()
          .padStart(7, "0")}`,
        image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${destination.slug}`,
        bio: `Chuyên gia du lịch địa phương tại ${destination.name}.`,
        languages: ["Tiếng Việt", "English"],
      },
    })
    hostMap.set(destination.slug, host.id)
  }

  return hostMap
}

function resolveAmenityIds(amenityNames: string[], amenityMap: Map<string, string>) {
  return amenityNames
    .map((name) => amenityMap.get(name))
    .filter((id): id is string => Boolean(id))
}

async function seedDestinations() {
  console.log("🧹 Clearing previous travel data…")
  await prisma.$transaction([
    prisma.booking.deleteMany(),
    prisma.review.deleteMany(),
    prisma.experienceReview.deleteMany(),
    prisma.experienceBooking.deleteMany(),
    prisma.experience.deleteMany(),
    prisma.neighborhoodGuide.deleteMany(),
    prisma.listing.deleteMany(),
  ])

  console.log("✨ Upserting amenities…")
  const amenityMap = await upsertAmenities()

  console.log("👥 Preparing host accounts…")
  const hostMap = await upsertHosts()

  console.log("🏡 Creating curated listings…")
  for (const destination of DESTINATIONS) {
    const hostId = hostMap.get(destination.slug)
    if (!hostId) continue

    for (const stay of destination.stays) {
      const listing = await prisma.listing.create({
        data: {
          hostId,
          title: stay.title,
          description: stay.description,
          propertyType: stay.propertyType,
          roomType: stay.roomType,
          maxGuests: stay.maxGuests,
          bedrooms: stay.bedrooms,
          beds: Math.max(stay.bedrooms, 1),
          bathrooms: stay.bathrooms,
          country: "Vietnam",
          city: stay.city,
          state: stay.state,
          address: stay.address,
          latitude: stay.latitude,
          longitude: stay.longitude,
          neighborhood: destination.name,
          basePrice: stay.pricePerNight,
          cleaningFee: Math.round(stay.pricePerNight * 0.15),
          serviceFee: Math.round(stay.pricePerNight * 0.08),
          currency: "VND",
          images: stay.images,
          amenities: resolveAmenityIds(stay.amenities, amenityMap),
          verifiedAmenities: stay.amenities.slice(0, 3),
          checkInTime: "14:00",
          checkOutTime: "11:00",
          instantBookable: true,
          cancellationPolicy: "MODERATE",
          slug: stay.slug,
          status: "ACTIVE",
          featured: stay.featured ?? false,
          isVerified: true,
        },
      })

      await prisma.neighborhoodGuide.create({
        data: {
          listingId: listing.id,
          overview: `Khám phá ${destination.name} cùng host địa phương, tận hưởng các điểm đến nổi bật và ẩm thực bản địa.`,
          gettingAround:
            "Host cung cấp hướng dẫn chi tiết về phương tiện di chuyển và các tuyến xe/taxi khuyến nghị.",
          attractions: [
            {
              name: destination.mustTry[0] ?? destination.name,
              description: destination.summary,
              distance: 2.5,
              placeId: null,
            },
          ],
          restaurants: destination.mustTry.slice(1, 3).map((item) => ({
            name: item,
            description: "Địa chỉ ẩm thực được host yêu thích.",
            distance: 1.4,
            placeId: null,
          })),
          cafes: [],
          shopping: [],
        },
      })
    }
  }

  console.log("🌟 Creating signature experiences…")
  for (const destination of DESTINATIONS) {
    const hostId = hostMap.get(destination.slug)
    if (!hostId) continue

    for (const experience of destination.experiences) {
      await prisma.experience.create({
        data: {
          hostId,
          title: experience.title,
          description: experience.description,
          category: experience.category,
          city: experience.city,
          state: experience.state,
          location: experience.locationLabel,
          latitude: experience.latitude ?? null,
          longitude: experience.longitude ?? null,
          image: experience.image,
          images: [experience.image, destination.heroImage],
          price: experience.priceFrom,
          duration: experience.duration,
          currency: "VND",
          groupSize: "Tối đa 10 khách",
          minGuests: 1,
          maxGuests: 10,
          includedItems: ["Hướng dẫn viên bản địa", "Nước uống", "Ảnh kỹ niệm"],
          notIncluded: ["Chi phí di chuyển đến điểm hẹn"],
          requirements: ["Trang phục thoải mái", "Tinh thần khám phá"],
          languages: ["Tiếng Việt", "English"],
          tags: experience.tags,
          status: "ACTIVE",
          featured: true,
          isVerified: true,
        },
      })
    }
  }

  console.log("✅ Seeded curated destinations successfully.")
}

async function main() {
  try {
    await seedDestinations()
  } catch (error) {
    console.error("Seed error:", error)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}

void main()
