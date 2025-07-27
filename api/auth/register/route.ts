import { NextRequest, NextResponse } from "next/server";
import * as bcrypt from "bcryptjs";
import { executeQuery } from "@/lib/database";

function generateToken(user: any) {
  // Simple token generation (in production, use JWT)
  return btoa(
    JSON.stringify({ id: user.id, email: user.email, role: user.role }),
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, full_name, phone } = body;

    // Validation
    if (!email || !password || !full_name) {
      return NextResponse.json(
        {
          success: false,
          message: "Email, password, and full name are required",
        },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 6 characters",
        },
        { status: 400 },
      );
    }

    // Check if user already exists
    const existingUsers = executeQuery(
      "SELECT id, email FROM users WHERE email = ?",
      [email.toLowerCase()],
    );

    if (existingUsers.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "User already exists with this email",
        },
        { status: 400 },
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user in database
    const result = executeQuery(
      `INSERT INTO users (email, password, full_name, phone, role, is_active)
       VALUES (?, ?, ?, ?, 'user', 1)`,
      [email.toLowerCase(), hashedPassword, full_name, phone || null],
    ) as { insertId: number; affectedRows: number };

    // Get the created user
    const newUsers = executeQuery(
      "SELECT id, email, full_name, phone, role, is_active, created_at FROM users WHERE id = ?",
      [result.insertId],
    );

    const newUser = newUsers[0];

    // Generate token
    const token = generateToken(newUser);

    return NextResponse.json(
      {
        success: true,
        message: "User registered successfully",
        data: {
          user: newUser,
          token,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    );
  }
}
