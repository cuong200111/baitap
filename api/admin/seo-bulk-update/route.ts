import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, settings } = body;

    let result;

    switch (action) {
      case 'reset_defaults':
        result = await resetToDefaults();
        break;
      
      case 'bulk_update':
        result = await bulkUpdateSettings(settings);
        break;
      
      case 'enable_all_performance':
        result = await enableAllPerformanceSettings();
        break;
      
      case 'setup_basic_seo':
        result = await setupBasicSeo(settings);
        break;
      
      default:
        return NextResponse.json(
          { success: false, message: "Invalid action" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      data: result.data,
    });

  } catch (error) {
    console.error("Failed to perform bulk SEO update:", error);
    return NextResponse.json(
      { success: false, message: "Failed to perform bulk SEO update" },
      { status: 500 }
    );
  }
}

async function resetToDefaults() {
  // Reset all SEO settings to default values
  const defaultSettings = [
    { key: "site_name", value: "HACOM - Máy tính, Laptop, Gaming Gear", category: "general" },
    { key: "site_description", value: "HACOM - Chuyên cung cấp máy tính, laptop, linh kiện máy tính, gaming gear với giá tốt nhất. Bảo hành chính hãng, giao hàng toàn quốc.", category: "general" },
    { key: "site_keywords", value: "máy tính, laptop, gaming, linh kiện máy tính, PC, HACOM", category: "general" },
    { key: "site_url", value: "https://hacom.vn", category: "general" },
    { key: "enable_compression", value: "1", category: "technical" },
    { key: "enable_caching", value: "1", category: "technical" },
    { key: "lazy_load_images", value: "1", category: "technical" },
    { key: "minify_html", value: "1", category: "technical" },
    { key: "minify_css", value: "1", category: "technical" },
    { key: "minify_js", value: "1", category: "technical" },
    { key: "sitemap_include_images", value: "1", category: "sitemap" },
    { key: "sitemap_include_videos", value: "1", category: "sitemap" },
    { key: "sitemap_max_urls", value: "50000", category: "sitemap" },
    { key: "organization_name", value: "HACOM", category: "schema" },
    { key: "business_type", value: "ElectronicsStore", category: "local" },
    { key: "business_hours", value: "Mo-Su 08:00-22:00", category: "local" },
  ];

  let updated = 0;
  for (const setting of defaultSettings) {
    try {
      await executeQuery(`
        INSERT OR REPLACE INTO seo_settings (setting_key, setting_value, category, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `, [setting.key, setting.value, setting.category]);
      updated++;
    } catch (error) {
      console.error(`Failed to update setting ${setting.key}:`, error);
    }
  }

  return {
    message: `Reset ${updated} SEO settings to defaults`,
    data: { updated, total: defaultSettings.length }
  };
}

async function bulkUpdateSettings(settings: any) {
  let updated = 0;
  let errors = [];

  for (const [category, categorySettings] of Object.entries(settings)) {
    for (const [key, value] of Object.entries(categorySettings as any)) {
      try {
        let finalValue = value;
        if (typeof value === "boolean") {
          finalValue = value ? "1" : "0";
        } else if (typeof value === "number") {
          finalValue = value.toString();
        }

        await executeQuery(`
          INSERT OR REPLACE INTO seo_settings (setting_key, setting_value, category, updated_at)
          VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        `, [key, finalValue, category]);
        updated++;
      } catch (error) {
        errors.push(`Failed to update ${key}: ${error.message}`);
      }
    }
  }

  return {
    message: `Updated ${updated} SEO settings`,
    data: { updated, errors }
  };
}

async function enableAllPerformanceSettings() {
  const performanceSettings = [
    "enable_compression",
    "enable_caching", 
    "lazy_load_images",
    "minify_html",
    "minify_css",
    "minify_js",
    "enable_cdn",
    "optimize_images"
  ];

  let updated = 0;
  for (const setting of performanceSettings) {
    try {
      await executeQuery(`
        INSERT OR REPLACE INTO seo_settings (setting_key, setting_value, category, updated_at)
        VALUES (?, '1', 'technical', CURRENT_TIMESTAMP)
      `, [setting]);
      updated++;
    } catch (error) {
      console.error(`Failed to enable ${setting}:`, error);
    }
  }

  return {
    message: `Enabled ${updated} performance optimizations`,
    data: { updated, total: performanceSettings.length }
  };
}

async function setupBasicSeo(customSettings: any = {}) {
  const basicSettings = {
    site_name: customSettings.siteName || "HACOM - Máy tính, Laptop, Gaming Gear",
    site_description: customSettings.siteDescription || "HACOM - Chuyên cung cấp máy tính, laptop, linh kiện máy tính, gaming gear với giá tốt nhất. Bảo hành chính hãng, giao hàng toàn quốc.",
    site_url: customSettings.siteUrl || "https://hacom.vn",
    site_keywords: customSettings.keywords || "máy tính, laptop, gaming, linh kiện máy tính, PC, HACOM",
    google_analytics_id: customSettings.analyticsId || "",
    facebook_pixel_id: customSettings.facebookPixel || "",
    enable_compression: "1",
    lazy_load_images: "1",
    minify_html: "1",
    sitemap_include_images: "1",
    organization_name: customSettings.organizationName || "HACOM",
    business_type: "ElectronicsStore",
    auto_generate_meta_description: "1",
    meta_description_length: "160",
  };

  let updated = 0;
  for (const [key, value] of Object.entries(basicSettings)) {
    try {
      // Determine category based on setting key
      let category = "general";
      if (key.includes("google_") || key.includes("facebook_") || key.includes("analytics")) {
        category = "analytics";
      } else if (key.includes("enable_") || key.includes("minify_") || key.includes("lazy_")) {
        category = "technical";
      } else if (key.includes("sitemap_")) {
        category = "sitemap";
      } else if (key.includes("organization_") || key.includes("business_")) {
        category = "schema";
      } else if (key.includes("meta_")) {
        category = "content";
      }

      await executeQuery(`
        INSERT OR REPLACE INTO seo_settings (setting_key, setting_value, category, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `, [key, value, category]);
      updated++;
    } catch (error) {
      console.error(`Failed to setup ${key}:`, error);
    }
  }

  return {
    message: `Setup ${updated} basic SEO settings`,
    data: { updated, total: Object.keys(basicSettings).length }
  };
}
