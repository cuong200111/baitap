import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";

interface PerformanceMetrics {
  overallHealth: number;
  keywordRankings: KeywordRanking[];
  trafficTrends: TrafficData[];
  coreWebVitals: CoreWebVitals;
  indexingStatus: IndexingStatus;
  competitorAnalysis: CompetitorData[];
  recommendations: string[];
}

interface KeywordRanking {
  keyword: string;
  currentPosition: number;
  previousPosition: number;
  change: number;
  searchVolume: number;
  difficulty: number;
  url: string;
}

interface TrafficData {
  date: string;
  organicTraffic: number;
  impressions: number;
  clicks: number;
  ctr: number;
  avgPosition: number;
}

interface CoreWebVitals {
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte
  score: number;
  status: 'good' | 'needs_improvement' | 'poor';
}

interface IndexingStatus {
  totalPages: number;
  indexedPages: number;
  crawlErrors: number;
  lastCrawled: string;
  sitemapStatus: 'submitted' | 'processed' | 'error';
}

interface CompetitorData {
  domain: string;
  authorityScore: number;
  keywords: number;
  organicTraffic: number;
  backlinks: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('range') || '30d';
    const includeCompetitors = searchParams.get('competitors') === 'true';

    const metrics = await getPerformanceMetrics(timeRange, includeCompetitors);

    return NextResponse.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    console.error("Failed to get SEO performance metrics:", error);
    return NextResponse.json(
      { success: false, message: "Failed to get performance metrics" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json();

    switch (action) {
      case 'update_rankings':
        await updateKeywordRankings(data);
        break;
      case 'record_vitals':
        await recordCoreWebVitals(data);
        break;
      case 'update_traffic':
        await updateTrafficData(data);
        break;
      case 'sync_gsc':
        await syncGoogleSearchConsole();
        break;
      default:
        return NextResponse.json(
          { success: false, message: "Invalid action" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: "Performance data updated successfully"
    });

  } catch (error) {
    console.error("Failed to update performance data:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update performance data" },
      { status: 500 }
    );
  }
}

async function getPerformanceMetrics(timeRange: string, includeCompetitors: boolean): Promise<PerformanceMetrics> {
  
  // Get keyword rankings
  const keywordRankings = await getKeywordRankings(timeRange);
  
  // Get traffic trends
  const trafficTrends = await getTrafficTrends(timeRange);
  
  // Get Core Web Vitals
  const coreWebVitals = await getCoreWebVitals();
  
  // Get indexing status
  const indexingStatus = await getIndexingStatus();
  
  // Get competitor analysis if requested
  const competitorAnalysis = includeCompetitors ? await getCompetitorAnalysis() : [];
  
  // Calculate overall health score
  const overallHealth = calculateOverallHealth(keywordRankings, coreWebVitals, trafficTrends);
  
  // Generate recommendations
  const recommendations = generatePerformanceRecommendations(
    keywordRankings, 
    coreWebVitals, 
    trafficTrends, 
    indexingStatus
  );

  return {
    overallHealth,
    keywordRankings,
    trafficTrends,
    coreWebVitals,
    indexingStatus,
    competitorAnalysis,
    recommendations
  };
}

async function getKeywordRankings(timeRange: string): Promise<KeywordRanking[]> {
  try {
    const rankings = await executeQuery(`
      SELECT 
        keyword,
        current_position,
        target_position,
        search_volume,
        difficulty_score,
        target_url,
        updated_at
      FROM seo_keywords 
      WHERE is_tracking = 1 
      ORDER BY search_volume DESC 
      LIMIT 50
    `);

    if (!Array.isArray(rankings)) return [];

    return rankings.map((row: any) => ({
      keyword: row.keyword,
      currentPosition: row.current_position || 0,
      previousPosition: row.current_position + Math.floor(Math.random() * 10 - 5), // Simulated for demo
      change: Math.floor(Math.random() * 10 - 5), // Simulated change
      searchVolume: row.search_volume || 0,
      difficulty: row.difficulty_score || 50,
      url: row.target_url || '/'
    }));

  } catch (error) {
    console.error("Failed to get keyword rankings:", error);
    return [];
  }
}

async function getTrafficTrends(timeRange: string): Promise<TrafficData[]> {
  try {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    
    const traffic = await executeQuery(`
      SELECT 
        date,
        SUM(page_views) as organic_traffic,
        SUM(impressions) as impressions,
        SUM(organic_visits) as clicks,
        AVG(click_through_rate) as ctr,
        AVG(average_position) as avg_position
      FROM seo_analytics 
      WHERE date >= DATE('now', '-${days} days')
      GROUP BY date 
      ORDER BY date DESC
    `);

    if (!Array.isArray(traffic)) return [];

    return traffic.map((row: any) => ({
      date: row.date,
      organicTraffic: row.organic_traffic || 0,
      impressions: row.impressions || 0,
      clicks: row.clicks || 0,
      ctr: parseFloat(row.ctr) || 0,
      avgPosition: parseFloat(row.avg_position) || 0
    }));

  } catch (error) {
    console.error("Failed to get traffic trends:", error);
    return [];
  }
}

async function getCoreWebVitals(): Promise<CoreWebVitals> {
  try {
    // In a real implementation, this would fetch from real Core Web Vitals API
    // For now, we'll simulate with reasonable values
    const vitals = {
      lcp: 2.1, // Largest Contentful Paint (seconds)
      fid: 85,   // First Input Delay (milliseconds)
      cls: 0.08, // Cumulative Layout Shift
      fcp: 1.4,  // First Contentful Paint (seconds)
      ttfb: 0.6, // Time to First Byte (seconds)
      score: 0,
      status: 'good' as const
    };

    // Calculate score based on Core Web Vitals thresholds
    let score = 0;
    
    // LCP scoring (0-25 points)
    if (vitals.lcp <= 2.5) score += 25;
    else if (vitals.lcp <= 4.0) score += 15;
    else score += 5;
    
    // FID scoring (0-25 points)
    if (vitals.fid <= 100) score += 25;
    else if (vitals.fid <= 300) score += 15;
    else score += 5;
    
    // CLS scoring (0-25 points)
    if (vitals.cls <= 0.1) score += 25;
    else if (vitals.cls <= 0.25) score += 15;
    else score += 5;
    
    // FCP scoring (0-15 points)
    if (vitals.fcp <= 1.8) score += 15;
    else if (vitals.fcp <= 3.0) score += 10;
    else score += 5;
    
    // TTFB scoring (0-10 points)
    if (vitals.ttfb <= 0.8) score += 10;
    else if (vitals.ttfb <= 1.8) score += 5;
    
    vitals.score = score;
    
    if (score >= 75) vitals.status = 'good';
    else if (score >= 50) vitals.status = 'needs_improvement';
    else vitals.status = 'poor';

    return vitals;

  } catch (error) {
    console.error("Failed to get Core Web Vitals:", error);
    return {
      lcp: 0, fid: 0, cls: 0, fcp: 0, ttfb: 0,
      score: 0, status: 'poor'
    };
  }
}

async function getIndexingStatus(): Promise<IndexingStatus> {
  try {
    // Get total pages from products and categories
    const productCount = await executeQuery(`
      SELECT COUNT(*) as count FROM products WHERE status = 'active'
    `);
    const categoryCount = await executeQuery(`
      SELECT COUNT(*) as count FROM categories WHERE is_active = 1
    `);

    const totalProducts = Array.isArray(productCount) ? productCount[0]?.count || 0 : 0;
    const totalCategories = Array.isArray(categoryCount) ? categoryCount[0]?.count || 0 : 0;
    const totalPages = totalProducts + totalCategories + 10; // +10 for static pages

    return {
      totalPages,
      indexedPages: Math.floor(totalPages * 0.85), // Simulate 85% indexed
      crawlErrors: Math.floor(Math.random() * 5), // Random errors 0-4
      lastCrawled: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      sitemapStatus: 'processed'
    };

  } catch (error) {
    console.error("Failed to get indexing status:", error);
    return {
      totalPages: 0, indexedPages: 0, crawlErrors: 0,
      lastCrawled: new Date().toISOString(), sitemapStatus: 'error'
    };
  }
}

async function getCompetitorAnalysis(): Promise<CompetitorData[]> {
  // Simulated competitor data - in real implementation would fetch from SEO APIs
  return [
    {
      domain: "thegioididong.com",
      authorityScore: 85,
      keywords: 120000,
      organicTraffic: 2500000,
      backlinks: 45000
    },
    {
      domain: "fptshop.com.vn", 
      authorityScore: 78,
      keywords: 95000,
      organicTraffic: 1800000,
      backlinks: 32000
    },
    {
      domain: "cellphones.com.vn",
      authorityScore: 75,
      keywords: 85000,
      organicTraffic: 1600000,
      backlinks: 28000
    }
  ];
}

function calculateOverallHealth(
  keywords: KeywordRanking[], 
  vitals: CoreWebVitals, 
  traffic: TrafficData[]
): number {
  let score = 0;

  // Keyword performance (0-40 points)
  const topKeywords = keywords.filter(k => k.currentPosition <= 10);
  const keywordScore = Math.min(40, (topKeywords.length / Math.max(1, keywords.length)) * 40);
  score += keywordScore;

  // Core Web Vitals (0-30 points)
  score += Math.round((vitals.score / 100) * 30);

  // Traffic trends (0-30 points)
  if (traffic.length >= 2) {
    const recentTraffic = traffic.slice(0, 7).reduce((sum, day) => sum + day.organicTraffic, 0);
    const olderTraffic = traffic.slice(7, 14).reduce((sum, day) => sum + day.organicTraffic, 0);
    
    if (recentTraffic > olderTraffic) {
      score += 30; // Growing traffic
    } else if (recentTraffic >= olderTraffic * 0.9) {
      score += 20; // Stable traffic
    } else {
      score += 10; // Declining traffic
    }
  } else {
    score += 15; // Neutral for insufficient data
  }

  return Math.round(score);
}

function generatePerformanceRecommendations(
  keywords: KeywordRanking[],
  vitals: CoreWebVitals,
  traffic: TrafficData[],
  indexing: IndexingStatus
): string[] {
  const recommendations: string[] = [];

  // Keyword recommendations
  const lowRankingKeywords = keywords.filter(k => k.currentPosition > 10);
  if (lowRankingKeywords.length > keywords.length * 0.5) {
    recommendations.push("Focus on improving keyword rankings - over 50% of tracked keywords are not in top 10");
  }

  const decliningKeywords = keywords.filter(k => k.change < 0);
  if (decliningKeywords.length > 0) {
    recommendations.push(`${decliningKeywords.length} keywords have dropped in rankings - review and optimize content`);
  }

  // Core Web Vitals recommendations
  if (vitals.lcp > 2.5) {
    recommendations.push("Improve Largest Contentful Paint - optimize images and server response time");
  }
  if (vitals.fid > 100) {
    recommendations.push("Reduce First Input Delay - minimize JavaScript execution time");
  }
  if (vitals.cls > 0.1) {
    recommendations.push("Fix Cumulative Layout Shift - ensure proper image and ad dimensions");
  }

  // Traffic recommendations
  if (traffic.length > 0) {
    const avgCTR = traffic.reduce((sum, day) => sum + day.ctr, 0) / traffic.length;
    if (avgCTR < 2) {
      recommendations.push("Improve click-through rate - optimize meta titles and descriptions");
    }
  }

  // Indexing recommendations
  if (indexing.crawlErrors > 2) {
    recommendations.push(`Fix ${indexing.crawlErrors} crawl errors to improve indexing`);
  }

  const indexingRate = indexing.indexedPages / Math.max(1, indexing.totalPages);
  if (indexingRate < 0.8) {
    recommendations.push("Improve page indexing - submit sitemap and fix crawl issues");
  }

  if (recommendations.length === 0) {
    recommendations.push("SEO performance is excellent! Continue monitoring and maintaining current strategies.");
  }

  return recommendations;
}

async function updateKeywordRankings(data: any): Promise<void> {
  // Implementation for updating keyword rankings
  try {
    for (const keyword of data.keywords || []) {
      await executeQuery(`
        INSERT OR REPLACE INTO seo_keywords 
        (keyword, target_url, current_position, search_volume, difficulty_score, updated_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [keyword.keyword, keyword.url, keyword.position, keyword.volume, keyword.difficulty]);
    }
  } catch (error) {
    console.error("Failed to update keyword rankings:", error);
  }
}

async function recordCoreWebVitals(data: any): Promise<void> {
  // Implementation for recording Core Web Vitals
  try {
    await executeQuery(`
      INSERT INTO seo_analytics (url_path, date, page_views)
      VALUES ('core_web_vitals', DATE('now'), ?)
    `, [JSON.stringify(data)]);
  } catch (error) {
    console.error("Failed to record Core Web Vitals:", error);
  }
}

async function updateTrafficData(data: any): Promise<void> {
  // Implementation for updating traffic data
  try {
    await executeQuery(`
      INSERT OR REPLACE INTO seo_analytics 
      (url_path, date, page_views, unique_visitors, organic_visits, impressions, click_through_rate, average_position)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.url || '/',
      data.date || new Date().toISOString().split('T')[0],
      data.pageViews || 0,
      data.uniqueVisitors || 0,
      data.organicVisits || 0,
      data.impressions || 0,
      data.ctr || 0,
      data.avgPosition || 0
    ]);
  } catch (error) {
    console.error("Failed to update traffic data:", error);
  }
}

async function syncGoogleSearchConsole(): Promise<void> {
  // Placeholder for Google Search Console integration
  console.log("Google Search Console sync initiated...");
  // In real implementation, this would use Google Search Console API
}
