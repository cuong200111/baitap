import { pool } from "./connection.js";

async function createSeoAnalyticsTable() {
  try {
    console.log("🔄 Creating seo_analytics table...");

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS seo_analytics (
        id int(11) NOT NULL AUTO_INCREMENT,
        url_path varchar(255) NOT NULL,
        date date NOT NULL,
        page_views int(11) DEFAULT 1,
        created_at timestamp DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY unique_path_date (url_path, date),
        INDEX idx_url_path (url_path),
        INDEX idx_date (date),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await pool.execute(createTableQuery);
    console.log("✅ seo_analytics table created successfully");
  } catch (error) {
    console.error("❌ Error creating seo_analytics table:", error);
    throw error;
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createSeoAnalyticsTable()
    .then(() => {
      console.log("🎉 Migration completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Migration failed:", error);
      process.exit(1);
    });
}

export { createSeoAnalyticsTable };
