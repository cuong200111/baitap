import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";

// Get orders (for admin or user)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    console.log("Orders GET API called with params:", {
      userId,
      status,
      page,
      limit,
      offset,
    });

    let whereConditions = [];
    let params: any[] = [];

    // Filter by user (for regular users)
    if (userId) {
      whereConditions.push("o.user_id = ?");
      params.push(parseInt(userId));
    }

    // Filter by status
    if (status && status !== "all") {
      whereConditions.push("o.status = ?");
      params.push(status);
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    console.log("Where clause:", whereClause, "Params:", params);

    // Get total count
    const countQuery = `SELECT COUNT(*) as count FROM orders o ${whereClause}`;
    const countResult = executeQuery(countQuery, params);
    const total = countResult[0]?.count || 0;

    console.log("Total orders found:", total);

    // Get orders with user info
    const ordersQuery = `
      SELECT 
        o.*,
        u.full_name as user_name,
        u.email as user_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const orders = executeQuery(ordersQuery, [...params, limit, offset]);
    console.log("Orders found:", orders.length, "orders");

    if (orders.length > 0) {
      console.log("Sample order:", orders[0]);
    }

    // Get order items for each order
    const orderIds = orders.map((order: any) => order.id);
    let orderItemsMap: Record<number, any[]> = {};

    if (orderIds.length > 0) {
      const itemsQuery = `
        SELECT 
          oi.*,
          p.images,
          p.status as product_status
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id IN (${orderIds.map(() => "?").join(",")})
        ORDER BY oi.id
      `;

      const orderItems = executeQuery(itemsQuery, orderIds);

      orderItems.forEach((item: any) => {
        if (!orderItemsMap[item.order_id]) {
          orderItemsMap[item.order_id] = [];
        }

        // Parse images
        let images = [];
        try {
          images = item.images ? JSON.parse(item.images) : [];
        } catch (e) {
          images = [];
        }

        orderItemsMap[item.order_id].push({
          ...item,
          images,
        });
      });
    }

    // Attach items to orders
    const processedOrders = orders.map((order: any) => ({
      ...order,
      items: orderItemsMap[order.id] || [],
    }));

    return NextResponse.json({
      success: true,
      data: {
        orders: processedOrders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Orders API error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

// Create new order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Order creation request body:", JSON.stringify(body, null, 2));

    const {
      user_id,
      items, // Array of {product_id, quantity, price}
      shipping_address,
      billing_address,
      customer_name,
      customer_email,
      customer_phone,
      notes,
    } = body;

    // Log validation details
    console.log("Validation check:");
    console.log(
      "- items:",
      items ? `Array of ${items.length} items` : "MISSING",
    );
    console.log(
      "- shipping_address:",
      shipping_address ? "PROVIDED" : "MISSING",
    );
    console.log("- customer_name:", customer_name ? "PROVIDED" : "MISSING");
    console.log("- customer_email:", customer_email ? "PROVIDED" : "MISSING");
    console.log("- user_id:", user_id || "null (guest order)");

    // Validate required fields (user_id can be null for guest orders)
    if (
      !items ||
      !items.length ||
      !shipping_address ||
      !customer_name ||
      !customer_email
    ) {
      const missingFields = [];
      if (!items || !items.length) missingFields.push("items");
      if (!shipping_address) missingFields.push("shipping_address");
      if (!customer_name) missingFields.push("customer_name");
      if (!customer_email) missingFields.push("customer_email");

      console.error("Missing required fields:", missingFields);
      return NextResponse.json(
        {
          success: false,
          message: `Missing required fields: ${missingFields.join(", ")}`,
          missing_fields: missingFields,
        },
        { status: 400 },
      );
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Calculate total
    let totalAmount = 0;
    const validatedItems = [];

    // Validate each item and calculate total
    for (const item of items) {
      const product = executeQuery(
        "SELECT id, name, sku, price, sale_price, stock_quantity, status FROM products WHERE id = ?",
        [item.product_id],
      )[0];

      if (!product) {
        return NextResponse.json(
          { success: false, message: `Product ${item.product_id} not found` },
          { status: 400 },
        );
      }

      if (product.status !== "active") {
        return NextResponse.json(
          {
            success: false,
            message: `Product ${product.name} is not available`,
          },
          { status: 400 },
        );
      }

      if (item.quantity > product.stock_quantity) {
        return NextResponse.json(
          { success: false, message: `Insufficient stock for ${product.name}` },
          { status: 400 },
        );
      }

      const finalPrice = product.sale_price || product.price;
      const itemTotal = finalPrice * item.quantity;
      totalAmount += itemTotal;

      validatedItems.push({
        product_id: product.id,
        product_name: product.name,
        product_sku: product.sku,
        quantity: item.quantity,
        price: finalPrice,
        total: itemTotal,
      });
    }

    // Create order
    console.log("Creating order with params:", {
      user_id: user_id || null,
      orderNumber,
      totalAmount,
      customer_name,
      customer_email,
      customer_phone: customer_phone || null,
    });

    const orderResult = executeQuery(
      `
      INSERT INTO orders (
        user_id, order_number, status, total_amount,
        shipping_address, billing_address, customer_name,
        customer_email, customer_phone, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        user_id || null, // Ensure null for guest orders
        orderNumber,
        "pending",
        totalAmount,
        shipping_address,
        billing_address || shipping_address,
        customer_name,
        customer_email,
        customer_phone || null,
        notes || null,
      ],
    );

    console.log("Order creation result:", orderResult);

    const orderId = orderResult.insertId;

    // Create order items
    for (const item of validatedItems) {
      executeQuery(
        `
        INSERT INTO order_items (
          order_id, product_id, product_name, product_sku,
          quantity, price, total
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
        [
          orderId,
          item.product_id,
          item.product_name,
          item.product_sku,
          item.quantity,
          item.price,
          item.total,
        ],
      );

      // Update product stock
      executeQuery(
        "UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?",
        [item.quantity, item.product_id],
      );
    }

    // Clear cart for authenticated users only
    if (user_id) {
      executeQuery("DELETE FROM cart WHERE user_id = ?", [user_id]);
    }

    // Get the created order
    const createdOrder = executeQuery("SELECT * FROM orders WHERE id = ?", [
      orderId,
    ])[0];

    return NextResponse.json({
      success: true,
      message: "Order created successfully",
      data: {
        id: orderId,
        order_number: orderNumber,
        ...createdOrder,
      },
    });
  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
