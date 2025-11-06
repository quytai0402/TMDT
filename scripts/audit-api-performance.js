#!/usr/bin/env node

const http = require('http');

const BASE_URL = 'http://localhost:3000';

// Comprehensive list of API endpoints to test
const endpoints = [
  // Public APIs
  { name: 'Home Page', path: '/', method: 'GET', auth: false },
  { name: 'Listings - All', path: '/api/listings?limit=20', method: 'GET', auth: false },
  { name: 'Listings - Category', path: '/api/listings?category=luxury&limit=20', method: 'GET', auth: false },
  { name: 'Listings - Beach', path: '/api/listings?category=beach&limit=20', method: 'GET', auth: false },
  { name: 'Reviews', path: '/api/reviews?limit=20', method: 'GET', auth: false },
  { name: 'Auth Session', path: '/api/auth/session', method: 'GET', auth: false },
  { name: 'Search Page', path: '/search', method: 'GET', auth: false },
  { name: 'Locations', path: '/api/locations', method: 'GET', auth: false },
  
  // Authenticated APIs (will get 401 but we measure response time)
  { name: 'Notifications', path: '/api/notifications', method: 'GET', auth: true },
  { name: 'Notifications (unread)', path: '/api/notifications?unreadOnly=true', method: 'GET', auth: true },
  { name: 'Wishlist', path: '/api/wishlist', method: 'GET', auth: true },
  { name: 'Bookings', path: '/api/bookings', method: 'GET', auth: true },
  { name: 'Messages', path: '/api/messages', method: 'GET', auth: true },
  { name: 'User Profile', path: '/api/user/profile', method: 'GET', auth: true },
  { name: 'Analytics Events', path: '/api/analytics/events', method: 'GET', auth: true },
  { name: 'Revenue', path: '/api/revenue', method: 'GET', auth: true },
  { name: 'Membership Status', path: '/api/membership/status', method: 'GET', auth: true },
  
  // Admin APIs
  { name: 'Admin - Users', path: '/api/admin/users?limit=20', method: 'GET', auth: true },
  { name: 'Admin - Bookings', path: '/api/admin/bookings?limit=20', method: 'GET', auth: true },
  { name: 'Admin - Analytics', path: '/api/admin/analytics', method: 'GET', auth: true },
];

async function testEndpoint(endpoint) {
  const start = Date.now();
  
  return new Promise((resolve) => {
    const url = new URL(endpoint.path, BASE_URL);
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const duration = Date.now() - start;
        resolve({
          ...endpoint,
          duration,
          status: res.statusCode,
          size: Buffer.byteLength(data, 'utf8')
        });
      });
    });
    
    req.on('error', (error) => {
      const duration = Date.now() - start;
      resolve({
        ...endpoint,
        duration,
        status: 'ERROR',
        error: error.message
      });
    });
    
    req.setTimeout(30000, () => {
      req.destroy();
      const duration = Date.now() - start;
      resolve({
        ...endpoint,
        duration,
        status: 'TIMEOUT',
        error: 'Request timeout after 30s'
      });
    });
  });
}

async function runAudit() {
  console.log('🔍 COMPREHENSIVE API PERFORMANCE AUDIT\n');
  console.log('━'.repeat(80));
  
  const results = [];
  
  // Test each endpoint twice (first load + cached)
  for (const endpoint of endpoints) {
    // First call
    const result1 = await testEndpoint(endpoint);
    results.push({ ...result1, attempt: 'first' });
    
    // Small delay
    await new Promise(r => setTimeout(r, 50));
    
    // Second call (should be cached)
    const result2 = await testEndpoint(endpoint);
    results.push({ ...result2, attempt: 'cached' });
    
    // Progress indicator
    process.stdout.write('.');
    
    await new Promise(r => setTimeout(r, 100));
  }
  
  console.log('\n' + '━'.repeat(80));
  console.log('\n📊 RESULTS:\n');
  
  // Group by endpoint
  const grouped = {};
  results.forEach(r => {
    if (!grouped[r.name]) grouped[r.name] = {};
    grouped[r.name][r.attempt] = r;
  });
  
  // Performance categories
  const excellent = [];
  const good = [];
  const slow = [];
  const critical = [];
  
  Object.entries(grouped).forEach(([name, attempts]) => {
    const first = attempts.first;
    const cached = attempts.cached;
    
    // Color coding
    let color = '\x1b[32m'; // Green
    let category = 'excellent';
    
    if (first.duration > 2000) {
      color = '\x1b[35m'; // Magenta - Critical
      category = 'critical';
      critical.push({ name, first, cached });
    } else if (first.duration > 1000) {
      color = '\x1b[31m'; // Red
      category = 'slow';
      slow.push({ name, first, cached });
    } else if (first.duration > 500) {
      color = '\x1b[33m'; // Yellow
      category = 'good';
      good.push({ name, first, cached });
    } else {
      excellent.push({ name, first, cached });
    }
    
    const improvement = first.duration > 0 
      ? ((first.duration - cached.duration) / first.duration * 100).toFixed(0)
      : 0;
    
    console.log(
      `${color}${name.padEnd(30)}\x1b[0m` +
      `First: ${first.duration.toString().padStart(5)}ms  ` +
      `Cached: ${cached.duration.toString().padStart(4)}ms  ` +
      `(${improvement}% faster)  ` +
      `[${first.status}]`
    );
  });
  
  // Summary
  console.log('\n' + '━'.repeat(80));
  console.log('\n📈 SUMMARY:\n');
  console.log(`🟢 Excellent (<500ms):    ${excellent.length.toString().padStart(2)} endpoints`);
  console.log(`🟡 Good (500-1000ms):     ${good.length.toString().padStart(2)} endpoints`);
  console.log(`🔴 Slow (1000-2000ms):    ${slow.length.toString().padStart(2)} endpoints`);
  console.log(`🟣 Critical (>2000ms):    ${critical.length.toString().padStart(2)} endpoints`);
  
  // Show slow endpoints for optimization
  if (slow.length > 0 || critical.length > 0) {
    console.log('\n⚠️  NEEDS OPTIMIZATION:\n');
    [...critical, ...slow].forEach(({ name, first }) => {
      console.log(`   • ${name}: ${first.duration}ms - ${first.path}`);
    });
  }
  
  // Performance score
  const total = endpoints.length;
  const score = ((excellent.length + good.length * 0.7) / total * 100).toFixed(0);
  
  console.log('\n' + '━'.repeat(80));
  console.log(`\n🎯 PERFORMANCE SCORE: ${score}%\n`);
  
  if (score >= 90) {
    console.log('✅ EXCELLENT! System is highly optimized.');
  } else if (score >= 70) {
    console.log('👍 GOOD! But there\'s room for improvement.');
  } else {
    console.log('⚠️  NEEDS WORK! Please optimize slow endpoints.');
  }
  
  // Cache effectiveness
  const avgCacheImprovement = results
    .filter(r => r.attempt === 'cached' && r.duration > 0)
    .reduce((sum, r, i, arr) => {
      const first = grouped[r.name].first.duration;
      const improvement = (first - r.duration) / first * 100;
      return sum + improvement / arr.length;
    }, 0);
  
  console.log(`\n⚡ Cache Effectiveness: ${avgCacheImprovement.toFixed(0)}% average improvement`);
  console.log('\n' + '━'.repeat(80));
}

runAudit().catch(console.error);
