import express from "express";
import { executeQuery } from "../database/connection.js";

const router = express.Router();

// Development helper routes
router.get("/test", async (req, res) => {
  try {
    res.json({
      success: true,
      message: "Dev route is working",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Dev test error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Database connectivity test
router.get("/db-test", async (req, res) => {
  try {
    const result = await executeQuery("SELECT 1 as test");
    res.json({
      success: true,
      message: "Database connection successful",
      data: result,
    });
  } catch (error) {
    console.error("Database test error:", error);
    res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message,
    });
  }
});

export default router;
