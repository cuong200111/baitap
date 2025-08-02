import express from "express";
import { pool } from "../database/connection.js";
import { authenticateToken } from "../middleware/auth.js";
import { createSeoAnalyticsTable } from "../database/migrate-seo-analytics.js";

const router = express.Router();

// Simple test endpoint without validation
router.post("/create", authenticateToken, async (req, res) => {
  try {
    console.log("=== TEST SITEMAP CREATE ===");
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    console.log("User:", req.user);
    console.log("Headers:", req.headers);

    // Basic validation
    if (!req.body.url) {
      return res.status(400).json({
        success: false,
        message: "URL is required",
      });
    }

    // Simple insert
    const {
      url,
      title = null,
      description = null,
      priority = 0.2,
      changefreq = "monthly",
      mobile_friendly = true,
      status = "active",
    } = req.body;

    console.log("Inserting:", {
      url,
      title,
      description,
      priority,
      changefreq,
      mobile_friendly,
      status,
    });

    const [result] = await pool.execute(
      `INSERT INTO custom_sitemaps 
       (url, title, description, priority, changefreq, mobile_friendly, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        url,
        title,
        description,
        priority,
        changefreq,
        mobile_friendly,
        status,
        req.user.id,
      ],
    );

    console.log("Insert result:", result);

    res.json({
      success: true,
      message: "Test sitemap created successfully",
      data: {
        id: result.insertId,
        url,
        title,
        description,
        priority,
        changefreq,
        mobile_friendly,
        status,
      },
    });
  } catch (error) {
    console.error("Test sitemap create error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create test sitemap",
      error: error.message,
    });
  }
});

// Check and setup database tables
router.get("/setup", async (req, res) => {
  try {
    console.log("=== DATABASE SETUP CHECK ===");

    // Check custom_sitemaps table
    try {
      const [sitemapRows] = await pool.execute("DESCRIBE custom_sitemaps");
      console.log(
        "✅ custom_sitemaps table exists with columns:",
        sitemapRows.map((r) => r.Field),
      );
    } catch (error) {
      console.log("❌ custom_sitemaps table missing:", error.message);
    }

    // Check seo_analytics table
    try {
      const [analyticsRows] = await pool.execute("DESCRIBE seo_analytics");
      console.log(
        "✅ seo_analytics table exists with columns:",
        analyticsRows.map((r) => r.Field),
      );
    } catch (error) {
      console.log("❌ seo_analytics table missing, creating...", error.message);
      try {
        await createSeoAnalyticsTable();
        console.log("✅ seo_analytics table created");
      } catch (createError) {
        console.log("❌ Failed to create seo_analytics:", createError.message);
      }
    }

    res.json({
      success: true,
      message: "Database setup check completed",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Database setup error:", error);
    res.status(500).json({
      success: false,
      message: "Database setup failed",
      error: error.message,
    });
  }
});

// Test public endpoint
router.get("/public", async (req, res) => {
  try {
    console.log('=== TEST PUBLIC ENDPOINT ===');

    const response = await fetch('http://localhost:4000/api/custom-sitemaps');
    console.log('Public endpoint response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('Public endpoint data:', data);

      res.json({
        success: true,
        message: 'Public endpoint test completed',
        data: data
      });
    } else {
      const errorText = await response.text();
      console.log('Public endpoint error:', errorText);

      res.json({
        success: false,
        message: 'Public endpoint failed',
        status: response.status,
        error: errorText
      });
    }

  } catch (error) {
    console.error('Test public endpoint error:', error);
    res.status(500).json({
      success: false,
      message: "Test failed",
      error: error.message
    });
  }
});

// List all sitemaps
router.get("/list", async (req, res) => {
  try {
    console.log("=== TEST SITEMAP LIST ===");

    const [rows] = await pool.execute(
      "SELECT * FROM custom_sitemaps ORDER BY created_at DESC",
    );

    console.log("Found sitemaps:", rows.length);

    res.json({
      success: true,
      data: rows,
      count: rows.length,
    });
  } catch (error) {
    console.error("Test sitemap list error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to list test sitemaps",
      error: error.message,
    });
  }
});

export default router;
