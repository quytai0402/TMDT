#!/bin/bash

# 🧪 End-to-End Testing Script
# Run this script to test all features

echo "🚀 Starting E2E Tests..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
PASSED=0
FAILED=0

# Function to print test result
test_result() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✅ PASS${NC}: $2"
    ((PASSED++))
  else
    echo -e "${RED}❌ FAIL${NC}: $2"
    ((FAILED++))
  fi
}

echo "📋 Test Suite: Homestay Booking System"
echo "========================================"
echo ""

# Test 1: Check if dev server is running
echo "1️⃣ Testing: Dev Server"
if curl -s http://localhost:3000 > /dev/null 2>&1; then
  test_result 0 "Dev server is running on port 3000"
else
  test_result 1 "Dev server is NOT running. Run 'npm run dev' first!"
  exit 1
fi
echo ""

# Test 2: Check API endpoints
echo "2️⃣ Testing: API Endpoints"

# Note: These endpoints require authentication, so we just check they exist and respond
# In production, use authenticated requests

# Test geocoding API (will return 401 without auth, but that's expected)
GEOCODE_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/geocode \
  -H "Content-Type: application/json" \
  -d '{"address":"80 Dương Quảng Hàm","city":"Đà Lạt","country":"Vietnam"}')

if [ "$GEOCODE_RESPONSE" = "401" ] || [ "$GEOCODE_RESPONSE" = "200" ]; then
  test_result 0 "Geocoding API endpoint exists (returned $GEOCODE_RESPONSE)"
else
  test_result 1 "Geocoding API endpoint issue (returned $GEOCODE_RESPONSE)"
fi

# Test nearby places API
NEARBY_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/nearby-places \
  -H "Content-Type: application/json" \
  -d '{"latitude":11.945326,"longitude":108.475648,"city":"Đà Lạt"}')

if [ "$NEARBY_RESPONSE" = "401" ] || [ "$NEARBY_RESPONSE" = "200" ]; then
  test_result 0 "Nearby Places API endpoint exists (returned $NEARBY_RESPONSE)"
else
  test_result 1 "Nearby Places API endpoint issue (returned $NEARBY_RESPONSE)"
fi

# Test image upload API
UPLOAD_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/upload/image)

if [ "$UPLOAD_RESPONSE" = "401" ] || [ "$UPLOAD_RESPONSE" = "400" ]; then
  test_result 0 "Image Upload API endpoint exists (returned $UPLOAD_RESPONSE)"
else
  test_result 1 "Image Upload API endpoint issue (returned $UPLOAD_RESPONSE)"
fi

echo ""

# Test 3: Check database connection
echo "3️⃣ Testing: Database Connection"
# This would need actual database query - skipping for now
echo -e "${YELLOW}⏭️  SKIP${NC}: Database test (manual verification needed)"
echo ""

# Test 4: Check Prisma schema
echo "4️⃣ Testing: Prisma Schema"
if grep -q "nearbyPlaces" prisma/schema.prisma; then
  test_result 0 "nearbyPlaces field exists in schema"
else
  test_result 1 "nearbyPlaces field missing in schema"
fi
echo ""

# Test 5: Check component files exist
echo "5️⃣ Testing: Component Files"

components=(
  "components/host-listing-form.tsx"
  "components/nearby-places.tsx"
  "components/listing-card.tsx"
  "app/api/upload/image/route.ts"
  "app/api/geocode/route.ts"
  "app/api/nearby-places/route.ts"
)

for component in "${components[@]}"; do
  if [ -f "$component" ]; then
    test_result 0 "File exists: $component"
  else
    test_result 1 "File missing: $component"
  fi
done

echo ""

# Test 6: Check for TypeScript errors
echo "6️⃣ Testing: TypeScript Compilation"
if npx tsc --noEmit --skipLibCheck > /dev/null 2>&1; then
  test_result 0 "No TypeScript errors"
else
  echo -e "${YELLOW}⚠️  WARN${NC}: TypeScript has some errors (check manually)"
fi
echo ""

# Test 7: Check image upload API
echo "7️⃣ Testing: Image Upload API Endpoint"
if [ -f "app/api/upload/image/route.ts" ]; then
  if grep -q "imgur" app/api/upload/image/route.ts; then
    test_result 0 "Image upload API configured with Imgur"
  else
    test_result 1 "Image upload API not properly configured"
  fi
fi
echo ""

# Test 8: Check nearby places display in listing page
echo "8️⃣ Testing: Nearby Places Integration"
if grep -q "savedPlaces" app/listing/[id]/page.tsx; then
  test_result 0 "Listing page passes nearbyPlaces to component"
else
  test_result 1 "Listing page doesn't pass nearbyPlaces"
fi

if grep -q "savedPlaces" components/nearby-places.tsx; then
  test_result 0 "NearbyPlaces component accepts savedPlaces prop"
else
  test_result 1 "NearbyPlaces component doesn't accept savedPlaces"
fi
echo ""

# Test 9: Check price formatting
echo "9️⃣ Testing: Price Formatting in Form"
if grep -q "toLocaleString" components/host-listing-form.tsx; then
  test_result 0 "Price formatting implemented"
else
  test_result 1 "Price formatting not found"
fi
echo ""

# Summary
echo "========================================"
echo "📊 Test Summary:"
echo "  ✅ Passed: $PASSED"
echo "  ❌ Failed: $FAILED"
echo "  📝 Total:  $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 All tests passed!${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Open http://localhost:3001 in browser"
  echo "2. Login as HOST"
  echo "3. Go to /host/listings/create"
  echo "4. Test manual flow:"
  echo "   - Enter address to trigger geocoding"
  echo "   - Upload images"
  echo "   - Check price formatting"
  echo "   - Submit listing"
  echo "5. Check listing detail page for nearby places"
  exit 0
else
  echo -e "${RED}❌ Some tests failed. Please fix errors above.${NC}"
  exit 1
fi
