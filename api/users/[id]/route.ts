import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";
import * as bcrypt from "bcryptjs";

// Get user by ID
export async function GET(
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

    const user = executeQuery(
      "SELECT id, email, full_name, phone, role, is_active, created_at, updated_at FROM users WHERE id = ?",
      [userId],
    )[0];

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

// Update user
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
    const { email, full_name, phone, role, is_active } = body;

    // Check if user exists
    const existingUser = executeQuery("SELECT id FROM users WHERE id = ?", [
      userId,
    ])[0];

    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    // Check if email is already taken by another user
    if (email) {
      const emailCheck = executeQuery(
        "SELECT id FROM users WHERE email = ? AND id != ?",
        [email, userId],
      );

      if (emailCheck.length > 0) {
        return NextResponse.json(
          { success: false, message: "Email is already taken by another user" },
          { status: 400 },
        );
      }
    }

    // Build update query dynamically
    const updateFields = [];
    const updateParams = [];

    if (email !== undefined) {
      updateFields.push("email = ?");
      updateParams.push(email);
    }

    if (full_name !== undefined) {
      updateFields.push("full_name = ?");
      updateParams.push(full_name);
    }

    if (phone !== undefined) {
      updateFields.push("phone = ?");
      updateParams.push(phone);
    }

    if (role !== undefined) {
      updateFields.push("role = ?");
      updateParams.push(role);
    }

    if (is_active !== undefined) {
      updateFields.push("is_active = ?");
      updateParams.push(is_active ? 1 : 0);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { success: false, message: "No fields to update" },
        { status: 400 },
      );
    }

    updateFields.push("updated_at = CURRENT_TIMESTAMP");
    updateParams.push(userId);

    const updateQuery = `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`;
    executeQuery(updateQuery, updateParams);

    // Get updated user
    const updatedUser = executeQuery(
      "SELECT id, email, full_name, phone, role, is_active, created_at, updated_at FROM users WHERE id = ?",
      [userId],
    )[0];

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: "User updated successfully",
    });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

// Delete user
export async function DELETE(
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

    // Check if user exists
    const existingUser = executeQuery(
      "SELECT id, role FROM users WHERE id = ?",
      [userId],
    )[0];

    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    // Prevent deleting the last admin user
    if (existingUser.role === "admin") {
      const adminCount = executeQuery(
        "SELECT COUNT(*) as count FROM users WHERE role = 'admin'",
      )[0];

      if (adminCount.count <= 1) {
        return NextResponse.json(
          { success: false, message: "Cannot delete the last admin user" },
          { status: 400 },
        );
      }
    }

    // Delete user
    executeQuery("DELETE FROM users WHERE id = ?", [userId]);

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
