"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiWrappers } from "@/lib/api-wrapper";

export default function SetupAdminPage() {
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const createAdmin = async () => {
    setLoading(true);
    setStatus("Creating admin user...");

    try {
      const data = await apiWrappers.auth.createAdmin();
      
      if (data.success) {
        setStatus("✅ Admin user created successfully!");
      } else {
        setStatus("❌ Error: " + data.message);
      }
    } catch (error) {
      setStatus("❌ Error: " + error.message);
    }
    
    setLoading(false);
  };

  const testLogin = async () => {
    setLoading(true);
    setStatus("Testing login...");

    try {
      const data = await apiWrappers.auth.login("admin@zoxvn.com", "admin123");
      
      if (data.success) {
        setStatus("✅ Login test successful! Redirecting to login page...");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        setStatus("❌ Login failed: " + data.message);
      }
    } catch (error) {
      setStatus("❌ Login error: " + error.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">Setup Admin User</h1>
        
        <div className="space-y-4 mb-6">
          <button
            onClick={createAdmin}
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Creating..." : "1. Create Admin User"}
          </button>
          
          <button
            onClick={testLogin}
            disabled={loading}
            className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Testing..." : "2. Test Login"}
          </button>
        </div>
        
        {status && (
          <div className="p-3 bg-gray-100 rounded text-sm mb-4">
            {status}
          </div>
        )}
        
        <div className="text-sm text-gray-600 text-center">
          <p className="font-medium">Admin Credentials:</p>
          <p>Email: admin@zoxvn.com</p>
          <p>Password: admin123</p>
          
          <div className="mt-4">
            <a href="/login" className="text-blue-600 hover:underline">
              Go to Login Page
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
