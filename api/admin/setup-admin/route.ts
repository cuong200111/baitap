import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    // Check if admin user already exists
    const existingAdmin = executeQuery("SELECT id FROM users WHERE email = ?", [
      "admin@hacom.vn",
    ]);

    if (existingAdmin.length > 0) {
      return NextResponse.json({
        success: true,
        message: "Admin user already exists",
        data: { adminId: existingAdmin[0].id },
      });
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash("admin123", 12);

    try {
      executeQuery(
        `INSERT INTO users (email, password, full_name, role, is_active, created_at) 
         VALUES (?, ?, ?, ?, ?, datetime('now'))`,
        ["admin@hacom.vn", hashedPassword, "Admin HACOM", "admin", 1],
      );

      // Get the created admin user
      const newAdmin = executeQuery(
        "SELECT id, email, full_name, role FROM users WHERE email = ?",
        ["admin@hacom.vn"],
      );

      return NextResponse.json({
        success: true,
        message: "Admin user created successfully",
        data: { admin: newAdmin[0] },
      });
    } catch (dbError) {
      console.error("Database error creating admin:", dbError);
      return NextResponse.json(
        {
          success: false,
          message: "Failed to create admin user in database",
          error: dbError.message,
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Setup admin error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to setup admin user",
        error: error.message,
      },
      { status: 500 },
    );
  }
}
