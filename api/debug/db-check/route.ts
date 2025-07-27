import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    // Check orders count
    const ordersCount = executeQuery("SELECT COUNT(*) as count FROM orders");
    const orderItemsCount = executeQuery(
      "SELECT COUNT(*) as count FROM order_items",
    );
    const usersCount = executeQuery("SELECT COUNT(*) as count FROM users");

    // Get recent orders
    const recentOrders = executeQuery(
      "SELECT id, order_number, user_id, customer_name, customer_email, status, total_amount, created_at FROM orders ORDER BY created_at DESC LIMIT 10",
    );

    // Get recent order items
    const recentOrderItems = executeQuery(
      "SELECT oi.id, oi.order_id, oi.product_name, oi.quantity, oi.price, oi.total FROM order_items oi ORDER BY oi.id DESC LIMIT 10",
    );

    return NextResponse.json({
      success: true,
      data: {
        counts: {
          orders: ordersCount[0]?.count || 0,
          order_items: orderItemsCount[0]?.count || 0,
          users: usersCount[0]?.count || 0,
        },
        recent_orders: recentOrders,
        recent_order_items: recentOrderItems,
      },
    });
  } catch (error) {
    console.error("DB check error:", error);
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
