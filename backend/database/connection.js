import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// Use MySQL database
const USE_MYSQL = true;
console.log("🔄 Using MySQL database...");

// MySQL configuration using environment variables with fallbacks
export const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "wocom",
  port: parseInt(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  charset: "utf8mb4",
  ssl: false,
};

// SEO Configuration
export const seoConfig = {
  general: {
    site_name: "ZOXVN - Máy tính, Laptop, Gaming Gear",
    site_description:
      "ZOXVN - Chuyên cung cấp máy tính, laptop, linh kiện máy tính, gaming gear với giá tốt nhất. Bảo hành chính hãng, giao hàng toàn quốc.",
    site_keywords: "máy tính, laptop, gaming, linh kiện máy tính, PC, ZOXVN",
    site_url: "https://zoxvn.com",
    enable_compression: true,
    cache_duration: 3600,
    enable_minification: true,
  },
  social_media: {
    facebook_url: "",
    facebook_app_id: "",
    twitter_site: "@zoxvn_official",
    linkedin_url: "",
    youtube_url: "",
    instagram_url: "",
  },
  content: {
    default_meta_title_pattern: "{title} | ZOXVN",
    product_meta_title_pattern: "{product_name} - {category} | ZOXVN",
    category_meta_title_pattern: "{category_name} - {description} | ZOXVN",
    auto_generate_meta_description: true,
    enable_structured_data: true,
    enable_breadcrumbs: true,
  },
  schema: {
    organization_name: "ZOXVN",
    organization_logo: "/logo.png",
    organization_address: "123 Tech Street, Ho Chi Minh City, Vietnam",
    organization_phone: "1900 1903",
    organization_email: "contact@zoxvn.com",
    business_type: "ElectronicsStore",
  },
  sitemap: {
    sitemap_priority_homepage: 1.0,
    sitemap_priority_products: 0.8,
    sitemap_priority_categories: 0.7,
    sitemap_changefreq: "weekly",
    sitemap_include_images: true,
    sitemap_max_urls: 50000,
  },
  local: {
    business_type: "ElectronicsStore",
    enable_geo_meta: true,
    default_location: "Ho Chi Minh City, Vietnam",
    enable_local_schema: true,
  },
  technical: {
    enable_compression: true,
    cache_duration: 3600,
    enable_lazy_loading: true,
    enable_preload: true,
    cdn_url: "https://cdn.zoxvn.com",
    enable_webp: true,
    enable_critical_css: true,
  },
};
export const mysqlExecuteQuery = async (query, params = []) => {
  try {
    console.log(
      "🔍 Executing query:",
      query.slice(0, 100) + (query.length > 100 ? "..." : ""),
    );
    const [results] = await pool.execute(query, params);
    console.log(
      "✅ Query executed successfully, rows affected:",
      Array.isArray(results) ? results.length : "N/A",
    );
    return results;
  } catch (error) {
    console.error("❌ MySQL query error:", error.message);
    console.error("Query:", query);
    console.error("Params:", params);

    // Handle specific connection errors
    if (error.code === "ECONNRESET") {
      console.error("🔄 Connection reset, may need to retry");
    } else if (error.code === "PROTOCOL_CONNECTION_LOST") {
      console.error("🔄 Connection lost, may need to retry");
    }

    throw error;
  }
};
console.log("📡 MySQL Config:", {
  host: dbConfig.host,
  user: dbConfig.user,
  database: dbConfig.database,
  port: dbConfig.port,
});

// Create connection pool
let pool;

try {
  pool = mysql.createPool(dbConfig);
  console.log("✅ MySQL connection pool created successfully");
} catch (error) {
  console.error("❌ MySQL pool creation failed:", error.message);
  throw error;
}

// Mock data for development
const mockData = {
  products: [
    {
      id: 1,
      name: "Gaming Laptop ROG Strix",
      slug: "gaming-laptop-rog-strix",
      description: "High-performance gaming laptop with RTX graphics",
      price: 25000000,
      sale_price: 22000000,
      stock_quantity: 10,
      featured: true,
      status: "active",
      images: JSON.stringify(["/placeholder.svg"]),
      specifications: JSON.stringify({}),
      avg_rating: "4.5",
      review_count: 25,
      category_names: "Gaming,Laptops",
      final_price: 22000000,
      discount_percent: 12,
      created_at: new Date().toISOString()
    }
  ],
  seo_settings: [
    { setting_key: "site_name", setting_value: "HACOM - Máy tính, Laptop, Gaming Gear", category: "general" },
    { setting_key: "site_description", setting_value: "HACOM - Chuyên cung cấp máy tính, laptop, linh kiện máy tính, gaming gear với giá tốt nhất.", category: "general" }
  ]
};

// Execute query with fallback to mock data
export const executeQuery = async (query, params = []) => {
  try {
    return await mysqlExecuteQuery(query, params);
  } catch (error) {
    console.error("Database query error:", error.message);

    // Provide fallback mock data for development
    if (error.code === 'ECONNREFUSED' || error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log("🔄 Database unavailable, using mock data for development");

      // Parse query to determine what mock data to return
      const queryLower = query.toLowerCase();

      if (queryLower.includes('select') && queryLower.includes('products')) {
        if (queryLower.includes('count(*)')) {
          return [{ total: mockData.products.length }];
        }
        return mockData.products;
      }

      if (queryLower.includes('seo_settings')) {
        return mockData.seo_settings;
      }

      if (queryLower.includes('show tables')) {
        return [
          { 'Tables_in_hacom_dev': 'products' },
          { 'Tables_in_hacom_dev': 'seo_settings' },
          { 'Tables_in_hacom_dev': 'categories' }
        ];
      }

      if (queryLower.includes('connection_id()')) {
        return [{ connection_id: 1, current_time: new Date() }];
      }

      // Default empty result
      return [];
    }

    throw error;
  }
};

// Get MySQL connection from pool
const mysqlGetConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log("✅ MySQL connection acquired");
    return connection;
  } catch (error) {
    console.error("❌ MySQL connection failed:", error.message);
    throw error;
  }
};

// Get connection from pool
export const getConnection = async () => {
  try {
    return await mysqlGetConnection();
  } catch (error) {
    console.error("❌ Get connection failed:", error.message);
    throw error;
  }
};

// Export pool for direct use
export { pool };

export default pool;
