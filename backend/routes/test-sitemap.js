import express from "express";
import { pool } from "../database/connection.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Simple test endpoint without validation
router.post("/create", authenticateToken, async (req, res) => {
  try {
    console.log('=== TEST SITEMAP CREATE ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('User:', req.user);
    console.log('Headers:', req.headers);
    
    // Basic validation
    if (!req.body.url) {
      return res.status(400).json({
        success: false,
        message: "URL is required"
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
      status = "active"
    } = req.body;
    
    console.log('Inserting:', { url, title, description, priority, changefreq, mobile_friendly, status });
    
    const [result] = await pool.execute(
      `INSERT INTO custom_sitemaps 
       (url, title, description, priority, changefreq, mobile_friendly, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [url, title, description, priority, changefreq, mobile_friendly, status, req.user.id]
    );
    
    console.log('Insert result:', result);
    
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
        status
      }
    });
    
  } catch (error) {
    console.error('Test sitemap create error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to create test sitemap",
      error: error.message
    });
  }
});

// List all sitemaps
router.get("/list", async (req, res) => {
  try {
    console.log('=== TEST SITEMAP LIST ===');
    
    const [rows] = await pool.execute(
      'SELECT * FROM custom_sitemaps ORDER BY created_at DESC'
    );
    
    console.log('Found sitemaps:', rows.length);
    
    res.json({
      success: true,
      data: rows,
      count: rows.length
    });
    
  } catch (error) {
    console.error('Test sitemap list error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to list test sitemaps",
      error: error.message
    });
  }
});

export default router;
