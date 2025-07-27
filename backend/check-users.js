#!/usr/bin/env node

import { executeQuery } from "./database/connection.js";

const email = process.argv[2];
const action = process.argv[3]; // 'check' or 'delete'

if (!email) {
  console.log("Usage: node check-users.js <email> [check|delete]");
  process.exit(1);
}

try {
  if (action === "delete") {
    // Delete user if exists
    const result = await executeQuery("DELETE FROM users WHERE email = ?", [
      email,
    ]);
    if (result.affectedRows > 0) {
      console.log(`✅ Deleted user with email: ${email}`);
    } else {
      console.log(`❌ No user found with email: ${email}`);
    }
  } else {
    // Check if user exists
    const users = await executeQuery(
      "SELECT id, email, full_name, role, created_at FROM users WHERE email = ?",
      [email],
    );

    if (users.length > 0) {
      console.log("✅ User found:");
      console.table(users);
    } else {
      console.log(`❌ No user found with email: ${email}`);
    }
  }
} catch (error) {
  console.error("Error:", error.message);
}

process.exit(0);
