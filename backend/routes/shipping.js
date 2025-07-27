import express from "express";
import { shippingController } from "../controllers/shippingController.js";

const router = express.Router();

// Calculate shipping cost
router.post("/calculate", shippingController.calculateShipping);

export default router;
