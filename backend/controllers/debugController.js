import { executeQuery } from "../database/connection.js";
import bcrypt from "bcryptjs";

export const debugController = {
  // Test authentication
  async testAuth(req, res) {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        return res.json({
          success: true,
          message: "No auth header provided",
          data: { authenticated: false },
        });
      }

      const token = authHeader.split(" ")[1];
      if (!token) {
        return res.json({
          success: true,
          message: "No token provided",
          data: { authenticated: false },
        });
      }

      // Verify token
      const jwt = await import("jsonwebtoken");
      const JWT_SECRET =
        process.env.JWT_SECRET ||
        "zoxvn_jwt_secret_key_very_secure_2024_production_ready";

      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        res.json({
          success: true,
          message: "Token is valid",
          data: {
            authenticated: true,
            user: decoded,
          },
        });
      } catch (jwtError) {
        res.json({
          success: true,
          message: "Invalid token",
          data: {
            authenticated: false,
            error: jwtError.message,
          },
        });
      }
    } catch (error) {
      console.error("Test auth error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to test authentication",
      });
    }
  },

  // Database check
  async checkDatabase(req, res) {
    try {
      // Test basic connection
      const testQuery = await executeQuery("SELECT 1 as test");

      // Count tables
      const tables = await executeQuery(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = DATABASE()
      `);

      // Test each main table
      const tableChecks = {};
      const mainTables = ["users", "products", "categories", "orders"];

      for (const table of mainTables) {
        try {
          const count = await executeQuery(
            `SELECT COUNT(*) as count FROM ${table}`,
          );
          tableChecks[table] = {
            exists: true,
            count: count[0]?.count || 0,
          };
        } catch (err) {
          tableChecks[table] = {
            exists: false,
            error: err.message,
          };
        }
      }

      res.json({
        success: true,
        data: {
          connection: "OK",
          total_tables: tables.length,
          table_checks: tableChecks,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Database check error:", error);
      res.status(500).json({
        success: false,
        message: "Database check failed",
        error: error.message,
      });
    }
  },

  // Test categories
  async testCategories(req, res) {
    try {
      const categories = await executeQuery(
        "SELECT id, name, slug, parent_id, is_active FROM categories ORDER BY sort_order",
      );

      const stats = {
        total: categories.length,
        active: categories.filter((c) => c.is_active).length,
        root_categories: categories.filter((c) => !c.parent_id).length,
        sub_categories: categories.filter((c) => c.parent_id).length,
      };

      res.json({
        success: true,
        data: {
          categories,
          stats,
        },
      });
    } catch (error) {
      console.error("Test categories error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to test categories",
      });
    }
  },

  // Get raw categories data
  async getRawCategories(req, res) {
    try {
      const categories = await executeQuery("SELECT * FROM categories");

      res.json({
        success: true,
        data: categories,
      });
    } catch (error) {
      console.error("Get raw categories error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get raw categories",
      });
    }
  },

  // Simple categories structure
  async getSimpleCategories(req, res) {
    try {
      const categories = await executeQuery(
        "SELECT id, name, slug FROM categories WHERE is_active = 1 ORDER BY name",
      );

      res.json({
        success: true,
        data: categories,
      });
    } catch (error) {
      console.error("Get simple categories error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get simple categories",
      });
    }
  },

  // Count categories
  async countCategories(req, res) {
    try {
      const count = await executeQuery(
        "SELECT COUNT(*) as total FROM categories",
      );
      const activeCount = await executeQuery(
        "SELECT COUNT(*) as active FROM categories WHERE is_active = 1",
      );

      res.json({
        success: true,
        data: {
          total: count[0]?.total || 0,
          active: activeCount[0]?.active || 0,
        },
      });
    } catch (error) {
      console.error("Count categories error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to count categories",
      });
    }
  },

  // Ensure categories exist
  async ensureCategories(req, res) {
    try {
      const existing = await executeQuery(
        "SELECT COUNT(*) as count FROM categories",
      );

      if (existing[0]?.count > 0) {
        return res.json({
          success: true,
          message: "Categories already exist",
          data: { count: existing[0].count },
        });
      }

      // Create default categories
      const defaultCategories = [
        {
          name: "Laptop",
          slug: "laptop",
          description: "Laptop văn phòng và gaming",
        },
        {
          name: "PC Gaming",
          slug: "pc-gaming",
          description: "Máy tính để bàn gaming",
        },
        {
          name: "Linh kiện",
          slug: "linh-kien",
          description: "Linh kiện máy tính",
        },
        { name: "Phụ kiện", slug: "phu-kien", description: "Phụ kiện gaming" },
      ];

      let created = 0;
      for (const category of defaultCategories) {
        await executeQuery(
          `INSERT INTO categories (name, slug, description, is_active, created_at) 
           VALUES (?, ?, ?, 1, NOW())`,
          [category.name, category.slug, category.description],
        );
        created++;
      }

      res.json({
        success: true,
        message: `Created ${created} default categories`,
        data: { created },
      });
    } catch (error) {
      console.error("Ensure categories error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to ensure categories",
      });
    }
  },

  // Test featured products
  async testFeaturedProducts(req, res) {
    try {
      const products = await executeQuery(
        "SELECT id, name, price, sale_price, featured FROM products WHERE featured = 1 LIMIT 10",
      );

      res.json({
        success: true,
        data: {
          products,
          count: products.length,
        },
      });
    } catch (error) {
      console.error("Test featured products error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to test featured products",
      });
    }
  },

  // Add sample products
  async addSampleProducts(req, res) {
    try {
      const sampleProducts = [
        {
          name: "Laptop Gaming ASUS ROG Strix G15",
          slug: "laptop-gaming-asus-rog-strix-g15",
          description: "Laptop gaming mạnh mẽ với RTX 3060",
          price: 25000000,
          sale_price: 22000000,
          featured: 1,
          stock_quantity: 10,
        },
        {
          name: "PC Gaming Intel Core i7",
          slug: "pc-gaming-intel-core-i7",
          description: "PC gaming hiệu năng cao",
          price: 30000000,
          sale_price: 28000000,
          featured: 1,
          stock_quantity: 5,
        },
        {
          name: "Chuột Gaming Logitech G Pro X",
          slug: "chuot-gaming-logitech-g-pro-x",
          description: "Chuột gaming chuyên nghiệp",
          price: 2500000,
          featured: 0,
          stock_quantity: 20,
        },
      ];

      let created = 0;
      for (const product of sampleProducts) {
        // Check if product already exists
        const existing = await executeQuery(
          "SELECT id FROM products WHERE slug = ?",
          [product.slug],
        );

        if (existing.length === 0) {
          await executeQuery(
            `INSERT INTO products 
             (name, slug, description, price, sale_price, featured, stock_quantity, status, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 'active', NOW())`,
            [
              product.name,
              product.slug,
              product.description,
              product.price,
              product.sale_price,
              product.featured,
              product.stock_quantity,
            ],
          );
          created++;
        }
      }

      res.json({
        success: true,
        message: `Created ${created} sample products`,
        data: { created, total: sampleProducts.length },
      });
    } catch (error) {
      console.error("Add sample products error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to add sample products",
      });
    }
  },

  // Add sample reviews
  async addSampleReviews(req, res) {
    try {
      // Get products first
      const products = await executeQuery("SELECT id FROM products LIMIT 5");

      if (products.length === 0) {
        return res.json({
          success: false,
          message: "No products found to add reviews to",
        });
      }

      const sampleReviews = [
        {
          rating: 5,
          comment: "Sản phẩm tuyệt vời, chất lượng cao!",
          reviewer_name: "Nguyễn Văn A",
        },
        {
          rating: 4,
          comment: "Tốt, giá cả hợp lý",
          reviewer_name: "Trần Thị B",
        },
        {
          rating: 5,
          comment: "Rất hài lòng với sản phẩm",
          reviewer_name: "Lê Văn C",
        },
      ];

      let created = 0;
      for (const product of products) {
        for (const review of sampleReviews) {
          await executeQuery(
            `INSERT INTO reviews 
             (product_id, rating, comment, reviewer_name, created_at) 
             VALUES (?, ?, ?, ?, NOW())`,
            [product.id, review.rating, review.comment, review.reviewer_name],
          );
          created++;
        }
      }

      res.json({
        success: true,
        message: `Created ${created} sample reviews`,
        data: { created },
      });
    } catch (error) {
      console.error("Add sample reviews error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to add sample reviews",
      });
    }
  },

  // Create test order
  async createTestOrder(req, res) {
    try {
      // Get a test user or create one
      let testUser = await executeQuery(
        "SELECT id FROM users WHERE email = 'test@example.com'",
      );

      if (testUser.length === 0) {
        const hashedPassword = await bcrypt.hash("password123", 12);
        const userResult = await executeQuery(
          `INSERT INTO users (email, password, full_name, role, is_active, created_at) 
           VALUES ('test@example.com', ?, 'Test User', 'user', 1, NOW())`,
          [hashedPassword],
        );
        testUser = [{ id: userResult.insertId }];
      }

      // Create test order
      const orderResult = await executeQuery(
        `INSERT INTO orders 
         (user_id, status, total_amount, shipping_fee, customer_name, customer_email, customer_phone, shipping_address, created_at) 
         VALUES (?, 'pending', 500000, 30000, 'Test Customer', 'test@example.com', '0123456789', '123 Test Street, Hanoi', NOW())`,
        [testUser[0].id],
      );

      res.json({
        success: true,
        message: "Test order created successfully",
        data: { order_id: orderResult.insertId },
      });
    } catch (error) {
      console.error("Create test order error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create test order",
      });
    }
  },

  // Complete test order workflow
  async createCompleteTestOrder(req, res) {
    try {
      // Get a test user or create one
      let testUser = await executeQuery(
        "SELECT id FROM users WHERE email = 'test@example.com'",
      );

      if (testUser.length === 0) {
        const hashedPassword = await bcrypt.hash("password123", 12);
        const userResult = await executeQuery(
          `INSERT INTO users (email, password, full_name, role, is_active, created_at)
           VALUES ('test@example.com', ?, 'Test User', 'user', 1, NOW())`,
          [hashedPassword],
        );
        testUser = [{ id: userResult.insertId }];
      }

      // Get some products to add to order
      const products = await executeQuery(
        "SELECT id, name, sku, price, sale_price, images FROM products WHERE status = 'active' LIMIT 3",
      );

      if (products.length === 0) {
        return res.json({
          success: false,
          message: "No products found. Please add products first.",
        });
      }

      // Generate order number
      const timestamp = Date.now().toString();
      const random = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0");
      const orderNumber = `HD${timestamp.slice(-6)}${random}`;

      // Calculate total
      let totalAmount = 0;
      const orderItems = products.map((product, index) => {
        const price = product.sale_price || product.price;
        const quantity = index + 1; // Different quantities
        const total = price * quantity;
        totalAmount += total;

        return {
          product_id: product.id,
          product_name: product.name,
          product_sku: product.sku,
          quantity: quantity,
          unit_price: price,
          total_price: total,
          product_image: (() => {
            try {
              return product.images ? JSON.parse(product.images)[0] : null;
            } catch (e) {
              return product.images || null;
            }
          })(),
        };
      });

      // Create test order
      const orderResult = await executeQuery(
        `INSERT INTO orders
         (order_number, user_id, status, payment_method, total_amount, customer_name, customer_email, customer_phone, shipping_address, created_at)
         VALUES (?, ?, 'pending', 'cod', ?, 'Test Customer', 'test@example.com', '0123456789', '123 Test Street, Hanoi, Vietnam', NOW())`,
        [orderNumber, testUser[0].id, totalAmount],
      );

      const orderId = orderResult.insertId;

      // Add order items
      for (const item of orderItems) {
        await executeQuery(
          `INSERT INTO order_items
           (order_id, product_id, product_name, product_sku, quantity, unit_price, total_price, product_image)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            item.product_id,
            item.product_name,
            item.product_sku,
            item.quantity,
            item.unit_price,
            item.total_price,
            item.product_image,
          ],
        );
      }

      // Create status history
      await executeQuery(
        "INSERT INTO order_status_history (order_id, status, comment) VALUES (?, 'pending', 'Test order created')",
        [orderId],
      );

      res.json({
        success: true,
        message: "Complete test order created successfully",
        data: {
          order_id: orderId,
          order_number: orderNumber,
          total_amount: totalAmount,
          items_count: orderItems.length,
        },
      });
    } catch (error) {
      console.error("Complete test order error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create complete test order",
      });
    }
  },

  // Test cart functionality
  async testCart(req, res) {
    try {
      // Simulate cart operations
      const cartData = {
        session_id: "test_session_123",
        items: [
          {
            product_id: 1,
            quantity: 2,
            price: 25000000,
          },
          {
            product_id: 2,
            quantity: 1,
            price: 30000000,
          },
        ],
        total: 80000000,
      };

      res.json({
        success: true,
        data: cartData,
      });
    } catch (error) {
      console.error("Test cart error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to test cart",
      });
    }
  },

  // Reset database (dangerous - only for development)
  async resetDatabase(req, res) {
    try {
      if (process.env.NODE_ENV === "production") {
        return res.status(403).json({
          success: false,
          message: "Database reset is not allowed in production",
        });
      }

      // Clear main tables
      await executeQuery("DELETE FROM order_items");
      await executeQuery("DELETE FROM orders");
      await executeQuery("DELETE FROM reviews");
      await executeQuery("DELETE FROM products");
      await executeQuery("DELETE FROM categories");
      await executeQuery("DELETE FROM users WHERE role != 'admin'");

      res.json({
        success: true,
        message: "Database reset completed (kept admin users)",
      });
    } catch (error) {
      console.error("Reset database error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to reset database",
      });
    }
  },

  // Test order update
  async testOrderUpdate(req, res) {
    try {
      const { orderId, status } = req.body;

      if (!orderId || !status) {
        return res.status(400).json({
          success: false,
          message: "Order ID and status are required",
        });
      }

      const validStatuses = [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status",
        });
      }

      // Update order status
      await executeQuery(
        "UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [status, parseInt(orderId)],
      );

      res.json({
        success: true,
        message: "Order updated successfully",
      });
    } catch (error) {
      console.error("Test order update error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  },
};
