import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url") || "/sitemap.xml";

    let xmlContent: string;

    // Generate sitemap content directly instead of HTTP fetch to avoid network issues
    if (url === "/sitemap.xml") {
      try {
        xmlContent = await generateSitemapContent();
      } catch (generateError) {
        return NextResponse.json({
          success: false,
          data: {
            isValid: false,
            errors: [
              `Failed to generate sitemap content: ${generateError.message}`,
              "This could be due to database issues or configuration problems",
            ],
            warnings: [
              "Check SEO settings and database connectivity",
              "Verify that required tables exist",
            ],
            stats: {
              size: 0,
              lines: 0,
              urls: 0,
              images: 0,
            },
            generateError: generateError.message,
          },
        });
      }
    } else {
      // For other URLs, try HTTP fetch
      const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`;
      try {
        const response = await fetch(`${baseUrl}${url}`, {
          method: "GET",
          headers: {
            "User-Agent": "XML-Validator/1.0",
            Accept: "application/xml, text/xml, */*",
          },
          signal: AbortSignal.timeout(10000), // 10 second timeout
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        xmlContent = await response.text();

        if (!xmlContent || xmlContent.trim().length === 0) {
          throw new Error("Empty XML content received");
        }
      } catch (fetchError) {
        return NextResponse.json({
          success: false,
          data: {
            isValid: false,
            errors: [
              `Failed to fetch XML from ${url}: ${fetchError.message}`,
              "This could be due to network issues, incorrect URL, or server errors",
            ],
            warnings: [
              "Try accessing the URL directly in your browser to verify it works",
              "Check if the route is properly configured",
            ],
            stats: {
              size: 0,
              lines: 0,
              urls: 0,
              images: 0,
            },
            fetchError: fetchError.message,
          },
        });
      }
    }

    // Basic XML validation checks
    const validationResults = {
      isValid: true,
      errors: [] as string[],
      warnings: [] as string[],
      stats: {
        size: xmlContent.length,
        lines: xmlContent.split("\n").length,
        urls: (xmlContent.match(/<url>/g) || []).length,
        images: (xmlContent.match(/<image:image>/g) || []).length,
      },
    };

    // Check for XML declaration
    if (!xmlContent.startsWith("<?xml")) {
      validationResults.errors.push("Missing XML declaration");
      validationResults.isValid = false;
    }

    // Check for basic XML structure
    if (!xmlContent.includes("<urlset") || !xmlContent.includes("</urlset>")) {
      validationResults.errors.push(
        "Invalid XML structure - missing urlset tags",
      );
      validationResults.isValid = false;
    }

    // Check for unescaped entities
    const unescapedPatterns = [
      {
        pattern: /&(?!amp;|lt;|gt;|quot;|apos;)/g,
        name: "Unescaped ampersand",
      },
      { pattern: /<(?![/]?[\w:]+[^<>]*>)/g, name: "Unescaped less-than" },
    ];

    for (const check of unescapedPatterns) {
      const matches = xmlContent.match(check.pattern);
      if (matches) {
        validationResults.errors.push(
          `${check.name} found (${matches.length} occurrences)`,
        );
        validationResults.isValid = false;
      }
    }

    // Check for balanced tags
    const openTags = (xmlContent.match(/<url>/g) || []).length;
    const closeTags = (xmlContent.match(/<\/url>/g) || []).length;
    if (openTags !== closeTags) {
      validationResults.errors.push(
        `Unbalanced <url> tags: ${openTags} open, ${closeTags} close`,
      );
      validationResults.isValid = false;
    }

    // Performance warnings
    if (validationResults.stats.urls > 50000) {
      validationResults.warnings.push(
        "Large sitemap - consider splitting into multiple sitemaps",
      );
    }

    if (validationResults.stats.size > 50 * 1024 * 1024) {
      // 50MB
      validationResults.warnings.push(
        "Sitemap file is very large - consider compression",
      );
    }

    // Check for required elements
    if (!xmlContent.includes("<loc>")) {
      validationResults.errors.push("No <loc> elements found");
      validationResults.isValid = false;
    }

    return NextResponse.json({
      success: true,
      data: {
        ...validationResults,
        validationDate: new Date().toISOString(),
        testedUrl:
          url === "/sitemap.xml"
            ? "Generated internally"
            : `${request.nextUrl.protocol}//${request.nextUrl.host}${url}`,
        contentPreview:
          xmlContent.substring(0, 200) + (xmlContent.length > 200 ? "..." : ""),
      },
    });
  } catch (error) {
    console.error("XML validation failed:", error);
    return NextResponse.json(
      {
        success: false,
        message: "XML validation failed",
        error: error.message,
        data: {
          isValid: false,
          errors: [error.message],
          warnings: ["Validation process encountered an unexpected error"],
          stats: {
            size: 0,
            lines: 0,
            urls: 0,
            images: 0,
          },
        },
      },
      { status: 500 },
    );
  }
}

// Helper function to generate sitemap content directly
async function generateSitemapContent(): Promise<string> {
  // Get base URL from settings
  const baseUrlResult = await executeQuery(`
    SELECT setting_value FROM seo_settings 
    WHERE setting_key = 'site_url' AND is_active = 1
  `);

  const baseUrl =
    Array.isArray(baseUrlResult) && baseUrlResult.length > 0
      ? baseUrlResult[0].setting_value
      : "https://hacom.vn";

  // Get sitemap settings
  const sitemapSettings = await executeQuery(`
    SELECT setting_key, setting_value FROM seo_settings 
    WHERE setting_key IN ('sitemap_include_images', 'sitemap_max_urls')
    AND is_active = 1
  `);

  let includeImages = false;
  let maxUrls = 50000;

  if (Array.isArray(sitemapSettings)) {
    sitemapSettings.forEach((setting: any) => {
      if (setting.setting_key === "sitemap_include_images") {
        includeImages = setting.setting_value === "1";
      } else if (setting.setting_key === "sitemap_max_urls") {
        maxUrls = parseInt(setting.setting_value) || 50000;
      }
    });
  }

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"`;

  if (includeImages) {
    xml += ` xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"`;
  }

  xml += `>
`;

  // Homepage
  xml += `  <url>
    <loc>${escapeXml(baseUrl)}</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
`;

  // Static pages
  const staticPages = [
    { path: "/products", priority: "0.9", changefreq: "daily" },
    { path: "/login", priority: "0.3", changefreq: "monthly" },
    { path: "/register", priority: "0.3", changefreq: "monthly" },
  ];

  staticPages.forEach((page) => {
    xml += `  <url>
    <loc>${escapeXml(baseUrl)}${escapeXml(page.path)}</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
  });

  // Categories
  const categories = await executeQuery(`
    SELECT slug, updated_at 
    FROM categories 
    WHERE is_active = 1 
    ORDER BY sort_order, name
    LIMIT 100
  `);

  if (Array.isArray(categories)) {
    categories.forEach((category: any) => {
      const lastmod = category.updated_at
        ? new Date(category.updated_at).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];

      xml += `  <url>
    <loc>${escapeXml(baseUrl)}/category/${escapeXml(category.slug)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
    });
  }

  // Products
  const products = await executeQuery(
    `
    SELECT id, slug, updated_at, images, name
    FROM products 
    WHERE status = 'active'
    ORDER BY updated_at DESC
    LIMIT ?
  `,
    [maxUrls - 100 - staticPages.length - 1],
  );

  if (Array.isArray(products)) {
    products.forEach((product: any) => {
      const lastmod = product.updated_at
        ? new Date(product.updated_at).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];

      xml += `  <url>
    <loc>${escapeXml(baseUrl)}/products/${product.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>`;

      // Add product images if enabled
      if (includeImages && product.images) {
        try {
          const images = JSON.parse(product.images);
          if (Array.isArray(images) && images.length > 0) {
            images.slice(0, 5).forEach((imageUrl) => {
              const fullImageUrl = imageUrl.startsWith("http")
                ? imageUrl
                : `${baseUrl}${imageUrl}`;

              xml += `
    <image:image>
      <image:loc>${escapeXml(fullImageUrl)}</image:loc>
      <image:title>${escapeXml(product.name || "")}</image:title>
      <image:caption>${escapeXml((product.name || "") + " - HACOM")}</image:caption>
    </image:image>`;
            });
          }
        } catch (e) {
          // Invalid JSON, skip images
        }
      }

      xml += `
  </url>
`;
    });
  }

  xml += `</urlset>`;
  return xml;
}

function escapeXml(unsafe: string): string {
  if (!unsafe) return "";

  return unsafe
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
