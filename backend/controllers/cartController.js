import { executeQuery } from "../database/connection.js";

export const cartController = {
  // Get cart items
  async getCart(req, res) {
    try {
      const { session_id, user_id } = req.query;

      if (!session_id && !user_id) {
        return res.status(400).json({
          success: false,
          message: "Session ID or User ID is required",
        });
      }

      let query = `
        SELECT 
          c.id,
          c.product_id,
          c.quantity,
          c.created_at,
          p.name as product_name,
          p.slug as product_slug,
          p.price,
          p.sale_price,
          p.images,
          p.stock_quantity,
          p.status as product_status
        FROM cart_items c
        JOIN products p ON c.product_id = p.id
        WHERE 1=1
      `;
      let params = [];

      if (user_id) {
        query += " AND c.user_id = ?";
        params.push(user_id);
      } else {
        query += " AND c.session_id = ?";
        params.push(session_id);
      }

      query += " ORDER BY c.created_at DESC";

      const cartItems = await executeQuery(query, params);

      // Process cart items
      const processedItems = cartItems.map(item => ({
        ...item,
        images: item.images ? JSON.parse(item.images) : [],
        final_price: item.sale_price || item.price,
        total_price: (item.sale_price || item.price) * item.quantity,
      }));

      // Calculate totals
      const subtotal = processedItems.reduce((sum, item) => sum + item.total_price, 0);
      const itemCount = processedItems.reduce((sum, item) => sum + item.quantity, 0);

      res.json({
        success: true,
        data: {
          items: processedItems,
          summary: {
            item_count: itemCount,
            subtotal: subtotal,
            shipping_fee: 0, // Will be calculated based on location
            total: subtotal,
          },
        },
      });
    } catch (error) {
      console.error("Get cart error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get cart",
      });
    }
  },

  // Add item to cart
  async addToCart(req, res) {
    try {
      const { product_id, quantity = 1, session_id, user_id } = req.body;

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

      // Check if product exists and is available
      const product = await executeQuery(
        "SELECT id, name, price, sale_price, stock_quantity, status FROM products WHERE id = ?",
        [product_id]
      );

      if (!product.length) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      const productData = product[0];

      if (productData.status !== "active") {
        return res.status(400).json({
          success: false,
          message: "Product is not available",
        });
      }

      if (productData.stock_quantity < quantity) {
        return res.status(400).json({
          success: false,
          message: "Insufficient stock",
        });
      }

      // Check if item already exists in cart
      let existingQuery = "SELECT id, quantity FROM cart_items WHERE product_id = ?";
      let existingParams = [product_id];

      if (user_id) {
        existingQuery += " AND user_id = ?";
        existingParams.push(user_id);
      } else {
        existingQuery += " AND session_id = ?";
        existingParams.push(session_id);
      }

      const existingItems = await executeQuery(existingQuery, existingParams);

      if (existingItems.length > 0) {
        // Update existing item
        const existingItem = existingItems[0];
        const newQuantity = existingItem.quantity + quantity;

        if (newQuantity > productData.stock_quantity) {
          return res.status(400).json({
            success: false,
            message: "Total quantity exceeds available stock",
          });
        }

        await executeQuery(
          "UPDATE cart_items SET quantity = ?, updated_at = NOW() WHERE id = ?",
          [newQuantity, existingItem.id]
        );

        res.json({
          success: true,
          message: "Cart updated successfully",
          data: { 
            cart_item_id: existingItem.id,
            quantity: newQuantity,
            action: "updated"
          },
        });
      } else {
        // Add new item
        const result = await executeQuery(
          `INSERT INTO cart_items (product_id, quantity, session_id, user_id, created_at) 
           VALUES (?, ?, ?, ?, NOW())`,
          [product_id, quantity, session_id || null, user_id || null]
        );

        res.json({
          success: true,
          message: "Product added to cart successfully",
          data: { 
            cart_item_id: result.insertId,
            quantity: quantity,
            action: "added"
          },
        });
      }
    } catch (error) {
      console.error("Add to cart error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to add product to cart",
      });
    }
  },

  // Update cart item quantity
  async updateCartItem(req, res) {
    try {
      const { id } = req.params;
      const { quantity } = req.body;

      if (!quantity || quantity < 1) {
        return res.status(400).json({
          success: false,
          message: "Quantity must be at least 1",
        });
      }

      // Get cart item with product info
      const cartItem = await executeQuery(
        `SELECT c.id, c.product_id, c.quantity, p.stock_quantity, p.status
         FROM cart_items c
         JOIN products p ON c.product_id = p.id
         WHERE c.id = ?`,
        [id]
      );

      if (!cartItem.length) {
        return res.status(404).json({
          success: false,
          message: "Cart item not found",
        });
      }

      const item = cartItem[0];

      if (item.status !== "active") {
        return res.status(400).json({
          success: false,
          message: "Product is no longer available",
        });
      }

      if (quantity > item.stock_quantity) {
        return res.status(400).json({
          success: false,
          message: "Quantity exceeds available stock",
        });
      }

      // Update quantity
      await executeQuery(
        "UPDATE cart_items SET quantity = ?, updated_at = NOW() WHERE id = ?",
        [quantity, id]
      );

      res.json({
        success: true,
        message: "Cart item updated successfully",
        data: { cart_item_id: id, quantity },
      });
    } catch (error) {
      console.error("Update cart item error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update cart item",
      });
    }
  },

  // Remove item from cart
  async removeFromCart(req, res) {
    try {
      const { id } = req.params;

      const result = await executeQuery("DELETE FROM cart_items WHERE id = ?", [id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Cart item not found",
        });
      }

      res.json({
        success: true,
        message: "Product removed from cart successfully",
      });
    } catch (error) {
      console.error("Remove from cart error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to remove product from cart",
      });
    }
  },

  // Clear cart
  async clearCart(req, res) {
    try {
      const { session_id, user_id } = req.body;

      if (!session_id && !user_id) {
        return res.status(400).json({
          success: false,
          message: "Session ID or User ID is required",
        });
      }

      let query = "DELETE FROM cart_items WHERE 1=1";
      let params = [];

      if (user_id) {
        query += " AND user_id = ?";
        params.push(user_id);
      } else {
        query += " AND session_id = ?";
        params.push(session_id);
      }

      await executeQuery(query, params);

      res.json({
        success: true,
        message: "Cart cleared successfully",
      });
    } catch (error) {
      console.error("Clear cart error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to clear cart",
      });
    }
  },

  // Migrate cart from session to user (when user logs in)
  async migrateCart(req, res) {
    try {
      const { session_id, user_id } = req.body;

      if (!session_id || !user_id) {
        return res.status(400).json({
          success: false,
          message: "Session ID and User ID are required",
        });
      }

      // Get session cart items
      const sessionItems = await executeQuery(
        "SELECT product_id, quantity FROM cart_items WHERE session_id = ?",
        [session_id]
      );

      if (sessionItems.length === 0) {
        return res.json({
          success: true,
          message: "No items to migrate",
          data: { migrated: 0 },
        });
      }

      let migrated = 0;

      for (const item of sessionItems) {
        // Check if user already has this product in cart
        const existingUserItem = await executeQuery(
          "SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?",
          [user_id, item.product_id]
        );

        if (existingUserItem.length > 0) {
          // Update existing user cart item
          const newQuantity = existingUserItem[0].quantity + item.quantity;
          await executeQuery(
            "UPDATE cart_items SET quantity = ?, updated_at = NOW() WHERE id = ?",
            [newQuantity, existingUserItem[0].id]
          );
        } else {
          // Create new user cart item
          await executeQuery(
            "INSERT INTO cart_items (user_id, product_id, quantity, created_at) VALUES (?, ?, ?, NOW())",
            [user_id, item.product_id, item.quantity]
          );
        }
        migrated++;
      }

      // Clear session cart
      await executeQuery("DELETE FROM cart_items WHERE session_id = ?", [session_id]);

      res.json({
        success: true,
        message: `Successfully migrated ${migrated} cart items`,
        data: { migrated },
      });
    } catch (error) {
      console.error("Migrate cart error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to migrate cart",
      });
    }
  },

  // Get cart count
  async getCartCount(req, res) {
    try {
      const { session_id, user_id } = req.query;

      if (!session_id && !user_id) {
        return res.status(400).json({
          success: false,
          message: "Session ID or User ID is required",
        });
      }

      let query = "SELECT SUM(quantity) as total_items FROM cart_items WHERE 1=1";
      let params = [];

      if (user_id) {
        query += " AND user_id = ?";
        params.push(user_id);
      } else {
        query += " AND session_id = ?";
        params.push(session_id);
      }

      const result = await executeQuery(query, params);
      const totalItems = result[0]?.total_items || 0;

      res.json({
        success: true,
        data: { count: parseInt(totalItems) },
      });
    } catch (error) {
      console.error("Get cart count error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get cart count",
      });
    }
  },
};
