import express from "express";
import { seoController } from "../controllers/seoController.js";

const router = express.Router();

// Public SEO endpoints (no authentication required)

// Get SEO settings (public - for frontend to load)
router.get("/settings", seoController.getSeoSettings);

// Get SEO status (public - for SEO health checks)
router.get("/status", seoController.getSeoStatus);

// Content analysis (public - for content optimization)
router.post("/content-analysis", seoController.analyzeContent);

export default router;
