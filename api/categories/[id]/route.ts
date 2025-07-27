import { NextRequest, NextResponse } from "next/server";
import Database from "better-sqlite3";
import { join } from "path";

// Helper function to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, "a")
    .replace(/[èéẹẻẽêềếệểễ]/g, "e")
    .replace(/[ìíịỉĩ]/g, "i")
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, "o")
    .replace(/[ùúụủũưừứựửữ]/g, "u")
    .replace(/[ỳýỵỷỹ]/g, "y")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const categoryId = parseInt(params.id);
    if (isNaN(categoryId)) {
      return NextResponse.json(
        {
          success: false,
          message: "ID danh mục không hợp lệ",
        },
        { status: 400 }
      );
    }

    const dbPath = join(process.cwd(), "hacom_ecommerce.db");
    const db = new Database(dbPath);

    const category = db
      .prepare(`
        SELECT c.*,
          (SELECT COUNT(*) FROM categories children WHERE children.parent_id = c.id AND children.is_active = 1) as children_count,
          (SELECT COUNT(*) FROM product_categories pc
           JOIN products p ON pc.product_id = p.id
           WHERE pc.category_id = c.id AND p.status = 'active') as products_count
        FROM categories c
        WHERE c.id = ?
      `)
      .get(categoryId);

    db.close();

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          message: "Không tìm thấy danh mục",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...category,
        is_active: Boolean(category.is_active),
      },
    });
  } catch (error) {
    console.error("Get category error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Không thể lấy thông tin danh mục",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const categoryId = parseInt(params.id);
    if (isNaN(categoryId)) {
      return NextResponse.json(
        {
          success: false,
          message: "ID danh mục không hợp lệ",
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, description, parent_id, sort_order, image, is_active } = body;

    const dbPath = join(process.cwd(), "hacom_ecommerce.db");
    const db = new Database(dbPath);

    // Check if category exists
    const existingCategory = db
      .prepare("SELECT * FROM categories WHERE id = ?")
      .get(categoryId);

    if (!existingCategory) {
      db.close();
      return NextResponse.json(
        {
          success: false,
          message: "Không tìm thấy danh mục",
        },
        { status: 404 }
      );
    }

    // Generate new slug if name changed
    let slug = existingCategory.slug;
    if (name && name.trim() !== existingCategory.name) {
      slug = generateSlug(name.trim());
      
      // Check if new slug already exists (excluding current category)
      const conflictCategory = db
        .prepare("SELECT id FROM categories WHERE slug = ? AND id != ?")
        .get(slug, categoryId);

      if (conflictCategory) {
        db.close();
        return NextResponse.json(
          {
            success: false,
            message: "Danh mục với tên này đã tồn tại",
          },
          { status: 400 }
        );
      }
    }

    // Prevent setting parent to itself or its children
    if (parent_id && parent_id === categoryId) {
      db.close();
      return NextResponse.json(
        {
          success: false,
          message: "Không thể đặt danh mục làm cha của chính nó",
        },
        { status: 400 }
      );
    }

    // Update category
    const updateStmt = db.prepare(`
      UPDATE categories SET
        name = COALESCE(?, name),
        slug = COALESCE(?, slug),
        description = ?,
        image = ?,
        parent_id = ?,
        sort_order = COALESCE(?, sort_order),
        is_active = COALESCE(?, is_active),
        updated_at = datetime('now')
      WHERE id = ?
    `);

    updateStmt.run(
      name?.trim() || null,
      slug,
      description?.trim() || null,
      image?.trim() || null,
      parent_id || null,
      sort_order || null,
      is_active !== undefined ? (is_active ? 1 : 0) : null,
      categoryId
    );

    // Get updated category
    const updatedCategory = db
      .prepare("SELECT * FROM categories WHERE id = ?")
      .get(categoryId);

    db.close();

    return NextResponse.json({
      success: true,
      message: "Cập nhật danh mục thành công",
      data: {
        ...updatedCategory,
        is_active: Boolean(updatedCategory.is_active),
      },
    });
  } catch (error) {
    console.error("Update category error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Không thể cập nhật danh mục",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const categoryId = parseInt(params.id);
    if (isNaN(categoryId)) {
      return NextResponse.json(
        {
          success: false,
          message: "ID danh mục không hợp lệ",
        },
        { status: 400 }
      );
    }

    const dbPath = join(process.cwd(), "hacom_ecommerce.db");
    const db = new Database(dbPath);

    // Check if category exists
    const existingCategory = db
      .prepare("SELECT * FROM categories WHERE id = ?")
      .get(categoryId);

    if (!existingCategory) {
      db.close();
      return NextResponse.json(
        {
          success: false,
          message: "Không tìm thấy danh mục",
        },
        { status: 404 }
      );
    }

    // Check if category has children
    const childrenCount = db
      .prepare("SELECT COUNT(*) as count FROM categories WHERE parent_id = ?")
      .get(categoryId);

    if (childrenCount.count > 0) {
      db.close();
      return NextResponse.json(
        {
          success: false,
          message: "Không thể xóa danh mục có danh mục con. Vui lòng xóa danh mục con trước.",
        },
        { status: 400 }
      );
    }

    // Check if category has products
    const productsCount = db
      .prepare(`
        SELECT COUNT(*) as count 
        FROM product_categories pc
        JOIN products p ON pc.product_id = p.id
        WHERE pc.category_id = ?
      `)
      .get(categoryId);

    if (productsCount.count > 0) {
      db.close();
      return NextResponse.json(
        {
          success: false,
          message: "Không thể xóa danh mục có sản phẩm. Vui lòng di chuyển sản phẩm sang danh mục khác trước.",
        },
        { status: 400 }
      );
    }

    // Delete the category
    const deleteStmt = db.prepare("DELETE FROM categories WHERE id = ?");
    deleteStmt.run(categoryId);

    db.close();

    return NextResponse.json({
      success: true,
      message: "Xóa danh mục thành công",
    });
  } catch (error) {
    console.error("Delete category error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Không thể xóa danh mục",
      },
      { status: 500 }
    );
  }
}
