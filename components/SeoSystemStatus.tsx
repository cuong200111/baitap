"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Zap,
  Search,
  FileText,
  Link,
  Settings,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { Domain } from "@/config";

interface SystemStatus {
  overallScore: number;
  totalTests: number;
  passed: number;
  failed: number;
  warnings: number;
  results: any[];
  recommendations: string[];
  summary: {
    excellent: boolean;
    good: boolean;
    needsWork: boolean;
  };
}

export default function SeoSystemStatus() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoFixing, setAutoFixing] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const runSystemTest = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/seo-test-all");
      const data = await response.json();
      
      if (data.success) {
        setStatus(data.data);
        setLastChecked(new Date());
        toast.success("SEO system test completed");
      } else {
        toast.error("Failed to run system test");
      }
    } catch (error) {
      toast.error("Error running system test");
      console.error("System test error:", error);
    } finally {
      setLoading(false);
    }
  };

  const autoFixIssues = async () => {
    setAutoFixing(true);
    try {
      const response = await fetch("/api/admin/seo-auto-fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Auto-fix completed: ${data.data.summary.fixed} issues fixed`);
        // Re-run test after auto-fix
        setTimeout(() => runSystemTest(), 1000);
      } else {
        toast.error("Auto-fix failed");
      }
    } catch (error) {
      toast.error("Error running auto-fix");
      console.error("Auto-fix error:", error);
    } finally {
      setAutoFixing(false);
    }
  };

  const generateSitemap = async () => {
    try {
      const response = await fetch("/api/admin/generate-sitemap", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Sitemap generated with ${data.urlCount} URLs`);
      } else {
        toast.error("Failed to generate sitemap");
      }
    } catch (error) {
      toast.error("Error generating sitemap");
    }
  };

  const generateRobots = async () => {
    try {
      const response = await fetch("/api/admin/generate-robots", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success("Robots.txt generated successfully");
      } else {
        toast.error("Failed to generate robots.txt");
      }
    } catch (error) {
      toast.error("Error generating robots.txt");
    }
  };

  useEffect(() => {
    runSystemTest();
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 75) return "text-blue-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return { variant: "default" as const, label: "Excellent" };
    if (score >= 75) return { variant: "secondary" as const, label: "Good" };
    if (score >= 50) return { variant: "outline" as const, label: "Needs Work" };
    return { variant: "destructive" as const, label: "Critical" };
  };

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              SEO System Status
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                onClick={runSystemTest}
                disabled={loading}
                size="sm"
                variant="outline"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                {loading ? "Testing..." : "Re-test"}
              </Button>
              
              <Button
                onClick={autoFixIssues}
                disabled={autoFixing || loading}
                size="sm"
              >
                {autoFixing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
                )}
                {autoFixing ? "Fixing..." : "Auto-Fix"}
              </Button>
            </div>
          </div>
        </CardHeader>

        {status && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Overall Score */}
              <div className="text-center">
                <div className={`text-3xl font-bold ${getScoreColor(status.overallScore)}`}>
                  {status.overallScore}%
                </div>
                <div className="text-sm text-gray-600">Overall Score</div>
                <Badge {...getScoreBadge(status.overallScore)} className="mt-1">
                  {getScoreBadge(status.overallScore).label}
                </Badge>
              </div>

              {/* Progress Bar */}
              <div className="flex flex-col justify-center">
                <Progress value={status.overallScore} className="mb-2" />
                <div className="text-xs text-gray-600 text-center">
                  {status.passed}/{status.totalTests} tests passed
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-green-600 font-semibold">{status.passed}</div>
                  <div className="text-xs text-gray-600">Passed</div>
                </div>
                <div>
                  <div className="text-yellow-600 font-semibold">{status.warnings}</div>
                  <div className="text-xs text-gray-600">Warnings</div>
                </div>
                <div>
                  <div className="text-red-600 font-semibold">{status.failed}</div>
                  <div className="text-xs text-gray-600">Failed</div>
                </div>
              </div>
            </div>

            {/* Last checked */}
            {lastChecked && (
              <div className="text-xs text-gray-500 mb-4">
                Last checked: {lastChecked.toLocaleString()}
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              <Button
                onClick={generateSitemap}
                size="sm"
                variant="outline"
                className="flex items-center gap-2"
              >
                <FileText className="h-3 w-3" />
                Generate Sitemap
              </Button>
              
              <Button
                onClick={generateRobots}
                size="sm"
                variant="outline"
                className="flex items-center gap-2"
              >
                <Search className="h-3 w-3" />
                Generate Robots
              </Button>
              
              <Button
                onClick={() => window.open("/sitemap.xml", "_blank")}
                size="sm"
                variant="outline"
                className="flex items-center gap-2"
              >
                <Link className="h-3 w-3" />
                View Sitemap
              </Button>
              
              <Button
                onClick={() => window.open("/robots.txt", "_blank")}
                size="sm"
                variant="outline"
                className="flex items-center gap-2"
              >
                <Settings className="h-3 w-3" />
                View Robots
              </Button>
            </div>

            {/* Recommendations */}
            {status.recommendations && status.recommendations.length > 0 && (
              <Alert className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Recommendations:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    {status.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm">{rec}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        )}
      </Card>

      {/* Detailed Test Results */}
      {status && status.results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Detailed Test Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {status.results.map((result, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 ${
                    result.status === 'passed' ? 'border-green-200 bg-green-50' :
                    result.status === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                    'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">{result.name}</h4>
                    {result.status === 'passed' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : result.status === 'warning' ? (
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-600 mb-2">{result.message}</p>
                  
                  <Badge
                    variant={
                      result.status === 'passed' ? 'default' :
                      result.status === 'warning' ? 'secondary' :
                      'destructive'
                    }
                    className="text-xs"
                  >
                    {result.status.toUpperCase()}
                  </Badge>

                  {result.details && (
                    <div className="mt-2 text-xs text-gray-500">
                      {typeof result.details === 'object' ? (
                        Object.entries(result.details).map(([key, value]) => (
                          <div key={key}>
                            <strong>{key}:</strong> {String(value)}
                          </div>
                        ))
                      ) : (
                        <div>{String(result.details)}</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && !status && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mr-3" />
            <span>Running comprehensive SEO system test...</span>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
