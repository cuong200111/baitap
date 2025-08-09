import express from "express";
import { executeQuery } from "../database/connection.js";

const router = express.Router();

// Log SEO analytics (sitemap generation, robots.txt access, etc.)
router.post("/log", async (req, res) => {
  try {
    const { url_path, date, page_views, bounce_rate, avg_time_on_page, organic_traffic } = req.body;

    if (!url_path || !date) {
      return res.status(400).json({
        success: false,
        message: "url_path and date are required",
      });
    }

    // Insert or update analytics data
    await executeQuery(
      `
      INSERT INTO seo_analytics (url_path, date, page_views, bounce_rate, avg_time_on_page, organic_traffic)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        page_views = page_views + VALUES(page_views),
        bounce_rate = VALUES(bounce_rate),
        avg_time_on_page = VALUES(avg_time_on_page),
        organic_traffic = organic_traffic + VALUES(organic_traffic)
    `,
      [
        url_path,
        date,
        page_views || 1,
        bounce_rate || 0.00,
        avg_time_on_page || 0,
        organic_traffic || 0,
      ]
    );

    res.json({
      success: true,
      message: "Analytics logged successfully",
    });
  } catch (error) {
    console.error("Error logging SEO analytics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to log analytics",
      error: error.message,
    });
  }
});

// Get SEO analytics data
router.get("/data", async (req, res) => {
  try {
    const { startDate, endDate, url_path } = req.query;

    let query = `
      SELECT 
        url_path,
        date,
        page_views,
        bounce_rate,
        avg_time_on_page,
        organic_traffic
      FROM seo_analytics
    `;
    
    const conditions = [];
    const params = [];

    if (startDate) {
      conditions.push("date >= ?");
      params.push(startDate);
    }

    if (endDate) {
      conditions.push("date <= ?");
      params.push(endDate);
    }

    if (url_path) {
      conditions.push("url_path = ?");
      params.push(url_path);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY date DESC, page_views DESC";

    const analytics = await executeQuery(query, params);

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error("Error fetching SEO analytics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch analytics",
      error: error.message,
    });
  }
});

// Get analytics summary
router.get("/summary", async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const summaryQuery = `
      SELECT 
        COUNT(DISTINCT url_path) as unique_pages,
        SUM(page_views) as total_page_views,
        AVG(bounce_rate) as avg_bounce_rate,
        AVG(avg_time_on_page) as avg_time_on_page,
        SUM(organic_traffic) as total_organic_traffic,
        COUNT(DISTINCT date) as active_days
      FROM seo_analytics
      WHERE date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
    `;

    const topPagesQuery = `
      SELECT 
        url_path,
        SUM(page_views) as total_views,
        AVG(bounce_rate) as avg_bounce_rate,
        AVG(avg_time_on_page) as avg_time
      FROM seo_analytics
      WHERE date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY url_path
      ORDER BY total_views DESC
      LIMIT 10
    `;

    const [summary] = await executeQuery(summaryQuery, [days]);
    const topPages = await executeQuery(topPagesQuery, [days]);

    res.json({
      success: true,
      data: {
        summary: summary || {},
        topPages: topPages || [],
        period: `${days} days`,
      },
    });
  } catch (error) {
    console.error("Error fetching analytics summary:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch analytics summary",
      error: error.message,
    });
  }
});

// Track sitemap generations
router.get("/sitemap-stats", async (req, res) => {
  try {
    const sitemapStats = await executeQuery(`
      SELECT 
        DATE(date) as date,
        SUM(page_views) as generations
      FROM seo_analytics
      WHERE url_path IN ('sitemap_generation', 'robots_generation')
      AND date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY DATE(date), url_path
      ORDER BY date DESC
    `);

    const totalGenerations = await executeQuery(`
      SELECT 
        url_path,
        SUM(page_views) as total
      FROM seo_analytics
      WHERE url_path IN ('sitemap_generation', 'robots_generation')
      GROUP BY url_path
    `);

    res.json({
      success: true,
      data: {
        daily: sitemapStats,
        totals: totalGenerations,
      },
    });
  } catch (error) {
    console.error("Error fetching sitemap stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch sitemap stats",
      error: error.message,
    });
  }
});

export default router;
