import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// Use MySQL database
const USE_MYSQL = true;
console.log("🔄 Using MySQL database...");

// MySQL configuration với thông tin cụ thể
const dbConfig = {
  host: "103.57.221.79",
  user: "qftuzbjqhosting_b5",
  password: "Iw~hwC@*9eyN.HQh",
  database: "qftuzbjqhosting_b5",
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  charset: "utf8mb4",
  ssl: false,
};
export const mysqlExecuteQuery = async (query, params = []) => {
  try {
    const [results] = await pool.execute(query, params);
    return results;
  } catch (error) {
    console.error("❌ MySQL query error:", error.message);
    console.error("Query:", query);
    console.error("Params:", params);
    throw error;
  }
};
console.log("📡 MySQL Config:", {
  host: dbConfig.host,
  user: dbConfig.user,
  database: dbConfig.database,
  port: dbConfig.port,
});

// Create connection pool
let pool;

try {
  pool = mysql.createPool(dbConfig);
  console.log("✅ MySQL connection pool created successfully");
} catch (error) {
  console.error("❌ MySQL pool creation failed:", error.message);
  throw error;
}



// Execute query with error handling
export const executeQuery = async (query, params = []) => {
  try {
    return await mysqlExecuteQuery(query, params);
  } catch (error) {
    console.error("Database query error:", error.message);
    throw error;
  }
};

// Get connection from pool
export const getConnection = async () => {
  try {
    return await mysqlGetConnection();
  } catch (error) {
    console.error("❌ Get connection failed:", error.message);
    throw error;
  }
};

export default pool;
