import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";

// Clear all mock reviews - use database only
const reviews: any[] = [];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("product_id");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          message: "Product ID is required",
        },
        { status: 400 },
      );
    }

    // Get reviews from database only
    let productReviews = [];
    try {
      const dbReviews = executeQuery(
        `SELECT r.*, u.full_name, u.email, u.avatar
         FROM product_reviews r
         LEFT JOIN users u ON r.user_id = u.id
         WHERE r.product_id = ? AND r.is_approved = 1
         ORDER BY r.created_at DESC`,
        [parseInt(productId)],
      );

      productReviews = dbReviews.map((review) => ({
        ...review,
        user_name: review.full_name,
        verified_purchase: Boolean(review.verified_purchase),
        is_approved: Boolean(review.is_approved),
      }));
    } catch (error) {
      console.error("Error fetching reviews from database:", error);
      productReviews = [];
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedReviews = productReviews.slice(startIndex, endIndex);

    // Calculate summary
    const totalReviews = productReviews.length;
    const avgRating =
      totalReviews > 0
        ? productReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;

    const summary = {
      total_reviews: totalReviews,
      average_rating: avgRating,
      rating_5_count: productReviews.filter((r) => r.rating === 5).length,
      rating_4_count: productReviews.filter((r) => r.rating === 4).length,
      rating_3_count: productReviews.filter((r) => r.rating === 3).length,
      rating_2_count: productReviews.filter((r) => r.rating === 2).length,
      rating_1_count: productReviews.filter((r) => r.rating === 1).length,
    };

    return NextResponse.json({
      success: true,
      data: {
        reviews: paginatedReviews,
        summary,
        pagination: {
          current_page: page,
          per_page: limit,
          total: totalReviews,
          total_pages: Math.ceil(totalReviews / limit),
        },
      },
    });
  } catch (error) {
    console.error("Reviews API error:", error);
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
    const { product_id, rating, title, comment } = body;

    // Validate required fields
    if (!product_id || !rating) {
      return NextResponse.json(
        {
          success: false,
          message: "Product ID and rating are required",
        },
        { status: 400 },
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        {
          success: false,
          message: "Rating must be between 1 and 5",
        },
        { status: 400 },
      );
    }

    // Get user from token
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    console.log("Auth header:", authHeader);
    console.log("Token:", token ? "Present" : "Missing");

    if (!token) {
      console.log("No token provided in review submission");
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required",
        },
        { status: 401 },
      );
    }

    // Parse base64 token (same as auth/profile API)
    let tokenData;
    try {
      const decoded = atob(token);
      tokenData = JSON.parse(decoded);
    } catch (error) {
      console.error("Token parsing error:", error);
      return NextResponse.json(
        {
          success: false,
          message: "Invalid token format",
        },
        { status: 401 },
      );
    }

    // Get user from database
    let user;
    try {
      const userResult = executeQuery(
        "SELECT * FROM users WHERE id = ? AND is_active = 1",
        [tokenData.id],
      );

      if (!userResult || userResult.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "User not found",
          },
          { status: 401 },
        );
      }

      user = userResult[0];
    } catch (error) {
      console.error("Database error when getting user:", error);
      return NextResponse.json(
        {
          success: false,
          message: "Database error",
        },
        { status: 500 },
      );
    }

    // Check if user already reviewed this product
    try {
      const existingReviewResult = executeQuery(
        "SELECT id FROM product_reviews WHERE product_id = ? AND user_id = ?",
        [product_id, user.id],
      );

      if (existingReviewResult && existingReviewResult.length > 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Bạn đã đánh giá sản ph���m này rồi",
          },
          { status: 400 },
        );
      }

      // Insert new review into database
      const insertResult = executeQuery(
        `INSERT INTO product_reviews (product_id, user_id, rating, title, comment, is_approved, helpful_count, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [product_id, user.id, rating, title || null, comment || null, 1, 0],
      );

      console.log("Review inserted successfully:", insertResult);

      // No need to retrieve the review - just confirm insertion was successful
      if (!insertResult || !insertResult.lastInsertRowid) {
        throw new Error("Failed to insert review into database");
      }
    } catch (dbError) {
      console.error("Database error when creating review:", dbError);

      // If database fails, reject the request instead of using fallback
      return NextResponse.json(
        {
          success: false,
          message: "Không thể lưu đánh giá vào cơ sở dữ liệu",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Đánh giá của bạn đã được gửi thành công!",
      data: {
        rating: parseInt(rating),
        title: title,
        comment: comment,
      },
    });
  } catch (error) {
    console.error("Reviews POST API error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    );
  }
}
