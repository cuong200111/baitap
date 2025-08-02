# Buy Now vs Add to Cart Implementation

## Overview
This implementation creates two completely separate flows for purchasing products:

1. **Add to Cart** - Adds products to the user's shopping cart for later checkout
2. **Buy Now** - Creates a direct purchase flow that bypasses the cart entirely

## Key Features

### 🛒 Add to Cart Flow
- Uses existing `cartApi.addToCart()` function
- Stores items in `cart_items` database table
- Supports session-based (guest) and user-based carts
- Items persist until user goes to `/checkout` and completes purchase
- Multiple items can be added and managed

### ⚡ Buy Now Flow  
- Uses new `buyNowApi.createBuyNowSession()` function
- **Does NOT store anything in cart_items table**
- Creates temporary session data stored in localStorage
- Single product direct purchase only
- Redirects to separate `/buy-now-checkout` page
- Completely independent from cart system

## Technical Implementation

### Backend Changes

#### New API Endpoint: `/api/buy-now`
```javascript
POST /api/buy-now
{
  "product_id": 1,
  "quantity": 2,
  "session_id": "session_xyz" // or user_id for authenticated users
}
```

**Response:**
```javascript
{
  "success": true,
  "data": {
    "buy_now_session_id": "buynow_1234567890_abc123",
    "item": {
      "product_id": 1,
      "product_name": "Product Name",
      "quantity": 2,
      "final_price": 100000,
      "total_price": 200000,
      // ... other product details
    },
    "summary": {
      "item_count": 2,
      "subtotal": 200000,
      "shipping_fee": 0,
      "total": 200000
    }
  }
}
```

### Frontend Changes

#### New API Client: `lib/buy-now-api.ts`
- `buyNowApi.createBuyNowSession()` - Creates buy now session
- `buyNowApi.getBuyNowSession()` - Retrieves session from localStorage  
- `buyNowApi.clearBuyNowSession()` - Cleans up after purchase

#### New Checkout Page: `/buy-now-checkout`
- Dedicated checkout page for buy now purchases
- Loads product data from localStorage session
- Same customer info form as regular checkout
- Auto-fills user address for authenticated users
- Creates order with single item only

#### Updated Product Page
- **Add to Cart button**: Uses `cartApi.addToCart()` → redirects to `/cart`
- **Buy Now button**: Uses `buyNowApi.createBuyNowSession()` → redirects to `/buy-now-checkout`
- Separate loading states for each action
- Both buttons are completely independent

## Flow Comparison

### Add to Cart Flow
```
Product Page → Click "Add to Cart" → cartApi.addToCart() → 
Cart Page → View/Edit Items → Click "Checkout" → /checkout → Place Order
```

### Buy Now Flow  
```
Product Page → Click "Buy Now" → buyNowApi.createBuyNowSession() → 
/buy-now-checkout → Place Order (single item only)
```

## Data Storage

### Cart System
- **Database**: `cart_items` table
- **Persistence**: Until user completes checkout or manually clears
- **Scope**: Multiple products, can be edited
- **Session**: Tied to user_id or session_id

### Buy Now System
- **Storage**: Browser localStorage only
- **Persistence**: Until purchase completion or page refresh
- **Scope**: Single product purchase only
- **Session**: Temporary buy_now_session_id

## Benefits

1. **Clear Separation**: No contamination between cart and direct purchase
2. **User Experience**: 
   - "Add to Cart" for browsing/comparing multiple items
   - "Buy Now" for immediate single-item purchases
3. **Performance**: Buy now doesn't require database operations for cart management
4. **Flexibility**: Each flow can be optimized independently
5. **Data Integrity**: Cart contents remain unchanged during buy now purchases

## Security Considerations

- Buy now sessions are temporary and stored client-side only
- Stock validation happens on backend during buy now session creation
- Same authentication and validation as regular checkout
- No sensitive data stored in localStorage (only product details)

## Testing

Use the test script `test-buy-now-flow.js` to verify:
- Buy now creates separate session ✅
- Cart remains independent ✅  
- Add to Cart still works ✅

```bash
node test-buy-now-flow.js
```

## User Interface Indicators

- **Buy Now checkout page** shows orange alert: "Bạn đang mua ngay sản phẩm..."
- **Regular checkout page** shows cart items from database
- Different page titles and breadcrumbs
- Different button colors (orange for buy now, red for cart)
