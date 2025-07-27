import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";
import { existsSync } from "fs";
import { join } from "path";

interface TestResult {
  name: string;
  status: "passed" | "failed" | "warning";
  message: string;
  details?: any;
}

export async function GET(request: NextRequest) {
  try {
    const results: TestResult[] = [];
    let overallScore = 0;
    const totalTests = 12;

    // Test 1: Database connection and SEO tables
    try {
      const tables = await executeQuery(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name LIKE 'seo_%'
      `);

      const expectedTables = [
        "seo_settings",
        "seo_meta_data",
        "seo_redirects",
        "seo_analytics",
        "seo_audit_issues",
        "seo_keywords",
        "seo_backlinks",
        "seo_content_optimization",
      ];

      const foundTables = Array.isArray(tables)
        ? tables.map((t) => t.name)
        : [];
      const missingTables = expectedTables.filter(
        (table) => !foundTables.includes(table),
      );

      if (missingTables.length === 0) {
        results.push({
          name: "SEO Database Tables",
          status: "passed",
          message: `All ${expectedTables.length} SEO tables exist`,
          details: { tables: foundTables },
        });
        overallScore++;
      } else {
        results.push({
          name: "SEO Database Tables",
          status: "failed",
          message: `Missing ${missingTables.length} tables`,
          details: { missing: missingTables, found: foundTables },
        });
      }
    } catch (error) {
      results.push({
        name: "SEO Database Tables",
        status: "failed",
        message: "Database connection failed",
        details: { error: error.message },
      });
    }

    // Test 2: SEO Settings count and completeness
    try {
      const settingsCount = await executeQuery(`
        SELECT COUNT(*) as count FROM seo_settings WHERE is_active = 1
      `);

      const count = Array.isArray(settingsCount)
        ? settingsCount[0]?.count || 0
        : 0;

      if (count >= 30) {
        results.push({
          name: "SEO Settings Count",
          status: "passed",
          message: `${count} SEO settings configured`,
          details: { count },
        });
        overallScore++;
      } else if (count >= 15) {
        results.push({
          name: "SEO Settings Count",
          status: "warning",
          message: `${count} SEO settings (recommend 30+)`,
          details: { count },
        });
        overallScore += 0.5;
      } else {
        results.push({
          name: "SEO Settings Count",
          status: "failed",
          message: `Only ${count} SEO settings configured`,
          details: { count },
        });
      }
    } catch (error) {
      results.push({
        name: "SEO Settings Count",
        status: "failed",
        message: "Failed to count SEO settings",
        details: { error: error.message },
      });
    }

    // Test 3: Key SEO settings existence
    try {
      const keySettings = await executeQuery(`
        SELECT setting_key, setting_value 
        FROM seo_settings 
        WHERE setting_key IN ('site_name', 'site_url', 'site_description', 'google_analytics_id', 'organization_name')
        AND is_active = 1
      `);

      const settings = {};
      if (Array.isArray(keySettings)) {
        keySettings.forEach((s) => {
          settings[s.setting_key] = s.setting_value;
        });
      }

      const requiredFields = ["site_name", "site_url", "site_description"];
      const missingRequired = requiredFields.filter(
        (field) => !settings[field] || settings[field].trim() === "",
      );

      if (missingRequired.length === 0) {
        results.push({
          name: "Key SEO Settings",
          status: "passed",
          message: "All required SEO settings configured",
          details: { configured: Object.keys(settings) },
        });
        overallScore++;
      } else {
        results.push({
          name: "Key SEO Settings",
          status: "failed",
          message: `Missing required settings: ${missingRequired.join(", ")}`,
          details: {
            missing: missingRequired,
            configured: Object.keys(settings),
          },
        });
      }
    } catch (error) {
      results.push({
        name: "Key SEO Settings",
        status: "failed",
        message: "Failed to check key SEO settings",
        details: { error: error.message },
      });
    }

    // Test 4: Products and Categories for sitemap
    try {
      const productCount = await executeQuery(`
        SELECT COUNT(*) as count FROM products WHERE status = 'active'
      `);
      const categoryCount = await executeQuery(`
        SELECT COUNT(*) as count FROM categories WHERE is_active = 1
      `);

      const products = Array.isArray(productCount)
        ? productCount[0]?.count || 0
        : 0;
      const categories = Array.isArray(categoryCount)
        ? categoryCount[0]?.count || 0
        : 0;

      if (products > 0 && categories > 0) {
        results.push({
          name: "Content for SEO",
          status: "passed",
          message: `${products} products, ${categories} categories`,
          details: { products, categories },
        });
        overallScore++;
      } else {
        results.push({
          name: "Content for SEO",
          status: "warning",
          message: "Limited content for SEO optimization",
          details: { products, categories },
        });
        overallScore += 0.5;
      }
    } catch (error) {
      results.push({
        name: "Content for SEO",
        status: "failed",
        message: "Failed to check content count",
        details: { error: error.message },
      });
    }

    // Test 5: Sitemap.xml dynamic route
    try {
      // Test if sitemap route exists by checking the route file
      const sitemapRoutePath = join(
        process.cwd(),
        "app",
        "sitemap.xml",
        "route.ts",
      );
      if (existsSync(sitemapRoutePath)) {
        results.push({
          name: "Sitemap.xml Route",
          status: "passed",
          message: "Dynamic sitemap.xml route is available",
          details: { route: "/sitemap.xml", type: "dynamic" },
        });
        overallScore++;
      } else {
        results.push({
          name: "Sitemap.xml Route",
          status: "failed",
          message: "Dynamic sitemap route not found",
          details: { expectedRoute: "/app/sitemap.xml/route.ts" },
        });
      }
    } catch (error) {
      results.push({
        name: "Sitemap.xml Route",
        status: "failed",
        message: "Failed to check sitemap route",
        details: { error: error.message },
      });
    }

    // Test 6: Robots.txt dynamic route
    try {
      // Test if robots route exists by checking the route file
      const robotsRoutePath = join(
        process.cwd(),
        "app",
        "robots.txt",
        "route.ts",
      );
      if (existsSync(robotsRoutePath)) {
        results.push({
          name: "Robots.txt Route",
          status: "passed",
          message: "Dynamic robots.txt route is available",
          details: { route: "/robots.txt", type: "dynamic" },
        });
        overallScore++;
      } else {
        results.push({
          name: "Robots.txt Route",
          status: "failed",
          message: "Dynamic robots route not found",
          details: { expectedRoute: "/app/robots.txt/route.ts" },
        });
      }
    } catch (error) {
      results.push({
        name: "Robots.txt Route",
        status: "failed",
        message: "Failed to check robots route",
        details: { error: error.message },
      });
    }

    // Test 7: SEO API endpoints availability
    const apiTests = [
      "seo-settings",
      "seo-status",
      "seo-audit",
      "generate-sitemap",
      "generate-robots",
    ];

    let apiSuccessCount = 0;
    for (const endpoint of apiTests) {
      try {
        // Test if the route file exists
        const routePath = join(
          process.cwd(),
          "app",
          "api",
          "admin",
          endpoint,
          "route.ts",
        );
        if (existsSync(routePath)) {
          apiSuccessCount++;
        }
      } catch (error) {
        // API test failed
      }
    }

    if (apiSuccessCount === apiTests.length) {
      results.push({
        name: "SEO API Endpoints",
        status: "passed",
        message: `All ${apiTests.length} SEO API endpoints available`,
        details: { endpoints: apiTests },
      });
      overallScore++;
    } else {
      results.push({
        name: "SEO API Endpoints",
        status: "warning",
        message: `${apiSuccessCount}/${apiTests.length} SEO API endpoints available`,
        details: { available: apiSuccessCount, total: apiTests.length },
      });
      overallScore += 0.5;
    }

    // Test 8: Meta tags configuration
    try {
      const metaSettings = await executeQuery(`
        SELECT setting_key FROM seo_settings 
        WHERE setting_key LIKE '%meta%' OR setting_key LIKE '%og_%' OR setting_key LIKE '%twitter%'
        AND is_active = 1
      `);

      const metaCount = Array.isArray(metaSettings) ? metaSettings.length : 0;

      if (metaCount >= 5) {
        results.push({
          name: "Meta Tags Configuration",
          status: "passed",
          message: `${metaCount} meta tag settings configured`,
          details: { count: metaCount },
        });
        overallScore++;
      } else {
        results.push({
          name: "Meta Tags Configuration",
          status: "warning",
          message: `${metaCount} meta tag settings (recommend 5+)`,
          details: { count: metaCount },
        });
        overallScore += 0.5;
      }
    } catch (error) {
      results.push({
        name: "Meta Tags Configuration",
        status: "failed",
        message: "Failed to check meta tags configuration",
        details: { error: error.message },
      });
    }

    // Test 9: Analytics tracking setup
    try {
      const analyticsSettings = await executeQuery(`
        SELECT setting_key, setting_value FROM seo_settings 
        WHERE setting_key IN ('google_analytics_id', 'google_tag_manager_id', 'facebook_pixel_id')
        AND is_active = 1
        AND setting_value IS NOT NULL
        AND setting_value != ''
      `);

      const trackingCount = Array.isArray(analyticsSettings)
        ? analyticsSettings.length
        : 0;

      if (trackingCount >= 1) {
        results.push({
          name: "Analytics Tracking",
          status: "passed",
          message: `${trackingCount} tracking system(s) configured`,
          details: { systems: trackingCount },
        });
        overallScore++;
      } else {
        results.push({
          name: "Analytics Tracking",
          status: "warning",
          message: "No analytics tracking configured",
          details: { recommendation: "Add Google Analytics or similar" },
        });
        overallScore += 0.3;
      }
    } catch (error) {
      results.push({
        name: "Analytics Tracking",
        status: "failed",
        message: "Failed to check analytics configuration",
        details: { error: error.message },
      });
    }

    // Test 10: Schema.org structured data
    try {
      const schemaSettings = await executeQuery(`
        SELECT setting_key FROM seo_settings 
        WHERE setting_key LIKE '%schema%' OR setting_key LIKE 'organization_%' OR setting_key LIKE 'business_%'
        AND is_active = 1
      `);

      const schemaCount = Array.isArray(schemaSettings)
        ? schemaSettings.length
        : 0;

      if (schemaCount >= 3) {
        results.push({
          name: "Schema.org Structured Data",
          status: "passed",
          message: `${schemaCount} schema settings configured`,
          details: { count: schemaCount },
        });
        overallScore++;
      } else {
        results.push({
          name: "Schema.org Structured Data",
          status: "warning",
          message: `${schemaCount} schema settings (recommend 3+)`,
          details: { count: schemaCount },
        });
        overallScore += 0.5;
      }
    } catch (error) {
      results.push({
        name: "Schema.org Structured Data",
        status: "failed",
        message: "Failed to check schema configuration",
        details: { error: error.message },
      });
    }

    // Test 11: Performance settings
    try {
      const performanceSettings = await executeQuery(`
        SELECT setting_key, setting_value FROM seo_settings 
        WHERE setting_key IN ('enable_compression', 'lazy_load_images', 'minify_html', 'minify_css')
        AND is_active = 1
        AND setting_value = '1'
      `);

      const performanceCount = Array.isArray(performanceSettings)
        ? performanceSettings.length
        : 0;

      if (performanceCount >= 3) {
        results.push({
          name: "Performance Optimization",
          status: "passed",
          message: `${performanceCount}/4 performance optimizations enabled`,
          details: { enabled: performanceCount },
        });
        overallScore++;
      } else {
        results.push({
          name: "Performance Optimization",
          status: "warning",
          message: `${performanceCount}/4 performance optimizations enabled`,
          details: { enabled: performanceCount },
        });
        overallScore += 0.5;
      }
    } catch (error) {
      results.push({
        name: "Performance Optimization",
        status: "failed",
        message: "Failed to check performance settings",
        details: { error: error.message },
      });
    }

    // Test 12: Recent SEO activity
    try {
      const recentActivity = await executeQuery(`
        SELECT COUNT(*) as count FROM seo_analytics 
        WHERE date >= DATE('now', '-7 days')
      `);

      const activityCount = Array.isArray(recentActivity)
        ? recentActivity[0]?.count || 0
        : 0;

      if (activityCount > 0) {
        results.push({
          name: "Recent SEO Activity",
          status: "passed",
          message: `${activityCount} SEO activities in last 7 days`,
          details: { count: activityCount },
        });
        overallScore++;
      } else {
        results.push({
          name: "Recent SEO Activity",
          status: "warning",
          message: "No recent SEO activity recorded",
          details: { recommendation: "Generate sitemap and robots.txt" },
        });
        overallScore += 0.3;
      }
    } catch (error) {
      results.push({
        name: "Recent SEO Activity",
        status: "failed",
        message: "Failed to check recent activity",
        details: { error: error.message },
      });
    }

    // Calculate final score
    const finalScore = Math.round((overallScore / totalTests) * 100);

    // Generate recommendations
    const recommendations = [];
    const failedTests = results.filter((r) => r.status === "failed");
    const warningTests = results.filter((r) => r.status === "warning");

    if (failedTests.length > 0) {
      recommendations.push(`Fix ${failedTests.length} critical SEO issues`);
    }
    if (warningTests.length > 0) {
      recommendations.push(
        `Address ${warningTests.length} SEO warnings for better optimization`,
      );
    }
    if (finalScore >= 90) {
      recommendations.push("SEO system is excellent! 🎉");
    } else if (finalScore >= 80) {
      recommendations.push("SEO system is good, minor improvements needed");
    } else if (finalScore >= 70) {
      recommendations.push("SEO system needs optimization");
    } else {
      recommendations.push("SEO system requires significant improvements");
    }

    return NextResponse.json({
      success: true,
      data: {
        overallScore: finalScore,
        totalTests,
        passed: results.filter((r) => r.status === "passed").length,
        failed: failedTests.length,
        warnings: warningTests.length,
        results,
        recommendations,
        testDate: new Date().toISOString(),
        summary: {
          excellent: finalScore >= 90,
          good: finalScore >= 80 && finalScore < 90,
          needsWork: finalScore < 80,
        },
      },
    });
  } catch (error) {
    console.error("Failed to run comprehensive SEO test:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to run comprehensive SEO test",
        error: error.message,
      },
      { status: 500 },
    );
  }
}
