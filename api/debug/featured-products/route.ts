import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    console.log("=== Checking Featured Products in Database ===");

    // Check all products and their featured status
    const products = executeQuery(
      "SELECT id, name, featured, status FROM products ORDER BY id",
    );

    console.log("All products:");
    products.forEach((p: any) => {
      console.log(
        `- ID: ${p.id}, Name: ${p.name}, Featured: ${p.featured}, Status: ${p.status}`,
      );
    });

    // Check specifically featured products
    const featuredProducts = executeQuery(
      "SELECT id, name, featured, status FROM products WHERE featured = 1",
    );

    console.log("Featured products:");
    if (featuredProducts.length === 0) {
      console.log("- No featured products found!");
    } else {
      featuredProducts.forEach((p: any) => {
        console.log(
          `- ID: ${p.id}, Name: ${p.name}, Featured: ${p.featured}, Status: ${p.status}`,
        );
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        all_products: products,
        featured_products: featuredProducts,
        featured_count: featuredProducts.length,
        total_count: products.length,
      },
    });
  } catch (error) {
    console.error("Database check error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Database check failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, productId } = await request.json();

    if (action === "set_featured" && productId) {
      // Update first product to be featured as a test
      executeQuery("UPDATE products SET featured = 1 WHERE id = ?", [
        productId,
      ]);

      // Check the updated product
      const updatedProduct = executeQuery(
        "SELECT id, name, featured, status FROM products WHERE id = ?",
        [productId],
      );

      console.log(`Updated product ${productId} to be featured`);
      console.log(`After update: Featured = ${updatedProduct[0]?.featured}`);

      return NextResponse.json({
        success: true,
        message: `Product ${productId} set as featured`,
        data: updatedProduct[0],
      });
    }

    if (action === "unset_featured" && productId) {
      // Remove featured status
      executeQuery("UPDATE products SET featured = 0 WHERE id = ?", [
        productId,
      ]);

      // Check the updated product
      const updatedProduct = executeQuery(
        "SELECT id, name, featured, status FROM products WHERE id = ?",
        [productId],
      );

      console.log(`Removed featured status from product ${productId}`);

      return NextResponse.json({
        success: true,
        message: `Product ${productId} featured status removed`,
        data: updatedProduct[0],
      });
    }

    return NextResponse.json(
      { success: false, message: "Invalid action or missing productId" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Update featured status error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update featured status",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
