import express from "express";
import { executeQuery } from "../database/connection.js";

const router = express.Router();

// Debug routes for development

// Check database tables
router.get("/tables", async (req, res) => {
  try {
    const result = await executeQuery("SHOW TABLES");
    res.json({
      success: true,
      message: "Database tables retrieved",
      data: result,
    });
  } catch (error) {
    console.error("Debug tables error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve tables",
      error: error.message,
    });
  }
});

// Check database connection
router.get("/db-status", async (req, res) => {
  try {
    const result = await executeQuery("SELECT CONNECTION_ID() as connection_id, NOW() as current_time");
    res.json({
      success: true,
      message: "Database connection status",
      data: result[0],
    });
  } catch (error) {
    console.error("Debug db-status error:", error);
    res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message,
    });
  }
});

// System info
router.get("/system", (req, res) => {
  try {
    res.json({
      success: true,
      message: "System information",
      data: {
        node_version: process.version,
        platform: process.platform,
        uptime: process.uptime(),
        memory_usage: process.memoryUsage(),
        env: process.env.NODE_ENV,
      },
    });
  } catch (error) {
    console.error("Debug system error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get system info",
      error: error.message,
    });
  }
});

export default router;
