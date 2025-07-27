// import mysql from "mysql2/promise";
// import dotenv from "dotenv";

// dotenv.config();

// console.log("🔄 Using MySQL database...");

// // MySQL configuration với thông tin cụ thể
// const dbConfig = {
//   host: "103.57.221.79",
//   user: "qftuzbjqhosting_b5",
//   password: "Iw~hwC@*9eyN.HQh",
//   database: "qftuzbjqhosting_b5",
//   port: 3306,
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0,
//   acquireTimeout: 60000,
//   timeout: 60000,
//   charset: "utf8mb4",
//   ssl: false,
// };

// console.log("📡 MySQL Config:", {
//   host: dbConfig.host,
//   user: dbConfig.user,
//   database: dbConfig.database,
//   port: dbConfig.port,
// });

// // Create connection pool
// const pool = mysql.createPool(dbConfig);

// // Create tables for MySQL
// const initDatabase = async () => {
//   try {
//     // Users table
//     await pool.execute(`
//       CREATE TABLE IF NOT EXISTS users (
//         id INT AUTO_INCREMENT PRIMARY KEY,
//         email VARCHAR(255) UNIQUE NOT NULL,
//         password VARCHAR(255) NOT NULL,
//         full_name VARCHAR(255) NOT NULL,
//         phone VARCHAR(20),
//         role ENUM('admin', 'user') DEFAULT 'user',
//         is_active BOOLEAN DEFAULT TRUE,
//         avatar VARCHAR(500),
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
//       ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
//     `);

//     // Categories table
//     await pool.execute(`
//       CREATE TABLE IF NOT EXISTS categories (
//         id INT AUTO_INCREMENT PRIMARY KEY,
//         name VARCHAR(255) NOT NULL,
//         slug VARCHAR(255) UNIQUE NOT NULL,
//         description TEXT,
//         image VARCHAR(500),
//         parent_id INT,
//         sort_order INT DEFAULT 0,
//         is_active BOOLEAN DEFAULT TRUE,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
//         FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
//       ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
//     `);

//     // Products table
//     await pool.execute(`
//       CREATE TABLE IF NOT EXISTS products (
//         id INT AUTO_INCREMENT PRIMARY KEY,
//         name VARCHAR(255) NOT NULL,
//         slug VARCHAR(255) UNIQUE NOT NULL,
//         description TEXT,
//         short_description TEXT,
//         sku VARCHAR(100) UNIQUE NOT NULL,
//         price DECIMAL(10,2) NOT NULL,
//         sale_price DECIMAL(10,2),
//         stock_quantity INT DEFAULT 0,
//         manage_stock BOOLEAN DEFAULT TRUE,
//         featured BOOLEAN DEFAULT FALSE,
//         status ENUM('active', 'inactive', 'draft') DEFAULT 'active',
//         images JSON, -- JSON array of image URLs
//         specifications JSON, -- JSON object
//         avg_rating DECIMAL(3,2) DEFAULT 0,
//         review_count INT DEFAULT 0,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
//       ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
//     `);

//     // Product categories relationship
//     await pool.execute(`
//       CREATE TABLE IF NOT EXISTS product_categories (
//         id INT AUTO_INCREMENT PRIMARY KEY,
//         product_id INT NOT NULL,
//         category_id INT NOT NULL,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//         FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
//         FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
//         UNIQUE KEY unique_product_category (product_id, category_id)
//       ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
//     `);

//     // Product reviews table
//     await pool.execute(`
//       CREATE TABLE IF NOT EXISTS product_reviews (
//         id INT AUTO_INCREMENT PRIMARY KEY,
//         product_id INT NOT NULL,
//         user_id INT NOT NULL,
//         rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
//         title VARCHAR(255),
//         comment TEXT,
//         is_approved BOOLEAN DEFAULT TRUE,
//         helpful_count INT DEFAULT 0,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
//         FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
//         FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
//         UNIQUE KEY unique_user_product_review (product_id, user_id)
//       ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
//     `);

//     // Orders table
//     await pool.execute(`
//       CREATE TABLE IF NOT EXISTS orders (
//         id INT AUTO_INCREMENT PRIMARY KEY,
//         order_number VARCHAR(50) UNIQUE NOT NULL,
//         user_id INT,
//         status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
//         total_amount DECIMAL(10,2) NOT NULL,
//         payment_method VARCHAR(100),
//         payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
//         shipping_address JSON,
//         billing_address JSON,
//         notes TEXT,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
//         FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
//       ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
//     `);

//     // Order items table
//     await pool.execute(`
//       CREATE TABLE IF NOT EXISTS order_items (
//         id INT AUTO_INCREMENT PRIMARY KEY,
//         order_id INT NOT NULL,
//         product_id INT NOT NULL,
//         quantity INT NOT NULL,
//         price DECIMAL(10,2) NOT NULL,
//         total DECIMAL(10,2) NOT NULL,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//         FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
//         FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
//       ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
//     `);

//     // Media table
//     await pool.execute(`
//       CREATE TABLE IF NOT EXISTS media (
//         id INT AUTO_INCREMENT PRIMARY KEY,
//         filename VARCHAR(255) NOT NULL,
//         original_name VARCHAR(255) NOT NULL,
//         mime_type VARCHAR(100) NOT NULL,
//         size INT NOT NULL,
//         path VARCHAR(500) NOT NULL,
//         url VARCHAR(500) NOT NULL,
//         entity_type VARCHAR(50),
//         entity_id INT,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//       ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
//     `);

//     console.log("✅ MySQL database tables created successfully");
//   } catch (error) {
//     console.error("❌ Error creating tables:", error);
//     throw error;
//   }
// };

// // Insert sample data
// const insertSampleData = async () => {
//   try {
//     // Check if data already exists
//     const [userRows] = await pool.execute(
//       "SELECT COUNT(*) as count FROM users",
//     );
//     if (userRows[0].count > 0) {
//       console.log("📊 Sample data already exists, skipping insert");
//       return;
//     }

//     console.log("📊 Inserting sample data...");

//     // Insert admin user
//     await pool.execute(
//       `
//       INSERT INTO users (email, password, full_name, phone, role, is_active) 
//       VALUES (?, ?, ?, ?, ?, ?)
//     `,
//       [
//         "admin@hacom.vn",
//         "$2b$12$hashedpassword",
//         "Admin HACOM",
//         null,
//         "admin",
//         true,
//       ],
//     );

//     // Insert sample users
//     await pool.execute(
//       `
//       INSERT INTO users (email, password, full_name, phone, role, is_active) 
//       VALUES (?, ?, ?, ?, ?, ?)
//     `,
//       [
//         "user1@example.com",
//         "$2b$12$hashedpassword",
//         "Nguyễn Văn A",
//         "0901234567",
//         "user",
//         true,
//       ],
//     );

//     await pool.execute(
//       `
//       INSERT INTO users (email, password, full_name, phone, role, is_active) 
//       VALUES (?, ?, ?, ?, ?, ?)
//     `,
//       [
//         "user2@example.com",
//         "$2b$12$hashedpassword",
//         "Trần Thị B",
//         "0907654321",
//         "user",
//         true,
//       ],
//     );

//     await pool.execute(
//       `
//       INSERT INTO users (email, password, full_name, phone, role, is_active) 
//       VALUES (?, ?, ?, ?, ?, ?)
//     `,
//       [
//         "user3@example.com",
//         "$2b$12$hashedpassword",
//         "Lê Văn C",
//         "0909876543",
//         "user",
//         true,
//       ],
//     );

//     // Insert categories
//     await pool.execute(
//       `
//       INSERT INTO categories (name, slug, description, image, parent_id, sort_order, is_active)
//       VALUES (?, ?, ?, ?, ?, ?, ?)
//     `,
//       [
//         "Laptop",
//         "laptop",
//         "Máy tính xách tay",
//         "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=300&h=300&fit=crop",
//         null,
//         1,
//         true,
//       ],
//     );

//     await pool.execute(
//       `
//       INSERT INTO categories (name, slug, description, image, parent_id, sort_order, is_active)
//       VALUES (?, ?, ?, ?, ?, ?, ?)
//     `,
//       [
//         "PC",
//         "pc",
//         "Máy tính để bàn",
//         "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=300&h=300&fit=crop",
//         null,
//         2,
//         true,
//       ],
//     );

//     await pool.execute(
//       `
//       INSERT INTO categories (name, slug, description, image, parent_id, sort_order, is_active)
//       VALUES (?, ?, ?, ?, ?, ?, ?)
//     `,
//       [
//         "Gaming",
//         "gaming",
//         "Sản phẩm Gaming",
//         "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=300&h=300&fit=crop",
//         null,
//         3,
//         true,
//       ],
//     );

//     // Insert products
//     const [result1] = await pool.execute(
//       `
//       INSERT INTO products (name, slug, description, short_description, sku, price, sale_price, stock_quantity, featured, status, images, avg_rating, review_count)
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//     `,
//       [
//         "Laptop ASUS ROG Strix G15",
//         "laptop-asus-rog-strix-g15",
//         "Laptop gaming cao cấp với RTX 3060, CPU AMD Ryzen 7, RAM 16GB DDR4, SSD 512GB PCIe NVMe. Màn hình 15.6 inch Full HD 144Hz, bàn phím RGB Aura Sync.",
//         "Laptop gaming ASUS ROG với hiệu năng mạnh mẽ",
//         "ASUS-ROG-G15-001",
//         25000000,
//         23000000,
//         10,
//         true,
//         "active",
//         JSON.stringify([
//           "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop",
//         ]),
//         4.7,
//         3,
//       ],
//     );

//     const product1Id = result1.insertId;

//     const [result2] = await pool.execute(
//       `
//       INSERT INTO products (name, slug, description, short_description, sku, price, sale_price, stock_quantity, featured, status, images, avg_rating, review_count)
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//     `,
//       [
//         "PC Gaming RGB Intel i7",
//         "pc-gaming-rgb-intel-i7",
//         "PC Gaming với CPU Intel i7-12700K, RAM 32GB DDR4, VGA RTX 3070 Ti, SSD 1TB NVMe, Case RGB với tản nhiệt nước AIO 240mm.",
//         "PC Gaming hiệu năng cao cho game thủ",
//         "PC-GAMING-I7-001",
//         35000000,
//         32000000,
//         5,
//         true,
//         "active",
//         JSON.stringify([
//           "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400&h=400&fit=crop",
//         ]),
//         4.5,
//         2,
//       ],
//     );

//     const product2Id = result2.insertId;

//     await pool.execute(
//       `
//       INSERT INTO products (name, slug, description, short_description, sku, price, sale_price, stock_quantity, featured, status, images, avg_rating, review_count)
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//     `,
//       [
//         "MacBook Pro M2 13 inch",
//         "macbook-pro-m2-13inch",
//         "MacBook Pro với chip M2 8-core CPU, 10-core GPU, RAM 16GB unified memory, SSD 512GB. Màn hình Retina 13.3 inch, pin 17 giờ.",
//         "MacBook Pro M2 cho công việc chuyên nghiệp",
//         "APPLE-MBP-M2-001",
//         45000000,
//         42000000,
//         8,
//         true,
//         "active",
//         JSON.stringify([
//           "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=400&h=400&fit=crop",
//         ]),
//         4.8,
//         5,
//       ],
//     );

//     await pool.execute(
//       `
//       INSERT INTO products (name, slug, description, short_description, sku, price, sale_price, stock_quantity, featured, status, images, avg_rating, review_count)
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//     `,
//       [
//         "Gaming Chair RGB Pro",
//         "gaming-chair-rgb-pro",
//         "Ghế gaming chuyên nghiệp với đèn LED RGB, tựa lưng 4D, tựa tay điều chỉnh được, chất liệu da PU cao cấp, bánh xe im lặng.",
//         "Ghế gaming RGB chuyên nghiệp",
//         "CHAIR-RGB-PRO-001",
//         8500000,
//         7500000,
//         15,
//         false,
//         "active",
//         JSON.stringify([
//           "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop",
//         ]),
//         4.3,
//         7,
//       ],
//     );

//     // Insert product categories
//     await pool.execute(
//       `
//       INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)
//     `,
//       [product1Id, 1],
//     ); // Laptop category

//     await pool.execute(
//       `
//       INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)
//     `,
//       [product1Id, 3],
//     ); // Gaming category

//     await pool.execute(
//       `
//       INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)
//     `,
//       [product2Id, 2],
//     ); // PC category

//     await pool.execute(
//       `
//       INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)
//     `,
//       [product2Id, 3],
//     ); // Gaming category

//     // Insert reviews
//     await pool.execute(
//       `
//       INSERT INTO product_reviews (product_id, user_id, rating, title, comment, is_approved, helpful_count)
//       VALUES (?, ?, ?, ?, ?, ?, ?)
//     `,
//       [
//         product1Id,
//         2,
//         5,
//         "Sản phẩm tuyệt vời!",
//         "Chất lượng rất tốt, giao hàng nhanh. Tôi rất hài lòng với sản phẩm này. Hiệu năng mạnh mẽ, thiết kế đẹp.",
//         true,
//         12,
//       ],
//     );

//     await pool.execute(
//       `
//       INSERT INTO product_reviews (product_id, user_id, rating, title, comment, is_approved, helpful_count)
//       VALUES (?, ?, ?, ?, ?, ?, ?)
//     `,
//       [
//         product1Id,
//         3,
//         4,
//         "Khá tốt",
//         "Sản phẩm ổn, có một vài điểm nhỏ cần cải thiện nhưng tổng thể vẫn hài lòng.",
//         true,
//         8,
//       ],
//     );

//     await pool.execute(
//       `
//       INSERT INTO product_reviews (product_id, user_id, rating, title, comment, is_approved, helpful_count)
//       VALUES (?, ?, ?, ?, ?, ?, ?)
//     `,
//       [
//         product1Id,
//         4,
//         5,
//         "Hoàn hảo cho công việc",
//         "Mình làm đồ họa và sản phẩm này đáp ứng hoàn toàn nhu cầu. Màn hình đẹp, hiệu năng mượt.",
//         true,
//         15,
//       ],
//     );

//     await pool.execute(
//       `
//       INSERT INTO product_reviews (product_id, user_id, rating, title, comment, is_approved, helpful_count)
//       VALUES (?, ?, ?, ?, ?, ?, ?)
//     `,
//       [
//         product2Id,
//         2,
//         4,
//         "PC gaming tốt",
//         "Hiệu năng mạnh mẽ, chạy game mượt mà. RGB đẹp, tản nhiệt tốt.",
//         true,
//         6,
//       ],
//     );

//     await pool.execute(
//       `
//       INSERT INTO product_reviews (product_id, user_id, rating, title, comment, is_approved, helpful_count)
//       VALUES (?, ?, ?, ?, ?, ?, ?)
//     `,
//       [
//         product2Id,
//         3,
//         5,
//         "Xuất sắc!",
//         "Streaming và gaming đều rất mượt. Build quality tuyệt vời.",
//         true,
//         9,
//       ],
//     );

//     console.log("✅ Sample data inserted successfully");
//   } catch (error) {
//     console.error("❌ Error inserting sample data:", error);
//     throw error;
//   }
// };

// // Test connection
// export const testConnection = async () => {
//   try {
//     const connection = await pool.getConnection();
//     await connection.ping();
//     console.log("✅ MySQL database connected successfully");
//     connection.release();
//     return true;
//   } catch (error) {
//     console.error("❌ MySQL connection failed:", error.message);
//     return false;
//   }
// };

// // Execute query wrapper


// // Get connection from pool
// export const getConnection = async () => {
//   return await pool.getConnection();
// };

// // Initialize database
// try {
//   await initDatabase();
//   await insertSampleData();
// } catch (error) {
//   console.error("❌ Failed to initialize MySQL database:", error);
//   process.exit(1);
// }

// export default pool;
