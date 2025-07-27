import bcrypt from "bcryptjs";
import { executeQuery } from "./database/connection.js";

async function createAdminUser() {
  try {
    console.log("🌱 Creating admin user...");

    // Check if admin user exists
    const existing = await executeQuery(
      "SELECT id, email, role FROM users WHERE email = ?",
      ["admin@zoxvn.com"]
    );

    if (existing.length > 0) {
      console.log("✅ Admin user already exists:", existing[0]);
      return;
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

    console.log("✅ Admin user created successfully!");
    console.log("📧 Email: admin@zoxvn.com");
    console.log("🔐 Password: admin123");
    console.log("🆔 User ID:", result.insertId);

  } catch (error) {
    console.error("❌ Error creating admin user:", error);
  }
}

createAdminUser();
