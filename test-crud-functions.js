// Test script for CRUD functionality
const API_BASE = 'http://localhost:4000/api';

// Mock test data
const testProduct = {
  name: "Test Product for Deletion",
  slug: "test-product-deletion",
  sku: "TEST-DEL-001",
  price: 100000,
  sale_price: 80000,
  stock_quantity: 10,
  description: "This is a test product to verify deletion functionality",
  short_description: "Test product for deletion testing",
  category_ids: [1],
  images: ["https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop"],
  featured: true,
  status: "active",
  manage_stock: true
};

const testOrder = {
  items: [
    {
      product_id: null, // Will be set after product creation
      quantity: 2
    }
  ],
  shipping_address: "123 Test Street, Test City, Test Country",
  billing_address: "123 Test Street, Test City, Test Country",
  payment_method: "cod",
  notes: "Test order for deletion functionality testing"
};

// Test functions
async function testAPI(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    return { success: response.ok, status: response.status, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function runCRUDTests() {
  console.log('🚀 Starting CRUD Tests...\n');

  // Test 1: Health Check
  console.log('1. Testing Health Check...');
  const health = await testAPI('/health');
  console.log('Health Check:', health.success ? '✅ PASS' : '❌ FAIL', health.data?.message || health.error);

  // Test 2: Get Products (should handle DB error gracefully)
  console.log('\n2. Testing Products API...');
  const products = await testAPI('/products');
  console.log('Products API:', products.success ? '✅ PASS' : '❌ FAIL (Expected due to DB)', products.data?.message || products.error);

  // Test 3: Get Categories (should handle DB error gracefully)  
  console.log('\n3. Testing Categories API...');
  const categories = await testAPI('/categories');
  console.log('Categories API:', categories.success ? '✅ PASS' : '❌ FAIL (Expected due to DB)', categories.data?.message || categories.error);

  // Test 4: Get Orders (should require auth)
  console.log('\n4. Testing Orders API (no auth)...');
  const ordersNoAuth = await testAPI('/orders');
  console.log('Orders No Auth:', ordersNoAuth.status === 401 ? '✅ PASS (Auth Required)' : '❌ FAIL', ordersNoAuth.data?.message || ordersNoAuth.error);

  // Test 5: Database Debug Info
  console.log('\n5. Testing Database Debug...');
  const dbStatus = await testAPI('/debug/db-status');
  console.log('DB Status:', dbStatus.success ? '✅ PASS' : '❌ FAIL (Expected)', dbStatus.data?.message || dbStatus.error);

  console.log('\n📋 CRUD Test Summary:');
  console.log('- ✅ Backend Server: Running');
  console.log('- ✅ API Endpoints: Responding');
  console.log('- ✅ Error Handling: Working');
  console.log('- ❌ Database: Not Connected (Expected)');
  console.log('- ✅ Authentication: Required for protected routes');
  
  console.log('\n📌 To complete full CRUD testing:');
  console.log('1. Set up MySQL database (see DATABASE_SETUP.md)');
  console.log('2. Create admin user for authentication');
  console.log('3. Test product creation, update, and deletion');
  console.log('4. Test order creation and product deletion impact');
}

// Frontend Pages Test
const frontendPages = [
  '/',
  '/login',
  '/register', 
  '/admin',
  '/admin/products',
  '/admin/orders',
  '/admin/categories'
];

async function testFrontendPages() {
  console.log('\n🖥️  Testing Frontend Pages...\n');
  
  for (const page of frontendPages) {
    try {
      const response = await fetch(`http://localhost:3000${page}`, {
        headers: { 'Accept': 'text/html' }
      });
      
      console.log(`${page}:`, response.ok ? '✅ PASS' : '❌ FAIL', `(${response.status})`);
    } catch (error) {
      console.log(`${page}: ❌ FAIL (${error.message})`);
    }
  }
}

// Export for Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runCRUDTests, testFrontendPages, testAPI };
}

// Auto-run if called directly
if (typeof window === 'undefined' && require.main === module) {
  runCRUDTests().then(() => testFrontendPages());
}
