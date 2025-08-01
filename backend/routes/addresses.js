import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { executeQuery } from "../database/connection.js";

const router = express.Router();

// Get address for current user (each user has only one address)
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const addresses = await executeQuery(
      `SELECT * FROM customer_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC`,
      [userId],
    );

    res.json({
      success: true,
      data: addresses,
    });
  } catch (error) {
    console.error("Get addresses error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get addresses",
    });
  }
});

// Create or Update address (UPSERT) - each user can only have one address
router.post("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      type = "default",
      full_name,
      phone,
      address_line_1,
      address_line_2 = null,
      ward,
      district,
      city,
      is_default = true, // Always default since user has only one address
    } = req.body;

    // Validate required fields
    if (!full_name || !address_line_1 || !ward || !district || !city) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: full_name, address_line_1, ward, district, city",
      });
    }

    // Check if user already has an address
    const existingAddress = await executeQuery(
      `SELECT * FROM customer_addresses WHERE user_id = ?`,
      [userId],
    );

    let result;
    let message;
    let addressData;

    if (existingAddress.length > 0) {
      // UPDATE existing address
      await executeQuery(
        `UPDATE customer_addresses SET
         type = ?, full_name = ?, phone = ?, address_line_1 = ?, address_line_2 = ?,
         ward = ?, district = ?, city = ?, is_default = ?, updated_at = NOW()
         WHERE user_id = ?`,
        [
          type,
          full_name,
          phone,
          address_line_1,
          address_line_2,
          ward,
          district,
          city,
          1, // Always default
          userId,
        ],
      );

      // Get updated address
      const updatedAddress = await executeQuery(
        `SELECT * FROM customer_addresses WHERE user_id = ?`,
        [userId],
      );

      addressData = updatedAddress[0];
      message = "Address updated successfully";
    } else {
      // INSERT new address
      result = await executeQuery(
        `INSERT INTO customer_addresses
         (user_id, type, full_name, phone, address_line_1, address_line_2, ward, district, city, is_default, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          userId,
          type,
          full_name,
          phone,
          address_line_1,
          address_line_2,
          ward,
          district,
          city,
          1, // Always default
        ],
      );

      // Get the created address
      const newAddress = await executeQuery(
        `SELECT * FROM customer_addresses WHERE id = ?`,
        [result.insertId],
      );

      addressData = newAddress[0];
      message = "Address created successfully";
    }

    res.json({
      success: true,
      message: message,
      data: addressData,
    });
  } catch (error) {
    console.error("Create/Update address error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save address",
    });
  }
});

// Update address (user can only update their single address)
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const addressId = req.params.id;
    const {
      type = "default",
      full_name,
      phone,
      address_line_1,
      address_line_2,
      ward,
      district,
      city,
    } = req.body;

    // Check if address belongs to user
    const existingAddress = await executeQuery(
      `SELECT * FROM customer_addresses WHERE id = ? AND user_id = ?`,
      [addressId, userId],
    );

    if (existingAddress.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    // Validate required fields
    if (!full_name || !address_line_1 || !ward || !district || !city) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: full_name, address_line_1, ward, district, city",
      });
    }

    // Update address (always set as default since user has only one address)
    await executeQuery(
      `UPDATE customer_addresses SET
       type = ?, full_name = ?, phone = ?, address_line_1 = ?, address_line_2 = ?,
       ward = ?, district = ?, city = ?, is_default = ?, updated_at = NOW()
       WHERE id = ? AND user_id = ?`,
      [
        type,
        full_name,
        phone,
        address_line_1,
        address_line_2,
        ward,
        district,
        city,
        1, // Always default since user has only one address
        addressId,
        userId,
      ],
    );

    // Get updated address
    const updatedAddress = await executeQuery(
      `SELECT * FROM customer_addresses WHERE id = ?`,
      [addressId],
    );

    res.json({
      success: true,
      message: "Address updated successfully",
      data: updatedAddress[0],
    });
  } catch (error) {
    console.error("Update address error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update address",
    });
  }
});

// Delete address
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const addressId = req.params.id;

    // Check if address belongs to user
    const existingAddress = await executeQuery(
      `SELECT * FROM customer_addresses WHERE id = ? AND user_id = ?`,
      [addressId, userId],
    );

    if (existingAddress.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    await executeQuery(
      `DELETE FROM customer_addresses WHERE id = ? AND user_id = ?`,
      [addressId, userId],
    );

    res.json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error) {
    console.error("Delete address error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete address",
    });
  }
});

// Update profile with address - UPSERT approach
router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      // User profile fields
      full_name: profile_full_name,
      phone: profile_phone,
      // Address fields
      address_full_name,
      address_phone,
      address_line_1,
      address_line_2 = null,
      ward,
      district,
      city,
      type = "default",
    } = req.body;

    // Update user profile if profile fields are provided
    if (profile_full_name || profile_phone) {
      const updateFields = [];
      const updateValues = [];

      if (profile_full_name) {
        updateFields.push("full_name = ?");
        updateValues.push(profile_full_name);
      }
      if (profile_phone) {
        updateFields.push("phone = ?");
        updateValues.push(profile_phone);
      }

      updateValues.push(userId);

      await executeQuery(
        `UPDATE users SET ${updateFields.join(", ")}, updated_at = NOW() WHERE id = ?`,
        updateValues,
      );
    }

    // Handle address if address fields are provided
    if (address_line_1 && ward && district && city) {
      // Use address_full_name if provided, otherwise use profile_full_name
      const addressFullName = address_full_name || profile_full_name;
      const addressPhone = address_phone || profile_phone;

      if (!addressFullName) {
        return res.status(400).json({
          success: false,
          message: "Full name is required for address",
        });
      }

      // Check if user already has an address
      const existingAddress = await executeQuery(
        `SELECT * FROM customer_addresses WHERE user_id = ?`,
        [userId],
      );

      if (existingAddress.length > 0) {
        // UPDATE existing address
        await executeQuery(
          `UPDATE customer_addresses SET
           type = ?, full_name = ?, phone = ?, address_line_1 = ?, address_line_2 = ?,
           ward = ?, district = ?, city = ?, is_default = ?, updated_at = NOW()
           WHERE user_id = ?`,
          [
            type,
            addressFullName,
            addressPhone,
            address_line_1,
            address_line_2,
            ward,
            district,
            city,
            1, // Always default
            userId,
          ],
        );
      } else {
        // INSERT new address
        await executeQuery(
          `INSERT INTO customer_addresses
           (user_id, type, full_name, phone, address_line_1, address_line_2, ward, district, city, is_default, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            userId,
            type,
            addressFullName,
            addressPhone,
            address_line_1,
            address_line_2,
            ward,
            district,
            city,
            1, // Always default
          ],
        );
      }
    }

    // Get updated user profile and address
    const userProfile = await executeQuery(
      `SELECT id, email, full_name, phone, created_at, updated_at FROM users WHERE id = ?`,
      [userId],
    );

    const userAddress = await executeQuery(
      `SELECT * FROM customer_addresses WHERE user_id = ?`,
      [userId],
    );

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: userProfile[0],
        address: userAddress.length > 0 ? userAddress[0] : null,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
});

export default router;
