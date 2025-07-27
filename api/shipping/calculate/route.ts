import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";

// Function to calculate distance between two points (Haversine formula)
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degree: number): number {
  return degree * (Math.PI / 180);
}

// Get coordinates for a location (simplified - in production you'd use a geocoding service)
function getLocationCoordinates(
  provinceId: number,
  districtId?: number,
): { lat: number; lon: number } | null {
  // Simplified coordinate mapping for major Vietnam cities
  const coordinates: Record<number, { lat: number; lon: number }> = {
    1: { lat: 21.0285, lon: 105.8542 }, // Hà Nội
    79: { lat: 10.8231, lon: 106.6297 }, // TP Hồ Chí Minh
    48: { lat: 16.0544, lon: 108.2022 }, // Đà Nẵng
    92: { lat: 10.0452, lon: 105.7469 }, // Cần Thơ
    33: { lat: 21.5938, lon: 105.9856 }, // Hải Phong
    77: { lat: 20.8449, lon: 106.6881 }, // Quảng Ninh
    26: { lat: 15.1214, lon: 109.0469 }, // Khánh Hòa
    20: { lat: 15.8801, lon: 108.338 }, // Quảng Nam
    // Add more coordinates as needed
  };

  return coordinates[provinceId] || { lat: 21.0285, lon: 105.8542 }; // Default to Hanoi
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      destination_province_id,
      destination_district_id,
      order_amount = 0,
    } = body;

    if (!destination_province_id) {
      return NextResponse.json(
        { success: false, message: "Destination province is required" },
        { status: 400 },
      );
    }

    // Get default warehouse
    const warehouses = executeQuery(`
      SELECT * FROM warehouses 
      WHERE is_default = 1 AND is_active = 1 
      ORDER BY created_at DESC 
      LIMIT 1
    `);

    if (!warehouses.length) {
      // Fallback to any active warehouse
      const fallbackWarehouses = executeQuery(`
        SELECT * FROM warehouses 
        WHERE is_active = 1 
        ORDER BY created_at DESC 
        LIMIT 1
      `);

      if (!fallbackWarehouses.length) {
        return NextResponse.json(
          { success: false, message: "No active warehouse found" },
          { status: 404 },
        );
      }

      warehouses.push(fallbackWarehouses[0]);
    }

    const warehouse = warehouses[0];

    // Find applicable shipping zone
    const zones = executeQuery(
      `
      SELECT * FROM shipping_zones 
      WHERE warehouse_id = ? AND is_active = 1
    `,
      [warehouse.id],
    );

    let applicableZone = null;

    for (const zone of zones) {
      let provinceIds = [];
      let districtIds = [];

      try {
        provinceIds = zone.province_ids ? JSON.parse(zone.province_ids) : [];
        districtIds = zone.district_ids ? JSON.parse(zone.district_ids) : [];
      } catch (e) {
        continue;
      }

      // Check if destination matches this zone
      const provinceMatch =
        provinceIds.length === 0 ||
        provinceIds.includes(destination_province_id);
      const districtMatch =
        districtIds.length === 0 ||
        !destination_district_id ||
        districtIds.includes(destination_district_id);

      if (provinceMatch && districtMatch) {
        applicableZone = zone;
        break;
      }
    }

    if (!applicableZone) {
      // Create a default calculation if no zone found
      return NextResponse.json({
        success: true,
        data: {
          shipping_fee: 30000, // Default 30k VND
          distance: 0,
          zone_name: "Khu vực khác",
          warehouse_name: warehouse.name,
          is_free_shipping: order_amount >= 500000, // Free shipping over 500k
        },
      });
    }

    // Calculate distance
    let distance = 0;
    if (warehouse.latitude && warehouse.longitude) {
      const destCoords = getLocationCoordinates(
        destination_province_id,
        destination_district_id,
      );
      if (destCoords) {
        distance = calculateDistance(
          warehouse.latitude,
          warehouse.longitude,
          destCoords.lat,
          destCoords.lon,
        );
      }
    }

    // Get applicable shipping rate
    const rates = executeQuery(
      `
      SELECT * FROM shipping_rates 
      WHERE zone_id = ? AND is_active = 1
      AND (max_distance IS NULL OR ? <= max_distance)
      AND ? >= min_distance
      ORDER BY min_distance DESC
      LIMIT 1
    `,
      [applicableZone.id, distance, distance],
    );

    if (!rates.length) {
      return NextResponse.json(
        { success: false, message: "No shipping rate found for this distance" },
        { status: 404 },
      );
    }

    const rate = rates[0];

    // Calculate shipping fee
    let shippingFee = rate.base_rate;
    if (rate.per_km_rate > 0 && distance > rate.min_distance) {
      const extraDistance = distance - rate.min_distance;
      shippingFee += extraDistance * rate.per_km_rate;
    }

    // Check for free shipping
    const isFreeShipping =
      order_amount >= rate.min_order_amount && rate.min_order_amount > 0;

    return NextResponse.json({
      success: true,
      data: {
        shipping_fee: isFreeShipping ? 0 : Math.round(shippingFee),
        distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
        zone_name: applicableZone.name,
        warehouse_name: warehouse.name,
        warehouse_address: warehouse.address,
        is_free_shipping: isFreeShipping,
        free_shipping_threshold: rate.min_order_amount,
        rate_details: {
          base_rate: rate.base_rate,
          per_km_rate: rate.per_km_rate,
          min_distance: rate.min_distance,
          max_distance: rate.max_distance,
        },
      },
    });
  } catch (error) {
    console.error("Shipping calculation error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to calculate shipping" },
      { status: 500 },
    );
  }
}
