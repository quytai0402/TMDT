export type PersonaSlug = "workation" | "pet-friendly" | "wellness" | "digital-nomad"

export type PersonaIconName = "briefcase" | "paw" | "lotus" | "globe"

export interface PersonaFilterConfig {
  allowPets?: boolean
  propertyTypes?: string[]
  minBedrooms?: number
  verifiedAmenities?: string[]
  hasSmartLock?: boolean
  requireMonthlyDiscount?: boolean
  requireWeeklyDiscount?: boolean
  minimumRating?: number
  allowEvents?: boolean
  minGuests?: number
  sortPriority?: "monthlyDiscount" | "rating" | "price" | "recent"
}

export interface PersonaExperience {
  title: string
  description: string
  cta?: string
}

export interface PersonaDefinition {
  slug: PersonaSlug
  name: string
  tagline: string
  description: string
  icon: PersonaIconName
  gradient: string
  heroImage: string
  filters: PersonaFilterConfig
  highlights: string[]
  reviewFocus: string[]
  experiences: PersonaExperience[]
  conciergePitch: string
  searchHint: string
}

export const PERSONAS: Record<PersonaSlug, PersonaDefinition> = {
  workation: {
    slug: "workation",
    name: "Workation Pro",
    tagline: "Ở lâu – làm việc hiệu quả – sạc lại năng lượng",
    description:
      "Những không gian làm việc hoàn chỉnh với bàn ergonomic, wifi 300Mbps, phòng họp mini và dịch vụ concierge hỗ trợ setup thiết bị.",
    icon: "briefcase",
    gradient: "from-sky-100 via-white to-slate-50",
    heroImage:
      "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=1600&q=80",
    filters: {
      propertyTypes: ["APARTMENT", "CONDO", "HOUSE"],
      minBedrooms: 1,
      sortPriority: "rating",
    },
    highlights: [
      "Wifi trung bình 250Mbps+, bàn làm việc chuẩn ergonomic",
      "Dịch vụ concierge hỗ trợ phiên dịch, đặt phòng họp, ship thiết bị",
      "Ưu đãi giảm giá dài ngày và hoá đơn VAT cho doanh nghiệp",
    ],
    reviewFocus: ["độ ổn định của wifi", "độ yên tĩnh", "độ thân thiện host khi làm việc khuya"],
    experiences: [
      {
        title: "Coworking Day Pass",
        description: "Tặng pass miễn phí tại coworking partners trong bán kính 1km.",
      },
      {
        title: "Business Concierge",
        description: "Đặt xe Limousine, tổ chức offsite nhỏ và hỗ trợ thủ tục hoá đơn.",
      },
      {
        title: "Well-being Boost",
        description: "Combo yoga sáng + healthy brunch cho team làm việc căng thẳng.",
      },
    ],
    conciergePitch:
      "Concierge sẽ ghép lịch split-stay giữa căn hộ và coworking hub nếu ngày cao điểm bị trùng, đồng thời giữ pass chiến lược cho bạn.",
    searchHint:
      "Mẹo: thử lọc thêm 'Villa/Apartment' với giảm giá tháng >15% để săn workation cực chất.",
  },
  "pet-friendly": {
    slug: "pet-friendly",
    name: "Pet-Friendly Escapes",
    tagline: "Cho boss đi nghỉ cùng cả nhà",
    description:
      "Chỗ ở rộng rãi, sân vườn an toàn, tiện nghi chăm sóc thú cưng và dịch vụ thú y/ spa gần kề.",
    icon: "paw",
    gradient: "from-rose-100 via-white to-amber-50",
    heroImage:
      "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1600&q=80",
    filters: {
      minBedrooms: 2,
      minGuests: 3,
      propertyTypes: ["HOUSE", "VILLA", "BUNGALOW"],
      sortPriority: "rating",
    },
    highlights: [
      "Sân vườn rào chắn, khu vận động riêng cho thú cưng",
      "Cung cấp pet-kit chào mừng & menu ăn riêng",
      "Concierge đặt lịch spa, grooming, bác sĩ thú y 24/7",
    ],
    reviewFocus: ["độ sạch sẽ sau khi đón boss", "thái độ host với thú cưng", "khu vực cho pet vận động"],
    experiences: [
      {
        title: "Pet Welcome Kit",
        description: "Chuẩn bị giường, chén ăn, treat hữu cơ và thảm vệ sinh trước giờ check-in.",
      },
      {
        title: "Pet Daycare",
        description: "Kết nối dịch vụ giữ chó mèo theo giờ để bạn rảnh tay đi chơi.",
      },
      {
        title: "Pet-Friendly Trails",
        description: "Gợi ý đường chạy sáng, quán cà phê và bãi biển cho pet trong khu vực.",
      },
    ],
    conciergePitch:
      "Nếu ngày cao điểm hết phòng, concierge sẵn sàng chuyển bạn sang villa đối tác cho phép thú cưng và gửi kèm ưu đãi grooming.",
    searchHint: "Bật bộ lọc 'Cho phép thú cưng' và chọn nhà có sân vườn/gần công viên để boss được chạy nhảy.",
  },
  wellness: {
    slug: "wellness",
    name: "Wellness Retreat",
    tagline: "Reset tinh thần với spa, detox và thiên nhiên",
    description:
      "Resort boutique với phòng trị liệu, hồ khoáng, lớp yoga riêng và thực đơn detox được cá nhân hoá.",
    icon: "lotus",
    gradient: "from-emerald-100 via-white to-blue-50",
    heroImage:
      "https://images.unsplash.com/photo-1546483875-ad9014c88eba?auto=format&fit=crop&w=1600&q=80",
    filters: {
      propertyTypes: ["VILLA", "UNIQUE", "BUNGALOW"],
      sortPriority: "rating",
    },
    highlights: [
      "Phòng trị liệu riêng, onsen/hydrotherapy & liệu trình detox",
      "Chef chuẩn bị thực đơn healthy tuỳ theo nhu cầu",
      "Lịch trình wellness cá nhân hóa (yoga, breathwork, hiking nhẹ)",
    ],
    reviewFocus: ["tay nghề therapist", "chất lượng thực đơn healthy", "độ riêng tư của villa"],
    experiences: [
      {
        title: "Wellness Concierge",
        description: "Sắp xếp liệu trình spa, huấn luyện viên riêng và lịch thiền bình minh.",
      },
      {
        title: "Plant-based Dining",
        description: "Thực đơn detox/plant-based theo mục tiêu (weight-loss, anti-inflammatory…).",
      },
      {
        title: "Nature Immersion",
        description: "Hiking nhẹ, tắm rừng và workshop mộc bản địa cùng nghệ nhân địa phương.",
      },
    ],
    conciergePitch:
      "Concierge sẽ giữ slot spa tại resort đối tác nếu ngày điều trị chính bị full, đồng thời tặng thêm gói yoga riêng khi bạn quay lại.",
    searchHint: "Ưu tiên những villa có 'spa', 'onsen' trong verified amenities và điểm đánh giá >4.6.",
  },
  "digital-nomad": {
    slug: "digital-nomad",
    name: "Digital Nomad Circuit",
    tagline: "Sống & làm việc linh hoạt theo hành trình của bạn",
    description:
      "Chuỗi homestay được tối ưu cho dân nomad với hợp đồng linh hoạt, cộng đồng quốc tế và concierge hỗ trợ thủ tục dài hạn.",
    icon: "globe",
    gradient: "from-violet-100 via-white to-indigo-50",
    heroImage:
      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=80",
    filters: {
      propertyTypes: ["APARTMENT", "CONDO", "HOUSE"],
      minBedrooms: 1,
      sortPriority: "rating",
    },
    highlights: [
      "Hợp đồng linh hoạt, gia hạn dễ dàng theo chu kỳ 2-4 tuần",
      "Cộng đồng nomad quốc tế, sự kiện kết nối mỗi tuần",
      "Concierge hỗ trợ gia hạn visa, giấy tờ tạm trú và dịch vụ chuyển vùng",
    ],
    reviewFocus: ["độ thân thiện cộng đồng", "tiếng ồn ban đêm", "độ linh hoạt check-in/out"],
    experiences: [
      {
        title: "Nomad Welcome Pack",
        description: "Sim eSIM, pass coworking, voucher cafe và bản đồ sống như người bản địa.",
      },
      {
        title: "Community Events",
        description: "Meetup hàng tuần, lớp học kỹ năng và chuyến đi ngắn dịp cuối tuần.",
      },
      {
        title: "Long-stay Concierge",
        description: "Hỗ trợ thủ tục tạm trú, tư vấn gia hạn visa và dịch vụ lưu kho hành lý.",
      },
    ],
    conciergePitch:
      "Khi lịch bị trùng, concierge sẽ điều phối phòng cùng hệ thống trong cùng khu vực và giữ nguyên ưu đãi dài ngày của bạn.",
    searchHint: "Chọn các căn hộ có giảm giá tuần/tháng và amenities 'workspace', 'laundry' để sống ổn định hơn.",
  },
}

export const PERSONA_LIST = Object.values(PERSONAS)

export function getPersona(slug: string): PersonaDefinition | null {
  return PERSONAS[slug as PersonaSlug] ?? null
}
