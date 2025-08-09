import { executeQuery } from "./connection.js";

async function createSeoTables() {
  try {
    console.log("🔄 Creating comprehensive SEO database tables...");

    // Drop old simple seo_settings table if exists
    try {
      await executeQuery(`DROP TABLE IF EXISTS seo_settings`);
      console.log("🗑️ Dropped old seo_settings table");
    } catch (error) {
      console.log("⚠️ Old seo_settings table not found, continuing...");
    }

    // Create new comprehensive seo_settings table matching user's exact SQL structure
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS seo_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(255) NOT NULL UNIQUE,
        setting_value TEXT DEFAULT NULL,
        category VARCHAR(100) DEFAULT 'general',
        description TEXT DEFAULT NULL,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_setting_key (setting_key),
        INDEX idx_category (category),
        INDEX idx_is_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✅ Created seo_settings table");

    // Create seo_analytics table if not exists
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS seo_analytics (
        id INT AUTO_INCREMENT PRIMARY KEY,
        url_path VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        page_views INT DEFAULT 1,
        bounce_rate DECIMAL(5,2) DEFAULT 0.00,
        avg_time_on_page INT DEFAULT 0,
        organic_traffic INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_path_date (url_path, date),
        INDEX idx_url_path (url_path),
        INDEX idx_date (date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✅ Created seo_analytics table");

    // Insert ALL default SEO settings exactly matching user's SQL
    const defaultSettings = [
      // General Settings - Exact from user's SQL
      [
        1,
        "site_name",
        "ZoxVN- Máy tính, Laptop",
        "general",
        "Tên website chính",
        1,
      ],
      [
        2,
        "site_url",
        "https://hacom.vns",
        "general",
        "URL chính của website",
        1,
      ],
      [
        3,
        "site_description",
        "HACOM - Chuyên cung cấp máy tính, laptop, linh kiện máy tính, gaming gear với giá tốt nhất. Bảo hành chính hãng, giao hàng toàn quốc.",
        "general",
        "Mô tả website",
        1,
      ],
      [
        4,
        "site_keywords",
        "máy tính, laptop, gaming, linh kiện máy tính, PC, HACOM",
        "general",
        "Từ khóa chính",
        1,
      ],
      [5, "site_logo", "/logo.png", "general", "Logo website", 1],
      [6, "site_favicon", "/favicon.ico", "general", "Favicon", 1],
      [
        7,
        "default_meta_title_pattern",
        "{title} | HACOM",
        "general",
        "Pattern cho meta title mặc định",
        1,
      ],
      [
        8,
        "auto_generate_meta_description",
        "1",
        "general",
        "Tự động tạo meta description",
        1,
      ],
      [
        9,
        "meta_description_length",
        "160",
        "general",
        "Độ dài tối đa meta description",
        1,
      ],
      [
        38,
        "product_meta_title_pattern",
        "{product_name} - {category} | HACOM",
        "general",
        NULL,
        1,
      ],
      [
        39,
        "category_meta_title_pattern",
        "{category_name} - {description} | HACOM",
        "general",
        NULL,
        1,
      ],

      // Social Settings - Exact from user's SQL
      [10, "facebook_app_id", "facd", "social", "Facebook App ID", 1],
      [11, "twitter_site", "@hacom_vn", "social", "Twitter handle", 1],
      [
        12,
        "default_og_image",
        "/og-image.jpg",
        "social",
        "Open Graph image mặc định",
        1,
      ],
      [44, "linkedin_url", "", "social", NULL, 1],
      [45, "youtube_url", "", "social", NULL, 1],
      [46, "instagram_url", "", "social", NULL, 1],
      [47, "tiktok_url", "", "social", NULL, 1],

      // Open Graph Images for different page types
      [101, "home_og_image", "", "social", "Open Graph image cho trang chủ", 1],
      [102, "product_og_image", "", "social", "Open Graph image cho sản phẩm", 1],
      [103, "category_og_image", "", "social", "Open Graph image cho danh mục", 1],
      [104, "login_og_image", "", "social", "Open Graph image cho trang đăng nhập", 1],
      [105, "register_og_image", "", "social", "Open Graph image cho trang đăng ký", 1],

      // Analytics Settings - Exact from user's SQL
      [13, "google_analytics_id", "", "analytics", "Google Analytics ID", 1],
      [
        14,
        "google_tag_manager_id",
        "",
        "analytics",
        "Google Tag Manager ID",
        1,
      ],
      [
        15,
        "google_search_console_verification",
        "",
        "analytics",
        "Google Search Console verification",
        1,
      ],
      [16, "enable_analytics", "1", "analytics", "Bật Analytics", 1],
      [52, "bing_webmaster_verification", "", "analytics", NULL, 1],
      [53, "facebook_pixel_id", "", "analytics", NULL, 1],
      [54, "hotjar_id", "", "analytics", NULL, 1],
      [55, "google_ads_id", "", "analytics", NULL, 1],

      // Schema Settings - Exact from user's SQL
      [17, "organization_name", "HACOM", "schema", "Tên tổ chức", 1],
      [18, "organization_logo", "/logo.png", "schema", "Logo tổ chức", 1],
      [
        19,
        "organization_address",
        "Số 131 Lê Thanh Nghị, Hai Bà Trưng, Hà Nội",
        "schema",
        "Địa chỉ tổ chức",
        1,
      ],
      [20, "organization_phone", "1900 1903", "schema", "Số điện thoại", 1],
      [
        21,
        "organization_email",
        "contact@hacom.vn",
        "schema",
        "Email liên hệ",
        1,
      ],
      [
        22,
        "business_type",
        "ElectronicsStore",
        "schema",
        "Loại hình kinh doanh",
        1,
      ],
      [
        23,
        "enable_organization_schema",
        "1",
        "schema",
        "Bật Organization Schema",
        1,
      ],
      [24, "enable_product_schema", "1", "schema", "Bật Product Schema", 1],
      [63, "business_hours", "Mo-Su 08:00-22:00", "schema", NULL, 1],
      [64, "latitude", "21.0285", "schema", NULL, 1],
      [65, "longitude", "105.8542", "schema", NULL, 1],
      [67, "enable_breadcrumb_schema", "1", "schema", NULL, 1],

      // Technical Settings - Exact from user's SQL
      [
        25,
        "sitemap_max_urls",
        "50000",
        "technical",
        "Số URL tối đa trong sitemap",
        1,
      ],
      [26, "enable_sitemap", "1", "technical", "Bật sitemap", 1],
      [27, "enable_compression", "1", "technical", "Bật nén", 1],
      [28, "enable_caching", "1", "technical", "Bật cache", 1],
      [29, "lazy_load_images", "1", "technical", "Lazy load images", 1],
      [73, "minify_html", "1", "technical", NULL, 1],
      [74, "minify_css", "1", "technical", NULL, 1],
      [75, "minify_js", "1", "technical", NULL, 1],
      [77, "sitemap_include_images", "1", "technical", NULL, 1],
      [78, "sitemap_include_videos", "1", "technical", NULL, 1],
      [80, "robots_txt_custom", "", "technical", NULL, 1],

      // Content Settings - Exact from user's SQL
      [81, "enable_auto_seo", "1", "content", NULL, 1],
      [82, "keyword_density_target", "2.5", "content", NULL, 1],
      [83, "content_min_words", "300", "content", NULL, 1],
      [84, "h1_optimization", "1", "content", NULL, 1],
      [85, "internal_linking", "1", "content", NULL, 1],
      [86, "image_alt_optimization", "1", "content", NULL, 1],
      [87, "enable_faq_schema", "1", "content", NULL, 1],
      [88, "enable_article_schema", "1", "content", NULL, 1],

      // Performance Settings - Exact from user's SQL
      [89, "enable_cdn", "0", "performance", NULL, 1],
      [90, "cdn_url", "", "performance", NULL, 1],
      [91, "preload_critical_resources", "1", "performance", NULL, 1],
      [92, "defer_non_critical_js", "1", "performance", NULL, 1],
      [93, "optimize_images", "1", "performance", NULL, 1],
      [94, "enable_critical_css", "1", "performance", NULL, 1],
      [95, "lazy_load_threshold", "200", "performance", NULL, 1],

      // Local SEO Settings - Exact from user's SQL
      [96, "google_my_business_id", "", "local", NULL, 1],
      [97, "enable_local_seo", "1", "local", NULL, 1],
      [98, "business_category", "Electronics Store", "local", NULL, 1],
      [99, "service_areas", '["Hà Nội","TP.HCM","Đà Nẵng"]', "local", NULL, 1],
      [
        100,
        "opening_hours",
        "Thứ 2 - Chủ nhật: 8:00 - 22:00",
        "local",
        NULL,
        1,
      ],
      [69, "enable_review_schema", "1", "local", NULL, 1],
    ];

    console.log("🔄 Inserting ALL SEO settings from user's SQL...");

    // Clear existing settings first
    await executeQuery(`DELETE FROM seo_settings`);

    for (const [
      id,
      key,
      value,
      category,
      description,
      is_active,
    ] of defaultSettings) {
      await executeQuery(
        `
        INSERT INTO seo_settings (id, setting_key, setting_value, category, description, is_active)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          setting_value = VALUES(setting_value),
          category = VALUES(category),
          description = VALUES(description),
          is_active = VALUES(is_active),
          updated_at = NOW()
      `,
        [id, key, value, category, description, is_active],
      );
    }

    // Reset AUTO_INCREMENT to 244 to match user's SQL
    await executeQuery(`ALTER TABLE seo_settings AUTO_INCREMENT = 244`);

    console.log("✅ Inserted ALL SEO settings matching user's SQL");

    // Insert some sample analytics data
    const sampleAnalytics = [
      ["/", new Date().toISOString().split("T")[0], 1250],
      ["/products", new Date().toISOString().split("T")[0], 850],
      ["/category/laptop", new Date().toISOString().split("T")[0], 420],
      ["sitemap_generation", new Date().toISOString().split("T")[0], 1],
      ["robots_generation", new Date().toISOString().split("T")[0], 1],
    ];

    for (const [url_path, date, page_views] of sampleAnalytics) {
      await executeQuery(
        `
        INSERT IGNORE INTO seo_analytics (url_path, date, page_views)
        VALUES (?, ?, ?)
      `,
        [url_path, date, page_views],
      );
    }

    console.log("✅ Inserted sample analytics data");
    console.log(
      "🎉 SEO tables migration completed successfully with ALL user's SQL settings!",
    );
  } catch (error) {
    console.error("❌ Error creating SEO tables:", error);
    throw error;
  }
}

// Auto-run if script is executed directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  createSeoTables()
    .then(() => {
      console.log("🎉 SEO Migration completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 SEO Migration failed:", error);
      process.exit(1);
    });
}

export { createSeoTables };
