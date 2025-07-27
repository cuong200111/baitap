import { executeQuery } from "../database/connection.js";

// Function to calculate distance between two points (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
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

function toRad(degree) {
  return degree * (Math.PI / 180);
}

// Get coordinates for a location (simplified - in production use geocoding service)
function getLocationCoordinates(provinceId, districtId) {
  // Simplified coordinate mapping for major Vietnam cities
  const coordinates = {
    1: { lat: 21.0285, lon: 105.8542 }, // Hà Nội
    79: { lat: 10.8231, lon: 106.6297 }, // TP Hồ Chí Minh
    48: { lat: 16.0544, lon: 108.2022 }, // Đà Nẵng
    92: { lat: 10.0452, lon: 105.7469 }, // Cần Thơ
    33: { lat: 21.5938, lon: 105.9856 }, // Hải Phong
    77: { lat: 20.8449, lon: 106.6881 }, // Quảng Ninh
    26: { lat: 15.1214, lon: 109.0469 }, // Khánh Hòa
    20: { lat: 15.8801, lon: 108.338 }, // Quảng Nam
  };

  return coordinates[provinceId] || { lat: 21.0285, lon: 105.8542 }; // Default to Hanoi
}

export const shippingController = {
  // Calculate shipping cost
  async calculateShipping(req, res) {
    try {
      const {
        destination_province_id,
        destination_district_id,
        order_amount = 0,
      } = req.body;

      if (!destination_province_id) {
        return res.status(400).json({
          success: false,
          message: "Destination province is required",
        });
      }

      // Get default warehouse
      let warehouses = await executeQuery(`
        SELECT * FROM warehouses 
        WHERE is_default = 1 AND is_active = 1 
        ORDER BY created_at DESC 
        LIMIT 1
      `);

      if (!warehouses.length) {
        // Fallback to any active warehouse
        const fallbackWarehouses = await executeQuery(`
          SELECT * FROM warehouses 
          WHERE is_active = 1 
          ORDER BY created_at DESC 
          LIMIT 1
        `);

        if (!fallbackWarehouses.length) {
          return res.status(404).json({
            success: false,
            message: "No active warehouse found",
          });
        }

        warehouses = fallbackWarehouses;
      }

      const warehouse = warehouses[0];

      // Find applicable shipping zone
      const zones = await executeQuery(
        `
        SELECT * FROM shipping_zones 
        WHERE warehouse_id = ? AND is_active = 1
      `,
        [warehouse.id]
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
        return res.json({
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
          destination_district_id
        );
        if (destCoords) {
          distance = calculateDistance(
            warehouse.latitude,
            warehouse.longitude,
            destCoords.lat,
            destCoords.lon
          );
        }
      }

      // Get applicable shipping rate
      const rates = await executeQuery(
        `
        SELECT * FROM shipping_rates 
        WHERE zone_id = ? AND is_active = 1
        AND (max_distance IS NULL OR ? <= max_distance)
        AND ? >= min_distance
        ORDER BY min_distance DESC
        LIMIT 1
      `,
        [applicableZone.id, distance, distance]
      );

      if (!rates.length) {
        return res.status(404).json({
          success: false,
          message: "No shipping rate found for this distance",
        });
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

      res.json({
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
      res.status(500).json({
        success: false,
        message: "Failed to calculate shipping",
      });
    }
  },

  // Get shipping rates
  async getShippingRates(req, res) {
    try {
      const { zone_id } = req.query;
      
      let query = "SELECT * FROM shipping_rates WHERE is_active = 1";
      let params = [];
      
      if (zone_id) {
        query += " AND zone_id = ?";
        params.push(zone_id);
      }
      
      query += " ORDER BY zone_id, min_distance";
      
      const rates = await executeQuery(query, params);
      
      res.json({
        success: true,
        data: rates,
      });
    } catch (error) {
      console.error("Get shipping rates error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get shipping rates",
      });
    }
  },

  // Create shipping rate
  async createShippingRate(req, res) {
    try {
      const {
        zone_id,
        min_distance,
        max_distance,
        base_rate,
        per_km_rate,
        min_order_amount,
      } = req.body;

      if (!zone_id || base_rate === undefined) {
        return res.status(400).json({
          success: false,
          message: "Zone ID and base rate are required",
        });
      }

      const result = await executeQuery(
        `INSERT INTO shipping_rates 
         (zone_id, min_distance, max_distance, base_rate, per_km_rate, min_order_amount, is_active, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, 1, NOW())`,
        [zone_id, min_distance || 0, max_distance, base_rate, per_km_rate || 0, min_order_amount || 0]
      );

      res.status(201).json({
        success: true,
        message: "Shipping rate created successfully",
        data: { id: result.insertId },
      });
    } catch (error) {
      console.error("Create shipping rate error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create shipping rate",
      });
    }
  },

  // Get shipping zones
  async getShippingZones(req, res) {
    try {
      const zones = await executeQuery(
        "SELECT * FROM shipping_zones WHERE is_active = 1 ORDER BY name"
      );
      
      res.json({
        success: true,
        data: zones,
      });
    } catch (error) {
      console.error("Get shipping zones error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get shipping zones",
      });
    }
  },

  // Create shipping zone
  async createShippingZone(req, res) {
    try {
      const {
        name,
        warehouse_id,
        province_ids,
        district_ids,
        description,
      } = req.body;

      if (!name || !warehouse_id) {
        return res.status(400).json({
          success: false,
          message: "Name and warehouse ID are required",
        });
      }

      const result = await executeQuery(
        `INSERT INTO shipping_zones 
         (name, warehouse_id, province_ids, district_ids, description, is_active, created_at) 
         VALUES (?, ?, ?, ?, ?, 1, NOW())`,
        [
          name,
          warehouse_id,
          JSON.stringify(province_ids || []),
          JSON.stringify(district_ids || []),
          description || "",
        ]
      );

      res.status(201).json({
        success: true,
        message: "Shipping zone created successfully",
        data: { id: result.insertId },
      });
    } catch (error) {
      console.error("Create shipping zone error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create shipping zone",
      });
    }
  },

  // Get warehouses
  async getWarehouses(req, res) {
    try {
      const warehouses = await executeQuery(
        "SELECT * FROM warehouses WHERE is_active = 1 ORDER BY name"
      );
      
      res.json({
        success: true,
        data: warehouses,
      });
    } catch (error) {
      console.error("Get warehouses error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get warehouses",
      });
    }
  },

  // Create warehouse
  async createWarehouse(req, res) {
    try {
      const {
        name,
        address,
        latitude,
        longitude,
        phone,
        is_default,
      } = req.body;

      if (!name || !address) {
        return res.status(400).json({
          success: false,
          message: "Name and address are required",
        });
      }

      // If this is set as default, unset other defaults
      if (is_default) {
        await executeQuery("UPDATE warehouses SET is_default = 0");
      }

      const result = await executeQuery(
        `INSERT INTO warehouses 
         (name, address, latitude, longitude, phone, is_default, is_active, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, 1, NOW())`,
        [name, address, latitude, longitude, phone, is_default ? 1 : 0]
      );

      res.status(201).json({
        success: true,
        message: "Warehouse created successfully",
        data: { id: result.insertId },
      });
    } catch (error) {
      console.error("Create warehouse error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create warehouse",
      });
    }
  },
};
