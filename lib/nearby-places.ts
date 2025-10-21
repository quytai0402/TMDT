// Real nearby places for Vietnamese locations
// Based on actual locations and distances

export interface NearbyPlace {
  name: string
  type: 'restaurant' | 'cafe' | 'atm' | 'hospital' | 'pharmacy' | 'supermarket' | 'beach' | 'attraction' | 'transport'
  distance: number // in meters
  rating?: number
  description?: string
  lat: number
  lng: number
}

// Real nearby places data for each city
export const nearbyPlacesData: Record<string, NearbyPlace[]> = {
  'Nha Trang': [
    { name: 'Bãi biển Trần Phú', type: 'beach', distance: 200, rating: 4.8, description: 'Bãi biển đẹp nhất Nha Trang', lat: 12.2388, lng: 109.1967 },
    { name: 'Vincom Plaza Nha Trang', type: 'supermarket', distance: 500, rating: 4.5, description: 'Trung tâm mua sắm lớn', lat: 12.2447, lng: 109.1943 },
    { name: 'Nhà hàng Hải Sản Biển Đông', type: 'restaurant', distance: 300, rating: 4.7, description: 'Hải sản tươi ngon', lat: 12.2400, lng: 109.1955 },
    { name: 'The Coffee House', type: 'cafe', distance: 250, rating: 4.6, description: 'Cà phê view biển', lat: 12.2395, lng: 109.1960 },
    { name: 'Vinmec Nha Trang', type: 'hospital', distance: 1200, rating: 4.8, description: 'Bệnh viện quốc tế', lat: 12.2520, lng: 109.1890 },
    { name: 'ATM Vietcombank', type: 'atm', distance: 150, rating: 4.5, lat: 12.2380, lng: 109.1970 },
    { name: 'Tháp Bà Ponagar', type: 'attraction', distance: 3000, rating: 4.7, description: 'Di tích lịch sử Chăm', lat: 12.2650, lng: 109.1950 },
  ],
  
  'Đà Lạt': [
    { name: 'Chợ Đà Lạt', type: 'supermarket', distance: 800, rating: 4.6, description: 'Chợ trung tâm', lat: 11.9404, lng: 108.4400 },
    { name: 'Nhà hàng Đà Lạt Train Villa', type: 'restaurant', distance: 600, rating: 4.8, description: 'Nhà hàng view đẹp', lat: 11.9420, lng: 108.4450 },
    { name: 'Mê Linh Coffee Garden', type: 'cafe', distance: 400, rating: 4.9, description: 'View đồi thông', lat: 11.9390, lng: 108.4550 },
    { name: 'Bệnh viện Đa khoa Lâm Đồng', type: 'hospital', distance: 1500, rating: 4.5, lat: 11.9350, lng: 108.4450 },
    { name: 'Big C Đà Lạt', type: 'supermarket', distance: 2000, rating: 4.4, lat: 11.9300, lng: 108.4380 },
    { name: 'Hồ Xuân Hương', type: 'attraction', distance: 1000, rating: 4.8, description: 'Hồ trung tâm thành phố', lat: 11.9380, lng: 108.4420 },
  ],

  'Phú Quốc': [
    { name: 'Bãi Sao', type: 'beach', distance: 100, rating: 4.9, description: 'Bãi biển đẹp nhất Phú Quốc', lat: 10.1699, lng: 103.9676 },
    { name: 'Chợ Dương Đông', type: 'supermarket', distance: 5000, rating: 4.5, description: 'Chợ đêm nổi tiếng', lat: 10.2222, lng: 103.9600 },
    { name: 'Nhà hàng Hải Sản Biển Xanh', type: 'restaurant', distance: 300, rating: 4.7, lat: 10.1710, lng: 103.9680 },
    { name: 'Vincom Plaza Phú Quốc', type: 'supermarket', distance: 8000, rating: 4.6, lat: 10.2150, lng: 103.9700 },
    { name: 'Bệnh viện Đa khoa Phú Quốc', type: 'hospital', distance: 6000, rating: 4.3, lat: 10.2200, lng: 103.9650 },
    { name: 'Vinpearl Safari', type: 'attraction', distance: 15000, rating: 4.8, description: 'Vườn thú bán hoang dã', lat: 10.3500, lng: 104.0200 },
  ],

  'Hồ Chí Minh': [
    { name: 'Vincom Center Landmark 81', type: 'supermarket', distance: 100, rating: 4.7, description: 'Tòa nhà cao nhất VN', lat: 10.7946, lng: 106.7218 },
    { name: 'Nhà hàng Quán Ăn Ngon', type: 'restaurant', distance: 500, rating: 4.6, lat: 10.7950, lng: 106.7200 },
    { name: 'Highlands Coffee Landmark', type: 'cafe', distance: 150, rating: 4.8, lat: 10.7946, lng: 106.7218 },
    { name: 'Bệnh viện FV', type: 'hospital', distance: 2000, rating: 4.9, description: 'Bệnh viện quốc tế', lat: 10.7800, lng: 106.7000 },
    { name: 'ATM Vietcombank', type: 'atm', distance: 200, rating: 4.5, lat: 10.7945, lng: 106.7220 },
    { name: 'Saigon River', type: 'attraction', distance: 500, rating: 4.7, description: 'View sông Sài Gòn', lat: 10.7950, lng: 106.7230 },
  ],

  'Hội An': [
    { name: 'Phố Cổ Hội An', type: 'attraction', distance: 200, rating: 4.9, description: 'Di sản UNESCO', lat: 15.8801, lng: 108.3380 },
    { name: 'Chợ Hội An', type: 'supermarket', distance: 300, rating: 4.6, lat: 15.8790, lng: 108.3370 },
    { name: 'Nhà hàng Morning Glory', type: 'restaurant', distance: 250, rating: 4.8, description: 'Ẩm thực truyền thống', lat: 15.8805, lng: 108.3375 },
    { name: 'Reaching Out Tea House', type: 'cafe', distance: 150, rating: 4.9, description: 'Không gian yên tĩnh', lat: 15.8800, lng: 108.3385 },
    { name: 'Bệnh viện Đa khoa Hội An', type: 'hospital', distance: 1500, rating: 4.4, lat: 15.8750, lng: 108.3300 },
    { name: 'Cầu Nhật Bản', type: 'attraction', distance: 400, rating: 4.9, description: 'Biểu tượng Hội An', lat: 15.8795, lng: 108.3290 },
  ],

  'Hà Nội': [
    { name: 'Hồ Tây', type: 'attraction', distance: 100, rating: 4.7, description: 'Hồ lớn nhất Hà Nội', lat: 21.0545, lng: 105.8212 },
    { name: 'Lotte Mart Tây Hồ', type: 'supermarket', distance: 800, rating: 4.5, lat: 21.0500, lng: 105.8150 },
    { name: 'Nhà hàng Tân Cồ Tuyết', type: 'restaurant', distance: 500, rating: 4.7, description: 'Bún chả nổi tiếng', lat: 21.0550, lng: 105.8200 },
    { name: 'The Note Coffee', type: 'cafe', distance: 2000, rating: 4.8, description: 'View Hồ Hoàn Kiếm', lat: 21.0285, lng: 105.8522 },
    { name: 'Bệnh viện Việt Đức', type: 'hospital', distance: 3000, rating: 4.6, lat: 21.0200, lng: 105.8450 },
    { name: 'Phố Cổ Hà Nội', type: 'attraction', distance: 3500, rating: 4.8, description: '36 phố phường', lat: 21.0285, lng: 105.8542 },
  ],

  'Phan Thiết': [
    { name: 'Bãi biển Mũi Né', type: 'beach', distance: 50, rating: 4.8, description: 'Bãi biển đẹp, lướt ván diều', lat: 10.9333, lng: 108.2833 },
    { name: 'Đồi cát bay', type: 'attraction', distance: 5000, rating: 4.7, description: 'Cát trắng mịn', lat: 10.9500, lng: 108.2700 },
    { name: 'Nhà hàng Hải Sản Mũi Né', type: 'restaurant', distance: 200, rating: 4.6, lat: 10.9335, lng: 108.2835 },
    { name: 'Co.opmart Phan Thiết', type: 'supermarket', distance: 3000, rating: 4.4, lat: 10.9280, lng: 108.1000 },
    { name: 'Bệnh viện Đa khoa Phan Thiết', type: 'hospital', distance: 4000, rating: 4.3, lat: 10.9300, lng: 108.1100 },
  ],

  'Cần Thơ': [
    { name: 'Chợ nổi Cái Răng', type: 'attraction', distance: 5000, rating: 4.8, description: 'Chợ nổi nổi tiếng nhất ĐBSCL', lat: 10.0200, lng: 105.7800 },
    { name: 'Vincom Xuân Khánh', type: 'supermarket', distance: 2000, rating: 4.5, lat: 10.0400, lng: 105.7600 },
    { name: 'Nhà hàng Sông Hậu', type: 'restaurant', distance: 500, rating: 4.7, description: 'Ẩm thực miền Tây', lat: 10.0350, lng: 105.7720 },
    { name: 'Bệnh viện Đa khoa Cần Thơ', type: 'hospital', distance: 3000, rating: 4.5, lat: 10.0300, lng: 105.7650 },
    { name: 'Cầu Cần Thơ', type: 'attraction', distance: 4000, rating: 4.6, description: 'Cầu dây văng lớn', lat: 10.0100, lng: 105.7900 },
  ],

  'Vũng Tàu': [
    { name: 'Bãi Sau', type: 'beach', distance: 100, rating: 4.6, description: 'Bãi biển trung tâm', lat: 10.3458, lng: 107.0843 },
    { name: 'Lotte Mart Vũng Tàu', type: 'supermarket', distance: 1000, rating: 4.5, lat: 10.3400, lng: 107.0800 },
    { name: 'Nhà hàng Ganh Hao', type: 'restaurant', distance: 800, rating: 4.8, description: 'Hải sản tươi sống', lat: 10.3470, lng: 107.0850 },
    { name: 'Tượng Chúa Kitô', type: 'attraction', distance: 3000, rating: 4.7, description: 'Tượng cao 32m', lat: 10.3280, lng: 107.0725 },
    { name: 'Bệnh viện Bà Rịa', type: 'hospital', distance: 2500, rating: 4.4, lat: 10.3380, lng: 107.0780 },
  ],

  'Sa Pa': [
    { name: 'Ruộng bậc thang', type: 'attraction', distance: 500, rating: 4.9, description: 'Cảnh đẹp như tranh', lat: 22.3364, lng: 103.8438 },
    { name: 'Chợ Sapa', type: 'supermarket', distance: 1000, rating: 4.5, description: 'Chợ phiên dân tộc', lat: 22.3360, lng: 103.8420 },
    { name: 'Nhà hàng Mimosa', type: 'restaurant', distance: 800, rating: 4.7, description: 'Món Việt và Âu', lat: 22.3365, lng: 103.8430 },
    { name: 'Bệnh viện Đa khoa Sapa', type: 'hospital', distance: 1500, rating: 4.2, lat: 22.3350, lng: 103.8400 },
    { name: 'Núi Hàm Rồng', type: 'attraction', distance: 2000, rating: 4.6, description: 'View toàn cảnh Sapa', lat: 22.3400, lng: 103.8450 },
  ],
}

// Calculate distance between two coordinates (Haversine formula)
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3 // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lng2 - lng1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in meters
}

// Get nearby places for a listing
export function getNearbyPlaces(city: string, lat: number, lng: number): NearbyPlace[] {
  // Find city key (case-insensitive partial match)
  const cityKey = Object.keys(nearbyPlacesData).find(key =>
    city.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(city.toLowerCase())
  )

  if (!cityKey) {
    return []
  }

  const places = nearbyPlacesData[cityKey]

  // Calculate actual distances from listing coordinates
  return places.map(place => ({
    ...place,
    distance: Math.round(calculateDistance(lat, lng, place.lat, place.lng)),
  })).sort((a, b) => a.distance - b.distance) // Sort by distance
}
