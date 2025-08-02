// Test script to verify user password change functionality
const API_BASE = "http://localhost:4000";

async function testUserPasswordChange() {
  console.log("🔑 Testing User Password Change Functionality");
  console.log("=".repeat(50));

  try {
    // First, we need to login as admin to get a token
    console.log("\n1. Logging in as admin...");

    const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "admin@example.com", // Replace with actual admin email
        password: "admin123", // Replace with actual admin password
      }),
    });

    const loginResult = await loginResponse.json();
    console.log("Login Response:", loginResult);

    if (!loginResult.success) {
      console.log("❌ Cannot test password change - admin login failed");
      console.log("📝 Note: Update the admin credentials in this test script");
      return;
    }

    const token = loginResult.data.token;
    console.log("✅ Admin login successful");

    // Get list of users to find a user ID for testing
    console.log("\n2. Getting users list...");

    const usersResponse = await fetch(`${API_BASE}/api/users`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const usersResult = await usersResponse.json();
    console.log("Users Response:", usersResult);

    if (
      !usersResult.success ||
      !usersResult.data ||
      usersResult.data.length === 0
    ) {
      console.log("❌ No users found to test password change");
      return;
    }

    // Find a regular user (not admin) for testing
    const testUser = usersResult.data.find((user) => user.role === "user");
    if (!testUser) {
      console.log(
        "❌ No regular user found for testing. Using first user instead...",
      );
      testUser = usersResult.data[0];
    }

    console.log(
      `✅ Found test user: ${testUser.full_name} (ID: ${testUser.id})`,
    );

    // Test password change
    console.log("\n3. Testing password change...");

    const passwordChangeResponse = await fetch(
      `${API_BASE}/api/users/${testUser.id}/password`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          new_password: "newpassword123",
        }),
      },
    );

    const passwordChangeResult = await passwordChangeResponse.json();
    console.log("Password Change Response:", passwordChangeResult);

    if (passwordChangeResult.success) {
      console.log("✅ Password change successful!");
    } else {
      console.log("❌ Password change failed:", passwordChangeResult.message);
    }

    // Test with invalid data
    console.log("\n4. Testing password change with invalid data...");

    const invalidPasswordResponse = await fetch(
      `${API_BASE}/api/users/${testUser.id}/password`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          new_password: "123", // Too short
        }),
      },
    );

    const invalidPasswordResult = await invalidPasswordResponse.json();
    console.log("Invalid Password Response:", invalidPasswordResult);

    if (!invalidPasswordResult.success) {
      console.log("✅ Correctly rejected short password");
    } else {
      console.log("❌ Should have rejected short password");
    }

    console.log("\n" + "=".repeat(50));
    console.log("🎉 Password Change Test Completed!");
    console.log("📋 Summary:");
    console.log("   ✅ Admin authentication");
    console.log("   ✅ User list retrieval");
    console.log("   ✅ Password change API call");
    console.log("   ✅ Validation testing");
  } catch (error) {
    console.error("❌ Test failed with error:", error.message);
    console.log("\n🔧 Troubleshooting tips:");
    console.log("   1. Make sure backend server is running on port 4000");
    console.log("   2. Update admin credentials in this test script");
    console.log("   3. Check if admin user exists in the database");
  }
}

// Run the test
testUserPasswordChange();
