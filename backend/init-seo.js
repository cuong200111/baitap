import { executeQuery } from "./database/connection.js";

// Initialize SEO system
export const initSeo = async () => {
  try {
    console.log("🔍 Initializing SEO system...");

    // Check if SEO settings table exists
    const checkTable = await executeQuery(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = 'seo_settings'
    `);

    if (checkTable[0].count === 0) {
      console.log("📝 Creating SEO settings table...");
      
      // Create SEO settings table
      await executeQuery(`
        CREATE TABLE seo_settings (
          id INT AUTO_INCREMENT PRIMARY KEY,
          setting_key VARCHAR(255) UNIQUE NOT NULL,
          setting_value TEXT,
          setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
          category VARCHAR(100) DEFAULT 'general',
          description TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // Insert default SEO settings
      await executeQuery(`
        INSERT INTO seo_settings (setting_key, setting_value, setting_type, category, description) VALUES
        ('site_name', 'ZOXVN - Máy tính, Laptop, Gaming Gear', 'string', 'general', 'Website name'),
        ('site_description', 'ZOXVN - Chuyên cung cấp máy tính, laptop, linh kiện máy tính, gaming gear với giá tốt nhất. Bảo hành chính hãng, giao hàng toàn quốc.', 'string', 'general', 'Default site description'),
        ('site_keywords', 'máy tính, laptop, gaming, linh kiện máy tính, PC, ZOXVN', 'string', 'general', 'Default site keywords'),
        ('site_url', 'https://zoxvn.com', 'string', 'general', 'Primary site URL'),
        ('enable_compression', 'true', 'boolean', 'technical', 'Enable GZIP compression'),
        ('cache_duration', '3600', 'number', 'technical', 'Cache duration in seconds'),
        ('enable_minification', 'true', 'boolean', 'technical', 'Enable HTML/CSS/JS minification')
      `);

      console.log("✅ SEO settings table created and initialized");
    } else {
      console.log("✅ SEO settings table already exists");
    }

    console.log("🎉 SEO system initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize SEO system:", error);
    // Don't throw error to prevent server startup failure
  }
};
