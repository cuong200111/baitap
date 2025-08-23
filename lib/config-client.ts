// Client-side configuration utilities

// Function to detect API URL based on environment
function detectBaseApiUrl() {
  // If explicit API URL is set, use it
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // For client-side detection on production
  if (typeof window !== "undefined") {
    const currentHost = window.location.origin;
    // If we're on a production domain (not localhost), assume backend is on same domain
    if (!currentHost.includes("localhost")) {
      return currentHost;
    }
  }

  // Default to localhost for development
  return "http://localhost:4000";
}

// API Configuration - Direct backend connection
export const API_CONFIG = {
  BASE_URL: detectBaseApiUrl(),
  TIMEOUT: 15000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

// Frontend-specific configuration
export const CLIENT_CONFIG = {
  app: {
    name: "ZOXVN",
    version: "1.0.0",
    description: "Máy tính, Laptop, Gaming Gear",
  },
  ui: {
    theme: {
      primary: "#3B82F6",
      secondary: "#64748B",
      success: "#10B981",
      warning: "#F59E0B",
      error: "#EF4444",
    },
    breakpoints: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    layout: {
      header_height: "64px",
      sidebar_width: "256px",
      max_content_width: "1200px",
    },
  },
  features: {
    enable_search: true,
    enable_cart: true,
    enable_wishlist: true,
    enable_reviews: true,
    enable_compare: true,
    items_per_page: 12,
    max_cart_items: 50,
  },
  seo: {
    default_title: "ZOXVN - Máy tính, Laptop, Gaming Gear",
    default_description:
      "ZOXVN - Chuyên cung cấp máy tính, laptop, linh kiện máy tính, gaming gear với giá tốt nhất.",
    site_name: "ZOXVN",
    twitter_site: "@zoxvn_official",
    og_type: "website",
    enable_analytics: true,
  },
  storage: {
    token_key: "token",
    cart_key: "cart",
    wishlist_key: "wishlist",
    preferences_key: "user_preferences",
    recently_viewed_key: "recently_viewed",
  },
  validation: {
    email_regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone_regex: /^[0-9]{10,11}$/,
    password_min_length: 6,
    name_min_length: 2,
    name_max_length: 50,
  },
};

// Get API endpoint URL
export function getApiUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${API_CONFIG.BASE_URL}/api${cleanEndpoint}`;
}

// Check if development mode
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

// Check if production mode
export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

// Get client-side environment variable
export function getClientEnv(key: string, defaultValue: string = ""): string {
  if (typeof window === "undefined") {
    return defaultValue;
  }

  // Only NEXT_PUBLIC_ variables are available on client
  return process.env[`NEXT_PUBLIC_${key}`] || defaultValue;
}

// Local storage utilities with error handling
export const storage = {
  get: (key: string): any => {
    if (typeof window === "undefined") return null;

    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.warn(`Error reading from localStorage for key: ${key}`, error);
      return null;
    }
  },

  set: (key: string, value: any): boolean => {
    if (typeof window === "undefined") return false;

    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn(`Error writing to localStorage for key: ${key}`, error);
      return false;
    }
  },

  remove: (key: string): boolean => {
    if (typeof window === "undefined") return false;

    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`Error removing from localStorage for key: ${key}`, error);
      return false;
    }
  },

  clear: (): boolean => {
    if (typeof window === "undefined") return false;

    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.warn("Error clearing localStorage", error);
      return false;
    }
  },
};

// Session storage utilities
export const sessionStorage = {
  get: (key: string): any => {
    if (typeof window === "undefined") return null;

    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.warn(`Error reading from sessionStorage for key: ${key}`, error);
      return null;
    }
  },

  set: (key: string, value: any): boolean => {
    if (typeof window === "undefined") return false;

    try {
      window.sessionStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn(`Error writing to sessionStorage for key: ${key}`, error);
      return false;
    }
  },

  remove: (key: string): boolean => {
    if (typeof window === "undefined") return false;

    try {
      window.sessionStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`Error removing from sessionStorage for key: ${key}`, error);
      return false;
    }
  },
};
