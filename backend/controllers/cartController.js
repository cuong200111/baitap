import { executeQuery } from "../database/connection.js";

export const cartController = {
  // Get cart items for user or session
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
          p.sku,
          p.price,
          p.sale_price,
          p.images,
          p.stock_quantity,
          p.status as product_status
        FROM cart_items c
        JOIN products p ON c.product_id = p.id
        WHERE p.status = 'active'
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

      // Check stock and remove items that exceed available stock
      const itemsToRemove = [];
      const validItems = [];

      for (const item of cartItems) {
        const availableStock = Math.max(0, parseInt(item.stock_quantity) || 0);
        const requestedQuantity = parseInt(item.quantity) || 0;

        if (requestedQuantity > availableStock) {
          // Mark for removal if no stock available or exceeds stock
          itemsToRemove.push({
            cart_id: item.id,
            product_name: item.product_name,
            requested: requestedQuantity,
            available: availableStock,
          });
        } else {
          // Keep items with sufficient stock
          validItems.push(item);
        }
      }

      // Remove items with insufficient stock
      if (itemsToRemove.length > 0) {
        console.log(
          `🗑️ Removing ${itemsToRemove.length} cart items with insufficient stock:`,
          itemsToRemove,
        );

        for (const item of itemsToRemove) {
          await executeQuery("DELETE FROM cart_items WHERE id = ?", [
            item.cart_id,
          ]);
        }
      }

      // Process remaining valid cart items
      const processedItems = validItems.map((item) => {
        const finalPrice = item.sale_price || item.price;
        const totalPrice = finalPrice * item.quantity;

        return {
          id: item.id,
          product_id: item.product_id,
          product_name: item.product_name,
          product_slug: item.product_slug,
          sku: item.sku,
          price: item.price,
          sale_price: item.sale_price,
          final_price: finalPrice,
          quantity: item.quantity,
          stock_quantity: item.stock_quantity,
          images: item.images ? JSON.parse(item.images) : [],
          total_price: totalPrice,
          created_at: item.created_at,
        };
      });

      // Calculate summary
      const itemCount = processedItems.reduce(
        (sum, item) => sum + item.quantity,
        0,
      );
      const subtotal = processedItems.reduce(
        (sum, item) => sum + item.total_price,
        0,
      );

      const response = {
        success: true,
        data: {
          items: processedItems,
          summary: {
            item_count: itemCount,
            subtotal: subtotal,
            shipping_fee: 0,
            total: subtotal,
          },
        },
      };

      // Include information about removed items if any
      if (itemsToRemove.length > 0) {
        response.removed_items = itemsToRemove;
        response.message = `${itemsToRemove.length} sản phẩm đã được tự động xóa khỏi giỏ hàng do không đủ số lượng trong kho.`;
      }

      res.json(response);
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

      // Check product exists and get stock info
      const productQuery =
        "SELECT id, name, price, sale_price, stock_quantity, status FROM products WHERE id = ?";
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
          message: `Không đủ số lượng trong kho. Còn lại: ${availableStock}, Yêu cầu: ${requestedQuantity}`,
          stock_status: "insufficient_stock",
          available_stock: availableStock,
          requested_quantity: requestedQuantity,
        });
      }

      // Check if item already exists in cart
      let existingQuery =
        "SELECT id, quantity FROM cart_items WHERE product_id = ?";
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
        const currentQuantity = Math.max(
          0,
          parseInt(existingItem.quantity) || 0,
        );
        const newQuantity = currentQuantity + requestedQuantity;

        // Check stock limits
        if (newQuantity > availableStock) {
          const maxCanAdd = Math.max(0, availableStock - currentQuantity);

          if (maxCanAdd === 0) {
            return res.status(400).json({
              success: false,
              message: `Không thể thêm thêm sản phẩm "${product.name}". Bạn đã có ${currentQuantity} trong giỏ hàng và kho chỉ còn ${availableStock} sản phẩm.`,
              stock_status: "cart_limit_reached",
              current_in_cart: currentQuantity,
              available_stock: availableStock,
              max_can_add: maxCanAdd,
            });
          } else {
            return res.status(400).json({
              success: false,
              message: `Không thể thêm ${requestedQuantity} sản phẩm. Bạn đã có ${currentQuantity} trong giỏ hàng, chỉ còn lại ${maxCanAdd} sản phẩm có thể thêm.`,
              stock_status: "insufficient_stock",
              current_in_cart: currentQuantity,
              available_stock: availableStock,
              max_can_add: maxCanAdd,
            });
          }
        }

        // Update quantity
        await executeQuery(
          "UPDATE cart_items SET quantity = ?, updated_at = NOW() WHERE id = ?",
          [newQuantity, existingItem.id],
        );

        res.json({
          success: true,
          message: "Cart updated successfully",
          data: {
            cart_item_id: existingItem.id,
            quantity: newQuantity,
            action: "updated",
          },
        });
      } else {
        // Add new item
        if (requestedQuantity > availableStock) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock. Available: ${availableStock}, Requested: ${requestedQuantity}`,
          });
        }

        const insertQuery = `
          INSERT INTO cart_items (product_id, quantity, session_id, user_id, created_at) 
          VALUES (?, ?, ?, ?, NOW())
        `;
        const result = await executeQuery(insertQuery, [
          product_id,
          requestedQuantity,
          session_id || null,
          user_id || null,
        ]);

        res.json({
          success: true,
          message: "Product added to cart successfully",
          data: {
            cart_item_id: result.insertId,
            quantity: requestedQuantity,
            action: "added",
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
      const cartItemQuery = `
        SELECT c.id, c.product_id, c.quantity, p.stock_quantity, p.status, p.name
        FROM cart_items c
        JOIN products p ON c.product_id = p.id
        WHERE c.id = ?
      `;
      const cartItems = await executeQuery(cartItemQuery, [id]);

      if (!cartItems.length) {
        return res.status(404).json({
          success: false,
          message: "Cart item not found",
        });
      }

      const item = cartItems[0];

      if (item.status !== "active") {
        return res.status(400).json({
          success: false,
          message: "Product is no longer available",
        });
      }

      const availableStock = Math.max(0, parseInt(item.stock_quantity) || 0);
      const requestedQuantity = Math.max(1, parseInt(quantity) || 1);

      if (requestedQuantity > availableStock) {
        return res.status(400).json({
          success: false,
          message: `Quantity exceeds available stock. Available: ${availableStock}`,
        });
      }

      // Update quantity
      await executeQuery(
        "UPDATE cart_items SET quantity = ?, updated_at = NOW() WHERE id = ?",
        [requestedQuantity, id],
      );

      res.json({
        success: true,
        message: "Cart item updated successfully",
        data: { cart_item_id: id, quantity: requestedQuantity },
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

      const result = await executeQuery("DELETE FROM cart_items WHERE id = ?", [
        id,
      ]);

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

      let query = "DELETE FROM cart_items WHERE ";
      let params = [];

      if (user_id) {
        query += "user_id = ?";
        params.push(user_id);
      } else {
        query += "session_id = ?";
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
        [session_id],
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
        const existingUserItems = await executeQuery(
          "SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?",
          [user_id, item.product_id],
        );

        if (existingUserItems.length > 0) {
          // Update existing user cart item
          const newQuantity = existingUserItems[0].quantity + item.quantity;
          await executeQuery(
            "UPDATE cart_items SET quantity = ?, updated_at = NOW() WHERE id = ?",
            [newQuantity, existingUserItems[0].id],
          );
        } else {
          // Create new user cart item
          await executeQuery(
            "INSERT INTO cart_items (user_id, product_id, quantity, created_at) VALUES (?, ?, ?, NOW())",
            [user_id, item.product_id, item.quantity],
          );
        }
        migrated++;
      }

      // Clear session cart
      await executeQuery("DELETE FROM cart_items WHERE session_id = ?", [
        session_id,
      ]);

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

      let query = "SELECT SUM(quantity) as total_items FROM cart_items WHERE ";
      let params = [];

      if (user_id) {
        query += "user_id = ?";
        params.push(user_id);
      } else {
        query += "session_id = ?";
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
