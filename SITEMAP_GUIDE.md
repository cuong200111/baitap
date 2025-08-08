# Hướng dẫn Sitemap tự động với next-sitemap

## ✅ Đã rút gọn toàn bộ

- 🗑️ Đã xóa toàn bộ các folder sitemap cũ: `app/sitemap.xml`, `app/robots.txt`, etc.
- 🗑️ Đã xóa các routes backend: `sitemap.js`, `robots.js`, `custom-sitemaps.js`
- 🗑️ Đã xóa components: `CustomSitemapManager`, `TestSitemapForm`
- 🗑️ Đã xóa admin functions: `generateSitemap()`, `generateRobots()`
- 🔧 Đã tối ưu `next-sitemap.config.js` 
- 🎯 Chỉ giữ API: `/api/products` + `/api/categories`

## 🚀 Cách build sitemap

```bash
# Build tự động (khuyên dùng)
npm run build

# Hoặc tạo riêng
npm run generate-sitemap
```

## 📁 Kết quả

Files tự động tạo trong `public/`:
- `sitemap.xml` - Sitemap chính
- `sitemap-0.xml` - Products + Categories
- `robots.txt` - File robots.txt

## 🌐 Kiểm tra

```
http://localhost:3000/sitemap.xml
http://localhost:3000/robots.txt
```

## ⚙️ Cấu hình tối ưu

File `next-sitemap.config.js` đã được tối ưu:
- ✅ Lấy dữ liệu từ 2 API: products + categories
- ✅ Priority: Homepage (1.0) > Products (0.8) > Categories (0.7)
- ✅ Loại trừ: admin, api, test pages
- ✅ Robots.txt tự động

## 🔧 Environment Variables

```env
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

---
**✨ Code đã được rút gọn tối đa, chỉ giữ lại những gì cần thiết cho sitemap tự động!**
