import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const robotsTxt = `# *
User-agent: *
Allow: /

# Disallow admin and internal pages
Disallow: /admin/
Disallow: /api/
Disallow: /test-*
Disallow: /setup-admin
Disallow: /_next/
Disallow: /profile/
Disallow: /orders/
Disallow: /checkout/
Disallow: /cart/

# Host
Host: ${siteUrl}

# Sitemaps
Sitemap: ${siteUrl}/sitemap.xml`;

  return new NextResponse(robotsTxt, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=86400, s-maxage=86400", // 24 hours cache
    },
  });
}
