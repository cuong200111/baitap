import express from "express";
import { executeQuery } from "../database/connection.js";

const router = express.Router();

// Debug routes for development

// Check database tables
router.get("/tables", async (req, res) => {
  try {
    const result = await executeQuery("SHOW TABLES");
    res.json({
      success: true,
      message: "Database tables retrieved",
      data: result,
    });
  } catch (error) {
    console.error("Debug tables error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve tables",
      error: error.message,
    });
  }
});

// Check database connection
router.get("/db-status", async (req, res) => {
  try {
    const result = await executeQuery("SELECT CONNECTION_ID() as connection_id, NOW() as current_time");
    res.json({
      success: true,
      message: "Database connection status",
      data: result[0],
    });
  } catch (error) {
    console.error("Debug db-status error:", error);
    res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message,
    });
  }
});

// System info
router.get("/system", (req, res) => {
  try {
    res.json({
      success: true,
      message: "System information",
      data: {
        node_version: process.version,
        platform: process.platform,
        uptime: process.uptime(),
        memory_usage: process.memoryUsage(),
        env: process.env.NODE_ENV,
      },
    });
  } catch (error) {
    console.error("Debug system error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get system info",
      error: error.message,
    });
  }
});

// Create test order (debug endpoint)
router.post("/create-test-order-complete", async (req, res) => {
  try {
    // Generate test order number
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
    const orderNumber = `HD${timestamp.slice(-6)}${random}`;

    // Create test order without needing real products or database
    const testOrder = {
      id: Math.floor(Math.random() * 10000),
      order_number: orderNumber,
      user_id: 1,
      customer_name: "Test Customer",
      customer_email: "test@example.com",
      customer_phone: "0123456789",
      status: "delivered",
      payment_method: "cod",
      total_amount: 120000,
      billing_address: "123 Test Street, Test City",
      shipping_address: "123 Test Street, Test City",
      notes: "Test order created by debug endpoint",
      created_at: new Date().toISOString(),
      items: [
        {
          id: 1,
          product_name: "Test Product 1",
          product_sku: "TEST001",
          quantity: 1,
          unit_price: 100000,
          total_price: 100000,
          product_image: "placeholder.svg"
        },
        {
          id: 2,
          product_name: "Test Product 2",
          product_sku: "TEST002",
          quantity: 1,
          unit_price: 20000,
          total_price: 20000,
          product_image: "placeholder.svg"
        }
      ]
    };

    // Try to insert into database if available, otherwise just return mock data
    try {
      await executeQuery(
        `INSERT INTO orders (
          order_number, user_id, status, payment_method, total_amount,
          billing_address, shipping_address, customer_name, customer_email, customer_phone, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderNumber, 1, "delivered", "cod", 120000,
          testOrder.billing_address, testOrder.shipping_address,
          testOrder.customer_name, testOrder.customer_email, testOrder.customer_phone,
          testOrder.notes
        ]
      );
    } catch (dbError) {
      console.log("Database not available, returning mock order:", dbError.message);
    }

    res.json({
      success: true,
      message: "Test order created successfully",
      data: testOrder,
    });
  } catch (error) {
    console.error("Create test order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create test order",
      error: error.message,
    });
  }
});

// Reset auth debug endpoint
router.post("/auth", async (req, res) => {
  try {
    res.json({
      success: true,
      message: "Debug auth reset - functionality not implemented yet",
      data: {
        note: "This is a placeholder debug endpoint for auth reset"
      }
    });
  } catch (error) {
    console.error("Debug auth error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reset auth",
      error: error.message,
    });
  }
});

export default router;
