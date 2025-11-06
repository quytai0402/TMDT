# ✅ LOCATION REQUEST SYSTEM - TEST CHECKLIST

## 🎯 Tổng quan
Hệ thống cho phép host đăng ký khu vực mới và admin phê duyệt/từ chối.

---

## 📋 CHECKLIST - Hoàn thành tuần tự

### ✅ Phase 1: Database Migration (COMPLETED)
- [x] Run `npx prisma generate`
- [x] Run `npx prisma db push`
- [x] Collection `location_requests` created
- [x] Indexes created (requestedBy, status)

---

### 🔧 Phase 2: Backend Testing

#### Test 1: Create Location Request (Host)
```bash
# Login as HOST first
POST /api/locations/requests
{
  "city": "Đà Nẵng",
  "state": "Đà Nẵng", 
  "country": "Vietnam",
  "reason": "Tôi có 3 căn villa ở khu vực này và muốn đăng trên LuxeStay"
}

Expected:
✅ Status 201
✅ Request created với status PENDING
✅ Admin nhận notification
✅ Response: { request: {...}, message: "..." }
```

#### Test 2: Get Location Requests (Host)
```bash
GET /api/locations/requests

Expected (as HOST):
✅ Status 200
✅ Chỉ thấy requests của mình
✅ Response: { requests: [...] }
```

#### Test 3: Get Location Requests (Admin)
```bash
GET /api/locations/requests

Expected (as ADMIN):
✅ Status 200
✅ Thấy TẤT CẢ requests
✅ Có thông tin requestedByUser
✅ Response: { requests: [...] }
```

#### Test 4: Approve Request (Admin)
```bash
PATCH /api/locations/requests/{id}
{
  "action": "APPROVED"
}

Expected:
✅ Status 200
✅ Request status → APPROVED
✅ Location mới được tạo trong DB
✅ Host nhận notification "Đã được phê duyệt"
✅ Response: { request: {...}, location: {...}, message: "..." }
```

#### Test 5: Reject Request (Admin)
```bash
PATCH /api/locations/requests/{id}
{
  "action": "REJECTED",
  "rejectionReason": "Khu vực này chưa có nhu cầu"
}

Expected:
✅ Status 200
✅ Request status → REJECTED
✅ rejectionReason được lưu
✅ Host nhận notification với lý do
✅ Response: { request: {...}, message: "..." }
```

#### Test 6: Duplicate Prevention
```bash
# Tạo request cho cùng location 2 lần

Expected:
✅ Lần 1: Success
✅ Lần 2: Status 400, error "You already have a pending request for this location"
```

#### Test 7: Existing Location Check
```bash
# Tạo request cho location đã tồn tại (Hà Nội, TP.HCM)

Expected:
✅ Status 400
✅ Error: "This location already exists"
```

---

### 🎨 Phase 3: Frontend Testing

#### Test 8: Location Request Dialog (Host UI)
**Where**: Anywhere (can be standalone button or in create listing page)

Steps:
1. Click "Đăng ký khu vực mới"
2. Fill form:
   - City: Phú Quốc
   - State: Kiên Giang
   - Country: Vietnam
   - Reason: (type > 20 chars)
3. Click "Gửi yêu cầu"

Expected:
✅ Dialog opens
✅ All fields required validation
✅ Reason minimum 20 chars validation
✅ Loading state during submit
✅ Toast: "Đã gửi yêu cầu"
✅ Dialog closes on success
✅ Form resets

#### Test 9: Admin Locations Page
**URL**: `/admin/locations`

Steps:
1. Navigate to page as ADMIN
2. Check tabs: Chờ duyệt / Đã duyệt / Từ chối
3. View pending request
4. Click "Duyệt" button
5. Confirm approval

Expected:
✅ Page loads với stats cards
✅ Table shows all requests
✅ Tabs work correctly
✅ Approve dialog opens
✅ Shows request details & reason
✅ Success toast
✅ Request moves to "Đã duyệt" tab
✅ Host receives notification

#### Test 10: Rejection Flow
Steps:
1. Click "Từ chối" on pending request
2. Enter rejection reason
3. Submit

Expected:
✅ Rejection dialog opens
✅ Reason field required
✅ Success toast
✅ Request moves to "Từ chối" tab
✅ Rejection reason displayed
✅ Host receives notification with reason

---

### 🔔 Phase 4: Notification Testing

#### Test 11: Admin Notification (On Request)
Login as ADMIN → Host creates request

Expected:
✅ Notification appears in header
✅ Title: "New Location Request"
✅ Body: "Host_Name muốn đăng listing tại City, State, Country"
✅ Click notification → redirects to `/admin/locations`

#### Test 12: Host Notification (On Approve)
Admin approves request → Check host notifications

Expected:
✅ Notification appears
✅ Title: "Location Request Approved"
✅ Body: "Yêu cầu khu vực City, State đã được phê duyệt"
✅ Click → redirects to `/host/listings/create`

#### Test 13: Host Notification (On Reject)
Admin rejects request → Check host notifications

Expected:
✅ Notification appears
✅ Title: "Location Request Rejected"
✅ Body: "Yêu cầu khu vực City, State đã bị từ chối. Lý do: [reason]"
✅ Type: warning/error style

---

### 🔗 Phase 5: Integration Testing

#### Test 14: Location Appears in Listing Form
1. Admin approves "Phú Quốc, Kiên Giang"
2. Host goes to `/host/listings/create`
3. Check location dropdown

Expected:
✅ "Phú Quốc" appears in city options
✅ Can select and create listing
✅ New location works in all flows

#### Test 15: Request Status Persistence
1. Create request
2. Refresh page
3. Check `/admin/locations`

Expected:
✅ Request persists in DB
✅ Status remains PENDING
✅ All data intact

#### Test 16: Permission Checks
Test as different roles:

**GUEST**:
```bash
POST /api/locations/requests
Expected: ❌ Status 403 "Only hosts can request new locations"
```

**HOST**:
```bash
PATCH /api/locations/requests/{id}
Expected: ❌ Status 403 "Only admins can approve/reject"
```

**ADMIN**:
```bash
All endpoints work ✅
```

---

### 📱 Phase 6: UI/UX Polish

#### Test 17: Responsive Design
Check on:
- [ ] Desktop (1920x1080)
- [ ] Tablet (768px)
- [ ] Mobile (375px)

Expected:
✅ Dialog fits screen
✅ Table scrollable on mobile
✅ Buttons stack properly
✅ Text doesn't overflow

#### Test 18: Loading States
- [ ] Dialog submit button shows spinner
- [ ] Admin page shows loading skeleton
- [ ] Approve/Reject buttons disabled during processing

#### Test 19: Error Handling
Test scenarios:
- [ ] Network error during submit
- [ ] Invalid request ID
- [ ] Session expired
- [ ] DB connection error

Expected:
✅ Error toast with clear message
✅ Form doesn't reset
✅ User can retry
✅ No console errors

---

### 🧪 Phase 7: Edge Cases

#### Test 20: Unicode & Special Characters
```bash
City: "Đà Nẵng ⛱️🌊"
State: "Thành phố Hồ Chí Minh"
Reason: "Có dấu tiếng Việt và emoji 🏠"
```

Expected:
✅ All characters saved correctly
✅ Displays properly in UI
✅ No encoding issues

#### Test 21: Long Text Handling
```bash
City: "Very Long City Name That Goes On And On"
Reason: (500 characters)
```

Expected:
✅ Text truncates in table
✅ Full text visible in dialog
✅ No layout breaks

#### Test 22: Multiple Pending Requests
Host creates:
- Request 1: Phú Quốc
- Request 2: Nha Trang
- Request 3: Phú Quốc (again)

Expected:
✅ Request 1: Success
✅ Request 2: Success
✅ Request 3: Error (duplicate)

---

### 🎭 Phase 8: Real-World Scenarios

#### Scenario A: Happy Path
1. Host "John" submits request for "Đà Lạt"
2. Admin "Admin1" sees notification
3. Admin reviews reason, approves
4. John receives notification
5. John creates listing in Đà Lạt
6. Listing appears on search

Expected: ✅ Complete flow works end-to-end

#### Scenario B: Rejection & Re-request
1. Host submits "Sapa"
2. Admin rejects (reason: "Chưa đủ nhu cầu")
3. Host sees rejection notification
4. 1 month later, host submits again với reason tốt hơn
5. Admin approves

Expected: ✅ Can re-request after rejection

#### Scenario C: Multiple Admins
1. Admin1 views pending requests
2. Admin2 approves request
3. Admin1 refreshes page

Expected: ✅ Request updated for all admins

---

## 🐛 Known Issues / Future Improvements

### Potential Issues:
- [ ] Không có pagination cho requests (OK nếu ít requests)
- [ ] Không có search/filter by city/host
- [ ] Không có bulk approve/reject
- [ ] Không có history log of who approved/rejected

### Future Features:
- [ ] Add map view for requested locations
- [ ] Email notification (ngoài in-app)
- [ ] Analytics: Which locations được request nhiều nhất
- [ ] Auto-approve for verified hosts
- [ ] Location popularity score

---

## 📊 Success Criteria

### Must Have (MVP):
- [x] Host có thể submit location request
- [x] Admin có thể approve/reject
- [x] Notifications hoạt động
- [x] Location mới xuất hiện trong listing form
- [x] Duplicate prevention works

### Nice to Have:
- [ ] Email notifications
- [ ] Advanced filtering
- [ ] Analytics dashboard
- [ ] Mobile app support

---

## 🚀 Deployment Checklist

Pre-deployment:
- [x] Run `npx prisma generate`
- [x] Run `npx prisma db push`
- [ ] Test all API endpoints
- [ ] Test frontend flows
- [ ] Check console for errors
- [ ] Test notifications

Post-deployment:
- [ ] Monitor error logs
- [ ] Check notification delivery
- [ ] Verify DB indexes performing well
- [ ] Get user feedback

---

## 📞 Support & Troubleshooting

### If location request fails:
1. Check user role (must be HOST)
2. Check if location already exists
3. Check if pending request exists
4. Check network logs for API errors

### If admin can't approve:
1. Check user role (must be ADMIN)
2. Check request status (must be PENDING)
3. Check if location already created
4. Check server logs

### If notification not received:
1. Check Pusher connection
2. Check notification table in DB
3. Check user's notification settings
4. Try refreshing page

---

**Created**: 2025-02-11  
**Last Updated**: 2025-02-11  
**Status**: ✅ READY FOR TESTING
