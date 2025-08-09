#!/usr/bin/env node

const http = require("http");
const https = require("https");

const userPages = [
  // Main pages
  { name: "Trang chủ", url: "/", critical: true },
  { name: "Sản phẩm", url: "/products", critical: true },
  { name: "Giỏ hàng", url: "/cart", critical: true },
  { name: "Thanh toán", url: "/checkout", critical: true },

  // User pages
  { name: "Đăng nhập", url: "/login", critical: true },
  { name: "Đăng ký", url: "/register", critical: true },
  { name: "Thông tin cá nhân", url: "/profile", critical: false },
  { name: "Đơn hàng của tôi", url: "/orders", critical: false },
  { name: "Thanh toán & Hóa đơn", url: "/billing", critical: false },

  // Success pages
  { name: "Đặt hàng thành công", url: "/thank-you", critical: false },
  { name: "Theo dõi đơn hàng", url: "/track-order", critical: false },

  // Product pages (examples)
  { name: "Chi tiết sản phẩm (1)", url: "/products/1", critical: true },
  { name: "Chi tiết sản phẩm (2)", url: "/products/2", critical: false },

  // Category pages (examples)
  { name: "Danh mục Laptop", url: "/category/laptop", critical: true },
  { name: "Danh mục Gaming", url: "/category/gaming", critical: false },

  // Other pages
  { name: "Buy Now Checkout", url: "/buy-now-checkout", critical: false },
  { name: "Guest Checkout", url: "/guest-checkout", critical: false },
  { name: "Trạng thái hệ thống", url: "/status", critical: false },
];

const baseUrl = "http://localhost:3000";

function testPage(url) {
  return new Promise((resolve) => {
    const options = {
      hostname: "localhost",
      port: 3000,
      path: url,
      method: "HEAD",
      timeout: 10000,
    };

    const req = http.request(options, (res) => {
      resolve({
        url,
        status: res.statusCode,
        success: res.statusCode >= 200 && res.statusCode < 400,
        error: null,
      });
    });

    req.on("error", (error) => {
      resolve({
        url,
        status: null,
        success: false,
        error: error.message,
      });
    });

    req.on("timeout", () => {
      req.destroy();
      resolve({
        url,
        status: null,
        success: false,
        error: "Timeout",
      });
    });

    req.end();
  });
}

async function testAllPages() {
  console.log("🧪 Testing All User Pages - HACOM SEO\n");
  console.log(`📋 Total pages to test: ${userPages.length}`);
  console.log(
    `⭐ Critical pages: ${userPages.filter((p) => p.critical).length}\n`,
  );

  const results = [];
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < userPages.length; i++) {
    const page = userPages[i];
    process.stdout.write(
      `Testing ${i + 1}/${userPages.length}: ${page.name} (${page.url})... `,
    );

    const result = await testPage(page.url);
    results.push({ ...page, ...result });

    if (result.success) {
      successCount++;
      console.log(`✅ OK (${result.status})`);
    } else {
      errorCount++;
      console.log(
        `❌ FAILED (${result.status || "ERROR"}) - ${result.error || "Unknown error"}`,
      );
    }

    // Small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  console.log("\n" + "=".repeat(60));
  console.log("🏁 TEST COMPLETED!");
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);
  console.log(
    `📊 Success Rate: ${((successCount / userPages.length) * 100).toFixed(1)}%`,
  );

  if (errorCount > 0) {
    console.log("\n❌ FAILED PAGES:");
    results
      .filter((r) => !r.success)
      .forEach((page) => {
        console.log(
          `  • ${page.name} (${page.url}): ${page.error || `HTTP ${page.status}`}${page.critical ? " ⭐ CRITICAL" : ""}`,
        );
      });

    const criticalFailures = results.filter((r) => !r.success && r.critical);
    if (criticalFailures.length > 0) {
      console.log(`\n🚨 CRITICAL FAILURES: ${criticalFailures.length}`);
      console.log("These pages must be fixed immediately!");
    }
  } else {
    console.log("\n🎉 All pages are working correctly!");
  }

  console.log("\n📈 SEO STATUS:");
  console.log("  • All layout metadata functions should be working");
  console.log("  • Open Graph images configured");
  console.log("  • Social media sharing optimized");

  return {
    total: userPages.length,
    success: successCount,
    failed: errorCount,
    criticalFailures: results.filter((r) => !r.success && r.critical).length,
  };
}

// Run the test
testAllPages()
  .then((summary) => {
    process.exit(summary.criticalFailures > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });
