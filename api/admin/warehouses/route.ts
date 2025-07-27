import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";

// Get all warehouses
export async function GET(request: NextRequest) {
  try {
    const warehouses = executeQuery(`
      SELECT * FROM warehouses 
      ORDER BY is_default DESC, created_at DESC
    `);

    return NextResponse.json({
      success: true,
      data: warehouses,
    });
  } catch (error) {
    console.error("Warehouses API error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

// Create new warehouse
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      address,
      province_id,
      province_name,
      district_id,
      district_name,
      ward_id,
      ward_name,
      latitude,
      longitude,
      is_default,
    } = body;

    // Validate required fields
    if (!name || !address || !province_id || !district_id) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 },
      );
    }

    // If setting as default, unset other defaults
    if (is_default) {
      executeQuery("UPDATE warehouses SET is_default = 0");
    }

    const result = executeQuery(
      `
      INSERT INTO warehouses (
        name, address, province_id, province_name, district_id, district_name,
        ward_id, ward_name, latitude, longitude, is_default, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `,
      [
        name,
        address,
        province_id,
        province_name,
        district_id,
        district_name,
        ward_id || null,
        ward_name || null,
        latitude || null,
        longitude || null,
        is_default ? 1 : 0,
      ],
    );

    // Get the created warehouse
    const warehouse = executeQuery("SELECT * FROM warehouses WHERE id = ?", [
      result.insertId,
    ])[0];

    return NextResponse.json({
      success: true,
      message: "Warehouse created successfully",
      data: warehouse,
    });
  } catch (error) {
    console.error("Create warehouse error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create warehouse" },
      { status: 500 },
    );
  }
}
