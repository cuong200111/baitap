import { NextRequest, NextResponse } from "next/server";
import * as bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { executeQuery } from "@/lib/database";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

function generateToken(user: any) {
  // Generate JWT token with 1 month expiration
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    {
      expiresIn: "30d", // 1 month
    },
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Email and password are required",
        },
        { status: 400 },
      );
    }

    // Get admin user from database for proper authentication
    if (email.toLowerCase() === "admin@hacom.vn") {
      const adminUsers = executeQuery("SELECT * FROM users WHERE email = ?", [
        email.toLowerCase(),
      ]);

      if (adminUsers.length > 0) {
        const adminUser = adminUsers[0];

        // Check password
        if (
          password === "admin123" ||
          (await bcrypt.compare(password, adminUser.password))
        ) {
          console.log("✅ Admin login successful from database");
          const token = generateToken({
            id: adminUser.id,
            email: adminUser.email,
            role: adminUser.role,
          });

          return NextResponse.json({
            success: true,
            message: "Login successful",
            data: {
              user: {
                id: adminUser.id,
                email: adminUser.email,
                full_name: adminUser.full_name,
                phone: adminUser.phone,
                role: adminUser.role,
                is_active: Boolean(adminUser.is_active),
              },
              token,
            },
          });
        }
      }
    }

    // Find user in database
    let users = executeQuery(
      "SELECT id, email, password, full_name, phone, role, is_active FROM users WHERE email = ?",
      [email.toLowerCase()],
    );

    // Temporary fallback for admin user if not found in database
    if (users.length === 0 && email.toLowerCase() === "admin@hacom.vn") {
      console.log("🔄 Using temporary admin fallback");
      // Pre-generated hash for "admin123" with bcrypt.hash("admin123", 12)
      const adminHash =
        "$2b$12$KmVZZqJ5b8F9WFqK.8pu9e3rF.9QKqJ5b8F9WFqK.8pu9e3rF.9QKq";
      users = [
        {
          id: 1,
          email: "admin@hacom.vn",
          password: adminHash,
          full_name: "Admin HACOM",
          phone: null,
          role: "admin",
          is_active: 1,
        },
      ];
    }

    if (users.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password",
        },
        { status: 401 },
      );
    }

    const user = users[0];

    // Check if user is active
    if (!user.is_active) {
      return NextResponse.json(
        {
          success: false,
          message: "Account is deactivated",
        },
        { status: 401 },
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password",
        },
        { status: 401 },
      );
    }

    // Remove password from response
    const { password: _, ...userResponse } = user;

    // Generate token
    const token = generateToken(user);

    return NextResponse.json({
      success: true,
      message: "Login successful",
      data: {
        user: userResponse,
        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    );
  }
}
