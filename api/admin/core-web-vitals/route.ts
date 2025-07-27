import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";

interface WebVitalMetric {
  name: 'LCP' | 'FID' | 'CLS' | 'FCP' | 'TTFB' | 'INP';
  value: number;
  url: string;
  deviceType: 'mobile' | 'desktop';
  timestamp: string;
  rating: 'good' | 'needs-improvement' | 'poor';
}

interface WebVitalsReport {
  overall: {
    score: number;
    rating: 'good' | 'needs-improvement' | 'poor';
    passedMetrics: number;
    totalMetrics: number;
  };
  metrics: {
    [key: string]: {
      value: number;
      rating: 'good' | 'needs-improvement' | 'poor';
      percentile75: number;
      trend: 'improving' | 'stable' | 'declining';
    };
  };
  pageReports: Array<{
    url: string;
    score: number;
    issues: string[];
    recommendations: string[];
  }>;
  recommendations: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json();

    switch (action) {
      case 'record_metric':
        await recordWebVitalMetric(data);
        break;
      case 'record_batch':
        await recordBatchMetrics(data.metrics);
        break;
      case 'analyze_page':
        const analysis = await analyzePageVitals(data.url);
        return NextResponse.json({ success: true, data: analysis });
      default:
        return NextResponse.json(
          { success: false, message: "Invalid action" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: "Web Vitals data recorded successfully"
    });

  } catch (error) {
    console.error("Core Web Vitals operation failed:", error);
    return NextResponse.json(
      { success: false, message: "Core Web Vitals operation failed" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('range') || '30d';
    const deviceType = searchParams.get('device') || 'all';
    const url = searchParams.get('url');

    const report = await generateWebVitalsReport(timeRange, deviceType, url);

    return NextResponse.json({
      success: true,
      data: report
    });

  } catch (error) {
    console.error("Failed to get Core Web Vitals report:", error);
    return NextResponse.json(
      { success: false, message: "Failed to get Web Vitals report" },
      { status: 500 }
    );
  }
}

async function recordWebVitalMetric(metric: WebVitalMetric): Promise<void> {
  try {
    // Store in SEO analytics table with specific format for Web Vitals
    await executeQuery(`
      INSERT INTO seo_analytics 
      (url_path, date, page_views, unique_visitors, organic_visits, impressions, click_through_rate, average_position, created_at)
      VALUES (?, DATE('now'), ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      `web_vitals_${metric.name.toLowerCase()}_${metric.deviceType}`,
      metric.value,
      metric.rating === 'good' ? 1 : 0, // Pass/fail indicator
      metric.deviceType === 'mobile' ? 1 : 0,
      0, // Not used for web vitals
      0, // Not used for web vitals  
      0  // Not used for web vitals
    ]);

    // Also store in a more structured way for detailed analysis
    await executeQuery(`
      INSERT OR REPLACE INTO seo_content_optimization
      (page_type, url_path, target_keyword, content_score, readability_score, last_analyzed, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [
      'web_vitals',
      metric.url,
      metric.name,
      metric.value,
      metric.rating === 'good' ? 100 : metric.rating === 'needs-improvement' ? 50 : 0
    ]);

  } catch (error) {
    console.error("Failed to record Web Vital metric:", error);
    throw error;
  }
}

async function recordBatchMetrics(metrics: WebVitalMetric[]): Promise<void> {
  for (const metric of metrics) {
    await recordWebVitalMetric(metric);
  }
}

async function generateWebVitalsReport(
  timeRange: string, 
  deviceType: string, 
  url?: string
): Promise<WebVitalsReport> {
  
  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
  
  // Get recent Web Vitals data
  let query = `
    SELECT * FROM seo_content_optimization 
    WHERE page_type = 'web_vitals' 
    AND last_analyzed >= DATE('now', '-${days} days')
  `;
  
  if (url) {
    query += ` AND url_path = '${url}'`;
  }
  
  query += ` ORDER BY last_analyzed DESC`;
  
  const vitalsData = await executeQuery(query);
  const metrics = Array.isArray(vitalsData) ? vitalsData : [];

  // Process metrics data
  const processedMetrics: any = {};
  const vitalsTypes = ['LCP', 'FID', 'CLS', 'FCP', 'TTFB'];
  
  vitalsTypes.forEach(vital => {
    const vitalMetrics = metrics.filter(m => m.target_keyword === vital);
    if (vitalMetrics.length > 0) {
      const values = vitalMetrics.map(m => parseFloat(m.content_score) || 0);
      const avgValue = values.reduce((a, b) => a + b, 0) / values.length;
      const percentile75 = calculatePercentile(values, 75);
      
      processedMetrics[vital] = {
        value: Math.round(avgValue * 100) / 100,
        rating: getRating(vital, avgValue),
        percentile75,
        trend: calculateTrend(vitalMetrics)
      };
    } else {
      // Default values for simulation
      processedMetrics[vital] = getDefaultVitalValue(vital);
    }
  });

  // Calculate overall score
  const passedMetrics = Object.values(processedMetrics).filter((m: any) => m.rating === 'good').length;
  const totalMetrics = vitalsTypes.length;
  const overallScore = Math.round((passedMetrics / totalMetrics) * 100);
  
  let overallRating: 'good' | 'needs-improvement' | 'poor';
  if (overallScore >= 80) overallRating = 'good';
  else if (overallScore >= 50) overallRating = 'needs-improvement';
  else overallRating = 'poor';

  // Generate page-specific reports
  const pageReports = await generatePageReports(metrics);
  
  // Generate recommendations
  const recommendations = generateVitalsRecommendations(processedMetrics, overallRating);

  return {
    overall: {
      score: overallScore,
      rating: overallRating,
      passedMetrics,
      totalMetrics
    },
    metrics: processedMetrics,
    pageReports,
    recommendations
  };
}

async function analyzePageVitals(url: string): Promise<any> {
  try {
    // In a real implementation, this would use PageSpeed Insights API or similar
    // For demo, we'll return simulated analysis
    
    const analysis = {
      url,
      vitals: {
        LCP: {
          value: 2.1 + Math.random() * 2,
          issues: [
            "Large images without optimization",
            "Server response time could be improved",
            "Render-blocking resources"
          ],
          suggestions: [
            "Optimize and compress images",
            "Use next-gen image formats (WebP, AVIF)",
            "Implement lazy loading",
            "Optimize server response time"
          ]
        },
        FID: {
          value: 80 + Math.random() * 100,
          issues: [
            "Heavy JavaScript execution",
            "Large DOM size",
            "Third-party code impact"
          ],
          suggestions: [
            "Minimize main thread work",
            "Split large JavaScript bundles",
            "Defer non-critical JavaScript",
            "Optimize third-party code"
          ]
        },
        CLS: {
          value: Math.random() * 0.2,
          issues: [
            "Images without dimensions",
            "Dynamic content insertion",
            "Web fonts causing layout shifts"
          ],
          suggestions: [
            "Include size attributes on media",
            "Reserve space for dynamic content",
            "Use font-display: swap",
            "Avoid inserting content above existing content"
          ]
        }
      },
      performance: {
        score: 70 + Math.random() * 20,
        opportunities: [
          "Eliminate render-blocking resources",
          "Properly size images", 
          "Remove unused CSS",
          "Minimize main-thread work"
        ],
        diagnostics: [
          "Avoid enormous network payloads",
          "Serve images in next-gen formats",
          "Enable text compression",
          "Reduce unused JavaScript"
        ]
      }
    };

    return analysis;

  } catch (error) {
    console.error("Failed to analyze page vitals:", error);
    return null;
  }
}

function getRating(metric: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds: any = {
    'LCP': { good: 2.5, poor: 4.0 },
    'FID': { good: 100, poor: 300 },
    'CLS': { good: 0.1, poor: 0.25 },
    'FCP': { good: 1.8, poor: 3.0 },
    'TTFB': { good: 800, poor: 1800 }
  };

  const threshold = thresholds[metric];
  if (!threshold) return 'good';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

function getDefaultVitalValue(vital: string): any {
  const defaults: any = {
    'LCP': { value: 2.1, rating: 'good', percentile75: 2.3, trend: 'stable' },
    'FID': { value: 85, rating: 'good', percentile75: 95, trend: 'improving' },
    'CLS': { value: 0.08, rating: 'good', percentile75: 0.09, trend: 'stable' },
    'FCP': { value: 1.4, rating: 'good', percentile75: 1.6, trend: 'improving' },
    'TTFB': { value: 600, rating: 'good', percentile75: 650, trend: 'stable' }
  };
  
  return defaults[vital] || { value: 0, rating: 'poor', percentile75: 0, trend: 'stable' };
}

function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  
  const sorted = values.sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

function calculateTrend(metrics: any[]): 'improving' | 'stable' | 'declining' {
  if (metrics.length < 2) return 'stable';
  
  const recent = metrics.slice(0, Math.ceil(metrics.length / 2));
  const older = metrics.slice(Math.ceil(metrics.length / 2));
  
  const recentAvg = recent.reduce((sum, m) => sum + parseFloat(m.readability_score), 0) / recent.length;
  const olderAvg = older.reduce((sum, m) => sum + parseFloat(m.readability_score), 0) / older.length;
  
  if (recentAvg > olderAvg * 1.1) return 'improving';
  if (recentAvg < olderAvg * 0.9) return 'declining';
  return 'stable';
}

async function generatePageReports(metrics: any[]): Promise<any[]> {
  // Group metrics by URL
  const urlGroups: any = {};
  metrics.forEach(metric => {
    if (!urlGroups[metric.url_path]) {
      urlGroups[metric.url_path] = [];
    }
    urlGroups[metric.url_path].push(metric);
  });

  const reports = [];
  for (const [url, urlMetrics] of Object.entries(urlGroups)) {
    const urlMetricsArray = urlMetrics as any[];
    const avgScore = urlMetricsArray.reduce((sum, m) => sum + parseFloat(m.readability_score), 0) / urlMetricsArray.length;
    
    const issues = [];
    const recommendations = [];
    
    if (avgScore < 50) {
      issues.push("Multiple Core Web Vitals failures");
      recommendations.push("Prioritize performance optimization for this page");
    }
    
    reports.push({
      url,
      score: Math.round(avgScore),
      issues,
      recommendations
    });
  }

  return reports.slice(0, 10); // Return top 10 pages
}

function generateVitalsRecommendations(metrics: any, overallRating: string): string[] {
  const recommendations = [];

  // LCP recommendations
  if (metrics.LCP?.rating !== 'good') {
    recommendations.push("Optimize Largest Contentful Paint by compressing images and improving server response time");
  }

  // FID recommendations  
  if (metrics.FID?.rating !== 'good') {
    recommendations.push("Improve First Input Delay by reducing JavaScript execution time and splitting large bundles");
  }

  // CLS recommendations
  if (metrics.CLS?.rating !== 'good') {
    recommendations.push("Fix Cumulative Layout Shift by setting image dimensions and avoiding dynamic content insertion");
  }

  // FCP recommendations
  if (metrics.FCP?.rating !== 'good') {
    recommendations.push("Enhance First Contentful Paint by optimizing critical rendering path and removing render-blocking resources");
  }

  // TTFB recommendations
  if (metrics.TTFB?.rating !== 'good') {
    recommendations.push("Improve Time to First Byte by optimizing server configuration and database queries");
  }

  // Overall recommendations
  if (overallRating !== 'good') {
    recommendations.push("Consider implementing a performance monitoring solution for continuous optimization");
    recommendations.push("Use a Content Delivery Network (CDN) to improve global performance");
    recommendations.push("Optimize your hosting and server configuration for better performance");
  }

  if (recommendations.length === 0) {
    recommendations.push("Excellent Core Web Vitals performance! Continue monitoring to maintain standards.");
  }

  return recommendations;
}
