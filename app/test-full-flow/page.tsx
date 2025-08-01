"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { API_DOMAIN } from "@/lib/api-helpers";
import { apiWrappers } from "@/lib/api-wrapper";

export default function TestFullFlowPage() {
  const [results, setResults] = useState<any[]>([]);
  const [testing, setTesting] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");

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
    setSessionId("");
  };

  const testAddToCart = async () => {
    // Generate session ID for guest testing
    const testSessionId = "test_flow_" + Date.now();
    setSessionId(testSessionId);

    try {
      const response = await fetch(`${API_DOMAIN}/api/cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: testSessionId,
          product_id: 1,
          quantity: 1,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        addResult(
          "1. Add to Cart",
          true,
          "Successfully added product to cart",
          data,
        );
        return true;
      } else {
        addResult("1. Add to Cart", false, data.message || "Failed", data);
        return false;
      }
    } catch (error: any) {
      addResult("1. Add to Cart", false, `Network error: ${error.message}`);
      return false;
    }
  };

  const testGetCart = async () => {
    try {
      const response = await fetch(
        `${API_DOMAIN}/api/cart?session_id=${sessionId}`,
      );
      const data = await response.json();

      if (response.ok && data.success && data.data?.items?.length > 0) {
        addResult(
          "2. Get Cart",
          true,
          `Cart has ${data.data.items.length} items`,
          data.data,
        );
        return true;
      } else {
        addResult("2. Get Cart", false, "Cart is empty or failed", data);
        return false;
      }
    } catch (error: any) {
      addResult("2. Get Cart", false, `Network error: ${error.message}`);
      return false;
    }
  };

  const testAddDuplicateProduct = async () => {
    try {
      const response = await fetch(`${API_DOMAIN}/api/cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          product_id: 1,
          quantity: 1,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        addResult(
          "3. Add Duplicate",
          true,
          "Successfully updated quantity in cart",
          data,
        );
        return true;
      } else {
        addResult("3. Add Duplicate", false, data.message || "Failed", data);
        return false;
      }
    } catch (error: any) {
      addResult("3. Add Duplicate", false, `Network error: ${error.message}`);
      return false;
    }
  };

  const testCartAPI = async () => {
    try {
      const cartData = await apiWrappers.cart.getAll({ session_id: sessionId });

      if (cartData.success && cartData.data?.items?.length > 0) {
        addResult(
          "4. Cart API Wrapper",
          true,
          "API wrapper working correctly",
          cartData.data,
        );
        return true;
      } else {
        addResult("4. Cart API Wrapper", false, "API wrapper failed", cartData);
        return false;
      }
    } catch (error: any) {
      addResult("4. Cart API Wrapper", false, `Error: ${error.message}`);
      return false;
    }
  };

  const testCreateOrder = async () => {
    try {
      const orderData = {
        items: [
          {
            product_id: 1,
            quantity: 2,
            price: 1000000,
          },
        ],
        customer_name: "Test Customer",
        customer_email: "test@example.com",
        customer_phone: "0123456789",
        shipping_address: "123 Test Street, Test City",
        billing_address: "123 Test Street, Test City",
        notes: "Test order from flow testing",
      };

      const response = await apiWrappers.orders.createGuest(orderData);

      if (response.success && response.data) {
        addResult(
          "5. Create Order",
          true,
          "Order created successfully",
          response.data,
        );
        return response.data;
      } else {
        addResult("5. Create Order", false, response.message || "Failed");
        return null;
      }
    } catch (error: any) {
      addResult("5. Create Order", false, `Error: ${error.message}`);
      return null;
    }
  };

  const testClearCart = async () => {
    try {
      const response = await apiWrappers.cart.clear({ session_id: sessionId });

      if (response.success) {
        addResult("6. Clear Cart", true, "Cart cleared successfully", response);
        return true;
      } else {
        addResult("6. Clear Cart", false, response.message || "Failed");
        return false;
      }
    } catch (error: any) {
      addResult("6. Clear Cart", false, `Error: ${error.message}`);
      return false;
    }
  };

  const runFullTest = async () => {
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
      const getSuccess = await testGetCart();
      if (!getSuccess) {
        setTesting(false);
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Test 3: Add duplicate product (should update quantity)
      await testAddDuplicateProduct();
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Test 4: Test API wrapper
      await testCartAPI();
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Test 5: Create order
      const orderData = await testCreateOrder();
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Test 6: Clear cart
      await testClearCart();

      toast.success("All tests completed!");
    } catch (error) {
      toast.error("Test execution failed");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Full Cart & Checkout Flow Test
          </h1>
          <p className="text-muted-foreground">
            Comprehensive test of the entire cart and checkout flow
          </p>
        </div>

        <div className="mb-6 flex gap-4">
          <Button onClick={runFullTest} disabled={testing}>
            {testing ? "Running Full Test..." : "Run Full Test"}
          </Button>
          <Button variant="outline" onClick={clearResults}>
            Clear Results
          </Button>
          {sessionId && (
            <Badge variant="outline" className="px-4 py-2">
              Session: {sessionId.substring(0, 20)}...
            </Badge>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Test Results:</h2>

          {results.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">
                  No tests run yet. Click "Run Full Test" to start.
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
                    <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-40">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">Test Coverage:</h3>
          <ul className="text-sm space-y-1">
            <li>✓ Add product to cart (guest session)</li>
            <li>✓ Get cart contents</li>
            <li>✓ Update quantity by adding same product</li>
            <li>✓ API wrapper functionality</li>
            <li>✓ Create guest order</li>
            <li>✓ Clear cart after order</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
