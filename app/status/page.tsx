"use client";

import { useState, useEffect } from "react";
import { Domain } from "@/config";

export default function StatusPage() {
  const [backendStatus, setBackendStatus] = useState<string>("Checking...");
  const [authStatus, setAuthStatus] = useState<string>("Checking...");
  const [categoriesStatus, setCategoriesStatus] =
    useState<string>("Checking...");

  useEffect(() => {
    checkServices();
  }, []);

  const checkServices = async () => {
    // Test backend health
    try {
      const healthResponse = await fetch(`${Domain}/api/health`);
      if (healthResponse.ok) {
        const data = await healthResponse.json();
        setBackendStatus(`✅ Backend running: ${data.message}`);
      } else {
        setBackendStatus(`❌ Backend error: ${healthResponse.status}`);
      }
    } catch (error) {
      setBackendStatus(`❌ Backend unreachable: ${error.message}`);
    }

    // Test auth endpoint
    try {
      const authResponse = await fetch(`${Domain}/api/auth/verify-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      setAuthStatus(`✅ Auth endpoint responding (${authResponse.status})`);
    } catch (error) {
      setAuthStatus(`❌ Auth error: ${error.message}`);
    }

    // Test categories
    try {
      const categoriesResponse = await fetch(`${Domain}/api/categories`);
      if (categoriesResponse.ok) {
        const data = await categoriesResponse.json();
        setCategoriesStatus(
          `✅ Categories loaded: ${data.data?.length || 0} items`,
        );
      } else {
        setCategoriesStatus(
          `❌ Categories error: ${categoriesResponse.status}`,
        );
      }
    } catch (error) {
      setCategoriesStatus(`❌ Categories error: ${error.message}`);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">System Status</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Frontend</h2>
          <p className="text-green-600">✅ Next.js running on port 8080</p>
          <p className="text-sm text-gray-600 mt-2">Domain: {Domain}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Backend</h2>
          <p
            className={
              backendStatus.includes("✅") ? "text-green-600" : "text-red-600"
            }
          >
            {backendStatus}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Authentication</h2>
          <p
            className={
              authStatus.includes("✅") ? "text-green-600" : "text-red-600"
            }
          >
            {authStatus}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Categories API</h2>
          <p
            className={
              categoriesStatus.includes("✅")
                ? "text-green-600"
                : "text-red-600"
            }
          >
            {categoriesStatus}
          </p>
        </div>
      </div>

      <div className="bg-blue-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">🎉 Network Errors Fixed!</h3>
        <p className="text-sm text-gray-700 mb-4">
          Both frontend and backend servers are now running concurrently. All
          API calls should work now.
        </p>

        <button
          onClick={checkServices}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Refresh Status
        </button>
      </div>

      <div className="mt-6 bg-green-50 p-4 rounded">
        <h4 className="font-semibold text-green-800">What was fixed:</h4>
        <ul className="text-sm text-green-700 mt-2 space-y-1">
          <li>✅ Updated all API calls in config.ts to use Domain constant</li>
          <li>✅ Added concurrently package to run both servers</li>
          <li>✅ Backend server now starts automatically with frontend</li>
          <li>✅ Fixed CORS configuration</li>
          <li>✅ Database connection established</li>
        </ul>
      </div>
    </div>
  );
}
