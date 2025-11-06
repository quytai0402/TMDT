# Logic Đặt Phòng - LuxeStay

## Trạng Thái Booking

Hệ thống có 4 trạng thái booking chính:

1. **PENDING** - Chờ xác nhận
   - Booking mới được tạo
   - Chưa được host/admin xác nhận
   - **KHÔNG chặn lịch phòng** (cho phép khách khác đặt cùng lúc)
   - Host có thể: CONFIRM hoặc CANCEL
   - Admin có thể: CONFIRM hoặc CANCEL

2. **CONFIRMED** - Đã xác nhận
   - Host/Admin đã xác nhận booking
   - **CHẶN LỊCH PHÒNG** (không cho phép đặt trùng)
   - Tự động hiển thị "không còn phòng" trên calendar
   - Host có thể: CANCEL
   - Admin có thể: CANCEL, COMPLETE, hoặc quay lại PENDING

3. **CANCELLED** - Đã hủy
   - Booking bị hủy bởi host/admin/guest
   - **KHÔNG chặn lịch** (phòng lại available)
   - Admin có thể: Khôi phục về PENDING hoặc CONFIRMED

4. **COMPLETED** - Hoàn thành
   - Booking đã hoàn tất (sau checkout)
   - **CHẶN LỊCH** (giữ lịch sử)
   - Không thể thay đổi trạng thái

## Logic Kiểm Tra Phòng Trống

### Khi Tìm Kiếm / Xem Lịch

Hệ thống **CHỈ** kiểm tra các booking với status:
- ✅ `CONFIRMED`
- ✅ `COMPLETED`

**KHÔNG** kiểm tra:
- ❌ `PENDING` - Vì chưa được xác nhận
- ❌ `CANCELLED` - Vì đã hủy

```typescript
// Example: Search API
status: { in: ['CONFIRMED', 'COMPLETED'] }
```

### Khi Tạo Booking Mới

1. User chọn ngày → Hệ thống kiểm tra:
   - Có booking nào **CONFIRMED** hoặc **COMPLETED** trùng không?
   - Có blocked dates (chặn thủ công) không?

2. Nếu trống → Tạo booking với status **PENDING**
   - Phòng vẫn hiển thị available cho khách khác
   - Chờ host/admin xác nhận

3. Nếu đã kín → Hiển thị lỗi hoặc gợi ý split-stay

## Flow Xác Nhận Booking

### Kịch Bản 1: Host Xác Nhận
```
User đặt phòng (02/11 - 03/11)
  ↓
Status: PENDING
  ↓ Host xác nhận
Status: CONFIRMED
  ↓
✅ Lịch tự động bị chặn
✅ Calendar hiển thị "đã đặt"
✅ User khác không thể đặt cùng ngày
```

### Kịch Bản 2: Booking Bị Từ Chối
```
User A đặt phòng (02/11 - 03/11)
  ↓
Status: PENDING (phòng vẫn available)
  ↓ User B cũng đặt cùng ngày
Status: PENDING (cả 2 đều pending)
  ↓ Host xác nhận User A
User A: CONFIRMED ✅
User B: Vẫn PENDING
  ↓ Host từ chối User B
User B: CANCELLED ❌
```

## Chặn Lịch Thủ Công (Blocked Dates)

Admin/Host có thể chặn ngày thủ công:

```typescript
POST /api/listings/{id}/blocked-dates
{
  "startDate": "2025-11-10",
  "endDate": "2025-11-15",
  "reason": "Bảo trì"
}
```

Hệ thống kiểm tra:
- ✅ Có booking **CONFIRMED** hoặc **COMPLETED** trùng không?
- ❌ **KHÔNG** kiểm tra PENDING (vì chưa chắc chắn)

## Tính Năng Thông Minh

### 1. Real-time Calendar Update
- Khi booking được CONFIRM → Pusher event → Calendar tự động cập nhật
- Không cần refresh trang

### 2. Split-Stay Suggestion
- Nếu một số ngày đã kín → Gợi ý chia thành nhiều booking
- Tìm phòng thay thế cho ngày bị trùng

### 3. Availability Predictor
- AI dự đoán khả năng được confirm dựa vào:
  - Lịch sử host confirm bao nhiêu % booking
  - Thời gian còn lại đến check-in
  - Review score của user

## API Endpoints

### Check Availability
```typescript
GET /api/listings/{id}/availability?checkIn=2025-11-02&checkOut=2025-11-03
```

### Create Booking
```typescript
POST /api/bookings
{
  "listingId": "...",
  "checkIn": "2025-11-02",
  "checkOut": "2025-11-03"
}
// Returns: { status: "PENDING" }
```

### Confirm Booking (Host/Admin)
```typescript
PATCH /api/bookings/{id}/status
{ "status": "CONFIRMED" }
// → Lịch tự động bị chặn
```

### Cancel Booking
```typescript
PATCH /api/bookings/{id}/status
{ "status": "CANCELLED" }
// → Lịch tự động mở lại
```

## Lưu Ý Quan Trọng

⚠️ **PENDING bookings KHÔNG chặn lịch** - Đây là design decision để:
1. Tránh trường hợp user tạo nhiều booking rồi không thanh toán
2. Cho phép host/admin có quyền quyết định cuối cùng
3. Tăng conversion rate (không từ chối khách ngay lập tức)

✅ **CONFIRMED bookings MỚI chặn lịch** - Vì:
1. Host/Admin đã kiểm tra và đồng ý
2. Khách đã thanh toán (hoặc sắp thanh toán)
3. Commitment rõ ràng từ cả 2 phía

---

**Cập nhật lần cuối**: 2/11/2025
