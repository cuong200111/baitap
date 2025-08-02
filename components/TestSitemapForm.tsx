"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Domain } from "@/config";
import { TestTube, Bug } from "lucide-react";

interface TestSitemapFormProps {
  authToken?: string;
}

export default function TestSitemapForm({ authToken }: TestSitemapFormProps) {
  const [formData, setFormData] = useState({
    url: "https://example.com/test-page",
    title: "Test Page",
    description: "Test description",
    priority: 0.2,
    changefreq: "monthly",
    mobile_friendly: true,
    status: "active",
  });

  const [results, setResults] = useState<any[]>([]);

  const handleTestCreate = async () => {
    try {
      console.log("🧪 Testing sitemap creation with data:", formData);
      console.log("🔑 Auth token:", authToken ? "Present" : "Missing");

      const response = await fetch(`${Domain}/api/test-sitemap/create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      console.log("📡 Response status:", response.status);
      const data = await response.json();
      console.log("📦 Response data:", data);

      if (response.ok && data.success) {
        toast.success("✅ Test sitemap created successfully!");
        await handleTestList(); // Refresh list
      } else {
        toast.error(`❌ Test failed: ${data.message}`);
      }
    } catch (error) {
      console.error("🚨 Test create error:", error);
      toast.error("❌ Network error occurred");
    }
  };

  const handleTestList = async () => {
    try {
      console.log("📋 Testing sitemap list...");

      const response = await fetch(`${Domain}/api/test-sitemap/list`);
      const data = await response.json();

      console.log("📋 List response:", data);

      if (response.ok && data.success) {
        setResults(data.data);
        toast.success(`📋 Found ${data.count} sitemaps`);
      } else {
        toast.error(`❌ List failed: ${data.message}`);
      }
    } catch (error) {
      console.error("🚨 Test list error:", error);
      toast.error("❌ Network error occurred");
    }
  };

  const handleDatabaseSetup = async () => {
    try {
      console.log("🔧 Testing database setup...");

      const response = await fetch(`${Domain}/api/test-sitemap/setup`);
      const data = await response.json();

      console.log("🔧 Setup response:", data);

      if (response.ok && data.success) {
        toast.success("🔧 Database setup completed");
      } else {
        toast.error(`❌ Setup failed: ${data.message}`);
      }
    } catch (error) {
      console.error("🚨 Database setup error:", error);
      toast.error("❌ Setup error occurred");
    }
  };

  const handleTestPublic = async () => {
    try {
      console.log("🌐 Testing public endpoint...");

      const response = await fetch(`${Domain}/api/test-sitemap/public`);
      const data = await response.json();

      console.log("🌐 Public endpoint response:", data);

      if (response.ok && data.success) {
        toast.success(
          `🌐 Public endpoint works: ${data.data?.data?.length || 0} items`,
        );
        if (data.data?.data?.length > 0) {
          setResults(data.data.data);
        }
      } else {
        toast.error(`❌ Public endpoint failed: ${data.message}`);
      }
    } catch (error) {
      console.error("🚨 Public endpoint test error:", error);
      toast.error("❌ Public endpoint error occurred");
    }
  };

  if (!authToken) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Bug className="h-6 w-6 text-yellow-500 mr-2" />
          Need auth token for testing
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Debug Sitemap Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>URL</Label>
            <Input
              value={formData.url}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, url: e.target.value }))
              }
            />
          </div>
          <div>
            <Label>Title</Label>
            <Input
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
            />
          </div>
        </div>

        <div>
          <Label>Description</Label>
          <Input
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={handleDatabaseSetup}
            variant="secondary"
            className="col-span-1"
          >
            🔧 DB Setup
          </Button>
          <Button
            onClick={handleTestPublic}
            variant="outline"
            className="col-span-1"
          >
            🌐 Test Public
          </Button>
          <Button onClick={handleTestCreate} className="col-span-1">
            🧪 Test Create
          </Button>
          <Button
            onClick={handleTestList}
            variant="outline"
            className="col-span-1"
          >
            📋 Test List
          </Button>
        </div>

        {results.length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <h4 className="font-semibold mb-2">Results ({results.length}):</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {results.map((item, index) => (
                <div key={index} className="text-sm border-b pb-2">
                  <div>
                    <strong>ID:</strong> {item.id}
                  </div>
                  <div>
                    <strong>URL:</strong> {item.url}
                  </div>
                  <div>
                    <strong>Title:</strong> {item.title || "N/A"}
                  </div>
                  <div>
                    <strong>Status:</strong> {item.status}
                  </div>
                  <div>
                    <strong>Created:</strong>{" "}
                    {new Date(item.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
