import { executeQuery } from "./connection.js";

const createNewTables = async () => {
  try {
    console.log("🔄 Creating new database tables...");

    // Cart items table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        session_id VARCHAR(255) NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        INDEX idx_cart_user (user_id),
        INDEX idx_cart_session (session_id),
        INDEX idx_cart_product (product_id)
      )
    `);

    // Warehouses table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS warehouses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address TEXT NOT NULL,
        latitude DECIMAL(10, 8) NULL,
        longitude DECIMAL(11, 8) NULL,
        phone VARCHAR(20) NULL,
        is_default TINYINT(1) DEFAULT 0,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Shipping zones table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS shipping_zones (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        warehouse_id INT NOT NULL,
        province_ids JSON NULL,
        district_ids JSON NULL,
        description TEXT NULL,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE
      )
    `);

    // Shipping rates table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS shipping_rates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        zone_id INT NOT NULL,
        min_distance DECIMAL(8, 2) DEFAULT 0,
        max_distance DECIMAL(8, 2) NULL,
        base_rate DECIMAL(10, 2) NOT NULL,
        per_km_rate DECIMAL(10, 2) DEFAULT 0,
        min_order_amount DECIMAL(10, 2) DEFAULT 0,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (zone_id) REFERENCES shipping_zones(id) ON DELETE CASCADE
      )
    `);

    // SEO settings table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS seo_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        site_title VARCHAR(255) NULL,
        site_description TEXT NULL,
        keywords TEXT NULL,
        robots_txt TEXT NULL,
        meta_author VARCHAR(255) NULL,
        og_image VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Add missing columns to existing tables if they don't exist
    try {
      // Check if last_login column exists in users table
      const userColumns = await executeQuery(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'last_login'
      `);

      if (userColumns.length === 0) {
        await executeQuery(`ALTER TABLE users ADD COLUMN last_login TIMESTAMP NULL`);
        console.log("✅ Added last_login column to users table");
      }
    } catch (e) {
      console.log("⚠️ Could not add last_login column:", e.message);
    }

    try {
      // Check if payment_method column exists in orders table
      const orderColumns = await executeQuery(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'payment_method'
      `);

      if (orderColumns.length === 0) {
        await executeQuery(`ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50) NULL`);
        console.log("✅ Added payment_method column to orders table");
      }
    } catch (e) {
      console.log("⚠️ Could not add payment_method column:", e.message);
    }

    try {
      // Check if category_id column exists in products table
      const productColumns = await executeQuery(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'category_id'
      `);

      if (productColumns.length === 0) {
        await executeQuery(`ALTER TABLE products ADD COLUMN category_id INT NULL`);
        console.log("✅ Added category_id column to products table");
      }
    } catch (e) {
      console.log("⚠️ Could not add category_id column:", e.message);
    }

    // Insert default warehouse if none exists
    const existingWarehouses = await executeQuery("SELECT COUNT(*) as count FROM warehouses");
    if (existingWarehouses[0].count === 0) {
      await executeQuery(`
        INSERT INTO warehouses (name, address, latitude, longitude, is_default, is_active) 
        VALUES 
        ('Kho chính Hà Nội', '123 Đường ABC, Quận C���u Giấy, Hà Nội', 21.0285, 105.8542, 1, 1),
        ('Kho TP.HCM', '456 Đường XYZ, Quận 1, TP Hồ Chí Minh', 10.8231, 106.6297, 0, 1)
      `);
      console.log("✅ Created default warehouses");
    }

    // Insert default shipping zones if none exist
    const existingZones = await executeQuery("SELECT COUNT(*) as count FROM shipping_zones");
    if (existingZones[0].count === 0) {
      const warehouses = await executeQuery("SELECT id FROM warehouses LIMIT 2");
      if (warehouses.length > 0) {
        await executeQuery(`
          INSERT INTO shipping_zones (name, warehouse_id, province_ids, description) 
          VALUES 
          ('Miền Bắc', ?, '${JSON.stringify([1, 33, 77, 2, 4, 6, 8, 10, 11, 12, 14, 15, 17, 19, 22, 24, 25, 27, 30, 31, 35, 36, 37, 38, 40, 42, 44, 45, 46])}', 'Khu vực miền Bắc'),
          ('Miền Nam', ?, '${JSON.stringify([79, 92, 70, 72, 74, 75, 77, 80, 82, 83, 84, 86, 87, 89, 91, 93, 94, 95, 96])}', 'Khu vực miền Nam')
        `, [warehouses[0].id, warehouses[1]?.id || warehouses[0].id]);
        console.log("✅ Created default shipping zones");
      }
    }

    // Insert default shipping rates if none exist
    const existingRates = await executeQuery("SELECT COUNT(*) as count FROM shipping_rates");
    if (existingRates[0].count === 0) {
      const zones = await executeQuery("SELECT id FROM shipping_zones LIMIT 2");
      if (zones.length > 0) {
        await executeQuery(`
          INSERT INTO shipping_rates (zone_id, min_distance, max_distance, base_rate, per_km_rate, min_order_amount) 
          VALUES 
          (?, 0, 50, 30000, 1000, 500000),
          (?, 50, 200, 50000, 1500, 500000),
          (?, 200, NULL, 80000, 2000, 500000)
        `, [zones[0].id, zones[0].id, zones[0].id]);
        
        if (zones[1]) {
          await executeQuery(`
            INSERT INTO shipping_rates (zone_id, min_distance, max_distance, base_rate, per_km_rate, min_order_amount) 
            VALUES 
            (?, 0, 50, 35000, 1200, 500000),
            (?, 50, 200, 55000, 1800, 500000),
            (?, 200, NULL, 85000, 2200, 500000)
          `, [zones[1].id, zones[1].id, zones[1].id]);
        }
        console.log("✅ Created default shipping rates");
      }
    }

    console.log("✅ All new tables created successfully!");

  } catch (error) {
    console.error("❌ Error creating new tables:", error);
    throw error;
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createNewTables()
    .then(() => {
      console.log("🎉 Database migration completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Migration failed:", error);
      process.exit(1);
    });
}

export { createNewTables };
