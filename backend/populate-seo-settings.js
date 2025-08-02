import { executeQuery } from "./database/connection.js";

async function populateDefaultSeoSettings() {
  try {
    console.log("🔄 Populating default SEO settings...");

    // Check if settings already exist
    const existingCount = await executeQuery(`
      SELECT COUNT(*) as count FROM seo_settings WHERE is_active = 1
    `);

    if (existingCount[0].count > 0) {
      console.log("✅ SEO settings already exist, skipping...");
      return;
    }

    // Default SEO settings to insert
    const defaultSettings = [
      // General settings
      ["site_name", "HACOM - Máy tính, Laptop, Gaming Gear", "general"],
      [
        "site_description",
        "HACOM - Chuyên cung cấp máy tính, laptop, linh kiện máy tính, gaming gear với giá tốt nhất. Bảo hành chính hãng, giao hàng toàn quốc.",
        "general",
      ],
      [
        "site_keywords",
        "máy tính, laptop, gaming, linh kiện máy tính, PC, HACOM",
        "general",
      ],
      ["site_url", "https://hacom.vn", "general"],
      ["site_logo", "/logo.png", "general"],
      ["site_favicon", "/favicon.ico", "general"],
      ["default_meta_title_pattern", "{title} | HACOM", "general"],
      [
        "product_meta_title_pattern",
        "{product_name} - {category} | HACOM",
        "general",
      ],
      [
        "category_meta_title_pattern",
        "{category_name} - {description} | HACOM",
        "general",
      ],
      ["auto_generate_meta_description", "1", "general"],
      ["meta_description_length", "160", "general"],

      // Social media settings
      ["facebook_app_id", "", "social"],
      ["twitter_site", "@hacom_vn", "social"],
      ["linkedin_url", "", "social"],
      ["youtube_url", "", "social"],
      ["instagram_url", "", "social"],
      ["tiktok_url", "", "social"],
      ["default_og_image", "/og-image.jpg", "social"],

      // Analytics settings
      ["google_analytics_id", "", "analytics"],
      ["google_tag_manager_id", "", "analytics"],
      ["google_search_console_verification", "", "analytics"],
      ["bing_webmaster_verification", "", "analytics"],
      ["facebook_pixel_id", "", "analytics"],
      ["hotjar_id", "", "analytics"],
      ["google_ads_id", "", "analytics"],
      ["enable_analytics", "1", "analytics"],

      // Schema settings
      ["organization_name", "HACOM", "schema"],
      ["organization_logo", "/logo.png", "schema"],
      [
        "organization_address",
        "Số 131 Lê Thanh Nghị, Hai Bà Trưng, Hà Nội",
        "schema",
      ],
      ["organization_phone", "1900 1903", "schema"],
      ["organization_email", "contact@hacom.vn", "schema"],
      ["business_type", "ElectronicsStore", "schema"],
      ["business_hours", "Mo-Su 08:00-22:00", "schema"],
      ["latitude", "21.0285", "schema"],
      ["longitude", "105.8542", "schema"],
      ["enable_organization_schema", "1", "schema"],
      ["enable_breadcrumb_schema", "1", "schema"],
      ["enable_product_schema", "1", "schema"],
      ["enable_review_schema", "1", "schema"],

      // Technical settings
      ["enable_compression", "1", "technical"],
      ["enable_caching", "1", "technical"],
      ["lazy_load_images", "1", "technical"],
      ["minify_html", "1", "technical"],
      ["minify_css", "1", "technical"],
      ["minify_js", "1", "technical"],
      ["enable_sitemap", "1", "technical"],
      ["sitemap_include_images", "1", "technical"],
      ["sitemap_include_videos", "1", "technical"],
      ["sitemap_max_urls", "50000", "technical"],
      ["robots_txt_custom", "", "technical"],

      // Content settings
      ["enable_auto_seo", "1", "content"],
      ["keyword_density_target", "2.5", "content"],
      ["content_min_words", "300", "content"],
      ["h1_optimization", "1", "content"],
      ["internal_linking", "1", "content"],
      ["image_alt_optimization", "1", "content"],
      ["enable_faq_schema", "1", "content"],
      ["enable_article_schema", "1", "content"],

      // Performance settings
      ["enable_cdn", "0", "performance"],
      ["cdn_url", "", "performance"],
      ["preload_critical_resources", "1", "performance"],
      ["defer_non_critical_js", "1", "performance"],
      ["optimize_images", "1", "performance"],
      ["enable_critical_css", "1", "performance"],
      ["lazy_load_threshold", "200", "performance"],

      // Local SEO settings
      ["google_my_business_id", "", "local"],
      ["enable_local_seo", "1", "local"],
      ["business_category", "Electronics Store", "local"],
      ["service_areas", '["Hà Nội", "TP.HCM", "Đà Nẵng"]', "local"],
      ["opening_hours", "Thứ 2 - Chủ nhật: 8:00 - 22:00", "local"],
      ["enable_review_schema", "1", "local"],
    ];

    // Insert each setting
    for (const [key, value, category] of defaultSettings) {
      await executeQuery(
        `INSERT INTO seo_settings (setting_key, setting_value, category, created_at, updated_at, is_active)
         VALUES (?, ?, ?, NOW(), NOW(), 1)`,
        [key, value, category],
      );
    }

    console.log(
      `✅ Successfully inserted ${defaultSettings.length} SEO settings`,
    );

    // Also populate some default site settings
    const siteSettings = [
      ["general_site_name", "HACOM E-commerce", "string"],
      [
        "general_site_description",
        "Chuyên cung cấp laptop, PC gaming và linh kiện máy tính",
        "string",
      ],
      ["general_contact_email", "info@hacom.vn", "string"],
      ["general_contact_phone", "1900.1903", "string"],
      ["general_address", "123 Đường ABC, Quận 1, TP.HCM", "string"],
      ["general_timezone", "Asia/Ho_Chi_Minh", "string"],
      ["general_currency", "VND", "string"],
      ["general_language", "vi", "string"],

      ["store_enabled", "1", "boolean"],
      ["store_maintenance_mode", "0", "boolean"],
      ["store_allow_guest_checkout", "1", "boolean"],
      ["store_require_account_approval", "0", "boolean"],
      ["store_min_order_amount", "100000", "number"],
      ["store_max_order_amount", "100000000", "number"],
      ["store_default_stock_status", "in_stock", "string"],

      ["payment_stripe_enabled", "0", "boolean"],
      ["payment_paypal_enabled", "0", "boolean"],
      ["payment_bank_transfer_enabled", "1", "boolean"],
      ["payment_cod_enabled", "1", "boolean"],
      ["payment_vnpay_enabled", "1", "boolean"],

      ["email_smtp_host", "smtp.gmail.com", "string"],
      ["email_smtp_port", "587", "number"],
      ["email_from_email", "noreply@hacom.vn", "string"],
      ["email_from_name", "HACOM Store", "string"],
      ["email_notifications", "1", "boolean"],
    ];

    // Check if site settings exist
    const siteSettingsCount = await executeQuery(`
      SELECT COUNT(*) as count FROM site_settings
    `);

    if (siteSettingsCount[0].count === 0) {
      for (const [key, value, type] of siteSettings) {
        await executeQuery(
          `INSERT INTO site_settings (setting_key, setting_value, setting_type, created_at, updated_at)
           VALUES (?, ?, ?, NOW(), NOW())`,
          [key, value, type],
        );
      }
      console.log(
        `✅ Successfully inserted ${siteSettings.length} site settings`,
      );
    } else {
      console.log("✅ Site settings already exist, skipping...");
    }
  } catch (error) {
    console.error("❌ Error populating SEO settings:", error);
  }
}

// Run the script
populateDefaultSeoSettings()
  .then(() => {
    console.log("🎉 Default settings population completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
