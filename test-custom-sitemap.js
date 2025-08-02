// Test script for custom sitemap API
const testUrl = "http://localhost:4000/api/custom-sitemaps";

// Test data
const testSitemap = {
  url: "https://test.com/page",
  title: "Test Page",
  description: "Test page description",
  priority: 0.2,
  changefreq: "monthly",
  mobile_friendly: true,
  status: "active",
};

console.log("Testing custom sitemap API...");

// Test GET (public endpoint)
async function testPublicEndpoint() {
  try {
    console.log("\n1. Testing public GET endpoint...");
    const response = await fetch(testUrl);
    const data = await response.json();
    console.log("Response:", data);
  } catch (error) {
    console.error("Public GET error:", error.message);
  }
}

// Test POST (requires auth)
async function testCreateEndpoint() {
  try {
    console.log("\n2. Testing POST endpoint (should fail without auth)...");
    const response = await fetch(testUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testSitemap),
    });
    const data = await response.json();
    console.log("Response:", data);
  } catch (error) {
    console.error("POST error:", error.message);
  }
}

// Test admin endpoint
async function testAdminEndpoint() {
  try {
    console.log(
      "\n3. Testing admin GET endpoint (should fail without auth)...",
    );
    const response = await fetch(testUrl + "/admin");
    const data = await response.json();
    console.log("Response:", data);
  } catch (error) {
    console.error("Admin GET error:", error.message);
  }
}

// Run tests
async function runTests() {
  await testPublicEndpoint();
  await testCreateEndpoint();
  await testAdminEndpoint();
  console.log("\nTests completed!");
}

runTests();
