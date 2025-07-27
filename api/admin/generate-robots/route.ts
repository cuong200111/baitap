import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

export async function POST(request: NextRequest) {
  try {
    // Get base URL and custom robots content from settings
    const robotsSettings = await executeQuery(`
      SELECT setting_key, setting_value FROM seo_settings 
      WHERE setting_key IN ('site_url', 'robots_txt_custom')
      AND is_active = 1
    `);

    let baseUrl = "https://hacom.vn";
    let customContent = "";

    if (Array.isArray(robotsSettings)) {
      robotsSettings.forEach((setting: any) => {
        if (setting.setting_key === "site_url") {
          baseUrl = setting.setting_value;
        } else if (setting.setting_key === "robots_txt_custom") {
          customContent = setting.setting_value || "";
        }
      });
    }

    // Generate comprehensive robots.txt content
    let robotsContent = `# Robots.txt for HACOM E-commerce Platform
# Generated automatically on ${new Date().toISOString()}
# Optimized for Vietnam e-commerce market

# ================================
# GLOBAL RULES FOR ALL CRAWLERS
# ================================

User-agent: *
Allow: /

# Allow important SEO and discovery files
Allow: /sitemap.xml
Allow: /sitemap-index.xml
Allow: /robots.txt
Allow: /favicon.ico

# Allow product and category pages (main content)
Allow: /products/
Allow: /category/
Allow: /uploads/

# ================================
# DISALLOW SENSITIVE AREAS
# ================================

# Admin and authentication areas
Disallow: /admin/
Disallow: /api/
Disallow: /login
Disallow: /register
Disallow: /profile
Disallow: /checkout
Disallow: /cart
Disallow: /orders
Disallow: /thank-you
Disallow: /track-order
Disallow: /billing

# Development and testing paths
Disallow: /debug*
Disallow: /test*
Disallow: /_next/
Disallow: /.next/
Disallow: /node_modules/

# Temporary and backup files
Disallow: /uploads/temp/
Disallow: /uploads/cache/
Disallow: /*backup*
Disallow: /*temp*
Disallow: /*.tmp$
Disallow: /*.log$
Disallow: /*.sql$
Disallow: /*.env$

# Duplicate content and query parameters
Disallow: /*?*add-to-cart*
Disallow: /*?*remove*
Disallow: /*?*utm_*
Disallow: /*?*fbclid*
Disallow: /*?*gclid*
Disallow: /*?*ref=*
Disallow: /*?*sort=*
Disallow: /*?*filter=*
Disallow: /*?*page=*
Disallow: /*?*limit=*
Disallow: /*?*offset=*
Disallow: /search?*
Disallow: /products?*

# Prevent crawling of deep category paths
Disallow: /category/*/*

# ================================
# SEARCH ENGINE SPECIFIC RULES
# ================================

# Google Bot - Most important for Vietnam market
User-agent: Googlebot
Allow: /
Crawl-delay: 1

# Bing Bot - Secondary importance
User-agent: Bingbot
Allow: /
Crawl-delay: 2

# Yahoo Bot
User-agent: Slurp
Allow: /
Crawl-delay: 3

# Yandex Bot - For international reach
User-agent: YandexBot
Allow: /
Crawl-delay: 2

# ================================
# SOCIAL MEDIA CRAWLERS
# ================================

# Facebook crawler for Open Graph
User-agent: facebookexternalhit
Allow: /

# Twitter card crawler
User-agent: Twitterbot
Allow: /

# LinkedIn crawler
User-agent: LinkedInBot
Allow: /

# Pinterest crawler
User-agent: Pinterestbot
Allow: /

# WhatsApp crawler
User-agent: WhatsApp
Allow: /

# ================================
# BLOCK UNWANTED BOTS
# ================================

# SEO analysis bots (can slow down site)
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

User-agent: serpstatbot
Disallow: /

User-agent: BacklinkCrawler
Disallow: /

# Content scrapers and spam bots
User-agent: EmailCollector
Disallow: /

User-agent: EmailSiphon
Disallow: /

User-agent: WebBandit
Disallow: /

User-agent: EmailWolf
Disallow: /

User-agent: ExtractorPro
Disallow: /

User-agent: CopyRightCheck
Disallow: /

User-agent: Crescent
Disallow: /

User-agent: SiteCheckBot
Disallow: /

User-agent: sogouspider
Disallow: /

User-agent: NaverBot
Disallow: /

# ================================
# PERFORMANCE OPTIMIZATION
# ================================

# Crawl delay for resource-heavy operations
Crawl-delay: 1

# Request rate limiting
Request-rate: 1/10s

# ================================
# SECURITY RULES
# ================================

# Block access to sensitive file types
Disallow: /*.sql$
Disallow: /*.log$
Disallow: /*.env$
Disallow: /*.backup$
Disallow: /*.config$
Disallow: /*.json$
Disallow: /*.xml$

# Block development tools
Disallow: /api/debug/
Disallow: /api/test/
Disallow: /.git/
Disallow: /.env

`;

    // Add custom content if provided
    if (customContent.trim()) {
      robotsContent += `
# Custom Rules
${customContent}

`;
    }

    // Add sitemap reference
    robotsContent += `# Sitemaps
Sitemap: ${baseUrl}/sitemap.xml
Sitemap: ${baseUrl}/sitemap-index.xml

# Host directive
Host: ${baseUrl.replace(/^https?:\/\//, "")}

# Cache directive for better performance
Cache-delay: 86400
`;

    // Create backup in uploads directory for reference (don't write to public to avoid conflicts)
    const publicDir = join(process.cwd(), "public");
    const uploadsDir = join(publicDir, "uploads");
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true });
    }

    const backupPath = join(uploadsDir, `robots-backup-${Date.now()}.txt`);
    writeFileSync(backupPath, robotsContent, "utf8");

    // Store generation info in database
    await executeQuery(
      `
      INSERT OR REPLACE INTO seo_analytics (url_path, date, page_views, unique_visitors)
      VALUES ('robots_generation', DATE('now'), 1, ?)
    `,
      [robotsContent.split("\n").length],
    );

    return NextResponse.json({
      success: true,
      message: "Robots.txt generated successfully",
      robotsUrl: `${baseUrl}/robots.txt`,
      linesGenerated: robotsContent.split("\n").length,
      generatedAt: new Date().toISOString(),
      backupPath: backupPath,
    });
  } catch (error) {
    console.error("Failed to generate robots.txt:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to generate robots.txt",
        error: error.message,
      },
      { status: 500 },
    );
  }
}
