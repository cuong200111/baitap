import express from "express";
import { executeQuery } from "../database/connection.js";

const router = express.Router();

// Sitemap Index - For large websites with multiple sitemaps
router.get("/sitemapindex.xml", async (req, res) => {
  try {
    // Get base URL from settings
    const baseUrlResult = await executeQuery(`
      SELECT setting_value FROM seo_settings 
      WHERE setting_key = 'site_url' AND is_active = 1
    `);

    const baseUrl =
      Array.isArray(baseUrlResult) && baseUrlResult.length > 0
        ? baseUrlResult[0].setting_value
        : "https://hacom.vn";

    // Generate sitemap index XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Generated automatically on ${new Date().toISOString()} -->
  <!-- HACOM E-commerce Sitemap Index -->
  
  <sitemap>
    <loc>${baseUrl}/sitemap.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
  
  <sitemap>
    <loc>${baseUrl}/sitemap-products.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
  
  <sitemap>
    <loc>${baseUrl}/sitemap-categories.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
  
  <sitemap>
    <loc>${baseUrl}/sitemap-images.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
  
  <sitemap>
    <loc>${baseUrl}/sitemap-news.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
  
</sitemapindex>`;

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.setHeader("Last-Modified", new Date().toUTCString());
    res.send(xml);

  } catch (error) {
    console.error("Failed to generate sitemap index:", error);
    
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://hacom.vn/sitemap.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
</sitemapindex>`;

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(fallbackXml);
  }
});

// Products sitemap - For better organization
router.get("/sitemap-products.xml", async (req, res) => {
  try {
    const baseUrlResult = await executeQuery(`
      SELECT setting_value FROM seo_settings 
      WHERE setting_key = 'site_url' AND is_active = 1
    `);

    const baseUrl =
      Array.isArray(baseUrlResult) && baseUrlResult.length > 0
        ? baseUrlResult[0].setting_value
        : "https://hacom.vn";

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`;

    // Get active products with images
    const products = await executeQuery(`
      SELECT p.id, p.name, p.short_description, p.images, p.updated_at,
             c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'active' AND p.stock_quantity > 0
      ORDER BY p.updated_at DESC
      LIMIT 25000
    `);

    if (Array.isArray(products)) {
      products.forEach((product) => {
        const lastmod = product.updated_at
          ? new Date(product.updated_at).toISOString()
          : new Date().toISOString();

        xml += `  <url>
    <loc>${baseUrl}/products/${product.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>`;

        // Add product images
        if (product.images) {
          try {
            const images = JSON.parse(product.images);
            if (Array.isArray(images)) {
              images.slice(0, 5).forEach((imageUrl) => {
                const fullImageUrl = imageUrl.startsWith("http")
                  ? imageUrl
                  : `${baseUrl}${imageUrl}`;
                xml += `
    <image:image>
      <image:loc>${fullImageUrl}</image:loc>
      <image:title>${product.name} - ${product.category_name || 'HACOM'}</image:title>
      <image:caption>${product.short_description || product.name}</image:caption>
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

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=7200");
    res.send(xml);

  } catch (error) {
    console.error("Failed to generate products sitemap:", error);
    res.status(500).send("Failed to generate products sitemap");
  }
});

// Categories sitemap
router.get("/sitemap-categories.xml", async (req, res) => {
  try {
    const baseUrlResult = await executeQuery(`
      SELECT setting_value FROM seo_settings 
      WHERE setting_key = 'site_url' AND is_active = 1
    `);

    const baseUrl =
      Array.isArray(baseUrlResult) && baseUrlResult.length > 0
        ? baseUrlResult[0].setting_value
        : "https://hacom.vn";

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`;

    const categories = await executeQuery(`
      SELECT slug, name, description, image, updated_at
      FROM categories 
      WHERE is_active = 1 
      ORDER BY sort_order, name
    `);

    if (Array.isArray(categories)) {
      categories.forEach((category) => {
        const lastmod = category.updated_at
          ? new Date(category.updated_at).toISOString()
          : new Date().toISOString();

        xml += `  <url>
    <loc>${baseUrl}/category/${category.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>`;

        if (category.image) {
          const imageUrl = category.image.startsWith("http") 
            ? category.image 
            : `${baseUrl}${category.image}`;
          xml += `
    <image:image>
      <image:loc>${imageUrl}</image:loc>
      <image:title>${category.name}</image:title>
      <image:caption>${category.description || category.name} - HACOM</image:caption>
    </image:image>`;
        }

        xml += `
  </url>
`;
      });
    }

    xml += `</urlset>`;

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(xml);

  } catch (error) {
    console.error("Failed to generate categories sitemap:", error);
    res.status(500).send("Failed to generate categories sitemap");
  }
});

export default router;
