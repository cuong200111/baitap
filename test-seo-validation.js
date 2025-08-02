#!/usr/bin/env node

/**
 * Comprehensive SEO Validation Test
 * Tests robots.txt and sitemap.xml for maximum SEO optimization
 */

const API_BASE = "http://localhost:4000";
const FRONTEND_BASE = "http://localhost:3000";

async function testSeoFiles() {
  console.log("🔍 HACOM SEO FILES VALIDATION");
  console.log("🌐 Testing Frontend URLs (where SEO files should be accessible)");
  console.log("=".repeat(50));

  const tests = [
    // Test robots.txt from frontend
    {
      name: "Robots.txt Frontend Access",
      url: `${FRONTEND_BASE}/robots.txt`,
      expectedContent: ["User-agent:", "Sitemap:", "HACOM", "Disallow:"],
    },

    // Test sitemap.xml from frontend
    {
      name: "Sitemap.xml Frontend Access",
      url: `${FRONTEND_BASE}/sitemap.xml`,
      expectedContent: ["<?xml", "<urlset", "<url>", "<loc>", "HACOM"],
    },

    // Test backend APIs still work (for admin panel)
    {
      name: "Backend Categories API",
      url: `${API_BASE}/api/categories`,
      expectedContent: ["success", "data"],
    },

    // Test backend products API
    {
      name: "Backend Products API",
      url: `${API_BASE}/api/products`,
      expectedContent: ["success", "data"],
    },

    // Test backend health
    {
      name: "Backend Health Check",
      url: `${API_BASE}/api/health`,
      expectedContent: ["success", "running"],
    },
  ];

  const results = [];

  for (const test of tests) {
    console.log(`\n🧪 Testing: ${test.name}`);
    console.log(`📍 URL: ${test.url}`);

    try {
      const response = await fetch(test.url);
      const content = await response.text();

      if (response.ok) {
        console.log(`✅ Status: ${response.status} OK`);
        console.log(`📏 Size: ${content.length} bytes`);

        // Check content validation
        const missingContent = test.expectedContent.filter(
          (expected) => !content.includes(expected),
        );

        if (missingContent.length === 0) {
          console.log(`✅ Content: All expected content found`);
          results.push({ ...test, status: "PASS", size: content.length });
        } else {
          console.log(`⚠️  Content: Missing - ${missingContent.join(", ")}`);
          results.push({
            ...test,
            status: "PARTIAL",
            size: content.length,
            missing: missingContent,
          });
        }

        // Special validations
        if (test.name.includes("Robots")) {
          const userAgentCount = (content.match(/User-agent:/g) || []).length;
          const disallowCount = (content.match(/Disallow:/g) || []).length;
          const sitemapCount = (content.match(/Sitemap:/g) || []).length;

          console.log(`📊 Robots Analysis:`);
          console.log(`   🤖 User-agents: ${userAgentCount}`);
          console.log(`   🚫 Disallow rules: ${disallowCount}`);
          console.log(`   🗺️  Sitemaps: ${sitemapCount}`);
        }

        if (test.name.includes("Sitemap") && !test.name.includes("Index")) {
          const urlCount = (content.match(/<url>/g) || []).length;
          const imageCount = (content.match(/<image:image>/g) || []).length;
          const lastmodCount = (content.match(/<lastmod>/g) || []).length;

          console.log(`📊 Sitemap Analysis:`);
          console.log(`   🔗 URLs: ${urlCount}`);
          console.log(`   🖼️  Images: ${imageCount}`);
          console.log(`   📅 Last Modified: ${lastmodCount}`);
        }
      } else {
        console.log(`❌ Status: ${response.status} ${response.statusText}`);
        results.push({
          ...test,
          status: "FAIL",
          error: `HTTP ${response.status}`,
        });
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      results.push({ ...test, status: "ERROR", error: error.message });
    }
  }

  // Summary Report
  console.log("\n" + "=".repeat(50));
  console.log("📋 SEO VALIDATION SUMMARY");
  console.log("=".repeat(50));

  const passed = results.filter((r) => r.status === "PASS").length;
  const total = results.length;
  const score = Math.round((passed / total) * 100);

  console.log(`🎯 Overall Score: ${score}% (${passed}/${total} tests passed)`);

  results.forEach((result, index) => {
    const icon =
      result.status === "PASS"
        ? "✅"
        : result.status === "PARTIAL"
          ? "⚠️"
          : "❌";
    console.log(`${index + 1}. ${icon} ${result.name}: ${result.status}`);
    if (result.size) console.log(`   📏 Size: ${result.size} bytes`);
    if (result.error) console.log(`   ❌ Error: ${result.error}`);
    if (result.missing)
      console.log(`   ⚠️  Missing: ${result.missing.join(", ")}`);
  });

  // SEO Recommendations
  console.log("\n🚀 SEO OPTIMIZATION RECOMMENDATIONS:");
  console.log("1. ✅ Robots.txt should block admin, api, user pages");
  console.log("2. ✅ Sitemap should include all products and categories");
  console.log("3. ✅ Image sitemaps improve visual search ranking");
  console.log("4. ✅ Mobile optimization tags boost mobile SEO");
  console.log("5. ✅ Regular updates ensure fresh content signals");

  console.log("\n📊 TECHNICAL SEO CHECKLIST:");
  console.log("□ SSL Certificate (HTTPS)");
  console.log("□ Page Speed Optimization");
  console.log("□ Mobile Responsiveness");
  console.log("□ Schema.org Markup");
  console.log("□ Meta Tags Optimization");
  console.log("□ Internal Linking Structure");
  console.log("□ XML Sitemaps (✅ if tests pass)");
  console.log("□ Robots.txt Configuration (✅ if tests pass)");

  return score;
}

// Admin Panel Integration Test
async function testAdminPanelIntegration() {
  console.log("\n🔧 ADMIN PANEL INTEGRATION TEST");
  console.log("=".repeat(50));

  const adminTests = [
    {
      name: "Generate Sitemap API",
      url: `${API_BASE}/api/admin/generate-sitemap`,
      method: "POST",
    },
    {
      name: "Generate Robots API",
      url: `${API_BASE}/api/admin/generate-robots`,
      method: "POST",
    },
    {
      name: "SEO Settings API",
      url: `${API_BASE}/api/admin/seo-settings`,
      method: "GET",
    },
  ];

  console.log("⚠️  Note: Admin tests require authentication");
  console.log("🔑 Run these manually in admin panel:");

  adminTests.forEach((test, index) => {
    console.log(`${index + 1}. ${test.name}: ${test.method} ${test.url}`);
  });

  console.log("\n📝 Manual Testing Steps:");
  console.log("1. Go to: http://localhost:3000/admin/settings");
  console.log("2. Click 'SEO Status' tab");
  console.log("3. Test 'Generate Sitemap' button");
  console.log("4. Test 'Generate Robots' button");
  console.log("5. Check 'Advanced SEO' tab functionality");
  console.log("6. Verify notifications appear correctly");
}

// Main execution
async function runAllTests() {
  console.log("🚀 HACOM SEO SYSTEM VALIDATION");
  console.log("🕐 Started: " + new Date().toISOString());
  console.log("🌐 Backend: " + API_BASE);
  console.log("🖥️  Frontend: " + FRONTEND_BASE);

  const score = await testSeoFiles();
  await testAdminPanelIntegration();

  console.log("\n" + "=".repeat(50));
  console.log(`🎉 VALIDATION COMPLETE! Overall Score: ${score}%`);

  if (score >= 80) {
    console.log(
      "🏆 EXCELLENT: SEO system is optimized for maximum performance!",
    );
  } else if (score >= 60) {
    console.log("👍 GOOD: SEO system is functional, minor improvements needed");
  } else {
    console.log("⚠️  NEEDS WORK: Please address the failing tests above");
  }

  console.log("🕐 Completed: " + new Date().toISOString());
}

// Run if called directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { testSeoFiles, testAdminPanelIntegration };
