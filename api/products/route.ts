import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const featured = searchParams.get("featured");
    const categoryId = searchParams.get("category_id");
    const status = searchParams.get("status") || "active";
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "20");
    const page = parseInt(searchParams.get("page") || "1");
    const offset = (page - 1) * limit;

    // Build WHERE conditions
    let whereConditions = [];
    let params = [];

    // Always filter by status unless 'all' is specified
    if (status !== "all") {
      whereConditions.push("status = ?");
      params.push(status);
    }

    if (featured === "true") {
      whereConditions.push("featured = 1");
    }

    // Handle both single category_id and multiple category_ids
    const categoryIds = searchParams.get("category_ids");
    if (categoryIds) {
      // Multiple categories (comma-separated)
      const ids = categoryIds
        .split(",")
        .map((id) => parseInt(id.trim()))
        .filter((id) => !isNaN(id));
      if (ids.length > 0) {
        const placeholders = ids.map(() => "?").join(",");
        whereConditions.push(
          `id IN (SELECT product_id FROM product_categories WHERE category_id IN (${placeholders}))`,
        );
        params.push(...ids);
      }
    } else if (categoryId && categoryId !== "all") {
      // Single category (backward compatibility)
      whereConditions.push(
        "id IN (SELECT product_id FROM product_categories WHERE category_id = ?)",
      );
      params.push(parseInt(categoryId));
    }

    if (search) {
      whereConditions.push(
        "(name LIKE ? OR description LIKE ? OR short_description LIKE ?)",
      );
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    // Get total count
    const countQuery = `SELECT COUNT(*) as count FROM products ${whereClause}`;
    const countResult = executeQuery(countQuery, params);
    const total = countResult[0]?.count || 0;

    // Get products with pagination
    const productsQuery = `
      SELECT p.*,
        CASE WHEN p.sale_price > 0 THEN p.sale_price ELSE p.price END as final_price,
        CASE WHEN p.sale_price > 0 THEN ROUND(((p.price - p.sale_price) / p.price) * 100) ELSE 0 END as discount_percent
      FROM products p
      ${whereClause}
      ORDER BY p.featured DESC, p.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const products = executeQuery(productsQuery, [...params, limit, offset]);

    // Get categories for each product
    const productIds = products.map((p: any) => p.id);
    let categoriesMap: Record<number, any[]> = {};

    if (productIds.length > 0) {
      const categoriesQuery = `
        SELECT pc.product_id, c.id, c.name, c.slug
        FROM product_categories pc
        JOIN categories c ON pc.category_id = c.id
        WHERE pc.product_id IN (${productIds.map(() => "?").join(",")})
      `;
      const categoriesResult = executeQuery(categoriesQuery, productIds);

      categoriesResult.forEach((cat: any) => {
        if (!categoriesMap[cat.product_id]) {
          categoriesMap[cat.product_id] = [];
        }
        categoriesMap[cat.product_id].push({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
        });
      });
    }

    // Process products to parse JSON fields
    const processedProducts = products.map((product: any) => {
      let images = [];
      let specifications = {};

      try {
        images = product.images ? JSON.parse(product.images) : [];
      } catch (e) {
        images = [];
      }

      try {
        specifications = product.specifications
          ? JSON.parse(product.specifications)
          : {};
      } catch (e) {
        specifications = {};
      }

      return {
        ...product,
        images,
        specifications,
        categories: categoriesMap[product.id] || [],
        featured: Boolean(product.featured),
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        products: processedProducts,
        pagination: {
          current_page: page,
          per_page: limit,
          total,
          total_pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Products API error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      short_description,
      sku,
      price,
      sale_price,
      stock_quantity,
      featured,
      status,
      category_ids,
      images,
      specifications,
      weight,
      dimensions,
    } = body;

    // Validate required fields
    if (!name || !sku || !price) {
      return NextResponse.json(
        {
          success: false,
          message: "Tên, SKU và giá là bắt buộc",
        },
        { status: 400 },
      );
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, "")
      .replace(/\s+/g, "-");

    // Insert product
    const insertQuery = `
      INSERT INTO products (
        name, slug, description, short_description, sku, price, sale_price,
        stock_quantity, featured, status, images, specifications
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = executeQuery(insertQuery, [
      name,
      slug,
      description || null,
      short_description || null,
      sku,
      price,
      sale_price || null,
      stock_quantity || 0,
      featured ? 1 : 0,
      status || "active",
      JSON.stringify(images || []),
      JSON.stringify(specifications || {}),
    ]);

    const productId = result.insertId;

    // Insert product categories
    if (category_ids && category_ids.length > 0) {
      const categoryInsertQuery =
        "INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)";
      category_ids.forEach((categoryId: number) => {
        executeQuery(categoryInsertQuery, [productId, categoryId]);
      });
    }

    // Get the created product
    const getQuery = "SELECT * FROM products WHERE id = ?";
    const createdProduct = executeQuery(getQuery, [productId])[0];

    return NextResponse.json({
      success: true,
      message: "Tạo sản phẩm thành công",
      data: createdProduct,
    });
  } catch (error) {
    console.error("Create product error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Lỗi khi tạo sản phẩm",
      },
      { status: 500 },
    );
  }
}
