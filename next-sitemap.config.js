/** @type {import('next-sitemap').IConfig} */

// Cấu hình URL API và domain
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// Hàm lấy các URL động từ API
async function getDynamicUrls() {
  try {
    console.log("🔄 Fetching dynamic URLs for sitemap...");

    // Lấy danh sách sản phẩm
    const productsResponse = await fetch(`${API_URL}/api/products`);
    const productsData = await productsResponse.json();

    // Lấy danh sách danh mục
    const categoriesResponse = await fetch(`${API_URL}/api/categories`);
    const categoriesData = await categoriesResponse.json();

    const urls = [];

    // Thêm URLs cho sản phẩm
    if (productsData.success && productsData.data) {
      const products = Array.isArray(productsData.data)
        ? productsData.data
        : productsData.data.products || [];

      products.forEach((product) => {
        if (product.id) {
          urls.push(`/products/${product.id}`);
        }
      });
    }

    // Thêm URLs cho danh mục
    if (categoriesData.success && categoriesData.data) {
      const categories = Array.isArray(categoriesData.data)
        ? categoriesData.data
        : [];

      categories.forEach((category) => {
        if (category.slug) {
          urls.push(`/category/${category.slug}`);
        }
      });
    }

    console.log(`✅ Found ${urls.length} dynamic URLs`);
    return urls;
  } catch (error) {
    console.error("❌ Error fetching dynamic URLs:", error);
    return [];
  }
}

module.exports = {
  siteUrl: SITE_URL,
  generateRobotsTxt: true,
  sitemapSize: 7000,
  changefreq: "daily",
  priority: 0.7,

  // Các trang tĩnh được tạo tự động
  exclude: ["/admin/*", "/api/*", "/test-*", "/setup-admin", "/_next/*"],

  // Cấu hình robots.txt
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/test-*", "/setup-admin", "/_next/"],
      },
    ],
    additionalSitemaps: [`${SITE_URL}/sitemap.xml`],
  },

  // Thêm các URL động
  additionalPaths: async (config) => {
    const dynamicUrls = await getDynamicUrls();

    return dynamicUrls.map((url) => ({
      loc: url,
      changefreq: "daily",
      priority: url.includes("/products/") ? 0.8 : 0.7,
      lastmod: new Date().toISOString(),
    }));
  },

  // Transform function để tùy chỉnh từng URL
  transform: async (config, path) => {
    // Tăng priority cho các trang quan trọng
    let priority = config.priority;
    let changefreq = config.changefreq;

    if (path === "/") {
      priority = 1.0;
      changefreq = "daily";
    } else if (path.includes("/products/")) {
      priority = 0.8;
      changefreq = "weekly";
    } else if (path.includes("/category/")) {
      priority = 0.7;
      changefreq = "weekly";
    } else if (path.includes("/orders") || path.includes("/profile")) {
      return null; // Loại trừ các trang cần đăng nhập
    }

    return {
      loc: path,
      changefreq,
      priority,
      lastmod: new Date().toISOString(),
    };
  },
};
