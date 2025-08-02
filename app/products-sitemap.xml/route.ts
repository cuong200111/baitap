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

    // Get API URL with fallback
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.NEXT_PUBLIC_API_DOMAIN ||
      "http://localhost:4000";
    console.log("🔗 Fetching products from:", `${apiUrl}/api/products`);

    // Fetch products from backend API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const productsRes = await fetch(`${apiUrl}/api/products`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    let products: any[] = [];

    // Parse products
    if (productsRes?.ok) {
      const productsData = await productsRes.json();
      console.log("📦 Products API response:", {
        success: productsData.success,
        count: productsData.data?.products?.length,
      });

      if (productsData.success && Array.isArray(productsData.data?.products)) {
        products = productsData.data.products;
        console.log(`✅ Found ${products.length} products for sitemap`);
      } else {
        console.log("❌ Invalid products data structure:", productsData);
      }
    } else {
      console.log(
        `❌ Products API failed: ${productsRes.status} ${productsRes.statusText}`,
      );
      const errorText = await productsRes.text();
      console.log("❌ Error response:", errorText);
    }

    // Generate XML sitemap for products
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0">
  <!-- Products Sitemap - Generated on ${new Date().toISOString()} -->
  <!-- HACOM E-commerce Products -->
`;

    // Products
    products.forEach((product) => {
      const lastmod = product.updated_at
        ? new Date(product.updated_at).toISOString()
        : new Date().toISOString();

      const priority = product.featured ? "1.0" : "1.0"; // All products priority 1.0 as requested

      xml += `  <url>
    <loc>${escapeXml(baseUrl)}/products/${product.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
    <mobile:mobile/>`;

      // Add product images if available
      if (product.images) {
        try {
          const images = JSON.parse(product.images);
          if (Array.isArray(images)) {
            images.slice(0, 5).forEach((imageUrl: string, index: number) => {
              const fullImageUrl = imageUrl.startsWith("http")
                ? imageUrl
                : `${baseUrl}${imageUrl}`;

              const imageTitle =
                index === 0
                  ? `${product.name} - HACOM`
                  : `${product.name} - Hình ${index + 1}`;

              xml += `
    <image:image>
      <image:loc>${escapeXml(fullImageUrl)}</image:loc>
      <image:title>${escapeXml(imageTitle)}</image:title>
      <image:caption>${escapeXml(product.short_description || product.name || "")}</image:caption>
      <image:geo_location>Vietnam</image:geo_location>
    </image:image>`;
            });
          }
        } catch (e) {
          // ignore invalid JSON
        }
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
    console.error("Failed to generate products sitemap:", error);

    // Fallback sitemap
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Products Sitemap Fallback - ${new Date().toISOString()} -->
  <url>
    <loc>${escapeXml(`${request.nextUrl.protocol}//${request.nextUrl.host}`)}/products</loc>
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
