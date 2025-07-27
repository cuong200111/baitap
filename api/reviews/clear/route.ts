import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";

export async function DELETE(request: NextRequest) {
  try {
    // Clear all reviews from database
    const result = executeQuery("DELETE FROM product_reviews", []);

    console.log("Cleared all reviews from database");

    return NextResponse.json({
      success: true,
      message: "Đã xóa tất cả đánh giá",
      data: {
        deletedCount: result.changes || 0,
      },
    });
  } catch (error) {
    console.error("Error clearing reviews:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Lỗi khi xóa đánh giá",
      },
      { status: 500 },
    );
  }
}
