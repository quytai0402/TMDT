# ✅ Quick Test Checklist

## 🚀 Before Testing
```bash
# Start dev server
npm run dev

# In another terminal, verify it's running
lsof -i :3001
```

---

## 📸 Test 1: Multi-Image Upload (2 phút)

### Steps:
1. Mở http://localhost:3001/host/listings/create
2. Scroll xuống "Hình ảnh"
3. Click nút **"Upload từ máy"**
4. Chọn **3-5 ảnh cùng lúc** (Ctrl/Cmd + Click)
5. Đợi upload hoàn tất

### ✅ Expected:
- ✅ Toast hiện: "Đã upload X ảnh thành công"
- ✅ Tất cả ảnh xuất hiện trong preview grid
- ✅ URLs bắt đầu với `https://i.imgur.com/`

### ❌ Nếu lỗi:
- Check console.log để xem lỗi chi tiết
- Kiểm tra file size < 10MB
- Kiểm tra file type là image (jpg, png, webp...)

---

## 🗺️ Test 2: Địa chỉ thay đổi → Tọa độ thay đổi (3 phút)

### Steps:
1. Mở http://localhost:3001/host/listings/create
2. **Mở Browser Console** (F12 → Console tab)
3. Điền form:
   - **Địa chỉ chi tiết:** `80 Dương Quảng Hàm`
   - **Thành phố:** `Đà Lạt`
   - **Quốc gia:** `Vietnam`
4. Đợi 1 giây → Check console log
5. **Thay đổi địa chỉ:** `100 Nguyễn Văn Trỗi`
6. Đợi 1 giây → Check console log lại

### ✅ Expected Console Output:
```javascript
// Lần 1:
Geocoding check: { signature: "80 Dương Quảng Hàm|Đà Lạt|Vietnam", willGeocode: true }
Starting geocoding for: 80 Dương Quảng Hàm|Đà Lạt|Vietnam
Geocoding result: { latitude: 11.945326, longitude: 108.475648 }

// Lần 2 (sau khi đổi địa chỉ):
Geocoding check: { signature: "100 Nguyễn Văn Trỗi|Đà Lạt|Vietnam", willGeocode: true }
Starting geocoding for: 100 Nguyễn Văn Trỗi|Đà Lạt|Vietnam
Geocoding result: { latitude: 11.XXXXX, longitude: 108.YYYYY } // Khác lần 1
```

### ✅ Expected UI:
- ✅ Latitude/Longitude fields **thay đổi** sau mỗi lần geocoding
- ✅ "Nearby Places" section cập nhật với địa điểm mới
- ✅ Loading spinner xuất hiện khi đang geocoding

### ❌ Nếu lỗi:
- Kiểm tra console có error không
- Verify SerpAPI key còn quota: `c9a780475689b58c630e29cda1d212f581d4417b38afed7dd45922b2b19614f4`
- Thử clear cache: `rm -rf .next && npm run dev`

---

## 🧪 Test 3: API Endpoints (30 giây)

### Steps:
```bash
# Run test script
./test-e2e.sh
```

### ✅ Expected Output:
```
🚀 Starting E2E Tests...

📋 Test Suite: Homestay Booking System
========================================

1️⃣ Testing: Dev Server
✅ PASS: Dev server is running on port 3001

2️⃣ Testing: API Endpoints
✅ PASS: Geocoding API endpoint exists (returned 401)
✅ PASS: Nearby Places API endpoint exists (returned 401)
✅ PASS: Image Upload API endpoint exists (returned 401)

...

📊 Test Summary:
  ✅ Passed: 14+
  ❌ Failed: 0
```

### ❌ Nếu Dev Server FAIL:
```bash
# Start dev server first
npm run dev

# Then run tests again
./test-e2e.sh
```

---

## 🎯 Complete Flow Test (10 phút)

### Steps:
1. **Tạo listing mới**
   - Mở http://localhost:3001/host/listings/create
   - Điền tất cả thông tin (title, description, base price...)
   
2. **Test tất cả features:**
   - ✅ Upload **5 ảnh cùng lúc**
   - ✅ Điền địa chỉ → Verify tọa độ xuất hiện
   - ✅ **Đổi địa chỉ** → Verify tọa độ **thay đổi**
   - ✅ Điền giá 5000000 → Verify hiển thị "5,000,000"
   - ✅ Kiểm tra nearby places hiển thị (10 địa điểm)

3. **Submit form**
   - Click "Create Listing"
   - Verify redirect to listings page
   - Verify toast success message

4. **Verify database**
   ```bash
   # Check MongoDB has nearbyPlaces array with 10 items
   # Check images array has 5 Imgur URLs
   ```

---

## 📊 Success Criteria

### All 3 tests must pass:
- ✅ Multi-image upload works
- ✅ Address change updates coordinates
- ✅ All API endpoints responding

### Bonus checks:
- ✅ Price formatting with commas (500,000)
- ✅ No default "0" in price field
- ✅ Quốc gia & Thành phố side-by-side
- ✅ Nearby places visible on listing detail page

---

## 🐛 Troubleshooting Quick Fixes

### Upload ảnh lỗi:
```typescript
// Check browser console
// Look for: "Upload error:" or "Imgur upload error:"
// Solution: Verify Imgur API key in .env
```

### Geocoding không chạy:
```typescript
// Check console for:
// - "willGeocode: false" → Address chưa đủ dài (min 6 chars)
// - API error → Check SerpAPI quota
```

### Test script fails:
```bash
# Solution 1: Dev server not running
npm run dev

# Solution 2: Port wrong
# Edit test-e2e.sh, line 30: http://localhost:3001

# Solution 3: Permission denied
chmod +x test-e2e.sh
```

---

## ⏱️ Time Budget

| Test | Time | Critical? |
|------|------|-----------|
| Multi-image upload | 2 min | ⭐⭐⭐ |
| Address → Coordinates | 3 min | ⭐⭐⭐ |
| API endpoints | 30 sec | ⭐⭐ |
| Complete flow | 10 min | ⭐⭐⭐ |
| **Total** | **15 min** | |

---

## 🎉 Done!

Nếu tất cả tests ✅ → Ready to deploy! 🚀
