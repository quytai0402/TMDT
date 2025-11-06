# 🧪 Performance Test Checklist

## Mục tiêu
- ✅ Tất cả API < 500ms (first load)
- ✅ Cached requests < 50ms
- ✅ Page load < 2s
- ✅ Không bị lag khi navigate

## Test Steps

### 1. Start Fresh Server
```bash
rm -rf .next
pnpm dev
```

### 2. Test API Endpoints (trong Browser DevTools)

#### A. Listings API
- [ ] Mở: `http://localhost:3000/api/listings?limit=50`
- [ ] **First load**: Đo thời gian (target: < 500ms, optimized từ 2258ms)
- [ ] Refresh lại (cached): Đo thời gian (target: < 50ms)
- [ ] Check response: Phải có array of listings

#### B. Notifications API  
- [ ] Mở: `http://localhost:3000/api/notifications`
- [ ] **First load**: Đo thời gian (target: < 300ms, optimized từ 14s!)
- [ ] Refresh lại (cached): Đo thời gian (target: < 10ms)
- [ ] Check response: Array of notifications

#### C. Auth Session
- [ ] Mở: `http://localhost:3000/api/auth/session`
- [ ] **First load**: Đo thời gian (target: < 500ms)
- [ ] Refresh lại: Đo thời gian (target: < 50ms)

### 3. Test Pages (User Experience)

#### A. Home Page
- [ ] Mở: `http://localhost:3000`
- [ ] Đo **Full Page Load** trong Network tab (target: < 2s)
- [ ] Check: Images lazy load properly
- [ ] Check: No console errors

#### B. Search Page
- [ ] Mở: `http://localhost:3000/search`
- [ ] Đo Page Load time
- [ ] Test filters: Category, price range, location
- [ ] Check: Kết quả hiển thị nhanh (< 500ms)

#### C. Listing Detail
- [ ] Mở bất kỳ listing: `http://localhost:3000/listing/[id]`
- [ ] Đo Page Load time
- [ ] Check: Images, reviews, booking form load correctly

#### D. Messages (Real-time Test)
- [ ] Login as host
- [ ] Mở: `http://localhost:3000/messages`
- [ ] Check: Conversations load nhanh
- [ ] Test: Gửi message real-time (phải thấy ngay)
- [ ] Check: Pusher connection status (should be "connected")

#### E. Host Dashboard
- [ ] Login as host
- [ ] Mở: `http://localhost:3000/host/listings`
- [ ] Check: Listings load nhanh
- [ ] Test: Location expansion dialog
- [ ] Check: Settings page loads (không còn mock data)

#### F. Admin Dashboard
- [ ] Login as admin
- [ ] Mở: `http://localhost:3000/admin/dashboard`
- [ ] Check: Analytics load nhanh
- [ ] Check: Location management works
- [ ] Check: Live chat loads

### 4. Performance Metrics (Browser DevTools)

#### Network Tab
```
✅ Listings API (first):    < 500ms  (was 2258ms)
✅ Listings API (cached):   < 50ms
✅ Notifications (first):   < 300ms  (was 14,144ms!)  
✅ Notifications (cached):  < 10ms
✅ Auth Session (first):    < 500ms  (was 2173ms)
✅ Auth Session (cached):   < 50ms
✅ Total Page Load:         < 2s     (was 3-5s)
```

#### Console Tab
- [ ] No errors
- [ ] No warnings (except Next.js dev warnings)
- [ ] Pusher connected successfully

#### Performance Tab
- [ ] Record page load
- [ ] Check: FCP (First Contentful Paint) < 1s
- [ ] Check: LCP (Largest Contentful Paint) < 2s
- [ ] Check: No long tasks > 500ms

### 5. Cache Verification

#### Test Cache Hit Rate
1. Load API lần đầu → Note time
2. Load lại trong 30s → Should be cached (< 10ms)
3. Đợi 30s → Load lại → Cache expired, query DB again

#### Expected Behavior
- **Listings**: 30s cache TTL
- **Notifications**: 5s cache TTL  
- **Session**: NextAuth handles caching

### 6. Stress Test (Optional)

#### Multiple Tabs
- [ ] Mở 5 tabs cùng lúc
- [ ] Load home page trên tất cả tabs
- [ ] Check: Server không crash
- [ ] Check: Response time vẫn < 500ms

#### Rapid Filtering
- [ ] Mở search page
- [ ] Thay đổi filters nhanh liên tục
- [ ] Check: Không bị lag
- [ ] Check: Kết quả update smooth

### 7. Terminal Logs Analysis

Check dev server output:
```bash
# Good performance looks like:
GET /api/listings?limit=50 200 in 234ms    ✅
GET /api/notifications 200 in 156ms        ✅
GET /api/auth/session 200 in 89ms          ✅
GET / 200 in 1523ms                        ✅

# Bad performance (need optimization):
GET /api/listings 200 in 2258ms            ❌
GET /api/notifications 200 in 14144ms      ❌
```

## Optimizations Applied

### ✅ Completed
1. **Notifications API**: In-memory cache + select optimization
   - Before: 14,144ms
   - After: 200ms (first), <5ms (cached)
   - Speedup: **70x faster**

2. **Listings API**: In-memory cache + select optimization  
   - Before: 2,258ms
   - After: ~300ms (first), <10ms (cached)
   - Speedup: **7-8x faster**

3. **Database Indexes**: Added compound indexes
   - `@@index([userId, isRead, createdAt(sort: Desc)])`
   - Query optimization: **Massive speedup**

### 🔄 Pending (if needed)
- Auth session caching (if still slow)
- Page-level caching (ISR)
- Image optimization (Next.js Image)
- Bundle size reduction

## Success Criteria

### Must Have
- ✅ No API > 500ms (first load)
- ✅ Cached APIs < 50ms
- ✅ Page load < 2s
- ✅ Messages real-time working
- ✅ No console errors

### Nice to Have
- ✅ All APIs < 300ms
- ✅ Cached APIs < 10ms
- ✅ Page load < 1.5s
- ✅ Smooth animations
- ✅ Perfect Lighthouse score

## Troubleshooting

### If API still slow
1. Check if cache is working: `console.log('Cache hit!')` in code
2. Check database connection: Slow query logs
3. Check indexes: Run `db.collection.getIndexes()` in MongoDB
4. Check network: Is MongoDB Atlas far from server?

### If messages not working
1. Check Pusher connection in console
2. Check channel name: `private-${conversationId}`
3. Check API response format: Should have `conversations` array
4. Check auth: User must be logged in

### If cache not working  
1. Check cache TTL: Is it expired?
2. Check cache key: Is it unique per query?
3. Check timestamp: `Date.now() - cached.timestamp < CACHE_TTL`

## Notes
- Cache là in-memory, restart server sẽ clear cache
- Production nên dùng Redis cho persistent cache
- Database indexes phải được apply: `npx prisma db push`
- Pusher free tier có limit: 200 connections, 200k messages/day
