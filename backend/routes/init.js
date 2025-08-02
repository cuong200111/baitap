import express from "express";
import { executeQuery } from "../database/connection.js";

const router = express.Router();

// Initialize default SEO and site settings
router.post("/default-settings", async (req, res) => {
  try {
    console.log("🔄 Initializing default settings...");

    // Check if SEO settings already exist
    const existingSeoCount = await executeQuery(`
      SELECT COUNT(*) as count FROM seo_settings WHERE is_active = 1
    `);

    if (existingSeoCount[0].count === 0) {
      // Default SEO settings to insert
      const defaultSeoSettings = [
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

        // Analytics settings
        ["google_analytics_id", "", "analytics"],
        ["enable_analytics", "1", "analytics"],

        // Technical settings
        ["enable_compression", "1", "technical"],
        ["enable_sitemap", "1", "technical"],
        ["lazy_load_images", "1", "technical"],
        ["minify_html", "1", "technical"],

        // Schema settings
        ["organization_name", "HACOM", "schema"],
        [
          "organization_address",
          "Số 131 Lê Thanh Nghị, Hai Bà Trưng, Hà Nội",
          "schema",
        ],
        ["organization_phone", "1900 1903", "schema"],
        ["enable_organization_schema", "1", "schema"],
        ["enable_product_schema", "1", "schema"],
      ];

      // Insert each setting
      for (const [key, value, category] of defaultSeoSettings) {
        await executeQuery(
          `INSERT INTO seo_settings (setting_key, setting_value, category, created_at, updated_at, is_active)
           VALUES (?, ?, ?, NOW(), NOW(), 1)`,
          [key, value, category],
        );
      }

      console.log(
        `✅ Successfully inserted ${defaultSeoSettings.length} SEO settings`,
      );
    }

    // Check if site settings exist
    const existingSiteCount = await executeQuery(`
      SELECT COUNT(*) as count FROM site_settings
    `);

    if (existingSiteCount[0].count === 0) {
      const siteSettings = [
        ["general_site_name", "HACOM E-commerce", "string"],
        ["general_contact_email", "info@hacom.vn", "string"],
        ["general_contact_phone", "1900.1903", "string"],
        ["store_enabled", "1", "boolean"],
        ["store_maintenance_mode", "0", "boolean"],
        ["payment_cod_enabled", "1", "boolean"],
        ["email_notifications", "1", "boolean"],
      ];

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
    }

    res.json({
      success: true,
      message: "Default settings initialized successfully",
    });
  } catch (error) {
    console.error("❌ Error initializing default settings:", error);
    res.status(500).json({
      success: false,
      message: "Failed to initialize default settings",
      error: error.message,
    });
  }
});

export default router;
