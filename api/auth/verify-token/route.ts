import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "No token provided" },
        { status: 401 },
      );
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;

      return NextResponse.json({
        success: true,
        message: "Token is valid",
        data: {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role,
          exp: decoded.exp,
        },
      });
    } catch (jwtError: any) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid token",
          error:
            jwtError.name === "TokenExpiredError"
              ? "Token expired"
              : "Invalid token",
        },
        { status: 401 },
      );
    }
  } catch (error) {
    console.error("Token verification error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
