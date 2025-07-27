import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";

// Get all shipping zones
export async function GET(request: NextRequest) {
  try {
    const zones = executeQuery(`
      SELECT sz.*, w.name as warehouse_name, w.address as warehouse_address
      FROM shipping_zones sz
      LEFT JOIN warehouses w ON sz.warehouse_id = w.id
      ORDER BY sz.created_at DESC
    `);

    // Parse JSON fields
    const processedZones = zones.map((zone: any) => {
      let province_ids = [];
      let district_ids = [];

      try {
        province_ids = zone.province_ids ? JSON.parse(zone.province_ids) : [];
      } catch (e) {
        province_ids = [];
      }

      try {
        district_ids = zone.district_ids ? JSON.parse(zone.district_ids) : [];
      } catch (e) {
        district_ids = [];
      }

      return {
        ...zone,
        province_ids,
        district_ids,
      };
    });

    return NextResponse.json({
      success: true,
      data: processedZones,
    });
  } catch (error) {
    console.error("Shipping zones API error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

// Create new shipping zone
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, warehouse_id, province_ids, district_ids } = body;

    // Validate required fields
    if (!name || !warehouse_id) {
      return NextResponse.json(
        { success: false, message: "Name and warehouse are required" },
        { status: 400 },
      );
    }

    // Check if warehouse exists
    const warehouse = executeQuery("SELECT id FROM warehouses WHERE id = ?", [
      warehouse_id,
    ]);
    if (!warehouse.length) {
      return NextResponse.json(
        { success: false, message: "Warehouse not found" },
        { status: 404 },
      );
    }

    const result = executeQuery(
      `
      INSERT INTO shipping_zones (
        name, warehouse_id, province_ids, district_ids, is_active
      ) VALUES (?, ?, ?, ?, 1)
    `,
      [
        name,
        warehouse_id,
        JSON.stringify(province_ids || []),
        JSON.stringify(district_ids || []),
      ],
    );

    // Get the created zone
    const zone = executeQuery(
      `
      SELECT sz.*, w.name as warehouse_name, w.address as warehouse_address
      FROM shipping_zones sz
      LEFT JOIN warehouses w ON sz.warehouse_id = w.id
      WHERE sz.id = ?
    `,
      [result.insertId],
    )[0];

    return NextResponse.json({
      success: true,
      message: "Shipping zone created successfully",
      data: zone,
    });
  } catch (error) {
    console.error("Create shipping zone error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create shipping zone" },
      { status: 500 },
    );
  }
}
