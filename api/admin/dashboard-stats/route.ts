import { NextRequest, NextResponse } from "next/server";
import Database from "better-sqlite3";
import { join } from "path";

export async function GET(request: NextRequest) {
  try {
    const dbPath = join(process.cwd(), "hacom_ecommerce.db");
    const db = new Database(dbPath);

    // Get products statistics
    const productsStats = db
      .prepare(
        `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
        COUNT(CASE WHEN featured = 1 THEN 1 END) as featured,
        COUNT(CASE WHEN stock_quantity <= 5 THEN 1 END) as low_stock
      FROM products
    `,
      )
      .get();

    // Get categories statistics
    const categoriesStats = db
      .prepare(
        `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN is_active = 1 THEN 1 END) as active
      FROM categories
    `,
      )
      .get();

    // Get users statistics
    const usersStats = db
      .prepare(
        `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN role = 'user' THEN 1 END) as customers,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins
      FROM users
    `,
      )
      .get();

    // Get orders statistics
    const ordersStats = db
      .prepare(
        `
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing,
        COUNT(CASE WHEN status = 'shipped' THEN 1 END) as shipped,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
      FROM orders
    `,
      )
      .get();

    // Get revenue from delivered and completed orders (successful orders)
    const revenueStats = db
      .prepare(
        `
      SELECT
        COALESCE(SUM(CASE WHEN status IN ('delivered', 'completed') THEN total_amount ELSE 0 END), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN status IN ('cancelled', 'failed') THEN total_amount ELSE 0 END), 0) as lost_revenue
      FROM orders
    `,
      )
      .get();

    // Get successful and failed orders count
    const orderStatusStats = db
      .prepare(
        `
      SELECT
        COUNT(CASE WHEN status IN ('delivered', 'completed') THEN 1 END) as successful_orders,
        COUNT(CASE WHEN status IN ('cancelled', 'failed') THEN 1 END) as failed_orders
      FROM orders
    `,
      )
      .get();

    db.close();

    const dashboardStats = {
      products: {
        total: productsStats.total || 0,
        active: productsStats.active || 0,
        featured: productsStats.featured || 0,
        low_stock: productsStats.low_stock || 0,
      },
      categories: {
        total: categoriesStats.total || 0,
        active: categoriesStats.active || 0,
      },
      users: {
        total: usersStats.total || 0,
        customers: usersStats.customers || 0,
        admins: usersStats.admins || 0,
      },
      orders: {
        total: ordersStats.total || 0,
        pending: ordersStats.pending || 0,
        processing: ordersStats.processing || 0,
        shipped: ordersStats.shipped || 0,
        delivered: ordersStats.delivered || 0,
        completed: ordersStats.completed || 0,
        cancelled: ordersStats.cancelled || 0,
        failed: ordersStats.failed || 0,
        successful: orderStatusStats.successful_orders || 0,
        failed_total: orderStatusStats.failed_orders || 0,
      },
      revenue: {
        total: revenueStats.total_revenue || 0,
        lost: revenueStats.lost_revenue || 0,
      },
    };

    return NextResponse.json({
      success: true,
      data: dashboardStats,
    });
  } catch (error) {
    console.error("Dashboard stats API error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Không thể lấy thống kê dashboard",
        error: error.message,
      },
      { status: 500 },
    );
  }
}
