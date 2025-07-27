#!/usr/bin/env node

import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log("🔄 Restarting backend with SQLite...");

// Set environment variable for SQLite
process.env.USE_SQLITE = "true";
process.env.USE_MYSQL = "false";

// Import and start the server
try {
  await import("./server.js");
} catch (error) {
  console.error("❌ Failed to start server:", error);
  process.exit(1);
}
