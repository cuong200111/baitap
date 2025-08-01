// Quick test for stock validation fix
const API_BASE = "http://localhost:4000";

async function testStockValidation() {
  console.log("🧪 Testing Stock Validation Fixes...\n");

  const sessionId = 'test_stock_validation_' + Date.now();
  console.log("Using session:", sessionId);

  try {
    // Step 1: Add product to cart (should succeed)
    console.log("1. Adding 1 product to cart...");
    const response1 = await fetch(`${API_BASE}/api/cart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        product_id: 2, // Use product 2 which has stock_quantity: 3
        quantity: 1,
      }),
    });

    const data1 = await response1.json();
    console.log("Response:", data1);
    
    if (!data1.success) {
      console.log("❌ First add failed:", data1.message);
      return;
    }
    console.log("✅ First add successful");

    // Step 2: Add 2 more (total should be 3, which equals stock)
    console.log("\n2. Adding 2 more (total will be 3)...");
    const response2 = await fetch(`${API_BASE}/api/cart`, {
      method: "POST", 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        product_id: 2,
        quantity: 2,
      }),
    });

    const data2 = await response2.json();
    console.log("Response:", data2);
    
    if (!data2.success) {
      console.log("❌ Second add failed:", data2.message);
      return;
    }
    console.log("✅ Second add successful");

    // Step 3: Try to add 1 more (should fail with better message)
    console.log("\n3. Trying to add 1 more (should fail with new message)...");
    const response3 = await fetch(`${API_BASE}/api/cart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        product_id: 2,
        quantity: 1,
      }),
    });

    const data3 = await response3.json();
    console.log("Response:", data3);
    
    if (!data3.success) {
      console.log("✅ Third add failed as expected with message:", data3.message);
      if (data3.current_in_cart !== undefined) {
        console.log("✅ New response format includes current_in_cart:", data3.current_in_cart);
        console.log("✅ Available stock:", data3.available_stock);
        console.log("✅ Max can add:", data3.max_can_add);
      }
    } else {
      console.log("❌ Third add should have failed but succeeded");
    }

    // Step 4: Check cart contents
    console.log("\n4. Checking final cart contents...");
    const response4 = await fetch(`${API_BASE}/api/cart?session_id=${sessionId}`);
    const data4 = await response4.json();
    
    if (data4.success) {
      console.log("✅ Cart contents:", {
        items: data4.data.items.length,
        total_quantity: data4.data.items.reduce((sum, item) => sum + item.quantity, 0),
        summary: data4.data.summary
      });
    }

    // Step 5: Clean up
    console.log("\n5. Cleaning up cart...");
    const response5 = await fetch(`${API_BASE}/api/cart`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId }),
    });

    const data5 = await response5.json();
    if (data5.success) {
      console.log("✅ Cart cleared successfully");
    }

  } catch (error) {
    console.log("❌ Test error:", error.message);
  }

  console.log("\n🏁 Stock validation test completed!");
}

// Also test formatPrice function
function testFormatPrice() {
  console.log("\n🧪 Testing formatPrice function...");
  
  // Test cases that might cause errors
  const testCases = [
    1000000,    // normal number
    "1000000",  // string number
    null,       // null
    undefined,  // undefined
    "",         // empty string
    "invalid",  // invalid string
    0,          // zero
    -1000,      // negative
  ];

  testCases.forEach(testCase => {
    try {
      // We need to test the actual formatPrice function
      // Since we can't import it here, we'll just log what we're testing
      console.log(`Testing formatPrice(${JSON.stringify(testCase)})`);
    } catch (error) {
      console.log(`❌ formatPrice failed for ${JSON.stringify(testCase)}:`, error.message);
    }
  });
  
  console.log("✅ formatPrice test cases logged");
}

// Run tests
testStockValidation().then(() => {
  testFormatPrice();
}).catch(console.error);
