# Checkout Address Auto-Fill Feature

## 📋 Feature Overview

Checkout page hiện tại đã được cập nhật để tự động điền địa chỉ từ profile người dùng khi họ đã đăng nhập và có địa chỉ đã lưu trong database.

## 🔄 Flow Hoạt Động

### 1. Guest Users (Không đăng nhập)

- ✅ Form checkout hoàn toàn trống
- ✅ User phải nhập thủ công tất cả thông tin
- ✅ Option để lưu thông tin cho lần mua tiếp theo (localStorage)

### 2. Authenticated Users - Không có địa chỉ đã lưu

- ✅ Form auto-fill: name, email, phone từ user profile
- ✅ Các field địa chỉ vẫn trống, cần nhập thủ công
- ✅ Không hiển thị notification về address loading

### 3. Authenticated Users - Có địa chỉ đã lưu

- ✅ Form auto-fill: name, email, phone từ user profile
- ✅ **Form auto-fill: address, city, district, ward từ customer_addresses table**
- ✅ **Hiển thị green notification: "Địa chỉ đã được tự động điền từ thông tin trong hồ sơ"**
- ✅ User có thể edit các field đã auto-fill nếu cần

## 🛠 Technical Implementation

### Backend API

```
GET /api/addresses
Headers: Authorization: Bearer {token}
Response: {
  success: true,
  data: [
    {
      id: 1,
      user_id: 123,
      full_name: "Nguyen Van A",
      phone: "0123456789",
      address_line_1: "123 Main St",
      city: "Ho Chi Minh",
      district: "District 1",
      ward: "Ward 1",
      is_default: true
    }
  ]
}
```

### Frontend Logic

```typescript
// Auto-trigger when user becomes available
useEffect(() => {
  if (isAuthenticated && user) {
    loadUserAddress(); // 🔄 Load from API
  }
}, [isAuthenticated, user]);

// Load address from customer_addresses table
const loadUserAddress = async () => {
  const response = await fetch("/api/addresses", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.ok && data.data?.length > 0) {
    const address = data.data[0]; // Use first/default address
    setCustomerInfo((prev) => ({
      ...prev,
      address: address.address_line_1,
      city: address.city,
      district: address.district,
      ward: address.ward,
    }));
    setAddressLoadedFromProfile(true); // Show notification
  }
};
```

## 🎯 User Experience

### Visual Indicators

- **Green Alert**: Hiển thị khi address được auto-load
- **Form Fields**: Auto-filled với data từ database
- **Toast Notification**: "Địa chỉ đã được tải từ hồ sơ của bạn"

### Console Debugging

- `📍 Loading user address from API...`
- `📍 Address API response status: 200`
- `📍 Using address: {address_object}`
- `✅ Successfully loaded and applied user address`

## 🧪 Testing Instructions

### Manual Testing

1. **Setup**: Đăng nhập và thêm địa chỉ ở `/profile`
2. **Add to Cart**: Thêm sản phẩm vào giỏ hàng
3. **Checkout**: Truy cập `/checkout`
4. **Verify**: Check address fields được auto-fill
5. **Check**: Green notification hiển thị

### Debug Mode

- Mở Console để xem debug logs
- Verify API calls đến `/api/addresses`
- Check response data structure

## 📊 Database Schema

### customer_addresses Table

```sql
CREATE TABLE customer_addresses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type ENUM('billing','shipping') DEFAULT 'shipping',
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address_line_1 VARCHAR(255) NOT NULL,
  address_line_2 VARCHAR(255),
  ward VARCHAR(100),
  district VARCHAR(100),
  city VARCHAR(100),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## 🔐 Security & Performance

### Authentication

- ✅ Requires valid JWT token
- ✅ User can only access their own addresses
- ✅ Proper error handling for unauthorized access

### Performance

- ✅ API call chỉ trigger khi user authenticated
- ✅ Caching trong component state
- ✅ Graceful fallback khi API fails

### Privacy

- ✅ Guest users không bị track addresses
- ✅ Address data chỉ load cho owner
- ✅ Secure token-based authentication

## 🚀 Future Enhancements

### Potential Improvements

- [ ] Multiple address selection (if user has multiple saved addresses)
- [ ] Quick edit address trong checkout page
- [ ] Remember last used address for checkout
- [ ] Address validation với external API
- [ ] Auto-complete address search

### Current Limitations

- Chỉ sử dụng address đầu tiên/default trong list
- Không hỗ trợ multiple shipping addresses trong 1 order
- Address format chưa validate với postal codes

---

**✅ Feature Status: IMPLEMENTED & READY FOR TESTING**
