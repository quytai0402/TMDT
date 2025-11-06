# ✅ Auto-Save Nearby Places Feature

## 📝 Tóm tắt thay đổi

### 1. Layout Fix: Quốc gia & Thành phố nằm ngang
- ✅ Quốc gia và Thành phố giờ nằm cùng hàng (2 columns)
- ✅ Cả 2 field đều có label bold và input height lớn hơn (h-12)
- ✅ Consistent UI với nhau

**Before:**
```
Quốc gia  [        full width        ]
Thành phố [        full width        ]
```

**After:**
```
Quốc gia [     50%    ]  Thành phố [     50%    ]
```

### 2. Auto-Save Nearby Places (Tối đa 10 địa điểm)

#### Database Schema Update
**File:** `prisma/schema.prisma`
```prisma
model Listing {
  // ... existing fields
  
  // Location
  nearbyPlaces Json[] @default([]) // Auto-detected nearby places from SerpAPI
  
  // ... other fields
}
```

#### Form Schema Update
**File:** `components/host-listing-form.tsx`
```tsx
const listingSchema = z.object({
  // ... existing fields
  nearbyPlaces: z.array(z.any()).optional(), // Store nearby places data
})
```

#### API Update
**File:** `app/api/listings/route.ts`
```tsx
const createListingSchema = z.object({
  // ... existing fields
  nearbyPlaces: z.array(z.any()).optional(), // Auto-detected nearby places
})
```

#### Hook Update
**File:** `hooks/use-listings.ts`
```tsx
export interface CreateListingData {
  // ... existing fields
  nearbyPlaces?: any[] // Auto-detected nearby places from SerpAPI
}
```

## 🔄 Auto-Save Logic

### Khi nào nearby places được tự động lưu?

**Trigger:** Khi địa chỉ chi tiết được nhập và geocoding thành công

**File:** `components/host-listing-form.tsx` (useEffect for geocoding)
```tsx
// Fetch nearby places using helper
try {
  const places = await findNearbyPlaces(result.latitude, result.longitude, city)
  if (places && places.length > 0) {
    setNearbyPlaces(places)
    // ✅ AUTO-SAVE: Top 10 nearby places to form data
    const top10Places = places.slice(0, 10).map(place => ({
      name: place.name,
      type: place.type,
      distance: place.distance,
      rating: place.rating,
      address: place.address,
      placeId: place.placeId,
    }))
    form.setValue("nearbyPlaces", top10Places, { shouldDirty: true })
  } else {
    // Fallback to local data
    const localPlaces = getNearbyPlaces(city, result.latitude, result.longitude)
    const convertedPlaces = localPlaces.map(convertLocalPlace)
    setNearbyPlaces(convertedPlaces)
    // ✅ AUTO-SAVE: Local places (up to 10)
    const top10Local = convertedPlaces.slice(0, 10)
    form.setValue("nearbyPlaces", top10Local, { shouldDirty: true })
  }
} catch (nearbyError) {
  // Fallback with auto-save
  const localPlaces = getNearbyPlaces(city, result.latitude, result.longitude)
  const convertedPlaces = localPlaces.map(convertLocalPlace)
  setNearbyPlaces(convertedPlaces)
  const top10Local = convertedPlaces.slice(0, 10)
  form.setValue("nearbyPlaces", top10Local, { shouldDirty: true })
}
```

## 📊 Data Structure của Nearby Places

```typescript
interface NearbyPlace {
  name: string         // "Làng Vân Square"
  type: string         // "restaurant", "cafe", "atm", "attraction", etc.
  distance: string     // "500m" or "1.2 km"
  rating?: number      // 4.5
  address?: string     // "Đường Quảng Hàm, Phường 1, Đà Lạt"
  placeId?: string     // "ChIJ..." (Google Place ID for directions)
}
```

## 🔍 Workflow hoàn chỉnh

1. **User nhập địa chỉ chi tiết**
   - VD: "80 Dương Quảng Hàm, Phường 1"

2. **Debounce 700ms** → Trigger geocoding

3. **Geocoding API call** (`/api/geocode`)
   - Trả về: latitude, longitude, displayName

4. **Auto-fill tọa độ** vào form
   - `form.setValue("latitude", ...)`
   - `form.setValue("longitude", ...)`

5. **Nearby Places API call** (`/api/nearby-places`)
   - Tìm 10+ địa điểm xung quanh
   - Categorize theo type (restaurant, cafe, atm, etc.)

6. **✅ AUTO-SAVE top 10** vào form
   - `form.setValue("nearbyPlaces", top10Places, { shouldDirty: true })`

7. **Display trong UI** (không ảnh hưởng đến việc lưu)
   - Show 5 địa điểm đầu tiên
   - Button "Xem tất cả" để expand
   - Cho phép thêm custom places

8. **Submit form** → Lưu vào database
   - `nearbyPlaces` field tự động được include trong payload
   - Prisma save vào MongoDB

## 🎯 Lợi ích

### 1. **Transparent cho User**
- User không cần biết là nearby places được lưu
- Tự động chạy background
- Không có extra step hay confirmation

### 2. **Performance**
- Chỉ fetch nearby places 1 lần khi geocoding
- Lưu kết quả vào database để reuse
- Không cần call API mỗi lần hiển thị listing

### 3. **Data Consistency**
- Mỗi listing có snapshot của nearby places tại thời điểm tạo
- Không bị ảnh hưởng nếu API thay đổi sau này
- Có thể update sau nếu cần

### 4. **Flexible Display**
- Frontend có thể dùng nearbyPlaces để:
  - Show map với markers
  - Display list of attractions
  - Filter/sort theo type
  - Show distance from listing

## 📱 UI/UX Flow

### Host Dashboard → Tạo Listing Mới

1. **Quốc gia & Thành phố** (nằm ngang cùng hàng)
   ```
   ┌────────────────────────────────────────────────────┐
   │ Quốc gia                    Thành phố / Tỉnh       │
   │ [Vietnam         ▼]         [Đà Lạt        ▼]      │
   │ Đã tự động lấy theo hồ sơ   🔒 Khu vực đã khóa    │
   └────────────────────────────────────────────────────┘
   ```

2. **Địa chỉ chi tiết**
   ```
   ┌────────────────────────────────────────────────────┐
   │ Địa chỉ chi tiết                                   │
   │ [80 Dương Quảng Hàm, Phường 1                    ] │
   │ 📍 Vui lòng nhập đúng địa chỉ để tự động xác định │
   └────────────────────────────────────────────────────┘
   ```

3. **Auto-geocoding** (700ms sau khi ngừng gõ)
   ```
   ┌────────────────────────────────────────────────────┐
   │ ⏳ Đang tìm tọa độ và địa điểm lân cận...          │
   └────────────────────────────────────────────────────┘
   ```

4. **Success state**
   ```
   ┌────────────────────────────────────────────────────┐
   │ ✅ Đã xác định vị trí thành công                   │
   │ 80 Dương Quảng Hàm, Phường 1, Đà Lạt, Vietnam      │
   └────────────────────────────────────────────────────┘
   ```

5. **Nearby Places** (auto-loaded, max 10 saved)
   ```
   ┌────────────────────────────────────────────────────┐
   │ Địa điểm lân cận                           [10]    │
   │                                                     │
   │ 📍 Làng Vân Square              ⭐ 4.5   🧭 Chỉ đường │
   │    500m • Nhà hàng                                 │
   │                                                     │
   │ 📍 Valley Of Love               ⭐ 4.4   🧭 Chỉ đường │
   │    3.4 km • Địa điểm du lịch                       │
   │                                                     │
   │ ... (8 more auto-saved, not displayed)            │
   │                                                     │
   │ [+ Thêm địa điểm lân cận thủ công              ]   │
   └────────────────────────────────────────────────────┘
   ```

6. **Submit** → ✅ Lưu listing với 10 nearby places

## 🧪 Testing

### Test Case 1: Geocoding thành công
1. Nhập địa chỉ: "80 Dương Quảng Hàm"
2. Chờ 700ms
3. ✅ Verify: latitude/longitude được fill
4. ✅ Verify: console log "📍 Nearby: [...]"
5. ✅ Verify: form.watch("nearbyPlaces").length === 10

### Test Case 2: Fallback to local data
1. Mock API error
2. Nhập địa chỉ hợp lệ
3. ✅ Verify: local places được dùng
4. ✅ Verify: form có nearbyPlaces

### Test Case 3: Submit form
1. Fill all required fields
2. Geocode địa chỉ (auto-save nearby)
3. Click "Gửi duyệt"
4. ✅ Verify: POST /api/listings includes nearbyPlaces
5. ✅ Verify: Database record có nearbyPlaces field

### Test Case 4: Edit existing listing
1. Load listing có nearbyPlaces
2. ✅ Verify: nearbyPlaces hiển thị trong form
3. Update address → re-geocode
4. ✅ Verify: nearbyPlaces được update
5. Save → ✅ Verify: new nearbyPlaces saved

## 📁 Files Changed

### 1. Database
- [x] `prisma/schema.prisma` - Added `nearbyPlaces Json[]` field

### 2. Backend
- [x] `app/api/listings/route.ts` - Added nearbyPlaces to schema validation
- [x] `hooks/use-listings.ts` - Added nearbyPlaces to TypeScript interface

### 3. Frontend
- [x] `components/host-listing-form.tsx`:
  - Layout fix (Quốc gia & Thành phố ngang hàng)
  - Added nearbyPlaces to form schema
  - Auto-save top 10 nearby places after geocoding
  - Updated toFormValues to include nearbyPlaces

### 4. Database Migration
- [x] `npx prisma db push` - Applied schema changes

## 🚀 Deployment Notes

1. **Database**: MongoDB tự động support Json[] field
2. **API**: Không cần thay đổi gì, tự động accept nearbyPlaces
3. **Environment**: SerpAPI key đã có sẵn
4. **Cache**: Nearby places được cache 12h để tiết kiệm API calls

## 📊 Data Example

**Before Submit:**
```json
{
  "title": "Căn hộ đẹp Đà Lạt",
  "address": "80 Dương Quảng Hàm",
  "latitude": 11.945326,
  "longitude": 108.475648,
  "nearbyPlaces": [
    {
      "name": "Làng Vân Square",
      "type": "restaurant",
      "distance": "500m",
      "rating": 4.5,
      "address": "Đường Quảng Hàm, Phường 1",
      "placeId": "ChIJ..."
    },
    {
      "name": "Valley Of Love",
      "type": "attraction",
      "distance": "3.4 km",
      "rating": 4.4,
      "placeId": "ChIJ..."
    }
    // ... 8 more (total 10)
  ]
}
```

**In Database:**
```json
{
  "_id": "...",
  "title": "Căn hộ đẹp Đà Lạt",
  "nearbyPlaces": [
    { "name": "Làng Vân Square", "type": "restaurant", ... },
    { "name": "Valley Of Love", "type": "attraction", ... }
    // ... total 10 places
  ]
}
```

---

## ✅ Summary

**Layout Fix:**
- ✅ Quốc gia & Thành phố nằm ngang cùng hàng
- ✅ Consistent styling với label bold, input h-12

**Auto-Save Feature:**
- ✅ Tự động lưu 10 nearby places khi geocoding thành công
- ✅ Không cần user action, chạy background
- ✅ Lưu vào database cùng listing
- ✅ Fallback to local data nếu API fail
- ✅ Compatible với create & edit listing

**Ready for Production! 🚀**
