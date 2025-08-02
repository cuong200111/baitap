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

    // Fetch data from backend API
    const [categoriesRes, productsRes, seoSettingsRes] = await Promise.all([
      fetch(
        `${process.env.NEXT_PUBLIC_API_DOMAIN || "http://localhost:4000"}/api/categories`,
      ),
      fetch(
        `${process.env.NEXT_PUBLIC_API_DOMAIN || "http://localhost:4000"}/api/products`,
      ),
      fetch(
        `${process.env.NEXT_PUBLIC_API_DOMAIN || "http://localhost:4000"}/api/admin/seo-settings`,
      ).catch(() => null), // Handle auth errors gracefully
    ]);

    let categories: any[] = [];
    let products: any[] = [];
    let includeImages = true;
    let maxUrls = 50000;

    // Parse categories
    if (categoriesRes?.ok) {
      const categoriesData = await categoriesRes.json();
      if (categoriesData.success && Array.isArray(categoriesData.data)) {
        categories = categoriesData.data.slice(0, 100);
      }
    }

    // Parse products
    if (productsRes?.ok) {
      const productsData = await productsRes.json();
      if (productsData.success && Array.isArray(productsData.data?.products)) {
        products = productsData.data.products.slice(0, maxUrls - 200);
      }
    }

    // Parse SEO settings
    if (seoSettingsRes?.ok) {
      const seoData = await seoSettingsRes.json();
      if (seoData.success && seoData.data) {
        includeImages =
          seoData.data.technical?.sitemap_include_images !== false;
        maxUrls = parseInt(seoData.data.technical?.sitemap_max_urls) || 50000;
      }
    }

    // Generate XML sitemap
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"`;

    if (includeImages) {
      xml += ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"';
    }

    xml +=
      ' xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0">\n';

    xml += `  <!-- Generated automatically on ${new Date().toISOString()} -->
  <!-- HACOM E-commerce Sitemap -->
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

    // Categories
    categories.forEach((category) => {
      const lastmod = category.updated_at
        ? new Date(category.updated_at).toISOString()
        : new Date().toISOString();

      xml += `  <url>
    <loc>${escapeXml(baseUrl)}/category/${escapeXml(category.slug)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <mobile:mobile/>`;

      // Add category image if available
      if (includeImages && category.image) {
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

    // Products
    products.forEach((product) => {
      const lastmod = product.updated_at
        ? new Date(product.updated_at).toISOString()
        : new Date().toISOString();

      const priority = product.featured ? "0.8" : "0.7";

      xml += `  <url>
    <loc>${escapeXml(baseUrl)}/products/${product.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
    <mobile:mobile/>`;

      // Add product images if available
      if (includeImages && product.images) {
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
