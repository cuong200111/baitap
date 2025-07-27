// Test script to verify cart functionality
const testCartWorkflow = async () => {
  try {
    console.log("Testing cart functionality...");

    // Test 1: Get products
    console.log("1. Fetching products...");
    const productsResponse = await fetch("http://localhost:8080/api/products");
    const productsData = await productsResponse.json();

    if (productsData.success && productsData.data.length > 0) {
      console.log(`✓ Found ${productsData.data.length} products`);
      const firstProduct = productsData.data[0];
      console.log(
        `- First product: ${firstProduct.name} (ID: ${firstProduct.id})`,
      );

      // Test 2: Add to cart (using test user ID 1)
      console.log("2. Adding product to cart...");
      const addToCartResponse = await fetch("http://localhost:8080/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: 1,
          product_id: firstProduct.id,
          quantity: 2,
        }),
      });

      const addToCartData = await addToCartResponse.json();

      if (addToCartData.success) {
        console.log("✓ Successfully added product to cart");

        // Test 3: Get cart items
        console.log("3. Fetching cart items...");
        const cartResponse = await fetch(
          "http://localhost:8080/api/cart?user_id=1",
        );
        const cartData = await cartResponse.json();

        if (cartData.success && cartData.data.items.length > 0) {
          console.log(`✓ Cart has ${cartData.data.summary.itemCount} items`);
          console.log(
            `- Subtotal: ${cartData.data.summary.subtotal.toLocaleString("vi-VN")} VND`,
          );
          console.log("✓ Cart functionality is working correctly!");

          return {
            success: true,
            message: "All cart tests passed!",
            cartCount: cartData.data.summary.itemCount,
          };
        } else {
          console.log("✗ Cart is empty after adding items");
          return { success: false, message: "Cart items not found" };
        }
      } else {
        console.log("✗ Failed to add product to cart:", addToCartData.message);
        return { success: false, message: addToCartData.message };
      }
    } else {
      console.log("✗ No products found");
      return { success: false, message: "No products available" };
    }
  } catch (error) {
    console.error("Test failed with error:", error);
    return { success: false, message: error.message };
  }
};

// Export for use
module.exports = { testCartWorkflow };

// Run if called directly
if (require.main === module) {
  testCartWorkflow().then((result) => {
    console.log("\nTest Result:", result);
    process.exit(result.success ? 0 : 1);
  });
}
