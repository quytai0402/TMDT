# Hệ Thống Quản Lý Booking Hoàn Chỉnh - LuxeStay

## 🎯 Tổng Quan

Hệ thống cho phép user:
1. **Thay đổi ngày đặt phòng** với phí linh hoạt dựa trên membership
2. **Hủy booking** với chính sách hoàn tiền dựa trên membership
3. **Nhận thông báo real-time** về tất cả thay đổi
4. **Host được thông báo** về mọi hành động của guest

---

## 📋 API Endpoints

### 1. Thay Đổi Ngày (Reschedule)

```typescript
POST /api/bookings/{id}/reschedule

Body:
{
  "newCheckIn": "2025-11-10",
  "newCheckOut": "2025-11-12",
  "reason": "Lý do thay đổi (optional)"
}

Response:
{
  "booking": {...},
  "rescheduleFee": 0,        // Phí thay đổi
  "priceDifference": 100000, // Chênh lệch giá
  "freeReschedule": true,    // Có miễn phí không
  "message": "Booking rescheduled successfully"
}
```

**Logic Phí Thay Đổi:**

| Membership Tier | Thời Gian | Phí |
|----------------|-----------|-----|
| **Bronze/Không có** | > 7 ngày | Miễn phí |
| **Bronze/Không có** | 2-7 ngày | 5% |
| **Bronze/Không có** | < 48h | 10% |
| **Gold/Platinum/Diamond** | Mọi lúc | **Miễn phí** ⭐ |

**Kiểm Tra:**
- ✅ Ngày mới phải sau ngày hiện tại
- ✅ Check-out phải sau check-in  
- ✅ Kiểm tra phòng còn trống
- ✅ Kiểm tra blocked dates
- ✅ Tính lại giá dựa trên số đêm mới

**Thông Báo:**
- ✅ Host nhận notification: "Khách đã đổi ngày..."
- ✅ Guest nhận confirmation: "Đã thay đổi ngày thành công..."

---

### 2. Hủy Booking (Cancel)

```typescript
POST /api/bookings/{id}/cancel

Body:
{
  "reason": "Lý do hủy *"
}

Response:
{
  "booking": {...},
  "refundAmount": 1420000,          // Số tiền hoàn
  "refundPercentage": 100,          // % hoàn
  "membershipBenefitApplied": true, // Đã dùng quyền lợi
  "message": "Booking cancelled successfully"
}
```

**Chính Sách Hoàn Tiền:**

#### A. FLEXIBLE

| Membership | Điều Kiện | Hoàn Tiền |
|-----------|-----------|-----------|
| **Không có/Bronze** | Hủy trước 24h | 100% |
| **Không có/Bronze** | Hủy < 24h | 0% |
| **Silver+** | Hủy trước 12h | 100% ⭐ |
| **Silver+** | Hủy < 12h | 0% |

#### B. MODERATE

| Membership | Điều Kiện | Hoàn Tiền |
|-----------|-----------|-----------|
| **Không có/Bronze** | Hủy trước 5 ngày | 100% |
| **Không có/Bronze** | Hủy < 5 ngày | 50% |
| **Silver+** | Hủy trước 3 ngày | 100% ⭐ |
| **Silver+** | Hủy < 3 ngày | 75% ⭐ |

#### C. STRICT

| Membership | Điều Kiện | Hoàn Tiền |
|-----------|-----------|-----------|
| **Không có/Bronze** | Hủy trước 7 ngày | 100% |
| **Không có/Bronze** | Hủy < 7 ngày | 0% |
| **Silver+** | Hủy trước 7 ngày | 100% |
| **Silver+** | Hủy < 7 ngày | 50% ⭐ |

#### D. SUPER_STRICT

| Membership | Điều Kiện | Hoàn Tiền |
|-----------|-----------|-----------|
| **Không có/Bronze** | Hủy trước 14 ngày | 50% |
| **Không có/Bronze** | Hủy < 14 ngày | 0% |
| **Silver+** | Hủy trước 14 ngày | 75% ⭐ |
| **Silver+** | Hủy < 14 ngày | 50% ⭐ |

**Thông Báo:**
- ✅ Host nhận: "Khách đã hủy đặt phòng... Hoàn tiền: X₫"
- ✅ Guest nhận confirmation với số tiền hoàn

---

## 🎨 UI Components

### BookingActionsDialog Component

```tsx
import { BookingActionsDialog } from "@/components/booking-actions-dialog"

// Sử dụng trong trip detail page
const [dialogMode, setDialogMode] = useState<"reschedule" | "cancel" | null>(null)

<BookingActionsDialog
  booking={bookingData}
  open={dialogMode !== null}
  onOpenChange={(open) => !open && setDialogMode(null)}
  mode={dialogMode!}
  onSuccess={() => {
    // Reload booking data
    fetchBooking()
  }}
/>

// Trigger buttons
<Button onClick={() => setDialogMode("reschedule")}>
  Thay đổi ngày
</Button>

<Button 
  variant="destructive" 
  onClick={() => setDialogMode("cancel")}
>
  Hủy phòng
</Button>
```

**Features:**
- ✅ Hiển thị membership benefits
- ✅ Preview phí/hoàn tiền trước khi confirm
- ✅ Date picker cho reschedule
- ✅ Textarea cho reason
- ✅ Real-time validation

---

## 🔔 Notification System

### Thông Báo Cho Host

#### 1. Guest Reschedule
```
📅 Khách đã thay đổi ngày đặt phòng

Quý Tài Trần đã đổi ngày đặt phòng ABC123 
từ 02/11/2025 - 03/11/2025 
sang 05/11/2025 - 06/11/2025.
Lý do: Có việc đột xuất.

[Xem chi tiết] → /host/bookings/ABC123
```

#### 2. Guest Cancel
```
❌ Khách đã hủy đặt phòng

Quý Tài Trần đã hủy đặt phòng ABC123 
cho "Cloudinary Villa".
Hoàn tiền: 1.300.000₫
Lý do: Không thể sắp xếp được lịch.

[Xem chi tiết] → /host/bookings/ABC123
```

### Thông Báo Cho Guest

#### 1. Reschedule Success
```
✅ Đã thay đổi ngày đặt phòng

Bạn đã thay đổi ngày đặt phòng ABC123 thành công.
Ngày mới: 05/11/2025 - 06/11/2025
Miễn phí thay đổi - Quyền lợi Membership

[Xem chi tiết] → /trips/ABC123
```

#### 2. Cancel Confirmation
```
✅ Đã hủy đặt phòng

Booking ABC123 đã được hủy thành công.
Hoàn tiền: 1.420.000₫ (100%)
Tiền sẽ được hoàn về tài khoản trong 3-5 ngày.

[Xem chi tiết] → /trips/ABC123
```

---

## 💎 Membership Benefits

### Bronze (Miễn phí)
- ❌ Không có quyền lợi đặc biệt
- Chính sách hoàn tiền tiêu chuẩn
- Phí thay đổi ngày: 5-10%

### Silver
- ✅ **Hoàn tiền cao hơn** khi hủy
- ✅ Thời gian hủy linh hoạt hơn
- Phí thay đổi ngày: 5-10%

### Gold
- ✅ **Hoàn tiền cao hơn** khi hủy
- ✅ **Thay đổi ngày MIỄN PHÍ** ⭐
- ✅ Không giới hạn số lần thay đổi

### Platinum
- ✅ **Hoàn tiền cao hơn** khi hủy
- ✅ **Thay đổi ngày MIỄN PHÍ** ⭐
- ✅ Hủy linh hoạt đến 12h trước check-in

### Diamond
- ✅ **Hoàn tiền tối đa** trong mọi trường hợp
- ✅ **Thay đổi ngày MIỄN PHÍ** ⭐
- ✅ Hủy siêu linh hoạt
- ✅ Priority support

---

## 🔒 Security & Validation

### Kiểm Tra Quyền

```typescript
// Chỉ guest mới được reschedule
if (booking.guestId !== session.user.id) {
  return { error: 'Only guest can reschedule booking' }
}

// Cả guest và host đều có thể cancel
if (booking.guestId !== session.user.id && booking.hostId !== session.user.id) {
  return { error: 'Forbidden' }
}
```

### Kiểm Tra Trạng Thái

```typescript
// Không thể thay đổi/hủy booking đã hoàn thành
if (booking.status === 'COMPLETED' || booking.status === 'CANCELLED') {
  return { error: 'Cannot modify completed/cancelled booking' }
}

// Không thể thay đổi/hủy booking đã bắt đầu
if (booking.checkIn < new Date()) {
  return { error: 'Cannot modify booking that has already started' }
}
```

### Kiểm Tra Availability (Reschedule)

```typescript
// Check conflicting bookings
const conflict = await prisma.booking.findFirst({
  where: {
    listingId: booking.listingId,
    id: { not: booking.id },
    status: { in: ['CONFIRMED', 'COMPLETED'] },
    // Overlap logic...
  }
})

// Check blocked dates
const blocked = await prisma.blockedDate.findFirst({
  where: {
    listingId: booking.listingId,
    startDate: { lt: newCheckOut },
    endDate: { gt: newCheckIn },
  }
})
```

---

## 📊 Tracking & Analytics

### Metadata Lưu Trong Booking

```typescript
metadata: {
  // Reschedule history
  rescheduled: true,
  rescheduleHistory: [
    {
      oldCheckIn: "2025-11-02T...",
      oldCheckOut: "2025-11-03T...",
      newCheckIn: "2025-11-05T...",
      newCheckOut: "2025-11-06T...",
      rescheduleFee: 0,
      reason: "Có việc đột xuất",
      rescheduledAt: "2025-11-01T..."
    }
  ],
  
  // Cancellation info
  membershipBenefitApplied: true,
  cancellationPolicy: "MODERATE",
  hoursUntilCheckIn: 120
}
```

### Transactions

```typescript
// Reschedule fee transaction
await prisma.transaction.create({
  data: {
    userId: guest.id,
    type: 'RESCHEDULE_FEE',
    amount: 142000,
    currency: 'VND',
    status: 'PENDING',
    referenceId: booking.id,
    description: 'Reschedule fee for booking ABC123'
  }
})
```

---

## 🧪 Testing Scenarios

### Scenario 1: Gold Member Reschedule (Miễn Phí)

```
User: Gold member
Booking: 02/11 - 03/11 (1.420.000₫)
Action: Đổi sang 10/11 - 11/11
Time: 3 ngày trước check-in

Expected:
✅ Reschedule fee: 0₫
✅ Notification: "Miễn phí thay đổi - Quyền lợi Membership"
✅ Host nhận notification với ngày mới
✅ Phòng available 02/11-03/11
✅ Phòng bị chặn 10/11-11/11
```

### Scenario 2: Bronze Member Cancel < 48h

```
User: Bronze member  
Booking: 02/11 - 03/11 (1.420.000₫)
Cancellation Policy: MODERATE
Action: Hủy ngày 31/10 (< 48h)
Time: 30 giờ trước check-in

Expected:
✅ Refund: 50% = 710.000₫
❌ Không có membership benefit
✅ Host nhận notification
✅ Phòng tự động available lại
```

### Scenario 3: Platinum Member Cancel Early

```
User: Platinum member
Booking: 02/11 - 03/11 (1.420.000₫)
Cancellation Policy: STRICT
Action: Hủy ngày 20/10
Time: 13 ngày trước check-in

Expected:
✅ Refund: 100% = 1.420.000₫
✅ Membership benefit applied
✅ Email confirmation gửi về
✅ Transaction record created
```

---

## 🎯 Tích Hợp Vào UI

### Trong Trip Detail Page

```tsx
'use client'

import { useState } from 'react'
import { BookingActionsDialog } from '@/components/booking-actions-dialog'
import { Button } from '@/components/ui/button'
import { Calendar, X } from 'lucide-react'

export default function TripDetailPage() {
  const [booking, setBooking] = useState(...)
  const [actionMode, setActionMode] = useState<'reschedule' | 'cancel' | null>(null)

  const canModify = 
    booking.status !== 'CANCELLED' && 
    booking.status !== 'COMPLETED' &&
    new Date(booking.checkIn) > new Date()

  return (
    <div>
      {/* Booking info... */}
      
      {canModify && (
        <div className="flex gap-2 mt-4">
          <Button 
            variant="outline"
            onClick={() => setActionMode('reschedule')}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Thay đổi ngày
          </Button>
          
          <Button 
            variant="destructive"
            onClick={() => setActionMode('cancel')}
          >
            <X className="mr-2 h-4 w-4" />
            Hủy phòng
          </Button>
        </div>
      )}

      <BookingActionsDialog
        booking={booking}
        open={actionMode !== null}
        onOpenChange={(open) => !open && setActionMode(null)}
        mode={actionMode!}
        onSuccess={() => {
          // Reload booking
          fetchBooking()
        }}
      />
    </div>
  )
}
```

---

## ✅ Checklist Hoàn Thành

- [x] API reschedule booking
- [x] API cancel booking với membership benefits
- [x] UI component BookingActionsDialog
- [x] Notification system cho host
- [x] Notification system cho guest
- [x] Membership benefits calculation
- [x] Availability check cho reschedule
- [x] Transaction tracking
- [x] Metadata logging
- [x] Email notifications
- [x] Security & authorization
- [x] Validation & error handling
- [x] Documentation

---

**Cập nhật lần cuối**: 2/11/2025
