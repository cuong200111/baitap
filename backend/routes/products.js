import express from "express";
import { body, validationResult, param, query } from "express-validator";
import { executeQuery } from "../database/connection.js";
import {
  authenticateToken,
  requireAdmin,
  optionalAuth,
} from "../middleware/auth.js";

const router = express.Router();

// Helper function to create slug
const createSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, "a")
    .replace(/[èéẹẻẽêềếệểễ]/g, "e")
    .replace(/[ìíịỉĩ]/g, "i")
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, "o")
    .replace(/[ùúụủ��ưừứựửữ]/g, "u")
    .replace(/[ỳýỵỷỹ]/g, "y")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
};

// Get products with filters, search, and pagination
router.get("/", optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      category_id,
      min_price,
      max_price,
      featured,
      status = "active",
      sort_by = "created_at",
      sort_order = "DESC",
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build where conditions
    const whereConditions = [];
    const queryParams = [];

    // Base condition
    whereConditions.push("p.status = ?");
    queryParams.push(status);

    // Search condition
    if (search) {
      whereConditions.push(
        "(p.name LIKE ? OR p.description LIKE ? OR p.sku LIKE ?)",
      );
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    // Category filter
    if (category_id) {
      whereConditions.push(
        "EXISTS (SELECT 1 FROM product_categories pc WHERE pc.product_id = p.id AND pc.category_id = ?)",
      );
      queryParams.push(category_id);
    }

    // Price range filter
    if (min_price) {
      whereConditions.push("COALESCE(p.sale_price, p.price) >= ?");
      queryParams.push(parseFloat(min_price));
    }

    if (max_price) {
      whereConditions.push("COALESCE(p.sale_price, p.price) <= ?");
      queryParams.push(parseFloat(max_price));
    }

    // Featured filter
    if (featured === "true") {
      whereConditions.push("p.featured = TRUE");
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    // Valid sort fields
    const validSortFields = ["name", "price", "created_at", "stock_quantity"];
    const validSortOrders = ["ASC", "DESC"];

    const sortField = validSortFields.includes(sort_by)
      ? sort_by
      : "created_at";
    const sortDir = validSortOrders.includes(sort_order.toUpperCase())
      ? sort_order.toUpperCase()
      : "DESC";

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM products p
      ${whereClause}
    `;
    const countResult = await executeQuery(countQuery, queryParams);
    const totalProducts = countResult[0].total;

    // Get products
    const productsQuery = `
      SELECT 
        p.*,
        COALESCE(p.sale_price, p.price) as final_price,
        CASE WHEN p.sale_price IS NOT NULL THEN ROUND(((p.price - p.sale_price) / p.price) * 100) ELSE 0 END as discount_percent,
        GROUP_CONCAT(c.name) as category_names,
        AVG(pr.rating) as avg_rating,
        COUNT(pr.id) as review_count
      FROM products p
      LEFT JOIN product_categories pc ON p.id = pc.product_id
      LEFT JOIN categories c ON pc.category_id = c.id
                              LEFT JOIN product_reviews pr ON p.id = pr.product_id AND pr.is_approved = TRUE
      ${whereClause}
      GROUP BY p.id
      ORDER BY p.${sortField} ${sortDir}
      LIMIT ? OFFSET ?
    `;

    const products = await executeQuery(productsQuery, [
      ...queryParams,
      parseInt(limit),
      offset,
    ]);

    // Parse JSON fields
    const formattedProducts = products.map((product) => ({
      ...product,
      images: product.images ? JSON.parse(product.images) : [],
      attributes: product.attributes ? JSON.parse(product.attributes) : {},
      specifications: product.specifications
        ? JSON.parse(product.specifications)
        : {},
      avg_rating: product.avg_rating
        ? parseFloat(product.avg_rating).toFixed(1)
        : 0,
      category_names: product.category_names
        ? product.category_names.split(",")
        : [],
    }));

    const totalPages = Math.ceil(totalProducts / parseInt(limit));

    res.json({
      success: true,
      data: {
        products: formattedProducts,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_products: totalProducts,
          has_next: parseInt(page) < totalPages,
          has_prev: parseInt(page) > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get product by ID or slug
router.get("/:identifier", optionalAuth, async (req, res) => {
  try {
    const { identifier } = req.params;

    // Get product
    const productQuery = `
      SELECT 
        p.*,
        COALESCE(p.sale_price, p.price) as final_price,
        CASE WHEN p.sale_price IS NOT NULL THEN ROUND(((p.price - p.sale_price) / p.price) * 100) ELSE 0 END as discount_percent,
        AVG(pr.rating) as avg_rating,
        COUNT(pr.id) as review_count
      FROM products p
                              LEFT JOIN product_reviews pr ON p.id = pr.product_id AND pr.is_approved = TRUE
      WHERE p.status = 'active' AND (p.id = ? OR p.slug = ?)
      GROUP BY p.id
    `;

    const products = await executeQuery(productQuery, [identifier, identifier]);

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const product = products[0];

    // Get product categories
    const categories = await executeQuery(
      `
      SELECT c.id, c.name, c.slug
      FROM categories c
      JOIN product_categories pc ON c.id = pc.category_id
      WHERE pc.product_id = ?
    `,
      [product.id],
    );

    // Get product reviews
    const reviews = await executeQuery(
      `
      SELECT 
        pr.*,
        u.full_name as user_name
      FROM product_reviews pr
      JOIN users u ON pr.user_id = u.id
                              WHERE pr.product_id = ? AND pr.is_approved = TRUE
      ORDER BY pr.created_at DESC
      LIMIT 10
    `,
      [product.id],
    );

    // Parse JSON fields
    const formattedProduct = {
      ...product,
      images: product.images ? JSON.parse(product.images) : [],
      attributes: product.attributes ? JSON.parse(product.attributes) : {},
      specifications: product.specifications
        ? JSON.parse(product.specifications)
        : {},
      avg_rating: product.avg_rating
        ? parseFloat(product.avg_rating).toFixed(1)
        : 0,
      categories,
      reviews,
    };

    res.json({
      success: true,
      data: formattedProduct,
    });
  } catch (error) {
    console.error("Get product error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Create new product (Admin only)
router.post(
  "/",
  authenticateToken,
  requireAdmin,
  [
    body("name").trim().notEmpty().withMessage("Product name required"),
    body("sku").trim().notEmpty().withMessage("SKU required"),
    body("price").isFloat({ min: 0 }).withMessage("Valid price required"),
    body("sale_price")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Valid sale price required"),
    body("stock_quantity")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Valid stock quantity required"),
    body("description").optional().trim(),
    body("short_description").optional().trim(),
    body("category_ids").isArray().withMessage("Category IDs must be an array"),
    body("images").optional().isArray().withMessage("Images must be an array"),
    body("attributes")
      .optional()
      .isObject()
      .withMessage("Attributes must be an object"),
    body("specifications")
      .optional()
      .isObject()
      .withMessage("Specifications must be an object"),
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
        name,
        sku,
        price,
        sale_price,
        stock_quantity = 0,
        description,
        short_description,
        category_ids,
        images = [],
        attributes = {},
        specifications = {},
        weight,
        dimensions,
        featured = false,
        manage_stock = true,
      } = req.body;

      // Create slug
      const slug = createSlug(name);

      // Check if SKU or slug already exists
      const existingProduct = await executeQuery(
        "SELECT id FROM products WHERE sku = ? OR slug = ?",
        [sku, slug],
      );

      if (existingProduct.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Product with this SKU or name already exists",
        });
      }

      // Validate categories
      if (category_ids.length > 0) {
        const validCategories = await executeQuery(
          `SELECT id FROM categories WHERE id IN (${category_ids.map(() => "?").join(",")}) AND is_active = true`,
          category_ids,
        );

        if (validCategories.length !== category_ids.length) {
          return res.status(400).json({
            success: false,
            message: "One or more categories are invalid",
          });
        }
      }

      // Create product
      const result = await executeQuery(
        `
      INSERT INTO products (
        name, slug, sku, price, sale_price, stock_quantity, 
        description, short_description, images, attributes, specifications,
        weight, dimensions, featured, manage_stock
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
        [
          name,
          slug,
          sku,
          price,
          sale_price || null,
          stock_quantity,
          description || null,
          short_description || null,
          JSON.stringify(images),
          JSON.stringify(attributes),
          JSON.stringify(specifications),
          weight || null,
          dimensions || null,
          featured,
          manage_stock,
        ],
      );

      const productId = result.insertId;

      // Add product categories
      // if (category_ids.length > 0) {
      //   const categoryValues = category_ids.map((categoryId) => [
      //     productId,
      //     categoryId,
      //   ]);
      //   await executeQuery(
      //     "INSERT INTO product_categories (product_id, category_id) VALUES ?",
      //     [categoryValues],
      //   );
      // }
      if (category_ids.length > 0) {
        const categoryValues = category_ids.map((categoryId) => [
          productId,
          categoryId,
        ]);

        // Tạo placeholders dạng "(?, ?), (?, ?), ..."
        const placeholders = categoryValues.map(() => "(?, ?)").join(", ");
        const flatValues = categoryValues.flat();

        await executeQuery(
          `INSERT INTO product_categories (product_id, category_id) VALUES ${placeholders}`,
          flatValues,
        );
      }
      // Get created product
      const newProduct = await executeQuery(
        "SELECT * FROM products WHERE id = ?",
        [productId],
      );

      res.status(201).json({
        success: true,
        message: "Product created successfully",
        data: newProduct[0],
      });
    } catch (error) {
      console.error("Create product error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

// Update product (Admin only)
router.put(
  "/:id",
  authenticateToken,
  requireAdmin,
  [
    param("id").isInt().withMessage("Invalid product ID"),
    body("name")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Product name cannot be empty"),
    body("sku").optional().trim().notEmpty().withMessage("SKU cannot be empty"),
    body("price")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Valid price required"),
    body("sale_price")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Valid sale price required"),
    body("stock_quantity")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Valid stock quantity required"),
  ],
  async (req, res) => {
    console.log(body);
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

      // Check if product exists
      const existingProduct = await executeQuery(
        "SELECT * FROM products WHERE id = ?",
        [id],
      );

      if (existingProduct.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      const updateFields = [];
      const updateValues = [];

      // Build update query dynamically
      Object.keys(updateData).forEach((key) => {
        if (key === "category_ids") return; // Handle separately

        if (["images", "attributes", "specifications"].includes(key)) {
          updateFields.push(`${key} = ?`);
          updateValues.push(JSON.stringify(updateData[key]));
        } else if (key === "name") {
          const slug = createSlug(updateData[key]);
          updateFields.push("name = ?", "slug = ?");
          updateValues.push(updateData[key], slug);
        } else {
          updateFields.push(`${key} = ?`);
          updateValues.push(updateData[key]);
        }
      });

      if (updateFields.length > 0) {
        updateValues.push(id);
        await executeQuery(
          `UPDATE products SET ${updateFields.join(", ")} WHERE id = ?`,
          updateValues,
        );
      }

      // Update categories if provided
      if (updateData.category_ids) {
        // Remove existing categories
        await executeQuery(
          "DELETE FROM product_categories WHERE product_id = ?",
          [id],
        );

        // Add new categories
        // if (updateData.category_ids.length > 0) {
        //   const categoryValues = updateData.category_ids.map((categoryId) => [
        //     id,
        //     categoryId,
        //   ]);
        //   await executeQuery(
        //     "INSERT INTO product_categories (product_id, category_id) VALUES ?",
        //     [categoryValues],
        //   );
        // }
        if (updateData.category_ids.length > 0) {
          const categoryValues = updateData.category_ids.map((categoryId) => [
            id,
            categoryId,
          ]);

          // Tạo placeholders: "(?, ?), (?, ?), ..."
          const placeholders = categoryValues.map(() => "(?, ?)").join(", ");
          const flatValues = categoryValues.flat();

          await executeQuery(
            `INSERT INTO product_categories (product_id, category_id) VALUES ${placeholders}`,
            flatValues,
          );
        }
      }

      // Get updated product
      const updatedProduct = await executeQuery(
        "SELECT * FROM products WHERE id = ?",
        [id],
      );

      res.json({
        success: true,
        message: "Product updated successfully",
        data: updatedProduct[0],
      });
    } catch (error) {
      console.error("Update product error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

// Delete product (Admin only)
router.delete(
  "/:id",
  authenticateToken,
  requireAdmin,
  [param("id").isInt().withMessage("Invalid product ID")],
  async (req, res) => {
    try {
      const { id } = req.params;

      // Check if product exists
      const product = await executeQuery(
        "SELECT * FROM products WHERE id = ?",
        [id],
      );

      if (product.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      // Check if product has orders
      const orders = await executeQuery(
        "SELECT COUNT(*) as count FROM order_items WHERE product_id = ?",
        [id],
      );

      if (orders[0].count > 0) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete product with existing orders",
        });
      }

      // Delete product (cascades will handle related records)
      await executeQuery("DELETE FROM products WHERE id = ?", [id]);

      res.json({
        success: true,
        message: "Product deleted successfully",
      });
    } catch (error) {
      console.error("Delete product error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

// Get product reviews
router.get(
  "/:id/reviews",
  [
    param("id").isInt().withMessage("Invalid product ID"),
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Invalid page number"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("Invalid limit"),
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Get total count
      const countResult = await executeQuery(
        "SELECT COUNT(*) as total FROM product_reviews WHERE product_id = ? AND is_approved = TRUE",
        [id],
      );
      const totalReviews = countResult[0].total;

      // Get reviews
      const reviews = await executeQuery(
        `
      SELECT 
        pr.*,
        u.full_name as user_name
      FROM product_reviews pr
      JOIN users u ON pr.user_id = u.id
                              WHERE pr.product_id = ? AND pr.is_approved = TRUE
      ORDER BY pr.created_at DESC
      LIMIT ? OFFSET ?
    `,
        [id, parseInt(limit), offset],
      );

      const totalPages = Math.ceil(totalReviews / parseInt(limit));

      res.json({
        success: true,
        data: {
          reviews,
          pagination: {
            current_page: parseInt(page),
            total_pages: totalPages,
            total_reviews: totalReviews,
            has_next: parseInt(page) < totalPages,
            has_prev: parseInt(page) > 1,
          },
        },
      });
    } catch (error) {
      console.error("Get product reviews error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

export default router;
