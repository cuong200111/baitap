import { NextResponse } from 'next/server';

async function getSeoSettings() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/seo/settings`);
    const result = await response.json();
    return result.success ? result.data : null;
  } catch (error) {
    console.error('Error fetching SEO settings:', error);
    return null;
  }
}

async function generateRobotsTxt() {
  const seoSettings = await getSeoSettings();
  const baseUrl = seoSettings?.general?.site_url || 'https://hacom.vn';
  const customRobots = seoSettings?.technical?.robots_txt_custom || '';
  const sitemapEnabled = seoSettings?.technical?.enable_sitemap !== false;
  
  let robotsContent = '';
  
  // Add custom robots.txt content if provided
  if (customRobots.trim()) {
    robotsContent = customRobots.trim() + '\n\n';
  } else {
    // Default robots.txt content
    robotsContent = `# Robots.txt for ${baseUrl}
# Generated automatically by SEO settings

User-agent: *
Allow: /

# Disallow admin and private areas
Disallow: /admin/
Disallow: /api/
Disallow: /backend/
Disallow: /_next/
Disallow: /checkout/
Disallow: /cart/
Disallow: /login/
Disallow: /register/
Disallow: /profile/
Disallow: /orders/

# Disallow search and filter URLs
Disallow: /*?*
Disallow: /search?*
Disallow: /*&*

# Allow specific bots
User-agent: Googlebot
Allow: /
Crawl-delay: 1

User-agent: Bingbot
Allow: /
Crawl-delay: 1

User-agent: facebookexternalhit
Allow: /

User-agent: Twitterbot
Allow: /

# Disallow aggressive crawlers
User-agent: AhrefsBot
Disallow: /

User-agent: SemrushBot
Disallow: /

User-agent: MJ12bot
Disallow: /

`;
  }
  
  // Add sitemap reference if enabled
  if (sitemapEnabled) {
    robotsContent += `# Sitemap
Sitemap: ${baseUrl}/sitemap.xml\n`;
  }
  
  return robotsContent;
}

export async function GET() {
  try {
    // Log robots.txt generation for analytics
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/seo/analytics/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url_path: 'robots_generation',
          date: new Date().toISOString().split('T')[0],
          page_views: 1
        })
      });
    } catch (logError) {
      console.error('Error logging robots.txt generation:', logError);
    }

    const robotsContent = await generateRobotsTxt();
    
    return new NextResponse(robotsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400', // Cache for 24 hours
      },
    });
  } catch (error) {
    console.error('Error generating robots.txt:', error);
    
    const fallbackRobots = `User-agent: *
Allow: /

Disallow: /admin/
Disallow: /api/

Sitemap: https://hacom.vn/sitemap.xml
`;
    
    return new NextResponse(fallbackRobots, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
}
