# 🧪 Manual Testing Guide - Step by Step

## ✅ Prerequisites
- Dev server running: `npm run dev` (http://localhost:3001)
- Browser: Chrome/Firefox (latest version)
- Test account: HOST role
- MongoDB connected

---

## 🎯 Test Flow 1: Create Listing End-to-End

### Step 1: Login & Navigate
```
1. Open: http://localhost:3001
2. Click "Đăng nhập"
3. Login with HOST account:
   - Email: host@example.com
   - Password: (your password)
4. Navigate to: http://localhost:3001/host/listings/create
```

**Expected:**
- ✅ Redirected to create listing form
- ✅ Form loads without errors

---

### Step 2: Fill Basic Info
```
1. Tiêu đề: "Villa đẹp view Hồ Xuân Hương"
2. Mô tả: (at least 50 characters)
   "Căn villa sang trọng với view tuyệt đẹp nhìn ra Hồ Xuân Hương. 
    Phòng ngủ rộng rãi, đầy đủ tiện nghi. Gần trung tâm Đà Lạt."
3. Loại hình: Villa
4. Phòng: Toàn bộ chỗ ở
5. Số khách: 4
6. Phòng ngủ: 2
7. Giường: 2
8. Phòng tắm: 1.5
```

**Expected:**
- ✅ All fields accept input
- ✅ No validation errors

---

### Step 3: Fill Location (KEY TEST!)
```
1. Quốc gia: "Vietnam" (should be pre-filled)
2. Thành phố / Tỉnh: "Đà Lạt" (LOCKED with gradient bg)
3. Địa chỉ chi tiết: "80 Dương Quảng Hàm, Phường 1"
4. WAIT 700ms (debounce)
```

**Expected Results:**

**Loading State (after 700ms):**
```
┌────────────────────────────────────────┐
│ ⏳ Đang tìm tọa độ và địa điểm lân cận... │
└────────────────────────────────────────┘
```

**Success State (after 1-3s):**
```
┌────────────────────────────────────────┐
│ ✅ Đã xác định vị trí thành công       │
│ 80 Dương Quảng Hàm, Phường 1, Đà Lạt  │
└────────────────────────────────────────┘

Vĩ độ: 11.945326  (auto-filled)
Kinh độ: 108.475648  (auto-filled)

┌────────────────────────────────────────┐
│ Địa điểm lân cận          🏷️ 10 địa điểm │
│                                        │
│ 📍 Làng Vân Square                     │
│    500m • Nhà hàng ⭐ 4.5              │
│                                        │
│ 📍 Valley Of Love                      │
│    3.4 km • Địa điểm du lịch ⭐ 4.4    │
│                                        │
│ ... (showing 5, total 10 saved)       │
│                                        │
│ [+ Thêm địa điểm thủ công         ]   │
└────────────────────────────────────────┘
```

**Console Verification:**
```javascript
// Open DevTools (F12) → Console
// Should see:
🗺️ Geocoding: 80 Dương Quảng Hàm, Đà Lạt, Vietnam
✅ Found coordinates: 11.945326, 108.475648
📍 Searching nearby places...
✅ Found 12 places from SerpAPI
📊 Auto-saving top 10 to form...
✅ form.nearbyPlaces updated with 10 places
```

**CRITICAL CHECKS:**
- ✅ Latitude & Longitude auto-filled
- ✅ Green success box appears
- ✅ 5 nearby places visible in UI
- ✅ Console shows "Auto-saving 10 places"
- ✅ No errors in console

---

### Step 4: Upload Images (KEY TEST!)
```
1. Method A: Upload from computer
   - Click "🔼 Upload ảnh từ máy tính"
   - Select image file (JPG/PNG < 10MB)
   - Wait 2-5s for upload

2. Method B: Paste URL
   - Paste: https://images.unsplash.com/photo-1564013799919-ab600027ffc6
   - Click "Thêm URL"

3. Repeat until 5+ images
```

**Expected:**

**Upload from computer:**
```
Button: [⏳ Đang upload...]
↓ (2-3s)
✅ Toast: "Đã upload ảnh: image.jpg"
┌──────────┐
│          │
│  IMG 1   │  ← Preview appears
│    ❌    │  ← Delete button on hover
└──────────┘
URL: https://i.imgur.com/xxxxx.jpg
```

**Paste URL:**
```
✅ Toast: "Đã thêm ảnh từ URL"
Preview appears immediately
```

**CRITICAL CHECKS:**
- ✅ Upload shows loading state
- ✅ Preview displays after upload
- ✅ Image URL starts with "https://i.imgur.com/"
- ✅ Can delete image with ❌
- ✅ Counter shows: "5 ảnh đã thêm"

---

### Step 5: Fill Pricing (KEY TEST!)
```
1. Giá cơ bản:
   - Type: "500000"
   - Should display: "500,000"
   
2. Phí dọn dẹp:
   - Type: "100000"
   - Should display: "100,000"
```

**Expected:**

**As you type:**
```
Input: 5       → Display: "5"
Input: 50      → Display: "50"
Input: 500     → Display: "500"
Input: 5000    → Display: "5,000"
Input: 50000   → Display: "50,000"
Input: 500000  → Display: "500,000"
```

**When empty:**
```
Field is empty (NO default "0")
Placeholder: "VD: 500,000"
```

**CRITICAL CHECKS:**
- ✅ Auto-formats with commas: 500,000
- ✅ No default "0" value on focus
- ✅ Placeholder helpful: "VD: 500,000"
- ✅ Can clear to empty (not forced to 0)

---

### Step 6: Select Amenities
```
1. Check at least 3:
   - ✅ Wi-Fi tốc độ cao
   - ✅ Điều hòa
   - ✅ Bếp riêng
```

**Expected:**
- ✅ Checkboxes work
- ✅ Visual feedback on hover

---

### Step 7: Submit (KEY TEST!)
```
1. Scroll to bottom
2. Click "Gửi để duyệt"
```

**Expected:**

**Loading State:**
```
Button: [⏳ Đang lưu...]
```

**Success:**
```
✅ Toast: "Đã gửi listing để duyệt"
↓
Redirect to: /host/listings/[id]/edit
```

**CRITICAL CHECKS:**
- ✅ Button works (not disabled)
- ✅ Success toast appears
- ✅ Redirects to edit page
- ✅ No errors in console

---

### Step 8: Verify Database
```
Open MongoDB Compass:
1. Database: homestay
2. Collection: listings
3. Find latest listing
```

**Expected Document:**
```json
{
  "_id": "...",
  "title": "Villa đẹp view Hồ Xuân Hương",
  "address": "80 Dương Quảng Hàm, Phường 1",
  "city": "Đà Lạt",
  "latitude": 11.945326,
  "longitude": 108.475648,
  "basePrice": 500000,
  "cleaningFee": 100000,
  "images": [
    "https://i.imgur.com/xxxxx.jpg",
    "https://i.imgur.com/yyyyy.jpg",
    // ... 5+ images
  ],
  "nearbyPlaces": [
    {
      "name": "Làng Vân Square",
      "type": "restaurant",
      "distance": "500m",
      "rating": 4.5,
      "placeId": "ChIJ..."
    },
    // ... 9 more (TOTAL 10)
  ],
  "status": "PENDING",
  "createdAt": "..."
}
```

**CRITICAL CHECKS:**
- ✅ nearbyPlaces has exactly 10 items
- ✅ Each place has: name, type, distance, rating
- ✅ Images are Imgur URLs
- ✅ Prices are numbers (not strings)

---

## 🎯 Test Flow 2: Admin Review

### Step 1: Login as Admin
```
1. Logout
2. Login with ADMIN account
3. Go to: http://localhost:3001/admin/listings
4. Filter: Status = Pending
```

**Expected:**
- ✅ See newly created listing

---

### Step 2: Verify All Data Displayed
```
Click on listing
```

**Expected Admin View:**
```
┌─────────────────────────────────────────┐
│ Villa đẹp view Hồ Xuân Hương           │
│ Status: PENDING 🟡                      │
│                                         │
│ 📸 Ảnh: 5 photos                        │
│ [IMG][IMG][IMG][IMG][IMG]               │
│                                         │
│ 📍 Vị trí:                              │
│ • Đà Lạt, Vietnam                       │
│ • 80 Dương Quảng Hàm, Phường 1          │
│ • (11.945326, 108.475648)               │
│ • 10 địa điểm lân cận ✅                │
│                                         │
│ 💰 Giá:                                 │
│ • Cơ bản: 500,000 VNĐ/đêm               │
│ • Dọn dẹp: 100,000 VNĐ                  │
│                                         │
│ 🏠 Chi tiết:                            │
│ • Villa • 4 khách • 2 phòng ngủ         │
│                                         │
│ ✨ Tiện nghi: Wi-Fi, Điều hòa, Bếp      │
│                                         │
│ [✅ Phê duyệt] [❌ Từ chối]             │
└─────────────────────────────────────────┘
```

**CRITICAL CHECKS:**
- ✅ All images display
- ✅ Prices formatted: "500,000 VNĐ"
- ✅ Nearby places count visible
- ✅ Coordinates shown
- ✅ All amenities listed

---

### Step 3: Approve Listing
```
1. Click "Phê duyệt" (Approve)
2. Confirm
```

**Expected:**
- ✅ Status changes to ACTIVE
- ✅ Success toast
- ✅ Listing appears in public search

---

## 🎯 Test Flow 3: Guest View Listing

### Step 1: Navigate to Listing
```
1. Logout (or use incognito)
2. Go to: http://localhost:3001/listing/[id]
   (or search and click listing)
```

**Expected Page:**
```
┌─────────────────────────────────────────┐
│ [Image Gallery - 5+ photos]             │
│                                         │
│ Villa đẹp view Hồ Xuân Hương           │
│ ⭐ 5.0 (0 đánh giá) • Đà Lạt, Vietnam  │
│                                         │
│ [Host Info] [Booking Widget]            │
│                                         │
│ 📝 Mô tả...                             │
│                                         │
│ ✨ Tiện nghi: Wi-Fi, Điều hòa, Bếp     │
│                                         │
│ 📍 Địa điểm lân cận      🏷️ 10 địa điểm │ ← KEY SECTION!
│                                         │
│ 📍 Làng Vân Square                      │
│    500m • Nhà hàng ⭐ 4.5               │
│    [🧭 Chỉ đường]                       │
│                                         │
│ 📍 Valley Of Love                       │
│    3.4 km • Địa điểm du lịch ⭐ 4.4     │
│    [🧭 Chỉ đường]                       │
│                                         │
│ 📍 Khu du lịch Thác Datanla            │
│    3.5 km • Địa điểm du lịch ⭐ 4.4     │
│    [🧭 Chỉ đường]                       │
│                                         │
│ ... (2 more shown)                      │
│                                         │
│        [▼ Xem thêm (10)]                │ ← Click here
│                                         │
│ 🗺️ Map (location marker)                │
│                                         │
│ 💬 Reviews section...                   │
└─────────────────────────────────────────┘
```

---

### Step 2: Verify Nearby Places (CRITICAL!)
```
1. Scroll to "Địa điểm lân cận"
2. Count visible places: Should be 5
3. Click "Xem thêm (10)"
4. Count visible places: Should be 10
5. Click "Chỉ đường" button
```

**Expected:**
- ✅ Shows 5 places by default
- ✅ Badge shows "10 địa điểm"
- ✅ Each place has:
  * Name (e.g., "Làng Vân Square")
  * Type badge (e.g., "Nhà hàng")
  * Distance (e.g., "500m")
  * Rating (e.g., "⭐ 4.5")
  * "Chỉ đường" button
- ✅ Click "Xem thêm" → All 10 places visible
- ✅ Button changes to "Thu gọn"
- ✅ "Chỉ đường" opens Google Maps in new tab

---

### Step 3: Test Price Display
```
Check booking widget
```

**Expected:**
```
┌─────────────────────┐
│ 500,000 VNĐ / đêm   │ ← Formatted with comma!
│                     │
│ Check-in: [date]    │
│ Check-out: [date]   │
│                     │
│ Tổng cộng:          │
│ • 2 đêm × 500,000   │
│ • Phí dọn: 100,000  │
│ ─────────────────   │
│ Total: 1,100,000 VNĐ│
│                     │
│ [Đặt phòng]         │
└─────────────────────┘
```

**CRITICAL CHECKS:**
- ✅ Price formatted: "500,000 VNĐ"
- ✅ All numbers have commas
- ✅ Total calculated correctly

---

## 🎯 Test Flow 4: Search Listings

### Step 1: Search
```
1. Go to: http://localhost:3001/search
2. Search: "Đà Lạt"
3. Filters:
   - Guests: 2
   - Price: 100,000 - 1,000,000
```

**Expected:**
- ✅ Listing appears in results
- ✅ Card shows:
  * Title
  * Location
  * Price: "500,000₫ / đêm"
  * Rating
  * Image thumbnail
  * "10 địa điểm" badge (if ListingCard updated)

---

## 📊 Checklist Summary

### Must Pass All:

#### Geocoding & Nearby Places:
- [ ] Address input triggers geocoding
- [ ] Loading state shows
- [ ] Success state with coordinates
- [ ] 5 nearby places visible in form
- [ ] Console logs "Auto-saving 10 places"
- [ ] Database has 10 places in nearbyPlaces field

#### Image Upload:
- [ ] "Upload ảnh từ máy tính" button works
- [ ] File selector opens
- [ ] Upload shows loading state
- [ ] Preview appears after upload
- [ ] URL is Imgur link
- [ ] Can delete image
- [ ] Paste URL also works

#### Price Formatting:
- [ ] Type "500000" → Shows "500,000"
- [ ] No default "0" on new listing
- [ ] Edit mode shows formatted price
- [ ] Clear field → Empty (not 0)

#### Nearby Places Display:
- [ ] Listing detail shows section
- [ ] 5 places visible by default
- [ ] "Xem thêm (10)" button works
- [ ] All 10 places expand correctly
- [ ] Each place has complete info
- [ ] "Chỉ đường" buttons work

#### Admin Review:
- [ ] Can see pending listing
- [ ] All data displays correctly
- [ ] Images show in preview
- [ ] Prices formatted
- [ ] Nearby places count shown
- [ ] Can approve listing

---

## 🐛 Common Issues & Solutions

### Issue 1: Geocoding not working
**Solution:** Check console for errors, verify SerpAPI key

### Issue 2: Images not uploading
**Solution:** Check Imgur API status, file size < 10MB

### Issue 3: Nearby places not showing
**Solution:** Check if listing.nearbyPlaces exists in DB

### Issue 4: Prices showing as "0"
**Solution:** Clear form, refresh page, try again

---

## ✅ Success Criteria

**All tests pass when:**
1. ✅ Can create listing with all features
2. ✅ Images upload successfully
3. ✅ Prices format correctly
4. ✅ 10 nearby places auto-save to DB
5. ✅ Guest sees nearby places on listing page
6. ✅ Admin can review and approve
7. ✅ No console errors
8. ✅ Mobile responsive

**Ready for production! 🚀**
