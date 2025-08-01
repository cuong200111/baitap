"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { API_DOMAIN } from "@/lib/api-helpers";

export default function TestCartAPIPage() {
  const [results, setResults] = useState<any[]>([]);
  const [testing, setTesting] = useState(false);

  const addResult = (test: string, success: boolean, message: string, data?: any) => {
    const result = {
      test,
      success,
      message,
      data,
      timestamp: new Date().toLocaleTimeString(),
    };
    setResults(prev => [...prev, result]);
  };

  const testGuestCart = async () => {
    const sessionId = 'test_session_' + Date.now();
    
    try {
      // Test adding to cart as guest
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
        addResult("Guest Add to Cart", true, "Successfully added product to guest cart", data);
        
        // Test getting guest cart
        const getResponse = await fetch(`${API_DOMAIN}/api/cart?session_id=${sessionId}`);
        const getdata = await getResponse.json();
        
        if (getResponse.ok && getdata.success) {
          addResult("Guest Get Cart", true, `Cart has ${getdata.data?.items?.length || 0} items`, getdata.data);
        } else {
          addResult("Guest Get Cart", false, getdata.message || "Failed to get cart");
        }
      } else {
        addResult("Guest Add to Cart", false, data.message || "Unknown error", data);
      }
    } catch (error: any) {
      addResult("Guest Cart Test", false, `Network error: ${error.message}`);
    }
  };

  const testStockValidation = async () => {
    const sessionId = 'test_stock_' + Date.now();
    
    try {
      // Test with large quantity to trigger stock validation
      const response = await fetch(`${API_DOMAIN}/api/cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          product_id: 1,
          quantity: 999,
        }),
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        if (data.message && data.message.toLowerCase().includes('stock')) {
          addResult("Stock Validation", true, "Stock validation working correctly", data);
        } else {
          addResult("Stock Validation", false, "Stock validation may not be working", data);
        }
      } else {
        addResult("Stock Validation", false, "Large quantity was accepted (stock validation may be broken)", data);
      }
    } catch (error: any) {
      addResult("Stock Validation Test", false, `Network error: ${error.message}`);
    }
  };

  const testAPIHealth = async () => {
    try {
      const response = await fetch(`${API_DOMAIN}/api/health`);
      const data = await response.json();
      
      if (response.ok && data.success) {
        addResult("API Health", true, "Backend is healthy", data);
      } else {
        addResult("API Health", false, "Backend health check failed", data);
      }
    } catch (error: any) {
      addResult("API Health", false, `Cannot connect to backend: ${error.message}`);
    }
  };

  const runAllTests = async () => {
    setTesting(true);
    setResults([]);
    
    try {
      await testAPIHealth();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await testGuestCart();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await testStockValidation();
      
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
          <h1 className="text-3xl font-bold mb-2">Cart API Test Page</h1>
          <p className="text-muted-foreground">
            Test the cart API fixes for authenticated and guest users
          </p>
        </div>

        <div className="mb-6 space-x-4">
          <Button onClick={runAllTests} disabled={testing}>
            {testing ? "Running Tests..." : "Run All Tests"}
          </Button>
          <Button variant="outline" onClick={testAPIHealth}>
            Test API Health
          </Button>
          <Button variant="outline" onClick={testGuestCart}>
            Test Guest Cart
          </Button>
          <Button variant="outline" onClick={testStockValidation}>
            Test Stock Validation
          </Button>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Test Results:</h2>
          
          {results.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">No tests run yet. Click "Run All Tests" to start.</p>
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
                    <span className="text-sm text-muted-foreground">{result.timestamp}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-2">{result.message}</p>
                {result.data && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-muted-foreground">
                      View raw response
                    </summary>
                    <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">API Configuration:</h3>
          <p className="text-sm">
            <strong>Backend URL:</strong> {API_DOMAIN}
          </p>
          <p className="text-sm">
            <strong>Expected Port:</strong> 4000
          </p>
        </div>
      </div>
    </div>
  );
}
