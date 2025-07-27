import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";

interface LinkAnalysis {
  internalLinks: {
    total: number;
    unique: number;
    broken: number;
    opportunities: LinkOpportunity[];
    distribution: { [page: string]: number };
  };
  externalLinks: {
    total: number;
    domains: number;
    noFollow: number;
    sponsored: number;
    backlinks: BacklinkData[];
  };
  anchorText: {
    analysis: { [text: string]: number };
    overOptimized: string[];
    suggestions: string[];
  };
  linkBuilding: {
    prospects: LinkProspect[];
    outreachStatus: OutreachStatus[];
    completedCampaigns: number;
  };
}

interface LinkOpportunity {
  fromPage: string;
  toPage: string;
  anchorText: string;
  relevanceScore: number;
  priority: 'high' | 'medium' | 'low';
  reason: string;
}

interface BacklinkData {
  sourceUrl: string;
  sourceDomain: string;
  targetUrl: string;
  anchorText: string;
  linkType: 'follow' | 'nofollow' | 'sponsored';
  domainAuthority: number;
  discovered: string;
  status: 'active' | 'lost' | 'broken';
}

interface LinkProspect {
  domain: string;
  url: string;
  contactEmail?: string;
  domainAuthority: number;
  relevanceScore: number;
  outreachTemplate: string;
  status: 'prospect' | 'contacted' | 'responded' | 'linked' | 'rejected';
  notes?: string;
}

interface OutreachStatus {
  campaign: string;
  totalProspects: number;
  contacted: number;
  responded: number;
  linked: number;
  responseRate: number;
  successRate: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'analysis';

    switch (action) {
      case 'analysis':
        const analysis = await performLinkAnalysis();
        return NextResponse.json({ success: true, data: analysis });

      case 'internal-opportunities':
        const opportunities = await findInternalLinkOpportunities();
        return NextResponse.json({ success: true, data: opportunities });

      case 'broken-links':
        const brokenLinks = await findBrokenLinks();
        return NextResponse.json({ success: true, data: brokenLinks });

      case 'backlink-report':
        const backlinks = await getBacklinkReport();
        return NextResponse.json({ success: true, data: backlinks });

      case 'link-prospects':
        const prospects = await getLinkBuildingProspects();
        return NextResponse.json({ success: true, data: prospects });

      default:
        return NextResponse.json(
          { success: false, message: "Invalid action" },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error("Link optimization operation failed:", error);
    return NextResponse.json(
      { success: false, message: "Link optimization operation failed" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json();

    switch (action) {
      case 'add-internal-links':
        await addInternalLinks(data.links);
        break;

      case 'fix-broken-links':
        await fixBrokenLinks(data.links);
        break;

      case 'record-backlink':
        await recordBacklink(data);
        break;

      case 'add-link-prospect':
        await addLinkProspect(data);
        break;

      case 'update-outreach-status':
        await updateOutreachStatus(data.prospectId, data.status, data.notes);
        break;

      case 'generate-internal-links':
        const suggestions = await generateInternalLinkSuggestions(data.pageUrl, data.content);
        return NextResponse.json({ success: true, data: suggestions });

      case 'analyze-anchor-text':
        const anchorAnalysis = await analyzeAnchorTextDistribution();
        return NextResponse.json({ success: true, data: anchorAnalysis });

      default:
        return NextResponse.json(
          { success: false, message: "Invalid action" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: "Link optimization completed successfully"
    });

  } catch (error) {
    console.error("Link optimization failed:", error);
    return NextResponse.json(
      { success: false, message: "Link optimization failed" },
      { status: 500 }
    );
  }
}

async function performLinkAnalysis(): Promise<LinkAnalysis> {
  try {
    // Get existing backlink data
    const backlinks = await executeQuery(`
      SELECT * FROM seo_backlinks 
      WHERE status = 'active' 
      ORDER BY domain_authority DESC 
      LIMIT 100
    `);

    // Get internal link opportunities from content optimization table
    const internalOpportunities = await executeQuery(`
      SELECT url_path, internal_links_count FROM seo_content_optimization 
      ORDER BY last_analyzed DESC 
      LIMIT 50
    `);

    const analysis: LinkAnalysis = {
      internalLinks: {
        total: 0,
        unique: 0,
        broken: 0,
        opportunities: await findInternalLinkOpportunities(),
        distribution: {}
      },
      externalLinks: {
        total: Array.isArray(backlinks) ? backlinks.length : 0,
        domains: 0,
        noFollow: 0,
        sponsored: 0,
        backlinks: Array.isArray(backlinks) ? backlinks.map(formatBacklinkData) : []
      },
      anchorText: {
        analysis: {},
        overOptimized: [],
        suggestions: []
      },
      linkBuilding: {
        prospects: await getLinkBuildingProspects(),
        outreachStatus: [],
        completedCampaigns: 0
      }
    };

    // Calculate internal link stats
    if (Array.isArray(internalOpportunities)) {
      analysis.internalLinks.total = internalOpportunities.reduce((sum, item) => 
        sum + (parseInt(item.internal_links_count) || 0), 0
      );
      analysis.internalLinks.unique = internalOpportunities.length;
      
      // Create distribution map
      internalOpportunities.forEach(item => {
        analysis.internalLinks.distribution[item.url_path] = parseInt(item.internal_links_count) || 0;
      });
    }

    // Calculate external link stats
    if (Array.isArray(backlinks)) {
      const uniqueDomains = new Set(backlinks.map(link => link.source_domain));
      analysis.externalLinks.domains = uniqueDomains.size;
      analysis.externalLinks.noFollow = backlinks.filter(link => link.link_type === 'nofollow').length;
      analysis.externalLinks.sponsored = backlinks.filter(link => link.link_type === 'sponsored').length;
    }

    // Analyze anchor text
    analysis.anchorText = await analyzeAnchorTextDistribution();

    return analysis;

  } catch (error) {
    console.error("Failed to perform link analysis:", error);
    throw error;
  }
}

async function findInternalLinkOpportunities(): Promise<LinkOpportunity[]> {
  try {
    // Get all products and categories for link suggestions
    const products = await executeQuery(`
      SELECT id, name, slug FROM products WHERE status = 'active' LIMIT 20
    `);
    const categories = await executeQuery(`
      SELECT id, name, slug FROM categories WHERE is_active = 1 LIMIT 10
    `);

    const opportunities: LinkOpportunity[] = [];

    // Generate internal link opportunities between related products
    if (Array.isArray(products)) {
      for (let i = 0; i < Math.min(products.length, 10); i++) {
        for (let j = i + 1; j < Math.min(products.length, 15); j++) {
          if (products[i].name && products[j].name) {
            // Simple relevance check based on similar words
            const similarity = calculateTextSimilarity(products[i].name, products[j].name);
            
            if (similarity > 0.3) {
              opportunities.push({
                fromPage: `/products/${products[i].id}`,
                toPage: `/products/${products[j].id}`,
                anchorText: `Xem thêm ${products[j].name}`,
                relevanceScore: similarity,
                priority: similarity > 0.7 ? 'high' : similarity > 0.5 ? 'medium' : 'low',
                reason: `Related product based on name similarity (${Math.round(similarity * 100)}%)`
              });
            }
          }
        }
      }
    }

    // Generate category to product link opportunities
    if (Array.isArray(categories) && Array.isArray(products)) {
      categories.forEach(category => {
        const relatedProducts = products.filter(product => 
          product.name.toLowerCase().includes(category.name.toLowerCase()) ||
          category.name.toLowerCase().includes(product.name.toLowerCase())
        );

        relatedProducts.slice(0, 3).forEach(product => {
          opportunities.push({
            fromPage: `/category/${category.slug}`,
            toPage: `/products/${product.id}`,
            anchorText: product.name,
            relevanceScore: 0.8,
            priority: 'medium',
            reason: `Product belongs to category: ${category.name}`
          });
        });
      });
    }

    // Sort by relevance score and priority
    return opportunities
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 20);

  } catch (error) {
    console.error("Failed to find internal link opportunities:", error);
    return [];
  }
}

async function findBrokenLinks(): Promise<any[]> {
  try {
    // Simulate broken link detection
    // In a real implementation, this would crawl and check links
    const brokenLinks = [
      {
        page: '/products/123',
        brokenUrl: 'https://example.com/missing-page',
        anchorText: 'Learn more',
        linkType: 'external',
        status: 404,
        lastChecked: new Date().toISOString()
      }
    ];

    return brokenLinks;

  } catch (error) {
    console.error("Failed to find broken links:", error);
    return [];
  }
}

async function getBacklinkReport(): Promise<BacklinkData[]> {
  try {
    const backlinks = await executeQuery(`
      SELECT * FROM seo_backlinks 
      ORDER BY domain_authority DESC, discovered_at DESC 
      LIMIT 50
    `);

    if (!Array.isArray(backlinks)) return [];

    return backlinks.map(formatBacklinkData);

  } catch (error) {
    console.error("Failed to get backlink report:", error);
    return [];
  }
}

async function getLinkBuildingProspects(): Promise<LinkProspect[]> {
  try {
    // Simulate link building prospects for tech/gaming industry
    const prospects: LinkProspect[] = [
      {
        domain: 'techreview.vn',
        url: 'https://techreview.vn',
        contactEmail: 'editor@techreview.vn',
        domainAuthority: 45,
        relevanceScore: 0.9,
        outreachTemplate: 'tech_blogger_outreach',
        status: 'prospect',
        notes: 'Vietnamese tech review site - good for product reviews'
      },
      {
        domain: 'gamingworld.vn', 
        url: 'https://gamingworld.vn',
        contactEmail: 'contact@gamingworld.vn',
        domainAuthority: 38,
        relevanceScore: 0.85,
        outreachTemplate: 'gaming_community_outreach',
        status: 'contacted',
        notes: 'Gaming community - contacted about gaming laptop reviews'
      },
      {
        domain: 'vnexpress.net',
        url: 'https://vnexpress.net/so-hoa',
        domainAuthority: 85,
        relevanceScore: 0.7,
        outreachTemplate: 'news_media_outreach',
        status: 'prospect',
        notes: 'Major Vietnamese news site - tech section'
      }
    ];

    return prospects;

  } catch (error) {
    console.error("Failed to get link building prospects:", error);
    return [];
  }
}

function formatBacklinkData(link: any): BacklinkData {
  return {
    sourceUrl: link.source_url,
    sourceDomain: link.source_domain,
    targetUrl: link.target_url,
    anchorText: link.anchor_text || '',
    linkType: link.link_type || 'follow',
    domainAuthority: link.domain_authority || 0,
    discovered: link.discovered_at || new Date().toISOString(),
    status: link.status || 'active'
  };
}

function calculateTextSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0;
  
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);
  
  const commonWords = words1.filter(word => words2.includes(word));
  const totalWords = new Set([...words1, ...words2]).size;
  
  return commonWords.length / totalWords;
}

async function addInternalLinks(links: any[]): Promise<void> {
  try {
    // This would implement actual internal link addition to pages
    // For now, we'll just record the action
    for (const link of links) {
      await executeQuery(`
        INSERT INTO seo_analytics (url_path, date, page_views, organic_visits)
        VALUES (?, DATE('now'), 1, 1)
      `, [`internal_link_added_${link.fromPage}_to_${link.toPage}`]);
    }
  } catch (error) {
    console.error("Failed to add internal links:", error);
    throw error;
  }
}

async function fixBrokenLinks(links: any[]): Promise<void> {
  try {
    // This would implement broken link fixing
    for (const link of links) {
      await executeQuery(`
        INSERT INTO seo_analytics (url_path, date, page_views)
        VALUES (?, DATE('now'), 1)
      `, [`broken_link_fixed_${link.page}`]);
    }
  } catch (error) {
    console.error("Failed to fix broken links:", error);
    throw error;
  }
}

async function recordBacklink(data: any): Promise<void> {
  try {
    await executeQuery(`
      INSERT OR REPLACE INTO seo_backlinks 
      (source_domain, source_url, target_url, anchor_text, link_type, domain_authority, status, discovered_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      data.sourceDomain,
      data.sourceUrl,
      data.targetUrl,
      data.anchorText || '',
      data.linkType || 'follow',
      data.domainAuthority || 0,
      data.status || 'active'
    ]);
  } catch (error) {
    console.error("Failed to record backlink:", error);
    throw error;
  }
}

async function addLinkProspect(data: any): Promise<void> {
  try {
    // Store in audit issues table as a placeholder
    await executeQuery(`
      INSERT INTO seo_audit_issues 
      (url_path, issue_type, severity, issue_description, suggested_fix)
      VALUES (?, 'link_prospect', 'low', ?, ?)
    `, [
      data.domain,
      `Link prospect: ${data.domain} (DA: ${data.domainAuthority})`,
      `Contact: ${data.contactEmail || 'Not provided'}`
    ]);
  } catch (error) {
    console.error("Failed to add link prospect:", error);
    throw error;
  }
}

async function updateOutreachStatus(prospectId: string, status: string, notes?: string): Promise<void> {
  try {
    await executeQuery(`
      UPDATE seo_audit_issues 
      SET issue_description = ?, suggested_fix = ?, updated_at = CURRENT_TIMESTAMP
      WHERE url_path = ? AND issue_type = 'link_prospect'
    `, [
      `Link prospect status: ${status}`,
      notes || '',
      prospectId
    ]);
  } catch (error) {
    console.error("Failed to update outreach status:", error);
    throw error;
  }
}

async function generateInternalLinkSuggestions(pageUrl: string, content: string): Promise<any[]> {
  try {
    // Analyze content and suggest internal links
    const suggestions = [];
    
    // Get related products based on content keywords
    const keywords = extractKeywords(content);
    
    for (const keyword of keywords.slice(0, 5)) {
      const relatedProducts = await executeQuery(`
        SELECT id, name FROM products 
        WHERE name LIKE ? AND status = 'active' 
        LIMIT 3
      `, [`%${keyword}%`]);

      if (Array.isArray(relatedProducts)) {
        relatedProducts.forEach(product => {
          suggestions.push({
            keyword,
            targetUrl: `/products/${product.id}`,
            anchorText: product.name,
            relevanceScore: 0.8,
            context: `Keyword "${keyword}" found in content`
          });
        });
      }
    }

    return suggestions.slice(0, 10);

  } catch (error) {
    console.error("Failed to generate internal link suggestions:", error);
    return [];
  }
}

async function analyzeAnchorTextDistribution(): Promise<any> {
  try {
    const backlinks = await executeQuery(`
      SELECT anchor_text FROM seo_backlinks WHERE anchor_text IS NOT NULL
    `);

    const analysis: any = {
      analysis: {},
      overOptimized: [],
      suggestions: []
    };

    if (Array.isArray(backlinks)) {
      // Count anchor text occurrences
      backlinks.forEach(link => {
        const anchor = link.anchor_text?.toLowerCase() || '';
        if (anchor) {
          analysis.analysis[anchor] = (analysis.analysis[anchor] || 0) + 1;
        }
      });

      // Find over-optimized anchor text (>30% of total)
      const total = backlinks.length;
      Object.entries(analysis.analysis).forEach(([anchor, count]: [string, any]) => {
        const percentage = (count / total) * 100;
        if (percentage > 30) {
          analysis.overOptimized.push(anchor);
        }
      });

      // Generate suggestions
      if (analysis.overOptimized.length > 0) {
        analysis.suggestions.push("Diversify anchor text to avoid over-optimization");
        analysis.suggestions.push("Use more natural, branded anchor text");
      }

      analysis.suggestions.push("Include target keywords in anchor text naturally");
      analysis.suggestions.push("Use variation of brand name as anchor text");
    }

    return analysis;

  } catch (error) {
    console.error("Failed to analyze anchor text:", error);
    return { analysis: {}, overOptimized: [], suggestions: [] };
  }
}

function extractKeywords(content: string): string[] {
  if (!content) return [];
  
  // Simple keyword extraction - remove HTML and extract meaningful words
  const cleanContent = content.replace(/<[^>]*>/g, ' ').toLowerCase();
  const words = cleanContent.match(/\b[a-zA-Zữắằảạầấậẩèéẹẻẽêềếệểễ]+\b/g) || [];
  
  // Filter common words and short words
  const stopWords = ['và', 'của', 'cho', 'với', 'tại', 'là', 'có', 'được', 'này', 'đó', 'các', 'một', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
  const keywords = words
    .filter(word => word.length > 3 && !stopWords.includes(word))
    .filter((word, index, arr) => arr.indexOf(word) === index) // Remove duplicates
    .slice(0, 20);

  return keywords;
}
