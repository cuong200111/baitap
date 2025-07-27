import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";
import { createSeoTables } from "@/lib/seo-database";

export async function POST(request: NextRequest) {
  try {
    const results = {
      fixed: [],
      skipped: [],
      failed: [],
      warnings: []
    };

    // Step 1: Ensure SEO tables exist
    try {
      createSeoTables();
      results.fixed.push("SEO database tables verified/created");
    } catch (error) {
      results.failed.push(`Failed to create SEO tables: ${error.message}`);
    }

    // Step 2: Check and fix missing critical settings
    const criticalSettings = [
      { key: "site_name", value: "HACOM - Máy tính, Laptop, Gaming Gear", category: "general" },
      { key: "site_url", value: "https://hacom.vn", category: "general" },
      { key: "site_description", value: "HACOM - Chuyên cung cấp máy tính, laptop, linh kiện máy tính, gaming gear với giá tốt nhất. Bảo hành chính hãng, giao hàng toàn quốc.", category: "general" },
      { key: "organization_name", value: "HACOM", category: "schema" },
      { key: "business_type", value: "ElectronicsStore", category: "local" },
    ];

    for (const setting of criticalSettings) {
      try {
        const existing = await executeQuery(`
          SELECT setting_value FROM seo_settings 
          WHERE setting_key = ? AND is_active = 1
        `, [setting.key]);

        const hasValue = Array.isArray(existing) && existing.length > 0 && 
                        existing[0].setting_value && existing[0].setting_value.trim() !== '';

        if (!hasValue) {
          await executeQuery(`
            INSERT OR REPLACE INTO seo_settings (setting_key, setting_value, category, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
          `, [setting.key, setting.value, setting.category]);
          results.fixed.push(`Added missing setting: ${setting.key}`);
        } else {
          results.skipped.push(`Setting already exists: ${setting.key}`);
        }
      } catch (error) {
        results.failed.push(`Failed to fix setting ${setting.key}: ${error.message}`);
      }
    }

    // Step 3: Enable performance optimizations
    const performanceSettings = [
      "enable_compression",
      "lazy_load_images", 
      "minify_html",
      "minify_css",
      "sitemap_include_images"
    ];

    for (const setting of performanceSettings) {
      try {
        await executeQuery(`
          INSERT OR REPLACE INTO seo_settings (setting_key, setting_value, category, updated_at)
          VALUES (?, '1', 'technical', CURRENT_TIMESTAMP)
        `, [setting]);
        results.fixed.push(`Enabled performance setting: ${setting}`);
      } catch (error) {
        results.failed.push(`Failed to enable ${setting}: ${error.message}`);
      }
    }

    // Step 4: Set up default meta patterns
    const metaPatterns = [
      { key: "default_meta_title_pattern", value: "{title} | HACOM", category: "content" },
      { key: "product_meta_title_pattern", value: "{product_name} - {category} | HACOM", category: "content" },
      { key: "category_meta_title_pattern", value: "{category_name} - {description} | HACOM", category: "content" },
      { key: "auto_generate_meta_description", value: "1", category: "content" },
      { key: "meta_description_length", value: "160", category: "content" },
    ];

    for (const pattern of metaPatterns) {
      try {
        await executeQuery(`
          INSERT OR IGNORE INTO seo_settings (setting_key, setting_value, category, updated_at)
          VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        `, [pattern.key, pattern.value, pattern.category]);
        results.fixed.push(`Added meta pattern: ${pattern.key}`);
      } catch (error) {
        results.failed.push(`Failed to add meta pattern ${pattern.key}: ${error.message}`);
      }
    }

    // Step 5: Fix sitemap settings
    const sitemapSettings = [
      { key: "sitemap_include_images", value: "1", category: "sitemap" },
      { key: "sitemap_include_videos", value: "1", category: "sitemap" },
      { key: "sitemap_max_urls", value: "50000", category: "sitemap" },
    ];

    for (const setting of sitemapSettings) {
      try {
        await executeQuery(`
          INSERT OR REPLACE INTO seo_settings (setting_key, setting_value, category, updated_at)
          VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        `, [setting.key, setting.value, setting.category]);
        results.fixed.push(`Fixed sitemap setting: ${setting.key}`);
      } catch (error) {
        results.failed.push(`Failed to fix sitemap setting ${setting.key}: ${error.message}`);
      }
    }

    // Step 6: Check for long meta descriptions and titles
    try {
      const longDescriptions = await executeQuery(`
        SELECT setting_key, setting_value FROM seo_settings 
        WHERE setting_key = 'site_description' 
        AND LENGTH(setting_value) > 160
        AND is_active = 1
      `);

      if (Array.isArray(longDescriptions) && longDescriptions.length > 0) {
        results.warnings.push("Site description is longer than 160 characters - consider shortening for better SEO");
      }

      const longTitles = await executeQuery(`
        SELECT setting_key, setting_value FROM seo_settings 
        WHERE setting_key = 'site_name' 
        AND LENGTH(setting_value) > 60
        AND is_active = 1
      `);

      if (Array.isArray(longTitles) && longTitles.length > 0) {
        results.warnings.push("Site name is longer than 60 characters - consider shortening for better display");
      }
    } catch (error) {
      results.failed.push(`Failed to check meta length: ${error.message}`);
    }

    // Step 7: Verify essential analytics settings structure
    const analyticsSettings = [
      { key: "google_analytics_id", value: "", category: "analytics" },
      { key: "google_tag_manager_id", value: "", category: "analytics" },
      { key: "google_search_console_verification", value: "", category: "analytics" },
      { key: "facebook_pixel_id", value: "", category: "analytics" },
    ];

    for (const setting of analyticsSettings) {
      try {
        await executeQuery(`
          INSERT OR IGNORE INTO seo_settings (setting_key, setting_value, category, updated_at)
          VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        `, [setting.key, setting.value, setting.category]);
        results.fixed.push(`Added analytics setting placeholder: ${setting.key}`);
      } catch (error) {
        results.failed.push(`Failed to add analytics setting ${setting.key}: ${error.message}`);
      }
    }

    // Step 8: Create missing SEO meta data entries for key pages
    const keyPages = [
      { page_type: "homepage", url_path: "/", meta_title: "HACOM - Máy tính, Laptop, Gaming Gear chính hãng", priority: 1.0 },
      { page_type: "products", url_path: "/products", meta_title: "Sản phẩm | HACOM", priority: 0.9 },
      { page_type: "categories", url_path: "/category", meta_title: "Danh mục sản phẩm | HACOM", priority: 0.8 },
    ];

    for (const page of keyPages) {
      try {
        await executeQuery(`
          INSERT OR IGNORE INTO seo_meta_data (page_type, url_path, meta_title, priority, updated_at)
          VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [page.page_type, page.url_path, page.meta_title, page.priority]);
        results.fixed.push(`Added meta data for: ${page.page_type}`);
      } catch (error) {
        results.failed.push(`Failed to add meta data for ${page.page_type}: ${error.message}`);
      }
    }

    // Step 9: Generate summary
    const totalFixed = results.fixed.length;
    const totalFailed = results.failed.length;
    const totalWarnings = results.warnings.length;

    let overallStatus = "success";
    let message = "SEO auto-fix completed successfully";

    if (totalFailed > 0) {
      overallStatus = "partial";
      message = `SEO auto-fix completed with ${totalFailed} failures`;
    }

    if (totalFixed === 0 && totalFailed === 0) {
      overallStatus = "no_changes";
      message = "No SEO issues found to fix";
    }

    return NextResponse.json({
      success: true,
      status: overallStatus,
      message,
      data: {
        summary: {
          fixed: totalFixed,
          failed: totalFailed,
          warnings: totalWarnings,
          skipped: results.skipped.length
        },
        details: results
      }
    });

  } catch (error) {
    console.error("Failed to auto-fix SEO issues:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to auto-fix SEO issues",
        error: error.message 
      },
      { status: 500 }
    );
  }
}
