const fs = require('fs');
const path = require('path');

// Generate comprehensive robots.txt content
function generateRobotsTxt() {
  const baseUrl = "https://hacom.vn";
  const timestamp = new Date().toISOString();

  const robotsContent = `# Robots.txt for HACOM E-commerce Platform
# Generated automatically on ${timestamp}
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

# Visit time restrictions (crawl during off-peak hours for Vietnam)
Visit-time: 0100-0500

# ================================
# SITEMAP DECLARATIONS
# ================================

# Main sitemap
Sitemap: ${baseUrl}/sitemap.xml

# Sitemap index for large sites
Sitemap: ${baseUrl}/sitemap-index.xml

# ================================
# TECHNICAL DIRECTIVES
# ================================

# Preferred domain (helps with canonicalization)
Host: hacom.vn

# Cache directive for better bot performance
Cache-delay: 86400

# Clean param (ignore these parameters for indexing)
Clean-param: utm_source&utm_medium&utm_campaign&utm_term&utm_content
Clean-param: fbclid&gclid&ref&from&share
Clean-param: add-to-cart&remove&quantity&variant
Clean-param: sort&order&filter&page&limit&offset

# ================================
# NOTES FOR WEBMASTERS
# ================================

# This robots.txt is optimized for:
# - Vietnamese e-commerce market
# - High-traffic product catalogs
# - SEO best practices 2024
# - Core Web Vitals optimization
# - International expansion ready

# For support: contact@hacom.vn
# Last updated: ${timestamp.split('T')[0]}
`;

  return robotsContent;
}

// Update robots.txt file
function updateRobotsTxt() {
  try {
    const publicDir = path.join(process.cwd(), 'public');
    const robotsPath = path.join(publicDir, 'robots.txt');
    
    // Generate new content
    const newContent = generateRobotsTxt();
    
    // Backup existing file if it exists
    if (fs.existsSync(robotsPath)) {
      const backupPath = path.join(publicDir, `robots-backup-${Date.now()}.txt`);
      fs.copyFileSync(robotsPath, backupPath);
      console.log(`✅ Backed up existing robots.txt to: ${backupPath}`);
    }
    
    // Write new robots.txt
    fs.writeFileSync(robotsPath, newContent, 'utf8');
    console.log(`✅ Updated robots.txt with comprehensive content`);
    console.log(`📝 Content length: ${newContent.length} characters`);
    console.log(`📍 File location: ${robotsPath}`);
    
    // Verify file was written correctly
    const verifyContent = fs.readFileSync(robotsPath, 'utf8');
    if (verifyContent === newContent) {
      console.log(`✅ Verification successful - robots.txt updated correctly`);
      return true;
    } else {
      console.log(`❌ Verification failed - content mismatch`);
      return false;
    }
    
  } catch (error) {
    console.error(`❌ Error updating robots.txt:`, error.message);
    return false;
  }
}

// Run update if called directly
if (require.main === module) {
  updateRobotsTxt();
}

module.exports = { updateRobotsTxt, generateRobotsTxt };
