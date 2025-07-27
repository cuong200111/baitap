import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";

export async function POST(request: NextRequest) {
  try {
    console.log("Test order update API called");

    const body = await request.json();
    console.log("Request body:", body);

    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { success: false, message: "Order ID and status are required" },
        { status: 400 },
      );
    }

    const validStatuses = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status" },
        { status: 400 },
      );
    }

    // Test the database query
    console.log("Updating order:", orderId, "to status:", status);

    executeQuery(
      "UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [status, parseInt(orderId)],
    );

    console.log("Update successful");

    return NextResponse.json({
      success: true,
      message: "Order updated successfully",
    });
  } catch (error) {
    console.error("Test order update error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error.message,
      },
      { status: 500 },
    );
  }
}
