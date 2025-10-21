"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Crown, Calendar, Star, Gift, MapPin, Shield, Zap, Heart, Users, Lock } from "lucide-react"

interface Benefit {
  icon: React.ReactNode
  title: string
  description: string
  tiers: ("silver" | "gold" | "diamond")[]
}

const benefits: Benefit[] = [
  {
    icon: <Crown className="h-8 w-8 text-yellow-600" />,
    title: "Giảm giá độc quyền",
    description: "Tiết kiệm 5-15% cho mọi booking, áp dụng tự động không cần code",
    tiers: ["silver", "gold", "diamond"]
  },
  {
    icon: <Calendar className="h-8 w-8 text-blue-600" />,
    title: "Đêm nghỉ miễn phí",
    description: "Nhận 2-4 đêm miễn phí mỗi năm tại homestays đối tác cao cấp",
    tiers: ["gold", "diamond"]
  },
  {
    icon: <Star className="h-8 w-8 text-purple-600" />,
    title: "Room upgrade miễn phí",
    description: "Tự động nâng hạng phòng lên loại tốt hơn khi có sẵn",
    tiers: ["gold", "diamond"]
  },
  {
    icon: <Gift className="h-8 w-8 text-pink-600" />,
    title: "Welcome gift cao cấp",
    description: "Quà tặng chào đón đặc biệt mỗi lần check-in: rượu, bánh, hoa quả",
    tiers: ["gold", "diamond"]
  },
  {
    icon: <MapPin className="h-8 w-8 text-red-600" />,
    title: "Secret Collection",
    description: "Truy cập 50-100+ homestays độc quyền không công khai cho khách thường",
    tiers: ["gold", "diamond"]
  },
  {
    icon: <Shield className="h-8 w-8 text-green-600" />,
    title: "Flexible cancellation",
    description: "Hủy miễn phí 24-48h, hoặc bất kỳ lúc nào với gói Diamond",
    tiers: ["silver", "gold", "diamond"]
  },
  {
    icon: <Zap className="h-8 w-8 text-orange-600" />,
    title: "Priority booking",
    description: "Đặt trước listings hot, early access cho chỗ nghỉ mới",
    tiers: ["gold", "diamond"]
  },
  {
    icon: <Heart className="h-8 w-8 text-rose-600" />,
    title: "Concierge 24/7",
    description: "Đội ngũ hỗ trợ chuyên biệt, giúp đỡ mọi nhu cầu trong chuyến đi",
    tiers: ["diamond"]
  },
  {
    icon: <Users className="h-8 w-8 text-indigo-600" />,
    title: "VIP Events",
    description: "Tham gia tiệc cocktail, gala dinner, workshop độc quyền cho members",
    tiers: ["gold", "diamond"]
  },
  {
    icon: <Lock className="h-8 w-8 text-gray-600" />,
    title: "Private Chef Experience",
    description: "Trải nghiệm bữa tối do private chef phục vụ tại homestay",
    tiers: ["diamond"]
  }
]

const tierColors = {
  silver: "bg-gray-100 text-gray-800 border-gray-300",
  gold: "bg-yellow-100 text-yellow-800 border-yellow-300",
  diamond: "bg-purple-100 text-purple-800 border-purple-300"
}

const tierNames = {
  silver: "Silver",
  gold: "Gold",
  diamond: "Diamond"
}

export function MemberBenefitsShowcase() {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Quyền lợi thành viên</h2>
        <p className="text-lg text-muted-foreground">
          Trải nghiệm nghỉ dưỡng đẳng cấp với đặc quyền dành riêng cho bạn
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {benefits.map((benefit, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="p-3 rounded-lg bg-gradient-to-br from-primary/10 to-purple-500/10">
                  {benefit.icon}
                </div>
                <div className="flex flex-wrap gap-1 justify-end max-w-[120px]">
                  {benefit.tiers.map((tier) => (
                    <Badge
                      key={tier}
                      variant="outline"
                      className={tierColors[tier]}
                    >
                      {tierNames[tier]}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-lg">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
