"use client";

import { useState } from "react";
import { API_DOMAIN } from "@/lib/api-helpers";

export function DebugCategoriesButton() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/debug/categories-test");
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const ensureCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/debug/ensure-categories", {
        method: "POST",
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testMegaMenu = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/categories?mega_menu=true");
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const addSampleReviews = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/debug/add-sample-reviews", {
        method: "POST",
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const addSampleProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/debug/add-sample-products", {
        method: "POST",
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const populateAllData = async () => {
    setLoading(true);
    try {
      // Populate categories first
      await fetch("/api/debug/ensure-categories", { method: "POST" });

      // Then products
      await fetch("/api/debug/add-sample-products", { method: "POST" });

      // Then reviews
      await fetch("/api/debug/add-sample-reviews", { method: "POST" });

      // Finally test orders
      await fetch("/api/debug/create-test-order", { method: "POST" });
      await fetch("/api/debug/create-test-order", { method: "POST" });

      setResult({ message: "All sample data populated successfully!" });
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const createTestOrder = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/debug/create-test-order", {
        method: "POST",
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg z-50">
      <h3 className="text-sm font-bold mb-2">Categories Debug</h3>
      <div className="space-y-2">
        <button
          onClick={testCategories}
          disabled={loading}
          className="block w-full px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Test Categories
        </button>
        <button
          onClick={ensureCategories}
          disabled={loading}
          className="block w-full px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          Ensure Categories
        </button>
        <button
          onClick={testMegaMenu}
          disabled={loading}
          className="block w-full px-3 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
        >
          Test Mega Menu
        </button>
        <button
          onClick={addSampleReviews}
          disabled={loading}
          className="block w-full px-3 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
        >
          Add Sample Reviews
        </button>
        <button
          onClick={addSampleProducts}
          disabled={loading}
          className="block w-full px-3 py-1 text-xs bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:opacity-50"
        >
          Add Sample Products
        </button>
        <button
          onClick={populateAllData}
          disabled={loading}
          className="block w-full px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          🚀 Populate All Sample Data
        </button>
        <button
          onClick={createTestOrder}
          disabled={loading}
          className="block w-full px-3 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
        >
          📦 Create Test Order
        </button>
      </div>
      {loading && <p className="text-xs text-blue-600 mt-2">Loading...</p>}
      {result && (
        <div className="mt-2 max-h-32 overflow-y-auto">
          <pre className="text-xs bg-gray-100 p-2 rounded">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
