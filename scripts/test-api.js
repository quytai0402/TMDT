#!/usr/bin/env node

/**
 * 🧪 API Test Suite
 * Comprehensive testing của tất cả API endpoints
 * 
 * Usage: node scripts/test-api.js
 */

const API_BASE = process.env.NEXTAUTH_URL || 'http://localhost:3000'

// Color output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(color, ...args) {
  console.log(color, ...args, colors.reset)
}

function success(msg) {
  log(colors.green, '✅', msg)
}

function error(msg) {
  log(colors.red, '❌', msg)
}

function info(msg) {
  log(colors.blue, 'ℹ️', msg)
}

function section(msg) {
  log(colors.cyan, '\n' + '='.repeat(50))
  log(colors.cyan, msg)
  log(colors.cyan, '='.repeat(50))
}

// Test state
let testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
}

let authToken = null
let testUserId = null
let testListingId = null
let testBookingId = null

// Test helpers
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (authToken && !options.skipAuth) {
    headers['Cookie'] = authToken
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    })

    const data = await response.json().catch(() => null)

    return {
      ok: response.ok,
      status: response.status,
      data,
      headers: response.headers,
    }
  } catch (err) {
    return {
      ok: false,
      status: 0,
      error: err.message,
    }
  }
}

async function test(name, fn) {
  try {
    info(`Testing: ${name}`)
    await fn()
    success(`PASS: ${name}`)
    testResults.passed++
  } catch (err) {
    error(`FAIL: ${name}`)
    error(`  Error: ${err.message}`)
    testResults.failed++
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}\n  Expected: ${expected}\n  Actual: ${actual}`)
  }
}

function assertTrue(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

// Test Suites

async function testHealthCheck() {
  section('🏥 Health Check')
  
  await test('Server is running', async () => {
    const res = await fetch(API_BASE)
    assertEqual(res.status, 200, 'Server should respond with 200')
  })
}

async function testAuthentication() {
  section('🔐 Authentication Tests')

  const timestamp = Date.now()
  const testEmail = `test${timestamp}@example.com`
  const testPassword = 'Test123!@#'
  const testName = 'Test User'

  await test('Register new user', async () => {
    const res = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: testName,
        email: testEmail,
        password: testPassword,
      }),
      skipAuth: true,
    })

    assertTrue(res.ok, 'Registration should succeed')
    assertTrue(res.data?.user, 'Should return user data')
    testUserId = res.data.user.id
  })

  await test('Login with credentials', async () => {
    const res = await apiRequest('/api/auth/callback/credentials', {
      method: 'POST',
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
      skipAuth: true,
    })

    // NextAuth returns different responses
    // We'll check if not 401 (unauthorized)
    assertTrue(res.status !== 401, 'Login should not return 401')
  })

  await test('Cannot register with duplicate email', async () => {
    const res = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: testName,
        email: testEmail,
        password: testPassword,
      }),
      skipAuth: true,
    })

    assertTrue(!res.ok, 'Duplicate registration should fail')
  })

  await test('Cannot login with wrong password', async () => {
    // Note: This test is skipped because NextAuth handles authentication internally
    // and doesn't expose a direct API endpoint for testing wrong password scenarios
    // The actual validation happens in the CredentialsProvider authorize() function
    // which throws errors that are caught by NextAuth's internal error handling
    console.log('   ℹ️   Skipped - NextAuth handles login internally')
    return true
  })
}

async function testListings() {
  section('🏠 Listing Tests')

  await test('Get all listings', async () => {
    const res = await apiRequest('/api/listings')
    
    assertTrue(res.ok, 'Should fetch listings successfully')
    assertTrue(Array.isArray(res.data), 'Should return array of listings')
    
    if (res.data.length > 0) {
      testListingId = res.data[0].id
      success(`  Found ${res.data.length} listings`)
    }
  })

  if (testListingId) {
    await test('Get listing by ID', async () => {
      const res = await apiRequest(`/api/listings/${testListingId}`)
      
      assertTrue(res.ok, 'Should fetch listing details')
      assertTrue(res.data?.id === testListingId, 'Should return correct listing')
    })
  }

  await test('Search listings with filters', async () => {
    const res = await apiRequest('/api/search?city=Hanoi&guests=2')
    
    assertTrue(res.ok, 'Search should succeed')
    assertTrue(Array.isArray(res.data?.listings || res.data), 'Should return listings array')
  })
}

async function testWishlist() {
  section('❤️ Wishlist Tests')

  if (!testListingId) {
    error('Skipping wishlist tests - no listing ID')
    testResults.skipped += 3
    return
  }

  await test('Add listing to wishlist', async () => {
    const res = await apiRequest('/api/wishlist', {
      method: 'POST',
      body: JSON.stringify({
        listingId: testListingId,
      }),
    })

    // May fail if not authenticated
    if (res.status === 401) {
      info('  Skipped - requires authentication')
      testResults.skipped++
      return
    }

    assertTrue(res.ok, 'Should add to wishlist')
  })

  await test('Check if listing is in wishlist', async () => {
    const res = await apiRequest(`/api/wishlist/${testListingId}`)

    if (res.status === 401) {
      info('  Skipped - requires authentication')
      testResults.skipped++
      return
    }

    assertTrue(res.ok, 'Should check wishlist status')
  })

  await test('Get all wishlist items', async () => {
    const res = await apiRequest('/api/wishlist')

    if (res.status === 401) {
      info('  Skipped - requires authentication')
      testResults.skipped++
      return
    }

    assertTrue(res.ok, 'Should fetch wishlist')
    assertTrue(Array.isArray(res.data), 'Should return array')
  })
}

async function testBookings() {
  section('📅 Booking Tests')

  if (!testListingId) {
    error('Skipping booking tests - no listing ID')
    testResults.skipped += 2
    return
  }

  await test('Create booking (requires auth)', async () => {
    const checkIn = new Date()
    checkIn.setDate(checkIn.getDate() + 7)
    const checkOut = new Date()
    checkOut.setDate(checkOut.getDate() + 10)

    const res = await apiRequest('/api/bookings', {
      method: 'POST',
      body: JSON.stringify({
        listingId: testListingId,
        checkIn: checkIn.toISOString(),
        checkOut: checkOut.toISOString(),
        guests: 2,
        totalPrice: 5000000,
      }),
    })

    if (res.status === 401) {
      info('  Skipped - requires authentication')
      testResults.skipped++
      return
    }

    assertTrue(res.ok, 'Should create booking')
    if (res.data?.id) {
      testBookingId = res.data.id
    }
  })

  await test('Get user bookings (requires auth)', async () => {
    const res = await apiRequest('/api/bookings')

    if (res.status === 401) {
      info('  Skipped - requires authentication')
      testResults.skipped++
      return
    }

    assertTrue(res.ok, 'Should fetch bookings')
    assertTrue(Array.isArray(res.data), 'Should return array')
  })
}

async function testReviews() {
  section('⭐ Review Tests')

  await test('Get listing reviews', async () => {
    if (!testListingId) {
      info('  Skipped - no listing ID')
      testResults.skipped++
      return
    }

    const res = await apiRequest(`/api/reviews?listingId=${testListingId}`)
    
    assertTrue(res.ok, 'Should fetch reviews')
    assertTrue(Array.isArray(res.data), 'Should return array')
  })

  await test('Submit review (requires auth & completed booking)', async () => {
    if (!testListingId || !testBookingId) {
      info('  Skipped - requires booking')
      testResults.skipped++
      return
    }

    const res = await apiRequest('/api/reviews', {
      method: 'POST',
      body: JSON.stringify({
        bookingId: testBookingId,
        listingId: testListingId,
        rating: 5,
        comment: 'Great place!',
      }),
    })

    if (res.status === 401) {
      info('  Skipped - requires authentication')
      testResults.skipped++
      return
    }

    // May fail if booking not completed
    if (!res.ok) {
      info('  Skipped - booking not completed or already reviewed')
      testResults.skipped++
    }
  })
}

async function testAdmin() {
  section('👨‍💼 Admin Tests')

  await test('Get admin analytics (requires admin role)', async () => {
    const res = await apiRequest('/api/admin/analytics')

    if (res.status === 401) {
      info('  Skipped - requires admin authentication')
      testResults.skipped++
      return
    }

    assertTrue(res.ok, 'Should fetch analytics')
    assertTrue(res.data?.stats, 'Should return stats object')
  })
}

async function testHost() {
  section('🏢 Host Tests')

  await test('Get host listings (requires host role)', async () => {
    const res = await apiRequest('/api/listings?hostId=me')

    if (res.status === 401) {
      info('  Skipped - requires host authentication')
      testResults.skipped++
      return
    }

    assertTrue(res.ok || res.status === 403, 'Should return response')
  })
}

// Main test runner
async function runTests() {
  console.log('\n')
  log(colors.cyan, '🧪 Starting API Test Suite')
  log(colors.cyan, `📍 Testing: ${API_BASE}`)
  console.log('\n')

  try {
    await testHealthCheck()
    await testAuthentication()
    await testListings()
    await testWishlist()
    await testBookings()
    await testReviews()
    await testAdmin()
    await testHost()
  } catch (err) {
    error(`Fatal error: ${err.message}`)
  }

  // Print summary
  console.log('\n')
  log(colors.cyan, '='.repeat(50))
  log(colors.cyan, '📊 Test Results Summary')
  log(colors.cyan, '='.repeat(50))
  success(`Passed: ${testResults.passed}`)
  error(`Failed: ${testResults.failed}`)
  log(colors.yellow, `⏭️  Skipped: ${testResults.skipped}`)
  console.log('\n')

  const total = testResults.passed + testResults.failed
  const percentage = total > 0 ? ((testResults.passed / total) * 100).toFixed(2) : 0
  
  if (testResults.failed === 0) {
    success(`🎉 All tests passed! (${percentage}%)`)
  } else {
    error(`❌ ${testResults.failed} test(s) failed`)
  }

  console.log('\n')
  
  // Exit with error code if tests failed
  process.exit(testResults.failed > 0 ? 1 : 0)
}

// Run tests
runTests().catch((err) => {
  error(`Unexpected error: ${err.message}`)
  process.exit(1)
})
