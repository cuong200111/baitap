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
  ],
  // Sales reports mock data
  sales_overview: {
    total_revenue: 45750000,
    total_orders: 156,
    avg_order_value: 293269,
    unique_customers: 89,
    completed_orders: 142,
    cancelled_orders: 14
  },
  daily_sales: [
    { date: "2024-08-23", orders: 8, revenue: 2100000, unique_customers: 6 },
    { date: "2024-08-22", orders: 12, revenue: 3200000, unique_customers: 9 },
    { date: "2024-08-21", orders: 15, revenue: 4100000, unique_customers: 11 },
    { date: "2024-08-20", orders: 9, revenue: 2850000, unique_customers: 7 },
    { date: "2024-08-19", orders: 18, revenue: 5200000, unique_customers: 14 }
  ],
  monthly_sales: [
    { month: "2024-08", orders: 156, revenue: 45750000, unique_customers: 89, avg_order_value: 293269 },
    { month: "2024-07", orders: 198, revenue: 52300000, unique_customers: 112, avg_order_value: 264141 },
    { month: "2024-06", orders: 167, revenue: 41200000, unique_customers: 95, avg_order_value: 246707 }
  ],
  best_selling_products: [
    { id: 1, name: "Gaming Laptop ROG Strix", sku: "GLR-001", total_sold: 24, total_revenue: 12500000, avg_price: 520833, order_count: 20 },
    { id: 2, name: "Mechanical Keyboard RGB", sku: "MKR-002", total_sold: 45, total_revenue: 6750000, avg_price: 150000, order_count: 35 },
    { id: 3, name: "Gaming Mouse Pro", sku: "GMP-003", total_sold: 67, total_revenue: 5025000, avg_price: 75000, order_count: 52 },
    { id: 4, name: "Monitor 27'' 4K", sku: "MON-004", total_sold: 18, total_revenue: 4590000, avg_price: 255000, order_count: 16 },
    { id: 5, name: "SSD 1TB NVMe", sku: "SSD-005", total_sold: 34, total_revenue: 3740000, avg_price: 110000, order_count: 28 }
  ],
  sales_by_category: [
    { id: 1, category_name: "Gaming Laptops", total_sold: 28, total_revenue: 15200000, order_count: 24, unique_products: 8 },
    { id: 2, category_name: "Peripherals", total_sold: 112, total_revenue: 11775000, order_count: 87, unique_products: 15 },
    { id: 3, category_name: "Components", total_sold: 89, total_revenue: 8950000, order_count: 67, unique_products: 12 },
    { id: 4, category_name: "Monitors", total_sold: 45, total_revenue: 7200000, order_count: 38, unique_products: 6 }
  ],
  // Product reports mock data
  product_overview: {
    total_products: 156,
    active_products: 142,
    featured_products: 18,
    low_stock_products: 12,
    out_of_stock_products: 3,
    avg_price: 2850000
  },
  top_products_by_sales: [
    { id: 1, name: "Gaming Laptop ROG Strix", sku: "GLR-001", price: 25000000, total_sold: 24, total_revenue: 12500000, order_count: 20, avg_rating: 4.5, review_count: 8 },
    { id: 2, name: "Mechanical Keyboard RGB", sku: "MKR-002", price: 1500000, total_sold: 45, total_revenue: 6750000, order_count: 35, avg_rating: 4.2, review_count: 15 },
    { id: 3, name: "Gaming Mouse Pro", sku: "GMP-003", price: 750000, total_sold: 67, total_revenue: 5025000, order_count: 52, avg_rating: 4.7, review_count: 23 },
    { id: 4, name: "Monitor 27'' 4K", sku: "MON-004", price: 8500000, total_sold: 18, total_revenue: 4590000, order_count: 16, avg_rating: 4.3, review_count: 12 },
    { id: 5, name: "SSD 1TB NVMe", sku: "SSD-005", price: 2200000, total_sold: 34, total_revenue: 3740000, order_count: 28, avg_rating: 4.6, review_count: 18 }
  ],
  low_stock_products: [
    { id: 8, name: "CPU Intel i9", sku: "CPU-008", stock_quantity: 2, price: 12000000, total_sold_last_30_days: 8 },
    { id: 12, name: "GPU RTX 4080", sku: "GPU-012", stock_quantity: 3, price: 28000000, total_sold_last_30_days: 5 },
    { id: 15, name: "RAM 32GB DDR5", sku: "RAM-015", stock_quantity: 5, price: 4500000, total_sold_last_30_days: 12 }
  ],
  category_performance: [
    { id: 1, category_name: "Gaming Laptops", product_count: 24, active_products: 22, total_sold: 28, total_revenue: 15200000, avg_price: 18500000 },
    { id: 2, category_name: "Peripherals", product_count: 45, active_products: 42, total_sold: 112, total_revenue: 11775000, avg_price: 850000 },
    { id: 3, category_name: "Components", product_count: 67, active_products: 61, total_sold: 89, total_revenue: 8950000, avg_price: 2100000 },
    { id: 4, category_name: "Monitors", product_count: 28, active_products: 25, total_sold: 45, total_revenue: 7200000, avg_price: 6500000 }
  ],
  // Customer reports mock data
  customer_stats: {
    total_customers: 245,
    paying_customers: 156,
    active_last_30_days: 89,
    avg_orders_per_customer: 2.3,
    avg_spent_per_customer: 1850000
  },
  top_customers_by_orders: [
    { id: 1, full_name: "Nguyễn Văn An", email: "an.nguyen@example.com", order_count: 12, total_spent: 8500000, avg_order_value: 708333, last_order_date: "2024-08-20" },
    { id: 2, full_name: "Trần Thị Bình", email: "binh.tran@example.com", order_count: 9, total_spent: 6200000, avg_order_value: 688889, last_order_date: "2024-08-18" },
    { id: 3, full_name: "Lê Minh Cường", email: "cuong.le@example.com", order_count: 8, total_spent: 12500000, avg_order_value: 1562500, last_order_date: "2024-08-22" }
  ],
  top_customers_by_spent: [
    { id: 3, full_name: "Lê Minh Cường", email: "cuong.le@example.com", order_count: 8, total_spent: 12500000, avg_order_value: 1562500, last_order_date: "2024-08-22" },
    { id: 4, full_name: "Phạm Thị Dung", email: "dung.pham@example.com", order_count: 5, total_spent: 9800000, avg_order_value: 1960000, last_order_date: "2024-08-19" },
    { id: 1, full_name: "Nguyễn Văn An", email: "an.nguyen@example.com", order_count: 12, total_spent: 8500000, avg_order_value: 708333, last_order_date: "2024-08-20" }
  ],
  retention_analysis: [
    { customer_type: "Khách hàng VIP", count: 8, avg_spent: 15200000, total_revenue: 121600000 },
    { customer_type: "Khách hàng thân thiết", count: 24, avg_spent: 6850000, total_revenue: 164400000 },
    { customer_type: "Khách hàng thường xuyên", count: 67, avg_spent: 2100000, total_revenue: 140700000 },
    { customer_type: "Khách hàng mới", count: 57, avg_spent: 450000, total_revenue: 25650000 },
    { customer_type: "Chưa mua hàng", count: 89, avg_spent: 0, total_revenue: 0 }
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
