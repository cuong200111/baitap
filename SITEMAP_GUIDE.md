# Hướng dẫn tạo Sitemap động với next-sitemap

## ✅ Đã hoàn thành

- 🗑️ Đã xóa toàn bộ các folder và file sitemap/robots.txt cũ
- 🗑️ Đã xóa các routes backend sitemap không cần thiết
- 🗑️ Đã xóa các component test và admin functions
- 🔧 Đã tối ưu hóa next-sitemap.config.js
- 📦 Đã cài đặt package next-sitemap
- 🎯 Chỉ giữ lại API `/api/products` và `/api/categories` cần thiết

## 🚀 Cách sử dụng

### 1. Tạo sitemap thủ công

```bash
npm run generate-sitemap
```

### 2. Tạo sitemap khi build

```bash
npm run build  # Sitemap sẽ được tạo tự động sau khi build
```

### 3. Kiểm tra sitemap

Sau khi tạo, truy cập:

- `http://localhost:3000/sitemap.xml` - Sitemap chính
- `http://localhost:3000/robots.txt` - File robots.txt

## 📁 Files được tạo

next-sitemap sẽ tạo các file sau trong thư mục `public/`:

- `sitemap.xml` - Sitemap chính
- `sitemap-0.xml` - Sitemap con (nếu có nhiều URL)
- `robots.txt` - File robots.txt

## ⚙️ Cấu hình

File `next-sitemap.config.js` đã được cấu hình để:

### Lấy dữ liệu động

- ✅ Sản phẩm từ `/api/products`
- ✅ Danh mục từ `/api/categories`

### Thiết lập priority

- Trang chủ: 1.0 (cao nhất)
- Sản phẩm: 0.8
- Danh mục: 0.7
- Các trang khác: 0.7

### Loại trừ trang

- `/admin/*` - Trang quản trị
- `/api/*` - API endpoints
- `/test-*` - Trang test
- `/_next/*` - Next.js internals
- `/orders`, `/profile` - Trang cần đăng nhập

## 🔧 Tùy chỉnh

### Thêm URL tĩnh

Chỉnh sửa `next-sitemap.config.js`:

```javascript
additionalPaths: async (config) => {
  return [
    {
      loc: "/about",
      changefreq: "monthly",
      priority: 0.8,
    },
  ];
};
```

### Thay đổi frequency

```javascript
changefreq: 'weekly', // daily, weekly, monthly, yearly
```

### Cập nhật priority

```javascript
priority: 0.9, // 0.0 to 1.0
```

## 🌐 Environment Variables

Đặt trong `.env.local`:

```
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

## 📊 Monitoring

Sitemap sẽ bao gồm:

- Tất cả trang tĩnh
- Tất cả sản phẩm (dynamic)
- T��t cả danh mục (dynamic)
- Lastmod timestamp tự động
- Proper changefreq cho từng loại trang

## 🚨 Lưu ý

1. **API phải chạy**: Backend API cần chạy khi build để lấy dữ liệu động
2. **Build production**: `npm run build` sẽ tự động tạo sitemap
3. **No admin functions**: Không còn chức năng test trong admin panel
4. **SEO friendly**: URLs được tối ưu cho SEO với proper metadata

## 🔍 Troubleshooting

### Sitemap trống

- Kiểm tra backend API có chạy không
- Kiểm tra API response format đúng không

### URLs bị thiếu

- Kiểm tra API endpoint hoạt động
- Kiểm tra data structure trong `getDynamicUrls()`

### Build errors

- Đảm bảo `NEXT_PUBLIC_API_URL` được thiết lập
- Kiểm tra network connectivity với API
