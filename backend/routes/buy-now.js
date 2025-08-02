import express from "express";
import { executeQuery } from "../database/connection.js";

const router = express.Router();

// Create a temporary "buy now" session for direct checkout
router.post("/", async (req, res) => {
  try {
    const { product_id, quantity = 1, session_id, user_id } = req.body;

    // Validation
    if (!product_id) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    if (!session_id && !user_id) {
      return res.status(400).json({
        success: false,
        message: "Session ID or User ID is required",
      });
    }

    const requestedQuantity = Math.max(1, parseInt(quantity) || 1);

    // Check product exists and get info
    const productQuery = `
      SELECT id, name, slug, sku, price, sale_price, stock_quantity, status, images
      FROM products 
      WHERE id = ?
    `;
    const products = await executeQuery(productQuery, [product_id]);

    if (!products.length) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const product = products[0];

    if (product.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Product is not available",
      });
    }

    const availableStock = Math.max(0, parseInt(product.stock_quantity) || 0);

    // Check if product is out of stock
    if (availableStock === 0) {
      return res.status(400).json({
        success: false,
        message: `Sản phẩm "${product.name}" hiện đã hết hàng.`,
        stock_status: "out_of_stock",
        available_stock: 0,
      });
    }

    // Check if requested quantity exceeds available stock
    if (requestedQuantity > availableStock) {
      return res.status(400).json({
        success: false,
        message: `Không đủ số lượng trong kho cho sản phẩm "${product.name}". Còn lại: ${availableStock}, Yêu cầu: ${requestedQuantity}`,
        stock_status: "insufficient_stock",
        available_stock: availableStock,
        requested_quantity: requestedQuantity,
      });
    }

    // Calculate prices
    const finalPrice = product.sale_price || product.price;
    const totalPrice = finalPrice * requestedQuantity;

    // Create buy now session data
    const buyNowData = {
      product_id: product.id,
      product_name: product.name,
      product_slug: product.slug,
      sku: product.sku,
      price: product.price,
      sale_price: product.sale_price,
      final_price: finalPrice,
      quantity: requestedQuantity,
      stock_quantity: product.stock_quantity,
      images: product.images ? JSON.parse(product.images) : [],
      total_price: totalPrice,
    };

    // Generate buy now session ID
    const buyNowSessionId = `buynow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    res.json({
      success: true,
      message: "Buy now session created successfully",
      data: {
        buy_now_session_id: buyNowSessionId,
        item: buyNowData,
        summary: {
          item_count: requestedQuantity,
          subtotal: totalPrice,
          shipping_fee: 0,
          total: totalPrice,
        },
      },
    });
  } catch (error) {
    console.error("Buy now error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create buy now session",
    });
  }
});

// Get buy now session data
router.get("/:session_id", async (req, res) => {
  try {
    const { session_id } = req.params;

    if (!session_id || !session_id.startsWith("buynow_")) {
      return res.status(400).json({
        success: false,
        message: "Invalid buy now session ID",
      });
    }

    // In a real application, you would store this in a cache/database
    // For now, we'll validate the session format and return a placeholder
    res.status(404).json({
      success: false,
      message: "Buy now session expired or not found",
    });
  } catch (error) {
    console.error("Get buy now session error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get buy now session",
    });
  }
});

export default router;
