# Cập Nhật Hệ Thống - LuxeStay

## ✅ Đã Hoàn Thành

### 1. **Thêm Actions cho Guest** trong Trip Detail Page

**File**: `/app/trips/[id]/page.tsx`

**Tính năng:**
- ✅ Nút "Thay đổi ngày" với icon Calendar
- ✅ Nút "Hủy phòng" với icon X  
- ✅ Chỉ hiển thị khi:
  - Status không phải CANCELLED/COMPLETED
  - Check-in date chưa qua
- ✅ Tích hợp `BookingActionsDialog`
- ✅ Auto refresh data sau khi thành công

**Code:**
```tsx
// Action buttons
{canModify && (
  <div className="mb-6 flex gap-3 justify-end">
    <Button
      variant="outline"
      onClick={() => setActionMode('reschedule')}
      className="gap-2"
    >
      <Calendar className="h-4 w-4" />
      Thay đổi ngày
    </Button>
    <Button
      variant="destructive"
      onClick={() => setActionMode('cancel')}
      className="gap-2"
    >
      <X className="h-4 w-4" />
      Hủy phòng
    </Button>
  </div>
)}

// Dialog
<BookingActionsDialog
  booking={{...}}
  open={actionMode !== null}
  onOpenChange={(open) => !open && setActionMode(null)}
  mode={actionMode!}
  onSuccess={() => {
    fetchTrip()
    setActionMode(null)
  }}
/>
```

---

### 2. **Sửa Tên Listing Bị Tràn** trong Host Dashboard

**File**: `/components/recent-bookings-enhanced.tsx`

**Thay đổi:**
```tsx
// CŨ - Bị tràn
<div className="flex-1 space-y-2">
  <div className="flex items-start justify-between gap-4">
    <div>
      <h3 className="font-semibold">{booking.listing?.title}</h3>

// MỚI - Truncate
<div className="flex-1 space-y-2 min-w-0">
  <div className="flex items-start justify-between gap-4">
    <div className="flex-1 min-w-0">
      <h3 className="font-semibold truncate">{booking.listing?.title}</h3>
      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
        <MapPin className="h-4 w-4 flex-shrink-0" />
        <span className="truncate">{booking.listing?.city}</span>
      </div>
    </div>
    <Badge className={`${statusColors[booking.status]} flex-shrink-0`}>
```

**CSS classes quan trọng:**
- `min-w-0` - Cho phép flex item co lại
- `truncate` - Cắt text dài, thêm "..."
- `flex-shrink-0` - Icon/Badge không bị co
- `overflow-hidden` - Ẩn phần tràn

---

### 3. **Hệ Thống Đăng Ký Khu Vực Mới**

#### A. Database Schema

**File**: `/prisma/schema.prisma`

```prisma
model LocationRequest {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  city            String
  state           String
  country         String
  reason          String
  requestedBy     String   @db.ObjectId
  approvedBy      String?  @db.ObjectId
  status          LocationRequestStatus @default(PENDING)
  approvedAt      DateTime?
  rejectionReason String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  requestedByUser User  @relation("LocationRequestedBy", fields: [requestedBy], references: [id])
  approvedByUser  User? @relation("LocationApprovedBy", fields: [approvedBy], references: [id])

  @@index([requestedBy])
  @@index([status])
  @@map("location_requests")
}

enum LocationRequestStatus {
  PENDING
  APPROVED
  REJECTED
}
```

**Migration:**
```bash
npx prisma generate
npx prisma db push
```

---

#### B. API Endpoints

**1. Submit Location Request**

```typescript
POST /api/locations/requests

Body:
{
  "city": "Đà Nẵng",
  "state": "Đà Nẵng",
  "country": "Vietnam",
  "reason": "Tôi có nhiều khách muốn đặt phòng ở Đà Nẵng"
}

Response:
{
  "request": {...},
  "message": "Location request submitted successfully"
}
```

**2. List Requests**

```typescript
GET /api/locations/requests

// Host: Chỉ thấy requests của mình
// Admin: Thấy tất cả requests

Response:
{
  "requests": [...]
}
```

**3. Approve/Reject Request (Admin only)**

```typescript
PATCH /api/locations/requests/{id}

Body:
{
  "action": "APPROVED", // hoặc "REJECTED"
  "rejectionReason": "Khu vực này chưa có nhu cầu" // optional
}

Response:
{
  "request": {...},
  "message": "Location request approved successfully"
}
```

---

#### C. Notifications

**Khi Host Request:**
```
📍 Admin nhận thông báo:
"Quý Tài Trần muốn đăng listing tại Đà Nẵng, Đà Nẵng, Vietnam.
Lý do: Tôi có nhiều khách muốn đặt phòng ở Đà Nẵng"

[Xem chi tiết] → /admin/locations
```

**Khi Admin Approve:**
```
✅ Host nhận thông báo:
"Yêu cầu khu vực Đà Nẵng, Đà Nẵng đã được phê duyệt.
Bạn có thể bắt đầu đăng listing tại đây."

[Bắt đầu đăng] → /host/listings/create
```

**Khi Admin Reject:**
```
❌ Host nhận thông báo:
"Yêu cầu khu vực Đà Nẵng, Đà Nẵng đã bị từ chối.
Lý do: Khu vực này chưa có nhu cầu"

[Xem chi tiết] → /host/listings/create
```

---

### 4. **UI Component - Request New Location**

**Component cần tạo**: `/components/location-request-dialog.tsx`

```tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MapPin } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function LocationRequestDialog() {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    city: "",
    state: "",
    country: "Vietnam",
    reason: "",
  })

  const handleSubmit = async () => {
    if (!formData.city || !formData.state || !formData.reason) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng điền đầy đủ các trường bắt buộc",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/locations/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Không thể gửi yêu cầu")
      }

      toast({
        title: "Đã gửi yêu cầu",
        description: "Admin sẽ xem xét và phản hồi trong vòng 24-48 giờ",
      })

      setOpen(false)
      setFormData({ city: "", state: "", country: "Vietnam", reason: "" })
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <MapPin className="h-4 w-4" />
          Đăng ký khu vực mới
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Đăng ký khu vực mới</DialogTitle>
          <DialogDescription>
            Nếu khu vực bạn muốn đăng listing chưa có trong danh sách, 
            gửi yêu cầu để admin xem xét
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="city">Thành phố *</Label>
            <Input
              id="city"
              placeholder="Đà Nẵng"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="state">Tỉnh/Bang *</Label>
            <Input
              id="state"
              placeholder="Đà Nẵng"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Quốc gia *</Label>
            <Input
              id="country"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Lý do đăng ký *</Label>
            <Textarea
              id="reason"
              placeholder="Ví dụ: Tôi có 3 căn villa ở khu vực này và muốn đăng trên LuxeStay"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              rows={3}
            />
          </div>

          <div className="rounded-lg border p-3 text-sm text-muted-foreground">
            <p className="font-semibold mb-1">Lưu ý:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Admin sẽ xem xét trong 24-48 giờ</li>
              <li>Bạn sẽ nhận thông báo khi được phê duyệt</li>
              <li>Sau khi được duyệt, bạn có thể đăng listing ngay</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Đang gửi..." : "Gửi yêu cầu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

---

### 5. **Tích Hợp vào Form Tạo Listing**

**File**: `/app/host/listings/create/page.tsx` (hoặc tương tự)

```tsx
import { LocationRequestDialog } from "@/components/location-request-dialog"

// Trong form, section chọn location
<div className="space-y-4">
  <div className="flex items-center justify-between">
    <Label>Thành phố / Tỉnh</Label>
    <LocationRequestDialog />
  </div>
  
  <Select value={city} onValueChange={setCity}>
    <SelectTrigger>
      <SelectValue placeholder="Chọn thành phố" />
    </SelectTrigger>
    <SelectContent>
      {availableCities.map((city) => (
        <SelectItem key={city} value={city}>
          {city}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>

  <p className="text-sm text-muted-foreground">
    Không tìm thấy khu vực bạn muốn? 
    <button 
      onClick={() => setShowLocationDialog(true)}
      className="text-primary underline ml-1"
    >
      Đăng ký khu vực mới
    </button>
  </p>
</div>
```

---

### 6. **Admin Panel - Quản Lý Location Requests**

**File cần tạo**: `/app/admin/locations/page.tsx`

```tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Check, X } from "lucide-react"

export default function AdminLocationsPage() {
  const [requests, setRequests] = useState([])

  useEffect(() => {
    fetch("/api/locations/requests")
      .then((res) => res.json())
      .then((data) => setRequests(data.requests))
  }, [])

  const handleAction = async (id: string, action: "APPROVED" | "REJECTED") => {
    const reason = action === "REJECTED" 
      ? prompt("Lý do từ chối (optional):")
      : null

    const response = await fetch(`/api/locations/requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, rejectionReason: reason }),
    })

    if (response.ok) {
      // Reload
      window.location.reload()
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Location Requests</h1>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Khu vực</TableHead>
            <TableHead>Host</TableHead>
            <TableHead>Lý do</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Ngày gửi</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request: any) => (
            <TableRow key={request.id}>
              <TableCell>
                {request.city}, {request.state}
                <br />
                <span className="text-xs text-muted-foreground">
                  {request.country}
                </span>
              </TableCell>
              <TableCell>{request.requestedByUser?.name}</TableCell>
              <TableCell className="max-w-xs truncate">
                {request.reason}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    request.status === "APPROVED"
                      ? "default"
                      : request.status === "REJECTED"
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {request.status}
                </Badge>
              </TableCell>
              <TableCell>
                {new Date(request.createdAt).toLocaleDateString("vi-VN")}
              </TableCell>
              <TableCell>
                {request.status === "PENDING" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAction(request.id, "APPROVED")}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleAction(request.id, "REJECTED")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
```

---

## 🎯 Summary

### ✅ Hoàn Thành
1. **Guest Actions** - Thay đổi ngày & hủy phòng trong trip detail
2. **Fix Truncate** - Tên listing không bị tràn
3. **Location Request System** - API & Schema hoàn chỉnh
4. **Notifications** - Host & Admin nhận thông báo

### 📝 Cần Làm Thêm
1. Tạo UI component `LocationRequestDialog`
2. Tích hợp vào form create listing
3. Tạo admin panel quản lý requests
4. Run migration: `npx prisma db push`
5. Test end-to-end flow

---

**Cập nhật lần cuối**: 2/11/2025
