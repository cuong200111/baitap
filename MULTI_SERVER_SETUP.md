# 🚀 Chạy 2 Frontend + 1 Backend cùng lúc

## ✅ Đã cấu hình sẵn các scripts:

### 1. Chạy 1 Frontend + Backend (hiện tại):

```bash
npm run dev
```

- Frontend: http://localhost:8080
- Backend: http://localhost:4000

### 2. Chạy 2 Frontend + Backend:

```bash
npm run dev:dual
```

- Frontend 1: http://localhost:8080
- Frontend 2: http://localhost:3000
- Backend: http://localhost:4000

## 🔧 Cách khác để chạy thủ công:

### Terminal 1 - Backend:

```bash
npm run backend:dev
# Chạy trên http://localhost:4000
```

### Terminal 2 - Frontend 1:

```bash
npx next dev -p 8080
# Chạy trên http://localhost:8080
```

### Terminal 3 - Frontend 2:

```bash
npx next dev -p 3000
# Chạy trên http://localhost:3000
```

## 🌐 Kết quả:

| Service     | URL                   | Mô tả                             |
| ----------- | --------------------- | --------------------------------- |
| Backend API | http://localhost:4000 | Express server với tất cả APIs    |
| Frontend 1  | http://localhost:8080 | Main development instance         |
| Frontend 2  | http://localhost:3000 | Secondary instance (testing/demo) |

## 💡 Lợi ích của việc chạy 2 Frontend:

1. **Testing**: Test trên nhiều instances khác nhau
2. **Demo**: Một instance cho development, một cho demo
3. **Debugging**: So sánh behavior giữa các versions
4. **Multi-user**: Nhiều developer có thể test cùng lúc

## 🔧 Cấu hình Domain cho 2 Frontend:

Cả 2 frontend instances đều sẽ gọi đến cùng 1 backend:

- Domain = `http://localhost:4000`
- Tất cả API calls từ cả 2 frontends đều point đến backend này

## ⚡ Khởi động nhanh:

Chạy lệnh này để start cả 3 services:

```bash
npm run dev:dual
```

**Output sẽ hiển thị:**

- [0] Frontend 1 starting on 8080...
- [1] Frontend 2 starting on 3000...
- [2] Backend starting on 4000...

## 🎯 Use Cases phổ biến:

### Development + Testing:

- Port 8080: Development environment
- Port 3000: Testing environment
- Port 4000: Shared backend API

### Demo + Live:

- Port 8080: Live demo cho khách hàng
- Port 3000: Internal testing
- Port 4000: Production API

Cả 2 frontend sẽ dùng chung backend nên data sẽ consistent!
