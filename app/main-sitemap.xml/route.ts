import { NextRequest, NextResponse } from "next/server";

// Escape XML special characters
function escapeXml(unsafe: string) {
  if (!unsafe) return "";
  return unsafe
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(request: NextRequest) {
  try {
    // Get base URL from request
    const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`;

    // Generate XML sitemap for static pages only
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0">
  <!-- Main Static Pages Sitemap - Generated on ${new Date().toISOString()} -->
  <!-- HACOM E-commerce Static Pages -->
`;

    // Homepage
    xml += `  <url>
    <loc>${escapeXml(baseUrl)}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <mobile:mobile/>
  </url>
`;

    // Static pages
    const staticPages = [
      { path: "/products", priority: "0.9", changefreq: "daily" },
      { path: "/login", priority: "0.3", changefreq: "monthly" },
      { path: "/register", priority: "0.3", changefreq: "monthly" },
      { path: "/about", priority: "0.6", changefreq: "monthly" },
      { path: "/contact", priority: "0.6", changefreq: "monthly" },
    ];

    staticPages.forEach((page) => {
      xml += `  <url>
    <loc>${escapeXml(baseUrl)}${escapeXml(page.path)}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
    <mobile:mobile/>
  </url>
`;
    });

    xml += `</urlset>`;

    // Return XML response with proper headers
    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=7200",
        Expires: new Date(Date.now() + 3600000).toUTCString(),
        "Last-Modified": new Date().toUTCString(),
        "X-Robots-Tag": "noindex, nofollow",
        Vary: "Accept-Encoding",
      },
    });
  } catch (error) {
    console.error("Failed to generate main sitemap:", error);

    // Fallback sitemap
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Main Sitemap Fallback - ${new Date().toISOString()} -->
  <url>
    <loc>${escapeXml(`${request.nextUrl.protocol}//${request.nextUrl.host}`)}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;

    return new NextResponse(fallbackXml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=1800",
      },
    });
  }
}
