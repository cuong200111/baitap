import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";

// Get cart items for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 },
      );
    }

    // Get cart items with product details
    const cartQuery = `
      SELECT 
        c.id,
        c.quantity,
        c.created_at,
        p.id as product_id,
        p.name as product_name,
        p.sku,
        p.price,
        p.sale_price,
        p.images,
        p.stock_quantity,
        p.status,
        CASE WHEN p.sale_price > 0 THEN p.sale_price ELSE p.price END as final_price
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ? AND p.status = 'active'
      ORDER BY c.created_at DESC
    `;

    const cartItems = executeQuery(cartQuery, [parseInt(userId)]);

    // Process cart items to parse images
    const processedItems = cartItems.map((item: any) => {
      let images = [];
      try {
        images = item.images ? JSON.parse(item.images) : [];
      } catch (e) {
        images = [];
      }

      return {
        ...item,
        images,
        total: item.final_price * item.quantity,
      };
    });

    // Calculate totals
    const subtotal = processedItems.reduce(
      (sum: number, item: any) => sum + item.total,
      0,
    );
    const itemCount = processedItems.reduce(
      (sum: number, item: any) => sum + item.quantity,
      0,
    );

    return NextResponse.json({
      success: true,
      data: {
        items: processedItems,
        summary: {
          itemCount,
          subtotal,
          total: subtotal, // Add shipping/tax calculation here if needed
        },
      },
    });
  } catch (error) {
    console.error("Cart API error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

// Add item to cart
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, product_id, quantity = 1 } = body;

    if (!user_id || !product_id) {
      return NextResponse.json(
        { success: false, message: "User ID and Product ID are required" },
        { status: 400 },
      );
    }

    // Check if product exists and is active
    const productCheck = executeQuery(
      "SELECT id, stock_quantity, status FROM products WHERE id = ?",
      [product_id],
    );

    if (!productCheck.length) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 },
      );
    }

    const product = productCheck[0];

    if (product.status !== "active") {
      return NextResponse.json(
        { success: false, message: "Product is not available" },
        { status: 400 },
      );
    }

    if (quantity > product.stock_quantity) {
      return NextResponse.json(
        { success: false, message: "Insufficient stock" },
        { status: 400 },
      );
    }

    // Check if item already exists in cart
    const existingItem = executeQuery(
      "SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ?",
      [user_id, product_id],
    );

    if (existingItem.length > 0) {
      // Update existing item
      const newQuantity = existingItem[0].quantity + quantity;

      if (newQuantity > product.stock_quantity) {
        return NextResponse.json(
          { success: false, message: "Insufficient stock" },
          { status: 400 },
        );
      }

      executeQuery(
        "UPDATE cart SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [newQuantity, existingItem[0].id],
      );
    } else {
      // Add new item
      executeQuery(
        "INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)",
        [user_id, product_id, quantity],
      );
    }

    return NextResponse.json({
      success: true,
      message: "Item added to cart successfully",
    });
  } catch (error) {
    console.error("Add to cart error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

// Update cart item quantity
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { cart_id, quantity } = body;

    if (!cart_id || quantity === undefined) {
      return NextResponse.json(
        { success: false, message: "Cart ID and quantity are required" },
        { status: 400 },
      );
    }

    if (quantity < 0) {
      return NextResponse.json(
        { success: false, message: "Quantity cannot be negative" },
        { status: 400 },
      );
    }

    // If quantity is 0, remove item
    if (quantity === 0) {
      executeQuery("DELETE FROM cart WHERE id = ?", [cart_id]);
      return NextResponse.json({
        success: true,
        message: "Item removed from cart",
      });
    }

    // Check stock before updating
    const cartItem = executeQuery(
      `
      SELECT c.*, p.stock_quantity, p.status 
      FROM cart c 
      JOIN products p ON c.product_id = p.id 
      WHERE c.id = ?
    `,
      [cart_id],
    );

    if (!cartItem.length) {
      return NextResponse.json(
        { success: false, message: "Cart item not found" },
        { status: 404 },
      );
    }

    if (quantity > cartItem[0].stock_quantity) {
      return NextResponse.json(
        { success: false, message: "Insufficient stock" },
        { status: 400 },
      );
    }

    executeQuery(
      "UPDATE cart SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [quantity, cart_id],
    );

    return NextResponse.json({
      success: true,
      message: "Cart updated successfully",
    });
  } catch (error) {
    console.error("Update cart error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

// Remove item from cart or clear all items
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cartId = searchParams.get("cart_id");

    // Check if this is a request to clear all items
    let body = null;
    try {
      body = await request.json();
    } catch (e) {
      // No body is fine for single item deletion
    }

    if (body && body.clear_all && body.user_id) {
      // Clear all items for user
      executeQuery("DELETE FROM cart WHERE user_id = ?", [body.user_id]);

      return NextResponse.json({
        success: true,
        message: "Cart cleared successfully",
      });
    } else if (cartId) {
      // Remove single item
      executeQuery("DELETE FROM cart WHERE id = ?", [parseInt(cartId)]);

      return NextResponse.json({
        success: true,
        message: "Item removed from cart",
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Cart ID or clear_all with user_id is required",
        },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("Remove from cart error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
