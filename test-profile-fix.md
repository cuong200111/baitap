# Test Profile Address Auto-populate Fix

## Các thay đổi đã thực hiện:

### 1. Backend Changes (backend/routes/auth.js):

#### GET `/api/auth/profile`:
- ✅ Load dữ liệu user từ bảng `users`
- ✅ Load địa chỉ từ bảng `customer_addresses` 
- ✅ Merge dữ liệu và trả về tất cả thông tin

#### PUT `/api/auth/profile`:
- ✅ Update thông tin cơ bản trong bảng `users`
- ✅ UPSERT địa chỉ trong bảng `customer_addresses`
- ✅ Trả về dữ liệu đã merge

### 2. Frontend Changes (app/profile/page.tsx):

#### Load Profile:
- ✅ Gọi API backend (không phải NextJS API)
- ✅ Tự động điền form với dữ liệu từ database
- ✅ Hiển thị cả thông tin cơ bản và địa chỉ

#### Update Profile:
- ✅ Gửi cả thông tin cơ bản và địa chỉ trong 1 request
- ✅ Cập nhật form với dữ liệu trả về
- ✅ Xóa logic saveAddress riêng biệt

### 3. Backend Logic:

```javascript
// GET profile - merge user + address data
const userData = await executeQuery("SELECT * FROM users WHERE id = ?", [userId]);
const addressData = await executeQuery("SELECT * FROM customer_addresses WHERE user_id = ?", [userId]);

// Merge data
const profileData = {
  ...userData[0],
  address: addressData[0]?.address_line_1 || "",
  province_name: addressData[0]?.city || "",
  district_name: addressData[0]?.district || "",
  ward_name: addressData[0]?.ward || "",
};

// PUT profile - update both tables
await executeQuery("UPDATE users SET full_name = ?, phone = ? WHERE id = ?", [full_name, phone, userId]);

// UPSERT address
if (addressExists) {
  await executeQuery("UPDATE customer_addresses SET ... WHERE user_id = ?", [..., userId]);
} else {
  await executeQuery("INSERT INTO customer_addresses ...", [...]);
}
```

## Để test:

1. **Start backend server**:
   ```bash
   cd backend && npm run dev
   ```

2. **Login vào trang profile**: 
   - Nếu đã có dữ liệu địa chỉ → Form sẽ tự động điền
   - Nếu chưa có → Form trống, nhập và save lần đầu

3. **Update thông tin**:
   - Thay đổi thông tin và địa chỉ
   - Click "Lưu thay đổi"
   - Reload trang → Form sẽ hiển thị dữ liệu đã lưu

## Database Schema:

### users table:
- id, email, full_name, phone, role, avatar, created_at

### customer_addresses table:
- id, user_id, full_name, phone, address_line_1, ward, district, city, is_default, created_at, updated_at

## Logic UPSERT:
- ✅ Mỗi user chỉ có 1 address
- ✅ Nếu đã có → UPDATE
- ✅ Nếu chưa có → INSERT
- ✅ Không tạo duplicate records
