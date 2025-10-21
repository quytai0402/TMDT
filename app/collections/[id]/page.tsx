import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { CollectionHero } from "@/components/collection-hero"
import { ListingsGrid } from "@/components/listings-grid"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

// Mock data - sẽ fetch từ API dựa theo params.id
const collectionData = {
  "romantic-getaways": {
    title: "Romantic Getaways",
    description: "Những homestay lãng mạn hoàn hảo cho cặp đôi",
    longDescription: `Bộ sưu tập này tập hợp những homestays được chúng tôi tuyển chọn kỹ càng, phù hợp nhất cho các cặp đôi muốn có một kỳ nghỉ lãng mạn và đáng nhớ.

Mỗi homestay trong bộ sưu tập đều có:
• View đẹp, riêng tư (núi, biển, hồ nước...)
• Không gian thiết kế lãng mạn với lighting đẹp
• Dịch vụ đặc biệt cho couple (spa, candlelight dinner...)
• Phòng tắm với bồn tắm hoặc jacuzzi
• Ban công/sân vườn riêng để ngắm cảnh

Tất cả đã được verified team của chúng tôi trực tiếp ghé thăm và đánh giá cao về chất lượng, sự riêng tư và sự chu đáo trong dịch vụ.`,
    image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200",
    listingsCount: 24,
    location: "Đà Lạt, Đà Nẵng",
    tags: ["Couple-friendly", "Private", "View đẹp", "Bồn tắm"],
    curator: {
      name: "Thu Phương",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
      title: "Travel Editor"
    }
  },
  "workation-spots": {
    title: "Workation Paradise",
    description: "Làm việc từ xa tại những nơi đẹp như mơ",
    longDescription: `Workation = Work + Vacation. Bộ sưu tập này dành cho những digital nomad và người làm việc remote muốn kết hợp công việc với du lịch.

Tiêu chí tuyển chọn:
• WiFi tốc độ cao (tối thiểu 50Mbps)
• Không gian làm việc riêng (desk, ghế ergonomic)
• View đẹp, yên tĩnh để tập trung
• Gần quán cafe, co-working space
• Flexible check-in/out cho long-term stay

Tất cả các homestays đều đã được test WiFi speed và verify workspace quality bởi team remote workers của chúng tôi.`,
    image: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=1200",
    listingsCount: 18,
    location: "Đà Nẵng, Vũng Tàu",
    tags: ["WiFi cao tốc", "Workspace", "Yên tĩnh", "Long-term"],
    curator: {
      name: "Minh Tuấn",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200",
      title: "Digital Nomad & Travel Expert"
    }
  },
  "beach-vibes": {
    title: "Beach Vibes",
    description: "Thức dậy với tiếng sóng biển",
    longDescription: `Không gì tuyệt vời hơn việc mở mắt ra và nhìn thấy bãi biển xanh ngắt ngay trước mắt. Bộ sưu tập này chứa những homestays gần biển đẹp nhất Việt Nam.

Highlights:
• Cách biển dưới 5 phút đi bộ
• View biển từ phòng hoặc ban công
• Gần các hoạt động nước (lặn, chèo kayak...)
• Bãi biển sạch, đẹp, ít người
• Phù hợp cho beach lovers thực thụ

Chúng tôi đã đi khảo sát trực tiếp từng homestay để đảm bảo chất lượng view biển và khoảng cách như mô tả.`,
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200",
    listingsCount: 32,
    location: "Nha Trang, Phú Quốc, Quy Nhơn",
    tags: ["Gần biển", "View biển", "Hoạt động nước", "Bãi tắm đẹp"],
    curator: {
      name: "Hải Yến",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200",
      title: "Beach Explorer"
    }
  }
}

export default async function CollectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const collection = collectionData[resolvedParams.id as keyof typeof collectionData] || collectionData["romantic-getaways"]

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Back Button */}
          <div className="mb-6">
            <Link href="/collections">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại Collections
              </Button>
            </Link>
          </div>

          {/* Hero Section */}
          <CollectionHero {...collection} />

          {/* Listings */}
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{collection.listingsCount} homestays trong bộ sưu tập</h2>
            </div>
            <ListingsGrid />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
