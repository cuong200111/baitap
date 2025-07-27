import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";
import * as bcrypt from "bcryptjs";

// Update user password
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const userId = parseInt(params.id);

    if (isNaN(userId)) {
      return NextResponse.json(
        { success: false, message: "Invalid user ID" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { password, currentPassword } = body;

    if (!password) {
      return NextResponse.json(
        { success: false, message: "New password is required" },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 6 characters long",
        },
        { status: 400 },
      );
    }

    // Check if user exists
    const existingUser = executeQuery(
      "SELECT id, password FROM users WHERE id = ?",
      [userId],
    )[0];

    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    // If current password is provided, verify it
    if (currentPassword) {
      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        existingUser.password,
      );

      if (!isCurrentPasswordValid) {
        return NextResponse.json(
          { success: false, message: "Current password is incorrect" },
          { status: 400 },
        );
      }
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update password
    executeQuery(
      "UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [hashedPassword, userId],
    );

    return NextResponse.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Update password error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
