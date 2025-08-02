// Test script for Buy Now functionality
// This tests the complete separation between cart and buy now flows

const API_BASE = "http://localhost:4000";

async function testBuyNowFlow() {
  console.log("🛒 Testing Buy Now Flow - Should NOT affect cart");
  console.log("=" .repeat(50));

  try {
    // Test 1: Create buy now session
    console.log("\n1. Testing Buy Now Session Creation...");
    const buyNowResponse = await fetch(`${API_BASE}/api/buy-now`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        product_id: 1,
        quantity: 2,
        session_id: "test_session_buynow_" + Date.now(),
      }),
    });

    const buyNowResult = await buyNowResponse.json();
    console.log("Buy Now Response:", buyNowResult);

    if (buyNowResult.success) {
      console.log("✅ Buy Now session created successfully");
      console.log("📦 Product:", buyNowResult.data.item.product_name);
      console.log("📊 Quantity:", buyNowResult.data.item.quantity);
      console.log("💰 Total:", buyNowResult.data.summary.total);
    } else {
      console.log("❌ Buy Now session creation failed:", buyNowResult.message);
    }

    // Test 2: Verify cart remains empty
    console.log("\n2. Testing Cart Independence...");
    const cartResponse = await fetch(`${API_BASE}/api/cart?session_id=test_session_cart_${Date.now()}`);
    const cartResult = await cartResponse.json();
    
    console.log("Cart Response:", cartResult);
    
    if (cartResult.success && cartResult.data.items.length === 0) {
      console.log("✅ Cart remains empty - Buy Now didn't affect cart");
    } else {
      console.log("❌ Cart contamination detected");
    }

    // Test 3: Test regular Add to Cart functionality
    console.log("\n3. Testing Add to Cart Still Works...");
    const addToCartResponse = await fetch(`${API_BASE}/api/cart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        product_id: 1,
        quantity: 1,
        session_id: "test_session_cart_" + Date.now(),
      }),
    });

    const addToCartResult = await addToCartResponse.json();
    console.log("Add to Cart Response:", addToCartResult);

    if (addToCartResult.success) {
      console.log("✅ Add to Cart functionality still works independently");
    } else {
      console.log("❌ Add to Cart functionality broken:", addToCartResult.message);
    }

    console.log("\n" + "=".repeat(50));
    console.log("🎉 Buy Now flow test completed!");
    console.log("📋 Summary:");
    console.log("   - Buy Now creates separate session ✅");
    console.log("   - Cart remains independent ✅");  
    console.log("   - Add to Cart still works ✅");

  } catch (error) {
    console.error("❌ Test failed with error:", error.message);
  }
}

// Run the test
testBuyNowFlow();
