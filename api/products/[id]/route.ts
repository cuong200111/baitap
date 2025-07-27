import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const productId = parseInt(params.id);

    if (isNaN(productId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product ID",
        },
        { status: 400 },
      );
    }

        // Get product from database
    const productQuery = `
      SELECT p.*,
        CASE WHEN p.sale_price > 0 THEN p.sale_price ELSE p.price END as final_price,
        CASE WHEN p.sale_price > 0 THEN ROUND(((p.price - p.sale_price) / p.price) * 100) ELSE 0 END as discount_percent
      FROM products p
      WHERE p.id = ?
    `;

    const productResult = executeQuery(productQuery, [productId]);

    if (!productResult || productResult.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found",
        },
        { status: 404 },
      );
    }

    const product = productResult[0];

    // Process JSON fields
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

        // Get categories for the product
    const categoriesQuery = `
      SELECT c.id, c.name, c.slug
      FROM product_categories pc
      JOIN categories c ON pc.category_id = c.id
      WHERE pc.product_id = ?
    `;
    const categories = executeQuery(categoriesQuery, [productId]);

    const processedProduct = {
      ...product,
      images,
      specifications,
      categories,
      featured: Boolean(product.featured),
    };

    return NextResponse.json({
      success: true,
      data: processedProduct,
    });
  } catch (error) {
    console.error("Product detail API error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const productId = parseInt(params.id);

    if (isNaN(productId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product ID",
        },
        { status: 400 },
      );
    }

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

    // Update product
    const updateQuery = `
      UPDATE products SET
        name = ?, slug = ?, description = ?, short_description = ?, sku = ?,
        price = ?, sale_price = ?, stock_quantity = ?, featured = ?, status = ?,
        images = ?, specifications = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    executeQuery(updateQuery, [
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
      productId,
    ]);

    // Update product categories
    // First delete existing categories
    executeQuery("DELETE FROM product_categories WHERE product_id = ?", [
      productId,
    ]);

    // Insert new categories
    if (category_ids && category_ids.length > 0) {
      const categoryInsertQuery =
        "INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)";
      category_ids.forEach((categoryId: number) => {
        executeQuery(categoryInsertQuery, [productId, categoryId]);
      });
    }

    // Get the updated product
    const getQuery = "SELECT * FROM products WHERE id = ?";
    const updatedProduct = executeQuery(getQuery, [productId])[0];

    return NextResponse.json({
      success: true,
      message: "Cập nhật sản phẩm thành công",
      data: updatedProduct,
    });
  } catch (error) {
    console.error("Update product error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Lỗi khi cập nhật sản phẩm",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const productId = parseInt(params.id);

    if (isNaN(productId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product ID",
        },
        { status: 400 },
      );
    }

    // Delete product categories first
    executeQuery("DELETE FROM product_categories WHERE product_id = ?", [
      productId,
    ]);

    // Delete product
    executeQuery("DELETE FROM products WHERE id = ?", [productId]);

    return NextResponse.json({
      success: true,
      message: "Xóa sản phẩm thành công",
    });
  } catch (error) {
    console.error("Delete product error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Lỗi khi xóa sản phẩm",
      },
      { status: 500 },
    );
  }
}
