# Admin Mock Data - Removal Plan

## Status: NOT YET REMOVED ⚠️

Các admin components sau vẫn đang sử dụng mock data. Đây là **low priority** vì chỉ admin sử dụng.

## Files Still Using Mock Data

### 1. `/components/admin-bookings-dashboard.tsx` ✅ IN PROGRESS
**Status:** Đã update để fetch từ API
**Changes:**
- Added `useEffect` to fetch from `/api/admin/bookings`
- Added loading state
- Removed mockBookings array (đã xóa 50+ lines)
- API route: `/app/api/admin/bookings/route.ts` (ĐÃ TỒN TẠI)

**API Endpoint:** `/api/admin/bookings` - Hoàn chỉnh với filters, pagination, search

---

### 2. `/components/admin-user-management.tsx` ❌ TODO
**Mock Data:** `mockUsers` array (lines ~43-120)
**Sample Data:** 5 mock users với name, email, role, status, bookings, etc.

**Required Changes:**
- Create `useEffect` to fetch from `/api/admin/users`
- Add loading/error states
- Replace mockUsers with state variable

**API Needed:** `/api/admin/users/route.ts`
```typescript
GET /api/admin/users?page=1&limit=20&role=all&status=all&search=query
Response: { users: User[], total: number }
```

---

### 3. `/components/admin-listing-moderation.tsx` ❌ TODO
**Mock Data:** `mockListings` array (lines ~33-100+)
**Sample Data:** Pending listings chờ approve

**Required Changes:**
- Fetch from `/api/admin/listings/pending`
- Add approve/reject actions
- Real-time updates

**API Needed:** 
- GET `/api/admin/listings?status=pending`
- PATCH `/api/admin/listings/[id]/approve`
- PATCH `/api/admin/listings/[id]/reject`

---

### 4. `/components/admin-live-chat.tsx` ❌ TODO
**Mock Data:** `mockConversations` array (lines ~32-80+)
**Sample Data:** Chat conversations between guests and hosts

**Required Changes:**
- Fetch from `/api/admin/messages` or use WebSocket
- Real-time message updates
- Complex - needs messaging infrastructure

**API Needed:**
- GET `/api/admin/conversations`
- WebSocket connection for real-time

**Priority:** LOW - Cần messaging system hoàn chỉnh

---

### 5. `/components/admin-dispute-resolution.tsx` ❌ TODO
**Mock Data:** `mockDisputes` array (lines ~39-120+)
**Sample Data:** Disputes between guests and hosts

**Required Changes:**
- Fetch from `/api/admin/disputes`
- Add resolution actions
- Status tracking

**API Needed:**
- GET `/api/admin/disputes?status=open`
- PATCH `/api/admin/disputes/[id]/resolve`

---

## Implementation Priority

### 🔴 High Priority (User-Facing) - ✅ DONE
1. ✅ Listings grid
2. ✅ Reviews section
3. ✅ Booking page
4. ✅ Notifications hook
5. ✅ Recommendations hook
6. ✅ Guest info form
7. ✅ Workspace showcase

### 🟡 Medium Priority (Admin)
1. ✅ Admin Bookings Dashboard - **COMPLETED**
2. ⚠️ Admin User Management - In progress
3. ⚠️ Admin Listing Moderation - Pending

### 🟢 Low Priority (Complex Systems)
1. ❌ Admin Live Chat - Needs WebSocket
2. ❌ Admin Dispute Resolution - Needs workflow system

---

## Admin API Routes Needed

### Already Exist ✅
- `/api/admin/bookings` - Full CRUD with filters

### Need to Create ❌
- `/api/admin/users` - User management
- `/api/admin/listings/pending` - Moderation queue
- `/api/admin/conversations` - Chat system
- `/api/admin/disputes` - Dispute handling

---

## Recommendation

**Option 1: Complete Admin Mock Removal (4-6 hours work)**
- Implement all 4 remaining admin API routes
- Update all admin components
- Full system with real data

**Option 2: Leave Admin as Mock (Current)**
- Admin features are internal tools
- Low traffic, low risk
- Focus on user-facing features first
- Can implement later when needed

**Option 3: Hybrid Approach (RECOMMENDED)**
- Remove mock from User Management (most used)
- Remove mock from Listing Moderation (critical for quality)
- Leave Live Chat and Disputes as mock (rarely used)

---

## Next Steps

If you want to continue removing admin mock data:

1. **Start with User Management**
   ```bash
   # Create API route
   touch app/api/admin/users/route.ts
   
   # Update component
   # Update /components/admin-user-management.tsx
   ```

2. **Then Listing Moderation**
   ```bash
   # Create API routes
   touch app/api/admin/listings/pending/route.ts
   touch app/api/admin/listings/[id]/approve/route.ts
   ```

3. **Skip Complex Ones**
   - Live Chat needs WebSocket infrastructure
   - Disputes need workflow system
   - Both require significant backend work

---

## Summary

- ✅ **User-facing mock data:** REMOVED (100%)
- ✅ **Admin Bookings:** REMOVED (100%)
- ⚠️ **Other Admin features:** Using mock data (acceptable for now)

**Current system is production-ready for users. Admin mock data is internal tooling and can be addressed later.**
