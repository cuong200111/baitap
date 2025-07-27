// import { executeQuery } from "../database/connection.js";
// const router = express.Router();


// router.get("/robots", async (req, res) => {
//   try {
//     // Lấy setting site_url và robots_txt_custom
//     const robotsSettings = await executeQuery(`
//       SELECT setting_key, setting_value FROM seo_settings 
//       WHERE setting_key IN ('site_url', 'robots_txt_custom')
//       AND is_active = 1
//     `);

//     let baseUrl = "https://hacom.vn";
//     let customContent = "";

//     if (Array.isArray(robotsSettings)) {
//       robotsSettings.forEach((setting) => {
//         if (setting.setting_key === "site_url") {
//           baseUrl = setting.setting_value;
//         } else if (setting.setting_key === "robots_txt_custom") {
//           customContent = setting.setting_value || "";
//         }
//       });
//     }

//     let robotsContent = `# Robots.txt for HACOM E-commerce
// # Generated automatically on ${new Date().toISOString()}

// # Allow all crawlers for main content
// User-agent: *
// Allow: /

// # Disallow admin areas and sensitive paths
// Disallow: /admin/
// Disallow: /api/
// Disallow: /login
// Disallow: /register
// Disallow: /profile
// Disallow: /checkout
// Disallow: /cart
// Disallow: /orders
// Disallow: /debug*
// Disallow: /test*
// Disallow: /_next/
// Disallow: /uploads/temp/
// Disallow: /search?*
// Disallow: /*?*add-to-cart*
// Disallow: /*?*remove*
// Disallow: /*?*utm_*
// Disallow: /*?*fbclid*
// Disallow: /*?*gclid*

// # Allow specific important paths
// Allow: /products/
// Allow: /category/
// Allow: /api/sitemap
// Allow: /uploads/

// # Specific rules for major search engines
// User-agent: Googlebot
// Allow: /
// Crawl-delay: 1

// User-agent: Bingbot
// Allow: /
// Crawl-delay: 2

// User-agent: Slurp
// Allow: /
// Crawl-delay: 3

// # Social media crawlers
// User-agent: facebookexternalhit
// Allow: /

// User-agent: Twitterbot
// Allow: /

// User-agent: LinkedInBot
// Allow: /

// # Block bad bots and scrapers
// User-agent: SemrushBot
// Disallow: /

// User-agent: AhrefsBot
// Disallow: /

// User-agent: MJ12bot
// Disallow: /

// User-agent: DotBot
// Disallow: /

// User-agent: BLEXBot
// Disallow: /

// User-agent: PetalBot
// Disallow: /

// # E-commerce specific rules
// Disallow: /*sort=*
// Disallow: /*filter=*
// Disallow: /*page=*
// Disallow: /*limit=*
// Disallow: /products?*
// Disallow: /category/*/*

// # Security
// Disallow: /*.sql$
// Disallow: /*.log$
// Disallow: /*.env$
// Disallow: /*.backup$
// Disallow: /*backup*
// Disallow: /*temp*
// Disallow: /*.tmp$

// # Performance - Disallow resource-heavy crawling
// Disallow: /api/debug/
// Disallow: /api/test/

// `;

//     if (customContent.trim()) {
//       robotsContent += `
// # Custom Rules
// ${customContent}

// `;
//     }

//     robotsContent += `# Sitemaps
// Sitemap: ${baseUrl}/sitemap.xml

// # Host directive
// Host: ${baseUrl.replace(/^https?:\/\//, "")}

// # Cache directive for better performance
// Cache-delay: 86400
// `;

//     res.set({
//       "Content-Type": "text/plain",
//       "Cache-Control": "public, max-age=86400",
//     });
//     return res.send(robotsContent);
//   } catch (error) {
//     console.error("Failed to generate robots.txt:", error);

//     const fallbackContent = `User-agent: *
// Allow: /

// Disallow: /admin/
// Disallow: /api/
// Disallow: /login
// Disallow: /register
// Disallow: /profile
// Disallow: /checkout
// Disallow: /cart
// Disallow: /orders

// Sitemap: https://hacom.vn/sitemap.xml
// `;

//     res.set({
//       "Content-Type": "text/plain",
//       "Cache-Control": "public, max-age=86400",
//     });
//     return res.send(fallbackContent);
//   }
// });

// export default router;
