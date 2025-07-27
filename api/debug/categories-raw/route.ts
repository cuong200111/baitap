import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    const db = getDatabase();

    if (!db) {
      return NextResponse.json({
        success: false,
        message: "Database not available",
        data: [],
      });
    }

    // Get all categories directly from database
    const categories = db
      .prepare("SELECT * FROM categories ORDER BY sort_order ASC, name ASC")
      .all();

    return NextResponse.json({
      success: true,
      message: "Raw categories from database",
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    console.error("Debug categories error:", error);
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
