# Hướng dẫn Triển khai Production - HACOM E-commerce

## Tổng quan

Hướng dẫn này sẽ giúp bạn build và triển khai ứng dụng Next.js HACOM E-commerce để chạy trên cùng server với backend API, sử dụng cùng một port.

## Kiến trúc Production

- **Frontend**: Next.js static export hoặc standalone build
- **Backend**: Express.js server (trong thư mục `backend/`)
- **Database**: MySQL
- **Port**: Chung một port (ví dụ: 3000 hoặc 8080)

## Bước 1: Chuẩn bị Backend Server

### 1.1 Cấu hình Backend để phục vụ Frontend

Mở file `backend/server.js` và thêm cấu hình để phục vụ static files:

```javascript
const express = require("express");
const path = require("path");
const app = express();

// Existing middleware...
app.use(cors());
app.use(express.json());

// Serve static files from Next.js build
app.use(express.static(path.join(__dirname, "dist")));

// API routes
app.use("/api" /* your existing API routes */);

// Catch-all handler: send back React's index.html file for SPA routing
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist/index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## Bước 2: Cấu hình Next.js cho Production

### 2.1 Cập nhật next.config.js

Tạo hoặc cập nhật `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cấu hình cho static export
  output: "export",
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  distDir: "dist",

  // Hoặc sử dụng standalone mode
  // output: 'standalone',

  // API URL configuration
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NODE_ENV === "production"
        ? "https://yourdomain.com"
        : "http://localhost:8080",
  },

  // Image optimization for static export
  images: {
    unoptimized: true,
  },

  // Disable server-side features for static export
  assetPrefix: process.env.NODE_ENV === "production" ? "" : "",
};

module.exports = nextConfig;
```

### 2.2 Cập nhật config.ts

Cập nhật file `config.ts` để s��� dụng đúng API URL:

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const API_ENDPOINTS = {
  auth: `${API_BASE_URL}/api/auth`,
  products: `${API_BASE_URL}/api/products`,
  categories: `${API_BASE_URL}/api/categories`,
  // ... other endpoints
};
```

## Bước 3: Build và Deploy

### 3.1 Build Next.js Application

```bash
# Cài đặt dependencies
npm install

# Build cho production
npm run build

# Kiểm tra build output
ls -la dist/
```

### 3.2 Copy files tới Backend

```bash
# Tạo thư mục dist trong backend (nếu chưa có)
mkdir -p backend/dist

# Copy toàn bộ build output vào backend
cp -r dist/* backend/dist/

# Hoặc sử dụng rsync để sync
rsync -av --delete dist/ backend/dist/
```

### 3.3 Script tự động (tuỳ chọn)

Tạo script `deploy.sh`:

```bash
#!/bin/bash

echo "🚀 Starting deployment process..."

# Build Next.js
echo "📦 Building Next.js application..."
npm run build

# Copy to backend
echo "📁 Copying files to backend..."
rm -rf backend/dist/*
cp -r dist/* backend/dist/

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install --production

echo "✅ Deployment completed!"
echo "💡 Run 'cd backend && npm start' to start the production server"
```

Làm cho script có thể thực thi:

```bash
chmod +x deploy.sh
```

## Bước 4: Chạy Production Server

### 4.1 Khởi động Server

```bash
cd backend
npm start
```

### 4.2 Kiểm tra

- Truy cập `http://localhost:3000` để xem frontend
- API endpoints: `http://localhost:3000/api/*`

## Bước 5: Cấu hình Environment Variables

### 5.1 Tạo file .env trong backend

```env
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=hacom_ecommerce
JWT_SECRET=your_jwt_secret_key
UPLOAD_PATH=/path/to/uploads
```

### 5.2 Cấu hình Database

Đảm bảo database MySQL đã được setup và có data:

```bash
cd backend
npm run db:migrate
```

## Bước 6: Tối ưu cho Production

### 6.1 PM2 Process Manager

Cài đặt PM2 để quản lý process:

```bash
npm install -g pm2
```

Tạo file `ecosystem.config.js` trong thư mục backend:

```javascript
module.exports = {
  apps: [
    {
      name: "hacom-ecommerce",
      script: "server.js",
      cwd: "./backend",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
```

Khởi động với PM2:

```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### 6.2 Nginx Reverse Proxy (tuỳ chọn)

Cấu hình Nginx để proxy requests:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Bước 7: Monitoring và Logs

### 7.1 Xem logs với PM2

```bash
# Xem logs realtime
pm2 logs hacom-ecommerce

# Xem logs lỗi
pm2 logs hacom-ecommerce --err

# Restart app
pm2 restart hacom-ecommerce
```

### 7.2 Health Check

Tạo endpoint health check trong backend:

```javascript
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});
```

## Troubleshooting

### Lỗi thường gặp:

1. **404 khi refresh trang**: Đảm bảo catch-all route `app.get('*', ...)` được cấu hình đúng
2. **API không hoạt động**: Kiểm tra API_BASE_URL trong config.ts
3. **Static files không load**: Kiểm tra `express.static` middleware
4. **Database connection**: Kiểm tra environment variables và database credentials

### Kiểm tra build:

```bash
# Kiểm tra Next.js build output
npm run build

# Test local production build
npx serve dist -p 3001
```

## Lưu ý quan trọng

1. **Security**: Đảm bảo remove tất cả debug endpoints và logging trong production
2. **Environment**: Sử dụng process.env.NODE_ENV === 'production' để phân biệt môi trường
3. **Database**: Backup database trước khi deploy
4. **SSL**: Sử dụng HTTPS trong production với Nginx hoặc Load Balancer
5. **Performance**: Enable gzip compression và caching headers

## Automation Script

Script hoàn chỉnh cho deployment:

```bash
#!/bin/bash
set -e

echo "🚀 HACOM E-commerce Production Deployment"
echo "========================================"

# Build frontend
echo "📦 Building frontend..."
npm run build

# Prepare backend
echo "📁 Preparing backend..."
rm -rf backend/dist
mkdir -p backend/dist
cp -r dist/* backend/dist/

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend && npm install --production && cd ..

# Start/Restart with PM2
echo "🔄 Starting production server..."
cd backend
pm2 restart hacom-ecommerce || pm2 start ecosystem.config.js --env production

echo "✅ Deployment completed successfully!"
echo "🌐 Application is now running on production"
echo "📊 Check status: pm2 status"
echo "📝 View logs: pm2 logs hacom-ecommerce"
```

Để chạy deployment:

```bash
chmod +x deploy.sh
./deploy.sh
```
