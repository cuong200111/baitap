import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";

// Get order by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const orderId = parseInt(params.id);

    if (isNaN(orderId)) {
      return NextResponse.json(
        { success: false, message: "Invalid order ID" },
        { status: 400 },
      );
    }

    // Get order with user info
    const orderQuery = `
      SELECT 
        o.*,
        u.full_name as user_name,
        u.email as user_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `;

    const orderResult = executeQuery(orderQuery, [orderId]);

    if (!orderResult.length) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 },
      );
    }

    const order = orderResult[0];

    // Get order items with proper field mapping
    const itemsQuery = `
      SELECT 
        oi.id,
        oi.order_id,
        oi.product_id,
        oi.product_name,
        oi.product_sku as sku,
        oi.quantity,
        oi.price,
        oi.total,
        oi.created_at,
        COALESCE(p.images, '[]') as images,
        p.status as product_status
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
      ORDER BY oi.id
    `;

    const orderItems = executeQuery(itemsQuery, [orderId]);

    // Process items to parse images
    const processedItems = orderItems.map((item: any) => {
      let images = [];
      try {
        images = item.images ? JSON.parse(item.images) : [];
      } catch (e) {
        images = [];
      }

      return {
        ...item,
        images,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        ...order,
        items: processedItems,
      },
    });
  } catch (error) {
    console.error("Order detail API error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

// Update order status
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  console.log("PUT request received for order:", params.id);

  try {
    const orderId = parseInt(params.id);

    if (isNaN(orderId)) {
      console.log("Invalid order ID:", params.id);
      return NextResponse.json(
        { success: false, message: "Invalid order ID" },
        { status: 400 },
      );
    }

    // Clone the request to read body without consuming it
    const requestClone = request.clone();
    let body;

    try {
      const text = await requestClone.text();
      console.log("Raw request body:", text);

      if (!text) {
        return NextResponse.json(
          { success: false, message: "Empty request body" },
          { status: 400 },
        );
      }

      body = JSON.parse(text);
      console.log("Parsed body:", body);
    } catch (error) {
      console.error("Failed to parse JSON:", error);
      return NextResponse.json(
        { success: false, message: "Invalid JSON in request body" },
        { status: 400 },
      );
    }

    const { status, notes } = body;

    if (!status) {
      return NextResponse.json(
        { success: false, message: "Status is required" },
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
        {
          success: false,
          message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        },
        { status: 400 },
      );
    }

    console.log("Updating order", orderId, "to status:", status);

    // Update the order
    const updateQuery =
      notes !== undefined
        ? "UPDATE orders SET status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        : "UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";

    const updateParams =
      notes !== undefined ? [status, notes, orderId] : [status, orderId];

    const updateResult = executeQuery(updateQuery, updateParams);
    console.log("Update result:", updateResult);

    // Get updated order
    const updatedOrder = executeQuery("SELECT * FROM orders WHERE id = ?", [
      orderId,
    ])[0];

    if (!updatedOrder) {
      return NextResponse.json(
        { success: false, message: "Order not found after update" },
        { status: 404 },
      );
    }

    console.log("Order updated successfully:", updatedOrder);

    return NextResponse.json({
      success: true,
      message: "Order updated successfully",
      data: updatedOrder,
    });
  } catch (error) {
    console.error("Update order error:", error);
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
