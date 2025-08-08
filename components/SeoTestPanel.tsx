"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  FileText,
  Search,
  Link,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
  Download,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import { API_DOMAIN } from "@/lib/api-helpers";
interface TestResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export default function SeoTestPanel() {
  const [testing, setTesting] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, TestResult>>({});

  const testApiEndpoint = async (
    endpoint: string,
    method: string = "GET",
    testName: string,
    expectJson: boolean = true,
  ) => {
    setTesting(testName);
    try {
      const response = await fetch(endpoint, {
        method,
        headers:
          expectJson && expectJson !== true
            ? expectJson
            : { "Content-Type": "application/json" },
      });

      let data: any;
      let responseContent: string;

      if (expectJson) {
        data = await response.json();
        responseContent =
          data.message || `${method} ${endpoint} - ${response.status}`;
      } else {
        responseContent = await response.text();
        data = { content: responseContent.substring(0, 200) + "..." }; // Preview content
      }

      const result: TestResult = {
        success: response.ok,
        message: expectJson
          ? responseContent
          : `${method} ${endpoint} - ${response.status} (${responseContent.length} chars)`,
        data: data,
        error: !response.ok
          ? expectJson
            ? data.error
            : `HTTP ${response.status}`
          : undefined,
      };

      setResults((prev) => ({ ...prev, [testName]: result }));

      if (result.success) {
        toast.success(`✅ ${testName} thành công`);
      } else {
        toast.error(
          `❌ ${testName} thất bại: ${result.error || result.message}`,
        );
      }
    } catch (error) {
      const result: TestResult = {
        success: false,
        message: `Network error`,
        error: error instanceof Error ? error.message : "Unknown error",
      };
      setResults((prev) => ({ ...prev, [testName]: result }));
      toast.error(`❌ ${testName} lỗi: ${result.error}`);
    } finally {
      setTesting(null);
    }
  };
  // Helper to get full URL and auth headers
  const getApiUrlAndHeaders = (
    endpoint: string,
    expectJson: boolean = true,
  ) => {
    const url = endpoint.startsWith("http")
      ? endpoint
      : `${API_DOMAIN}${endpoint}`;
    let headers: HeadersInit = expectJson
      ? { "Content-Type": "application/json" }
      : {};
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        headers = {
          ...headers,
          Authorization: `Bearer ${token}`,
        };
      }
    }
    return { url, headers };
  };
  const testSeoSettings = () => {
    const { url, headers }: any = getApiUrlAndHeaders(
      "/api/admin/seo-settings",
    );
    return testApiEndpoint(url, "GET", "SEO Settings API", headers);
  };
  const testSeoStatus = () => {
    const { url, headers }: any = getApiUrlAndHeaders("/api/admin/seo-status");
    console.log(headers);
    return testApiEndpoint(url, "GET", "SEO Status Check", headers);
  };
  const testSeoAudit = () => {
    const { url, headers }: any = getApiUrlAndHeaders("/api/admin/seo-audit");
    return testApiEndpoint(url, "GET", "SEO Audit", headers);
  };
  const testSitemapXml = () => {
    const { url, headers }: any = getApiUrlAndHeaders("/sitemap.xml", false);
    return testApiEndpoint(url, "GET", "Sitemap XML", headers);
  };
  const testRobotsTxt = () => {
    const { url, headers }: any = getApiUrlAndHeaders("/robots.txt", false);
    return testApiEndpoint(url, "GET", "Robots.txt", headers);
  };

  // Advanced SEO API tests
  const testContentAnalysis = () => {
    const { url, headers }: any = getApiUrlAndHeaders(
      "/api/admin/seo-content-analysis",
    );
    return testApiEndpoint(url, "GET", "Content Analysis API", headers);
  };
  const testPerformance = () => {
    const { url, headers }: any = getApiUrlAndHeaders(
      "/api/admin/seo-performance",
    );
    return testApiEndpoint(url, "GET", "Performance API", headers);
  };
  const testAIRecommendations = () => {
    const { url, headers }: any = getApiUrlAndHeaders(
      "/api/admin/seo-ai-recommendations",
    );
    return testApiEndpoint(url, "GET", "AI Recommendations", headers);
  };
  const testCoreWebVitals = () => {
    const { url, headers }: any = getApiUrlAndHeaders(
      "/api/admin/core-web-vitals",
    );
    return testApiEndpoint(url, "GET", "Core Web Vitals", headers);
  };
  const testLinkOptimization = () => {
    const { url, headers }: any = getApiUrlAndHeaders(
      "/api/admin/seo-link-optimization",
    );
    return testApiEndpoint(url, "GET", "Link Optimization", headers);
  };
  const testInternational = () => {
    const { url, headers }: any = getApiUrlAndHeaders(
      "/api/admin/seo-international",
    );
    return testApiEndpoint(url, "GET", "International SEO", headers);
  };
  const testAutoFix = () => {
    const { url, headers }: any = getApiUrlAndHeaders(
      "/api/admin/seo-auto-fix",
    );
    return testApiEndpoint(url, "POST", "Auto-Fix API", headers);
  };
  const testBulkUpdate = () => {
    const { url, headers }: any = getApiUrlAndHeaders(
      "/api/admin/seo-bulk-update",
    );
    return testApiEndpoint(url, "GET", "Bulk Update API", headers);
  };
  const testAllSeoAPI = () => {
    const { url, headers }: any = getApiUrlAndHeaders(
      "/api/admin/seo-test-all",
    );
    return testApiEndpoint(url, "GET", "SEO Test All", headers);
  };
  const testXmlValidation = async () => {
    const testName = "XML Validation";
    setTesting(testName);
    try {
      const { url, headers }: any = getApiUrlAndHeaders(
        "/api/admin/validate-xml?url=/sitemap.xml",
      );
      const response = await fetch(url, {
        method: "GET",
        headers,
      });

      let data: any;
      try {
        data = await response.json();
      } catch (jsonError) {
        // If JSON parsing fails, treat as a validation error
        data = {
          success: false,
          message: "Invalid JSON response",
          error: jsonError.message,
          data: {
            isValid: false,
            errors: ["Server returned non-JSON response"],
            warnings: [],
            stats: { size: 0, lines: 0, urls: 0, images: 0 },
          },
        };
      }

      const result: TestResult = {
        success: data.success && data.data?.isValid !== false,
        message: data.success
          ? data.data?.isValid
            ? "XML validation passed"
            : `XML validation failed: ${data.data?.errors?.join(", ") || "Unknown error"}`
          : data.message || `HTTP ${response.status}`,
        data: data.data,
        error: !data.success
          ? data.error
          : !data.data?.isValid
            ? data.data?.errors?.join(", ")
            : undefined,
      };

      setResults((prev) => ({ ...prev, [testName]: result }));

      if (result.success) {
        toast.success(`✅ ${testName} thành công`);
      } else {
        toast.error(
          `❌ ${testName} thất bại: ${result.error || result.message}`,
        );
      }
    } catch (error) {
      const result: TestResult = {
        success: false,
        message: `Network error`,
        error: error instanceof Error ? error.message : "Unknown error",
      };
      setResults((prev) => ({ ...prev, [testName]: result }));
      toast.error(`❌ ${testName} lỗi: ${result.error}`);
    } finally {
      setTesting(null);
    }
  };

  const allTests = [
    { name: "SEO Status Check", test: testSeoStatus, icon: Activity },
    { name: "SEO Audit", test: testSeoAudit, icon: CheckCircle },
    { name: "SEO Settings API", test: testSeoSettings, icon: Activity },
    { name: "Sitemap Generation", test: testSitemap, icon: FileText },
    { name: "Robots.txt Generation", test: testRobots, icon: Search },
    { name: "Sitemap XML", test: testSitemapXml, icon: Link },
    { name: "Robots.txt", test: testRobotsTxt, icon: FileText },
    { name: "Content Analysis", test: testContentAnalysis, icon: FileText },
    { name: "Performance API", test: testPerformance, icon: Activity },
    {
      name: "AI Recommendations",
      test: testAIRecommendations,
      icon: CheckCircle,
    },
    { name: "Core Web Vitals", test: testCoreWebVitals, icon: Activity },
    { name: "Link Optimization", test: testLinkOptimization, icon: Link },
    { name: "International SEO", test: testInternational, icon: Activity },
    { name: "Auto-Fix API", test: testAutoFix, icon: CheckCircle },
    { name: "SEO Test All", test: testAllSeoAPI, icon: Activity },
    { name: "XML Validation", test: testXmlValidation, icon: CheckCircle },
  ];

  const runAllTests = async () => {
    for (const testCase of allTests) {
      await testCase.test();
      // Small delay between tests
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  };

  const getStatusIcon = (testName: string) => {
    const result = results[testName];
    if (!result) return null;

    return result.success ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusBadge = (testName: string) => {
    const result = results[testName];
    if (!result) return null;

    return (
      <Badge
        variant={result.success ? "default" : "destructive"}
        className="text-xs"
      >
        {result.success ? "PASS" : "FAIL"}
      </Badge>
    );
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          SEO Function Testing
        </CardTitle>
        <p className="text-sm text-gray-600">
          Test tất cả các chức năng SEO bao gồm AI-powered optimization,
          performance monitoring, và advanced analytics
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Button
            onClick={runAllTests}
            disabled={!!testing}
            className="flex items-center gap-2"
          >
            {testing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Activity className="h-4 w-4" />
            )}
            {testing ? `Testing: ${testing}` : "Run All Tests"}
          </Button>

          <Button
            variant="outline"
            onClick={() => window.open("/sitemap.xml", "_blank")}
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            View Sitemap
          </Button>

          <Button
            variant="outline"
            onClick={() => window.open("/robots.txt", "_blank")}
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            View Robots.txt
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {allTests.map((testCase) => {
            const Icon = testCase.icon;
            const result = results[testCase.name];

            return (
              <div
                key={testCase.name}
                className="border rounded-lg p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{testCase.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(testCase.name)}
                    {getStatusBadge(testCase.name)}
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={testCase.test}
                  disabled={testing === testCase.name}
                  className="w-full"
                >
                  {testing === testCase.name ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin mr-2" />
                      Testing...
                    </>
                  ) : (
                    "Test"
                  )}
                </Button>

                {result && (
                  <div className="text-xs text-gray-600">
                    {result.success ? (
                      <div>
                        <span className="text-green-600">
                          ✅ {result.message}
                        </span>
                        {result.data?.content && (
                          <div className="mt-1 p-2 bg-gray-100 rounded text-xs font-mono max-h-20 overflow-y-auto">
                            {result.data.content}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-red-600">
                        ❌ {result.error || result.message}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Test Results Summary */}
        {Object.keys(results).length > 0 && (
          <Alert className="mt-4">
            <Activity className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div>
                  <strong>Test Results:</strong>{" "}
                  <span className="text-green-600 font-medium">
                    {Object.values(results).filter((r) => r.success).length}{" "}
                    passed
                  </span>
                  ,{" "}
                  <span className="text-red-600 font-medium">
                    {Object.values(results).filter((r) => !r.success).length}{" "}
                    failed
                  </span>{" "}
                  out of{" "}
                  <span className="font-medium">
                    {Object.keys(results).length} tests
                  </span>
                  {Object.values(results).every((r) => r.success) && (
                    <span className="text-green-600 font-medium">
                      {" "}
                      - All tests passed! 🎉
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  Success Rate:{" "}
                  {Math.round(
                    (Object.values(results).filter((r) => r.success).length /
                      Object.keys(results).length) *
                      100,
                  )}
                  %
                  {Object.keys(results).length === allTests.length && (
                    <span className="ml-2 text-green-600">
                      - Complete test coverage
                    </span>
                  )}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Additional SEO Tools */}
        <div className="border-t pt-4 mt-6">
          <h4 className="font-semibold mb-3">SEO Tools & Validators</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                window.open(
                  "https://search.google.com/test/rich-results",
                  "_blank",
                )
              }
              className="justify-start text-xs"
            >
              <Search className="h-3 w-3 mr-2" />
              Rich Results Test
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                window.open("https://pagespeed.web.dev/", "_blank")
              }
              className="justify-start text-xs"
            >
              <Activity className="h-3 w-3 mr-2" />
              PageSpeed Insights
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open("https://validator.w3.org/", "_blank")}
              className="justify-start text-xs"
            >
              <CheckCircle className="h-3 w-3 mr-2" />
              HTML Validator
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                window.open(
                  "https://www.xml-sitemaps.com/validate-xml-sitemap.html",
                  "_blank",
                )
              }
              className="justify-start text-xs"
            >
              <FileText className="h-3 w-3 mr-2" />
              Sitemap Validator
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
