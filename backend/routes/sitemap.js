import express from "express";
import { executeQuery } from "../database/connection.js";

const router = express.Router();

// Escape XML special chars
function escapeXml(unsafe) {
  if (!unsafe) return "";
  return unsafe
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

router.get("/sitemap.xml", async (req, res) => {
  try {
    // 1. Lấy base URL từ seo_settings
    const baseUrlResult = await executeQuery(`
      SELECT setting_value FROM seo_settings
      WHERE setting_key = 'site_url' AND is_active = 1
    `);

    const baseUrl =
      Array.isArray(baseUrlResult) && baseUrlResult.length > 0
        ? baseUrlResult[0].setting_value
        : "https://hacom.vn";

    // 2. Lấy config sitemap với nhiều options hơn
    const sitemapSettings = await executeQuery(`
      SELECT setting_key, setting_value FROM seo_settings
      WHERE setting_key IN ('sitemap_include_images', 'sitemap_include_videos', 'sitemap_max_urls', 'enable_sitemap')
      AND is_active = 1
    `);

    let includeImages = true;
    let includeVideos = true;
    let maxUrls = 50000;
    let enableSitemap = true;

    if (Array.isArray(sitemapSettings)) {
      sitemapSettings.forEach((setting) => {
        if (setting.setting_key === "sitemap_include_images") {
          includeImages = setting.setting_value !== "0";
        } else if (setting.setting_key === "sitemap_include_videos") {
          includeVideos = setting.setting_value !== "0";
        } else if (setting.setting_key === "sitemap_max_urls") {
          maxUrls = parseInt(setting.setting_value) || 50000;
        } else if (setting.setting_key === "enable_sitemap") {
          enableSitemap = setting.setting_value !== "0";
        }
      });
    }

    if (!enableSitemap) {
      return res.status(404).send("Sitemap is disabled");
    }

    // 3. Tạo XML với tất cả namespaces cần thiết
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"`;

    if (includeImages) {
      xml += ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"';
    }
    if (includeVideos) {
      xml += ' xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"';
    }

    xml += ' xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"';
    xml += ' xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"';
    xml += ">\n";

    xml += `<!-- Generated automatically on ${new Date().toISOString()} -->
<!-- Optimized for maximum SEO performance -->
<!-- Total URLs: Will be calculated dynamically -->
`;

    // Trang chủ với mobile optimization
    xml += `  <url>
    <loc>${escapeXml(baseUrl)}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <mobile:mobile/>
  </url>
`;

    // Trang tĩnh quan trọng cho SEO
    const staticPages = [
      { path: "/products", priority: "0.9", changefreq: "daily", mobile: true },
      { path: "/category", priority: "0.8", changefreq: "daily", mobile: true },
      { path: "/about", priority: "0.6", changefreq: "monthly", mobile: true },
      {
        path: "/contact",
        priority: "0.6",
        changefreq: "monthly",
        mobile: true,
      },
      {
        path: "/privacy",
        priority: "0.4",
        changefreq: "yearly",
        mobile: false,
      },
      { path: "/terms", priority: "0.4", changefreq: "yearly", mobile: false },
      {
        path: "/shipping",
        priority: "0.5",
        changefreq: "monthly",
        mobile: true,
      },
      {
        path: "/warranty",
        priority: "0.5",
        changefreq: "monthly",
        mobile: true,
      },
      { path: "/support", priority: "0.6", changefreq: "weekly", mobile: true },
    ];

    staticPages.forEach((page) => {
      xml += `  <url>
    <loc>${escapeXml(baseUrl)}${escapeXml(page.path)}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>`;

      if (page.mobile) {
        xml += `
    <mobile:mobile/>`;
      }

      xml += `
  </url>
`;
    });

    // 4. Categories với thông tin chi tiết
    const categories = await executeQuery(`
      SELECT slug, name, description, updated_at, image, parent_id
      FROM categories
      WHERE is_active = 1
      ORDER BY sort_order, name
      LIMIT 100
    `);

    if (Array.isArray(categories)) {
      categories.forEach((category) => {
        const lastmod = category.updated_at
          ? new Date(category.updated_at).toISOString()
          : new Date().toISOString();

        // Priority cao hơn cho category gốc (không có parent)
        const priority = category.parent_id ? "0.7" : "0.8";

        xml += `  <url>
    <loc>${escapeXml(baseUrl)}/category/${escapeXml(category.slug)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
    <mobile:mobile/>`;

        // Thêm image nếu có và includeImages = true
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
    }

    // 5. Products với thông tin đầy đủ
    const products = await executeQuery(
      `
      SELECT p.id, p.slug, p.name, p.short_description, p.price, p.sale_price,
             p.images, p.videos, p.updated_at, p.featured, p.view_count,
             c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'active' AND p.stock_quantity > 0
      ORDER BY p.featured DESC, p.view_count DESC, p.updated_at DESC
      LIMIT ?
    `,
      [maxUrls - 150 - staticPages.length - 1],
    );

    if (Array.isArray(products)) {
      products.forEach((product) => {
        const lastmod = product.updated_at
          ? new Date(product.updated_at).toISOString()
          : new Date().toISOString();

        // Priority cao hơn cho featured products
        const priority = product.featured ? "0.8" : "0.7";

        // Change frequency dựa trên view count
        const changefreq = product.view_count > 100 ? "daily" : "weekly";

        xml += `  <url>
    <loc>${escapeXml(baseUrl)}/products/${product.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
    <mobile:mobile/>`;

        // Include images với thông tin chi tiết
        if (includeImages && product.images) {
          try {
            const images = JSON.parse(product.images);
            if (Array.isArray(images)) {
              images.slice(0, 10).forEach((imageUrl, index) => {
                const fullImageUrl = imageUrl.startsWith("http")
                  ? imageUrl
                  : `${baseUrl}${imageUrl}`;

                const imageTitle =
                  index === 0
                    ? `${product.name} - ${product.category_name || "HACOM"}`
                    : `${product.name} - Hình ${index + 1}`;

                xml += `
    <image:image>
      <image:loc>${escapeXml(fullImageUrl)}</image:loc>
      <image:title>${escapeXml(imageTitle)}</image:title>
      <image:caption>${escapeXml(product.short_description || product.name || "")}</image:caption>
      <image:geo_location>Vietnam</image:geo_location>
      <image:license>${escapeXml(baseUrl)}/terms</image:license>
    </image:image>`;
              });
            }
          } catch (e) {
            // ignore invalid JSON
          }
        }

        // Include videos nếu có
        if (includeVideos && product.videos) {
          try {
            const videos = JSON.parse(product.videos);
            if (Array.isArray(videos)) {
              videos.slice(0, 3).forEach((videoUrl) => {
                const fullVideoUrl = videoUrl.startsWith("http")
                  ? videoUrl
                  : `${baseUrl}${videoUrl}`;

                xml += `
    <video:video>
      <video:thumbnail_loc>${escapeXml(product.images ? JSON.parse(product.images)[0] : "")}</video:thumbnail_loc>
      <video:title>${escapeXml(product.name + " - Video Review")}</video:title>
      <video:description>${escapeXml(product.short_description || product.name || "")}</video:description>
      <video:content_loc>${escapeXml(fullVideoUrl)}</video:content_loc>
      <video:duration>120</video:duration>
      <video:publication_date>${lastmod}</video:publication_date>
      <video:family_friendly>yes</video:family_friendly>
      <video:live>no</video:live>
    </video:video>`;
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
    }

    xml += `</urlset>`;

    // Log sitemap generation to analytics
    try {
      await executeQuery(
        `INSERT INTO seo_analytics (url_path, date, page_views, created_at)
         VALUES ('sitemap_generation', CURDATE(), 1, NOW())
         ON DUPLICATE KEY UPDATE
         page_views = page_views + 1`,
      );
    } catch (logError) {
      console.log("Analytics logging failed:", logError.message);
    }

    // Count total URLs for optimization
    const urlCount = (xml.match(/<url>/g) || []).length;
    console.log(`Sitemap generated with ${urlCount} URLs`);

    // Set optimal headers for SEO
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=7200");
    res.setHeader("Expires", new Date(Date.now() + 3600000).toUTCString());
    res.setHeader("Last-Modified", new Date().toUTCString());
    res.setHeader("X-Robots-Tag", "noindex, nofollow");
    res.setHeader("Vary", "Accept-Encoding");

    res.send(xml);
  } catch (error) {
    console.error("Failed to generate sitemap:", error);

    // Enhanced fallback XML with essential pages
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0">
  <!-- Fallback sitemap - ${new Date().toISOString()} -->

  <url>
    <loc>https://hacom.vn</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <mobile:mobile/>
  </url>

  <url>
    <loc>https://hacom.vn/products</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
    <mobile:mobile/>
  </url>

  <url>
    <loc>https://hacom.vn/category</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <mobile:mobile/>
  </url>
</urlset>`;

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=1800");
    res.setHeader("X-Robots-Tag", "noindex, nofollow");
    res.send(fallbackXml);
  }
});

export default router;
