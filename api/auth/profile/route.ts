import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";
import jwt from "jsonwebtoken";
import path from "path";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Helper function to verify JWT token
const verifyToken = (request: NextRequest) => {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("No token provided");
  }

  const token = authHeader.substring(7);
  const decoded = jwt.verify(token, JWT_SECRET) as any;
  return decoded;
};

// Get user profile
export async function GET(request: NextRequest) {
  try {
    const decoded = verifyToken(request);
    const userId = decoded.userId;

    let users = executeQuery("SELECT * FROM users WHERE id = ? OR email = ?", [
      userId,
      decoded.email,
    ]);

    // Fallback for admin user when database is reset or ID mismatch
    if (!users.length && decoded.email === "admin@hacom.vn") {
      users = [
        {
          id: userId,
          email: "admin@hacom.vn",
          full_name: "Admin HACOM",
          phone: null,
          role: "admin",
          is_active: 1,
          created_at: new Date().toISOString(),
        },
      ];
    }

    if (!users.length) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    const user = users[0];

    // Get user address from customer_addresses table
    let userAddress = null;
    try {
      const addresses = executeQuery(
        "SELECT * FROM customer_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC LIMIT 1",
        [user.id],
      );
      if (addresses.length > 0) {
        userAddress = addresses[0];
      }
    } catch (addressError) {
      console.error("Error fetching user address:", addressError);
      // Continue without address data if table doesn't exist
    }

    // Merge user data with address data
    const profileData = {
      ...user,
      is_active: Boolean(user.is_active),
    };

    // Add address data if available
    if (userAddress) {
      profileData.address = userAddress.address_line_1 || "";
      profileData.province_name = userAddress.city || "";
      profileData.district_name = userAddress.district || "";
      profileData.ward_name = userAddress.ward || "";
      profileData.address_line_2 = userAddress.address_line_2 || "";
      profileData.address_full_name = userAddress.full_name || "";
      profileData.address_phone = userAddress.phone || "";
    }

    return NextResponse.json({
      success: true,
      data: profileData,
    });
  } catch (error: any) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }
}

// Update user profile
export async function PUT(request: NextRequest) {
  try {
    const decoded = verifyToken(request);
    let userId = decoded.userId;

    // Ensure request has body
    if (!request.body) {
      return NextResponse.json(
        { success: false, message: "No request body provided" },
        { status: 400 },
      );
    }

    const contentType = request.headers.get("content-type") || "";
    let updateData: any = {};

    // Read the body only once based on content type
    try {
      if (contentType.includes("multipart/form-data")) {
        // Handle form data with file upload
        const formData = await request.formData();
        const file = formData.get("avatar") as File | null;

        // Extract all form data
        updateData = {};
        for (const [key, value] of formData.entries()) {
          if (key !== "avatar" && value) {
            updateData[key] = value.toString();
          }
        }

        // Handle avatar upload
        if (file && file.size > 0) {
          // Validate file type
          if (!file.type.startsWith("image/")) {
            return NextResponse.json(
              { success: false, message: "Only image files are allowed" },
              { status: 400 },
            );
          }

          // Validate file size (max 5MB)
          if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json(
              { success: false, message: "File size must be less than 5MB" },
              { status: 400 },
            );
          }

          // Create uploads directory if it doesn't exist
          const uploadDir = path.join(
            process.cwd(),
            "public",
            "uploads",
            "avatars",
          );
          if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
          }

          // Generate unique filename
          const timestamp = Date.now();
          const originalName = file.name;
          const extension = path.extname(originalName);
          const filename = `avatar-${userId}-${timestamp}${extension}`;
          const filepath = path.join(uploadDir, filename);

          // Write file to disk
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);
          await writeFile(filepath, buffer);

          updateData.avatar = `avatars/${filename}`;
        }
      } else if (contentType.includes("application/json")) {
        // Handle JSON data
        updateData = await request.json();
      } else {
        // Try to read as JSON if no specific content type is provided
        const text = await request.text();
        if (text) {
          try {
            updateData = JSON.parse(text);
          } catch (parseError) {
            return NextResponse.json(
              { success: false, message: "Invalid request format" },
              { status: 400 },
            );
          }
        } else {
          return NextResponse.json(
            { success: false, message: "No data provided" },
            { status: 400 },
          );
        }
      }
    } catch (bodyError) {
      console.error("Error reading request body:", bodyError);
      return NextResponse.json(
        { success: false, message: "Error reading request body" },
        { status: 400 },
      );
    }

    // Get existing user to check available columns - try both ID and email
    let existingUsers = executeQuery(
      "SELECT * FROM users WHERE id = ? OR email = ?",
      [userId, decoded.email],
    );

    // If no user found but it's admin, get the actual admin user
    if (!existingUsers.length && decoded.email === "admin@hacom.vn") {
      // Try to find admin by email only
      existingUsers = executeQuery("SELECT * FROM users WHERE email = ?", [
        "admin@hacom.vn",
      ]);

      if (existingUsers.length > 0) {
        // Update userId to match the actual database ID
        userId = existingUsers[0].id;
      } else {
        return NextResponse.json(
          { success: false, message: "Admin user not found in database" },
          { status: 404 },
        );
      }
    } else if (!existingUsers.length) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    const existingUser = existingUsers[0];
    const availableColumns = Object.keys(existingUser);

    // Filter out empty values and prepare update, only for columns that exist
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined && availableColumns.includes(key)) {
        // For address name fields, always update (can be null to clear)
        if (key.endsWith("_name")) {
          updateFields.push(`${key} = ?`);
          updateValues.push(value || null);
        }
        // For basic fields (full_name, phone, address), update if not empty
        else if (["full_name", "phone", "address"].includes(key)) {
          if (value !== null && value !== "") {
            updateFields.push(`${key} = ?`);
            updateValues.push(value);
          }
        }
        // Clear ID fields since we only store names now
        else if (key.endsWith("_id") && availableColumns.includes(key)) {
          updateFields.push(`${key} = ?`);
          updateValues.push(null);
        }
      }
    });

    // Always clear ID fields when updating profile
    ["province_id", "district_id", "ward_id"].forEach((idField) => {
      if (
        availableColumns.includes(idField) &&
        !updateFields.some((field) => field.startsWith(idField))
      ) {
        updateFields.push(`${idField} = ?`);
        updateValues.push(null);
      }
    });

    if (updateFields.length === 0) {
      return NextResponse.json(
        { success: false, message: "No valid fields to update" },
        { status: 400 },
      );
    }

    // Add user ID for WHERE clause
    updateValues.push(userId);

    try {
      // Update user
      executeQuery(
        `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`,
        updateValues,
      );
    } catch (dbError) {
      console.error("Database update error:", dbError);
      return NextResponse.json(
        {
          success: false,
          message: "Database update failed",
          error: dbError.message,
        },
        { status: 500 },
      );
    }

    // Get updated user data using the correct userId
    const updatedUsers = executeQuery("SELECT * FROM users WHERE id = ?", [
      userId,
    ]);

    if (!updatedUsers.length) {
      return NextResponse.json(
        { success: false, message: "Failed to retrieve updated user data" },
        { status: 500 },
      );
    }

    const updatedUser = updatedUsers[0];

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        ...updatedUser,
        is_active: Boolean(updatedUser.is_active),
      },
    });
  } catch (error: any) {
    console.error("Update profile error:", error);
    if (error.message === "No token provided") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update profile",
        error: error.message,
      },
      { status: 500 },
    );
  }
}

// Change password
export async function PATCH(request: NextRequest) {
  try {
    const decoded = verifyToken(request);
    const userId = decoded.userId;
    const { current_password, new_password } = await request.json();

    if (!current_password || !new_password) {
      return NextResponse.json(
        {
          success: false,
          message: "Current password and new password are required",
        },
        { status: 400 },
      );
    }

    // Get current user
    const users = executeQuery("SELECT password FROM users WHERE id = ?", [
      userId,
    ]);

    if (!users.length) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    // Verify current password
    const bcrypt = require("bcryptjs");
    const isValidPassword = await bcrypt.compare(
      current_password,
      users[0].password,
    );

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: "Current password is incorrect" },
        { status: 400 },
      );
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(new_password, 12);

    // Update password
    executeQuery(
      "UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [hashedNewPassword, userId],
    );

    return NextResponse.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error: any) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to change password" },
      { status: 500 },
    );
  }
}
