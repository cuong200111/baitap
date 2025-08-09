import express from "express";
import { checkSeoHealth, generateMetaTags, generateSchemaOrg } from "../lib/seo-utils.js";
import { seoController } from "../controllers/seoController.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// Public SEO endpoints (no authentication required)

// Get SEO settings (public - for frontend to load)
router.get("/settings", seoController.getSeoSettings);

// Get SEO status (public - for SEO health checks)
router.get("/status", seoController.getSeoStatus);

// Content analysis (public - for content optimization)
router.post("/content-analysis", seoController.analyzeContent);

// Get SEO health check
router.get("/health", requireAuth, async (req, res) => {
  try {
    const healthData = await checkSeoHealth();
    
    res.json({
      success: true,
      data: healthData
    });
  } catch (error) {
    console.error("SEO health check error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Generate meta tags for a page
router.post("/meta-tags", async (req, res) => {
  try {
    const { pageType, entityId } = req.body;
    
    if (!pageType) {
      return res.status(400).json({
        success: false,
        message: "Page type is required"
      });
    }
    
    const metaTags = await generateMetaTags(pageType, entityId);
    
    res.json({
      success: true,
      data: metaTags
    });
  } catch (error) {
    console.error("Meta tags generation error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Generate Schema.org markup
router.post("/schema", async (req, res) => {
  try {
    const { type, data } = req.body;
    
    if (!type || !data) {
      return res.status(400).json({
        success: false,
        message: "Type and data are required"
      });
    }
    
    const schema = generateSchemaOrg(type, data);
    
    res.json({
      success: true,
      data: { schema }
    });
  } catch (error) {
    console.error("Schema generation error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export default router;
