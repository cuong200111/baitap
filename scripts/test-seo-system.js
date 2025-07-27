const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

const dbConfig = {
  host: "103.57.221.79",
  user: "qftuzbjqhosting_b5",
  password: "Iw~hwC@*9eyN.HQh",
  database: "qftuzbjqhosting_b5",
  port: 3306,
};

// Test SEO system functionality
async function testSeoSystem() {
  console.log("🔍 Starting comprehensive SEO system test...\n");

  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
    details: [],
  };

  let connection;

  try {
    // 1. Test database connection and tables
    console.log("1️⃣  Testing Database Connection...");

    connection = await mysql.createConnection(dbConfig);
    console.log("✅ Database connected successfully");
    results.passed++;

    // 2. Test SEO tables existence
    console.log("\n2️⃣  Testing SEO Tables...");
    const expectedTables = [
      "seo_settings",
      "seo_meta_data",
      "seo_redirects",
      "seo_analytics",
      "seo_link_optimization",
    ];

    for (const tableName of expectedTables) {
      try {
        const [rows] = await connection.execute(
          `
          SELECT COUNT(*) as count FROM information_schema.tables 
          WHERE table_schema = ? AND table_name = ?
        `,
          [dbConfig.database, tableName],
        );

        if (rows[0].count > 0) {
          console.log(`✅ Table ${tableName} exists`);
          results.passed++;
        } else {
          console.log(`❌ Table ${tableName} missing`);
          results.failed++;
          results.details.push(`Missing table: ${tableName}`);
        }
      } catch (error) {
        console.log(`❌ Error checking table ${tableName}: ${error.message}`);
        results.failed++;
        results.details.push(`Error checking ${tableName}: ${error.message}`);
      }
    }

    // 3. Test SEO settings
    console.log("\n3️⃣  Testing SEO Settings...");
    try {
      const [settings] = await connection.execute(
        "SELECT * FROM seo_settings LIMIT 1",
      );
      if (settings.length > 0) {
        console.log("✅ SEO settings configured");
        results.passed++;
      } else {
        console.log("⚠️  No SEO settings found");
        results.warnings++;
        results.details.push("No SEO settings configured");
      }
    } catch (error) {
      console.log(`❌ Error reading SEO settings: ${error.message}`);
      results.failed++;
      results.details.push(`SEO settings error: ${error.message}`);
    }

    // 4. Test meta data
    console.log("\n4️⃣  Testing Meta Data...");
    try {
      const [metaData] = await connection.execute(
        "SELECT COUNT(*) as count FROM seo_meta_data",
      );
      const count = metaData[0].count;
      if (count > 0) {
        console.log(`✅ Found ${count} meta data entries`);
        results.passed++;
      } else {
        console.log("⚠️  No meta data found");
        results.warnings++;
        results.details.push("No meta data entries");
      }
    } catch (error) {
      console.log(`❌ Error reading meta data: ${error.message}`);
      results.failed++;
      results.details.push(`Meta data error: ${error.message}`);
    }

    // 5. Test redirects
    console.log("\n5️⃣  Testing Redirects...");
    try {
      const [redirects] = await connection.execute(
        "SELECT COUNT(*) as count FROM seo_redirects",
      );
      const count = redirects[0].count;
      console.log(`ℹ️  Found ${count} redirect entries`);
      results.passed++;
    } catch (error) {
      console.log(`❌ Error reading redirects: ${error.message}`);
      results.failed++;
      results.details.push(`Redirects error: ${error.message}`);
    }

    // 6. Test analytics
    console.log("\n6️⃣  Testing Analytics...");
    try {
      const [analytics] = await connection.execute(
        "SELECT COUNT(*) as count FROM seo_analytics",
      );
      const count = analytics[0].count;
      console.log(`ℹ️  Found ${count} analytics entries`);
      results.passed++;
    } catch (error) {
      console.log(`❌ Error reading analytics: ${error.message}`);
      results.failed++;
      results.details.push(`Analytics error: ${error.message}`);
    }

    // 7. Test file existence
    console.log("\n7️⃣  Testing File System...");
    const requiredFiles = ["public/robots.txt", "public/sitemap.xml"];

    for (const filePath of requiredFiles) {
      const fullPath = path.join(process.cwd(), filePath);
      if (fs.existsSync(fullPath)) {
        console.log(`✅ File exists: ${filePath}`);
        results.passed++;
      } else {
        console.log(`⚠️  File missing: ${filePath}`);
        results.warnings++;
        results.details.push(`Missing file: ${filePath}`);
      }
    }
  } catch (error) {
    console.error("❌ Critical error during testing:", error);
    results.failed++;
    results.details.push(`Critical error: ${error.message}`);
  } finally {
    if (connection) {
      await connection.end();
      console.log("\n🔌 Database connection closed");
    }
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 SEO SYSTEM TEST SUMMARY");
  console.log("=".repeat(50));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⚠️  Warnings: ${results.warnings}`);

  if (results.details.length > 0) {
    console.log("\n📋 Details:");
    results.details.forEach((detail) => console.log(`   ${detail}`));
  }

  const total = results.passed + results.failed + results.warnings;
  const successRate =
    total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;
  console.log(`\n🎯 Success Rate: ${successRate}%`);

  if (results.failed === 0) {
    console.log("🎉 All critical tests passed!");
  } else {
    console.log("⚠️  Some tests failed - please review the issues above");
  }

  return results;
}

// Run the test
if (require.main === module) {
  testSeoSystem().catch(console.error);
}

module.exports = { testSeoSystem };
