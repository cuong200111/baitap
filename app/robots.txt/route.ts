import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Get base URL from request
    const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`;

    // Try to fetch SEO settings from backend
    let customContent = "";
    let enableSitemap = true;
    let siteUrl = baseUrl;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_DOMAIN || "http://localhost:4000"}/api/admin/seo-settings`,
      );
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          customContent = data.data.technical?.robots_txt_custom || "";
          enableSitemap = data.data.technical?.enable_sitemap !== false;
          siteUrl = data.data.general?.site_url || baseUrl;
        }
      }
    } catch (e) {
      // Use defaults if backend is not available
      console.log("Using default robots.txt settings");
    }

    // Generate robots.txt content
    let robotsContent = `# HACOM E-commerce Platform - Robots.txt
# Generated automatically on ${new Date().toISOString()}
# Optimized for maximum SEO performance

# ===========================================
# MAIN CRAWLERS - FULL ACCESS
# ===========================================

# Google Search Engine
User-agent: Googlebot
Allow: /
Allow: /products/
Allow: /category/
Allow: /uploads/
Crawl-delay: 1

# Bing Search Engine  
User-agent: Bingbot
Allow: /
Allow: /products/
Allow: /category/
Allow: /uploads/
Crawl-delay: 2

# Yahoo Search Engine
User-agent: Slurp
Allow: /
Allow: /products/
Allow: /category/
Allow: /uploads/
Crawl-delay: 3

# Yandex Search Engine
User-agent: YandexBot
Allow: /
Allow: /products/
Allow: /category/
Allow: /uploads/
Crawl-delay: 2

# DuckDuckGo Search Engine
User-agent: DuckDuckBot
Allow: /
Allow: /products/
Allow: /category/
Allow: /uploads/
Crawl-delay: 1

# ===========================================
# SOCIAL MEDIA CRAWLERS
# ===========================================

# Facebook Crawler
User-agent: facebookexternalhit/
Allow: /
Allow: /products/
Allow: /category/

# Twitter Crawler
User-agent: Twitterbot
Allow: /
Allow: /products/
Allow: /category/

# LinkedIn Crawler
User-agent: LinkedInBot
Allow: /
Allow: /products/
Allow: /category/

# WhatsApp Crawler
User-agent: WhatsApp
Allow: /
Allow: /products/
Allow: /category/

# Telegram Crawler
User-agent: TelegramBot
Allow: /
Allow: /products/
Allow: /category/

# ===========================================
# GENERAL CRAWLERS - RESTRICTED ACCESS  
# ===========================================

User-agent: *
Allow: /
Allow: /products/
Allow: /category/
Allow: /uploads/

# Block admin and sensitive areas
Disallow: /admin/
Disallow: /api/
Disallow: /_next/
Disallow: /debug*
Disallow: /test*
Disallow: /setup*
Disallow: /status*

# Block user-specific pages
Disallow: /login*
Disallow: /register*
Disallow: /profile*
Disallow: /checkout*
Disallow: /cart*
Disallow: /orders*
Disallow: /billing*
Disallow: /thank-you*
Disallow: /track-order*

# Block dynamic/filtered URLs that cause duplicate content
Disallow: /*?*sort=*
Disallow: /*?*filter=*
Disallow: /*?*page=*
Disallow: /*?*limit=*
Disallow: /*?*search=*
Disallow: /*?*utm_*
Disallow: /*?*fbclid*
Disallow: /*?*gclid*
Disallow: /*?*add-to-cart*
Disallow: /*?*remove*
Disallow: /*?*quantity*

# Block file types that shouldn't be indexed
Disallow: /*.sql$
Disallow: /*.log$
Disallow: /*.env$
Disallow: /*.backup$
Disallow: /*.tmp$
Disallow: /*.cache$
Disallow: /*backup*
Disallow: /*temp*
Disallow: /*cache*

# Block development and staging areas
Disallow: /dev/
Disallow: /staging/
Disallow: /beta/

# ===========================================
# BAD BOTS AND SCRAPERS - BLOCKED
# ===========================================

# SEO Tools Bots (consume bandwidth without value)
User-agent: SemrushBot
Disallow: /

User-agent: AhrefsBot  
Disallow: /

User-agent: MJ12bot
Disallow: /

User-agent: DotBot
Disallow: /

User-agent: BLEXBot
Disallow: /

User-agent: PetalBot
Disallow: /

User-agent: SeznamBot
Disallow: /

User-agent: MauiBot
Disallow: /

# Aggressive crawlers
User-agent: ia_archiver
Disallow: /

User-agent: ScoutJet
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: ChatGPT-User
Disallow: /

User-agent: CCBot/2.0
Disallow: /

User-agent: anthropic-ai
Disallow: /

User-agent: Claude-Web
Disallow: /

# Email collectors and spammers
User-agent: EmailCollector
Disallow: /

User-agent: EmailSiphon
Disallow: /

User-agent: WebBandit
Disallow: /

User-agent: EmailWolf
Disallow: /

`;

    // Add custom content if available
    if (customContent.trim()) {
      robotsContent += `
# ===========================================
# CUSTOM RULES
# ===========================================
${customContent}

`;
    }

    // Add sitemap and directives
    robotsContent += `# ===========================================
# SITEMAPS
# ===========================================
`;

    if (enableSitemap) {
      robotsContent += `Sitemap: ${baseUrl}/sitemap.xml
`;
    }

    robotsContent += `
# ===========================================
# TECHNICAL DIRECTIVES
# ===========================================

# Host directive for canonical domain
Host: ${baseUrl.replace(/^https?:\/\//, "")}

# Request rate (microseconds between requests)
Request-rate: 1/10

# Visit time (seconds crawler should wait between visits)
Visit-time: 0600-1800

# Cache directive for robots.txt itself
Cache-delay: 86400

# ===========================================
# END OF ROBOTS.TXT
# Last updated: ${new Date().toISOString()}
# ===========================================
`;

    // Return robots.txt with proper headers
    return new NextResponse(robotsContent, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
        Expires: new Date(Date.now() + 86400000).toUTCString(),
        "Last-Modified": new Date().toUTCString(),
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  } catch (error) {
    console.error("Failed to generate robots.txt:", error);

    // Fallback robots.txt content
    const fallbackContent = `# HACOM Robots.txt - Fallback Version
# Generated: ${new Date().toISOString()}

User-agent: *
Allow: /
Allow: /products/
Allow: /category/
Allow: /uploads/

Disallow: /admin/
Disallow: /api/
Disallow: /login*
Disallow: /register*
Disallow: /profile*
Disallow: /checkout*
Disallow: /cart*
Disallow: /orders*
Disallow: /_next/
Disallow: /debug*
Disallow: /test*

# Block bad bots
User-agent: SemrushBot
Disallow: /

User-agent: AhrefsBot
Disallow: /

User-agent: MJ12bot
Disallow: /

# Sitemap
Sitemap: ${request.nextUrl.protocol}//${request.nextUrl.host}/sitemap.xml

# Host
Host: ${request.nextUrl.host}
`;

    return new NextResponse(fallbackContent, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=86400",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  }
}
