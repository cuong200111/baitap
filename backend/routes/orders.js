import express from "express";
import { body, validationResult, param, query } from "express-validator";
import { executeQuery } from "../database/connection.js";
import {
  authenticateToken,
  requireAdmin,
  optionalAuth,
} from "../middleware/auth.js";

const router = express.Router();

// Generate order number
const generateOrderNumber = () => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `HD${timestamp.slice(-6)}${random}`;
};

// Helper function to safely parse product images
const safeParseImages = (images) => {
  try {
    return images ? JSON.parse(images)[0] : null;
  } catch (e) {
    return images || null;
  }
};

// Get orders (Admin: all orders, User: own orders)
router.get("/", authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      payment_status,
      search,
      start_date,
      end_date,
      user_id,
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const whereConditions = [];
    const queryParams = [];

    // User can only see their own orders, admin can see all
    if (req.user.role !== "admin") {
      whereConditions.push("o.user_id = ?");
      queryParams.push(req.user.id);
    } else if (user_id) {
      whereConditions.push("o.user_id = ?");
      queryParams.push(user_id);
    }

    // Status filter
    if (status) {
      whereConditions.push("o.status = ?");
      queryParams.push(status);
    }

    // Payment status filter
    if (payment_status) {
      whereConditions.push("o.payment_status = ?");
      queryParams.push(payment_status);
    }

    // Search by order number or customer name (including guest orders)
    if (search) {
      whereConditions.push(
        "(o.order_number LIKE ? OR COALESCE(u.full_name, o.customer_name) LIKE ? OR COALESCE(u.email, o.customer_email) LIKE ?)",
      );
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    // Date range filter
    if (start_date) {
      whereConditions.push("DATE(o.created_at) >= ?");
      queryParams.push(start_date);
    }

    if (end_date) {
      whereConditions.push("DATE(o.created_at) <= ?");
      queryParams.push(end_date);
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ${whereClause}
    `;
    const countResult = await executeQuery(countQuery, queryParams);
    const totalOrders = countResult[0].total;

    // Get orders (including guest orders)
    const ordersQuery = `
      SELECT
        o.*,
        COALESCE(u.full_name, o.customer_name) as customer_name,
        COALESCE(u.email, o.customer_email) as customer_email,
        o.customer_phone,
        COUNT(oi.id) as items_count
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      ${whereClause}
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const orders = await executeQuery(ordersQuery, [
      ...queryParams,
      parseInt(limit),
      offset,
    ]);

    // Get order items for each order
    const formattedOrders = [];
    for (const order of orders) {
      const orderItems = await executeQuery(
        `
        SELECT
          oi.*,
          p.images as product_images
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
        ORDER BY oi.created_at ASC
      `,
        [order.id],
      );

      // Format items with images
      const formattedItems = orderItems.map((item) => ({
        ...item,
        images: (() => {
          try {
            // Check if product_images exists and parse it
            if (item.product_images) {
              return JSON.parse(item.product_images);
            }
            // Fallback to product_image if it exists
            return item.product_image ? [item.product_image] : [];
          } catch (e) {
            console.warn('Error parsing product images:', e);
            return item.product_image ? [item.product_image] : [];
          }
        })(),
        // Keep original fields for compatibility
        product_name: item.product_name,
        product_sku: item.product_sku,
        quantity: item.quantity,
        price: item.unit_price,
        total: item.total_price,
      }));

      formattedOrders.push({
        ...order,
        billing_address: order.billing_address,
        shipping_address: order.shipping_address,
        items: formattedItems,
      });
    }

    const totalPages = Math.ceil(totalOrders / parseInt(limit));

    console.log(`📋 Orders API: Returning ${formattedOrders.length} orders, total: ${totalOrders}`);

    res.json({
      success: true,
      data: {
        orders: formattedOrders,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_orders: totalOrders,
          has_next: parseInt(page) < totalPages,
          has_prev: parseInt(page) > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get order by ID or order number
router.get("/:identifier", authenticateToken, async (req, res) => {
  try {
    const { identifier } = req.params;

    let whereCondition = "(o.id = ? OR o.order_number = ?)";
    let queryParams = [identifier, identifier];

    // User can only see their own orders
    if (req.user.role !== "admin") {
      whereCondition += " AND o.user_id = ?";
      queryParams.push(req.user.id);
    }

    // Get order
    const orderQuery = `
      SELECT 
        o.*,
        u.full_name as customer_name,
        u.email as customer_email,
        u.phone as customer_phone
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE ${whereCondition}
    `;

    const orders = await executeQuery(orderQuery, queryParams);

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const order = orders[0];

    // Get order items
    const orderItems = await executeQuery(
      `
      SELECT 
        oi.*,
        p.slug as product_slug,
        p.images as product_images
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
      ORDER BY oi.created_at ASC
    `,
      [order.id],
    );

    // Get order status history
    const statusHistory = await executeQuery(
      `
      SELECT 
        osh.*,
        u.full_name as updated_by_name
      FROM order_status_history osh
      LEFT JOIN users u ON osh.created_by = u.id
      WHERE osh.order_id = ?
      ORDER BY osh.created_at ASC
    `,
      [order.id],
    );

    // Format response
    const formattedOrder = {
      ...order,
      billing_address: order.billing_address,
      shipping_address: order.shipping_address,
      items: orderItems.map((item) => ({
        ...item,
        product_images: (() => {
          try {
            return item.product_images ? JSON.parse(item.product_images) : [];
          } catch (e) {
            return [];
          }
        })(),
      })),
      status_history: statusHistory,
    };

    res.json({
      success: true,
      data: formattedOrder,
    });
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Create new order
router.post(
  "/",
  authenticateToken,
  [
    body("items").isArray({ min: 1 }).withMessage("Order items required"),
    body("items.*.product_id")
      .isInt({ min: 1 })
      .withMessage("Valid product ID required"),
    body("items.*.quantity")
      .isInt({ min: 1 })
      .withMessage("Valid quantity required"),
    body("shipping_address")
      .trim()
      .notEmpty()
      .withMessage("Shipping address required"),
    body("billing_address")
      .optional()
      .isString()
      .withMessage("Invalid billing address"),
    body("payment_method")
      .isIn(["cod", "bank_transfer", "credit_card", "e_wallet"])
      .withMessage("Invalid payment method"),
    body("shipping_method").optional().isString(),
    body("notes").optional().isString(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const {
        items,
        shipping_address,
        billing_address,
        payment_method,
        notes,
      } = req.body;

      // Start transaction
      const connection = await executeQuery("START TRANSACTION");

      try {
        // Validate products and calculate totals
        let subtotal = 0;
        const validatedItems = [];

        for (const item of items) {
          const products = await executeQuery(
            "SELECT id, name, sku, price, sale_price, stock_quantity, manage_stock, images FROM products WHERE id = ? AND status = 'active'",
            [item.product_id],
          );

          if (products.length === 0) {
            throw new Error(`Product with ID ${item.product_id} not found`);
          }

          const product = products[0];
          const finalPrice = product.sale_price || product.price;

          // Check stock
          if (product.manage_stock && product.stock_quantity < item.quantity) {
            throw new Error(
              `Insufficient stock for product ${product.name}. Available: ${product.stock_quantity}, Requested: ${item.quantity}`,
            );
          }

          const totalPrice = finalPrice * item.quantity;
          subtotal += totalPrice;

          validatedItems.push({
            product_id: product.id,
            product_name: product.name,
            product_sku: product.sku,
            quantity: item.quantity,
            unit_price: finalPrice,
            total_price: totalPrice,
            product_image: safeParseImages(product.images),
          });

          // Update stock if managed
          if (product.manage_stock) {
            await executeQuery(
              "UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?",
              [item.quantity, product.id],
            );
          }
        }

        const totalAmount = subtotal;

        // Generate order number
        const orderNumber = generateOrderNumber();

        // Create order
        const orderResult = await executeQuery(
          `
          INSERT INTO orders (
            order_number, user_id, status, payment_method, total_amount,
            billing_address, shipping_address, customer_name, customer_email, customer_phone, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
          [
            orderNumber,
            req.user.id,
            "pending",
            payment_method,
            totalAmount,
            billing_address || shipping_address,
            shipping_address,
            req.user.full_name,
            req.user.email,
            req.user.phone || "",
            notes || null,
          ],
        );

        const orderId = orderResult.insertId;

        // Create order items
        for (const item of validatedItems) {
          await executeQuery(
            `
            INSERT INTO order_items (
              order_id, product_id, product_name, product_sku,
              quantity, unit_price, total_price, product_image
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `,
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

        // Create initial status history
        await executeQuery(
          "INSERT INTO order_status_history (order_id, status, comment, created_by) VALUES (?, ?, ?, ?)",
          [orderId, "pending", "Order created", req.user.id],
        );

        // Commit transaction
        await executeQuery("COMMIT");

        // Get created order
        const newOrder = await executeQuery(
          "SELECT * FROM orders WHERE id = ?",
          [orderId],
        );

        res.status(201).json({
          success: true,
          message: "Order created successfully",
          data: newOrder[0],
        });
      } catch (error) {
        // Rollback transaction
        await executeQuery("ROLLBACK");
        throw error;
      }
    } catch (error) {
      console.error("Create order error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to create order",
      });
    }
  },
);

// Update order (Admin only) - General route
router.put(
  "/:id",
  authenticateToken,
  requireAdmin,
  [
    param("id").isInt().withMessage("Invalid order ID"),
    body("status")
      .optional()
      .isIn([
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ])
      .withMessage("Invalid status"),
    body("payment_status")
      .optional()
      .isIn(["pending", "paid", "failed", "refunded"])
      .withMessage("Invalid payment status"),
    body("comment").optional().isString(),
    body("tracking_number").optional().isString(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const { status, payment_status, comment, tracking_number } = req.body;

      // Check if order exists
      const existingOrder = await executeQuery(
        "SELECT * FROM orders WHERE id = ?",
        [id],
      );

      if (existingOrder.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      const order = existingOrder[0];
      const updateFields = [];
      const updateValues = [];

      // Update status if provided
      if (status) {
        updateFields.push("status = ?");
        updateValues.push(status);

        if (status === "shipped" && tracking_number) {
          updateFields.push("tracking_number = ?", "shipped_at = NOW()");
          updateValues.push(tracking_number);
        }

        if (status === "delivered") {
          updateFields.push("delivered_at = NOW()");
        }

        // Add status history
        await executeQuery(
          "INSERT INTO order_status_history (order_id, status, comment, created_by) VALUES (?, ?, ?, ?)",
          [id, status, comment || null, req.user.id],
        );
      }

      // Update payment status if provided
      if (payment_status) {
        updateFields.push("payment_status = ?");
        updateValues.push(payment_status);

        // Add payment status history
        await executeQuery(
          "INSERT INTO order_status_history (order_id, status, comment, created_by) VALUES (?, ?, ?, ?)",
          [id, `payment_${payment_status}`, comment || null, req.user.id],
        );
      }

      if (updateFields.length > 0) {
        updateValues.push(id);
        await executeQuery(
          `UPDATE orders SET ${updateFields.join(", ")} WHERE id = ?`,
          updateValues,
        );
      }

      // Get updated order
      const updatedOrder = await executeQuery(
        "SELECT * FROM orders WHERE id = ?",
        [id],
      );

      res.json({
        success: true,
        message: "Order updated successfully",
        data: updatedOrder[0],
      });
    } catch (error) {
      console.error("Update order error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

// Update order status (Admin only) - Specific route
router.put(
  "/:id/status",
  authenticateToken,
  requireAdmin,
  [
    param("id").isInt().withMessage("Invalid order ID"),
    body("status")
      .isIn([
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ])
      .withMessage("Invalid status"),
    body("comment").optional().isString(),
    body("tracking_number").optional().isString(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const { status, comment, tracking_number } = req.body;

      // Check if order exists
      const existingOrder = await executeQuery(
        "SELECT * FROM orders WHERE id = ?",
        [id],
      );

      if (existingOrder.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      const order = existingOrder[0];

      // Update order
      const updateFields = ["status = ?"];
      const updateValues = [status];

      if (status === "shipped" && tracking_number) {
        updateFields.push("tracking_number = ?", "shipped_at = NOW()");
        updateValues.push(tracking_number);
      }

      if (status === "delivered") {
        updateFields.push("delivered_at = NOW()");
      }

      updateValues.push(id);

      await executeQuery(
        `UPDATE orders SET ${updateFields.join(", ")} WHERE id = ?`,
        updateValues,
      );

      // Add status history
      await executeQuery(
        "INSERT INTO order_status_history (order_id, status, comment, created_by) VALUES (?, ?, ?, ?)",
        [id, status, comment || null, req.user.id],
      );

      // Get updated order
      const updatedOrder = await executeQuery(
        "SELECT * FROM orders WHERE id = ?",
        [id],
      );

      res.json({
        success: true,
        message: "Order status updated successfully",
        data: updatedOrder[0],
      });
    } catch (error) {
      console.error("Update order status error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

// Update payment status (Admin only)
router.put(
  "/:id/payment-status",
  authenticateToken,
  requireAdmin,
  [
    param("id").isInt().withMessage("Invalid order ID"),
    body("payment_status")
      .isIn(["pending", "paid", "failed", "refunded"])
      .withMessage("Invalid payment status"),
    body("comment").optional().isString(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const { payment_status, comment } = req.body;

      // Update order
      await executeQuery("UPDATE orders SET payment_status = ? WHERE id = ?", [
        payment_status,
        id,
      ]);

      // Add status history
      await executeQuery(
        "INSERT INTO order_status_history (order_id, status, comment, created_by) VALUES (?, ?, ?, ?)",
        [id, `payment_${payment_status}`, comment || null, req.user.id],
      );

      res.json({
        success: true,
        message: "Payment status updated successfully",
      });
    } catch (error) {
      console.error("Update payment status error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

// Get order statistics (Admin only)
router.get(
  "/admin/statistics",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { period = "30" } = req.query;

      // Total orders
      const totalOrders = await executeQuery(
        "SELECT COUNT(*) as count FROM orders WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)",
        [period],
      );

      // Total revenue
      const totalRevenue = await executeQuery(
        "SELECT SUM(total_amount) as revenue FROM orders WHERE status != 'cancelled' AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)",
        [period],
      );

      // Orders by status
      const ordersByStatus = await executeQuery(
        `
      SELECT status, COUNT(*) as count
      FROM orders
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY status
    `,
        [period],
      );

      // Daily orders
      const dailyOrders = await executeQuery(
        `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as orders,
        SUM(total_amount) as revenue
      FROM orders
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `,
        [period],
      );

      res.json({
        success: true,
        data: {
          total_orders: totalOrders[0].count,
          total_revenue: totalRevenue[0].revenue || 0,
          orders_by_status: ordersByStatus,
          daily_orders: dailyOrders,
        },
      });
    } catch (error) {
      console.error("Get order statistics error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

// Cancel order
router.put(
  "/:id/cancel",
  authenticateToken,
  [
    param("id").isInt().withMessage("Invalid order ID"),
    body("reason").optional().isString(),
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      let whereCondition = "id = ?";
      let queryParams = [id];

      // User can only cancel their own orders
      if (req.user.role !== "admin") {
        whereCondition += " AND user_id = ?";
        queryParams.push(req.user.id);
      }

      // Check if order exists and can be cancelled
      const order = await executeQuery(
        `SELECT * FROM orders WHERE ${whereCondition}`,
        queryParams,
      );

      if (order.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      if (!["pending", "confirmed"].includes(order[0].status)) {
        return res.status(400).json({
          success: false,
          message: "Order cannot be cancelled",
        });
      }

      // Update order status
      await executeQuery(
        "UPDATE orders SET status = 'cancelled' WHERE id = ?",
        [id],
      );

      // Restore stock
      const orderItems = await executeQuery(
        "SELECT product_id, quantity FROM order_items WHERE order_id = ?",
        [id],
      );

      for (const item of orderItems) {
        await executeQuery(
          "UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ? AND manage_stock = true",
          [item.quantity, item.product_id],
        );
      }

      // Add status history
      await executeQuery(
        "INSERT INTO order_status_history (order_id, status, comment, created_by) VALUES (?, ?, ?, ?)",
        [id, "cancelled", reason || "Order cancelled", req.user.id],
      );

      res.json({
        success: true,
        message: "Order cancelled successfully",
      });
    } catch (error) {
      console.error("Cancel order error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

// Create guest order (no authentication required)
router.post(
  "/guest",
  [
    body("items").isArray({ min: 1 }).withMessage("Order items required"),
    body("items.*.product_id")
      .isInt({ min: 1 })
      .withMessage("Valid product ID required"),
    body("items.*.quantity")
      .isInt({ min: 1 })
      .withMessage("Valid quantity required"),
    body("customer_name")
      .trim()
      .notEmpty()
      .withMessage("Customer name required"),
    body("customer_email").isEmail().withMessage("Valid email required"),
    body("customer_phone")
      .trim()
      .notEmpty()
      .withMessage("Phone number required"),
    body("shipping_address")
      .trim()
      .notEmpty()
      .withMessage("Shipping address required"),
    body("billing_address").optional().isString(),
    body("notes").optional().isString(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const {
        items,
        customer_name,
        customer_email,
        customer_phone,
        shipping_address,
        billing_address,
        notes,
      } = req.body;

      // Start transaction
      await executeQuery("START TRANSACTION");

      try {
        // Validate products and calculate totals
        let subtotal = 0;
        const validatedItems = [];

        for (const item of items) {
          const products = await executeQuery(
            "SELECT id, name, sku, price, sale_price, stock_quantity, manage_stock, images FROM products WHERE id = ? AND status = 'active'",
            [item.product_id],
          );

          if (products.length === 0) {
            throw new Error(`Product with ID ${item.product_id} not found`);
          }

          const product = products[0];
          const finalPrice = item.price || product.sale_price || product.price;

          // Check stock
          if (product.manage_stock && product.stock_quantity < item.quantity) {
            throw new Error(
              `Insufficient stock for product ${product.name}. Available: ${product.stock_quantity}, Requested: ${item.quantity}`,
            );
          }

          const totalPrice = finalPrice * item.quantity;
          subtotal += totalPrice;

          validatedItems.push({
            product_id: product.id,
            product_name: product.name,
            product_sku: product.sku,
            quantity: item.quantity,
            unit_price: finalPrice,
            total_price: totalPrice,
            product_image: safeParseImages(product.images),
          });

          // Update stock if managed
          if (product.manage_stock) {
            await executeQuery(
              "UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?",
              [item.quantity, product.id],
            );
          }
        }

        const totalAmount = subtotal;

        // Generate order number
        const orderNumber = generateOrderNumber();

        // Create guest order (user_id = NULL)
        const orderResult = await executeQuery(
          `
          INSERT INTO orders (
            order_number, user_id, status, payment_method, total_amount,
            billing_address, shipping_address, customer_name, customer_email, customer_phone, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
          [
            orderNumber,
            null, // Guest order
            "pending",
            "cod", // Default to cash on delivery for guest orders
            totalAmount,
            billing_address || shipping_address,
            shipping_address,
            customer_name,
            customer_email,
            customer_phone,
            notes || null,
          ],
        );

        const orderId = orderResult.insertId;

        // Create order items
        for (const item of validatedItems) {
          await executeQuery(
            `
            INSERT INTO order_items (
              order_id, product_id, product_name, product_sku,
              quantity, unit_price, total_price, product_image
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `,
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

        // Create initial status history (no user ID for guest orders)
        await executeQuery(
          "INSERT INTO order_status_history (order_id, status, comment) VALUES (?, ?, ?)",
          [orderId, "pending", "Guest order created"],
        );

        // Commit transaction
        await executeQuery("COMMIT");

        // Get created order
        const newOrder = await executeQuery(
          "SELECT * FROM orders WHERE id = ?",
          [orderId],
        );

        res.status(201).json({
          success: true,
          message: "Guest order created successfully",
          data: {
            order: newOrder[0],
            order_number: newOrder[0].order_number,
          },
        });
      } catch (error) {
        // Rollback transaction
        await executeQuery("ROLLBACK");
        throw error;
      }
    } catch (error) {
      console.error("Create guest order error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to create guest order",
      });
    }
  },
);

export default router;
