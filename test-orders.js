const fetch = require("node-fetch");

const BASE_URL = "http://localhost:4000";

async function testOrdersAPI() {
  try {
    console.log("🧪 Testing Orders API...");

    // 1. First, create some test orders
    console.log("\n1. Creating test orders...");

    // Create complete test order
    const createOrderResponse = await fetch(
      `${BASE_URL}/api/debug/create-test-order-complete`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
    );
    const createOrderResult = await createOrderResponse.json();
    console.log("✅ Create test order result:", createOrderResult);

    // Create another test order
    const createOrder2Response = await fetch(
      `${BASE_URL}/api/debug/create-test-order-complete`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
    );
    const createOrder2Result = await createOrder2Response.json();
    console.log("✅ Create test order 2 result:", createOrder2Result);

    // 2. Test getting all orders (need admin token for this)
    console.log("\n2. Testing get orders API...");

    // First login as admin
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@zoxvn.com", // or admin@example.com
        password: "admin123",
      }),
    });

    if (!loginResponse.ok) {
      console.log("⚠️ Admin login failed, trying to create admin...");

      // Try to create admin
      const createAdminResponse = await fetch(
        `${BASE_URL}/api/auth/create-admin`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      );
      const createAdminResult = await createAdminResponse.json();
      console.log("Create admin result:", createAdminResult);

      // Try login again
      const loginResponse2 = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "admin@example.com",
          password: "admin123",
        }),
      });

      if (!loginResponse2.ok) {
        throw new Error("Cannot login as admin");
      }

      const loginData2 = await loginResponse2.json();
      var token = loginData2.data.token;
    } else {
      const loginData = await loginResponse.json();
      var token = loginData.data.token;
    }

    console.log("✅ Admin login successful");

    // Now get orders
    const ordersResponse = await fetch(`${BASE_URL}/api/orders?limit=10`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!ordersResponse.ok) {
      console.error(
        "❌ Orders API failed:",
        ordersResponse.status,
        await ordersResponse.text(),
      );
      return;
    }

    const ordersResult = await ordersResponse.json();
    console.log("✅ Orders API result:");
    console.log("  Success:", ordersResult.success);
    console.log("  Total orders:", ordersResult.data?.orders?.length || 0);

    if (ordersResult.data?.orders?.length > 0) {
      console.log("  First order:");
      const firstOrder = ordersResult.data.orders[0];
      console.log("    - ID:", firstOrder.id);
      console.log("    - Order Number:", firstOrder.order_number);
      console.log("    - Customer:", firstOrder.customer_name);
      console.log("    - Total:", firstOrder.total_amount);
      console.log("    - Items:", firstOrder.items?.length || 0);

      if (firstOrder.items?.length > 0) {
        console.log("    - First item:", firstOrder.items[0].product_name);
      }
    }

    console.log("\n🎉 Orders API test completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

// Run the test
testOrdersAPI();
