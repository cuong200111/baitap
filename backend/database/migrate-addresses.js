import { executeQuery } from "./connection.js";

async function createCustomerAddressesTable() {
  try {
    console.log("Creating customer_addresses table...");

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS customer_addresses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        type VARCHAR(50) DEFAULT 'default',
        full_name VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        address_line_1 TEXT NOT NULL,
        address_line_2 TEXT,
        ward VARCHAR(255) NOT NULL,
        district VARCHAR(255) NOT NULL,
        city VARCHAR(255) NOT NULL,
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_is_default (is_default)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await executeQuery(createTableQuery);
    console.log("✅ customer_addresses table created successfully");

    // Check if table exists and has data
    const result = await executeQuery("SELECT COUNT(*) as count FROM customer_addresses");
    console.log(`📊 customer_addresses table has ${result[0].count} records`);

  } catch (error) {
    console.error("❌ Error creating customer_addresses table:", error);
    throw error;
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createCustomerAddressesTable()
    .then(() => {
      console.log("🎉 Customer addresses migration completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Migration failed:", error);
      process.exit(1);
    });
}

export { createCustomerAddressesTable };
