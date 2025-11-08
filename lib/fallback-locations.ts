export type FallbackLocation = {
  id: string
  city: string
  state: string
  country: string
  latitude: number
  longitude: number
  description: string
  imageUrl: string
}

export const FALLBACK_LOCATIONS: FallbackLocation[] = [
  {
    id: "fallback-hanoi",
    city: "Hà Nội",
    state: "Hà Nội",
    country: "Vietnam",
    latitude: 21.0278,
    longitude: 105.8342,
    description: "Trung tâm thủ đô, phù hợp cho các homestay phố cổ & hồ Tây.",
    imageUrl: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "fallback-hcmc",
    city: "Quận 1",
    state: "TP. Hồ Chí Minh",
    country: "Vietnam",
    latitude: 10.7758,
    longitude: 106.7009,
    description: "Khu vực trung tâm Sài Gòn, nhu cầu cao quanh năm.",
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "fallback-dalat",
    city: "Đà Lạt",
    state: "Lâm Đồng",
    country: "Vietnam",
    latitude: 11.9404,
    longitude: 108.4583,
    description: "Điểm đến nghỉ dưỡng cao nguyên, phù hợp villa & homestay ấm cúng.",
    imageUrl: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "fallback-danang",
    city: "Đà Nẵng",
    state: "Đà Nẵng",
    country: "Vietnam",
    latitude: 16.0471,
    longitude: 108.2068,
    description: "Thành phố biển phát triển mạnh về du lịch & MICE.",
    imageUrl: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "fallback-phuquoc",
    city: "Phú Quốc",
    state: "Kiên Giang",
    country: "Vietnam",
    latitude: 10.2899,
    longitude: 103.984,
    description: "Thiên đường nghỉ dưỡng với nhu cầu homestay ven biển tăng cao.",
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
  },
]

export const getFallbackLocationById = (id?: string | null) =>
  id ? FALLBACK_LOCATIONS.find((location) => location.id === id) ?? null : null

export const getFallbackLocationsByCountry = (country?: string | null) => {
  if (!country) {
    return [...FALLBACK_LOCATIONS]
  }
  return FALLBACK_LOCATIONS.filter((location) => location.country === country)
}
