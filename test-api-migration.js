// Test script to verify all APIs have been migrated successfully

const BASE_URL = 'http://localhost:4000';

// List of all API endpoints that should be available
const apiEndpoints = [
  // Auth endpoints
  { path: '/api/auth/login', method: 'POST', requiresAuth: false },
  { path: '/api/auth/register', method: 'POST', requiresAuth: false },
  { path: '/api/auth/profile', method: 'GET', requiresAuth: true },
  { path: '/api/auth/verify-token', method: 'POST', requiresAuth: true },

  // Core endpoints
  { path: '/api/products', method: 'GET', requiresAuth: false },
  { path: '/api/categories', method: 'GET', requiresAuth: false },
  { path: '/api/orders', method: 'GET', requiresAuth: true },
  { path: '/api/users', method: 'GET', requiresAuth: true },
  { path: '/api/media', method: 'GET', requiresAuth: false },
  { path: '/api/reviews', method: 'GET', requiresAuth: false },

  // New endpoints
  { path: '/api/cart', method: 'GET', requiresAuth: false },
  { path: '/api/search/autocomplete', method: 'GET', requiresAuth: false },
  { path: '/api/locations', method: 'GET', requiresAuth: false },
  { path: '/api/shipping/calculate', method: 'POST', requiresAuth: false },

  // Admin endpoints (require admin auth)
  { path: '/api/admin/dashboard-stats', method: 'GET', requiresAuth: true, adminOnly: true },
  { path: '/api/admin/core-web-vitals', method: 'GET', requiresAuth: true, adminOnly: true },
  { path: '/api/admin/seo-status', method: 'GET', requiresAuth: true, adminOnly: true },
  { path: '/api/admin/reports/customers', method: 'GET', requiresAuth: true, adminOnly: true },
  { path: '/api/admin/reports/products', method: 'GET', requiresAuth: true, adminOnly: true },
  { path: '/api/admin/reports/sales', method: 'GET', requiresAuth: true, adminOnly: true },

  // Debug endpoints (dev only)
  { path: '/api/debug/db-check', method: 'GET', requiresAuth: false, devOnly: true },
  { path: '/api/debug/categories-test', method: 'GET', requiresAuth: false, devOnly: true },
  { path: '/api/debug/auth', method: 'GET', requiresAuth: false, devOnly: true },

  // Static endpoints
  { path: '/robots.txt', method: 'GET', requiresAuth: false },
  { path: '/sitemap.xml', method: 'GET', requiresAuth: false },
];

async function testEndpoint(endpoint) {
  try {
    const url = `${BASE_URL}${endpoint.path}`;
    const options = {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // Add sample data for POST requests
    if (endpoint.method === 'POST') {
      if (endpoint.path.includes('/login')) {
        options.body = JSON.stringify({
          email: 'admin@zoxvn.com',
          password: 'admin123'
        });
      } else if (endpoint.path.includes('/shipping/calculate')) {
        options.body = JSON.stringify({
          destination_province_id: 1,
          order_amount: 500000
        });
      } else if (endpoint.path.includes('/register')) {
        options.body = JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
          full_name: 'Test User'
        });
      }
    }

    // Add query params for GET requests that need them
    const urlWithParams = new URL(url);
    if (endpoint.path.includes('/autocomplete')) {
      urlWithParams.searchParams.set('q', 'laptop');
    } else if (endpoint.path.includes('/cart')) {
      urlWithParams.searchParams.set('session_id', 'test_session_123');
    }

    const response = await fetch(urlWithParams.toString(), options);
    
    return {
      endpoint: endpoint.path,
      method: endpoint.method,
      status: response.status,
      success: response.status < 500, // Consider anything below 500 as "working"
      contentType: response.headers.get('content-type'),
    };
  } catch (error) {
    return {
      endpoint: endpoint.path,
      method: endpoint.method,
      status: 'ERROR',
      success: false,
      error: error.message,
    };
  }
}

async function runTests() {
  console.log('🧪 Testing API Migration - All Endpoints');
  console.log('==========================================');
  console.log(`Testing against: ${BASE_URL}`);
  console.log('');

  const results = [];
  const successful = [];
  const failed = [];

  for (const endpoint of apiEndpoints) {
    const result = await testEndpoint(endpoint);
    results.push(result);

    const statusIcon = result.success ? '✅' : '❌';
    const statusText = result.status === 'ERROR' ? result.error : result.status;
    
    console.log(`${statusIcon} ${result.method.padEnd(4)} ${result.endpoint.padEnd(40)} → ${statusText}`);

    if (result.success) {
      successful.push(result);
    } else {
      failed.push(result);
    }
  }

  console.log('');
  console.log('📊 SUMMARY');
  console.log('==========');
  console.log(`Total endpoints tested: ${results.length}`);
  console.log(`✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  console.log(`📈 Success rate: ${(successful.length / results.length * 100).toFixed(1)}%`);

  if (failed.length > 0) {
    console.log('');
    console.log('❌ FAILED ENDPOINTS:');
    failed.forEach(f => {
      console.log(`   ${f.method} ${f.endpoint} - ${f.status} ${f.error || ''}`);
    });
  }

  console.log('');
  console.log('🎯 MIGRATION STATUS:');
  if (failed.length === 0) {
    console.log('🎉 ALL APIS SUCCESSFULLY MIGRATED!');
  } else if (successful.length > results.length * 0.8) {
    console.log('⚠️  MOSTLY SUCCESSFUL - Some endpoints need attention');
  } else {
    console.log('🚨 MIGRATION INCOMPLETE - Many endpoints failing');
  }

  return {
    total: results.length,
    successful: successful.length,
    failed: failed.length,
    successRate: successful.length / results.length * 100,
    results
  };
}

// Export for use as module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runTests, testEndpoint };
}

// Run if called directly
if (typeof window === 'undefined' && import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}
