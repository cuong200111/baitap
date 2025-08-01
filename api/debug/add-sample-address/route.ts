import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: "userId is required",
      });
    }
    
    // Check if user exists
    const users = executeQuery("SELECT * FROM users WHERE id = ?", [userId]);
    if (users.length === 0) {
      return NextResponse.json({
        success: false,
        message: "User not found",
      });
    }
    
    const user = users[0];
    
    // Check if user already has an address
    const existingAddresses = executeQuery(
      "SELECT * FROM customer_addresses WHERE user_id = ?", 
      [userId]
    );
    
    if (existingAddresses.length > 0) {
      return NextResponse.json({
        success: false,
        message: "User already has an address",
        data: existingAddresses[0],
      });
    }
    
    // Add sample address
    const result = executeQuery(
      `INSERT INTO customer_addresses 
       (user_id, type, full_name, phone, address_line_1, address_line_2, ward, district, city, is_default, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        userId,
        "default",
        user.full_name || "Sample Name",
        user.phone || "0900000000",
        "123 Đường ABC",
        null,
        "Phường Bến Nghé",
        "Quận 1", 
        "TP Hồ Chí Minh",
        1,
      ]
    );
    
    // Get the created address
    const newAddress = executeQuery(
      "SELECT * FROM customer_addresses WHERE id = ?",
      [result.insertId]
    );
    
    return NextResponse.json({
      success: true,
      message: "Sample address added successfully",
      data: newAddress[0],
    });
  } catch (error: any) {
    console.error("Add sample address error:", error);
    return NextResponse.json({
      success: false,
      message: "Error adding sample address",
      error: error.message,
    });
  }
}
