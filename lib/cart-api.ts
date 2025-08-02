// Cart API utilities with proper session and user management
import { API_CONFIG } from "./config-client";

export interface CartItem {
  id: number;
  product_id: number;
  product_name: string;
  product_slug: string;
  sku: string;
  price: number;
  sale_price?: number;
  final_price: number;
  quantity: number;
  stock_quantity: number;
  images: string[];
  total_price: number;
  created_at: string;
}

export interface CartSummary {
  item_count: number;
  subtotal: number;
  shipping_fee: number;
  total: number;
}

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

export interface CartActionResponse {
  success: boolean;
  message?: string;
  data?: {
    cart_item_id: number;
    quantity: number;
    action: "added" | "updated";
  };
  stock_status?: "out_of_stock" | "insufficient_stock" | "cart_limit_reached";
  current_in_cart?: number;
  available_stock?: number;
  max_can_add?: number;
  requested_quantity?: number;
}

// Get session ID for guest users
function getSessionId(): string {
  if (typeof window === "undefined") return "";

  let sessionId = localStorage.getItem("session_id");
  if (!sessionId) {
    sessionId =
      "session_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    localStorage.setItem("session_id", sessionId);
  }
  return sessionId;
}

// Get user ID if authenticated
function getUserId(): number | null {
  if (typeof window === "undefined") return null;

  try {
    const token = localStorage.getItem("token");
    if (!token) return null;

    // Decode JWT to get user ID (simple decode, not verification)
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.userId || payload.id || null;
  } catch {
    return null;
  }
}

// Generic API call helper
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  try {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;

    let headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    // Add auth token if available
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        headers = {
          ...headers,
          Authorization: `Bearer ${token}`,
        };
      }
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Cart API Error for ${endpoint}:`, error);
    throw error;
  }
}

export const cartApi = {
  // Get cart contents
  async getCart(): Promise<CartResponse> {
    try {
      const userId = getUserId();
      const sessionId = getSessionId();

      const params = new URLSearchParams();
      if (userId) {
        params.append("user_id", userId.toString());
      } else {
        params.append("session_id", sessionId);
      }

      return await apiCall<CartResponse>(`/api/cart?${params}`);
    } catch (error) {
      return {
        success: false,
        message: "Failed to load cart",
      };
    }
  },

  // Add item to cart
  async addToCart(
    productId: number,
    quantity: number = 1,
  ): Promise<CartActionResponse> {
    try {
      const userId = getUserId();
      const sessionId = getSessionId();

      const body: any = {
        product_id: productId,
        quantity: quantity,
      };

      if (userId) {
        body.user_id = userId;
      } else {
        body.session_id = sessionId;
      }

      return await apiCall<CartActionResponse>("/api/cart", {
        method: "POST",
        body: JSON.stringify(body),
      });
    } catch (error) {
      return {
        success: false,
        message: "Failed to add item to cart",
      };
    }
  },

  // Update cart item quantity
  async updateQuantity(
    cartItemId: number,
    quantity: number,
  ): Promise<CartActionResponse> {
    try {
      return await apiCall<CartActionResponse>(`/api/cart/${cartItemId}`, {
        method: "PUT",
        body: JSON.stringify({ quantity }),
      });
    } catch (error) {
      return {
        success: false,
        message: "Failed to update cart item",
      };
    }
  },

  // Remove item from cart
  async removeItem(
    cartItemId: number,
  ): Promise<{ success: boolean; message?: string }> {
    try {
      return await apiCall<{ success: boolean; message?: string }>(
        `/api/cart/${cartItemId}`,
        {
          method: "DELETE",
        },
      );
    } catch (error) {
      return {
        success: false,
        message: "Failed to remove item from cart",
      };
    }
  },

  // Clear entire cart
  async clearCart(): Promise<{ success: boolean; message?: string }> {
    try {
      const userId = getUserId();
      const sessionId = getSessionId();

      const body: any = {};
      if (userId) {
        body.user_id = userId;
      } else {
        body.session_id = sessionId;
      }

      return await apiCall<{ success: boolean; message?: string }>(
        "/api/cart",
        {
          method: "DELETE",
          body: JSON.stringify(body),
        },
      );
    } catch (error) {
      return {
        success: false,
        message: "Failed to clear cart",
      };
    }
  },

  // Get cart count
  async getCartCount(): Promise<{
    success: boolean;
    data?: { count: number };
    message?: string;
  }> {
    try {
      const userId = getUserId();
      const sessionId = getSessionId();

      const params = new URLSearchParams();
      if (userId) {
        params.append("user_id", userId.toString());
      } else {
        params.append("session_id", sessionId);
      }

      return await apiCall<{
        success: boolean;
        data?: { count: number };
        message?: string;
      }>(`/api/cart/count?${params}`);
    } catch (error) {
      return {
        success: false,
        message: "Failed to get cart count",
      };
    }
  },

  // Migrate cart from session to user (called when user logs in)
  async migrateCart(userId: number): Promise<{
    success: boolean;
    message?: string;
    data?: { migrated: number };
  }> {
    try {
      const sessionId = localStorage.getItem("session_id");
      if (!sessionId) {
        return { success: true, message: "No session cart to migrate" };
      }

      const result = await apiCall<{
        success: boolean;
        message?: string;
        data?: { migrated: number };
      }>("/api/cart/migrate", {
        method: "POST",
        body: JSON.stringify({
          session_id: sessionId,
          user_id: userId,
        }),
      });

      // Clear session ID after successful migration
      if (result.success) {
        localStorage.removeItem("session_id");
      }

      return result;
    } catch (error) {
      return {
        success: false,
        message: "Failed to migrate cart",
      };
    }
  },
};

// Helper functions for cart state management
export const cartUtils = {
  // Trigger cart update event
  triggerCartUpdate() {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("cartUpdated"));
    }
  },

  // Listen for cart updates
  onCartUpdate(callback: () => void) {
    if (typeof window !== "undefined") {
      window.addEventListener("cartUpdated", callback);
      return () => window.removeEventListener("cartUpdated", callback);
    }
    return () => {};
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("token");
  },

  // Get current session or user identifier
  getIdentifier(): { type: "user" | "session"; id: string | number } {
    const userId = getUserId();
    if (userId) {
      return { type: "user", id: userId };
    }
    return { type: "session", id: getSessionId() };
  },
};
