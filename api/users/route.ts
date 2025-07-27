import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";
import * as bcrypt from "bcryptjs";

interface User {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Get all users with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const role = searchParams.get("role");
    const search = searchParams.get("search");

    // Build WHERE clause
    let whereClause = "WHERE 1=1";
    const params: any[] = [];

    if (role) {
      whereClause += " AND role = ?";
      params.push(role);
    }

    if (search) {
      whereClause += " AND (full_name LIKE ? OR email LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
    const countResult = executeQuery(countQuery, params);
    const total = countResult[0]?.total || 0;

    // Get users with pagination
    const offset = (page - 1) * limit;
    const usersQuery = `
      SELECT 
        id, email, full_name, phone, role, is_active, 
        created_at, updated_at
      FROM users 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const users = executeQuery(usersQuery, [...params, limit, offset]);

    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Users API error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

// Create new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      full_name,
      phone,
      role = "user",
      is_active = true,
    } = body;

    if (!email || !password || !full_name) {
      return NextResponse.json(
        {
          success: false,
          message: "Email, password, and full name are required",
        },
        { status: 400 },
      );
    }

    // Check if user already exists
    const existingUser = executeQuery("SELECT id FROM users WHERE email = ?", [
      email,
    ]);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { success: false, message: "User with this email already exists" },
        { status: 400 },
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insert new user
    const insertQuery = `
      INSERT INTO users (email, password, full_name, phone, role, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const result = executeQuery(insertQuery, [
      email,
      hashedPassword,
      full_name,
      phone || null,
      role,
      is_active ? 1 : 0,
    ]);

    // Get the created user
    const newUser = executeQuery(
      "SELECT id, email, full_name, phone, role, is_active, created_at FROM users WHERE id = ?",
      [result.lastInsertRowid],
    )[0];

    return NextResponse.json({
      success: true,
      data: newUser,
      message: "User created successfully",
    });
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
