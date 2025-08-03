import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

// Import routes
import authRoutes from "./routes/auth.js";
import categoryRoutes from "./routes/categories.js";
import productRoutes from "./routes/products.js";
import orderRoutes from "./routes/orders.js";
import mediaRoutes from "./routes/media.js";
import reviewRoutes from "./routes/reviews.js";
import userRoutes from "./routes/users.js";
import devRoutes from "./routes/dev.js";

// Import new routes
import adminRoutes from "./routes/admin.js";
import robotsRoutes from "./routes/robots.js";
import debugRoutes from "./routes/debug.js";
import searchRoutes from "./routes/search.js";
import locationsRoutes from "./routes/locations.js";
import shippingRoutes from "./routes/shipping.js";
import cartRoutes from "./routes/cart.js";
import buyNowRoutes from "./routes/buy-now.js";
import sitemetaRoutes from "./routes/sitemeta.js";
import seoRoutes from "./routes/seo.js";
import utilsRoutes from "./routes/utils.js";
import configRoutes from "./routes/config.js";
import sitemapRouter from "./routes/sitemap.js";
import sitemapIndexRouter from "./routes/sitemap-index.js";
import addressesRoutes from "./routes/addresses.js";
import initRoutes from "./routes/init.js";
import customSitemapsRoutes from "./routes/custom-sitemaps.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Security middleware
// app.use(helmet());

// Rate limiting (more permissive for development)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 100 : 1000, // Higher limit for development
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later",
  },
});
app.use("/api/", limiter);

// CORS configuration
app.use(
  cors({
    origin: "*", // Allow all origins in development
  }),
);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploaded media)
app.use("/uploads", express.static("uploads"));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "HACOM Backend API is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/users", userRoutes);

// New API routes
app.use("/api/admin", adminRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/locations", locationsRoutes);
app.use("/api/shipping", shippingRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/buy-now", buyNowRoutes);
app.use("/api/seo", seoRoutes);
app.use("/api/utils", utilsRoutes);
app.use("/api/config", configRoutes);
app.use("/api/addresses", addressesRoutes);
app.use("/api/init", initRoutes);
app.use("/api/custom-sitemaps", customSitemapsRoutes);
app.use("/api/test-sitemap", testSitemapRoutes);

// Note: robots.txt and sitemap.xml are now served by Next.js frontend
// Backend only provides data APIs

// Legacy sitemeta routes (kept for compatibility)
app.use("/", sitemetaRoutes);

// Test order update endpoint (should be moved to debug in production)
app.post("/api/test-order-update", async (req, res) => {
  try {
    const { orderId, status } = req.body;

    if (!orderId || !status) {
      return res.status(400).json({
        success: false,
        message: "Order ID and status are required",
      });
    }

    const validStatuses = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    // Import executeQuery dynamically
    const { executeQuery } = await import("./database/connection.js");

    // Update order status
    await executeQuery(
      "UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [status, parseInt(orderId)],
    );

    res.json({
      success: true,
      message: "Order updated successfully",
    });
  } catch (error) {
    console.error("Test order update error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Development and debug routes (only in development)
if (process.env.NODE_ENV !== "production") {
  app.use("/api/dev", devRoutes);
  app.use("/api/debug", debugRoutes);
}

app.use("/api", sitemapRouter);
// 404 handler
app.use("/api/*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error("Global error handler:", error);

  // Database connection errors
  if (error.code === "ECONNREFUSED") {
    return res.status(503).json({
      success: false,
      message: "Database connection failed",
    });
  }

  // JWT errors
  if (error.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }

  // Validation errors
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON format",
    });
  }

  // Default error
  res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : error.message,
  });
});

// Start server
const startServer = async () => {
  app.listen(PORT, () => {
    console.log(`🚀 HACOM Backend API running on port ${PORT}`);
    console.log(`📱 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📚 API Base URL: http://localhost:${PORT}/api`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  });
};

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("👋 SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("👋 SIGINT received, shutting down gracefully");
  process.exit(0);
});

startServer();
