# Stock Management Implementation

## Overview

This implementation provides comprehensive stock management for both cart and buy now flows, including automatic stock deduction on successful orders, cart validation with auto-cleanup, and detailed error handling.

## Features Implemented

### 🔄 **Order Stock Deduction**

- **Automatic Stock Subtraction**: When orders are successfully created, stock quantities are automatically reduced
- **Transaction Safety**: Stock updates happen within database transactions to prevent race conditions
- **Stock Restoration**: When orders are cancelled, stock is automatically restored

### 🛒 **Cart Auto-Validation**

- **Real-time Stock Check**: Every time cart is loaded, stock levels are validated
- **Auto-Removal**: Items with insufficient stock are automatically removed from cart
- **User Notification**: Frontend shows notifications when items are auto-removed
- **Detailed Logging**: Backend logs which items were removed and why

### ⚡ **Enhanced Stock Validation**

- **Add to Cart**: Comprehensive validation with detailed error messages
- **Buy Now**: Same validation as add to cart for consistency
- **Stock Status Indicators**: Clear status codes (out_of_stock, insufficient_stock, cart_limit_reached)

## Technical Implementation

### Backend Changes

#### 1. Cart Controller (`backend/controllers/cartController.js`)

**Auto-removal logic in `getCart()`:**

```javascript
// Check stock and remove items that exceed available stock
const itemsToRemove = [];
const validItems = [];

for (const item of cartItems) {
  const availableStock = Math.max(0, parseInt(item.stock_quantity) || 0);
  const requestedQuantity = parseInt(item.quantity) || 0;

  if (requestedQuantity > availableStock) {
    itemsToRemove.push({
      cart_id: item.id,
      product_name: item.product_name,
      requested: requestedQuantity,
      available: availableStock,
    });
  } else {
    validItems.push(item);
  }
}

// Remove items with insufficient stock
if (itemsToRemove.length > 0) {
  for (const item of itemsToRemove) {
    await executeQuery("DELETE FROM cart_items WHERE id = ?", [item.cart_id]);
  }
}
```

**Enhanced validation in `addToCart()`:**

```javascript
// Check if product is out of stock
if (availableStock === 0) {
  return res.status(400).json({
    success: false,
    message: `Sản phẩm "${product.name}" hiện đã hết hàng.`,
    stock_status: "out_of_stock",
    available_stock: 0,
  });
}

// Check if requested quantity exceeds available stock
if (requestedQuantity > availableStock) {
  return res.status(400).json({
    success: false,
    message: `Không đủ số lượng trong kho. Còn lại: ${availableStock}, Yêu cầu: ${requestedQuantity}`,
    stock_status: "insufficient_stock",
    available_stock: availableStock,
    requested_quantity: requestedQuantity,
  });
}
```

#### 2. Buy Now Routes (`backend/routes/buy-now.js`)

**Same validation logic as cart:**

```javascript
// Check if product is out of stock
if (availableStock === 0) {
  return res.status(400).json({
    success: false,
    message: `Sản phẩm "${product.name}" hiện đã hết hàng.`,
    stock_status: "out_of_stock",
    available_stock: 0,
  });
}
```

#### 3. Order Routes (`backend/routes/orders.js`)

**Stock deduction (already implemented):**

```javascript
// Update stock if managed
if (product.manage_stock) {
  await executeQuery(
    "UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?",
    [item.quantity, product.id],
  );
}
```

**Stock restoration on cancellation:**

```javascript
// Restore stock
const orderItems = await executeQuery(
  "SELECT product_id, quantity FROM order_items WHERE order_id = ?",
  [id],
);

for (const item of orderItems) {
  await executeQuery(
    "UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ? AND manage_stock = true",
    [item.quantity, item.product_id],
  );
}
```

### Frontend Changes

#### 1. Enhanced API Interfaces

**CartResponse with removed items:**

```typescript
export interface CartResponse {
  success: boolean;
  message?: string;
  data?: {
    items: CartItem[];
    summary: CartSummary;
  };
  removed_items?: Array<{
    cart_id: number;
    product_name: string;
    requested: number;
    available: number;
  }>;
}
```

**Stock status indicators:**

```typescript
export interface CartActionResponse {
  success: boolean;
  message?: string;
  stock_status?: "out_of_stock" | "insufficient_stock" | "cart_limit_reached";
  available_stock?: number;
  requested_quantity?: number;
}
```

#### 2. User Notifications

**Cart page (`app/cart/page.tsx`):**

```typescript
// Show notification if items were removed due to insufficient stock
if (result.removed_items && result.removed_items.length > 0) {
  const removedNames = result.removed_items
    .map((item) => item.product_name)
    .join(", ");
  toast.warning(
    `Đã tự động xóa khỏi giỏ hàng: ${removedNames} (không đủ số lượng trong kho)`,
  );
}
```

**Cart popup component:**

```typescript
// Same notification logic for cart popup
if (result.removed_items && result.removed_items.length > 0) {
  const removedNames = result.removed_items
    .map((item) => item.product_name)
    .join(", ");
  toast.warning(
    `Đã tự động xóa khỏi giỏ hàng: ${removedNames} (không đủ số lượng trong kho)`,
  );
}
```

## Error Messages & User Experience

### Vietnamese Error Messages

- **Out of Stock**: `Sản phẩm "[tên sản phẩm]" hiện đã hết hàng.`
- **Insufficient Stock**: `Không đủ số lượng trong kho. Còn lại: [số], Yêu cầu: [số]`
- **Cart Limit Reached**: `Không thể thêm thêm sản phẩm. Bạn đã có [số] trong giỏ hàng và kho chỉ còn [số] sản phẩm.`
- **Auto-Removal**: `Đã tự động xóa khỏi giỏ hàng: [tên sản phẩm] (không đủ số lượng trong kho)`

### Stock Status Codes

- `out_of_stock`: Product has 0 stock
- `insufficient_stock`: Requested quantity > available stock
- `cart_limit_reached`: Cannot add more due to cart + request > stock

## User Flow Examples

### Scenario 1: User adds product to cart, stock becomes insufficient later

1. User adds 5 items to cart (stock = 10)
2. Other customers buy, stock reduces to 3
3. User visits cart page
4. System auto-removes the cart item (5 > 3)
5. User sees notification: "Đã tự động xóa khỏi giỏ hàng: [sản phẩm] (không đủ số lượng trong kho)"

### Scenario 2: User tries to add too many items

1. User tries to add 100 items (stock = 5)
2. System returns error: "Không đủ số lượng trong kho. Còn lại: 5, Yêu cầu: 100"
3. Frontend shows error message with stock info

### Scenario 3: Successful order reduces stock

1. User places order for 3 items (stock = 10)
2. Order is created successfully
3. Stock automatically reduces to 7
4. Next customer sees updated stock levels

## Testing

Run the test script to verify functionality:

```bash
node test-stock-management.js
```

**Test Coverage:**

- ✅ Stock validation for add to cart
- ✅ Stock validation for buy now
- ✅ Excessive quantity rejection
- ✅ Cart auto-cleanup functionality
- ✅ Detailed error messages with stock status
- ✅ Order stock deduction
- ✅ Order cancellation stock restoration

## Database Considerations

### Stock Management Column

Products table should have:

- `stock_quantity`: Current available stock
- `manage_stock`: Boolean to enable/disable stock management

### Transaction Safety

All stock operations use database transactions to prevent:

- Race conditions
- Overselling
- Data inconsistency

## Benefits

1. **Prevents Overselling**: Comprehensive validation prevents customers from ordering more than available
2. **Real-time Accuracy**: Cart automatically reflects current stock levels
3. **Better UX**: Clear error messages and automatic cleanup
4. **Data Integrity**: Transaction-safe stock operations
5. **Consistent Behavior**: Same validation logic across cart and buy now flows
6. **Vietnamese Localization**: All messages in Vietnamese for better user experience

## Future Enhancements

1. **Reserved Stock**: Temporarily reserve stock when items are in cart
2. **Low Stock Warnings**: Alert when stock is running low
3. **Backorder Support**: Allow orders when out of stock with delivery estimates
4. **Bulk Stock Updates**: Admin interface for mass stock updates
5. **Stock History**: Track stock changes over time
