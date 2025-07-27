import express from "express";
import { cartController } from "../controllers/cartController.js";

const router = express.Router();

// Get cart
router.get("/", cartController.getCart);

// Add to cart
router.post("/", cartController.addToCart);

// Update cart item
router.put("/:id", cartController.updateCartItem);

// Remove from cart
router.delete("/:id", cartController.removeFromCart);

// Clear cart
router.delete("/", cartController.clearCart);

// Migrate cart from session to user
router.post("/migrate", cartController.migrateCart);

// Get cart count
router.get("/count", cartController.getCartCount);

export default router;
