import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  // Nội dung robots.txt bạn muốn
  const baseUrl = "https://hacom.vn";
  const customContent = ""; // Nếu muốn thêm custom thì nối thêm vào

  let robotsContent = `# Robots.txt for HACOM E-commerce
# Generated automatically on ${new Date().toISOString()}

User-agent: *
Allow: /

Disallow: /admin/
Disallow: /api/
Disallow: /login
Disallow: /register
Disallow: /profile
Disallow: /checkout
Disallow: /cart
Disallow: /orders
Disallow: /debug*
Disallow: /test*
Disallow: /_next/
Disallow: /uploads/temp/
Disallow: /search?*
Disallow: /*?*add-to-cart*
Disallow: /*?*remove*
Disallow: /*?*utm_*
Disallow: /*?*fbclid*
Disallow: /*?*gclid*

Allow: /products/
Allow: /category/
Allow: /api/sitemap
Allow: /uploads/

User-agent: Googlebot
Allow: /
Crawl-delay: 1

User-agent: Bingbot
Allow: /
Crawl-delay: 2

User-agent: Slurp
Allow: /
Crawl-delay: 3

User-agent: facebookexternalhit
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: LinkedInBot
Allow: /

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

Disallow: /*sort=*
Disallow: /*filter=*
Disallow: /*page=*
Disallow: /*limit=*
Disallow: /products?*
Disallow: /category/*/*

Disallow: /*.sql$
Disallow: /*.log$
Disallow: /*.env$
Disallow: /*.backup$
Disallow: /*backup*
Disallow: /*temp*
Disallow: /*.tmp$

Disallow: /api/debug/
Disallow: /api/test/

# Sitemaps
Sitemap: ${baseUrl}/sitemap.xml

# Host directive
Host: ${baseUrl.replace(/^https?:\/\//, "")}

# Cache directive
Cache-delay: 86400
`;

  if (customContent.trim()) {
    robotsContent += `\n# Custom Rules\n${customContent}\n`;
  }

  return new Response(robotsContent, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
