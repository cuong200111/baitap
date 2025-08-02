// Buy Now API utilities - separate from cart system
import { API_CONFIG } from "./config-client";

export interface BuyNowItem {
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
}

export interface BuyNowSummary {
  item_count: number;
  subtotal: number;
  shipping_fee: number;
  total: number;
}

export interface BuyNowResponse {
  success: boolean;
  message?: string;
  data?: {
    buy_now_session_id: string;
    item: BuyNowItem;
    summary: BuyNowSummary;
  };
  stock_status?: "out_of_stock" | "insufficient_stock";
  available_stock?: number;
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
    console.error(`Buy Now API Error for ${endpoint}:`, error);
    throw error;
  }
}

export const buyNowApi = {
  // Create buy now session
  async createBuyNowSession(
    productId: number,
    quantity: number = 1,
  ): Promise<BuyNowResponse> {
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

      const result = await apiCall<BuyNowResponse>("/api/buy-now", {
        method: "POST",
        body: JSON.stringify(body),
      });

      // Store buy now session in localStorage for checkout
      if (result.success && result.data) {
        localStorage.setItem("buy_now_session", JSON.stringify(result.data));
      }

      return result;
    } catch (error) {
      return {
        success: false,
        message: "Failed to create buy now session",
      };
    }
  },

  // Get stored buy now session from localStorage
  getBuyNowSession(): {
    buy_now_session_id: string;
    item: BuyNowItem;
    summary: BuyNowSummary;
  } | null {
    try {
      if (typeof window === "undefined") return null;

      const stored = localStorage.getItem("buy_now_session");
      if (!stored) return null;

      return JSON.parse(stored);
    } catch {
      return null;
    }
  },

  // Clear buy now session
  clearBuyNowSession(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("buy_now_session");
    }
  },
};

// Helper functions for buy now state management
export const buyNowUtils = {
  // Check if there's an active buy now session
  hasBuyNowSession(): boolean {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("buy_now_session");
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
