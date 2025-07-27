import express from "express";
import { executeQuery } from "../database/connection.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Get product reviews
router.get("/", async (req, res) => {
  try {
    const { product_id, page = 1, limit = 10, rating } = req.query;
    console.log(product_id,"product_idproduct_id")
    const offset = (page - 1) * limit;

    if (!product_id) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    let query = `
      SELECT r.*, u.full_name, u.avatar 
      FROM product_reviews r 
      JOIN users u ON r.user_id = u.id 
      WHERE r.product_id = ? AND r.is_approved = true
    `;
    const params = [product_id];

    if (rating) {
      query += " AND r.rating = ?";
      params.push(rating);
    }

    query += " ORDER BY r.created_at DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limit), parseInt(offset));

    const reviews = await executeQuery(query, params);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM product_reviews 
      WHERE product_id = ? AND is_approved = true
    `;
    const countParams = [product_id];

    if (rating) {
      countQuery += " AND rating = ?";
      countParams.push(rating);
    }

    const [{ total }] = await executeQuery(countQuery, countParams);

    // Get rating summary
    const ratingSummary = await executeQuery(
      `SELECT 
        COUNT(*) as total_reviews,
        AVG(rating) as average_rating,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as rating_5_count,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as rating_4_count,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as rating_3_count,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as rating_2_count,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as rating_1_count
       FROM product_reviews 
       WHERE product_id = ? AND is_approved = true`,
      [product_id],
    );

    res.json({
      success: true,
      data: {
        reviews,
        summary: ratingSummary[0],
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total,
          total_pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get reviews error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
    });
  }
});

// Add product review
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { product_id, rating, title, comment } = req.body;

    if (!product_id || !rating) {
      return res.status(400).json({
        success: false,
        message: "Product ID and rating are required",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    // Check if product exists
    const product = await executeQuery("SELECT id FROM products WHERE id = ?", [
      product_id,
    ]);
    if (product.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check if user already reviewed this product
    const existingReview = await executeQuery(
      "SELECT id FROM product_reviews WHERE user_id = ? AND product_id = ?",
      [req.user.id, product_id],
    );

    if (existingReview.length > 0) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this product",
      });
    }

    // Insert review
    const result = await executeQuery(
      `INSERT INTO product_reviews (product_id, user_id, rating, title, comment)
       VALUES (?, ?, ?, ?, ?)`,
      [product_id, req.user.id, rating, title || null, comment || null],
    );

    // Update product ratings summary
    await updateProductRatings(product_id);

    const review = await executeQuery(
      `SELECT r.*, u.full_name, u.avatar 
       FROM product_reviews r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.id = ?`,
      [result.insertId],
    );

    res.status(201).json({
      success: true,
      data: review[0],
      message: "Review added successfully",
    });
  } catch (error) {
    console.error("Add review error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add review",
    });
  }
});

// Update review
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, title, comment } = req.body;

    const review = await executeQuery(
      "SELECT * FROM product_reviews WHERE id = ?",
      [id],
    );

    if (review.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    // Check if user owns this review or is admin
    if (review[0].user_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own reviews",
      });
    }

    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    await executeQuery(
      `UPDATE product_reviews 
       SET rating = ?, title = ?, comment = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        rating || review[0].rating,
        title !== undefined ? title : review[0].title,
        comment !== undefined ? comment : review[0].comment,
        id,
      ],
    );

    // Update product ratings summary
    await updateProductRatings(review[0].product_id);

    const updatedReview = await executeQuery(
      `SELECT r.*, u.full_name, u.avatar 
       FROM product_reviews r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.id = ?`,
      [id],
    );

    res.json({
      success: true,
      data: updatedReview[0],
      message: "Review updated successfully",
    });
  } catch (error) {
    console.error("Update review error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update review",
    });
  }
});

// Delete review
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const review = await executeQuery(
      "SELECT * FROM product_reviews WHERE id = ?",
      [id],
    );

    if (review.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    // Check if user owns this review or is admin
    if (review[0].user_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own reviews",
      });
    }

    await executeQuery("DELETE FROM product_reviews WHERE id = ?", [id]);

    // Update product ratings summary
    await updateProductRatings(review[0].product_id);

    res.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Delete review error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete review",
    });
  }
});

// Approve/reject review (admin only)
router.patch("/:id/approve", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    const { id } = req.params;
    const { is_approved } = req.body;

    const review = await executeQuery(
      "SELECT * FROM product_reviews WHERE id = ?",
      [id],
    );

    if (review.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    await executeQuery(
      "UPDATE product_reviews SET is_approved = ? WHERE id = ?",
      [is_approved, id],
    );

    // Update product ratings summary
    await updateProductRatings(review[0].product_id);

    res.json({
      success: true,
      message: `Review ${is_approved ? "approved" : "rejected"} successfully`,
    });
  } catch (error) {
    console.error("Approve review error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update review status",
    });
  }
});

// Helper function to update product ratings summary
async function updateProductRatings(productId) {
  try {
    const summary = await executeQuery(
      `SELECT 
        COUNT(*) as total_reviews,
        AVG(rating) as average_rating,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as rating_1_count,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as rating_2_count,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as rating_3_count,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as rating_4_count,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as rating_5_count
       FROM product_reviews 
       WHERE product_id = ? AND is_approved = true`,
      [productId],
    );

    const data = summary[0];

    // Insert or update product ratings summary
    await executeQuery(
      `INSERT INTO product_ratings (
        product_id, total_reviews, average_rating, 
        rating_1_count, rating_2_count, rating_3_count, rating_4_count, rating_5_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        total_reviews = VALUES(total_reviews),
        average_rating = VALUES(average_rating),
        rating_1_count = VALUES(rating_1_count),
        rating_2_count = VALUES(rating_2_count),
        rating_3_count = VALUES(rating_3_count),
        rating_4_count = VALUES(rating_4_count),
        rating_5_count = VALUES(rating_5_count),
        updated_at = CURRENT_TIMESTAMP`,
      [
        productId,
        data.total_reviews,
        data.average_rating || 0,
        data.rating_1_count,
        data.rating_2_count,
        data.rating_3_count,
        data.rating_4_count,
        data.rating_5_count,
      ],
    );
  } catch (error) {
    console.error("Update product ratings error:", error);
  }
}

export default router;
