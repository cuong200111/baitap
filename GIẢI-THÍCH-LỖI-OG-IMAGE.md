# 🔍 GIẢI THÍCH LỖI OG:IMAGE - HƯỚNG DẪN FIX

## 🚨 VẤN ĐỀ HIỆN TẠI

**Bạn thấy:** Trang `http://localhost:3000/products/7` có og:image là `http://localhost:4000/uploads/file-1754323204656-522680178.jpg` - nhưng đây không phải ảnh của sản phẩm 7.

**Nguyên nhân:** Backend server (cổng 4000) không chạy!

## 📋 DIỄN GIẢI CHI TIẾT

### 1. **Logic og:image hoạt động như thế nào:**

```
Frontend (Next.js) → Gọi API → Backend (Express) → Database → Trả về dữ liệu sản phẩm
                                    ↓
                                 ❌ KHÔNG CHẠY
                                    ↓
                              Dùng ảnh mặc định
```

### 2. **Quá trình cụ thể:**

**BƯỚC 1:** Khi vào `/products/7`
- File `app/products/[id]/layout.tsx` chạy hàm `generateMetadata()`
- Hàm này gọi `fetch('http://localhost:4000/api/products/7')`

**BƯỚC 2:** Backend không chạy
- API call thất bại với lỗi `ECONNREFUSED`
- Code nhảy vào `catch` block
- Chạy `generateProductMetadata()` với `undefined` image

**BƯỚC 3:** Fallback logic kích hoạt
- Trong `lib/seo-service.ts`, khi không có product image
- Sẽ dùng `settings.social.product_og_image` hoặc `settings.social.default_og_image`
- Đây là ảnh `file-1754323204656-522680178.jpg` bạn đang thấy

## 🔧 CÁCH FIX (TỪNG BƯỚC)

### **BƯỚC 1: Kiểm tra Backend Status**
```bash
# Mở file: check-backend-status.html
# Nếu thấy "❌ Backend KHÔNG chạy!" → Cần khởi động backend
```

### **BƯỚC 2: Khởi động Backend**
```bash
# Mở terminal mới
cd backend

# Cài đặt dependencies (nếu chưa có)
npm install

# Khởi động server
npm start
# hoặc
node server.js
```

### **BƯỚC 3: Xác nhận Backend đã chạy**
Bạn sẽ thấy trong terminal:
```
Server running on port 4000
Connected to MySQL database
```

### **BƯỚC 4: Test lại**
```bash
# Refresh trang: http://localhost:3000/products/7
# og:image giờ sẽ hiển thị ảnh đúng của sản phẩm 7
```

## 🧪 CÁCH KIỂM TRA

### **Test 1: Backend API**
```bash
curl http://localhost:4000/api/products/7
# Nên trả về dữ liệu JSON của sản phẩm 7
```

### **Test 2: og:image tag**
```bash
curl http://localhost:3000/products/7 | grep "og:image"
# Nên thấy ảnh từ localhost:4000/uploads/[ảnh-sản-phẩm-7]
```

### **Test 3: Dùng tool**
- Mở `check-backend-status.html`
- Click "🧪 Test API sản phẩm 7"
- Click "🖼️ Kiểm tra og:image hiện tại"

## ✅ SAU KHI FIX THÀNH CÔNG

**Trước (Backend tắt):**
```html
<meta property="og:image" content="http://localhost:4000/uploads/file-1754323204656-522680178.jpg">
```
↑ *Ảnh từ SEO settings (fallback)*

**Sau (Backend chạy):**
```html
<meta property="og:image" content="http://localhost:4000/uploads/[ảnh-thực-sự-của-sản-phẩm-7].jpg">
```
↑ *Ảnh thực sự từ database sản phẩm 7*

## 📝 TÓM TẮT

1. **Vấn đề:** Backend không chạy → API thất bại → dùng ảnh fallback
2. **Giải pháp:** Khởi động backend → API hoạt động → dùng ảnh thật
3. **Kiểm tra:** Dùng `check-backend-status.html` để test

**💡 LƯU Ý:** Logic og:image đã được code đúng, chỉ cần backend chạy là OK!
