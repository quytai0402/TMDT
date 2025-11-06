# Flow Thanh Toán & Xác Nhận Phòng - LuxeStay

## Tổng Quan Logic

### ✅ ĐÚNG - Logic Hiện Tại

```
User tạo booking → Status: PENDING (phòng VẪN trống)
   ↓
User thanh toán
   ↓
Thanh toán THÀNH CÔNG → Status: CONFIRMED (phòng BỊ CHẶN)
   ↓
✅ Phòng không còn available cho người khác
✅ Calendar tự động cập nhật
✅ Host nhận thông báo booking mới
```

## Chi Tiết Từng Bước

### Bước 1: Tạo Booking

**Khi user click "Yêu cầu đặt phòng":**

```typescript
POST /api/bookings
{
  "listingId": "...",
  "checkIn": "2025-11-02",
  "checkOut": "2025-11-03",
  ...
}

Response:
{
  "booking": {
    "id": "...",
    "status": "PENDING", // ⚠️ Chưa được xác nhận
    ...
  }
}
```

**Trạng thái phòng:**
- ❌ CHƯA bị chặn
- ✅ Vẫn hiển thị available trong search
- ⏳ Chờ thanh toán

---

### Bước 2: Thanh Toán

#### A. Thanh Toán Online (VNPay, MoMo, ZaloPay)

1. **User chọn phương thức thanh toán**
   ```typescript
   POST /api/payments
   {
     "bookingId": "...",
     "paymentMethod": "VNPAY",
     "amount": 1420000
   }
   
   Response:
   {
     "paymentUrl": "https://sandbox.vnpayment.vn/..."
   }
   ```

2. **User được redirect đến cổng thanh toán**
   - Nhập thông tin thẻ
   - Xác nhận OTP
   - VNPay/MoMo xử lý

3. **Callback từ Payment Gateway**
   ```typescript
   // VNPay callback
   GET /api/payments/vnpay/callback?vnp_ResponseCode=00&...
   
   // Trong route handler:
   if (responseCode === '00') {
     // ✅ Thanh toán thành công
     
     // 1. Cập nhật Payment status
     await prisma.payment.update({
       where: { id: paymentId },
       data: {
         status: 'COMPLETED',
         paidAt: new Date()
       }
     })
     
     // 2. 🔒 CẬP NHẬT BOOKING STATUS → CONFIRMED
     await prisma.booking.update({
       where: { id: booking.id },
       data: {
         status: 'CONFIRMED',
         confirmedAt: new Date()
       }
     })
     
     // 3. Tạo transaction
     // 4. Gửi notifications
     // 5. Redirect đến success page
   }
   ```

4. **Kết quả:**
   - ✅ Booking status: `CONFIRMED`
   - 🔒 Phòng BỊ CHẶN (không còn available)
   - 📅 Calendar tự động cập nhật
   - 📧 Email xác nhận gửi cho user & host

---

#### B. Thanh Toán Chuyển Khoản Ngân Hàng (Manual)

1. **User chọn "Chuyển khoản ngân hàng"**
   ```typescript
   // Không gọi API payment gateway
   // Chỉ redirect đến success page với flag pending
   
   router.push(`/booking/success?bookingId=${bookingId}&method=bank&pending=true`)
   ```

2. **Trạng thái booking:**
   - ⚠️ Status: `PENDING` (CHƯA confirmed)
   - ❌ Phòng CHƯA bị chặn
   - ⏳ Chờ admin xác nhận thanh toán

3. **Success page hiển thị:**
   ```
   ⚠️ Đặt phòng đang chờ xác nhận!
   
   Vui lòng chuyển khoản với nội dung: BOOKING-ABC123
   
   Phòng sẽ được xác nhận sau khi chúng tôi nhận được thanh toán.
   ```

4. **Admin xác nhận thanh toán thủ công:**
   ```typescript
   PATCH /api/bookings/{id}/status
   { "status": "CONFIRMED" }
   
   // → Booking status: CONFIRMED
   // → 🔒 Phòng BỊ CHẶN
   // → 📧 User nhận email xác nhận
   ```

---

## So Sánh Các Phương Thức

| Phương thức | Khi nào CONFIRMED? | Phòng bị chặn? |
|-------------|-------------------|----------------|
| **VNPay** | Ngay sau callback thành công | ✅ Tự động |
| **MoMo** | Ngay sau IPN thành công | ✅ Tự động |
| **ZaloPay** | Ngay sau callback thành công | ✅ Tự động |
| **Chuyển khoản** | Sau khi admin xác nhận | ⏳ Thủ công |
| **Thẻ offline** | Sau khi admin xác nhận | ⏳ Thủ công |

---

## Timeline Ví Dụ

### Scenario 1: Thanh Toán VNPay Thành Công

```
10:00 - User A chọn 02/11-03/11 → Tạo booking (PENDING)
        ✅ User B VẪN CÓ THỂ chọn cùng ngày

10:02 - User A thanh toán VNPay thành công
        → Booking A: CONFIRMED
        → 🔒 Phòng BỊ CHẶN

10:03 - User B cố đặt cùng ngày
        → ❌ "Khoảng thời gian này đã có khách đặt và được xác nhận"
```

### Scenario 2: Thanh Toán Chuyển Khoản

```
10:00 - User A chọn 02/11-03/11 → Tạo booking (PENDING)
        ✅ User B VẪN CÓ THỂ chọn cùng ngày

10:02 - User A chọn "Chuyển khoản" → Redirect success page (PENDING)
        ⚠️ Hiển thị: "Đang chờ xác nhận thanh toán"
        ✅ User B VẪN CÓ THỂ đặt

10:05 - User B thanh toán VNPay thành công
        → Booking B: CONFIRMED
        → 🔒 Phòng BỊ CHẶN

10:10 - User A chuyển khoản xong
        → Admin kiểm tra
        → ❌ Không thể confirm vì đã có Booking B

Result: User B được ưu tiên vì thanh toán trước
```

### Scenario 3: Multiple PENDING Bookings

```
10:00 - User A: Booking PENDING (02/11-03/11)
10:01 - User B: Booking PENDING (02/11-03/11)
10:02 - User C: Booking PENDING (02/11-03/11)

→ Cả 3 booking đều PENDING
→ ✅ Phòng vẫn hiển thị available

10:05 - User B thanh toán VNPay thành công
        → Booking B: CONFIRMED 🎉
        → 🔒 Phòng BỊ CHẶN

10:06 - User A cố thanh toán
        → ❌ API trả về lỗi conflict
        → "Phòng đã được đặt bởi khách khác"

10:07 - User C cố thanh toán
        → ❌ Tương tự User A

Result: "First come, first served" - Ai thanh toán trước thì được
```

---

## Xử Lý Edge Cases

### Case 1: User Tạo Nhiều Booking Rồi Bỏ Đi

**Vấn đề:**
- User tạo 10 booking PENDING
- Không thanh toán
- Phòng spam?

**Giải pháp:**
```typescript
// Trong booking API
const pendingBookings = await prisma.booking.count({
  where: {
    guestId: userId,
    status: 'PENDING',
    createdAt: { gte: oneDayAgo }
  }
})

if (pendingBookings >= 3) {
  throw new Error("Bạn có quá nhiều booking chưa thanh toán")
}
```

### Case 2: Payment Timeout

**Vấn đề:**
- User redirect đến VNPay
- Đóng tab / timeout
- Booking PENDING mãi mãi?

**Giải pháp:**
```typescript
// Cron job chạy mỗi giờ
// app/api/cron/expire-bookings/route.ts

const expiredBookings = await prisma.booking.updateMany({
  where: {
    status: 'PENDING',
    createdAt: { lt: thirtyMinutesAgo }
  },
  data: {
    status: 'EXPIRED'
  }
})
```

### Case 3: Host Cancel Confirmed Booking

**Vấn đề:**
- Booking đã CONFIRMED
- Host cancel
- Phòng lại available?

**Giải pháp:**
```typescript
PATCH /api/bookings/{id}/status
{ "status": "CANCELLED" }

// → Booking: CANCELLED
// → 🔓 Phòng TỰ ĐỘNG MỞ LẠI
// → ✅ Available trong search
// → 📧 User nhận email + refund
```

---

## API Endpoints

### Check Availability
```typescript
GET /api/listings/{id}/availability?checkIn=2025-11-02&checkOut=2025-11-03

Response:
{
  "available": true, // Chỉ check CONFIRMED + COMPLETED
  "conflictingBookings": [], // CONFIRMED only
  "blockedDates": []
}
```

### Create Booking
```typescript
POST /api/bookings
{
  "listingId": "...",
  "checkIn": "2025-11-02",
  "checkOut": "2025-11-03"
}

Response:
{
  "booking": {
    "status": "PENDING" // ⚠️ Chưa confirmed
  }
}
```

### Create Payment
```typescript
POST /api/payments
{
  "bookingId": "...",
  "paymentMethod": "VNPAY"
}

Response:
{
  "paymentUrl": "https://..." // Redirect user
}
```

### Payment Callback (Auto)
```typescript
// VNPay
GET /api/payments/vnpay/callback?vnp_ResponseCode=00&...

// MoMo
POST /api/payments/momo/ipn

// → Tự động update booking status
// → 🔒 Chặn phòng
```

### Confirm Booking (Manual - Admin only)
```typescript
PATCH /api/bookings/{id}/status
{ "status": "CONFIRMED" }

// → 🔒 Chặn phòng
// → Gửi notification
```

---

## Notifications

### Khi Booking CONFIRMED

**User nhận:**
```
✅ Đặt phòng thành công!
Mã booking: ABC123
Phòng: Cloudinary...
Ngày: 02/11 - 03/11
```

**Host nhận:**
```
🏠 Đặt phòng mới!
Khách: Quý Tài Trần
Ngày: 02/11 - 03/11
Đã thanh toán: 1.420.000₫
```

**Admin nhận:**
```
💰 Thanh toán mới
Booking ABC123 đã được xác nhận
Platform fee: 120.000₫
```

---

## Testing Checklist

- [ ] User đặt phòng → PENDING → Phòng vẫn available ✅
- [ ] Thanh toán VNPay thành công → CONFIRMED → Phòng bị chặn ✅
- [ ] Thanh toán MoMo thành công → CONFIRMED → Phòng bị chặn ✅
- [ ] Chuyển khoản → PENDING → Success page hiển thị "Chờ xác nhận" ✅
- [ ] 2 user đặt cùng lúc → Ai thanh toán trước thì được ✅
- [ ] Cancel CONFIRMED booking → Phòng mở lại ✅
- [ ] Expired PENDING booking (30 phút) → Tự động cancel ⏳

---

**Cập nhật lần cuối**: 2/11/2025
