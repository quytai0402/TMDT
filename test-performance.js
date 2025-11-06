#!/usr/bin/env node

const http = require('http');

const BASE_URL = 'http://localhost:3000';

async function testEndpoint(name, path) {
  const start = Date.now();
  
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const duration = Date.now() - start;
        const status = res.statusCode;
        resolve({ name, path, duration, status });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout after 30s'));
    });
  });
}

async function runTests() {
  console.log('🧪 Testing API Performance...\n');
  console.log('━'.repeat(60));
  
  const tests = [
    { name: 'Home Page', path: '/' },
    { name: 'Listings API (50 items)', path: '/api/listings?limit=50' },
    { name: 'Listings API (cached)', path: '/api/listings?limit=50' },
    { name: 'Notifications API', path: '/api/notifications' },
    { name: 'Notifications API (cached)', path: '/api/notifications' },
    { name: 'Auth Session', path: '/api/auth/session' },
    { name: 'Search Page', path: '/search' },
    { name: 'Single Listing', path: '/api/listings?limit=1' },
  ];

  for (const test of tests) {
    try {
      const result = await testEndpoint(test.name, test.path);
      
      // Color coding based on performance
      let color = '\x1b[32m'; // Green
      if (result.duration > 1000) color = '\x1b[31m'; // Red
      else if (result.duration > 500) color = '\x1b[33m'; // Yellow
      
      console.log(
        `${color}${result.name.padEnd(30)}\x1b[0m` +
        `${result.duration.toString().padStart(6)}ms ` +
        `(${result.status})`
      );
      
      // Small delay between tests
      await new Promise(r => setTimeout(r, 100));
    } catch (error) {
      console.log(`\x1b[31m${test.name.padEnd(30)}\x1b[0m ERROR: ${error.message}`);
    }
  }
  
  console.log('━'.repeat(60));
  console.log('\n✅ Performance test completed!');
  console.log('\n📊 Legend:');
  console.log('  \x1b[32m■ Green\x1b[0m  = Excellent (<500ms)');
  console.log('  \x1b[33m■ Yellow\x1b[0m = Good (500-1000ms)');
  console.log('  \x1b[31m■ Red\x1b[0m    = Needs optimization (>1000ms)');
}

runTests().catch(console.error);
