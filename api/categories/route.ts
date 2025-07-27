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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const megaMenu = searchParams.get("mega_menu") === "true";
    const parentId = searchParams.get("parent_id");
    const flat = searchParams.get("flat") === "true";

    const dbPath = join(process.cwd(), "hacom_ecommerce.db");
    const db = new Database(dbPath);

    // If mega_menu is requested, return hierarchical data
    if (megaMenu) {
      // Get all main categories (parent_id IS NULL)
      const mainCategoriesQuery = `
        SELECT c.*,
          (SELECT COUNT(*) FROM categories children WHERE children.parent_id = c.id AND children.is_active = 1) as children_count
        FROM categories c
        WHERE c.parent_id IS NULL AND c.is_active = 1
        ORDER BY c.sort_order ASC
      `;

      const mainCategories = db.prepare(mainCategoriesQuery).all();

      // For each main category, get its subcategories and their children
      const result = [];

      for (const mainCat of mainCategories) {
        const subcategoriesQuery = `
          SELECT c.*,
            (SELECT COUNT(*) FROM categories children WHERE children.parent_id = c.id AND children.is_active = 1) as children_count
          FROM categories c
          WHERE c.parent_id = ? AND c.is_active = 1
          ORDER BY c.sort_order ASC
        `;

        const subcategories = db.prepare(subcategoriesQuery).all(mainCat.id);

        // For each subcategory, get its children
        const subcategoriesWithChildren = [];
        for (const subcat of subcategories) {
          const childrenQuery = `
            SELECT c.* FROM categories c
            WHERE c.parent_id = ? AND c.is_active = 1
            ORDER BY c.sort_order ASC
          `;

          const children = db.prepare(childrenQuery).all(subcat.id);

          subcategoriesWithChildren.push({
            ...subcat,
            children: children,
          });
        }

        result.push({
          ...mainCat,
          subcategories: subcategoriesWithChildren,
          is_active: Boolean(mainCat.is_active),
        });
      }

      db.close();

      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    // Regular category listing
    let whereConditions = ["is_active = 1"];
    let params = [];

    // Filter by parent_id - only if not flat mode
    if (!flat) {
      if (parentId === "null" || !parentId) {
        // Show root categories (no parent) by default
        whereConditions.push("parent_id IS NULL");
      } else if (parentId && parentId !== "all") {
        whereConditions.push("parent_id = ?");
        params.push(parseInt(parentId));
      }
    }
    // In flat mode, we get all categories regardless of parent_id

    const whereClause = whereConditions.join(" AND ");

    // Get categories with product counts
    const categoriesQuery = `
      SELECT c.*,
        (SELECT COUNT(*) FROM categories children WHERE children.parent_id = c.id AND children.is_active = 1) as children_count,
        (SELECT COUNT(*) FROM product_categories pc
         JOIN products p ON pc.product_id = p.id
         WHERE pc.category_id = c.id AND p.status = 'active') as products_count
      FROM categories c
      WHERE ${whereClause}
      ORDER BY c.sort_order ASC, c.name ASC
    `;

    const stmt = db.prepare(categoriesQuery);
    const categories = stmt.all(...params);

    // Process categories and add children if not flat
    const processedCategories = categories.map((category: any) => ({
      ...category,
      is_active: Boolean(category.is_active),
      children: [], // Will be populated below if needed
    }));

    // If not flat mode, get children for each category recursively
    if (!flat) {
      const loadChildrenRecursively = (category: any) => {
        if (category.children_count > 0) {
          const childrenQuery = `
            SELECT c.*,
              (SELECT COUNT(*) FROM categories children WHERE children.parent_id = c.id AND children.is_active = 1) as children_count,
              (SELECT COUNT(*) FROM product_categories pc
               JOIN products p ON pc.product_id = p.id
               WHERE pc.category_id = c.id AND p.status = 'active') as products_count
            FROM categories c
            WHERE c.parent_id = ? AND c.is_active = 1
            ORDER BY c.sort_order ASC, c.name ASC
          `;

          const childrenStmt = db.prepare(childrenQuery);
          const children = childrenStmt.all(category.id);
          category.children = children.map((child: any) => {
            const processedChild = {
              ...child,
              is_active: Boolean(child.is_active),
              children: [],
            };
            // Recursively load children for this child
            loadChildrenRecursively(processedChild);
            return processedChild;
          });
        }
      };

      for (const category of processedCategories) {
        loadChildrenRecursively(category);
      }
    }

    db.close();

    return NextResponse.json({
      success: true,
      data: processedCategories,
    });
  } catch (error) {
    console.error("Categories API error:", error);
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
    const { name, description, parent_id, sort_order, image } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Tên danh mục là bắt buộc",
        },
        { status: 400 },
      );
    }

    const dbPath = join(process.cwd(), "hacom_ecommerce.db");
    const db = new Database(dbPath);

    // Generate slug from name
    const slug = generateSlug(name.trim());

    // Check if slug already exists
    const existingCategory = db
      .prepare("SELECT id FROM categories WHERE slug = ?")
      .get(slug);

    if (existingCategory) {
      db.close();
      return NextResponse.json(
        {
          success: false,
          message: "Danh mục với tên này đã tồn tại",
        },
        { status: 400 },
      );
    }

    // Insert new category
    const insertStmt = db.prepare(`
      INSERT INTO categories (
        name, slug, description, image, parent_id, sort_order, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
    `);

    const result = insertStmt.run(
      name.trim(),
      slug,
      description?.trim() || null,
      image?.trim() || null,
      parent_id || null,
      sort_order || 0,
    );

    // Get the created category
    const newCategory = db
      .prepare("SELECT * FROM categories WHERE id = ?")
      .get(result.lastInsertRowid);

    db.close();

    return NextResponse.json({
      success: true,
      message: "Tạo danh mục thành công",
      data: {
        ...newCategory,
        is_active: Boolean(newCategory.is_active),
      },
    });
  } catch (error) {
    console.error("Create category error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Không thể tạo danh mục",
      },
      { status: 500 },
    );
  }
}
