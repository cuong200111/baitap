# Profile Address System - Fixed

## ✅ **Đã Sửa Theo Yêu Cầu**

### 1. **Mặc định nhập địa chỉ thủ công**

- ✅ Profile page giờ mặc định `isManualAddressMode = true`
- ✅ User nhập tên tỉnh/quận/xã bằng tay từ đầu
- ✅ Không load API provinces/districts/wards khi vào trang

### 2. **Checkbox "Chọn vùng miền có sẵn"**

- ✅ Khi **BỎ TÍCH** → chuyển sang API mode, load danh sách từ API Việt Nam
- ✅ Khi **TÍCH LẠI** → quay về manual mode, nhập tay
- ✅ Text rõ ràng: "Bỏ tích để chọn từ danh sách vùng miền Việt Nam"

### 3. **Database chỉ lưu tên (string)**

- ✅ Removed tất cả `province_id`, `district_id`, `ward_id` khỏi logic
- ✅ Chỉ lưu `province_name`, `district_name`, `ward_name` vào database
- ✅ API tự động clear tất cả ID fields = null

### 4. **Sửa lỗi 500 Profile API**

- ✅ Fixed logic update trong `/api/auth/profile/route.ts`
- ✅ Proper handling của name fields
- ✅ Always clear ID fields when updating
- ✅ Better error handling and validation

## **User Experience Flow**

### **Khi mở trang Profile:**

1. **Mặc định**: Manual input mode (checkbox TICKED)
2. **Hiển thị**: 3 input fields để nhập tên tỉnh/quận/xã
3. **Không**: Load API data

### **Khi bỏ tích checkbox:**

1. **Chuyển**: Sang API selection mode
2. **Load**: Danh sách tỉnh từ API Việt Nam
3. **Hiển thị**: 3 dropdown để chọn tỉnh → quận → xã
4. **Lưu**: Tên được chọn vào `addressData`

### **Khi tích lại checkbox:**

1. **Quay về**: Manual input mode
2. **Clear**: API selections
3. **Giữ**: Dữ liệu tên đã nhập

### **Khi Save Profile:**

```javascript
const updateData = {
  full_name: formData.full_name.trim(),
  phone: formData.phone.trim() || null,
  address: formData.address.trim() || null,
  province_name: addressData.province_name.trim() || null,
  district_name: addressData.district_name.trim() || null,
  ward_name: addressData.ward_name.trim() || null,
  // All ID fields automatically set to NULL
};
```

## **Technical Changes**

### **Profile Page (`app/profile/page.tsx`):**

- ✅ Default `isManualAddressMode = true`
- ✅ Single `addressData` state for all address names
- ✅ Separate `selectedProvince/District/Ward` for API mode
- ✅ Clean toggle logic between modes
- ✅ Proper handling of API vs manual data

### **Profile API (`app/api/auth/profile/route.ts`):**

- ✅ Only handle name fields in update logic
- ✅ Always clear ID fields to NULL
- ✅ Better validation and error handling
- ✅ Cleaner update query construction

### **Database Storage:**

```sql
-- Manual Mode Example:
province_name = 'Hà Nội'
district_name = 'Ba Đình'
ward_name = 'Điện Biên'
province_id = NULL
district_id = NULL
ward_id = NULL

-- API Mode Example (same result):
province_name = 'Hà Nội'  -- from API selection
district_name = 'Quận Ba Đình'  -- from API selection
ward_name = 'Phường Điện Biên'  -- from API selection
province_id = NULL  -- always cleared
district_id = NULL  -- always cleared
ward_id = NULL  -- always cleared
```

## **Compatibility**

- ✅ **Vietnamese Locations API**: Still works for API mode
- ✅ **Shipping System**: Can still calculate based on names
- ✅ **Admin Systems**: Unaffected
- ✅ **Existing Data**: Preserved and migrated correctly

## **Error Fixes**

- ✅ **500 Error**: Fixed in profile update API
- ✅ **Validation**: Proper field validation
- ✅ **State Management**: Clean state transitions
- ✅ **Type Safety**: Proper TypeScript types
- ✅ **Error Handling**: Better user feedback

Profile system giờ hoạt động chính xác theo yêu cầu! 🎉
