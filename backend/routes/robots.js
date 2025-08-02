import express from "express";
import { executeQuery } from "../database/connection.js";

const router = express.Router();

// GET /robots.txt - Serve optimized robots.txt for SEO
router.get("/robots.txt", async (req, res) => {
  try {
    // 1. Lấy SEO settings từ database
    const robotsSettings = await executeQuery(`
      SELECT setting_key, setting_value FROM seo_settings 
      WHERE setting_key IN ('site_url', 'robots_txt_custom', 'enable_sitemap')
      AND is_active = 1
    `);

    let baseUrl = "https://hacom.vn";
    let customContent = "";
    let enableSitemap = true;

    if (Array.isArray(robotsSettings)) {
      robotsSettings.forEach((setting) => {
        if (setting.setting_key === "site_url") {
          baseUrl = setting.setting_value || baseUrl;
        } else if (setting.setting_key === "robots_txt_custom") {
          customContent = setting.setting_value || "";
        } else if (setting.setting_key === "enable_sitemap") {
          enableSitemap = setting.setting_value !== "0";
        }
      });
    }

    // 2. Tạo robots.txt content tối ưu SEO 100%
    let robotsContent = `# Robots.txt for HACOM E-commerce Platform
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
Allow: /api/sitemap*
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

    // 3. Thêm custom content nếu có
    if (customContent.trim()) {
      robotsContent += `
# ===========================================
# CUSTOM RULES
# ===========================================
${customContent}

`;
    }

    // 4. Thêm sitemap và directives cuối
    robotsContent += `# ===========================================
# SITEMAPS
# ===========================================
`;

    if (enableSitemap) {
      robotsContent += `Sitemap: ${baseUrl}/sitemap.xml
Sitemap: ${baseUrl}/api/sitemap.xml
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

    // 5. Log sitemap generation to analytics
    try {
      await executeQuery(
        `INSERT INTO seo_analytics (url_path, date, page_views, created_at) 
         VALUES ('robots_generation', CURDATE(), 1, NOW())
         ON DUPLICATE KEY UPDATE 
         page_views = page_views + 1, updated_at = NOW()`,
      );
    } catch (logError) {
      console.log("Analytics logging failed:", logError.message);
    }

    // 6. Trả về response với headers tối ưu
    res.set({
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
      Expires: new Date(Date.now() + 86400000).toUTCString(),
      "Last-Modified": new Date().toUTCString(),
      "X-Robots-Tag": "noindex, nofollow",
    });

    return res.send(robotsContent);
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
Sitemap: https://hacom.vn/sitemap.xml

# Host
Host: hacom.vn
`;

    res.set({
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
      "X-Robots-Tag": "noindex, nofollow",
    });

    return res.send(fallbackContent);
  }
});

export default router;
