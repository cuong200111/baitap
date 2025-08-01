import express from "express";
import bcrypt from "bcryptjs";
import { body, validationResult } from "express-validator";
import { executeQuery } from "../database/connection.js";
import { generateToken, authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Register new user
router.post(
  "/register",
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("full_name")
      .trim()
      .isLength({ min: 2 })
      .withMessage("Full name required"),
    body("phone")
      .optional()
      .isMobilePhone("vi-VN")
      .withMessage("Invalid phone number"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const { email, password, full_name, phone } = req.body;

      // Check if user already exists
      console.log("🔍 Checking if user exists with email:", email);
      const existingUser = await executeQuery(
        "SELECT id, email FROM users WHERE email = ?",
        [email],
      );

      console.log("📊 Existing user query result:", existingUser);

      if (existingUser.length > 0) {
        console.log("❌ User already exists:", existingUser[0]);

        // In development, allow forcing re-registration
        if (
          req.body.force_register === true &&
          process.env.NODE_ENV !== "production"
        ) {
          console.log(
            "🔄 Force re-registration requested, deleting existing user",
          );
          await executeQuery("DELETE FROM users WHERE email = ?", [email]);
        } else {
          return res.status(400).json({
            success: false,
            message: "User already exists with this email",
            code: "USER_EXISTS",
            debug:
              process.env.NODE_ENV !== "production"
                ? {
                    existing_email: existingUser[0].email,
                    suggestion:
                      "Add 'force_register: true' to overwrite existing user in development",
                  }
                : undefined,
          });
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const result = await executeQuery(
        `
        INSERT INTO users (email, password, full_name, phone, role)
        VALUES (?, ?, ?, ?, 'user')
      `,
        [email, hashedPassword, full_name, phone || null],
      );

      // Get created user
      const newUser = await executeQuery(
        "SELECT id, email, full_name, phone, role, created_at FROM users WHERE id = ?",
        [result.insertId],
      );

      // Generate token
      const token = generateToken(newUser[0]);

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
          user: newUser[0],
          token,
        },
      });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

// Login user
router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .withMessage("Valid email required"),
    body("password").notEmpty().withMessage("Password required"),
  ],
  async (req, res) => {
    try {
      console.log("🔐 Login attempt:", req.body);
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log("❌ Validation errors:", errors.array());
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const { email, password } = req.body;

      // Find user
      const users = await executeQuery(
        "SELECT id, email, password, full_name, phone, role, is_active FROM users WHERE email = ?",
        [email],
      );

      if (users.length === 0) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      const user = users[0];

      // Check if user is active
      if (!user.is_active) {
        return res.status(401).json({
          success: false,
          message: "Account is deactivated",
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      // Remove password from response
      delete user.password;

      // Generate token
      const token = generateToken(user);

      res.json({
        success: true,
        message: "Login successful",
        data: {
          user,
          token,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

// Get current user profile
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const user = await executeQuery(
      "SELECT id, email, full_name, phone, role, avatar, created_at FROM users WHERE id = ?",
      [req.user.id],
    );

    if (!user.length) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const userData = user[0];

    // Get user address from customer_addresses table
    let userAddress = null;
    try {
      const addresses = await executeQuery(
        "SELECT * FROM customer_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC LIMIT 1",
        [req.user.id],
      );
      if (addresses.length > 0) {
        userAddress = addresses[0];
      }
    } catch (addressError) {
      console.error("Error fetching user address:", addressError);
      // Continue without address data if table doesn't exist
    }

    // Merge user data with address data
    const profileData = { ...userData };

    // Add address data if available
    if (userAddress) {
      profileData.address = userAddress.address_line_1 || "";
      profileData.province_name = userAddress.city || "";
      profileData.district_name = userAddress.district || "";
      profileData.ward_name = userAddress.ward || "";
      profileData.address_line_2 = userAddress.address_line_2 || "";
      profileData.address_full_name = userAddress.full_name || "";
      profileData.address_phone = userAddress.phone || "";
    }

    res.json({
      success: true,
      data: profileData,
    });
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Update user profile
router.put(
  "/profile",
  authenticateToken,
  [
    body("full_name")
      .optional()
      .trim()
      .isLength({ min: 2 })
      .withMessage("Full name must be at least 2 characters"),
    body("phone")
      .optional()
      .isMobilePhone("vi-VN")
      .withMessage("Invalid phone number"),
    body("province_name").optional().trim(),
    body("district_name").optional().trim(),
    body("ward_name").optional().trim(),
    body("address").optional().trim(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const {
        full_name,
        phone,
        province_name,
        district_name,
        ward_name,
        address
      } = req.body;

      // Update basic user profile
      const updateFields = [];
      const updateValues = [];

      if (full_name) {
        updateFields.push("full_name = ?");
        updateValues.push(full_name);
      }

      if (phone) {
        updateFields.push("phone = ?");
        updateValues.push(phone);
      }

      // Update user table if there are basic fields to update
      if (updateFields.length > 0) {
        updateValues.push(req.user.id);
        await executeQuery(
          `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`,
          updateValues,
        );
      }

      // Update address in customer_addresses table if address data is provided
      if (province_name || district_name || ward_name || address) {
        try {
          // Check if user already has an address
          const existingAddresses = await executeQuery(
            "SELECT * FROM customer_addresses WHERE user_id = ?",
            [req.user.id],
          );

          const addressData = {
            full_name: full_name || req.user.full_name,
            phone: phone || req.user.phone,
            address_line_1: address || "Địa chỉ chi tiết",
            address_line_2: null,
            ward: ward_name || "",
            district: district_name || "",
            city: province_name || "",
            is_default: true,
          };

          if (existingAddresses.length > 0) {
            // UPDATE existing address
            await executeQuery(
              `UPDATE customer_addresses SET
               full_name = ?, phone = ?, address_line_1 = ?, address_line_2 = ?,
               ward = ?, district = ?, city = ?, is_default = ?, updated_at = NOW()
               WHERE user_id = ?`,
              [
                addressData.full_name,
                addressData.phone,
                addressData.address_line_1,
                addressData.address_line_2,
                addressData.ward,
                addressData.district,
                addressData.city,
                addressData.is_default ? 1 : 0,
                req.user.id,
              ],
            );
          } else {
            // INSERT new address
            await executeQuery(
              `INSERT INTO customer_addresses
               (user_id, type, full_name, phone, address_line_1, address_line_2, ward, district, city, is_default, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
              [
                req.user.id,
                "default",
                addressData.full_name,
                addressData.phone,
                addressData.address_line_1,
                addressData.address_line_2,
                addressData.ward,
                addressData.district,
                addressData.city,
                addressData.is_default ? 1 : 0,
              ],
            );
          }
        } catch (addressError) {
          console.error("Error updating address:", addressError);
          // Continue without failing the entire update
        }
      }

      // Get updated user
      const updatedUser = await executeQuery(
        "SELECT id, email, full_name, phone, role, avatar, created_at FROM users WHERE id = ?",
        [req.user.id],
      );

      // Get updated address data
      let userAddress = null;
      try {
        const addresses = await executeQuery(
          "SELECT * FROM customer_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC LIMIT 1",
          [req.user.id],
        );
        if (addresses.length > 0) {
          userAddress = addresses[0];
        }
      } catch (addressError) {
        console.error("Error fetching updated address:", addressError);
      }

      // Merge user data with address data
      const profileData = { ...updatedUser[0] };

      // Add address data if available
      if (userAddress) {
        profileData.address = userAddress.address_line_1 || "";
        profileData.province_name = userAddress.city || "";
        profileData.district_name = userAddress.district || "";
        profileData.ward_name = userAddress.ward || "";
        profileData.address_line_2 = userAddress.address_line_2 || "";
        profileData.address_full_name = userAddress.full_name || "";
        profileData.address_phone = userAddress.phone || "";
      }

      res.json({
        success: true,
        message: "Profile updated successfully",
        data: profileData,
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

// Change password
router.put(
  "/change-password",
  authenticateToken,
  [
    body("current_password")
      .notEmpty()
      .withMessage("Current password required"),
    body("new_password")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const { current_password, new_password } = req.body;

      // Get current user with password
      const users = await executeQuery(
        "SELECT password FROM users WHERE id = ?",
        [req.user.id],
      );

      // Verify current password
      const isValidPassword = await bcrypt.compare(
        current_password,
        users[0].password,
      );
      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect",
        });
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(new_password, 12);

      // Update password
      await executeQuery("UPDATE users SET password = ? WHERE id = ?", [
        hashedNewPassword,
        req.user.id,
      ]);

      res.json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

// Verify token
router.post("/verify-token", authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: "Token is valid",
    data: req.user,
  });
});

// Development only: Check if user exists
router.get("/check-user/:email", async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(404).json({ success: false, message: "Not found" });
  }

  try {
    const { email } = req.params;
    const users = await executeQuery(
      "SELECT id, email, full_name, role, created_at FROM users WHERE email = ?",
      [email],
    );

    res.json({
      success: true,
      exists: users.length > 0,
      data: users[0] || null,
    });
  } catch (error) {
    console.error("Check user error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Development only: Delete user by email
router.delete("/delete-user/:email", async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(404).json({ success: false, message: "Not found" });
  }

  try {
    const { email } = req.params;
    const result = await executeQuery("DELETE FROM users WHERE email = ?", [
      email,
    ]);

    res.json({
      success: true,
      deleted: result.affectedRows > 0,
      message:
        result.affectedRows > 0
          ? `User ${email} deleted successfully`
          : `No user found with email ${email}`,
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Development only: Create admin user
router.post("/create-admin", async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(404).json({ success: false, message: "Not found" });
  }

  try {
    // Check if admin user exists
    const existing = await executeQuery(
      "SELECT id, email, role FROM users WHERE email = ?",
      ["admin@zoxvn.com"]
    );

    if (existing.length > 0) {
      return res.json({
        success: true,
        message: "Admin user already exists",
        user: existing[0]
      });
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash("admin123", 12);

    const result = await executeQuery(
      `INSERT INTO users (email, password, full_name, phone, role, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        "admin@zoxvn.com",
        hashedPassword,
        "Admin ZOXVN",
        "1900 1903",
        "admin",
        1,
      ],
    );

    res.json({
      success: true,
      message: "Admin user created successfully",
      user: {
        id: result.insertId,
        email: "admin@zoxvn.com",
        role: "admin"
      },
      credentials: {
        email: "admin@zoxvn.com",
        password: "admin123"
      }
    });

  } catch (error) {
    console.error("Create admin error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export default router;
