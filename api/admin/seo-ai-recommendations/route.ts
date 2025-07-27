import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";

interface AIRecommendation {
  id: string;
  type: 'content' | 'technical' | 'keywords' | 'links' | 'performance';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTimeToComplete: string;
  potentialTrafficIncrease: string;
  actionItems: string[];
  relatedPages?: string[];
  keywords?: string[];
  confidence: number; // 0-100
}

interface AIAnalysisResult {
  overallScore: number;
  recommendations: AIRecommendation[];
  quickWins: AIRecommendation[];
  longTermStrategy: AIRecommendation[];
  competitorInsights: CompetitorInsight[];
  trendAnalysis: TrendAnalysis;
}

interface CompetitorInsight {
  competitor: string;
  advantage: string;
  opportunity: string;
  actionable: string;
}

interface TrendAnalysis {
  emergingKeywords: string[];
  decliningKeywords: string[];
  seasonalOpportunities: string[];
  contentGaps: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { analysisType, entity, timeframe } = await request.json();
    
    const analysis = await generateAIRecommendations(analysisType, entity, timeframe);
    
    // Store AI recommendations
    for (const rec of analysis.recommendations) {
      try {
        await executeQuery(`
          INSERT OR REPLACE INTO seo_audit_issues 
          (url_path, issue_type, severity, issue_description, suggested_fix, is_resolved)
          VALUES (?, ?, ?, ?, ?, 0)
        `, [
          entity?.url || 'site-wide',
          rec.type,
          rec.priority === 'high' ? 'high' : rec.priority === 'medium' ? 'medium' : 'low',
          rec.description,
          rec.actionItems.join('; ')
        ]);
      } catch (error) {
        console.error("Failed to store AI recommendation:", error);
      }
    }

    return NextResponse.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    console.error("AI recommendations generation failed:", error);
    return NextResponse.json(
      { success: false, message: "Failed to generate AI recommendations" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const priority = searchParams.get('priority');
    
    // Get stored recommendations
    let query = `
      SELECT * FROM seo_audit_issues 
      WHERE issue_type LIKE '%${type === 'all' ? '' : type}%'
    `;
    
    if (priority) {
      query += ` AND severity = '${priority}'`;
    }
    
    query += ` ORDER BY detected_at DESC LIMIT 50`;
    
    const recommendations = await executeQuery(query);

    return NextResponse.json({
      success: true,
      data: recommendations || []
    });

  } catch (error) {
    console.error("Failed to get AI recommendations:", error);
    return NextResponse.json(
      { success: false, message: "Failed to get recommendations" },
      { status: 500 }
    );
  }
}

async function generateAIRecommendations(
  analysisType: string, 
  entity?: any, 
  timeframe?: string
): Promise<AIAnalysisResult> {
  
  // Get current site data for analysis
  const siteData = await getSiteAnalysisData();
  
  // Generate recommendations based on AI analysis patterns
  const recommendations: AIRecommendation[] = [];
  
  // Content optimization recommendations
  if (analysisType === 'all' || analysisType === 'content') {
    recommendations.push(...await generateContentRecommendations(siteData));
  }
  
  // Technical SEO recommendations
  if (analysisType === 'all' || analysisType === 'technical') {
    recommendations.push(...await generateTechnicalRecommendations(siteData));
  }
  
  // Keyword strategy recommendations
  if (analysisType === 'all' || analysisType === 'keywords') {
    recommendations.push(...await generateKeywordRecommendations(siteData));
  }
  
  // Link building recommendations
  if (analysisType === 'all' || analysisType === 'links') {
    recommendations.push(...await generateLinkRecommendations(siteData));
  }
  
  // Performance recommendations
  if (analysisType === 'all' || analysisType === 'performance') {
    recommendations.push(...await generatePerformanceRecommendations(siteData));
  }

  // Sort recommendations by priority and impact
  recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  // Categorize recommendations
  const quickWins = recommendations.filter(r => 
    r.difficulty === 'easy' && (r.priority === 'high' || r.priority === 'medium')
  );
  
  const longTermStrategy = recommendations.filter(r => 
    r.difficulty === 'hard' || r.type === 'links'
  );

  // Generate competitor insights
  const competitorInsights = await generateCompetitorInsights(siteData);
  
  // Generate trend analysis
  const trendAnalysis = await generateTrendAnalysis(siteData);
  
  // Calculate overall score
  const overallScore = calculateAIScore(siteData, recommendations);

  return {
    overallScore,
    recommendations,
    quickWins,
    longTermStrategy,
    competitorInsights,
    trendAnalysis
  };
}

async function getSiteAnalysisData(): Promise<any> {
  try {
    // Get SEO settings
    const settings = await executeQuery(`
      SELECT setting_key, setting_value FROM seo_settings WHERE is_active = 1
    `);
    
    // Get content data
    const productCount = await executeQuery(`
      SELECT COUNT(*) as count FROM products WHERE status = 'active'
    `);
    
    const categoryCount = await executeQuery(`
      SELECT COUNT(*) as count FROM categories WHERE is_active = 1
    `);
    
    // Get recent analytics
    const analytics = await executeQuery(`
      SELECT * FROM seo_analytics 
      WHERE date >= DATE('now', '-30 days') 
      ORDER BY date DESC 
      LIMIT 30
    `);

    // Get keyword data
    const keywords = await executeQuery(`
      SELECT * FROM seo_keywords 
      WHERE is_tracking = 1 
      ORDER BY search_volume DESC 
      LIMIT 20
    `);

    return {
      settings: Array.isArray(settings) ? settings : [],
      productCount: Array.isArray(productCount) ? productCount[0]?.count || 0 : 0,
      categoryCount: Array.isArray(categoryCount) ? categoryCount[0]?.count || 0 : 0,
      analytics: Array.isArray(analytics) ? analytics : [],
      keywords: Array.isArray(keywords) ? keywords : []
    };
    
  } catch (error) {
    console.error("Failed to get site analysis data:", error);
    return { settings: [], productCount: 0, categoryCount: 0, analytics: [], keywords: [] };
  }
}

async function generateContentRecommendations(siteData: any): Promise<AIRecommendation[]> {
  const recommendations: AIRecommendation[] = [];

  // Content gap analysis
  if (siteData.productCount < 100) {
    recommendations.push({
      id: 'content-gap-products',
      type: 'content',
      priority: 'high',
      title: 'Expand Product Content',
      description: 'Your site has limited product content. Adding more detailed product descriptions and specifications can significantly improve SEO.',
      impact: 'High - More content means more keyword opportunities and better user engagement',
      difficulty: 'medium',
      estimatedTimeToComplete: '2-4 weeks',
      potentialTrafficIncrease: '25-40%',
      actionItems: [
        'Add detailed product descriptions for all products',
        'Include technical specifications and features',
        'Add product comparison guides',
        'Create product category landing pages',
        'Include customer reviews and ratings'
      ],
      confidence: 85
    });
  }

  // Blog content strategy
  recommendations.push({
    id: 'content-blog-strategy',
    type: 'content',
    priority: 'medium',
    title: 'Implement Content Marketing Strategy',
    description: 'Create a blog with regular tech and gaming content to attract more organic traffic and establish authority.',
    impact: 'High - Content marketing can drive 3x more leads than traditional marketing',
    difficulty: 'medium',
    estimatedTimeToComplete: '1-2 months',
    potentialTrafficIncrease: '50-100%',
    actionItems: [
      'Create editorial calendar with tech and gaming topics',
      'Write buying guides for popular products',
      'Create "How-to" tutorials and setup guides',
      'Add gaming hardware reviews and comparisons',
      'Include industry news and trend articles'
    ],
    keywords: ['gaming setup', 'laptop reviews', 'PC building guide', 'tech news Vietnam'],
    confidence: 90
  });

  // Video content opportunity
  recommendations.push({
    id: 'content-video-seo',
    type: 'content',
    priority: 'medium',
    title: 'Add Video Content for SEO',
    description: 'Video content performs exceptionally well in search results and can increase engagement significantly.',
    impact: 'Medium-High - Video results often appear at the top of search results',
    difficulty: 'hard',
    estimatedTimeToComplete: '1-3 months',
    potentialTrafficIncrease: '20-35%',
    actionItems: [
      'Create product unboxing and review videos',
      'Add setup and installation tutorials',
      'Create gaming performance benchmarks',
      'Add video product demonstrations',
      'Optimize videos for YouTube SEO'
    ],
    confidence: 80
  });

  return recommendations;
}

async function generateTechnicalRecommendations(siteData: any): Promise<AIRecommendation[]> {
  const recommendations: AIRecommendation[] = [];

  // Core Web Vitals optimization
  recommendations.push({
    id: 'technical-core-vitals',
    type: 'technical',
    priority: 'high',
    title: 'Optimize Core Web Vitals',
    description: 'Core Web Vitals are now a direct ranking factor. Optimizing these metrics will improve both SEO and user experience.',
    impact: 'High - Direct ranking factor affecting all pages',
    difficulty: 'medium',
    estimatedTimeToComplete: '2-3 weeks',
    potentialTrafficIncrease: '15-25%',
    actionItems: [
      'Optimize image loading and compression',
      'Implement lazy loading for images',
      'Minimize JavaScript execution time',
      'Use CDN for faster content delivery',
      'Optimize server response times'
    ],
    confidence: 95
  });

  // Schema markup implementation
  recommendations.push({
    id: 'technical-schema-markup',
    type: 'technical',
    priority: 'high',
    title: 'Implement Advanced Schema Markup',
    description: 'Rich snippets from Schema markup can significantly improve click-through rates and visibility in search results.',
    impact: 'High - Can increase CTR by 20-30%',
    difficulty: 'medium',
    estimatedTimeToComplete: '1-2 weeks',
    potentialTrafficIncrease: '10-20%',
    actionItems: [
      'Add Product schema for all products',
      'Implement Review and Rating schema',
      'Add Organization and LocalBusiness schema',
      'Include Breadcrumb schema on all pages',
      'Add FAQ schema for product pages'
    ],
    confidence: 90
  });

  // Mobile optimization
  recommendations.push({
    id: 'technical-mobile-first',
    type: 'technical',
    priority: 'high',
    title: 'Enhance Mobile-First Design',
    description: 'Google uses mobile-first indexing. Ensuring excellent mobile experience is crucial for rankings.',
    impact: 'High - Affects mobile search rankings directly',
    difficulty: 'medium',
    estimatedTimeToComplete: '2-4 weeks',
    potentialTrafficIncrease: '20-30%',
    actionItems: [
      'Optimize mobile page load speed',
      'Improve mobile navigation and UX',
      'Ensure all content is accessible on mobile',
      'Optimize mobile checkout process',
      'Test with Google Mobile-Friendly Test'
    ],
    confidence: 85
  });

  return recommendations;
}

async function generateKeywordRecommendations(siteData: any): Promise<AIRecommendation[]> {
  const recommendations: AIRecommendation[] = [];

  // Long-tail keyword strategy
  recommendations.push({
    id: 'keywords-long-tail',
    type: 'keywords',
    priority: 'high',
    title: 'Target Long-Tail Keywords',
    description: 'Long-tail keywords have lower competition and higher conversion rates, perfect for e-commerce.',
    impact: 'High - Better conversion rates and easier to rank',
    difficulty: 'easy',
    estimatedTimeToComplete: '1-2 weeks',
    potentialTrafficIncrease: '30-50%',
    actionItems: [
      'Research specific product model keywords',
      'Target "best [product] for [use case]" keywords',
      'Create content for comparison keywords',
      'Target local keywords like "laptop shop Hanoi"',
      'Use customer questions as keyword opportunities'
    ],
    keywords: [
      'best gaming laptop under 20 million',
      'MacBook Pro M2 price Vietnam',
      'gaming PC setup guide',
      'laptop for students Vietnam'
    ],
    confidence: 90
  });

  // Seasonal keyword opportunities
  recommendations.push({
    id: 'keywords-seasonal',
    type: 'keywords',
    priority: 'medium',
    title: 'Capitalize on Seasonal Keywords',
    description: 'Target seasonal shopping trends and holidays for maximum traffic during peak periods.',
    impact: 'Medium-High - Can drive significant traffic during peak seasons',
    difficulty: 'easy',
    estimatedTimeToComplete: '1 week',
    potentialTrafficIncrease: '40-80% during seasons',
    actionItems: [
      'Create back-to-school laptop guides',
      'Target Black Friday and holiday deals',
      'Create Christmas gift guides for tech',
      'Target Tet holiday shopping keywords',
      'Create summer gaming setup content'
    ],
    keywords: [
      'back to school laptop deals',
      'Black Friday gaming laptop',
      'Christmas tech gifts 2024',
      'Tet holiday laptop promotion'
    ],
    confidence: 85
  });

  return recommendations;
}

async function generateLinkRecommendations(siteData: any): Promise<AIRecommendation[]> {
  const recommendations: AIRecommendation[] = [];

  // Internal linking strategy
  recommendations.push({
    id: 'links-internal-optimization',
    type: 'links',
    priority: 'high',
    title: 'Optimize Internal Linking Structure',
    description: 'Strategic internal linking can significantly boost page authority and improve crawlability.',
    impact: 'High - Distributes page authority and improves user navigation',
    difficulty: 'easy',
    estimatedTimeToComplete: '1-2 weeks',
    potentialTrafficIncrease: '15-25%',
    actionItems: [
      'Link related products on each product page',
      'Create category hub pages with links to all products',
      'Add "frequently bought together" sections',
      'Include breadcrumb navigation on all pages',
      'Create topic clusters linking related content'
    ],
    confidence: 95
  });

  // External link building
  recommendations.push({
    id: 'links-external-building',
    type: 'links',
    priority: 'medium',
    title: 'Build High-Quality Backlinks',
    description: 'Quality backlinks remain one of the strongest ranking factors for Google.',
    impact: 'Very High - Direct impact on domain authority and rankings',
    difficulty: 'hard',
    estimatedTimeToComplete: '3-6 months',
    potentialTrafficIncrease: '50-100%',
    actionItems: [
      'Partner with tech bloggers and reviewers',
      'Submit to Vietnamese tech directories',
      'Create shareable infographics about tech trends',
      'Guest post on tech and gaming blogs',
      'Build relationships with tech influencers'
    ],
    confidence: 75
  });

  return recommendations;
}

async function generatePerformanceRecommendations(siteData: any): Promise<AIRecommendation[]> {
  const recommendations: AIRecommendation[] = [];

  // Site speed optimization
  recommendations.push({
    id: 'performance-speed',
    type: 'performance',
    priority: 'high',
    title: 'Improve Site Loading Speed',
    description: 'Page speed is a direct ranking factor and critical for user experience and conversions.',
    impact: 'Very High - Affects rankings, user experience, and conversion rates',
    difficulty: 'medium',
    estimatedTimeToComplete: '2-3 weeks',
    potentialTrafficIncrease: '20-35%',
    actionItems: [
      'Optimize and compress all images',
      'Implement browser caching',
      'Minify CSS and JavaScript files',
      'Use a Content Delivery Network (CDN)',
      'Optimize database queries'
    ],
    confidence: 90
  });

  return recommendations;
}

async function generateCompetitorInsights(siteData: any): Promise<CompetitorInsight[]> {
  return [
    {
      competitor: 'thegioididong.com',
      advantage: 'Strong brand presence and extensive product reviews',
      opportunity: 'Focus on specialized gaming and professional equipment',
      actionable: 'Create in-depth gaming hardware reviews and professional workstation guides'
    },
    {
      competitor: 'fptshop.com.vn',
      advantage: 'Wide retail network and local presence',
      opportunity: 'Better online experience and technical expertise content',
      actionable: 'Develop superior online tutorials and technical support content'
    }
  ];
}

async function generateTrendAnalysis(siteData: any): Promise<TrendAnalysis> {
  return {
    emergingKeywords: [
      'AI laptop 2024',
      'VR gaming setup',
      'MacBook M3 Vietnam',
      'cryptocurrency mining rig',
      'streaming setup guide'
    ],
    decliningKeywords: [
      'Windows 7 laptop',
      'DVD drive laptop',
      'traditional desktop PC'
    ],
    seasonalOpportunities: [
      'back to school laptop deals',
      'Black Friday tech deals',
      'Tet holiday promotions',
      'summer gaming deals'
    ],
    contentGaps: [
      'Laptop repair guides',
      'Gaming monitor comparisons',
      'Business laptop recommendations',
      'Tech news and updates'
    ]
  };
}

function calculateAIScore(siteData: any, recommendations: AIRecommendation[]): number {
  let score = 70; // Base score
  
  // Deduct points for critical issues
  const highPriorityRecs = recommendations.filter(r => r.priority === 'high');
  score -= highPriorityRecs.length * 5;
  
  // Add points for good practices
  if (siteData.productCount > 50) score += 10;
  if (siteData.keywords.length > 10) score += 10;
  
  return Math.max(0, Math.min(100, score));
}
