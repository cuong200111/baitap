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

    // Generate Sitemap Index instead of combined sitemap
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Generated automatically on ${new Date().toISOString()} -->
  <!-- HACOM E-commerce Sitemap Index -->

  <!-- Main sitemap for static pages -->
  <sitemap>
    <loc>${escapeXml(baseUrl)}/main-sitemap.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>

  <!-- Categories sitemap -->
  <sitemap>
    <loc>${escapeXml(baseUrl)}/categories-sitemap.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>

  <!-- Products sitemap -->
  <sitemap>
    <loc>${escapeXml(baseUrl)}/products-sitemap.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>

  <!-- Custom URLs sitemap -->
  <sitemap>
    <loc>${escapeXml(baseUrl)}/all-sitemap.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>

</sitemapindex>`;

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
    console.error("Failed to generate sitemap:", error);

    // Fallback sitemap
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" 
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0">
  <!-- Fallback sitemap - ${new Date().toISOString()} -->
  
  <url>
    <loc>${escapeXml(`${request.nextUrl.protocol}//${request.nextUrl.host}`)}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <mobile:mobile/>
  </url>
  
  <url>
    <loc>${escapeXml(`${request.nextUrl.protocol}//${request.nextUrl.host}`)}/products</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
    <mobile:mobile/>
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
