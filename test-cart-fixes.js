// Test script to verify cart API fixes for both authenticated and guest users
const API_BASE = "http://localhost:4000";

async function testCartAPI() {
  console.log("🧪 Testing Cart API Fixes...\n");

  // Test 1: Guest user add to cart (using session_id)
  console.log("1. Testing Guest User Cart (session_id):");
  try {
    const sessionId = 'session_test_' + Date.now();
    
    const guestAddResponse = await fetch(`${API_BASE}/api/cart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        product_id: 1,
        quantity: 2,
      }),
    });

    const guestAddData = await guestAddResponse.json();
    console.log(`   Status: ${guestAddResponse.status}`);
    console.log(`   Response:`, guestAddData);

    if (guestAddData.success) {
      console.log("   ✅ Guest cart add successful");
      
      // Test getting guest cart
      const guestGetResponse = await fetch(`${API_BASE}/api/cart?session_id=${sessionId}`);
      const guestGetData = await guestGetResponse.json();
      console.log(`   Cart items count: ${guestGetData.data?.items?.length || 0}`);
    } else {
      console.log("   ❌ Guest cart add failed:", guestAddData.message);
    }
  } catch (error) {
    console.log("   ❌ Error testing guest cart:", error.message);
  }

  console.log("");

  // Test 2: Test stock validation
  console.log("2. Testing Stock Validation:");
  try {
    const sessionId = 'session_stock_test_' + Date.now();
    
    // Try to add a large quantity that might exceed stock
    const stockTestResponse = await fetch(`${API_BASE}/api/cart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        product_id: 1,
        quantity: 999, // Large quantity to test stock validation
      }),
    });

    const stockTestData = await stockTestResponse.json();
    console.log(`   Status: ${stockTestResponse.status}`);
    console.log(`   Response:`, stockTestData);

    if (!stockTestData.success && stockTestData.message.includes('stock')) {
      console.log("   ✅ Stock validation working correctly");
    } else {
      console.log("   ⚠️ Stock validation may need review");
    }
  } catch (error) {
    console.log("   ❌ Error testing stock validation:", error.message);
  }

  console.log("");

  // Test 3: Test API health
  console.log("3. Testing API Health:");
  try {
    const healthResponse = await fetch(`${API_BASE}/api/health`);
    const healthData = await healthResponse.json();
    console.log(`   Status: ${healthResponse.status}`);
    console.log(`   Backend health:`, healthData.success ? "✅ OK" : "❌ Error");
  } catch (error) {
    console.log("   ❌ Backend connection error:", error.message);
  }

  console.log("");

  // Test 4: Test products endpoint
  console.log("4. Testing Products Endpoint:");
  try {
    const productsResponse = await fetch(`${API_BASE}/api/products?limit=1`);
    const productsData = await productsResponse.json();
    console.log(`   Status: ${productsResponse.status}`);
    console.log(`   Products available: ${productsData.data?.products?.length || 0}`);
    
    if (productsData.data?.products?.length > 0) {
      const product = productsData.data.products[0];
      console.log(`   Sample product: ${product.name} (Stock: ${product.stock_quantity})`);
    }
  } catch (error) {
    console.log("   ❌ Error testing products:", error.message);
  }

  console.log("\n🏁 Cart API testing completed!");
}

// Run the test
testCartAPI().catch(console.error);
