const mysql = require("mysql2/promise");

const dbConfig = {
  host: "103.57.221.79",
  user: "qftuzbjqhosting_b5",
  password: "Iw~hwC@*9eyN.HQh",
  database: "qftuzbjqhosting_b5",
  port: 3306,
};

async function clearProducts() {
  let connection;

  try {
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log("✅ Connected to MySQL database");

    console.log("🗑️  Clearing all products from database...");

    // Clear product_categories first (foreign key constraint)
    const [result1] = await connection.execute(
      "DELETE FROM product_categories",
    );
    console.log(
      `✅ Cleared ${result1.affectedRows} product-category relationships`,
    );

    // Clear product_reviews
    const [result2] = await connection.execute("DELETE FROM product_reviews");
    console.log(`✅ Cleared ${result2.affectedRows} product reviews`);

    // Clear cart_items
    const [result3] = await connection.execute(
      "DELETE FROM cart_items WHERE product_id IS NOT NULL",
    );
    console.log(`✅ Cleared ${result3.affectedRows} cart items`);

    // Clear order_items
    const [result4] = await connection.execute("DELETE FROM order_items");
    console.log(`✅ Cleared ${result4.affectedRows} order items`);

    // Clear products table
    const [result5] = await connection.execute("DELETE FROM products");
    console.log(`✅ Cleared ${result5.affectedRows} products`);

    // Reset auto increment
    await connection.execute("ALTER TABLE products AUTO_INCREMENT = 1");
    console.log("✅ Reset products auto increment");

    console.log("🎉 All products cleared successfully!");
  } catch (error) {
    console.error("❌ Error clearing products:", error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log("🔌 Database connection closed");
    }
  }
}

// Run the script
clearProducts();
