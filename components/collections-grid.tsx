"use client"

import { CollectionCard } from "@/components/collection-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sparkles } from "lucide-react"

interface Collection {
  id: string
  title: string
  description: string
  image: string
  listingsCount: number
  location?: string
  tags: string[]
  category: string
  featured?: boolean
}

const collections: Collection[] = [
  {
    id: "romantic-getaways",
    title: "Romantic Getaways",
    description: "Những homestay lãng mạn hoàn hảo cho cặp đôi. View đẹp, không gian riêng tư, dịch vụ chu đáo.",
    image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800",
    listingsCount: 24,
    location: "Đà Lạt, Đà Nẵng",
    tags: ["Couple-friendly", "Private", "View đẹp"],
    category: "experience",
    featured: true
  },
  {
    id: "workation-spots",
    title: "Workation Paradise",
    description: "Làm việc từ xa tại những nơi đẹp như mơ. WiFi nhanh, workspace tiện nghi, view truyền cảm hứng.",
    image: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800",
    listingsCount: 18,
    location: "Đà Nẵng, Vũng Tàu",
    tags: ["WiFi cao tốc", "Workspace", "Yên tĩnh"],
    category: "workation",
    featured: true
  },
  {
    id: "beach-vibes",
    title: "Beach Vibes",
    description: "Thức dậy với tiếng sóng biển. Các homestay gần biển với view tuyệt đẹp và không khí trong lành.",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
    listingsCount: 32,
    location: "Nha Trang, Phú Quốc",
    tags: ["Gần biển", "View biển", "Hoạt động nước"],
    category: "location",
    featured: true
  },
  {
    id: "mountain-retreat",
    title: "Mountain Retreat",
    description: "Tránh xa phố thị, hòa mình vào thiên nhiên núi rừng. Không khí trong lành, view núi non hùng vĩ.",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
    listingsCount: 28,
    location: "Đà Lạt, Sa Pa",
    tags: ["Núi non", "Hiking", "Thiên nhiên"],
    category: "location"
  },
  {
    id: "urban-escapes",
    title: "Urban Escapes",
    description: "Ở ngay trung tâm thành phố, gần các điểm vui chơi, ẩm thực và mua sắm. Tiện lợi tối đa.",
    image: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800",
    listingsCount: 45,
    location: "Hà Nội, TP.HCM",
    tags: ["Trung tâm", "Di chuyển dễ", "Nightlife"],
    category: "location"
  },
  {
    id: "family-fun",
    title: "Family Fun",
    description: "Homestays rộng rãi, an toàn cho trẻ em. Có khu vui chơi, vườn rộng, phòng family lớn.",
    image: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800",
    listingsCount: 21,
    location: "Vũng Tàu, Đà Nẵng",
    tags: ["Kid-friendly", "Rộng rãi", "An toàn"],
    category: "experience"
  },
  {
    id: "luxury-stays",
    title: "Luxury Stays",
    description: "Những villa và resort cao cấp với dịch vụ 5 sao. Hồ bơi riêng, butler service, spa.",
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800",
    listingsCount: 15,
    location: "Phú Quốc, Nha Trang",
    tags: ["Luxury", "Hồ bơi riêng", "5 sao"],
    category: "experience"
  },
  {
    id: "budget-friendly",
    title: "Budget Travelers",
    description: "Chất lượng tốt với giá hợp lý. Homestays sạch sẽ, chủ nhà thân thiện, vị trí thuận tiện.",
    image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800",
    listingsCount: 38,
    location: "Hà Nội, Đà Nẵng",
    tags: ["Giá tốt", "Sạch sẽ", "Tiện nghi"],
    category: "price"
  },
  {
    id: "eco-stays",
    title: "Eco-Friendly Stays",
    description: "Homestays bền vững, thân thiện với môi trường. Vật liệu tự nhiên, năng lượng tái tạo.",
    image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800",
    listingsCount: 12,
    location: "Mai Châu, Ninh Bình",
    tags: ["Eco-friendly", "Bền vững", "Xanh"],
    category: "special"
  },
  {
    id: "pet-friendly",
    title: "Pet-Friendly Havens",
    description: "Mang thú cưng đi du lịch cùng. Homestays chào đón pet với khuôn viên rộng, dịch vụ pet.",
    image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800",
    listingsCount: 16,
    location: "Đà Lạt, Vũng Tàu",
    tags: ["Pet-friendly", "Khuôn viên", "Pet service"],
    category: "special"
  },
  {
    id: "cultural-heritage",
    title: "Cultural Heritage",
    description: "Trải nghiệm văn hóa bản địa. Homestays trong làng cổ, nhà sàn, kiến trúc truyền thống.",
    image: "https://images.unsplash.com/photo-1528127269322-539801943592?w=800",
    listingsCount: 19,
    location: "Hội An, Sa Pa",
    tags: ["Văn hóa", "Truyền thống", "Unique"],
    category: "special"
  },
  {
    id: "wellness-retreat",
    title: "Wellness & Spa",
    description: "Thư giãn và chăm sóc sức khỏe. Homestays có yoga studio, spa service, healthy menu.",
    image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800",
    listingsCount: 14,
    location: "Đà Lạt, Phú Quốc",
    tags: ["Wellness", "Yoga", "Spa"],
    category: "experience"
  }
]

export function CollectionsGrid() {
  const categories = [
    { value: "all", label: "Tất cả", count: collections.length },
    { value: "experience", label: "Trải nghiệm", count: collections.filter(c => c.category === "experience").length },
    { value: "location", label: "Địa điểm", count: collections.filter(c => c.category === "location").length },
    { value: "workation", label: "Workation", count: collections.filter(c => c.category === "workation").length },
    { value: "special", label: "Đặc biệt", count: collections.filter(c => c.category === "special").length }
  ]

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
          <Sparkles className="h-4 w-4" />
          <span className="text-sm font-medium">Curated Collections</span>
        </div>
        <h1 className="text-4xl font-bold">Bộ sưu tập được chọn lọc</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Khám phá những homestays được biên tập viên chúng tôi tuyển chọn kỹ càng cho từng chủ đề
        </p>
      </div>

      <Tabs defaultValue="all" className="space-y-8">
        <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto">
          {categories.map((category) => (
            <TabsTrigger key={category.value} value={category.value} className="gap-2">
              {category.label}
              <span className="text-xs opacity-60">({category.count})</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="mt-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((collection) => (
              <CollectionCard key={collection.id} {...collection} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="experience">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections
              .filter((c) => c.category === "experience")
              .map((collection) => (
                <CollectionCard key={collection.id} {...collection} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="location">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections
              .filter((c) => c.category === "location")
              .map((collection) => (
                <CollectionCard key={collection.id} {...collection} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="workation">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections
              .filter((c) => c.category === "workation")
              .map((collection) => (
                <CollectionCard key={collection.id} {...collection} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="special">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections
              .filter((c) => c.category === "special")
              .map((collection) => (
                <CollectionCard key={collection.id} {...collection} />
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
