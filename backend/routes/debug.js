import express from "express";
import { debugController } from "../controllers/debugController.js";

const router = express.Router();

// Authentication testing
router.get("/auth", debugController.testAuth);

// Database testing
router.get("/db-check", debugController.checkDatabase);

// Categories testing
router.get("/categories-test", debugController.testCategories);
router.get("/categories-raw", debugController.getRawCategories);
router.get("/simple-categories", debugController.getSimpleCategories);
router.get("/category-count", debugController.countCategories);
router.post("/ensure-categories", debugController.ensureCategories);

// Products testing
router.get("/featured-products", debugController.testFeaturedProducts);
router.post("/add-sample-products", debugController.addSampleProducts);

// Migration endpoints
router.post("/migrate-addresses", async (req, res) => {
  try {
    const { createCustomerAddressesTable } = await import("../database/migrate-addresses.js");
    await createCustomerAddressesTable();
    res.json({ success: true, message: "Customer addresses table created successfully" });
  } catch (error) {
    console.error("Migration error:", error);
    res.status(500).json({ success: false, message: "Migration failed", error: error.message });
  }
});

// Reviews testing
router.post("/add-sample-reviews", debugController.addSampleReviews);

// Orders testing
router.post("/create-test-order", debugController.createTestOrder);
router.post("/create-test-order-complete", debugController.createCompleteTestOrder);

// Cart testing
router.get("/cart-test", debugController.testCart);

// Database reset (development only)
router.post("/reset-db", debugController.resetDatabase);

// Test order update
router.post("/test-order-update", debugController.testOrderUpdate);

export default router;
