import { executeQuery } from "./connection.js";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const createTables = async () => {
  try {
    console.log("���� Starting MySQL database migration...");

    // Test connection first
    await testConnection();

    // Create users table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        role ENUM('admin', 'user') DEFAULT 'user',
        avatar VARCHAR(255),
        is_active BOOLEAN DEFAULT TRUE,
        last_login TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create categories table (hierarchical)
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        image VARCHAR(500),
        parent_id INT NULL,
        sort_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
        INDEX idx_parent_id (parent_id),
        INDEX idx_slug (slug),
        INDEX idx_is_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create products table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        short_description VARCHAR(500),
        sku VARCHAR(100) UNIQUE NOT NULL,
        price DECIMAL(12,2) NOT NULL,
        sale_price DECIMAL(12,2) NULL,
        stock_quantity INT DEFAULT 0,
        manage_stock BOOLEAN DEFAULT TRUE,
        featured BOOLEAN DEFAULT FALSE,
        status ENUM('active', 'inactive', 'draft') DEFAULT 'active',
        images JSON,
        attributes JSON,
        specifications JSON,
        weight DECIMAL(8,2),
        dimensions VARCHAR(100),
        category_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_slug (slug),
        INDEX idx_sku (sku),
        INDEX idx_status (status),
        INDEX idx_featured (featured),
        INDEX idx_category_id (category_id),
        FULLTEXT idx_search (name, description)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create product_categories junction table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS product_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        category_id INT NOT NULL,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
        UNIQUE KEY unique_product_category (product_id, category_id),
        INDEX idx_product_id (product_id),
        INDEX idx_category_id (category_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create media/file upload table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS media (
        id INT AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        size BIGINT NOT NULL,
        path VARCHAR(500) NOT NULL,
        url VARCHAR(500) NOT NULL,
        alt_text VARCHAR(255),
        title VARCHAR(255),
        uploaded_by INT,
        entity_type ENUM('product', 'category', 'user', 'general') DEFAULT 'general',
        entity_id INT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_entity (entity_type, entity_id),
        INDEX idx_uploaded_by (uploaded_by)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create customer_addresses table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS customer_addresses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        type ENUM('billing', 'shipping') DEFAULT 'shipping',
        full_name VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        address_line_1 VARCHAR(255) NOT NULL,
        address_line_2 VARCHAR(255),
        ward VARCHAR(100),
        district VARCHAR(100),
        city VARCHAR(100),
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create orders table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_number VARCHAR(20) UNIQUE NOT NULL,
        user_id INT NOT NULL,
        status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
        payment_method ENUM('cod', 'bank_transfer', 'credit_card', 'e_wallet') DEFAULT 'cod',
        payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
        shipping_method VARCHAR(100),
        subtotal DECIMAL(12,2) NOT NULL,
        shipping_fee DECIMAL(12,2) DEFAULT 0,
        discount_amount DECIMAL(12,2) DEFAULT 0,
        total_amount DECIMAL(12,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'VND',
        billing_address JSON,
        shipping_address JSON,
        notes TEXT,
        tracking_number VARCHAR(100),
        shipped_at TIMESTAMP NULL,
        delivered_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_order_number (order_number),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create order_items table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        product_sku VARCHAR(100) NOT NULL,
        quantity INT NOT NULL,
        unit_price DECIMAL(12,2) NOT NULL,
        total_price DECIMAL(12,2) NOT NULL,
        product_image VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        INDEX idx_order_id (order_id),
        INDEX idx_product_id (product_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create order_status_history table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS order_status_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        status VARCHAR(50) NOT NULL,
        comment TEXT,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_order_id (order_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create shopping_cart table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS shopping_cart (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_product (user_id, product_id),
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create cart_items table for session carts
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create product_reviews table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS product_reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        user_id INT NOT NULL,
        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        title VARCHAR(255),
        comment TEXT,
        is_verified_purchase BOOLEAN DEFAULT FALSE,
        is_approved BOOLEAN DEFAULT TRUE,
        helpful_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_product_review (user_id, product_id),
        INDEX idx_product_id (product_id),
        INDEX idx_rating (rating)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create product_ratings summary table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS product_ratings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL UNIQUE,
        total_reviews INT DEFAULT 0,
        average_rating DECIMAL(3,2) DEFAULT 0.00,
        rating_1_count INT DEFAULT 0,
        rating_2_count INT DEFAULT 0,
        rating_3_count INT DEFAULT 0,
        rating_4_count INT DEFAULT 0,
        rating_5_count INT DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create wishlist table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS wishlist (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_product_wishlist (user_id, product_id),
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create user sessions table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_token_hash (token_hash),
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create site settings table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS site_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(255) NOT NULL UNIQUE,
        setting_value TEXT,
        setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
        description TEXT,
        is_public BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log("✅ All tables created successfully!");

    // Create sample data
    await createSampleData();

    console.log("✅ Database migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  }
};

const createSampleData = async () => {
  // Create admin user if not exists
  const adminEmail = process.env.ADMIN_EMAIL || "admin@hacom.vn";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  const existingAdmin = await executeQuery(
    'SELECT id FROM users WHERE email = ? AND role = "admin"',
    [adminEmail],
  );

  if (existingAdmin.length === 0) {
    await executeQuery(
      `INSERT INTO users (email, password, full_name, role) VALUES (?, ?, 'Admin HACOM', 'admin')`,
      [adminEmail, hashedPassword],
    );
    console.log(`✅ Admin user created: ${adminEmail}`);
  }

  // Insert sample categories
  const categories = [
    {
      name: "Laptop",
      slug: "laptop",
      description: "Máy tính xách tay",
      image:
        "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=300&h=300&fit=crop",
      sort_order: 1,
    },
    {
      name: "PC",
      slug: "pc",
      description: "Máy tính để bàn",
      image:
        "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=300&h=300&fit=crop",
      sort_order: 2,
    },
    {
      name: "Linh kiện máy tính",
      slug: "linh-kien-may-tinh",
      description: "Linh kiện PC",
      image:
        "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=300&h=300&fit=crop",
      sort_order: 3,
    },
    {
      name: "Thiết bị mạng",
      slug: "thiet-bi-mang",
      description: "Router, Switch, WiFi",
      image:
        "https://images.unsplash.com/photo-1606904825846-647eb07f5be2?w=300&h=300&fit=crop",
      sort_order: 4,
    },
  ];

  for (const cat of categories) {
    const existing = await executeQuery(
      "SELECT id FROM categories WHERE slug = ?",
      [cat.slug],
    );
    if (existing.length === 0) {
      await executeQuery(
        `INSERT INTO categories (name, slug, description, image, sort_order) VALUES (?, ?, ?, ?, ?)`,
        [cat.name, cat.slug, cat.description, cat.image, cat.sort_order],
      );
      console.log(`✅ Category created: ${cat.name}`);
    }
  }

  // Insert sample products
  const products = [
    {
      name: "Laptop ASUS ROG Strix G15",
      slug: "laptop-asus-rog-strix-g15",
      description: "Laptop gaming cao cấp với RTX 3060",
      short_description: "Laptop gaming ASUS ROG với hiệu năng mạnh mẽ",
      sku: "ASUS-ROG-G15-001",
      price: 25000000,
      sale_price: 23000000,
      stock_quantity: 10,
      featured: true,
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop",
      ]),
      category_id: 1,
    },
    {
      name: "PC Gaming RGB Intel i7",
      slug: "pc-gaming-rgb-intel-i7",
      description: "PC Gaming với CPU Intel i7, RAM 16GB, RTX 3070",
      short_description: "PC Gaming hiệu năng cao cho game thủ",
      sku: "PC-GAMING-I7-001",
      price: 35000000,
      sale_price: 32000000,
      stock_quantity: 5,
      featured: true,
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400&h=400&fit=crop",
      ]),
      category_id: 2,
    },
  ];

  for (const product of products) {
    const existing = await executeQuery(
      "SELECT id FROM products WHERE sku = ?",
      [product.sku],
    );
    if (existing.length === 0) {
      const result = await executeQuery(
        `INSERT INTO products (name, slug, description, short_description, sku, price, sale_price, stock_quantity, featured, images, category_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          product.name,
          product.slug,
          product.description,
          product.short_description,
          product.sku,
          product.price,
          product.sale_price,
          product.stock_quantity,
          product.featured,
          product.images,
          product.category_id,
        ],
      );

      // Add product to category
      await executeQuery(
        `INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)`,
        [result.insertId, product.category_id],
      );

      console.log(`✅ Product created: ${product.name}`);
    }
  }
};

// Export as default function
export default createTables;

// Auto-run if script is executed directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  createTables();
}
