"use client";

import { useState } from "react";
import { apiWrappers } from "@/lib/api-wrapper";
import { API_DOMAIN } from "@/lib/api-helpers";

export default function TestCompletePage() {
  const [result, setResult] = useState("");

  const testBackendConnection = async () => {
    try {
      setResult("Testing backend connection and new APIs...");

      // Test health endpoint
      const healthResponse = await fetch("http://localhost:4000/api/health");
      const healthData = await healthResponse.json();

      // Test config endpoint
      const configResponse = await fetch("http://localhost:4000/api/config");
      const configData = await configResponse.json();

      // Test utils endpoint
      const utilsResponse = await fetch("http://localhost:4000/api/utils/format", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'price', value: 1000000 })
      });
      const utilsData = await utilsResponse.json();

      if (healthData.success && configData.success && utilsData.success) {
        setResult(`✅ All APIs working!\n\n🏥 Health: ${healthData.message}\n\n⚙️ Config loaded: ${configData.data.app.name}\n\n🛠️ Utils format: ${utilsData.data.result}\n\nFull responses:\n${JSON.stringify({health: healthData, config: configData, utils: utilsData}, null, 2)}`);
      } else {
        setResult("❌ Some APIs failed");
      }
    } catch (error) {
      setResult("❌ Backend connection error: " + error.message);
    }
  };

  const testCreateAdmin = async () => {
    try {
      setResult("Creating admin user...");

      const data = await apiWrappers.auth.createAdmin();
      setResult("Admin Creation Result:\n\n" + JSON.stringify(data, null, 2));
    } catch (error) {
      setResult("❌ Admin creation error: " + error.message);
    }
  };

  const testLogin = async () => {
    try {
      setResult("Testing login...");

      const data = await apiWrappers.auth.login("admin@zoxvn.com", "admin123");
      setResult("Login Test Result:\n\n" + JSON.stringify(data, null, 2));
    } catch (error) {
      setResult("❌ Login test error: " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Complete System Test</h1>
        
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <button
            onClick={testBackendConnection}
            className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            1. Test Backend
          </button>
          
          <button
            onClick={testCreateAdmin}
            className="px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700"
          >
            2. Create Admin
          </button>
          
          <button
            onClick={testLogin}
            className="px-6 py-3 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            3. Test Login
          </button>
        </div>
        
        {result && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Test Result:</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto whitespace-pre-wrap">
              {result}
            </pre>
          </div>
        )}
        
        <div className="mt-8 text-center">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">System Architecture</h2>
            <div className="text-left space-y-2">
              <p>✅ <strong>Frontend:</strong> Next.js port 8080 (Pure SPA, minimal lib)</p>
              <p>✅ <strong>Backend:</strong> Express.js port 4000 (Complete API with utilities)</p>
              <p>✅ <strong>Database:</strong> MySQL (103.57.221.79)</p>
              <p>✅ <strong>API Structure:</strong> Direct HTTP calls (no Next.js API routes)</p>
              <p>✅ <strong>Auth:</strong> JWT-based authentication</p>
              <p>✅ <strong>Utilities:</strong> Backend APIs for format/validate/generate</p>
              <p>✅ <strong>Config:</strong> Backend API config system</p>
              <p>✅ <strong>SEO:</strong> Backend API for SEO operations</p>
            </div>
            
            <div className="mt-6">
              <p className="font-medium">Test Steps:</p>
              <ol className="list-decimal list-inside text-left mt-2">
                <li>Test backend connection to verify API health</li>
                <li>Create admin user in real database</li>
                <li>Test login with real authentication</li>
                <li>Go to <a href="/login" className="text-blue-600 underline">/login</a> for real login</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
