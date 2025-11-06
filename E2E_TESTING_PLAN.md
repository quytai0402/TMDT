# 🧪 End-to-End Testing Plan & Component Updates

## 📋 Testing Flow Overview

### Flow 1: Create Listing với Auto-save Nearby Places
```
1. Login as HOST
2. Go to /host/listings/create
3. Fill basic info (title, description, type)
4. Fill location:
   - Quốc gia: Vietnam
   - Thành phố: Đà Lạt (should be locked)
   - Địa chỉ: "80 Dương Quảng Hàm, Phường 1"
5. Wait for geocoding (700ms)
6. Verify:
   ✅ Green success box appears
   ✅ Latitude & Longitude auto-filled
   ✅ Nearby places displayed (5 visible)
   ✅ Console log: "Auto-saving 10 places"
7. Upload images:
   - Click "Upload ảnh từ máy tính"
   - Select 5 images
   - Verify previews show
8. Fill pricing:
   - Giá cơ bản: Type "500000" → See "500,000"
   - Verify no default "0" value
9. Select amenities (at least 1)
10. Click "Gửi để duyệt"
11. Verify:
    ✅ Success toast
    ✅ Redirect to edit page
```

### Flow 2: Admin Approve & View Listing
```
1. Login as ADMIN
2. Go to /admin/listings
3. Find pending listing
4. Verify all data shows:
   ✅ Title, description, type
   ✅ Location with coordinates
   ✅ 5+ images with previews
   ✅ Formatted price: "500,000 VNĐ"
   ✅ Amenities list
   ✅ Nearby places count
5. Click "Approve" → Status: ACTIVE
```

### Flow 3: Guest View Listing Detail
```
1. Go to /listing/[id]
2. Verify display:
   ✅ Image gallery (5+ photos)
   ✅ Price formatted: "500,000 VNĐ/đêm"
   ✅ Description & amenities
   ✅ **Nearby Places Section:**
      - Shows 10 địa điểm lân cận
      - Each place has:
        * Name
        * Type badge (Nhà hàng, Địa điểm du lịch...)
        * Distance (500m, 3.4 km...)
        * Rating (⭐ 4.5)
        * "Chỉ đường" button
   ✅ Map shows listing location
3. Click "Xem thêm" on nearby places
4. Verify all 10 places expand
```

### Flow 4: Search Listings
```
1. Go to /search
2. Search by:
   - Query: "Đà Lạt"
   - Guests: 2
   - Price: 100,000 - 1,000,000
3. Verify results show:
   ✅ Matching listings
   ✅ Formatted prices with commas
   ✅ Preview info
4. Filter by amenities
5. Sort by rating
6. Click listing → Go to detail page
```

---

## 🔧 Component Updates Needed

### 1. Admin Listing Moderation
**File:** `app/admin/listings/page.tsx`

**Update:** Show nearby places count in listing preview

```tsx
// Add to listing card display
<div className="flex items-center gap-2 text-sm text-muted-foreground">
  <MapPin className="h-4 w-4" />
  <span>
    {listing.nearbyPlaces?.length || 0} địa điểm lân cận
  </span>
</div>
```

### 2. Listing Card Component
**File:** `components/listing-card.tsx`

**Update:** Show snippet of nearby places

```tsx
{listing.nearbyPlaces && listing.nearbyPlaces.length > 0 && (
  <div className="flex items-center gap-1 text-xs text-muted-foreground">
    <MapPin className="h-3 w-3" />
    <span>{listing.nearbyPlaces.length} địa điểm lân cận</span>
  </div>
)}
```

### 3. Map View Component
**File:** `components/map-view.tsx`

**Update:** Show nearby places as markers

```tsx
// Add markers for nearby places
{listing.nearbyPlaces?.map((place, idx) => (
  <Marker
    key={`nearby-${idx}`}
    position={{ lat: place.lat, lng: place.lng }}
    icon={{
      url: '/icons/poi-marker.svg',
      scaledSize: new google.maps.Size(20, 20),
    }}
    title={place.name}
  />
))}
```

---

## 🎯 Test Cases

### Test Case 1: Geocoding & Auto-save
**Purpose:** Verify nearby places are automatically saved

**Steps:**
1. Create new listing
2. Enter address: "80 Dương Quảng Hàm, Phường 1"
3. Wait 700ms

**Expected:**
- ✅ Status changes to "Đang tìm tọa độ..."
- ✅ Then "✅ Đã xác định vị trí thành công"
- ✅ Latitude: ~11.945326
- ✅ Longitude: ~108.475648
- ✅ 5 nearby places visible
- ✅ Console: "📍 Nearby: [{name: 'Làng Vân Square'...}, ...]"
- ✅ form.nearbyPlaces has 10 items

**Verify in DB:**
```javascript
db.listings.findOne({id: 'xxx'})
// Should have:
{
  nearbyPlaces: [
    { name: "Làng Vân Square", type: "restaurant", distance: "500m", rating: 4.5 },
    // ... 9 more
  ]
}
```

---

### Test Case 2: Image Upload
**Purpose:** Verify image upload works

**Steps:**
1. Click "Upload ảnh từ máy tính"
2. Select image.jpg (< 10MB)
3. Wait for upload

**Expected:**
- ✅ Button shows "Đang upload..."
- ✅ After 2-3s: Success toast
- ✅ Image preview appears
- ✅ URL starts with "https://i.imgur.com/"
- ✅ Can delete image with ❌ button

**Error Cases:**
- File > 10MB → Error: "Kích thước ảnh không được vượt quá 10MB"
- Non-image file → Error: "File phải là ảnh"

---

### Test Case 3: Price Formatting
**Purpose:** Verify VNĐ formatting

**Steps:**
1. Focus on "Giá cơ bản" input
2. Type: "500000"

**Expected:**
- ✅ Displays: "500,000"
- ✅ Value stored: 500000 (number)

**Steps:**
2. Clear input
3. Verify: Empty (no "0")

**Steps:**
4. Edit existing listing with price 1000000
5. Verify displays: "1,000,000"

---

### Test Case 4: Nearby Places Display
**Purpose:** Verify user can see nearby places

**Steps:**
1. Create listing → Save → Get listing ID
2. Admin approve listing
3. Visit /listing/[id]
4. Scroll to "Địa điểm lân cận" section

**Expected:**
- ✅ Card title: "Địa điểm lân cận" with badge "10 địa điểm"
- ✅ Shows 5 places by default:
  * Each has: Name, Type badge, Distance, Rating
  * "Chỉ đường" button works
- ✅ Button: "Xem thêm (10)"
- ✅ Click → All 10 places visible
- ✅ Button changes to "Thu gọn"

**Old listings (no nearbyPlaces):**
- ✅ Should fetch from API
- ✅ Shows loading state
- ✅ Falls back to local data if API fails

---

### Test Case 5: Admin View All Data
**Purpose:** Verify admin sees complete submission

**Steps:**
1. Login as admin
2. Go to /admin/listings
3. Filter: Status = Pending
4. Click on listing

**Expected Admin Panel:**
```
┌─────────────────────────────────────────────┐
│ [Căn hộ đẹp Đà Lạt]                        │
│                                             │
│ 📸 Images: 5 photos                         │
│ [IMG][IMG][IMG][IMG][IMG]                   │
│                                             │
│ 📍 Location:                                │
│ • Đà Lạt, Vietnam                           │
│ • 80 Dương Quảng Hàm, Phường 1              │
│ • (11.945326, 108.475648)                   │
│ • 10 địa điểm lân cận                       │
│                                             │
│ 💰 Pricing:                                 │
│ • Base: 500,000 VNĐ/đêm                     │
│ • Cleaning: 100,000 VNĐ                     │
│                                             │
│ 🏠 Property:                                │
│ • Type: Villa                               │
│ • Guests: 4 | Beds: 2 | Baths: 1.5          │
│                                             │
│ ✨ Amenities: Wi-Fi, Kitchen, Pool...       │
│                                             │
│ [✅ Approve] [❌ Reject]                     │
└─────────────────────────────────────────────┘
```

---

## 📊 Performance Tests

### Test Case 6: Geocoding Performance
**Steps:**
1. Enter address
2. Measure time from input blur to success

**Expected:**
- ⏱️ Debounce: 700ms
- ⏱️ API call: < 2s
- ⏱️ Total: < 3s
- ✅ Cache hit on repeat: < 100ms

### Test Case 7: Image Upload Performance
**Steps:**
1. Upload 1MB image
2. Measure time

**Expected:**
- ⏱️ Upload: < 5s
- ⏱️ Preview: Immediate after URL received
- ✅ Multiple uploads: Non-blocking

### Test Case 8: Nearby Places Load
**Steps:**
1. Visit listing detail
2. Measure time to show nearby places

**Expected:**
- ✅ From DB: < 100ms (already loaded with listing)
- ✅ From API: < 2s
- ✅ Fallback: < 500ms

---

## 🐛 Edge Cases to Test

### Edge Case 1: Invalid Address
**Steps:** Enter "asdfasdf" as address
**Expected:** Error message, no crash

### Edge Case 2: No Internet During Upload
**Expected:** Error toast, can retry

### Edge Case 3: API Rate Limit
**Expected:** Fallback to local nearby places

### Edge Case 4: Old Listing (no nearbyPlaces field)
**Expected:** Fetch from API, still displays

### Edge Case 5: Price = 0
**Expected:** Validation error, can't submit

### Edge Case 6: Negative Price
**Expected:** Auto-convert to positive or show error

### Edge Case 7: Upload 50 images
**Expected:** Should work (no limit), but warn about performance

### Edge Case 8: Concurrent Edits
**Expected:** Last save wins, show version conflict warning

---

## ✅ Acceptance Criteria

### Must Pass All:

1. **Geocoding:**
   - [x] Auto-fills coordinates on address input
   - [x] Shows 5 nearby places in UI
   - [x] Saves 10 places to database
   - [x] Works with Vietnamese addresses
   - [x] Fallback on API failure

2. **Image Upload:**
   - [x] Upload from computer works
   - [x] Paste URL works
   - [x] Preview displays correctly
   - [x] Delete works
   - [x] Validates file type & size

3. **Price Formatting:**
   - [x] Auto-formats with commas (500,000)
   - [x] No default 0 value
   - [x] Parse correctly on submit
   - [x] Edit mode shows formatted value

4. **Nearby Places Display:**
   - [x] Shows on listing detail page
   - [x] 10 places saved in DB
   - [x] UI shows 5 by default, expand to 10
   - [x] Each place has name, type, distance, rating
   - [x] "Chỉ đường" button works

5. **Admin Review:**
   - [x] Sees all submitted data
   - [x] Can approve/reject
   - [x] Sees nearby places count
   - [x] Images display correctly
   - [x] Prices formatted

---

## 🚀 Quick Test Commands

### Test 1: Create Full Listing
```bash
# Start dev server
npm run dev

# Open browser
open http://localhost:3001/host/listings/create

# Follow Test Case 1 steps
```

### Test 2: Check Database
```javascript
// MongoDB query
db.listings.find({}).limit(1).pretty()

// Should see:
{
  nearbyPlaces: [
    { name: "...", type: "...", distance: "...", rating: ... },
    // 10 items total
  ],
  images: ["https://i.imgur.com/...", ...],
  basePrice: 500000,
  // ...
}
```

### Test 3: Verify API Endpoints
```bash
# Test geocoding
curl http://localhost:3001/api/geocode \
  -H "Content-Type: application/json" \
  -d '{"address":"80 Dương Quảng Hàm","city":"Đà Lạt","country":"Vietnam"}'

# Test nearby places
curl http://localhost:3001/api/nearby-places \
  -H "Content-Type: application/json" \
  -d '{"latitude":11.945326,"longitude":108.475648,"city":"Đà Lạt"}'

# Test image upload
curl -F "file=@test-image.jpg" \
  http://localhost:3001/api/upload/image \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📝 Manual Testing Checklist

### Before Release:

#### Host Features:
- [ ] Create listing flow works end-to-end
- [ ] Edit listing preserves all data
- [ ] Image upload (computer + URL) works
- [ ] Price formatting displays correctly
- [ ] Geocoding finds Vietnamese addresses
- [ ] Nearby places auto-save (check DB)
- [ ] Form validation works
- [ ] Submit button not disabled incorrectly

#### Guest Features:
- [ ] Listing detail shows all info
- [ ] Nearby places visible (10 items)
- [ ] Images display in gallery
- [ ] Prices formatted with commas
- [ ] "Chỉ đường" buttons work
- [ ] Map shows correct location
- [ ] Booking widget works

#### Admin Features:
- [ ] Can see pending listings
- [ ] All host data visible
- [ ] Nearby places count shown
- [ ] Images preview works
- [ ] Can approve/reject
- [ ] Rejection reason required
- [ ] Notification sent to host

#### Performance:
- [ ] Geocoding < 3s
- [ ] Image upload < 5s
- [ ] Page load < 2s
- [ ] No console errors
- [ ] Mobile responsive

---

## 🎉 Success Criteria

**All tests pass when:**

1. ✅ Host can create listing với đầy đủ thông tin
2. ✅ Images upload successfully từ máy tính
3. ✅ Prices hiển thị format "500,000 VNĐ"
4. ✅ Nearby places tự động lưu 10 địa điểm
5. ✅ Guest xem listing thấy đầy đủ nearby places
6. ✅ Admin review listing thấy tất cả data
7. ✅ No errors in console
8. ✅ Mobile responsive OK

**Ready for production! 🚀**
