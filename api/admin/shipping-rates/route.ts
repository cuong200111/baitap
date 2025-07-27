import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";

// Get all shipping rates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const zoneId = searchParams.get("zone_id");

    let query = `
      SELECT sr.*, sz.name as zone_name, w.name as warehouse_name
      FROM shipping_rates sr
      LEFT JOIN shipping_zones sz ON sr.zone_id = sz.id
      LEFT JOIN warehouses w ON sz.warehouse_id = w.id
    `;

    let params: any[] = [];

    if (zoneId) {
      query += " WHERE sr.zone_id = ?";
      params.push(parseInt(zoneId));
    }

    query += " ORDER BY sr.min_distance ASC";

    const rates = executeQuery(query, params);

    return NextResponse.json({
      success: true,
      data: rates,
    });
  } catch (error) {
    console.error("Shipping rates API error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

// Create new shipping rate
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      zone_id,
      min_distance,
      max_distance,
      base_rate,
      per_km_rate,
      min_order_amount,
    } = body;

    // Validate required fields
    if (!zone_id || base_rate === undefined) {
      return NextResponse.json(
        { success: false, message: "Zone and base rate are required" },
        { status: 400 },
      );
    }

    // Check if zone exists
    const zone = executeQuery("SELECT id FROM shipping_zones WHERE id = ?", [
      zone_id,
    ]);
    if (!zone.length) {
      return NextResponse.json(
        { success: false, message: "Shipping zone not found" },
        { status: 404 },
      );
    }

    const result = executeQuery(
      `
      INSERT INTO shipping_rates (
        zone_id, min_distance, max_distance, base_rate, 
        per_km_rate, min_order_amount, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, 1)
    `,
      [
        zone_id,
        min_distance || 0,
        max_distance || null,
        base_rate,
        per_km_rate || 0,
        min_order_amount || 0,
      ],
    );

    // Get the created rate
    const rate = executeQuery(
      `
      SELECT sr.*, sz.name as zone_name, w.name as warehouse_name
      FROM shipping_rates sr
      LEFT JOIN shipping_zones sz ON sr.zone_id = sz.id
      LEFT JOIN warehouses w ON sz.warehouse_id = w.id
      WHERE sr.id = ?
    `,
      [result.insertId],
    )[0];

    return NextResponse.json({
      success: true,
      message: "Shipping rate created successfully",
      data: rate,
    });
  } catch (error) {
    console.error("Create shipping rate error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create shipping rate" },
      { status: 500 },
    );
  }
}
