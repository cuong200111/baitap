import { executeQuery } from "../database/connection.js";

export const reportsController = {
  // Customer Analytics
  async getCustomerReports(req, res) {
    try {
      const { start_date, end_date, limit = 50 } = req.query;

      // Customer registration stats
      let registrationQuery = `
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as new_customers
        FROM users 
        WHERE role = 'user'
      `;
      let params = [];

      if (start_date && end_date) {
        registrationQuery += ` AND created_at BETWEEN ? AND ?`;
        params.push(start_date, end_date);
      }

      registrationQuery += ` GROUP BY DATE(created_at) ORDER BY date DESC LIMIT ?`;
      params.push(parseInt(limit));

      const registrationStats = await executeQuery(registrationQuery, params);

      // Top customers by order value
      let topCustomersQuery = `
        SELECT 
          u.id,
          u.full_name,
          u.email,
          COUNT(o.id) as total_orders,
          COALESCE(SUM(o.total_amount), 0) as total_spent,
          AVG(o.total_amount) as avg_order_value,
          MAX(o.created_at) as last_order_date
        FROM users u
        LEFT JOIN orders o ON u.id = o.user_id
        WHERE u.role = 'user'
      `;
      let customerParams = [];

      if (start_date && end_date) {
        topCustomersQuery += ` AND (o.created_at BETWEEN ? AND ? OR o.created_at IS NULL)`;
        customerParams.push(start_date, end_date);
      }

      topCustomersQuery += `
        GROUP BY u.id, u.full_name, u.email
        ORDER BY total_spent DESC
        LIMIT ?
      `;
      customerParams.push(parseInt(limit));

      const topCustomers = await executeQuery(topCustomersQuery, customerParams);

      // Customer activity stats
      const activityStats = await executeQuery(`
        SELECT 
          COUNT(CASE WHEN last_login >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as active_7_days,
          COUNT(CASE WHEN last_login >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as active_30_days,
          COUNT(CASE WHEN last_login >= DATE_SUB(NOW(), INTERVAL 90 DAY) THEN 1 END) as active_90_days,
          COUNT(*) as total_customers
        FROM users 
        WHERE role = 'user'
      `);

      // Customer segmentation
      const segmentation = await executeQuery(`
        SELECT 
          CASE 
            WHEN total_spent >= 10000000 THEN 'VIP'
            WHEN total_spent >= 5000000 THEN 'Premium'
            WHEN total_spent >= 1000000 THEN 'Regular'
            ELSE 'New'
          END as segment,
          COUNT(*) as customer_count,
          AVG(total_spent) as avg_spent
        FROM (
          SELECT 
            u.id,
            COALESCE(SUM(o.total_amount), 0) as total_spent
          FROM users u
          LEFT JOIN orders o ON u.id = o.user_id AND o.status IN ('completed', 'delivered')
          WHERE u.role = 'user'
          GROUP BY u.id
        ) customer_totals
        GROUP BY segment
        ORDER BY avg_spent DESC
      `);

      res.json({
        success: true,
        data: {
          registration_stats: registrationStats,
          top_customers: topCustomers,
          activity_stats: activityStats[0] || {},
          segmentation: segmentation,
        },
      });
    } catch (error) {
      console.error('Customer reports error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get customer reports',
      });
    }
  },

  // Product Analytics
  async getProductReports(req, res) {
    try {
      const { start_date, end_date, limit = 50 } = req.query;

      // Best selling products
      let bestSellersQuery = `
        SELECT 
          p.id,
          p.name,
          p.price,
          p.sale_price,
          COALESCE(SUM(oi.quantity), 0) as total_sold,
          COALESCE(SUM(oi.quantity * oi.price), 0) as total_revenue,
          COUNT(DISTINCT o.id) as order_count
        FROM products p
        LEFT JOIN order_items oi ON p.id = oi.product_id
        LEFT JOIN orders o ON oi.order_id = o.id
        WHERE 1=1
      `;
      let params = [];

      if (start_date && end_date) {
        bestSellersQuery += ` AND (o.created_at BETWEEN ? AND ? OR o.created_at IS NULL)`;
        params.push(start_date, end_date);
      }

      bestSellersQuery += `
        GROUP BY p.id, p.name, p.price, p.sale_price
        ORDER BY total_sold DESC
        LIMIT ?
      `;
      params.push(parseInt(limit));

      const bestSellers = await executeQuery(bestSellersQuery, params);

      // Product performance by category
      let categoryPerformanceQuery = `
        SELECT 
          c.id,
          c.name as category_name,
          COUNT(DISTINCT p.id) as product_count,
          COALESCE(SUM(oi.quantity), 0) as total_sold,
          COALESCE(SUM(oi.quantity * oi.price), 0) as total_revenue,
          AVG(p.price) as avg_price
        FROM categories c
        LEFT JOIN products p ON c.id = p.category_id
        LEFT JOIN order_items oi ON p.id = oi.product_id
        LEFT JOIN orders o ON oi.order_id = o.id
        WHERE c.is_active = 1
      `;
      let categoryParams = [];

      if (start_date && end_date) {
        categoryPerformanceQuery += ` AND (o.created_at BETWEEN ? AND ? OR o.created_at IS NULL)`;
        categoryParams.push(start_date, end_date);
      }

      categoryPerformanceQuery += `
        GROUP BY c.id, c.name
        ORDER BY total_revenue DESC
      `;

      const categoryPerformance = await executeQuery(categoryPerformanceQuery, categoryParams);

      // Low stock products
      const lowStockProducts = await executeQuery(`
        SELECT 
          id,
          name,
          stock_quantity,
          price,
          sale_price,
          status
        FROM products
        WHERE stock_quantity <= 5 AND status = 'active'
        ORDER BY stock_quantity ASC
        LIMIT ?
      `, [parseInt(limit)]);

      // Product views and conversions (simulated data)
      const productMetrics = await executeQuery(`
        SELECT 
          p.id,
          p.name,
          COALESCE(SUM(oi.quantity), 0) as sales,
          COUNT(DISTINCT o.id) as orders,
          AVG(r.rating) as avg_rating,
          COUNT(r.id) as review_count
        FROM products p
        LEFT JOIN order_items oi ON p.id = oi.product_id
        LEFT JOIN orders o ON oi.order_id = o.id
        LEFT JOIN reviews r ON p.id = r.product_id
        GROUP BY p.id, p.name
        ORDER BY sales DESC
        LIMIT ?
      `, [parseInt(limit)]);

      res.json({
        success: true,
        data: {
          best_sellers: bestSellers,
          category_performance: categoryPerformance,
          low_stock_products: lowStockProducts,
          product_metrics: productMetrics,
        },
      });
    } catch (error) {
      console.error('Product reports error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get product reports',
      });
    }
  },

  // Sales Analytics
  async getSalesReports(req, res) {
    try {
      const { start_date, end_date, period = 'daily' } = req.query;

      // Revenue trends
      let revenueQuery = '';
      let params = [];

      switch (period) {
        case 'hourly':
          revenueQuery = `
            SELECT 
              DATE_FORMAT(created_at, '%Y-%m-%d %H:00') as period,
              COUNT(*) as order_count,
              SUM(total_amount) as revenue,
              AVG(total_amount) as avg_order_value
            FROM orders
            WHERE status IN ('completed', 'delivered')
          `;
          break;
        case 'weekly':
          revenueQuery = `
            SELECT 
              YEARWEEK(created_at) as period,
              COUNT(*) as order_count,
              SUM(total_amount) as revenue,
              AVG(total_amount) as avg_order_value
            FROM orders
            WHERE status IN ('completed', 'delivered')
          `;
          break;
        case 'monthly':
          revenueQuery = `
            SELECT 
              DATE_FORMAT(created_at, '%Y-%m') as period,
              COUNT(*) as order_count,
              SUM(total_amount) as revenue,
              AVG(total_amount) as avg_order_value
            FROM orders
            WHERE status IN ('completed', 'delivered')
          `;
          break;
        default: // daily
          revenueQuery = `
            SELECT 
              DATE(created_at) as period,
              COUNT(*) as order_count,
              SUM(total_amount) as revenue,
              AVG(total_amount) as avg_order_value
            FROM orders
            WHERE status IN ('completed', 'delivered')
          `;
      }

      if (start_date && end_date) {
        revenueQuery += ` AND created_at BETWEEN ? AND ?`;
        params.push(start_date, end_date);
      }

      revenueQuery += ` GROUP BY period ORDER BY period DESC LIMIT 30`;

      const revenueTrends = await executeQuery(revenueQuery, params);

      // Order status breakdown
      let statusQuery = `
        SELECT 
          status,
          COUNT(*) as count,
          SUM(total_amount) as total_amount,
          AVG(total_amount) as avg_amount
        FROM orders
        WHERE 1=1
      `;
      let statusParams = [];

      if (start_date && end_date) {
        statusQuery += ` AND created_at BETWEEN ? AND ?`;
        statusParams.push(start_date, end_date);
      }

      statusQuery += ` GROUP BY status ORDER BY count DESC`;

      const orderStatusBreakdown = await executeQuery(statusQuery, statusParams);

      // Payment method analysis
      const paymentMethods = await executeQuery(`
        SELECT 
          payment_method,
          COUNT(*) as order_count,
          SUM(total_amount) as total_revenue,
          AVG(total_amount) as avg_order_value
        FROM orders
        WHERE payment_method IS NOT NULL
        ${start_date && end_date ? 'AND created_at BETWEEN ? AND ?' : ''}
        GROUP BY payment_method
        ORDER BY total_revenue DESC
      `, start_date && end_date ? [start_date, end_date] : []);

      // Top performing days/times
      const timeAnalysis = await executeQuery(`
        SELECT 
          DAYNAME(created_at) as day_of_week,
          HOUR(created_at) as hour_of_day,
          COUNT(*) as order_count,
          SUM(total_amount) as revenue
        FROM orders
        WHERE status IN ('completed', 'delivered')
        ${start_date && end_date ? 'AND created_at BETWEEN ? AND ?' : ''}
        GROUP BY day_of_week, hour_of_day
        ORDER BY revenue DESC
        LIMIT 20
      `, start_date && end_date ? [start_date, end_date] : []);

      // Sales funnel
      const salesFunnel = {
        website_visitors: 15000, // This would come from analytics
        product_views: 8500,
        cart_additions: 1200,
        checkout_starts: 800,
        completed_orders: 650,
        conversion_rate: (650 / 15000 * 100).toFixed(2),
      };

      res.json({
        success: true,
        data: {
          revenue_trends: revenueTrends,
          order_status_breakdown: orderStatusBreakdown,
          payment_methods: paymentMethods,
          time_analysis: timeAnalysis,
          sales_funnel: salesFunnel,
        },
      });
    } catch (error) {
      console.error('Sales reports error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get sales reports',
      });
    }
  },
};
