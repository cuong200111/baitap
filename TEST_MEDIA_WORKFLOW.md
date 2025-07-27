# Test Workflow - Media & Product Images

## Đã thực hiện:

### 1. ✅ Database Setup

- Thêm table `media` vào database schema
- Table có các fields: id, filename, original_name, mime_type, size, url, alt_text, title, entity_type, entity_id, uploaded_by, created_at, updated_at
- Thêm sample media files vào database khi khởi tạo

### 2. ✅ Media API (Backend)

- **GET /api/media**: Lấy danh sách media với pagination, filtering
- **POST /api/media**: Upload ảnh mới, lưu vào database và disk
- **GET /api/media/[id]**: Lấy thông tin chi tiết 1 media file
- **PUT /api/media/[id]**: Cập nhật metadata (alt_text, title)
- **DELETE /api/media/[id]**: Xóa media file khỏi database và disk
- Tất cả API đã được update để sử dụng database thay vì mock data

### 3. ✅ Admin Media Library

- Trang `/admin/media` để quản lý thư viện ảnh
- Upload multiple files cùng lúc
- Preview, edit metadata, delete media files
- Filter theo entity_type
- Search theo tên file
- Grid view với hover actions

### 4. ✅ MediaPicker Component

- Component để chọn ảnh từ thư viện
- Hỗ trợ single/multiple selection
- Quick upload trong modal
- Filter và search
- Preview thumbnails
- Error handling và AbortError protection

### 5. ✅ Product Management - Images

- Tab "Hình ảnh" trong form tạo/sửa sản phẩm
- Integration với MediaPicker
- Multiple image selection
- Drag & reorder images (với buttons)
- Remove individual images
- Clear all images
- Preview với "Ảnh chính" indicator
- Move image left/right trong gallery

### 6. ✅ Product Detail Page - Gallery

- **Basic Gallery**: Ảnh chính + thumbnails grid
- **Navigation**: Arrow buttons để chuyển ảnh
- **Image Counter**: Hiển thị x/y
- **Hover Effects**: Controls show on hover
- **Fullscreen Modal**: Click để xem fullscreen
- **Zoom**: Click để zoom in/out trong fullscreen
- **Keyboard Navigation**:
  - Arrow keys: navigate
  - Escape: close
  - Space: zoom toggle
- **Thumbnail Strip**: Quick selection trong fullscreen

## Test Cases cần thực hiện:

### Admin Workflow:

1. 🔄 **Upload Media**:
   - Vào `/admin/media`
   - Upload multiple images
   - Check database có lưu không
   - Check files có tạo trong `/public/uploads/` không

2. 🔄 **Add Product Images**:
   - Vào `/admin/products`
   - Tạo sản phẩm mới
   - Tab "Hình ảnh" → "Chọn ảnh từ thư viện"
   - Chọn multiple images
   - Reorder images (ảnh đầu tiên = ảnh chính)
   - Save product

3. 🔄 **Edit Product Images**:
   - Edit existing product
   - Add/remove images
   - Reorder images
   - Save changes

### User Workflow:

4. 🔄 **View Product Gallery**:
   - Vào trang chi tiết sản phẩm có nhiều ảnh
   - Click thumbnails để đổi ảnh chính
   - Use arrow buttons
   - Click fullscreen button
   - Test keyboard navigation trong fullscreen
   - Test zoom functionality

### Error Handling:

5. 🔄 **Error Cases**:
   - Upload invalid file types
   - Upload files too large
   - Network interruption
   - Delete media still being used
   - Permission errors

## API Endpoints Summary:

- `GET /api/media?page=1&limit=50&entity_type=product`
- `POST /api/media` (multipart/form-data)
- `PUT /api/media/[id]` (JSON body)
- `DELETE /api/media/[id]`

## Database Schema:

```sql
CREATE TABLE media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size INTEGER NOT NULL,
  url VARCHAR(500) NOT NULL,
  alt_text TEXT,
  title VARCHAR(255),
  entity_type VARCHAR(50) NOT NULL DEFAULT 'general',
  entity_id INTEGER,
  uploaded_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
);
```

## Features Implemented:

- ✅ Database-backed media storage
- ✅ File upload with validation
- ✅ Media library management
- ✅ Product image gallery
- ✅ Fullscreen image viewer
- ✅ Zoom functionality
- ✅ Keyboard navigation
- ✅ Multiple image selection
- ✅ Image reordering
- ✅ Error handling
- ✅ AbortError protection
- ✅ Responsive design
- ✅ Loading states
- ✅ Toast notifications

## Next Steps:

- Test toàn bộ workflow end-to-end
- Fix any bugs discovered during testing
- Optimize performance if needed
- Add image optimization/resizing
- Add bulk operations
- Add image SEO features
