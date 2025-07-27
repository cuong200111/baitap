import express from "express";
import { executeQuery } from "../database/connection.js";

const router = express.Router();

// Development only: Reset database to initial state
router.post("/reset-db", async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(404).json({ success: false, message: "Not found" });
  }

  try {
    console.log("🔄 Resetting database to initial state...");

    // Delete all non-admin users
    await executeQuery("DELETE FROM users WHERE role != 'admin'");

    // Delete all reviews
    await executeQuery("DELETE FROM product_reviews");

    // Reset product ratings
    await executeQuery("UPDATE products SET avg_rating = 0, review_count = 0");

    console.log("✅ Database reset completed");

    res.json({
      success: true,
      message: "Database reset to initial state (kept admin user)",
    });
  } catch (error) {
    console.error("Reset database error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reset database",
    });
  }
});

// Development only: List all users
router.get("/users", async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(404).json({ success: false, message: "Not found" });
  }

  try {
    const users = await executeQuery(
      "SELECT id, email, full_name, role, created_at FROM users ORDER BY created_at DESC",
    );

    res.json({
      success: true,
      data: users,
      count: users.length,
    });
  } catch (error) {
    console.error("List users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to list users",
    });
  }
});

// Development only: Delete specific user
router.delete("/user/:email", async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(404).json({ success: false, message: "Not found" });
  }

  try {
    const { email } = req.params;
    const result = await executeQuery("DELETE FROM users WHERE email = ?", [
      email,
    ]);

    res.json({
      success: true,
      deleted: result.affectedRows > 0,
      message:
        result.affectedRows > 0
          ? `User ${email} deleted`
          : `No user found with email ${email}`,
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
  }
});

export default router;
