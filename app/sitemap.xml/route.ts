
// import { executeQuery } from "@/lib/database";
// import { NextRequest, NextResponse } from "next/server";
// export async function GET(request: NextRequest) {
//   try {
//     // Get base URL from settings
//     const baseUrlResult = await executeQuery(`
//       SELECT setting_value FROM seo_settings 
//       WHERE setting_key = 'site_url' AND is_active = 1
//     `);

//     const baseUrl =
//       Array.isArray(baseUrlResult) && baseUrlResult.length > 0
//         ? baseUrlResult[0].setting_value
//         : "https://hacom.vn";

//     // Get sitemap settings
//     const sitemapSettings = await executeQuery(`
//       SELECT setting_key, setting_value FROM seo_settings 
//       WHERE setting_key IN ('sitemap_include_images', 'sitemap_max_urls')
//       AND is_active = 1
//     `);

//     let includeImages = false;
//     let maxUrls = 50000;

//     if (Array.isArray(sitemapSettings)) {
//       sitemapSettings.forEach((setting: any) => {
//         if (setting.setting_key === "sitemap_include_images") {
//           includeImages = setting.setting_value === "1";
//         } else if (setting.setting_key === "sitemap_max_urls") {
//           maxUrls = parseInt(setting.setting_value) || 50000;
//         }
//       });
//     }

//     let xml = `<?xml version="1.0" encoding="UTF-8"?>
// <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"`;

//     if (includeImages) {
//       xml += ` xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"`;
//     }

//     xml += `>
// `;

//     // Homepage
//     xml += `  <url>
//     <loc>${escapeXml(baseUrl)}</loc>
//     <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
//     <changefreq>daily</changefreq>
//     <priority>1.0</priority>
//   </url>
// `;

//     // Static pages
//     const staticPages = [
//       { path: "/products", priority: "0.9", changefreq: "daily" },
//       { path: "/login", priority: "0.3", changefreq: "monthly" },
//       { path: "/register", priority: "0.3", changefreq: "monthly" },
//     ];

//     staticPages.forEach((page) => {
//       xml += `  <url>
//     <loc>${escapeXml(baseUrl)}${escapeXml(page.path)}</loc>
//     <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
//     <changefreq>${page.changefreq}</changefreq>
//     <priority>${page.priority}</priority>
//   </url>
// `;
//     });

//     // Categories
//     const categories = await executeQuery(`
//       SELECT slug, updated_at 
//       FROM categories 
//       WHERE is_active = 1 
//       ORDER BY sort_order, name
//       LIMIT 100
//     `);

//     if (Array.isArray(categories)) {
//       categories.forEach((category: any) => {
//         const lastmod = category.updated_at
//           ? new Date(category.updated_at).toISOString().split("T")[0]
//           : new Date().toISOString().split("T")[0];

//         xml += `  <url>
//     <loc>${escapeXml(baseUrl)}/category/${escapeXml(category.slug)}</loc>
//     <lastmod>${lastmod}</lastmod>
//     <changefreq>weekly</changefreq>
//     <priority>0.8</priority>
//   </url>
// `;
//       });
//     }

//     // Products
//     const products = await executeQuery(
//       `
//       SELECT id, slug, updated_at, images, name
//       FROM products 
//       WHERE status = 'active'
//       ORDER BY updated_at DESC
//       LIMIT ?
//     `,
//       [maxUrls - 100 - staticPages.length - 1],
//     ); // Reserve space for other URLs

//     if (Array.isArray(products)) {
//       products.forEach((product: any) => {
//         const lastmod = product.updated_at
//           ? new Date(product.updated_at).toISOString().split("T")[0]
//           : new Date().toISOString().split("T")[0];

//         xml += `  <url>
//     <loc>${escapeXml(baseUrl)}/products/${product.id}</loc>
//     <lastmod>${lastmod}</lastmod>
//     <changefreq>weekly</changefreq>
//     <priority>0.7</priority>`;

//         // Add product images if enabled
//         if (includeImages && product.images) {
//           try {
//             const images = JSON.parse(product.images);
//             if (Array.isArray(images) && images.length > 0) {
//               images.slice(0, 5).forEach((imageUrl) => {
//                 // Limit to 5 images per product
//                 const fullImageUrl = imageUrl.startsWith("http")
//                   ? imageUrl
//                   : `${baseUrl}${imageUrl}`;

//                 xml += `
//     <image:image>
//       <image:loc>${escapeXml(fullImageUrl)}</image:loc>
//       <image:title>${escapeXml(product.name || "")}</image:title>
//       <image:caption>${escapeXml((product.name || "") + " - HACOM")}</image:caption>
//     </image:image>`;
//               });
//             }
//           } catch (e) {
//             // Invalid JSON, skip images
//           }
//         }

//         xml += `
//   </url>
// `;
//       });
//     }

//     xml += `</urlset>`;

//     return new NextResponse(xml, {
//       headers: {
//         "Content-Type": "application/xml",
//         "Cache-Control": "public, max-age=3600, s-maxage=3600", // Cache for 1 hour
//       },
//     });
//   } catch (error) {
//     console.error("Failed to generate sitemap:", error);

//     // Return a basic sitemap as fallback
//     const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
// <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
//   <url>
//     <loc>https://hacom.vn</loc>
//     <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
//     <changefreq>daily</changefreq>
//     <priority>1.0</priority>
//   </url>
// </urlset>`;

//     return new NextResponse(fallbackXml, {
//       headers: {
//         "Content-Type": "application/xml",
//         "Cache-Control": "public, max-age=3600",
//       },
//     });
//   }
// }

// function escapeXml(unsafe: string): string {
//   if (!unsafe) return "";

//   return unsafe
//     .toString()
//     .replace(/&/g, "&amp;")
//     .replace(/</g, "&lt;")
//     .replace(/>/g, "&gt;")
//     .replace(/"/g, "&quot;")
//     .replace(/'/g, "&apos;");
// }
export async function GET() {
  const res = await fetch("http://localhost:4000/api/sitemap.xml");
  const xml = await res.text();
  return new Response(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}
