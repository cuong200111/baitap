import { NextRequest, NextResponse } from "next/server";
import * as bcrypt from "bcryptjs";
import { executeQuery } from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    // Check if admin user exists
    const users = executeQuery(
      "SELECT id, email, password, full_name, role, is_active FROM users WHERE email = ?",
      ["admin@hacom.vn"],
    );

    if (users.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Admin user not found in database",
        userCount: users.length,
      });
    }

    const user = users[0];

    // Test password verification
    const testPassword = "admin123";
    const isPasswordValid = await bcrypt.compare(testPassword, user.password);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        is_active: user.is_active,
        hasPassword: !!user.password,
        passwordLength: user.password ? user.password.length : 0,
      },
      passwordTest: {
        inputPassword: testPassword,
        isValid: isPasswordValid,
        hashPrefix: user.password
          ? user.password.substring(0, 10) + "..."
          : "no hash",
      },
    });
  } catch (error) {
    console.error("Debug auth error:", error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Force recreate admin user
    const bcrypt = require("bcryptjs");

    // Delete existing admin user
    executeQuery("DELETE FROM users WHERE email = ?", ["admin@hacom.vn"]);

    // Create new admin user with fresh hash
    const hashedPassword = await bcrypt.hash("admin123", 12);

    const result = executeQuery(
      "INSERT INTO users (email, password, full_name, phone, role, is_active) VALUES (?, ?, ?, ?, ?, ?)",
      ["admin@hacom.vn", hashedPassword, "Admin HACOM", null, "admin", 1],
    );

    return NextResponse.json({
      success: true,
      message: "Admin user recreated successfully",
      insertResult: result,
    });
  } catch (error) {
    console.error("Error recreating admin user:", error);
    return NextResponse.json({
      success: false,
      error: error.message,
    });
  }
}
