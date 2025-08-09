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

    // Create new comprehensive seo_settings table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS seo_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(255) NOT NULL UNIQUE,
        setting_value TEXT,
        category VARCHAR(100) DEFAULT 'general',
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
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

    // Insert default SEO settings
    const defaultSettings = [
      // General Settings
      ['site_name', 'HACOM - Máy tính, Laptop', 'general', 'Tên website chính'],
      ['site_url', 'https://hacom.vn', 'general', 'URL chính của website'],
      ['site_description', 'HACOM - Chuyên cung cấp máy tính, laptop, linh kiện máy tính, gaming gear với giá tốt nhất. Bảo hành chính hãng, giao hàng toàn quốc.', 'general', 'Mô tả website'],
      ['site_keywords', 'máy tính, laptop, gaming, linh kiện máy tính, PC, HACOM', 'general', 'Từ khóa chính'],
      ['site_logo', '/logo.png', 'general', 'Logo website'],
      ['site_favicon', '/favicon.ico', 'general', 'Favicon'],
      ['default_meta_title_pattern', '{title} | HACOM', 'general', 'Pattern cho meta title mặc định'],
      ['auto_generate_meta_description', '1', 'general', 'Tự động tạo meta description'],
      ['meta_description_length', '160', 'general', 'Độ dài tối đa meta description'],

      // Social Settings
      ['facebook_app_id', '', 'social', 'Facebook App ID'],
      ['twitter_site', '@hacom_vn', 'social', 'Twitter handle'],
      ['default_og_image', '/og-image.jpg', 'social', 'Open Graph image mặc định'],

      // Analytics Settings
      ['google_analytics_id', '', 'analytics', 'Google Analytics ID'],
      ['google_tag_manager_id', '', 'analytics', 'Google Tag Manager ID'],
      ['google_search_console_verification', '', 'analytics', 'Google Search Console verification'],
      ['enable_analytics', '1', 'analytics', 'Bật Analytics'],

      // Schema Settings
      ['organization_name', 'HACOM', 'schema', 'Tên tổ chức'],
      ['organization_logo', '/logo.png', 'schema', 'Logo tổ chức'],
      ['organization_address', 'Số 131 Lê Thanh Nghị, Hai Bà Trưng, Hà Nội', 'schema', 'Địa chỉ tổ chức'],
      ['organization_phone', '1900 1903', 'schema', 'Số điện thoại'],
      ['organization_email', 'contact@hacom.vn', 'schema', 'Email liên hệ'],
      ['business_type', 'ElectronicsStore', 'schema', 'Loại hình kinh doanh'],
      ['enable_organization_schema', '1', 'schema', 'Bật Organization Schema'],
      ['enable_product_schema', '1', 'schema', 'Bật Product Schema'],

      // Technical Settings
      ['enable_sitemap', '1', 'technical', 'Bật sitemap'],
      ['enable_compression', '1', 'technical', 'Bật nén'],
      ['enable_caching', '1', 'technical', 'Bật cache'],
      ['lazy_load_images', '1', 'technical', 'Lazy load images'],
      ['sitemap_max_urls', '50000', 'technical', 'Số URL tối đa trong sitemap']
    ];

    console.log("🔄 Inserting default SEO settings...");
    for (const [key, value, category, description] of defaultSettings) {
      await executeQuery(`
        INSERT INTO seo_settings (setting_key, setting_value, category, description, is_active)
        VALUES (?, ?, ?, ?, 1)
        ON DUPLICATE KEY UPDATE
          setting_value = VALUES(setting_value),
          category = VALUES(category),
          description = VALUES(description),
          updated_at = NOW()
      `, [key, value, category, description]);
    }

    console.log("✅ Inserted default SEO settings");

    // Insert some sample analytics data
    const sampleAnalytics = [
      ['/', new Date().toISOString().split('T')[0], 1250],
      ['/products', new Date().toISOString().split('T')[0], 850],
      ['/category/laptop', new Date().toISOString().split('T')[0], 420],
      ['sitemap_generation', new Date().toISOString().split('T')[0], 1],
      ['robots_generation', new Date().toISOString().split('T')[0], 1]
    ];

    for (const [url_path, date, page_views] of sampleAnalytics) {
      await executeQuery(`
        INSERT IGNORE INTO seo_analytics (url_path, date, page_views)
        VALUES (?, ?, ?)
      `, [url_path, date, page_views]);
    }

    console.log("✅ Inserted sample analytics data");
    console.log("🎉 SEO tables migration completed successfully!");

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
