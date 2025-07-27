import { NextRequest, NextResponse } from "next/server";
import Database from "better-sqlite3";
import { join } from "path";

export async function GET(request: NextRequest) {
  try {
    const dbPath = join(process.cwd(), "hacom_ecommerce.db");
    const db = new Database(dbPath);

    const stats = db
      .prepare(
        `
      SELECT 
        COUNT(*) as total_categories,
        COUNT(CASE WHEN parent_id IS NULL THEN 1 END) as main_categories,
        COUNT(CASE WHEN parent_id IS NOT NULL THEN 1 END) as subcategories,
        COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_categories
      FROM categories
    `,
      )
      .get();

    const sampleCategories = db
      .prepare(
        `
      SELECT name, slug, parent_id, image IS NOT NULL as has_image, description IS NOT NULL as has_description
      FROM categories 
      WHERE parent_id IS NULL 
      ORDER BY sort_order 
      LIMIT 10
    `,
      )
      .all();

    db.close();

    return NextResponse.json({
      success: true,
      stats,
      sample_main_categories: sampleCategories,
      message: "Category verification complete",
    });
  } catch (error) {
    console.error("Error verifying categories:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to verify categories",
        error: error.message,
      },
      { status: 500 },
    );
  }
}
