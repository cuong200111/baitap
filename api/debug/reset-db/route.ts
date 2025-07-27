import { NextRequest, NextResponse } from "next/server";
import { resetAdminUser } from "@/lib/database";
import { unlink } from "fs/promises";
import { join } from "path";

export async function POST(request: NextRequest) {
  try {
    // Delete existing database file
    const dbPath = join(process.cwd(), "hacom_ecommerce.db");
    try {
      await unlink(dbPath);
      console.log("✅ Existing database deleted");
    } catch (error) {
      console.log("ℹ️ No existing database found or couldn't delete");
    }

    // Reset admin user (this will recreate the database)
    resetAdminUser();

    return NextResponse.json({
      success: true,
      message: "Database reset successfully",
    });
  } catch (error) {
    console.error("DB reset error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to reset database",
        error: error.message,
      },
      { status: 500 },
    );
  }
}
