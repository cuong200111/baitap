import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    // Get all customer addresses
    const addresses = executeQuery("SELECT * FROM customer_addresses");
    
    // Get users for reference
    const users = executeQuery("SELECT id, email, full_name FROM users");
    
    return NextResponse.json({
      success: true,
      data: {
        addresses,
        users,
        total_addresses: addresses.length,
        total_users: users.length,
      },
    });
  } catch (error: any) {
    console.error("Debug customer addresses error:", error);
    return NextResponse.json({
      success: false,
      message: "Error fetching data",
      error: error.message,
    });
  }
}
