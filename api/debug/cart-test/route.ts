import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    // Check users
    const users = executeQuery(
      "SELECT id, email, full_name, role FROM users LIMIT 5",
    );

    // Check products
    const products = executeQuery(
      "SELECT id, name, sku, price, stock_quantity FROM products WHERE status = 'active' LIMIT 5",
    );

    // Check cart items
    const cartItems = executeQuery("SELECT * FROM cart");

    // Test adding a cart item for user 1 if it doesn't exist
    const existingCart = executeQuery(
      "SELECT * FROM cart WHERE user_id = 1 AND product_id = 1",
    );

    if (existingCart.length === 0 && products.length > 0) {
      executeQuery(
        "INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)",
        [1, products[0].id, 1],
      );
    }

    // Get updated cart items
    const updatedCartItems = executeQuery("SELECT * FROM cart");

    // Test cart API query
    const cartWithProductDetails = executeQuery(
      `
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
    `,
      [1],
    );

    return NextResponse.json({
      success: true,
      data: {
        users: users,
        products: products,
        cartItems: updatedCartItems,
        cartWithDetails: cartWithProductDetails,
        message: "Database state checked successfully",
      },
    });
  } catch (error) {
    console.error("Debug API error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error.message,
      },
      { status: 500 },
    );
  }
}
