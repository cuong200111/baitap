import express from "express";
import { body, validationResult, param } from "express-validator";
import { executeQuery } from "../database/connection.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// Helper function to create slug
const createSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, "a")
    .replace(/[èéẹẻẽêềếệểễ]/g, "e")
    .replace(/[ìíịỉĩ]/g, "i")
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, "o")
    .replace(/[ùúụủũưừứựửữ]/g, "u")
    .replace(/[ỳýỵỷỹ]/g, "y")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
};

// Get all categories (hierarchical)
router.get("/", async (req, res) => {
  try {
    const { parent_id, flat, mega_menu } = req.query;

    let query = `
      SELECT c.*,
             (SELECT COUNT(*) FROM categories WHERE parent_id = c.id) as children_count,
             (SELECT COUNT(*) FROM product_categories pc WHERE pc.category_id = c.id) as products_count
      FROM categories c
      WHERE c.is_active = TRUE
    `;
    const params = [];

    if (parent_id !== undefined) {
      if (parent_id === "null" || parent_id === "") {
        query += " AND c.parent_id IS NULL";
      } else {
        query += " AND c.parent_id = ?";
        params.push(parent_id);
      }
    }

    query += " ORDER BY c.sort_order ASC, c.name ASC";

    console.log("📂 Fetching categories with query:", query);
    console.log("📂 Query params:", params);

    let categories;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        categories = await executeQuery(query, params);
        break;
      } catch (error) {
        retryCount++;
        console.error(
          `❌ Categories query attempt ${retryCount} failed:`,
          error.message,
        );

        if (retryCount >= maxRetries) {
          throw error;
        }

        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount));
      }
    }

    if (!categories) {
      throw new Error("Failed to fetch categories after retries");
    }

    // If flat=true, return flat array
    if (flat === "true") {
      return res.json({
        success: true,
        data: categories,
      });
    }

    // Build hierarchical structure
    const buildHierarchy = (items, parentId = null) => {
      return items
        .filter((item) => item.parent_id === parentId)
        .map((item) => ({
          ...item,
          children: buildHierarchy(items, item.id),
        }));
    };

    const hierarchicalCategories = buildHierarchy(categories);

    // For mega_menu=true, ensure we include all child levels for proper menu structure
    if (mega_menu === "true") {
      // Return only top-level categories with their full hierarchy
      const topLevelCategories = hierarchicalCategories.filter(
        (cat) => !cat.parent_id,
      );

      return res.json({
        success: true,
        data: topLevelCategories,
        message: "Categories for mega menu loaded successfully",
      });
    }

    res.json({
      success: true,
      data: hierarchicalCategories,
    });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Get category by ID or slug
router.get(
  "/:identifier",
  [param("identifier").notEmpty().withMessage("Category identifier required")],
  async (req, res) => {
    try {
      const { identifier } = req.params;
      const { include_children } = req.query;

      // Try to find by ID first, then by slug
      let query =
        "SELECT * FROM categories WHERE is_active = TRUE AND (id = ? OR slug = ?)";
      const category = await executeQuery(query, [identifier, identifier]);

      if (category.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
        });
      }

      const categoryData = category[0];

      // Include children if requested
      if (include_children === "true") {
        const children = await executeQuery(
          "SELECT * FROM categories WHERE parent_id = ? AND is_active = TRUE ORDER BY sort_order ASC, name ASC",
          [categoryData.id],
        );
        categoryData.children = children;
      }

      res.json({
        success: true,
        data: categoryData,
      });
    } catch (error) {
      console.error("Get category error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

// Create new category (Admin only)
router.post(
  "/",
  authenticateToken,
  requireAdmin,
  [
    body("name").trim().notEmpty().withMessage("Category name required"),
    body("description").optional().trim(),
    body("parent_id").optional().isInt().withMessage("Invalid parent ID"),
    body("sort_order").optional().isInt().withMessage("Invalid sort order"),
    body("image").optional().trim(),
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

      const { name, description, parent_id, sort_order, image } = req.body;

      // Create slug
      const slug = createSlug(name);

      // Check if slug already exists
      const existingCategory = await executeQuery(
        "SELECT id FROM categories WHERE slug = ?",
        [slug],
      );

      if (existingCategory.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Category with this name already exists",
        });
      }

      // Validate parent_id if provided
      if (parent_id) {
        const parentCategory = await executeQuery(
          "SELECT id FROM categories WHERE id = ? AND is_active = true",
          [parent_id],
        );

        if (parentCategory.length === 0) {
          return res.status(400).json({
            success: false,
            message: "Parent category not found",
          });
        }
      }

      // Create category
      const result = await executeQuery(
        `
        INSERT INTO categories (name, slug, description, parent_id, sort_order, image)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
        [
          name,
          slug,
          description || null,
          parent_id || null,
          sort_order || 0,
          image || null,
        ],
      );

      // Get created category
      const newCategory = await executeQuery(
        "SELECT * FROM categories WHERE id = ?",
        [result.insertId],
      );

      res.status(201).json({
        success: true,
        message: "Category created successfully",
        data: newCategory[0],
      });
    } catch (error) {
      console.error("Create category error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

// Update category (Admin only)
router.put(
  "/:id",
  authenticateToken,
  requireAdmin,
  [
    param("id").isInt().withMessage("Invalid category ID"),
    body("name")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Category name cannot be empty"),
    body("description").optional().trim(),
    body("parent_id").optional().isInt().withMessage("Invalid parent ID"),
    body("sort_order").optional().isInt().withMessage("Invalid sort order"),
    body("image").optional().trim(),
    body("is_active")
      .optional()
      .isBoolean()
      .withMessage("Invalid is_active value"),
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
      const { name, description, parent_id, sort_order, image, is_active } =
        req.body;

      // Check if category exists
      const existingCategory = await executeQuery(
        "SELECT * FROM categories WHERE id = ?",
        [id],
      );

      if (existingCategory.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
        });
      }

      const updateFields = [];
      const updateValues = [];

      if (name !== undefined) {
        const slug = createSlug(name);

        // Check if new slug conflicts with existing category
        const slugConflict = await executeQuery(
          "SELECT id FROM categories WHERE slug = ? AND id != ?",
          [slug, id],
        );

        if (slugConflict.length > 0) {
          return res.status(400).json({
            success: false,
            message: "Category with this name already exists",
          });
        }

        updateFields.push("name = ?", "slug = ?");
        updateValues.push(name, slug);
      }

      if (description !== undefined) {
        updateFields.push("description = ?");
        updateValues.push(description);
      }

      if (parent_id !== undefined) {
        // Validate parent_id
        if (parent_id && parent_id != id) {
          const parentCategory = await executeQuery(
            "SELECT id FROM categories WHERE id = ? AND is_active = true",
            [parent_id],
          );

          if (parentCategory.length === 0) {
            return res.status(400).json({
              success: false,
              message: "Parent category not found",
            });
          }

          // Check for circular reference
          const checkCircular = async (categoryId, targetParentId) => {
            if (categoryId === targetParentId) return true;

            const parent = await executeQuery(
              "SELECT parent_id FROM categories WHERE id = ?",
              [targetParentId],
            );

            if (parent.length > 0 && parent[0].parent_id) {
              return await checkCircular(categoryId, parent[0].parent_id);
            }

            return false;
          };

          const isCircular = await checkCircular(parseInt(id), parent_id);
          if (isCircular) {
            return res.status(400).json({
              success: false,
              message: "Cannot set category as its own descendant",
            });
          }
        }

        updateFields.push("parent_id = ?");
        updateValues.push(parent_id || null);
      }

      if (sort_order !== undefined) {
        updateFields.push("sort_order = ?");
        updateValues.push(sort_order);
      }

      if (image !== undefined) {
        updateFields.push("image = ?");
        updateValues.push(image);
      }

      if (is_active !== undefined) {
        updateFields.push("is_active = ?");
        updateValues.push(is_active);
      }

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No fields to update",
        });
      }

      // Always update updated_at
      updateFields.push("updated_at = CURRENT_TIMESTAMP");

      updateValues.push(id);

      await executeQuery(
        `UPDATE categories SET ${updateFields.join(", ")} WHERE id = ?`,
        updateValues,
      );

      // Get updated category
      const updatedCategory = await executeQuery(
        "SELECT * FROM categories WHERE id = ?",
        [id],
      );

      res.json({
        success: true,
        message: "Category updated successfully",
        data: updatedCategory[0],
      });
    } catch (error) {
      console.error("Update category error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

// Delete category (Admin only)
router.delete(
  "/:id",
  authenticateToken,
  requireAdmin,
  [param("id").isInt().withMessage("Invalid category ID")],
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

      // Check if category exists
      const category = await executeQuery(
        "SELECT * FROM categories WHERE id = ?",
        [id],
      );

      if (category.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
        });
      }

      // Check if category has children
      const children = await executeQuery(
        "SELECT COUNT(*) as count FROM categories WHERE parent_id = ?",
        [id],
      );

      if (children[0].count > 0) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete category with subcategories",
        });
      }

      // Check if category has products
      const products = await executeQuery(
        "SELECT COUNT(*) as count FROM product_categories WHERE category_id = ?",
        [id],
      );

      if (products[0].count > 0) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete category with products",
        });
      }

      // Delete category
      await executeQuery("DELETE FROM categories WHERE id = ?", [id]);

      res.json({
        success: true,
        message: "Category deleted successfully",
      });
    } catch (error) {
      console.error("Delete category error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

export default router;
