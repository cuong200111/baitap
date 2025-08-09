"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Database,
  FileText,
  Search,
  TrendingUp,
  Info,
} from "lucide-react";
import { Domain } from "@/config";

interface SeoStatus {
  healthScore: number;
  checks: {
    seoTables: boolean;
    seoSettings: number;
    defaultSettingsLoaded: boolean;
    sitemapGenerated: boolean;
    robotsGenerated: boolean;
  };
  keySettings: Record<string, string>;
  recentActivity: Array<{
    url_path: string;
    date: string;
    page_views: number;
  }>;
  recommendations: string[];
}

export default function SeoStatusDashboard() {
  const [status, setStatus] = useState<SeoStatus | null>(null);
  const [loading, setLoading] = useState(true);
  console.log(status)
  useEffect(() => {
    loadSeoStatus();
  }, []);

  const loadSeoStatus = async () => {
    try {
      setLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const response = await fetch(`${Domain}/api/seo/status`, { headers });
      const data = await response.json();
      
      if (data.success) {
        setStatus(data.data);
      }
    } catch (error) {
      console.error("Failed to load SEO status:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Activity className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Không thể tải trạng thái SEO. Vui lòng thử lại sau.
        </AlertDescription>
      </Alert>
    );
  }

  const getHealthColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getHealthStatus = (score: number) => {
    if (score >= 80) return { text: "Xuất sắc", variant: "default" as const };
    if (score >= 60) return { text: "Tốt", variant: "secondary" as const };
    return { text: "Cần cải thiện", variant: "destructive" as const };
  };

  return (
    <div className="space-y-6">
      {/* Health Score Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            SEO Health Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className={`text-4xl font-bold mb-2 ${getHealthColor(status.healthScore)}`}>
                {status.healthScore}%
              </div>
              <p className="text-sm text-gray-600 mb-2">SEO Health Score</p>
              <Badge variant={getHealthStatus(status.healthScore).variant}>
                {getHealthStatus(status.healthScore).text}
              </Badge>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-2">
                {status?.checks?.seoSettings}
              </div>
              <p className="text-sm text-gray-600">SEO Settings</p>
              <div className="flex items-center justify-center mt-1">
                {status.checks.defaultSettingsLoaded ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-2">
                <Database className="h-8 w-8 mx-auto mb-1" />
              </div>
              <p className="text-sm text-gray-600">Database</p>
              <div className="flex items-center justify-center mt-1">
                {status.checks.seoTables ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-2">
                <FileText className="h-8 w-8 mx-auto mb-1" />
              </div>
              <p className="text-sm text-gray-600">Files Generated</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                {status.checks.sitemapGenerated ? (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                ) : (
                  <XCircle className="h-3 w-3 text-red-500" />
                )}
                {status.checks.robotsGenerated ? (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                ) : (
                  <XCircle className="h-3 w-3 text-red-500" />
                )}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall SEO Completion</span>
              <span className="text-sm text-gray-600">{status.healthScore}%</span>
            </div>
            <Progress value={status.healthScore} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Key Settings Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle className="h-4 w-4" />
              Key Settings Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Site Name</span>
              {status.keySettings.site_name ? (
                <Badge variant="default">Configured</Badge>
              ) : (
                <Badge variant="destructive">Missing</Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Site URL</span>
              {status.keySettings.site_url ? (
                <Badge variant="default">Configured</Badge>
              ) : (
                <Badge variant="destructive">Missing</Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Google Analytics</span>
              {status.keySettings.google_analytics_id ? (
                <Badge variant="default">Configured</Badge>
              ) : (
                <Badge variant="secondary">Optional</Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Sitemap Enabled</span>
              {status.keySettings.enable_sitemap === "1" ? (
                <Badge variant="default">Enabled</Badge>
              ) : (
                <Badge variant="secondary">Disabled</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Info className="h-4 w-4" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {status.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{recommendation}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      {status.recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4" />
              Recent SEO Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {status.recentActivity.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-sm">{activity.url_path}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">{activity.date}</div>
                    <div className="text-xs text-gray-500">{activity.page_views} views</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
