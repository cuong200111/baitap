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

    console.log("🌍 All-sitemap.xml: Generating custom sitemap...");
    console.log(
      "🔗 API URL:",
      `${process.env.NEXT_PUBLIC_API_DOMAIN || "http://localhost:4000"}/api/custom-sitemaps`,
    );

    // Fetch custom sitemaps from backend API
    const customSitemapsRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_DOMAIN || "http://localhost:4000"}/api/custom-sitemaps`,
    );

    console.log("📡 Backend response status:", customSitemapsRes.status);

    let customSitemaps: any[] = [];

    // Parse custom sitemaps
    if (customSitemapsRes?.ok) {
      const customSitemapsData = await customSitemapsRes.json();
      console.log("📦 Backend response data:", customSitemapsData);

      if (
        customSitemapsData.success &&
        Array.isArray(customSitemapsData.data)
      ) {
        customSitemaps = customSitemapsData.data;
        console.log("✅ Found custom sitemaps:", customSitemaps.length);
      } else {
        console.log(
          "❌ Backend response not success or data not array:",
          customSitemapsData,
        );
      }
    } else {
      console.log("❌ Backend response not ok:", customSitemapsRes.status);
      try {
        const errorData = await customSitemapsRes.text();
        console.log("❌ Error response:", errorData);
      } catch (e) {
        console.log("❌ Could not read error response");
      }
    }

    // Generate XML sitemap for custom URLs
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0">
  <!-- Custom Pages Sitemap - Generated on ${new Date().toISOString()} -->
  <!-- HACOM E-commerce Custom URLs -->
`;

    // Add debug comment in XML
    xml += `  <!-- Debug: Found ${customSitemaps.length} custom sitemaps -->\n`;

    // Custom sitemap entries
    customSitemaps.forEach((sitemap) => {
      const lastmod = sitemap.last_modified
        ? new Date(sitemap.last_modified).toISOString()
        : sitemap.updated_at
          ? new Date(sitemap.updated_at).toISOString()
          : new Date().toISOString();

      // Priority is always 0.2 for custom sitemaps as requested
      const priority = "0.2";

      xml += `  <url>
    <loc>${escapeXml(sitemap.url)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${sitemap.changefreq || "monthly"}</changefreq>
    <priority>${priority}</priority>`;

      // Add mobile if enabled
      if (sitemap.mobile_friendly) {
        xml += `
    <mobile:mobile/>`;
      }

      // Add image if available
      if (sitemap.image_url) {
        xml += `
    <image:image>
      <image:loc>${escapeXml(sitemap.image_url)}</image:loc>
      <image:title>${escapeXml(sitemap.image_title || sitemap.title || "")}</image:title>
      <image:caption>${escapeXml(sitemap.image_caption || sitemap.description || "")}</image:caption>
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
    console.error("Failed to generate custom sitemap:", error);

    // Fallback sitemap
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Custom Sitemap Fallback - ${new Date().toISOString()} -->
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
