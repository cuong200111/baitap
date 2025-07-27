// Debug script to check and clear reviews
const Database = require("better-sqlite3");
const path = require("path");

try {
  const dbPath = path.join(process.cwd(), "hacom_ecommerce.db");
  const db = new Database(dbPath);

  console.log("=== CURRENT REVIEWS IN DATABASE ===");
  const reviews = db.prepare("SELECT * FROM reviews").all();
  console.log("Total reviews:", reviews.length);
  reviews.forEach((review) => {
    console.log(
      `ID: ${review.id}, Product: ${review.product_id}, User: ${review.user_id}, Rating: ${review.rating}`,
    );
  });

  console.log("\n=== CLEARING ALL REVIEWS ===");
  const deleteResult = db.prepare("DELETE FROM reviews").run();
  console.log("Deleted reviews:", deleteResult.changes);

  console.log("\n=== CURRENT USERS IN DATABASE ===");
  const users = db
    .prepare("SELECT id, email, full_name, role FROM users")
    .all();
  console.log("Total users:", users.length);
  users.forEach((user) => {
    console.log(
      `ID: ${user.id}, Email: ${user.email}, Name: ${user.full_name}, Role: ${user.role}`,
    );
  });

  db.close();
  console.log("\n=== REVIEWS CLEARED SUCCESSFULLY ===");
} catch (error) {
  console.error("Error:", error);
}
