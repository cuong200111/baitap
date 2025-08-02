import express from "express";
import { body, validationResult } from "express-validator";
import { pool } from "../database/connection.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Get all custom sitemaps (public - for generating XML)
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM custom_sitemaps WHERE status = ? ORDER BY priority DESC, created_at ASC",
      ["active"],
    );

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching custom sitemaps:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch custom sitemaps",
    });
  }
});

// Get all custom sitemaps for admin (requires auth)
router.get("/admin", authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM custom_sitemaps ORDER BY created_at DESC",
    );

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching custom sitemaps for admin:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch custom sitemaps",
    });
  }
});

// Get single custom sitemap
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.execute(
      "SELECT * FROM custom_sitemaps WHERE id = ?",
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Custom sitemap not found",
      });
    }

    res.json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error("Error fetching custom sitemap:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch custom sitemap",
    });
  }
});

// Create new custom sitemap
router.post(
  "/",
  authenticateToken,
  [
    body("url")
      .notEmpty()
      .withMessage("URL is required")
      .isURL()
      .withMessage("URL must be valid"),
    body("title")
      .optional()
      .isLength({ max: 255 })
      .withMessage("Title must be less than 255 characters"),
    body("description")
      .optional()
      .isLength({ max: 1000 })
      .withMessage("Description must be less than 1000 characters"),
    body("priority")
      .optional()
      .isFloat({ min: 0.0, max: 1.0 })
      .withMessage("Priority must be between 0.0 and 1.0"),
    body("changefreq")
      .optional()
      .isIn([
        "always",
        "hourly",
        "daily",
        "weekly",
        "monthly",
        "yearly",
        "never",
      ])
      .withMessage("Invalid change frequency"),
    body("image_url").optional().isURL().withMessage("Image URL must be valid"),
    body("image_title")
      .optional()
      .isLength({ max: 255 })
      .withMessage("Image title must be less than 255 characters"),
    body("mobile_friendly")
      .optional()
      .isBoolean()
      .withMessage("Mobile friendly must be boolean"),
    body("status")
      .optional()
      .isIn(["active", "inactive"])
      .withMessage("Invalid status"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const {
        url,
        title = null,
        description = null,
        priority = 0.2,
        changefreq = "monthly",
        last_modified = null,
        image_url = null,
        image_title = null,
        image_caption = null,
        mobile_friendly = 1,
        status = "active",
      } = req.body;

      const createdBy = req.user.id;

      const [result] = await pool.execute(
        `INSERT INTO custom_sitemaps 
         (url, title, description, priority, changefreq, last_modified, 
          image_url, image_title, image_caption, mobile_friendly, status, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          url,
          title,
          description,
          priority,
          changefreq,
          last_modified ? new Date(last_modified) : new Date(),
          image_url,
          image_title,
          image_caption,
          mobile_friendly,
          status,
          createdBy,
        ],
      );

      // Get the created sitemap
      const [rows] = await pool.execute(
        "SELECT * FROM custom_sitemaps WHERE id = ?",
        [result.insertId],
      );

      res.status(201).json({
        success: true,
        message: "Custom sitemap created successfully",
        data: rows[0],
      });
    } catch (error) {
      console.error("Error creating custom sitemap:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create custom sitemap",
      });
    }
  },
);

// Update custom sitemap
router.put(
  "/:id",
  authenticateToken,
  [
    body("url").optional().isURL().withMessage("URL must be valid"),
    body("title")
      .optional()
      .isLength({ max: 255 })
      .withMessage("Title must be less than 255 characters"),
    body("description")
      .optional()
      .isLength({ max: 1000 })
      .withMessage("Description must be less than 1000 characters"),
    body("priority")
      .optional()
      .isFloat({ min: 0.0, max: 1.0 })
      .withMessage("Priority must be between 0.0 and 1.0"),
    body("changefreq")
      .optional()
      .isIn([
        "always",
        "hourly",
        "daily",
        "weekly",
        "monthly",
        "yearly",
        "never",
      ])
      .withMessage("Invalid change frequency"),
    body("image_url").optional().isURL().withMessage("Image URL must be valid"),
    body("image_title")
      .optional()
      .isLength({ max: 255 })
      .withMessage("Image title must be less than 255 characters"),
    body("mobile_friendly")
      .optional()
      .isBoolean()
      .withMessage("Mobile friendly must be boolean"),
    body("status")
      .optional()
      .isIn(["active", "inactive"])
      .withMessage("Invalid status"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const updateData = req.body;

      // Check if sitemap exists
      const [existingRows] = await pool.execute(
        "SELECT * FROM custom_sitemaps WHERE id = ?",
        [id],
      );

      if (existingRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Custom sitemap not found",
        });
      }

      // Build dynamic update query
      const updateFields = [];
      const updateValues = [];

      Object.keys(updateData).forEach((key) => {
        if (updateData[key] !== undefined) {
          updateFields.push(`${key} = ?`);
          if (key === "last_modified" && updateData[key]) {
            updateValues.push(new Date(updateData[key]));
          } else {
            updateValues.push(updateData[key]);
          }
        }
      });

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No fields to update",
        });
      }

      updateValues.push(id);

      await pool.execute(
        `UPDATE custom_sitemaps SET ${updateFields.join(", ")} WHERE id = ?`,
        updateValues,
      );

      // Get updated sitemap
      const [updatedRows] = await pool.execute(
        "SELECT * FROM custom_sitemaps WHERE id = ?",
        [id],
      );

      res.json({
        success: true,
        message: "Custom sitemap updated successfully",
        data: updatedRows[0],
      });
    } catch (error) {
      console.error("Error updating custom sitemap:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update custom sitemap",
      });
    }
  },
);

// Delete custom sitemap
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if sitemap exists
    const [existingRows] = await pool.execute(
      "SELECT * FROM custom_sitemaps WHERE id = ?",
      [id],
    );

    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Custom sitemap not found",
      });
    }

    await pool.execute("DELETE FROM custom_sitemaps WHERE id = ?", [id]);

    res.json({
      success: true,
      message: "Custom sitemap deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting custom sitemap:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete custom sitemap",
    });
  }
});

export default router;
