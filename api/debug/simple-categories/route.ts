import { NextRequest, NextResponse } from "next/server";
import Database from "better-sqlite3";
import { join } from "path";

export async function GET(request: NextRequest) {
  try {
    // Direct database access
    const dbPath = join(process.cwd(), "hacom_ecommerce.db");
    const db = new Database(dbPath);

    const categories = db
      .prepare(
        "SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order",
      )
      .all();

    db.close();

    return NextResponse.json({
      success: true,
      message: "Direct database query",
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    console.error("Simple categories error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error reading categories",
        error: error.message,
      },
      { status: 500 },
    );
  }
}
