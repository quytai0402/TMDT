# 🔧 Form Fields & Image Upload Fixes

## ✅ Đã fix xong 3 vấn đề

### 1. Xóa Giá Trị Mặc Định (Default Values)

#### Fields bị ảnh hưởng:
- ✅ **Vĩ độ (Latitude)** - Không còn hiện 11.9253
- ✅ **Kinh độ (Longitude)** - Không còn hiện 108.4451
- ✅ **Số khách tối đa** - Không còn hiện 1
- ✅ **Phòng ngủ** - Không còn hiện 1
- ✅ **Số giường** - Không còn hiện 1
- ✅ **Phòng tắm** - Không còn hiện 1

#### Code Changes:

**File: `components/host-listing-form.tsx`**

**Default values → 0 thay vì 1:**
```typescript
// Before:
maxGuests: initial?.maxGuests ?? 1,
bedrooms: initial?.bedrooms ?? 1,
beds: initial?.beds ?? 1,
bathrooms: initial?.bathrooms ?? 1,

// After:
maxGuests: initial?.maxGuests ?? 0,
bedrooms: initial?.bedrooms ?? 0,
beds: initial?.beds ?? 0,
bathrooms: initial?.bathrooms ?? 0,
```

**Display logic - ẩn giá trị 0:**
```typescript
// For number fields (guests, bedrooms, beds, bathrooms):
value={field.value && field.value > 0 ? field.value : ""}
onChange={(event) =>
  field.onChange(
    event.target.value === "" ? 0 : Number.parseInt(event.target.value, 10),
  )
}

// For lat/lng:
value={field.value && field.value !== 0 ? field.value : ""}
```

---

### 2. Thêm Placeholders

**Tất cả fields giờ có placeholder:**

| Field | Placeholder |
|-------|------------|
| Số khách tối đa | "Nhập số khách" |
| Phòng ngủ | "Số phòng ngủ" |
| Số giường | "Số giường" |
| Phòng tắm | "Số phòng tắm" |
| Vĩ độ | "Tự động điền từ địa chỉ" |
| Kinh độ | "Tự động điền từ địa chỉ" |

**UI Behavior:**
- Khi form trống → Hiện placeholder
- Khi user nhập số → Placeholder biến mất, hiện số
- Khi user xóa số → Quay lại placeholder (không hiện "0")

**Example:**
```tsx
<Input
  type="number"
  placeholder="Nhập số khách"
  value={field.value && field.value > 0 ? field.value : ""}
  onChange={...}
/>
```

---

### 3. Fix Lỗi Upload Ảnh

#### Problem:
```
Upload failed for "IMG_7044 2.PNG" ":" {}
console.error('Upload failed for', file.name, ':', result)
```

Error object rỗng `{}` → Không biết lỗi gì

#### Root Causes:
1. **Parse JSON trước khi check response.ok** → Nếu response không phải JSON thì crash
2. **Không có error details** từ server
3. **Không log Imgur response** để debug

#### Solutions:

**A. Better Error Handling (Frontend):**
```typescript
// Before:
const result = await response.json()
if (!response.ok) {
  throw new Error(result.error || 'Upload failed')
}

// After:
let result
try {
  result = await response.json()
} catch (parseError) {
  console.error('Failed to parse response for', file.name, ':', parseError)
  throw new Error('Invalid response from server')
}

if (!response.ok) {
  console.error('Upload failed for', file.name, ':', result)
  throw new Error(result.error || result.message || 'Upload failed')
}

if (!result.url) {
  console.error('No URL in response for', file.name, ':', result)
  throw new Error('No URL in response')
}
```

**B. Better Logging (Backend):**

**File: `app/api/upload/image/route.ts`**

```typescript
// Log upload start
console.log(`Uploading image to Imgur: ${file.name} (${file.size} bytes)`)

// Log Imgur errors with details
if (!imgurResponse.ok) {
  const error = await imgurResponse.json()
  console.error('Imgur upload error:', {
    status: imgurResponse.status,
    statusText: imgurResponse.statusText,
    error: error,
  })
  return NextResponse.json(
    { 
      error: 'Failed to upload image to Imgur',
      message: error.data?.error || imgurResponse.statusText,
      details: error
    },
    { status: 500 }
  )
}

// Validate Imgur response
if (!imgurData.data || !imgurData.data.link) {
  console.error('Invalid Imgur response:', imgurData)
  return NextResponse.json(
    { error: 'Invalid response from Imgur' },
    { status: 500 }
  )
}

// Log success
console.log(`Successfully uploaded image: ${imageUrl}`)
```

---

## 🧪 How to Test

### Test 1: Default Values (Empty Form)
1. Go to http://localhost:3000/host/listings/create
2. ✅ Check fields are EMPTY:
   - Vĩ độ: Empty (placeholder visible)
   - Kinh độ: Empty (placeholder visible)
   - Số khách tối đa: Empty (placeholder: "Nhập số khách")
   - Phòng ngủ: Empty (placeholder: "Số phòng ngủ")
   - Số giường: Empty (placeholder: "Số giường")
   - Phòng tắm: Empty (placeholder: "Số phòng tắm")

### Test 2: Lat/Lng Auto-fill
1. Fill address: "80 Dương Quảng Hàm"
2. Fill city: "Đà Lạt"
3. Wait 1 second for geocoding
4. ✅ Vĩ độ & Kinh độ should auto-fill with numbers (not 0)
5. Change address to: "100 Nguyễn Văn Trỗi"
6. Wait 1 second
7. ✅ Vĩ độ & Kinh độ should UPDATE to new coordinates

### Test 3: Number Fields Input
1. Click "Số khách tối đa" field
2. Type "4"
3. ✅ Should show "4" (not "04" or "0")
4. Delete the "4"
5. ✅ Should show placeholder "Nhập số khách" (not "0")
6. Repeat for other number fields

### Test 4: Image Upload (Single & Multiple)

**Setup:** Prepare 3 test images (< 10MB each)

**Test Single Upload:**
1. Click "Upload từ máy"
2. Select 1 image
3. ✅ Check console logs:
   ```
   Uploading image to Imgur: image1.jpg (2048000 bytes)
   Successfully uploaded image: https://i.imgur.com/xxxxx.jpg
   ```
4. ✅ Toast shows: "Đã upload 1 ảnh thành công"
5. ✅ Image appears in preview

**Test Multiple Upload:**
1. Click "Upload từ máy"
2. Select 3 images (Ctrl/Cmd + Click)
3. ✅ Check console logs (3x):
   ```
   Uploading image to Imgur: image1.jpg (2048000 bytes)
   Uploading image to Imgur: image2.png (3072000 bytes)
   Uploading image to Imgur: image3.jpg (1536000 bytes)
   Successfully uploaded image: https://i.imgur.com/xxxxx.jpg
   Successfully uploaded image: https://i.imgur.com/yyyyy.jpg
   Successfully uploaded image: https://i.imgur.com/zzzzz.jpg
   ```
4. ✅ Toast shows: "Đã upload 3 ảnh thành công"
5. ✅ All 3 images appear in preview

**Test Upload Error:**
1. Stop dev server (simulate API error)
2. Try to upload image
3. ✅ Check console shows detailed error:
   ```
   Failed to parse response for image.jpg : SyntaxError: ...
   Upload error for image.jpg: Error: Invalid response from server
   ```
4. ✅ Toast shows: "Không thể upload ảnh. Vui lòng thử lại."

### Test 5: Imgur Rate Limit (if happens)

If you see error like:
```
Imgur upload error: {
  status: 429,
  statusText: 'Too Many Requests',
  error: { data: { error: 'Rate limit exceeded' } }
}
```

**Solution:**
- Wait 1 hour (Imgur free tier: 50 uploads/hour)
- Or use different IMGUR_CLIENT_ID in `.env`

---

## 📊 Expected Behavior Summary

### Empty Form (Create New):
```
Số khách tối đa: [        Nhập số khách       ]
Phòng ngủ:       [        Số phòng ngủ        ]
Số giường:       [        Số giường           ]
Phòng tắm:       [        Số phòng tắm        ]
Vĩ độ:           [  Tự động điền từ địa chỉ   ]
Kinh độ:         [  Tự động điền từ địa chỉ   ]
```

### After Geocoding:
```
Địa chỉ chi tiết: [80 Dương Quảng Hàm         ]
Thành phố:        [Đà Lạt                     ]
Vĩ độ:            [11.945326                  ] ← Auto-filled
Kinh độ:          [108.475648                 ] ← Auto-filled
```

### After User Input:
```
Số khách tối đa: [4                           ]
Phòng ngủ:       [2                           ]
Số giường:       [3                           ]
Phòng tắm:       [1.5                         ]
```

---

## 🔍 Debug Guide

### Issue: Lat/Lng still shows 11.9253
**Check:**
1. Browser cached old form values?
   - Solution: Hard refresh (Ctrl+F5)
2. Initial data has lat/lng?
   - Check: `initialData?.latitude`
   - Solution: Create NEW listing (not edit existing)

### Issue: Upload always fails
**Check console logs for:**

1. **"Unauthorized" (401)**
   - Not logged in
   - Solution: Login first

2. **"Invalid response from server"**
   - Dev server crashed
   - Solution: Check terminal, restart `npm run dev`

3. **"Rate limit exceeded" (429)**
   - Imgur free tier limit (50/hour)
   - Solution: Wait 1 hour or change Client ID

4. **"Failed to upload image to Imgur"**
   - Check terminal logs for Imgur API response
   - Check network tab for actual error

### Issue: Placeholders not showing
**Check:**
1. Field has value 0?
   - Look at form state in React DevTools
2. CSS hiding placeholder?
   - Inspect element, check `::placeholder` styles

---

## 📝 Technical Notes

### Why `disabled` for Lat/Lng?
```tsx
<Input
  type="number"
  placeholder="Tự động điền từ địa chỉ"
  value={field.value && field.value !== 0 ? field.value : ""}
  disabled  // ← Prevents manual editing
/>
```

**Reasons:**
- Prevents user from entering invalid coordinates
- Makes it clear these are auto-filled
- Users should change address, not coordinates directly

### Why `value > 0` not `value !== 0`?
```typescript
// For number fields:
value={field.value && field.value > 0 ? field.value : ""}

// For lat/lng:
value={field.value && field.value !== 0 ? field.value : ""}
```

**Reason:**
- Latitude/Longitude can be negative (e.g., -33.8688 for Sydney)
- Guest count, bedrooms, etc. cannot be negative
- Using `> 0` for counts ensures we hide both 0 and undefined
- Using `!== 0` for coordinates allows negative values

---

## 🎯 Success Criteria

All 3 fixes working:
- ✅ Form fields empty on create (no default 1 or 0)
- ✅ Placeholders visible when empty
- ✅ Lat/Lng auto-fill when address entered
- ✅ Image upload shows detailed errors in console
- ✅ Multiple images can be uploaded at once
- ✅ Success/failure counts shown in toast

---

## 📁 Files Modified

1. **`components/host-listing-form.tsx`**
   - Default values: 1 → 0
   - Display logic: Hide 0 values
   - Placeholders added
   - Upload error handling improved
   - Lat/Lng fields disabled

2. **`app/api/upload/image/route.ts`**
   - Better error logging
   - Imgur response validation
   - Success logging

---

## 🚀 Ready to Test!

Run these commands:
```bash
# Make sure dev server running
npm run dev

# Open in browser
open http://localhost:3000/host/listings/create

# Try creating a new listing with:
# - Empty form (check placeholders)
# - Enter address (check lat/lng auto-fill)
# - Upload multiple images (check all succeed)
```
