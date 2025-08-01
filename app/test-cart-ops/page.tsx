"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { API_DOMAIN } from "@/lib/api-helpers";

export default function TestCartOpsPage() {
  const [sessionId, setSessionId] = useState("");
  const [productId, setProductId] = useState("2"); // Product with stock 3
  const [quantity, setQuantity] = useState("1");
  const [loading, setLoading] = useState(false);
  const [cartContents, setCartContents] = useState<any>(null);

  const generateSession = () => {
    const newSessionId = "test_ops_" + Date.now();
    setSessionId(newSessionId);
    localStorage.setItem("session_id", newSessionId);
  };

  const addToCart = async () => {
    if (!sessionId) {
      toast.error("Generate session first");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_DOMAIN}/api/cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          product_id: parseInt(productId),
          quantity: parseInt(quantity),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Added to cart successfully!");
        await getCart(); // Refresh cart
      } else {
        toast.error(data.message || "Failed to add to cart");
        // Log extra info if available
        if (data.current_in_cart !== undefined) {
          console.log("Current in cart:", data.current_in_cart);
          console.log("Available stock:", data.available_stock);
          console.log("Max can add:", data.max_can_add);
        }
      }
    } catch (error) {
      console.error("Add to cart error:", error);
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const getCart = async () => {
    if (!sessionId) return;

    try {
      const response = await fetch(
        `${API_DOMAIN}/api/cart?session_id=${sessionId}`,
      );
      const data = await response.json();

      if (response.ok && data.success) {
        setCartContents(data.data);
      } else {
        setCartContents(null);
      }
    } catch (error) {
      console.error("Get cart error:", error);
    }
  };

  const clearCart = async () => {
    if (!sessionId) return;

    try {
      const response = await fetch(`${API_DOMAIN}/api/cart`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Cart cleared");
        setCartContents(null);
      }
    } catch (error) {
      console.error("Clear cart error:", error);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Test Cart Operations</h1>

        <div className="space-y-6">
          {/* Session Management */}
          <Card>
            <CardHeader>
              <CardTitle>Session Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Session ID</Label>
                  <div className="flex gap-2">
                    <Input
                      value={sessionId}
                      onChange={(e) => setSessionId(e.target.value)}
                      placeholder="Session ID"
                    />
                    <Button onClick={generateSession}>Generate</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cart Operations */}
          <Card>
            <CardHeader>
              <CardTitle>Add to Cart</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Product ID</Label>
                  <Input
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    placeholder="Product ID"
                  />
                  <p className="text-sm text-muted-foreground">
                    Product 2 has stock quantity of 3
                  </p>
                </div>
                <div>
                  <Label>Quantity</Label>
                  <Input
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Quantity"
                    type="number"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={addToCart} disabled={loading}>
                    {loading ? "Adding..." : "Add to Cart"}
                  </Button>
                  <Button variant="outline" onClick={getCart}>
                    Get Cart
                  </Button>
                  <Button variant="destructive" onClick={clearCart}>
                    Clear Cart
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cart Contents */}
          {cartContents && (
            <Card>
              <CardHeader>
                <CardTitle>Cart Contents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p>
                    <strong>Items:</strong> {cartContents.items?.length || 0}
                  </p>
                  <p>
                    <strong>Total Quantity:</strong>{" "}
                    {cartContents.items?.reduce(
                      (sum: number, item: any) => sum + item.quantity,
                      0,
                    ) || 0}
                  </p>
                  <p>
                    <strong>Subtotal:</strong> {cartContents.summary?.subtotal || 0}₫
                  </p>
                  {cartContents.items?.map((item: any, index: number) => (
                    <div key={index} className="border p-2 rounded">
                      <p>
                        <strong>{item.product_name}</strong> x {item.quantity}
                      </p>
                      <p>Price: {item.final_price}₫ each</p>
                      <p>Total: {item.total_price}₫</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Test Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p>1. Click "Generate" to create a session ID</p>
                <p>2. Try adding 1 item to cart (should succeed)</p>
                <p>3. Try adding 2 more items (total 3, should succeed)</p>
                <p>
                  4. Try adding 1 more item (total would be 4, should fail with
                  better error message)
                </p>
                <p>5. Check cart contents to verify</p>
                <p>6. Clear cart when done</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
