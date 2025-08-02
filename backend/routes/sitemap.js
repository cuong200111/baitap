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
    xml += '>\n';

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
      { path: "/contact", priority: "0.6", changefreq: "monthly", mobile: true },
      { path: "/privacy", priority: "0.4", changefreq: "yearly", mobile: false },
      { path: "/terms", priority: "0.4", changefreq: "yearly", mobile: false },
      { path: "/shipping", priority: "0.5", changefreq: "monthly", mobile: true },
      { path: "/warranty", priority: "0.5", changefreq: "monthly", mobile: true },
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

    // 5. Products
    const products = await executeQuery(
      `
      SELECT id, slug, updated_at, images, name
      FROM products 
      WHERE status = 'active'
      ORDER BY updated_at DESC
      LIMIT ?
    `,
      [maxUrls - 100 - staticPages.length - 1]
    );

    if (Array.isArray(products)) {
      products.forEach((product) => {
        const lastmod = product.updated_at
          ? new Date(product.updated_at).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0];

        xml += `  <url>
    <loc>${escapeXml(baseUrl)}/products/${product.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>`;

        // Include images nếu có
        if (includeImages && product.images) {
          try {
            const images = JSON.parse(product.images);
            if (Array.isArray(images)) {
              images.slice(0, 5).forEach((imageUrl) => {
                const fullImageUrl = imageUrl.startsWith("http")
                  ? imageUrl
                  : `${baseUrl}${imageUrl}`;
                xml += `
    <image:image>
      <image:loc>${escapeXml(fullImageUrl)}</image:loc>
      <image:title>${escapeXml(product.name || "")}</image:title>
      <image:caption>${escapeXml(
        (product.name || "") + " - HACOM"
      )}</image:caption>
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
    }

    xml += `</urlset>`;

    res.setHeader("Content-Type", "application/xml");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(xml);
  } catch (error) {
    console.error("Failed to generate sitemap:", error);

    // fallback XML
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://hacom.vn</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;

    res.setHeader("Content-Type", "application/xml");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(fallbackXml);
  }
});

export default router;
