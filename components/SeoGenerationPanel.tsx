"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  FileText,
  Search,
  ExternalLink,
  Loader2,
  CheckCircle,
  AlertCircle,
  Download,
  Zap,
  Globe,
  Link,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import { Domain } from "@/config";

// Helper function for authenticated API calls
const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  return fetch(url, { ...options, headers });
};

export default function SeoGenerationPanel() {
  const [generatingSitemap, setGeneratingSitemap] = useState(false);
  const [generatingRobots, setGeneratingRobots] = useState(false);
  const [validatingXml, setValidatingXml] = useState(false);
  const [sitemapResult, setSitemapResult] = useState<any>(null);
  const [robotsResult, setRobotsResult] = useState<any>(null);
  const [validationResult, setValidationResult] = useState<any>(null);

  const generateSitemap = async () => {
    setGeneratingSitemap(true);
    try {
      const response = await authenticatedFetch(
        `${Domain}/api/admin/generate-sitemap`,
        {
          method: "POST",
        },
      );
      const data = await response.json();

      if (data.success) {
        setSitemapResult(data);
        toast.success(
          `🎉 Sitemap generated successfully with ${data.urlCount} URLs`,
        );
      } else {
        toast.error("❌ Failed to generate sitemap");
      }
    } catch (error) {
      toast.error("❌ Error generating sitemap");
      console.error("Sitemap generation error:", error);
    } finally {
      setGeneratingSitemap(false);
    }
  };

  const generateRobots = async () => {
    setGeneratingRobots(true);
    try {
      const response = await authenticatedFetch(
        `${Domain}/api/admin/generate-robots`,
        {
          method: "POST",
        },
      );
      const data = await response.json();

      if (data.success) {
        setRobotsResult(data);
        toast.success(
          `🎉 Robots.txt generated successfully with ${data.linesGenerated} lines`,
        );
      } else {
        toast.error("❌ Failed to generate robots.txt");
      }
    } catch (error) {
      toast.error("❌ Error generating robots.txt");
      console.error("Robots generation error:", error);
    } finally {
      setGeneratingRobots(false);
    }
  };

  const generateBoth = async () => {
    await generateSitemap();
    await generateRobots();
  };

  const validateSitemap = async () => {
    setValidatingXml(true);
    try {
      const response = await authenticatedFetch(
        `${Domain}/api/admin/validate-xml?url=/sitemap.xml`,
      );
      const data = await response.json();

      if (data.success) {
        setValidationResult(data.data);
        if (data.data.isValid) {
          toast.success(
            `🎉 Sitemap XML is valid! ${data.data.stats.urls} URLs found`,
          );
        } else {
          toast.error(
            `❌ Sitemap has ${data.data.errors.length} validation errors`,
          );
        }
      } else {
        toast.error("❌ Failed to validate sitemap");
      }
    } catch (error) {
      toast.error("❌ Error validating sitemap");
      console.error("Validation error:", error);
    } finally {
      setValidatingXml(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          SEO Files Generation
        </CardTitle>
        <p className="text-sm text-gray-600">
          Tự động tạo sitemap.xml và robots.txt cho website của bạn
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Generation Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button
            onClick={generateSitemap}
            disabled={generatingSitemap}
            className="flex items-center gap-2 h-12"
            size="lg"
          >
            {generatingSitemap ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <FileText className="h-5 w-5" />
            )}
            <div className="text-left">
              <div className="font-medium">Generate Sitemap</div>
              <div className="text-xs opacity-80">XML sitemap file</div>
            </div>
          </Button>

          <Button
            onClick={generateRobots}
            disabled={generatingRobots}
            className="flex items-center gap-2 h-12"
            size="lg"
            variant="outline"
          >
            {generatingRobots ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Search className="h-5 w-5" />
            )}
            <div className="text-left">
              <div className="font-medium">Generate Robots</div>
              <div className="text-xs opacity-80">Robots.txt file</div>
            </div>
          </Button>

          <Button
            onClick={generateBoth}
            disabled={generatingSitemap || generatingRobots}
            className="flex items-center gap-2 h-12"
            size="lg"
            variant="secondary"
          >
            {generatingSitemap || generatingRobots ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Globe className="h-5 w-5" />
            )}
            <div className="text-left">
              <div className="font-medium">Generate Both</div>
              <div className="text-xs opacity-80">Sitemap + Robots</div>
            </div>
          </Button>

          <Button
            onClick={validateSitemap}
            disabled={validatingXml}
            className="flex items-center gap-2 h-12"
            size="lg"
            variant="outline"
          >
            {validatingXml ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <CheckCircle className="h-5 w-5" />
            )}
            <div className="text-left">
              <div className="font-medium">Validate XML</div>
              <div className="text-xs opacity-80">Check sitemap</div>
            </div>
          </Button>
        </div>

        {/* Results Display */}
        {(sitemapResult || robotsResult || validationResult) && (
          <div className="space-y-4">
            <h4 className="font-medium">Generation Results</h4>

            {sitemapResult && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <strong>Sitemap.xml</strong>
                      <Badge variant="default">Generated</Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>
                        • URLs included:{" "}
                        <strong>{sitemapResult.urlCount}</strong>
                      </p>
                      <p>
                        • Generated at:{" "}
                        <strong>
                          {new Date(sitemapResult.generatedAt).toLocaleString()}
                        </strong>
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open("/sitemap.xml", "_blank")}
                      className="mt-2"
                    >
                      <ExternalLink className="h-3 w-3 mr-2" />
                      View Sitemap
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {robotsResult && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <strong>Robots.txt</strong>
                      <Badge variant="default">Generated</Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>
                        • Lines generated:{" "}
                        <strong>{robotsResult.linesGenerated}</strong>
                      </p>
                      <p>
                        • Generated at:{" "}
                        <strong>
                          {new Date(robotsResult.generatedAt).toLocaleString()}
                        </strong>
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open("/robots.txt", "_blank")}
                      className="mt-2"
                    >
                      <ExternalLink className="h-3 w-3 mr-2" />
                      View Robots.txt
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {validationResult && (
              <Alert
                className={
                  validationResult.isValid
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50"
                }
              >
                {validationResult.isValid ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <strong>XML Validation</strong>
                      <Badge
                        variant={
                          validationResult.isValid ? "default" : "destructive"
                        }
                      >
                        {validationResult.isValid ? "Valid" : "Invalid"}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>
                        • URLs found:{" "}
                        <strong>{validationResult.stats.urls}</strong>
                      </p>
                      <p>
                        • Images found:{" "}
                        <strong>{validationResult.stats.images}</strong>
                      </p>
                      <p>
                        • File size:{" "}
                        <strong>
                          {Math.round(validationResult.stats.size / 1024)} KB
                        </strong>
                      </p>
                      {validationResult.errors.length > 0 && (
                        <div className="mt-2">
                          <p className="text-red-600 font-medium">Errors:</p>
                          {validationResult.errors.map(
                            (error: string, index: number) => (
                              <p key={index} className="text-red-600 text-xs">
                                • {error}
                              </p>
                            ),
                          )}
                        </div>
                      )}
                      {validationResult.warnings.length > 0 && (
                        <div className="mt-2">
                          <p className="text-yellow-600 font-medium">
                            Warnings:
                          </p>
                          {validationResult.warnings.map(
                            (warning: string, index: number) => (
                              <p
                                key={index}
                                className="text-yellow-600 text-xs"
                              >
                                • {warning}
                              </p>
                            ),
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-medium text-blue-900">
                Thông tin quan trọng
              </h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p>
                  • <strong>Sitemap.xml</strong>: Giúp Google và các search
                  engine khám phá tất cả trang của bạn
                </p>
                <p>
                  • <strong>Robots.txt</strong>: Điều khiển cách search engine
                  crawl website của bạn
                </p>
                <p>
                  • Files này được tạo động (dynamic) và luôn cập nhật content
                  mới nhất
                </p>
                <p>• Không cần upload file tĩnh, hệ thống tự động xử lý</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="border-t pt-4">
          <h4 className="font-medium mb-3">Quick Actions</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open("/sitemap.xml", "_blank")}
              className="flex items-center gap-2"
            >
              <Link className="h-3 w-3" />
              View Sitemap
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open("/robots.txt", "_blank")}
              className="flex items-center gap-2"
            >
              <Settings className="h-3 w-3" />
              View Robots
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                window.open(
                  "https://search.google.com/search-console",
                  "_blank",
                )
              }
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-3 w-3" />
              Search Console
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                window.open(
                  "https://www.xml-sitemaps.com/validate-xml-sitemap.html",
                  "_blank",
                )
              }
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-3 w-3" />
              Validate Sitemap
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
