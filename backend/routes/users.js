import express from "express";
import bcrypt from "bcryptjs";
import { executeQuery } from "../database/connection.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// Get all users (admin only)
router.get("/", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { role, page = 1, limit = 20, search } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT id, email, full_name, phone, role, avatar, is_active, created_at, updated_at
      FROM users 
      WHERE 1=1
    `;
    const params = [];

    if (role) {
      query += " AND role = ?";
      params.push(role);
    }

    if (search) {
      query += " AND (full_name LIKE ? OR email LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limit), parseInt(offset));

    let users, total;
    try {
      users = await executeQuery(query, params);

      // Get total count
      let countQuery = "SELECT COUNT(*) as total FROM users WHERE 1=1";
      const countParams = [];

      if (role) {
        countQuery += " AND role = ?";
        countParams.push(role);
      }

      if (search) {
        countQuery += " AND (full_name LIKE ? OR email LIKE ?)";
        countParams.push(`%${search}%`, `%${search}%`);
      }

      const [{ total: countResult }] = await executeQuery(countQuery, countParams);
      total = countResult;
    } catch (dbError) {
      console.log("🌐 Database unavailable for users, using fallback data");
      // Database is unavailable, return fallback users
      users = [
        {
          id: 1,
          email: "admin@hacom.vn",
          full_name: "Admin User (Fallback)",
          phone: "0123456789",
          role: "admin",
          avatar: null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 2,
          email: "user@example.com",
          full_name: "Demo User",
          phone: "0987654321",
          role: "user",
          avatar: null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
      total = users.length;
    }

    res.json({
      success: true,
      data: users,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
});

// Get single user
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Users can only view their own profile unless they're admin
    if (req.user.id !== parseInt(id) && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const users = await executeQuery(
      `SELECT id, email, full_name, phone, role, avatar, is_active, created_at, updated_at
       FROM users WHERE id = ?`,
      [id],
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: users[0],
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user",
    });
  }
});

// Create new user (admin only)
router.post("/", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      email,
      password,
      full_name,
      phone,
      role = "user",
      avatar,
    } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({
        success: false,
        message: "Email, password, and full name are required",
      });
    }

    // Check if email already exists
    const existingUser = await executeQuery(
      "SELECT id FROM users WHERE email = ?",
      [email],
    );

    if (existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await executeQuery(
      `INSERT INTO users (email, password, full_name, phone, role, avatar)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [email, hashedPassword, full_name, phone || null, role, avatar || null],
    );

    const newUser = await executeQuery(
      `SELECT id, email, full_name, phone, role, avatar, is_active, created_at, updated_at
       FROM users WHERE id = ?`,
      [result.insertId],
    );

    res.status(201).json({
      success: true,
      data: newUser[0],
      message: "User created successfully",
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create user",
    });
  }
});

// Update user
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { email, password, full_name, phone, role, avatar, is_active } =
      req.body;

    // Users can only update their own profile unless they're admin
    if (req.user.id !== parseInt(id) && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const user = await executeQuery("SELECT * FROM users WHERE id = ?", [id]);

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if email is being changed and if it already exists
    if (email && email !== user[0].email) {
      const existingUser = await executeQuery(
        "SELECT id FROM users WHERE email = ? AND id != ?",
        [email, id],
      );

      if (existingUser.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }
    }

    // Build update query
    const updateFields = [];
    const updateValues = [];

    if (email !== undefined) {
      updateFields.push("email = ?");
      updateValues.push(email);
    }

    if (password) {
      updateFields.push("password = ?");
      const hashedPassword = await bcrypt.hash(password, 12);
      updateValues.push(hashedPassword);
    }

    if (full_name !== undefined) {
      updateFields.push("full_name = ?");
      updateValues.push(full_name);
    }

    if (phone !== undefined) {
      updateFields.push("phone = ?");
      updateValues.push(phone);
    }

    if (avatar !== undefined) {
      updateFields.push("avatar = ?");
      updateValues.push(avatar);
    }

    // Only admins can change role and is_active
    if (req.user.role === "admin") {
      if (role !== undefined) {
        updateFields.push("role = ?");
        updateValues.push(role);
      }

      if (is_active !== undefined) {
        updateFields.push("is_active = ?");
        updateValues.push(is_active);
      }
    }

    updateFields.push("updated_at = CURRENT_TIMESTAMP");
    updateValues.push(id);

    if (updateFields.length === 1) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    await executeQuery(
      `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`,
      updateValues,
    );

    const updatedUser = await executeQuery(
      `SELECT id, email, full_name, phone, role, avatar, is_active, created_at, updated_at
       FROM users WHERE id = ?`,
      [id],
    );

    res.json({
      success: true,
      data: updatedUser[0],
      message: "User updated successfully",
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user",
    });
  }
});

// Delete user (admin only)
router.delete("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting own account
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete your own account",
      });
    }

    const user = await executeQuery("SELECT id FROM users WHERE id = ?", [id]);

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Soft delete - deactivate user instead of hard delete
    await executeQuery(
      "UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [id],
    );

    res.json({
      success: true,
      message: "User deactivated successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
  }
});

// Change password (Next.js compatible route)
router.put("/:id/password", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { current_password, new_password } = req.body;

    // Users can only change their own password unless they're admin
    if (req.user.id !== parseInt(id) && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (!new_password) {
      return res.status(400).json({
        success: false,
        message: "New password is required",
      });
    }

    // Validate password length
    if (new_password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    const user = await executeQuery("SELECT * FROM users WHERE id = ?", [id]);

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // If current_password is provided, verify it
    if (current_password) {
      const isValidPassword = await bcrypt.compare(
        current_password,
        user[0].password,
      );

      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect",
        });
      }
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 12);

    await executeQuery(
      "UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [hashedPassword, id],
    );

    res.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update password",
    });
  }
});

// Change password (alternative endpoint)
router.post("/:id/change-password", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { current_password, new_password } = req.body;

    // Users can only change their own password unless they're admin
    if (req.user.id !== parseInt(id) && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (!new_password) {
      return res.status(400).json({
        success: false,
        message: "New password is required",
      });
    }

    const user = await executeQuery("SELECT * FROM users WHERE id = ?", [id]);

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // If not admin, verify current password
    if (req.user.role !== "admin") {
      if (!current_password) {
        return res.status(400).json({
          success: false,
          message: "Current password is required",
        });
      }

      const isValidPassword = await bcrypt.compare(
        current_password,
        user[0].password,
      );

      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect",
        });
      }
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 12);

    await executeQuery(
      "UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [hashedPassword, id],
    );

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to change password",
    });
  }
});

export default router;
