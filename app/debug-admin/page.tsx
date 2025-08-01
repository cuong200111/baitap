"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiWrappers } from "@/lib/api-wrapper";
import { testAPI } from "@/lib/test-api";

export default function DebugAdminPage() {
  const [token, setToken] = useState("");
  const [result, setResult] = useState("");
  const [email, setEmail] = useState("admin@hacom.vn");
  const [password, setPassword] = useState("admin123");

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  const testLogin = async () => {
    try {
      setResult("Testing login...");
      const response = await apiWrappers.auth.login(email, password);
      setResult(JSON.stringify(response, null, 2));
      
      if (response.success && response.data?.token) {
        localStorage.setItem("token", response.data.token);
        setToken(response.data.token);
      }
    } catch (error: any) {
      setResult("Error: " + error.message);
    }
  };

  const testCategories = async () => {
    try {
      setResult("Testing categories...");
      const response = await apiWrappers.categories.getAll();
      setResult(JSON.stringify(response, null, 2));
    } catch (error: any) {
      setResult("Error: " + error.message);
    }
  };

  const testCreateCategory = async () => {
    try {
      setResult("Testing create category...");
      const response = await apiWrappers.categories.create({
        name: "Test Category " + Date.now(),
        description: "Test category",
        sort_order: 999
      });
      setResult(JSON.stringify(response, null, 2));
    } catch (error: any) {
      setResult("Error: " + error.message);
    }
  };

  const testBackendHealth = async () => {
    try {
      setResult("Testing backend health...");
      const data = await testAPI.health();
      setResult(JSON.stringify(data, null, 2));
    } catch (error: any) {
      setResult("Error: " + error.message);
    }
  };

  const testDirectLogin = async () => {
    try {
      setResult("Testing direct login...");
      const data = await testAPI.login(email, password);
      setResult(JSON.stringify(data, null, 2));

      if (data.success && data.data?.token) {
        localStorage.setItem("token", data.data.token);
        setToken(data.data.token);
      }
    } catch (error: any) {
      setResult("Error: " + error.message);
    }
  };

  const testGuestOrder = async () => {
    try {
      setResult("Testing guest order...");
      const orderData = {
        items: [
          {
            product_id: 1,
            quantity: 1,
            price: 100000
          }
        ],
        customer_name: "Test Customer",
        customer_email: "test@example.com",
        customer_phone: "0123456789",
        shipping_address: "123 Test Street, Test City",
        notes: "Test order"
      };
      const data = await apiWrappers.orders.createGuest(orderData);
      setResult(JSON.stringify(data, null, 2));
    } catch (error: any) {
      setResult("Error: " + error.message);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Debug Admin API</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label>Email:</label>
              <Input 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label>Password:</label>
              <Input 
                type="password"
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <label>Current Token:</label>
            <Input 
              value={token} 
              onChange={(e) => setToken(e.target.value)}
              placeholder="JWT Token"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button onClick={testBackendHealth}>Test Backend Health</Button>
            <Button onClick={testLogin}>Test Wrapper Login</Button>
            <Button onClick={testDirectLogin}>Test Direct Login</Button>
            <Button onClick={testCategories}>Test Get Categories</Button>
            <Button onClick={testCreateCategory}>Test Create Category</Button>
          </div>

          <div>
            <label>Result:</label>
            <pre className="bg-gray-100 p-4 rounded mt-2 overflow-auto max-h-96">
              {result}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
