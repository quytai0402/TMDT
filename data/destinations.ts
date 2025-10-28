export type DestinationRegion =
  | "north"
  | "central"
  | "south"
  | "highlands"
  | "islands"

export type DestinationCategory =
  | "FOOD_DRINK"
  | "ADVENTURE"
  | "CULTURE"
  | "WELLNESS"
  | "WATER_SPORTS"
  | "WORKSHOP"
  | "SIGHTSEEING"
  | "ENTERTAINMENT"

export type PropertyTypeOption =
  | "APARTMENT"
  | "HOUSE"
  | "VILLA"
  | "CONDO"
  | "TOWNHOUSE"
  | "BUNGALOW"
  | "CABIN"
  | "FARM_STAY"
  | "UNIQUE"

export type RoomTypeOption = "ENTIRE_PLACE" | "PRIVATE_ROOM" | "SHARED_ROOM"

export interface DestinationStaySummary {
  slug: string
  title: string
  description: string
  propertyType: PropertyTypeOption
  roomType: RoomTypeOption
  pricePerNight: number
  bedrooms: number
  bathrooms: number
  maxGuests: number
  address: string
  city: string
  state: string
  latitude: number
  longitude: number
  images: string[]
  amenities: string[]
}

export interface DestinationExperienceSummary {
  slug: string
  title: string
  description: string
  category: DestinationCategory
  priceFrom: number
  duration: string
  locationLabel: string
  city: string
  state: string
  latitude?: number
  longitude?: number
  image: string
  tags: string[]
}

export interface DestinationData {
  slug: string
  name: string
  region: DestinationRegion
  province: string
  summary: string
  heroImage: string
  gallery: string[]
  listingCount: number
  avgPrice: number
  experienceCount: number
  keywords: string[]
  mustTry: string[]
  stays: DestinationStaySummary[]
  experiences: DestinationExperienceSummary[]
}

export const DESTINATIONS: DestinationData[] = [
  {
    slug: "ha-noi",
    name: "Hà Nội",
    region: "north",
    province: "Thành phố Hà Nội",
    summary:
      "Thủ đô nghìn năm văn hiến với những con phố cổ, kiến trúc Pháp và nền ẩm thực đường phố đặc sắc.",
    heroImage: "https://images.unsplash.com/photo-1502252430442-aac78f397426?w=1600&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1502252430435-5dacc81bdbb2?w=1200&q=80",
      "https://images.unsplash.com/photo-1524499982521-1ffd58dd89ea?w=1200&q=80",
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=80"
    ],
    listingCount: 185,
    avgPrice: 980000,
    experienceCount: 24,
    keywords: ["phố cổ", "ẩm thực", "cà phê trứng", "kiến trúc Pháp"],
    mustTry: [
      "Ngắm bình minh hồ Gươm và tháp Rùa",
      "Thưởng thức bún chả, phở bò, cà phê trứng",
      "Đi xích lô quanh khu phố cổ vào buổi tối"
    ],
    stays: [
      {
        slug: "heritage-loft-hoan-kiem",
        title: "Heritage Loft Phố Cổ",
        description: "Căn loft phong cách Đông Dương nằm trong biệt thự Pháp cổ, bước chân ra hồ Gươm.",
        propertyType: "APARTMENT",
        roomType: "ENTIRE_PLACE",
        pricePerNight: 1850000,
        bedrooms: 2,
        bathrooms: 2,
        maxGuests: 4,
        address: "12 Hàng Vôi, Hoàn Kiếm",
        city: "Hà Nội",
        state: "Hà Nội",
        latitude: 21.0295,
        longitude: 105.8562,
        images: [
          "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1600&q=80",
          "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1600&q=80"
        ],
        amenities: ["Wifi", "Bếp", "Điều hòa", "Máy giặt", "Ban công/Sân thượng", "Bàn làm việc"]
      },
      {
        slug: "westlake-residence",
        title: "West Lake Residence",
        description: "Căn hộ phong cách boutique nhìn ra hồ Tây với ban công rộng và góc làm việc riêng.",
        propertyType: "CONDO",
        roomType: "ENTIRE_PLACE",
        pricePerNight: 1450000,
        bedrooms: 1,
        bathrooms: 1,
        maxGuests: 2,
        address: "38 Quảng An, Tây Hồ",
        city: "Hà Nội",
        state: "Hà Nội",
        latitude: 21.0682,
        longitude: 105.828,
        images: [
          "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=1600&q=80",
          "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1600&q=80"
        ],
        amenities: ["Wifi", "Bếp", "Gym", "Điều hòa", "Thang máy", "View hồ"]
      }
    ],
    experiences: [
      {
        slug: "ha-noi-street-food-tour",
        title: "Tour ẩm thực phố cổ & cà phê trứng",
        description: "Khám phá 8 món ăn đường phố đặc trưng cùng food blogger bản địa.",
        category: "FOOD_DRINK",
        priceFrom: 650000,
        duration: "4 giờ",
        locationLabel: "Phố Hàng Bạc",
        city: "Hà Nội",
        state: "Hà Nội",
        latitude: 21.0338,
        longitude: 105.8527,
        image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80",
        tags: ["foodie", "đi bộ", "phố cổ"]
      },
      {
        slug: "bat-trang-ceramic-workshop",
        title: "Workshop gốm Bát Tràng cùng nghệ nhân",
        description: "Tự tay nặn, tạo hình và vẽ men gốm truyền thống tại làng nghề 700 năm tuổi.",
        category: "WORKSHOP",
        priceFrom: 900000,
        duration: "5 giờ",
        locationLabel: "Làng gốm Bát Tràng",
        city: "Gia Lâm",
        state: "Hà Nội",
        latitude: 21.0161,
        longitude: 105.9083,
        image: "https://images.unsplash.com/photo-1521774971864-96ffbd67ad16?w=1200&q=80",
        tags: ["thủ công", "family-friendly"]
      }
    ]
  },
  {
    slug: "sa-pa",
    name: "Sa Pa",
    region: "highlands",
    province: "Lào Cai",
    summary:
      "Thị trấn trong mây với ruộng bậc thang Mường Hoa, văn hóa bản địa và khí hậu mát lạnh quanh năm.",
    heroImage: "https://images.unsplash.com/photo-1499435816404-52741fc78c58?w=1600&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1470123808288-1e59739baab4?w=1200&q=80",
      "https://images.unsplash.com/photo-1470246973918-29a93221c455?w=1200&q=80",
      "https://images.unsplash.com/photo-1522780209446-8a0d0a16d3fa?w=1200&q=80"
    ],
    listingCount: 132,
    avgPrice: 870000,
    experienceCount: 18,
    keywords: ["ruộng bậc thang", "Fansipan", "trekking", "bản Cát Cát"],
    mustTry: [
      "Chinh phục đỉnh Fansipan bằng cáp treo",
      "Trekking thung lũng Mường Hoa buổi sáng",
      "Tắm lá thuốc Dao đỏ tại bản Tả Phìn"
    ],
    stays: [
      {
        slug: "cloud-villa-fansipan",
        title: "Cloud Villa Fansipan",
        description: "Biệt thự kính giữa thung lũng Mường Hoa, hồ bơi nước nóng nhìn ra biển mây.",
        propertyType: "VILLA",
        roomType: "ENTIRE_PLACE",
        pricePerNight: 3200000,
        bedrooms: 3,
        bathrooms: 3,
        maxGuests: 8,
        address: "Tổ 10, thị trấn Sa Pa",
        city: "Sa Pa",
        state: "Lào Cai",
        latitude: 22.3305,
        longitude: 103.8427,
        images: [
          "https://images.unsplash.com/photo-1499696010180-025ef6e1a8f3?w=1600&q=80",
          "https://images.unsplash.com/photo-1523731407965-2430cd12f5e4?w=1600&q=80"
        ],
        amenities: ["Wifi", "Bồn tắm nước nóng", "Lò sưởi", "BBQ", "View núi"]
      },
      {
        slug: "hmong-hill-bungalow",
        title: "H’Mông Hill Bungalow",
        description: "Bungalow tre nằm giữa ruộng bậc thang, trải nghiệm homestay cùng gia đình H’Mông.",
        propertyType: "BUNGALOW",
        roomType: "ENTIRE_PLACE",
        pricePerNight: 1150000,
        bedrooms: 1,
        bathrooms: 1,
        maxGuests: 3,
        address: "Bản Lao Chải",
        city: "Sa Pa",
        state: "Lào Cai",
        latitude: 22.3197,
        longitude: 103.8554,
        images: [
          "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1600&q=80",
          "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=1600&q=80"
        ],
        amenities: ["Wifi", "Bếp", "Tour bản địa", "Lửa trại"]
      }
    ],
    experiences: [
      {
        slug: "muong-hoa-sunrise-trek",
        title: "Trekking bình minh thung lũng Mường Hoa",
        description: "Cung trekking 8km ngắm bình minh và thăm bản Lao Chải, Tả Van cùng guide H’Mông.",
        category: "ADVENTURE",
        priceFrom: 790000,
        duration: "6 giờ",
        locationLabel: "Nhà thờ đá Sa Pa",
        city: "Sa Pa",
        state: "Lào Cai",
        latitude: 22.335,
        longitude: 103.8436,
        image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=80",
        tags: ["trekking", "sunrise", "bản làng"]
      },
      {
        slug: "dao-red-herbal-bath",
        title: "Tắm lá thuốc Dao đỏ",
        description: "Liệu trình ngâm lá thuốc truyền thống và xông hơi thảo mộc ở bản Tả Phìn.",
        category: "WELLNESS",
        priceFrom: 550000,
        duration: "90 phút",
        locationLabel: "Bản Tả Phìn",
        city: "Sa Pa",
        state: "Lào Cai",
        latitude: 22.3591,
        longitude: 103.8752,
        image: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=1200&q=80",
        tags: ["wellness", "thảo mộc"]
      }
    ]
  },
  {
    slug: "ha-long",
    name: "Hạ Long & Cát Bà",
    region: "north",
    province: "Quảng Ninh",
    summary:
      "Di sản thiên nhiên thế giới với hàng nghìn đảo đá vôi, hệ thống hang động và trải nghiệm du thuyền sang trọng.",
    heroImage: "https://images.unsplash.com/photo-1542546068979-b6affb46ea4a?w=1600&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=1200&q=80",
      "https://images.unsplash.com/photo-1543248939-ff40856f65d4?w=1200&q=80",
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&q=80"
    ],
    listingCount: 142,
    avgPrice: 1350000,
    experienceCount: 21,
    keywords: ["du thuyền", "hang Sửng Sốt", "kayak", "làng chài"],
    mustTry: [
      "Qua đêm trên du thuyền 5 sao giữa vịnh",
      "Kayak khám phá hang nước và làng chài",
      "Ngắm bình minh từ đỉnh Ti Tốp"
    ],
    stays: [
      {
        slug: "bayline-residence",
        title: "Bayline Residence View Vịnh",
        description: "Căn hộ tầng cao nhìn toàn cảnh vịnh Hạ Long, cách Sun World 5 phút.",
        propertyType: "CONDO",
        roomType: "ENTIRE_PLACE",
        pricePerNight: 2100000,
        bedrooms: 2,
        bathrooms: 2,
        maxGuests: 5,
        address: "25 Đường Hạ Long, Bãi Cháy",
        city: "Hạ Long",
        state: "Quảng Ninh",
        latitude: 20.9612,
        longitude: 107.0458,
        images: [
          "https://images.unsplash.com/photo-1505691723518-36a5ac3be353?w=1600&q=80",
          "https://images.unsplash.com/photo-1521783593447-5702afda1149?w=1600&q=80"
        ],
        amenities: ["Wifi", "Hồ bơi", "Gym", "Bếp", "View biển", "Ban công/Sân thượng"]
      },
      {
        slug: "cat-ba-eco-lodge",
        title: "Cát Bà Eco Lodge",
        description: "Lodge gỗ ẩn mình trong rừng quốc gia, hồ bơi nước mặn và chương trình yoga sáng.",
        propertyType: "UNIQUE",
        roomType: "ENTIRE_PLACE",
        pricePerNight: 1750000,
        bedrooms: 2,
        bathrooms: 2,
        maxGuests: 4,
        address: "Thôn 2 Hiền Hào, đảo Cát Bà",
        city: "Cát Bà",
        state: "Hải Phòng",
        latitude: 20.7705,
        longitude: 107.0214,
        images: [
          "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=1600&q=80",
          "https://images.unsplash.com/photo-1523475472560-d2df97ec485c?w=1600&q=80"
        ],
        amenities: ["Wifi", "Bồn tắm nước nóng", "BBQ", "Tour kayak", "Xe đưa đón cảng"]
      }
    ],
    experiences: [
      {
        slug: "overnight-cruise-luxury",
        title: "Du thuyền ngủ đêm vịnh Hạ Long",
        description: "Hành trình 2 ngày 1 đêm với kayak, nấu ăn cùng chef và thưởng thức hải sản tươi.",
        category: "SIGHTSEEING",
        priceFrom: 3800000,
        duration: "2 ngày 1 đêm",
        locationLabel: "Cảng Tuần Châu",
        city: "Hạ Long",
        state: "Quảng Ninh",
        latitude: 20.909,
        longitude: 107.0481,
        image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=1200&q=80",
        tags: ["du thuyền", "kayak", "ẩm thực"]
      },
      {
        slug: "lan-ha-bay-speedboat",
        title: "Speedboat thăm vịnh Lan Hạ & làng chài",
        description: "Trải nghiệm cano cao tốc, tắm biển đảo hoang và chèo kayak trong hang sáng.",
        category: "ADVENTURE",
        priceFrom: 1450000,
        duration: "6 giờ",
        locationLabel: "Bến Bèo Cát Bà",
        city: "Cát Bà",
        state: "Hải Phòng",
        latitude: 20.7184,
        longitude: 107.0536,
        image: "https://images.unsplash.com/photo-1543248939-ff40856f65d4?w=1200&q=80",
        tags: ["speedboat", "tắm biển", "kayak"]
      }
    ]
  },
  {
    slug: "ninh-binh",
    name: "Ninh Bình",
    region: "north",
    province: "Ninh Bình",
    summary:
      "Tràng An – di sản kép thế giới với hệ thống hang nước, núi đá vôi và những ngôi chùa cổ linh thiêng.",
    heroImage: "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=1600&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1555992336-cbfac2efc5b5?w=1200&q=80",
      "https://images.unsplash.com/photo-1523731407965-2430cd12f5e4?w=1200&q=80",
      "https://images.unsplash.com/photo-1543248939-ff40856f65d4?w=1200&q=80"
    ],
    listingCount: 88,
    avgPrice: 760000,
    experienceCount: 12,
    keywords: ["Tràng An", "Tam Cốc", "Hang Múa", "chùa Bái Đính"],
    mustTry: [
      "Chèo thuyền Tam Cốc ngắm lúa chín",
      "Leo 500 bậc đá Hang Múa ngắm toàn cảnh",
      "Thưởng thức dê núi Trường Yên"
    ],
    stays: [
      {
        slug: "tam-coc-riverside-lodge",
        title: "Tam Cốc Riverside Lodge",
        description: "Lodge gỗ trên sông Ngô Đồng, view núi đá vôi, có xe đạp miễn phí.",
        propertyType: "UNIQUE",
        roomType: "ENTIRE_PLACE",
        pricePerNight: 950000,
        bedrooms: 1,
        bathrooms: 1,
        maxGuests: 3,
        address: "Thôn Văn Lâm, Tam Cốc",
        city: "Hoa Lư",
        state: "Ninh Bình",
        latitude: 20.2519,
        longitude: 105.9351,
        images: [
          "https://images.unsplash.com/photo-1470246973918-29a93221c455?w=1600&q=80",
          "https://images.unsplash.com/photo-1522780209446-8a0d0a16d3fa?w=1600&q=80"
        ],
        amenities: ["Wifi", "Bếp", "Xe đạp", "BBQ", "View sông"]
      },
      {
        slug: "trang-an-boutique-house",
        title: "Tràng An Boutique House",
        description: "Nhà boutique phong cách Indochine, sân vườn rộng và bể immersion nhỏ.",
        propertyType: "HOUSE",
        roomType: "ENTIRE_PLACE",
        pricePerNight: 1250000,
        bedrooms: 2,
        bathrooms: 2,
        maxGuests: 5,
        address: "Xã Trường Yên",
        city: "Hoa Lư",
        state: "Ninh Bình",
        latitude: 20.2825,
        longitude: 105.9134,
        images: [
          "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1600&q=80",
          "https://images.unsplash.com/photo-1523731407965-2430cd12f5e4?w=1600&q=80"
        ],
        amenities: ["Wifi", "Điều hòa", "Bếp", "Sân vườn", "BBQ", "Xe đưa đón ga Ninh Bình"]
      }
    ],
    experiences: [
      {
        slug: "tam-coc-sampan-at-sunrise",
        title: "Chèo thuyền Tam Cốc lúc bình minh",
        description: "Trải nghiệm chèo thuyền riêng lúc bình minh, băng qua hang ba, hang Cả, hang Hải.",
        category: "SIGHTSEEING",
        priceFrom: 520000,
        duration: "2.5 giờ",
        locationLabel: "Bến Tam Cốc",
        city: "Hoa Lư",
        state: "Ninh Bình",
        latitude: 20.2504,
        longitude: 105.9352,
        image: "https://images.unsplash.com/photo-1523731407965-2430cd12f5e4?w=1200&q=80",
        tags: ["chèo thuyền", "bình minh", "ảnh đẹp"]
      },
      {
        slug: "bai-dinh-night-pilgrimage",
        title: "Hành hương đêm chùa Bái Đính",
        description: "Hướng dẫn viên thuyết minh lịch sử và nghi lễ tụng kinh tại ngôi chùa lớn nhất Việt Nam.",
        category: "CULTURE",
        priceFrom: 480000,
        duration: "3 giờ",
        locationLabel: "Chùa Bái Đính",
        city: "Gia Viễn",
        state: "Ninh Bình",
        latitude: 20.2861,
        longitude: 105.7821,
        image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=80",
        tags: ["tâm linh", "văn hóa"]
      }
    ]
  },
  {
    slug: "da-nang",
    name: "Đà Nẵng",
    region: "central",
    province: "Đà Nẵng",
    summary:
      "Thành phố biển năng động với cầu Rồng, bãi biển Mỹ Khê và cánh đồng đá Bà Nà Hills.",
    heroImage: "https://images.unsplash.com/photo-1542037082140-2c06c043b87d?w=1600&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1581167753755-5fd1fa26d7a0?w=1200&q=80",
      "https://images.unsplash.com/photo-1522780209446-8a0d0a16d3fa?w=1200&q=80",
      "https://images.unsplash.com/photo-1601572591371-58d8b99c6260?w=1200&q=80"
    ],
    listingCount: 168,
    avgPrice: 1120000,
    experienceCount: 19,
    keywords: ["Mỹ Khê", "Bà Nà Hills", "cầu Rồng", "hải sản"],
    mustTry: [
      "Tắm biển Mỹ Khê và ngắm bình minh",
      "Check-in Cầu Vàng Bà Nà Hills trên mây",
      "Ăn mì Quảng và bún chả cá đặc sản"
    ],
    stays: [
      {
        slug: "my-khe-oceanfront-loft",
        title: "Oceanfront Loft Mỹ Khê",
        description: "Căn loft góc nhìn trực diện biển Mỹ Khê, nội thất tối giản Bắc Âu.",
        propertyType: "APARTMENT",
        roomType: "ENTIRE_PLACE",
        pricePerNight: 1950000,
        bedrooms: 2,
        bathrooms: 2,
        maxGuests: 5,
        address: "Võ Nguyên Giáp, Sơn Trà",
        city: "Đà Nẵng",
        state: "Đà Nẵng",
        latitude: 16.0639,
        longitude: 108.2433,
        images: [
          "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1600&q=80",
          "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=1600&q=80"
        ],
        amenities: ["Wifi", "Hồ bơi", "Gym", "Điều hòa", "Bếp", "View biển"]
      },
      {
        slug: "son-tra-forest-villa",
        title: "Son Trà Forest Villa",
        description: "Biệt thự ẩn mình trong bán đảo Sơn Trà với hồ bơi vô cực và BBQ sân vườn.",
        propertyType: "VILLA",
        roomType: "ENTIRE_PLACE",
        pricePerNight: 4200000,
        bedrooms: 4,
        bathrooms: 4,
        maxGuests: 10,
        address: "Bãi Bụt, bán đảo Sơn Trà",
        city: "Đà Nẵng",
        state: "Đà Nẵng",
        latitude: 16.1028,
        longitude: 108.3068,
        images: [
          "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1600&q=80",
          "https://images.unsplash.com/photo-1499696010180-025ef6e1a8f3?w=1600&q=80"
        ],
        amenities: ["Wifi", "Bồn tắm nước nóng", "BBQ", "View biển", "Bếp đầy đủ"]
      }
    ],
    experiences: [
      {
        slug: "sunrise-sup-my-khe",
        title: "SUP ngắm bình minh Mỹ Khê",
        description: "Lớp stand-up paddle với huấn luyện viên, ngắm mặt trời mọc và cầu Rồng lên đèn.",
        category: "ADVENTURE",
        priceFrom: 650000,
        duration: "2 giờ",
        locationLabel: "Bãi biển Mỹ Khê",
        city: "Đà Nẵng",
        state: "Đà Nẵng",
        latitude: 16.0616,
        longitude: 108.2497,
        image: "https://images.unsplash.com/photo-1601572591371-58d8b99c6260?w=1200&q=80",
        tags: ["SUP", "bình minh", "thể thao nước"]
      },
      {
        slug: "ba-na-hills-private-tour",
        title: "Private tour Bà Nà Hills & cầu Vàng",
        description: "Xe riêng đón trả, skip-line cáp treo, trải nghiệm Cầu Vàng và làng Pháp.",
        category: "SIGHTSEEING",
        priceFrom: 1650000,
        duration: "8 giờ",
        locationLabel: "Sun World Bà Nà Hills",
        city: "Hòa Vang",
        state: "Đà Nẵng",
        latitude: 15.9959,
        longitude: 107.9894,
        image: "https://images.unsplash.com/photo-1542037082140-2c06c043b87d?w=1200&q=80",
        tags: ["private", "gia đình", "cáp treo"]
      }
    ]
  },
  {
    slug: "hoi-an",
    name: "Hội An",
    region: "central",
    province: "Quảng Nam",
    summary:
      "Phố cổ di sản UNESCO với đèn lồng rực rỡ, chợ đêm ven sông và văn hóa giao thoa Đông - Tây.",
    heroImage: "https://images.unsplash.com/photo-1512453974838-51e04ef0a5b9?w=1600&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1200&q=80",
      "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1200&q=80",
      "https://images.unsplash.com/photo-1470125747644-a5d6e5afb740?w=1200&q=80"
    ],
    listingCount: 122,
    avgPrice: 890000,
    experienceCount: 17,
    keywords: ["đèn lồng", "phở gà", "An Bàng beach"],
    mustTry: [
      "Thả đèn hoa đăng sông Thu Bồn buổi tối",
      "Thưởng thức cao lầu, mì Quảng ở chợ Hội An",
      "Đạp xe ra bãi biển An Bàng ngắm hoàng hôn"
    ],
    stays: [
      {
        slug: "old-town-heritage-house",
        title: "Old Town Heritage House",
        description: "Nhà cổ 200 năm cải tạo thành homestay sang trọng, 3 phòng ngủ và sân vườn đèn lồng.",
        propertyType: "HOUSE",
        roomType: "ENTIRE_PLACE",
        pricePerNight: 2350000,
        bedrooms: 3,
        bathrooms: 3,
        maxGuests: 6,
        address: "54 Nguyễn Thái Học",
        city: "Hội An",
        state: "Quảng Nam",
        latitude: 15.8782,
        longitude: 108.3287,
        images: [
          "https://images.unsplash.com/photo-1522780209446-8a0d0a16d3fa?w=1600&q=80",
          "https://images.unsplash.com/photo-1499696010180-025ef6e1a8f3?w=1600&q=80"
        ],
        amenities: ["Wifi", "Điều hòa", "Bếp", "Sân vườn", "Máy giặt"]
      },
      {
        slug: "an-bang-beach-bungalow",
        title: "An Bàng Beach Bungalow",
        description: "Bungalow gỗ cách biển 50m, có hồ plunge và góc BBQ riêng.",
        propertyType: "BUNGALOW",
        roomType: "ENTIRE_PLACE",
        pricePerNight: 1350000,
        bedrooms: 2,
        bathrooms: 1,
        maxGuests: 4,
        address: "Làng chài An Bàng",
        city: "Hội An",
        state: "Quảng Nam",
        latitude: 15.8939,
        longitude: 108.3446,
        images: [
          "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1600&q=80",
          "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=1600&q=80"
        ],
        amenities: ["Wifi", "Điều hòa", "BBQ", "Xe đạp", "Bếp"]
      }
    ],
    experiences: [
      {
        slug: "lantern-making-class",
        title: "Workshop làm đèn lồng Hội An",
        description: "Tự tay làm đèn lồng vải lụa cùng nghệ nhân phố cổ, mang về làm quà.",
        category: "WORKSHOP",
        priceFrom: 450000,
        duration: "2 giờ",
        locationLabel: "Phố Nguyễn Thái Học",
        city: "Hội An",
        state: "Quảng Nam",
        latitude: 15.8785,
        longitude: 108.3286,
        image: "https://images.unsplash.com/photo-1470125747644-a5d6e5afb740?w=1200&q=80",
        tags: ["handmade", "family"]
      },
      {
        slug: "coconut-forest-paddle",
        title: "Chèo thúng dừa rừng Cẩm Thanh",
        description: "Đi thúng dừa, nghe hát hò khoan và thưởng thức đặc sản bánh tráng đập.",
        category: "CULTURE",
        priceFrom: 520000,
        duration: "3 giờ",
        locationLabel: "Rừng dừa Cẩm Thanh",
        city: "Hội An",
        state: "Quảng Nam",
        latitude: 15.8744,
        longitude: 108.3647,
        image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=80",
        tags: ["thúng dừa", "ẩm thực", "local life"]
      }
    ]
  },
  {
    slug: "hue",
    name: "Huế",
    region: "central",
    province: "Thừa Thiên Huế",
    summary:
      "Kinh đô triều Nguyễn với Đại Nội, lăng tẩm vua chúa và những dòng sông, làng nghề thơ mộng.",
    heroImage: "https://images.unsplash.com/photo-1555992336-cbfac2efc5b5?w=1600&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1523731407965-2430cd12f5e4?w=1200&q=80",
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=80",
      "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1200&q=80"
    ],
    listingCount: 74,
    avgPrice: 720000,
    experienceCount: 11,
    keywords: ["Đại Nội", "lăng Khải Định", "ẩm thực cung đình"],
    mustTry: [
      "Tham quan Đại Nội và lăng Tự Đức buổi sáng",
      "Ngồi thuyền rồng nghe ca Huế trên sông Hương",
      "Ăn bún bò Huế, bánh bèo nậm lọc"
    ],
    stays: [
      {
        slug: "imperial-garden-house",
        title: "Imperial Garden House",
        description: "Nhà vườn kiến trúc nhà rường, hồ sen và bữa sáng cung đình tại chỗ.",
        propertyType: "HOUSE",
        roomType: "ENTIRE_PLACE",
        pricePerNight: 1750000,
        bedrooms: 3,
        bathrooms: 2,
        maxGuests: 6,
        address: "Phường Thuận Hòa",
        city: "Huế",
        state: "Thừa Thiên Huế",
        latitude: 16.4763,
        longitude: 107.5792,
        images: [
          "https://images.unsplash.com/photo-1523731407965-2430cd12f5e4?w=1600&q=80",
          "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1600&q=80"
        ],
        amenities: ["Wifi", "Sân vườn", "Bếp", "Xe đạp", "Bữa sáng truyền thống"]
      },
      {
        slug: "perfume-river-studio",
        title: "Perfume River Studio",
        description: "Studio view sông Hương, ban công lớn và góc trà chiều ngắm hoàng hôn.",
        propertyType: "APARTMENT",
        roomType: "ENTIRE_PLACE",
        pricePerNight: 920000,
        bedrooms: 1,
        bathrooms: 1,
        maxGuests: 2,
        address: "Lê Lợi, Phú Hội",
        city: "Huế",
        state: "Thừa Thiên Huế",
        latitude: 16.4679,
        longitude: 107.5925,
        images: [
          "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=1600&q=80",
          "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1600&q=80"
        ],
        amenities: ["Wifi", "Bếp", "Ban công/Sân thượng", "Điều hòa"]
      }
    ],
    experiences: [
      {
        slug: "royal-cuisine-dinner",
        title: "Dinner ẩm thực cung đình & nhã nhạc Huế",
        description: "Thưởng thức bữa tối cung đình 6 món cùng nghệ nhân nhã nhạc và áo ngũ thân.",
        category: "CULTURE",
        priceFrom: 990000,
        duration: "3 giờ",
        locationLabel: "Thuyền rồng sông Hương",
        city: "Huế",
        state: "Thừa Thiên Huế",
        latitude: 16.4637,
        longitude: 107.5909,
        image: "https://images.unsplash.com/photo-1555992336-cbfac2efc5b5?w=1200&q=80",
        tags: ["ẩm thực", "nhạc cung đình"]
      },
      {
        slug: "hue-cyclo-citadel",
        title: "City tour Đại Nội bằng xích lô",
        description: "Xích lô tham quan thành quách, điện Thái Hòa và chùa Thiên Mụ cùng guide lịch sử.",
        category: "SIGHTSEEING",
        priceFrom: 550000,
        duration: "4 giờ",
        locationLabel: "Cổng Ngọ Môn",
        city: "Huế",
        state: "Thừa Thiên Huế",
        latitude: 16.4706,
        longitude: 107.5855,
        image: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1200&q=80",
        tags: ["lịch sử", "xích lô"]
      }
    ]
  },
  {
    slug: "nha-trang",
    name: "Nha Trang",
    region: "south",
    province: "Khánh Hòa",
    summary:
      "Thiên đường biển với bãi cát dài, đảo san hô rực rỡ và nền ẩm thực hải sản đa dạng.",
    heroImage: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1600&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=1200&q=80",
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=80",
      "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1200&q=80"
    ],
    listingCount: 156,
    avgPrice: 1180000,
    experienceCount: 20,
    keywords: ["vịnh Nha Trang", "lặn biển", "hải sản", "VinWonders"],
    mustTry: [
      "Lặn ngắm san hô Hòn Mun",
      "Tắm bùn khoáng Tháp Bà",
      "Ăn bún sứa, bánh căn mực nướng"
    ],
    stays: [
      {
        slug: "beachfront-penthouse-tran-phu",
        title: "Penthouse Bãi Biển Nha Trang",
        description: "Penthouse 180m² trên đường Trần Phú với hồ bơi vô cực và phòng chiếu phim riêng.",
        propertyType: "APARTMENT",
        roomType: "ENTIRE_PLACE",
        pricePerNight: 3900000,
        bedrooms: 3,
        bathrooms: 3,
        maxGuests: 8,
        address: "60 Trần Phú",
        city: "Nha Trang",
        state: "Khánh Hòa",
        latitude: 12.2402,
        longitude: 109.1967,
        images: [
          "https://images.unsplash.com/photo-1499696010180-025ef6e1a8f3?w=1600&q=80",
          "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1600&q=80"
        ],
        amenities: ["Wifi", "Hồ bơi", "Bồn tắm nước nóng", "Gym", "Bếp", "View biển"]
      },
      {
        slug: "hon-tre-villa-retreat",
        title: "Hon Tre Retreat Villa",
        description: "Biệt thự biển riêng tư trên đảo, hồ bơi vô cực và xe điện riêng.",
        propertyType: "VILLA",
        roomType: "ENTIRE_PLACE",
        pricePerNight: 5200000,
        bedrooms: 4,
        bathrooms: 4,
        maxGuests: 10,
        address: "Đảo Hòn Tre",
        city: "Nha Trang",
        state: "Khánh Hòa",
        latitude: 12.2083,
        longitude: 109.2838,
        images: [
          "https://images.unsplash.com/photo-1543248939-ff40856f65d4?w=1600&q=80",
          "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1600&q=80"
        ],
        amenities: ["Wifi", "Hồ bơi vô cực", "BBQ", "Bếp", "Xe điện", "Bãi tắm riêng"]
      }
    ],
    experiences: [
      {
        slug: "coral-reef-snorkeling",
        title: "Snorkeling san hô Hòn Mun",
        description: "Tour cano 4 đảo, lặn ngắm san hô, ăn trưa hải sản và chụp ảnh dưới nước.",
        category: "ADVENTURE",
        priceFrom: 780000,
        duration: "6 giờ",
        locationLabel: "Cảng Cầu Đá",
        city: "Nha Trang",
        state: "Khánh Hòa",
        latitude: 12.2098,
        longitude: 109.2278,
        image: "https://images.unsplash.com/photo-1601572591371-58d8b99c6260?w=1200&q=80",
        tags: ["snorkeling", "cano", "ăn trưa hải sản"]
      },
      {
        slug: "mud-bath-and-spa",
        title: "Tắm bùn khoáng và spa thảo mộc",
        description: "Combo tắm bùn khoáng nóng, massage đá muối và xông hơi hồng ngoại.",
        category: "WELLNESS",
        priceFrom: 620000,
        duration: "3 giờ",
        locationLabel: "Khu tắm bùn Trăm Trứng",
        city: "Nha Trang",
        state: "Khánh Hòa",
        latitude: 12.2056,
        longitude: 109.1663,
        image: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=1200&q=80",
        tags: ["wellness", "spa", "bùn khoáng"]
      }
    ]
  },
  {
    slug: "da-lat",
    name: "Đà Lạt",
    region: "highlands",
    province: "Lâm Đồng",
    summary:
      "Thành phố ngàn hoa với khí hậu mùa xuân quanh năm, đồi thông, vườn cà phê và kiến trúc Pháp cổ.",
    heroImage: "https://images.unsplash.com/photo-1489659639091-8b687bc4386e?w=1600&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1523731407965-2430cd12f5e4?w=1200&q=80",
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=80",
      "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1200&q=80"
    ],
    listingCount: 142,
    avgPrice: 920000,
    experienceCount: 22,
    keywords: ["đồi thông", "cà phê", "thung lũng", "check-in"],
    mustTry: [
      "Ngắm bình minh đồi chè Cầu Đất",
      "Uống cà phê pha máy tại quán view đồi",
      "Tham quan nông trại organic và hái dâu"
    ],
    stays: [
      {
        slug: "pine-forest-villa",
        title: "Pine Forest Villa",
        description: "Villa gỗ giữa đồi thông, lò sưởi, hồ bơi nước ấm và phòng đọc sách kính.",
        propertyType: "VILLA",
        roomType: "ENTIRE_PLACE",
        pricePerNight: 3600000,
        bedrooms: 4,
        bathrooms: 3,
        maxGuests: 9,
        address: "Đồi An Sơn",
        city: "Đà Lạt",
        state: "Lâm Đồng",
        latitude: 11.9253,
        longitude: 108.4451,
        images: [
          "https://images.unsplash.com/photo-1499696010180-025ef6e1a8f3?w=1600&q=80",
          "https://images.unsplash.com/photo-1470246973918-29a93221c455?w=1600&q=80"
        ],
        amenities: ["Wifi", "Lò sưởi", "Bồn tắm nước nóng", "BBQ", "View núi", "Bếp đầy đủ"]
      },
      {
        slug: "greenhouse-loft",
        title: "Greenhouse Loft Cầu Đất",
        description: "Loft kính trong khu nông trại, vườn rau organic và workshop rang cà phê.",
        propertyType: "UNIQUE",
        roomType: "ENTIRE_PLACE",
        pricePerNight: 1450000,
        bedrooms: 1,
        bathrooms: 1,
        maxGuests: 3,
        address: "Cầu Đất Farm",
        city: "Đà Lạt",
        state: "Lâm Đồng",
        latitude: 11.9284,
        longitude: 108.5157,
        images: [
          "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1600&q=80",
          "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=1600&q=80"
        ],
        amenities: ["Wifi", "Bếp", "Lửa trại", "Workshop cà phê", "Xe đưa đón trung tâm"]
      }
    ],
    experiences: [
      {
        slug: "dalat-coffee-workshop",
        title: "Workshop rang cà phê Arabica",
        description: "Tham quan nông trại, học rang và pha cà phê đặc sản cùng roaster địa phương.",
        category: "WORKSHOP",
        priceFrom: 680000,
        duration: "3 giờ",
        locationLabel: "Nông trại Cầu Đất",
        city: "Đà Lạt",
        state: "Lâm Đồng",
        latitude: 11.9288,
        longitude: 108.5155,
        image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&q=80",
        tags: ["coffee", "farm-to-cup"]
      },
      {
        slug: "sunrise-jeep-langbiang",
        title: "Jeep săn mây đỉnh Langbiang",
        description: "Xe jeep riêng đón tại villa, thưởng thức bữa sáng picnic trên đỉnh núi.",
        category: "ADVENTURE",
        priceFrom: 890000,
        duration: "4 giờ",
        locationLabel: "KDL Langbiang",
        city: "Đà Lạt",
        state: "Lâm Đồng",
        latitude: 12.0246,
        longitude: 108.4367,
        image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&q=80",
        tags: ["săn mây", "jeep", "ảnh đẹp"]
      }
    ]
  },
  {
    slug: "phu-quoc",
    name: "Phú Quốc",
    region: "islands",
    province: "Kiên Giang",
    summary:
      "Đảo ngọc với bãi biển cát trắng, rặng san hô, khu nghỉ dưỡng sang trọng và ẩm thực hải sản phong phú.",
    heroImage: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1600&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1543248939-ff40856f65d4?w=1200&q=80",
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=80",
      "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1200&q=80"
    ],
    listingCount: 132,
    avgPrice: 1680000,
    experienceCount: 23,
    keywords: ["resort", "sunset", "hon thom", "san hô"],
    mustTry: [
      "Ngắm hoàng hôn ở mũi Dinh Cậu",
      "Cáp treo vượt biển Hòn Thơm",
      "Ăn bún quậy và gỏi cá trích"
    ],
    stays: [
      {
        slug: "sunset-cliff-villa",
        title: "Sunset Cliff Villa",
        description: "Biệt thự biển sang trọng ở Phú Quốc Marina, hồ bơi vô cực và quản gia riêng.",
        propertyType: "VILLA",
        roomType: "ENTIRE_PLACE",
        pricePerNight: 6800000,
        bedrooms: 4,
        bathrooms: 4,
        maxGuests: 10,
        address: "Bãi Trường, Dương Tơ",
        city: "Phú Quốc",
        state: "Kiên Giang",
        latitude: 10.1665,
        longitude: 103.9932,
        images: [
          "https://images.unsplash.com/photo-1543248939-ff40856f65d4?w=1600&q=80",
          "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1600&q=80"
        ],
        amenities: ["Wifi", "Hồ bơi vô cực", "Bếp", "BBQ", "Bãi biển riêng", "Quản gia"]
      },
      {
        slug: "mangrove-eco-bungalow",
        title: "Mangrove Eco Bungalow",
        description: "Bungalow gỗ giữa rừng ngập mặn Rạch Vẹm, trải nghiệm kayak và BBQ hải sản.",
        propertyType: "UNIQUE",
        roomType: "ENTIRE_PLACE",
        pricePerNight: 1850000,
        bedrooms: 1,
        bathrooms: 1,
        maxGuests: 3,
        address: "Rạch Vẹm",
        city: "Phú Quốc",
        state: "Kiên Giang",
        latitude: 10.3046,
        longitude: 103.9094,
        images: [
          "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=1600&q=80",
          "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1600&q=80"
        ],
        amenities: ["Wifi", "Bếp", "Kayak", "Tour ngắm sao biển", "BBQ"]
      }
    ],
    experiences: [
      {
        slug: "hon-thom-sunset-cruise",
        title: "Du thuyền hoàng hôn Hòn Thơm",
        description: "Cruise sang trọng với cocktail, DJ live và lặn ngắm san hô biển Nam.",
        category: "ENTERTAINMENT",
        priceFrom: 2100000,
        duration: "4 giờ",
        locationLabel: "Bến du thuyền An Thới",
        city: "Phú Quốc",
        state: "Kiên Giang",
        latitude: 10.0593,
        longitude: 104.0021,
        image: "https://images.unsplash.com/photo-1543248939-ff40856f65d4?w=1200&q=80",
        tags: ["sunset", "cocktail", "music"]
      },
      {
        slug: "island-hopping-north",
        title: "Island hopping phía Bắc đảo",
        description: "Khám phá hòn Móng Tay, hòn Mây Rút, snorkeling và picnic trên bãi cát trắng.",
        category: "ADVENTURE",
        priceFrom: 1450000,
        duration: "7 giờ",
        locationLabel: "Bến Gành Dầu",
        city: "Phú Quốc",
        state: "Kiên Giang",
        latitude: 10.3616,
        longitude: 103.8663,
        image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=80",
        tags: ["cano", "snorkeling", "picnic"]
      }
    ]
  }
]
