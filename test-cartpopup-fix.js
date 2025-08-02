// Quick test to verify CartPopup fix
const API_BASE = "http://localhost:4000";

async function testCartPopupFix() {
  console.log("🧪 Testing CartPopup Fix...\n");

  const sessionId = 'test_cartpopup_' + Date.now();

  try {
    // Step 1: Add item to cart
    console.log("1. Adding item to cart...");
    const addResponse = await fetch(`${API_BASE}/api/cart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        product_id: 2,
        quantity: 1,
      }),
    });

    const addData = await addResponse.json();
    if (!addData.success) {
      console.log("❌ Add failed:", addData.message);
      return;
    }
    
    const cartItemId = addData.data.cart_item_id;
    console.log("✅ Item added, cart_item_id:", cartItemId);

    // Step 2: Test DELETE with correct format
    console.log("\n2. Testing DELETE with correct format...");
    const deleteResponse = await fetch(`${API_BASE}/api/cart/${cartItemId}`, {
      method: "DELETE",
    });

    const deleteData = await deleteResponse.json();
    console.log("DELETE Response:", deleteData);
    
    if (deleteData.success) {
      console.log("✅ DELETE works correctly with URL path format");
    } else {
      console.log("❌ DELETE failed:", deleteData.message);
    }

    // Step 3: Test UPDATE with correct format  
    console.log("\n3. Testing UPDATE format...");
    
    // Add another item first
    const addResponse2 = await fetch(`${API_BASE}/api/cart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        product_id: 2,
        quantity: 1,
      }),
    });
    
    const addData2 = await addResponse2.json();
    if (addData2.success) {
      const cartItemId2 = addData2.data.cart_item_id;
      
      const updateResponse = await fetch(`${API_BASE}/api/cart/${cartItemId2}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: 2 }),
      });

      const updateData = await updateResponse.json();
      console.log("UPDATE Response:", updateData);
      
      if (updateData.success) {
        console.log("✅ UPDATE works correctly with URL path format");
      } else {
        console.log("❌ UPDATE failed:", updateData.message);
      }

      // Clean up
      await fetch(`${API_BASE}/api/cart/${cartItemId2}`, { method: "DELETE" });
    }

  } catch (error) {
    console.log("❌ Test error:", error.message);
  }

  console.log("\n🏁 CartPopup fix test completed!");
}

// Run test
testCartPopupFix().catch(console.error);
