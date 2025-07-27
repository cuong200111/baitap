import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

interface SitemapUrl {
  url: string;
  lastmod: string;
  changefreq: string;
  priority: string;
  images?: Array<{
    url: string;
    title?: string;
    caption?: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const urls: SitemapUrl[] = [];

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
      WHERE setting_key IN ('sitemap_include_images', 'sitemap_include_videos', 'sitemap_max_urls')
      AND is_active = 1
    `);

    const settings: any = {};
    if (Array.isArray(sitemapSettings)) {
      sitemapSettings.forEach((setting: any) => {
        settings[setting.setting_key] = setting.setting_value;
      });
    }

    const includeImages = settings.sitemap_include_images === "1";
    const maxUrls = parseInt(settings.sitemap_max_urls) || 50000;

    // 1. Homepage
    urls.push({
      url: baseUrl,
      lastmod: new Date().toISOString().split("T")[0],
      changefreq: "daily",
      priority: "1.0",
    });

    // 2. Static pages
    const staticPages = [
      { path: "/products", priority: "0.9", changefreq: "daily" },
      { path: "/cart", priority: "0.3", changefreq: "weekly" },
      { path: "/login", priority: "0.3", changefreq: "monthly" },
      { path: "/register", priority: "0.3", changefreq: "monthly" },
      { path: "/profile", priority: "0.4", changefreq: "weekly" },
      { path: "/orders", priority: "0.4", changefreq: "weekly" },
      { path: "/checkout", priority: "0.5", changefreq: "weekly" },
    ];

    staticPages.forEach((page) => {
      urls.push({
        url: `${baseUrl}${page.path}`,
        lastmod: new Date().toISOString().split("T")[0],
        changefreq: page.changefreq,
        priority: page.priority,
      });
    });

    // 3. Categories
    const categories = await executeQuery(`
      SELECT slug, updated_at 
      FROM categories 
      WHERE is_active = 1 
      ORDER BY sort_order, name
    `);

    if (Array.isArray(categories)) {
      categories.forEach((category: any) => {
        urls.push({
          url: `${baseUrl}/category/${category.slug}`,
          lastmod: category.updated_at
            ? category.updated_at.split("T")[0]
            : new Date().toISOString().split("T")[0],
          changefreq: "weekly",
          priority: "0.8",
        });
      });
    }

    // 4. Products with images
    const products = await executeQuery(
      `
      SELECT id, slug, updated_at, images, name
      FROM products 
      WHERE status = 'active'
      ORDER BY updated_at DESC
      LIMIT ?
    `,
      [maxUrls - urls.length],
    );

    if (Array.isArray(products)) {
      products.forEach((product: any) => {
        const productUrl: SitemapUrl = {
          url: `${baseUrl}/products/${product.id}`,
          lastmod: product.updated_at
            ? product.updated_at.split("T")[0]
            : new Date().toISOString().split("T")[0],
          changefreq: "weekly",
          priority: "0.7",
        };

        // Add product images if enabled
        if (includeImages && product.images) {
          try {
            const images = JSON.parse(product.images);
            if (Array.isArray(images) && images.length > 0) {
              productUrl.images = images.slice(0, 10).map((img) => ({
                url: img.startsWith("http") ? img : `${baseUrl}${img}`,
                title: product.name,
                caption: `${product.name} - HACOM`,
              }));
            }
          } catch (e) {
            // Invalid JSON, skip images
          }
        }

        urls.push(productUrl);
      });
    }

    // Generate XML sitemap
    let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"`;

    if (includeImages) {
      sitemapXml += ` xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"`;
    }

    sitemapXml += `>
`;

    urls.forEach((url) => {
      sitemapXml += `  <url>
    <loc>${url.url}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>`;

      // Add images if present
      if (url.images && url.images.length > 0) {
        url.images.forEach((image) => {
          sitemapXml += `
    <image:image>
      <image:loc>${image.url}</image:loc>`;
          if (image.title) {
            sitemapXml += `
      <image:title>${escapeXml(image.title)}</image:title>`;
          }
          if (image.caption) {
            sitemapXml += `
      <image:caption>${escapeXml(image.caption)}</image:caption>`;
          }
          sitemapXml += `
    </image:image>`;
        });
      }

      sitemapXml += `
  </url>
`;
    });

    sitemapXml += `</urlset>`;

    // Create backup in uploads directory for reference (don't write to public to avoid conflicts)
    const publicDir = join(process.cwd(), "public");
    const uploadsDir = join(publicDir, "uploads");
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true });
    }

    // Save backup for reference
    const backupPath = join(uploadsDir, `sitemap-backup-${Date.now()}.xml`);
    writeFileSync(backupPath, sitemapXml, "utf8");

    // Generate sitemap index backup if needed (for large sites)
    if (urls.length >= maxUrls * 0.8) {
      const sitemapIndexXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemap.xml</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
  </sitemap>
</sitemapindex>`;

      const indexBackupPath = join(
        uploadsDir,
        `sitemap-index-backup-${Date.now()}.xml`,
      );
      writeFileSync(indexBackupPath, sitemapIndexXml, "utf8");
    }

    // Store sitemap generation info in database
    await executeQuery(
      `
      INSERT OR REPLACE INTO seo_analytics (url_path, date, page_views)
      VALUES ('sitemap_generation', DATE('now'), ?)
    `,
      [urls.length],
    );

    return NextResponse.json({
      success: true,
      message: "Sitemap generated successfully",
      urlCount: urls.length,
      sitemapUrl: `${baseUrl}/sitemap.xml`,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to generate sitemap:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to generate sitemap",
        error: error.message,
      },
      { status: 500 },
    );
  }
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return c;
    }
  });
}
