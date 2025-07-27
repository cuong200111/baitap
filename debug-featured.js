const { executeQuery } = require("./lib/database.ts");

console.log("=== Checking Featured Products in Database ===\n");

try {
  // Check all products and their featured status
  const products = executeQuery(
    "SELECT id, name, featured, status FROM products ORDER BY id",
  );

  console.log("All products:");
  products.forEach((p) => {
    console.log(
      `- ID: ${p.id}, Name: ${p.name}, Featured: ${p.featured}, Status: ${p.status}`,
    );
  });

  // Check specifically featured products
  const featuredProducts = executeQuery(
    "SELECT id, name, featured, status FROM products WHERE featured = 1",
  );

  console.log("\nFeatured products:");
  if (featuredProducts.length === 0) {
    console.log("- No featured products found!");
  } else {
    featuredProducts.forEach((p) => {
      console.log(
        `- ID: ${p.id}, Name: ${p.name}, Featured: ${p.featured}, Status: ${p.status}`,
      );
    });
  }

  // Update first product to be featured as a test
  if (products.length > 0) {
    const firstProduct = products[0];
    executeQuery("UPDATE products SET featured = 1 WHERE id = ?", [
      firstProduct.id,
    ]);
    console.log(
      `\nUpdated product ${firstProduct.id} (${firstProduct.name}) to be featured`,
    );

    // Check again
    const updatedProduct = executeQuery(
      "SELECT id, name, featured, status FROM products WHERE id = ?",
      [firstProduct.id],
    );
    console.log(`After update: Featured = ${updatedProduct[0].featured}`);
  }
} catch (error) {
  console.error("Error checking database:", error);
}
