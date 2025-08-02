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

    // Fetch categories from backend API
    const categoriesRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_DOMAIN || "http://localhost:4000"}/api/categories`,
    );

    let categories: any[] = [];

    // Parse categories
    if (categoriesRes?.ok) {
      const categoriesData = await categoriesRes.json();
      if (categoriesData.success && Array.isArray(categoriesData.data)) {
        categories = categoriesData.data;
      }
    }

    // Generate XML sitemap for categories
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0">
  <!-- Categories Sitemap - Generated on ${new Date().toISOString()} -->
  <!-- HACOM E-commerce Categories -->
`;

    // Categories
    categories.forEach((category) => {
      const lastmod = category.updated_at
        ? new Date(category.updated_at).toISOString()
        : new Date().toISOString();

      xml += `  <url>
    <loc>${escapeXml(baseUrl)}/category/${escapeXml(category.slug)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
    <mobile:mobile/>`;

      // Add category image if available
      if (category.image) {
        const imageUrl = category.image.startsWith("http")
          ? category.image
          : `${baseUrl}${category.image}`;
        xml += `
    <image:image>
      <image:loc>${escapeXml(imageUrl)}</image:loc>
      <image:title>${escapeXml(category.name || "")}</image:title>
      <image:caption>${escapeXml((category.description || category.name || "") + " - HACOM")}</image:caption>
    </image:image>`;
      }

      xml += `
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
    console.error("Failed to generate categories sitemap:", error);

    // Fallback sitemap
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Categories Sitemap Fallback - ${new Date().toISOString()} -->
  <url>
    <loc>${escapeXml(`${request.nextUrl.protocol}//${request.nextUrl.host}`)}/category</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
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
