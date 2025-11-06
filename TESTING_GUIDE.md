# 🧪 Hướng dẫn Test Tính năng Geocoding & Nearby Places

## ✅ Đã triển khai

### 1. Backend API với SerpAPI
- ✅ `/api/geocode` - Chuyển địa chỉ → tọa độ GPS
- ✅ `/api/nearby-places` - Tìm địa điểm lân cận
- ✅ Rate limiting: In-memory cache 24h cho geocode, 12h cho nearby
- ✅ Fallback: Nếu API lỗi → dùng data local

### 2. UI Features
- ✅ **Khóa Thành Phố/Tỉnh** theo khu vực đăng ký host
- ✅ **Auto-geocoding** khi nhập địa chỉ chi tiết
- ✅ **5 địa điểm lân cận** tự động từ Google Maps
- ✅ **Thêm địa điểm tùy chỉnh** bằng input + nút Plus
- ✅ **Rating hiển thị** từ Google Maps (4.9⭐)
- ✅ **Nút "Chỉ đường"** mở Google Maps
- ✅ **Badges màu** theo loại địa điểm

## 🧪 Test Flow

### Bước 1: Khởi động server
\`\`\`bash
npm run dev
\`\`\`

### Bước 2: Đăng nhập với tài khoản Host
- Truy cập: http://localhost:3000/login
- Đăng nhập với host account có role = HOST

### Bước 3: Tạo listing mới
1. Vào: http://localhost:3000/host/listings/new
2. Kiểm tra:
   - ✅ **Thành Phố/Tỉnh** đã tự động điền (VD: "Đà Lạt")
   - ✅ Dropdown bị **disabled** (màu xám)
   - ✅ Thông báo: *"Khu vực đã được khóa... Để mở rộng liên hệ admin"*

### Bước 4: Test Auto-geocoding
1. Nhập **Địa chỉ chi tiết**: `123 Nguyễn Đình Chiểu, Phường 1`
2. Chờ 700ms → Quan sát:
   - 🔄 "Đang tìm tọa độ..." (loading)
   - ✅ "Đã cập nhật tọa độ và địa điểm lân cận" (success)
   - 📍 **Vĩ độ** tự động điền (VD: `11.9404`)
   - 📍 **Kinh độ** tự động điền (VD: `108.4583`)

### Bước 5: Kiểm tra Nearby Places
Sau khi geocoding thành công:

**Địa điểm tự động (5 đầu tiên):**
- ✅ Tên địa điểm (VD: "Mê Linh Coffee Garden")
- ✅ Khoảng cách (VD: "391m", "1.5 km")
- ✅ Rating sao (VD: "4.9 ⭐")
- ✅ Badge màu (Quán cà phê, Nhà hàng, ATM...)
- ✅ Địa chỉ ngắn gọn
- ✅ Nút **"Chỉ đường"** → Mở Google Maps

**Thêm địa điểm tùy chỉnh:**
1. Nhập ô input: `Siêu thị Coopmart - 1.2km`
2. Nhấn **Enter** hoặc nút **+**
3. Toast: "Đã thêm địa điểm lân cận"
4. Địa điểm xuất hiện với:
   - Border **dashed** (khác địa điểm tự động)
   - Text: *"Đã thêm thủ công"*
   - Nút **X** để xóa

### Bước 6: Test Edge Cases

**Test 1: Địa chỉ không tồn tại**
- Nhập: `xyz123abc nonexistent address`
- Kết quả: ❌ "Không tìm thấy vị trí. Vui lòng kiểm tra lại..."

**Test 2: Xóa địa chỉ**
- Xóa nội dung ô "Địa chỉ chi tiết"
- Kết quả: Trạng thái geocoding reset về idle

**Test 3: Thay đổi thành phố**
- Nếu locked → Không thể thay đổi
- Nếu unlock (edge case) → Nearby places refresh

**Test 4: API Rate Limit**
- Nhập → Xóa → Nhập lại nhiều lần
- Kết quả: Cache hoạt động, không gọi API mỗi lần

**Test 5: Xem tất cả / Thu gọn**
- Nếu có >5 địa điểm → Nút "Xem tất cả (10)"
- Click → Hiển thị đầy đủ
- Nút "Thu gọn" → Quay về 5 đầu

## 📊 Expected API Response

### /api/geocode
\`\`\`json
{
  "latitude": 11.9404,
  "longitude": 108.4583,
  "displayName": "123 Nguyễn Đình Chiểu, Phường 1, Đà Lạt",
  "address": "123 Nguyễn Đình Chiểu, Đà Lạt, Vietnam"
}
\`\`\`

### /api/nearby-places
\`\`\`json
{
  "places": [
    {
      "name": "Mê Linh Coffee Garden",
      "type": "cafe",
      "distance": "391m",
      "rating": 4.9,
      "address": "1 Khe Sanh",
      "placeId": "ChIJ..."
    },
    {
      "name": "Nhà hàng Đà Lạt Train Villa",
      "type": "restaurant",
      "distance": "1.5 km",
      "rating": 4.8,
      "address": "1 Quang Trung",
      "placeId": "ChIJ..."
    }
  ]
}
\`\`\`

## 🐛 Debugging

### Check Console Logs
\`\`\`javascript
// Frontend
console.log("Geocoding status:", geocodingStatus)
console.log("Nearby places:", nearbyPlaces)

// Backend
console.log("Calling SerpAPI:", url.toString())
console.log("Cache hit:", cacheKey)
\`\`\`

### Check Network Tab
1. Mở DevTools → Network
2. Filter: `geocode`, `nearby-places`
3. Xem Request/Response

### SerpAPI Credits
- Check usage: https://serpapi.com/dashboard
- API Key: `c9a780...` (đã cấu hình)
- Rate limit: 100 searches/month (free tier)

## 🎯 Success Criteria

- ✅ Thành phố bị khóa khi có data từ host profile
- ✅ Geocoding hoạt động < 1s
- ✅ Nearby places hiển thị đúng format
- ✅ Thêm/xóa địa điểm tùy chỉnh không lỗi
- ✅ Cache giảm API calls
- ✅ Fallback khi API lỗi
- ✅ UI responsive trên mobile

## 🚀 Production Checklist

- [ ] Move API key to environment variable
- [ ] Add server-side rate limiting (Redis)
- [ ] Monitor SerpAPI usage/costs
- [ ] Add error tracking (Sentry)
- [ ] Test with real Vietnamese addresses
- [ ] Add analytics events
- [ ] Optimize cache strategy
- [ ] Add retry logic for API failures

## 📝 Notes

- **SerpAPI** được chọn vì:
  - ✅ Google Maps data chính xác
  - ✅ Rating và review count
  - ✅ Place ID để deep link
  - ✅ Address formatting chuẩn
  - ⚠️ Có giới hạn free tier (100/month)

- **Alternative**: Nếu hết credits SerpAPI
  - Fallback về local data (`lib/nearby-places.ts`)
  - Hoặc dùng Google Maps API trực tiếp (tốn phí)
  - Hoặc dùng OpenStreetMap Nominatim (free nhưng kém data)
