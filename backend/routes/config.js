import express from "express";
import { seoConfig } from "../database/connection.js";

const router = express.Router();

// Get application configuration
router.get("/", async (req, res) => {
  try {
    const config = {
      app: {
        name: "ZOXVN",
        version: "1.0.0",
        description: "Máy tính, Laptop, Gaming Gear",
        environment: process.env.NODE_ENV || "development",
      },
      api: {
        base_url: process.env.BASE_URL || "http://localhost:4000",
        version: "v1",
        timeout: 15000,
        rate_limit: {
          window_ms: 15 * 60 * 1000, // 15 minutes
          max_requests: process.env.NODE_ENV === "production" ? 100 : 1000,
        },
      },
      features: {
        enable_search: true,
        enable_cart: true,
        enable_wishlist: true,
        enable_reviews: true,
        enable_compare: true,
        enable_seo: true,
        enable_analytics: false,
      },
      ui: {
        items_per_page: 12,
        max_cart_items: 50,
        supported_formats: ["jpg", "jpeg", "png", "webp", "svg"],
        max_upload_size: 10 * 1024 * 1024, // 10MB
      },
      contact: {
        phone: "1900.1903",
        email: "info@zoxvn.com",
        address: "123 Đường ABC, Quận 1, TP.HCM",
        hours: "8:00 - 22:00 (T2-CN)",
      },
      social: {
        facebook: "https://facebook.com/zoxvn",
        youtube: "https://youtube.com/zoxvn",
      },
      seo: seoConfig.general,
      business: {
        name: seoConfig.schema.organization_name,
        phone: seoConfig.schema.organization_phone,
        email: seoConfig.schema.organization_email,
        address: seoConfig.schema.organization_address,
      },
    };

    res.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error("Config API error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get specific config section
router.get("/:section", async (req, res) => {
  try {
    const { section } = req.params;

    let config;
    switch (section) {
      case "seo":
        config = seoConfig;
        break;
      case "app":
        config = {
          name: "ZOXVN",
          version: "1.0.0",
          description: "Máy tính, Laptop, Gaming Gear",
          environment: process.env.NODE_ENV || "development",
        };
        break;
      case "api":
        config = {
          base_url: process.env.BASE_URL || "http://localhost:4000",
          version: "v1",
          timeout: 15000,
        };
        break;
      case "features":
        config = {
          enable_search: true,
          enable_cart: true,
          enable_wishlist: true,
          enable_reviews: true,
          enable_compare: true,
          enable_seo: true,
          enable_analytics: false,
        };
        break;
      default:
        return res.status(404).json({
          success: false,
          message: "Config section not found",
        });
    }

    res.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error("Config section API error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export default router;
