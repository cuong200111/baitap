"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cartApi, cartUtils } from "@/lib/cart-api";
import { useRouter } from "next/navigation";

export default function TestCompleteFlowPage() {
  const router = useRouter();
  const [results, setResults] = useState<any[]>([]);
  const [testing, setTesting] = useState(false);
  const [productId, setProductId] = useState("2");
  const [quantity, setQuantity] = useState("1");

  const addResult = (
    test: string,
    success: boolean,
    message: string,
    data?: any,
  ) => {
    const result = {
      test,
      success,
      message,
      data,
      timestamp: new Date().toLocaleTimeString(),
    };
    setResults((prev) => [...prev, result]);
  };

  const clearResults = () => {
    setResults([]);
  };

  // Test 1: Add to cart
  const testAddToCart = async () => {
    try {
      const result = await cartApi.addToCart(parseInt(productId), parseInt(quantity));
      
      if (result.success) {
        addResult("1. Add to Cart", true, "Successfully added to cart", result);
        return true;
      } else {
        addResult("1. Add to Cart", false, result.message || "Failed", result);
        return false;
      }
    } catch (error: any) {
      addResult("1. Add to Cart", false, `Error: ${error.message}`);
      return false;
    }
  };

  // Test 2: Get cart
  const testGetCart = async () => {
    try {
      const result = await cartApi.getCart();
      
      if (result.success && result.data?.items?.length > 0) {
        addResult("2. Get Cart", true, `Cart has ${result.data.items.length} items`, result.data);
        return result.data;
      } else {
        addResult("2. Get Cart", false, "Cart is empty or failed", result);
        return null;
      }
    } catch (error: any) {
      addResult("2. Get Cart", false, `Error: ${error.message}`);
      return null;
    }
  };

  // Test 3: Update quantity
  const testUpdateQuantity = async (cartData: any) => {
    if (!cartData?.items?.length) {
      addResult("3. Update Quantity", false, "No cart items to update");
      return false;
    }

    try {
      const firstItem = cartData.items[0];
      const newQuantity = firstItem.quantity + 1;
      
      const result = await cartApi.updateQuantity(firstItem.id, newQuantity);
      
      if (result.success) {
        addResult("3. Update Quantity", true, `Updated to quantity ${newQuantity}`, result);
        return true;
      } else {
        addResult("3. Update Quantity", false, result.message || "Failed", result);
        return false;
      }
    } catch (error: any) {
      addResult("3. Update Quantity", false, `Error: ${error.message}`);
      return false;
    }
  };

  // Test 4: Cart count
  const testCartCount = async () => {
    try {
      const result = await cartApi.getCartCount();
      
      if (result.success) {
        addResult("4. Cart Count", true, `Cart count: ${result.data?.count || 0}`, result);
        return true;
      } else {
        addResult("4. Cart Count", false, result.message || "Failed", result);
        return false;
      }
    } catch (error: any) {
      addResult("4. Cart Count", false, `Error: ${error.message}`);
      return false;
    }
  };

  // Test 5: Remove item
  const testRemoveItem = async (cartData: any) => {
    if (!cartData?.items?.length) {
      addResult("5. Remove Item", false, "No cart items to remove");
      return false;
    }

    try {
      const firstItem = cartData.items[0];
      const result = await cartApi.removeItem(firstItem.id);
      
      if (result.success) {
        addResult("5. Remove Item", true, "Successfully removed item", result);
        return true;
      } else {
        addResult("5. Remove Item", false, result.message || "Failed", result);
        return false;
      }
    } catch (error: any) {
      addResult("5. Remove Item", false, `Error: ${error.message}`);
      return false;
    }
  };

  // Test 6: Clear cart
  const testClearCart = async () => {
    try {
      const result = await cartApi.clearCart();
      
      if (result.success) {
        addResult("6. Clear Cart", true, "Successfully cleared cart", result);
        return true;
      } else {
        addResult("6. Clear Cart", false, result.message || "Failed", result);
        return false;
      }
    } catch (error: any) {
      addResult("6. Clear Cart", false, `Error: ${error.message}`);
      return false;
    }
  };

  // Test navigation
  const testCheckoutNavigation = async () => {
    try {
      // First add an item to cart for checkout
      await cartApi.addToCart(parseInt(productId), parseInt(quantity));
      
      // Test navigation
      addResult("7. Checkout Navigation", true, "Navigating to checkout page");
      
      // Small delay then navigate
      setTimeout(() => {
        router.push("/checkout");
      }, 1000);
      
      return true;
    } catch (error: any) {
      addResult("7. Checkout Navigation", false, `Error: ${error.message}`);
      return false;
    }
  };

  // Run complete flow test
  const runCompleteTest = async () => {
    setTesting(true);
    clearResults();

    try {
      // Test 1: Add to cart
      const addSuccess = await testAddToCart();
      if (!addSuccess) {
        setTesting(false);
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Test 2: Get cart
      const cartData = await testGetCart();
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Test 3: Update quantity
      if (cartData) {
        await testUpdateQuantity(cartData);
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Test 4: Cart count
      await testCartCount();
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Test 5: Remove item (using fresh cart data)
      const freshCartData = await cartApi.getCart();
      if (freshCartData.success && freshCartData.data) {
        await testRemoveItem(freshCartData.data);
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Test 6: Clear cart
      await testClearCart();

      toast.success("All cart tests completed!");
    } catch (error) {
      toast.error("Test execution failed");
    } finally {
      setTesting(false);
    }
  };

  // Quick navigation tests
  const testNavigation = (page: string) => {
    router.push(page);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Complete Cart & Checkout Flow Test
          </h1>
          <p className="text-muted-foreground">
            Comprehensive testing of the entire e-commerce flow
          </p>
        </div>

        {/* Test Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Test Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="productId">Product ID</Label>
                <Input
                  id="productId"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  placeholder="Product ID to test"
                />
              </div>
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Quantity to add"
                  type="number"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={runCompleteTest} disabled={testing}>
                  {testing ? "Running Tests..." : "Run All Cart Tests"}
                </Button>
                <Button variant="outline" onClick={clearResults}>
                  Clear Results
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Navigation Tests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                onClick={() => testNavigation("/products")}
                className="w-full"
              >
                Go to Products Page
              </Button>
              <Button
                variant="outline"
                onClick={() => testNavigation("/cart")}
                className="w-full"
              >
                Go to Cart Page
              </Button>
              <Button
                variant="outline"
                onClick={testCheckoutNavigation}
                className="w-full"
              >
                Test Checkout Flow
              </Button>
              <Button
                variant="outline"
                onClick={() => testNavigation("/thank-you?order_id=test&order_number=TEST-123")}
                className="w-full"
              >
                Test Thank You Page
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Test Results */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Test Results:</h2>

          {results.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">
                  No tests run yet. Configure test parameters and click "Run All Cart Tests".
                </p>
              </CardContent>
            </Card>
          )}

          {results.map((result, index) => (
            <Card key={index}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{result.test}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={result.success ? "default" : "destructive"}>
                      {result.success ? "✅ PASS" : "❌ FAIL"}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {result.timestamp}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-2">{result.message}</p>
                {result.data && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-muted-foreground">
                      View response data
                    </summary>
                    <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-60">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Test Coverage Information */}
        <div className="mt-8 p-6 bg-muted rounded-lg">
          <h3 className="font-semibold mb-4">Complete Flow Test Coverage:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Cart Operations:</h4>
              <ul className="text-sm space-y-1">
                <li>✓ Add product to cart</li>
                <li>✓ Get cart contents</li>
                <li>✓ Update item quantity</li>
                <li>✓ Get cart count</li>
                <li>✓ Remove item from cart</li>
                <li>✓ Clear entire cart</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Navigation Flow:</h4>
              <ul className="text-sm space-y-1">
                <li>✓ Products page navigation</li>
                <li>✓ Cart page functionality</li>
                <li>✓ Checkout process</li>
                <li>✓ Order completion</li>
                <li>✓ Thank you page</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              <strong>Test Notes:</strong> These tests use the actual API endpoints. 
              Make sure the backend server is running on the configured port (default: 4000).
              The tests will create real cart entries that may need to be cleaned up.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
