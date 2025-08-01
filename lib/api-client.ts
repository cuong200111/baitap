// Simple API client utilities
import { API_CONFIG } from "./config-client";

// Base API fetch function
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const url = `${API_CONFIG.BASE_URL}/api${endpoint}`;

  // Get token from localStorage if available (client-side only)
  let token: string | null = null;
  if (typeof window !== "undefined") {
    token = localStorage.getItem('token');
  }

  const headers:any = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const defaultOptions: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, defaultOptions);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'API call failed');
    }

    return data.data;
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
}

// Config API calls
export const configApi = {
  getAll: () => apiCall('/config'),
  getSection: (section: string) => apiCall(`/config/${section}`),
};

// Utils API calls
export const utilsApi = {
  format: (type: string, value: any, options?: any) => 
    apiCall('/utils/format', {
      method: 'POST',
      body: JSON.stringify({ type, value, options }),
    }),
  
  validate: (type: string, value: any) =>
    apiCall('/utils/validate', {
      method: 'POST', 
      body: JSON.stringify({ type, value }),
    }),
    
  generate: (type: string, options?: any) =>
    apiCall('/utils/generate', {
      method: 'POST',
      body: JSON.stringify({ type, options }),
    }),
    
  calculate: (type: string, values: any) =>
    apiCall('/utils/calculate', {
      method: 'POST',
      body: JSON.stringify({ type, values }),
    }),
    
  parse: (type: string, value: any) =>
    apiCall('/utils/parse', {
      method: 'POST',
      body: JSON.stringify({ type, value }),
    }),
    
  healthCheck: (url: string) =>
    apiCall(`/utils/health-check?url=${encodeURIComponent(url)}`),
};

// SEO API calls  
export const seoApi = {
  getHealth: () => {
 
    return apiCall('/seo/health');
  },
  
  generateMetaTags: (pageType: string, entityId?: number) =>
    apiCall('/seo/meta-tags', {
      method: 'POST',
      body: JSON.stringify({ pageType, entityId }),
    }),
    
  generateSchema: (type: string, data: any) =>
    apiCall('/seo/schema', {
      method: 'POST',
      body: JSON.stringify({ type, data }),
    }),
};

// Utility helper functions (client-side only)
export const clientUtils = {
  // Format price on client (immediate)
  formatPrice: (price: number | string | null | undefined): string => {
    if (price == null || price === '' || isNaN(Number(price))) {
      return '0₫';
    }

    const numPrice = typeof price === 'number' ? price : parseFloat(price.toString());
    if (isNaN(numPrice)) return '0₫';
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(numPrice);
  },

  // Validate email on client (immediate)
  isValidEmail: (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  },

  // Generate slug on client (immediate)
  generateSlug: (text: string): string => {
    if (!text) return '';
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[đĐ]/g, "d")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim("-");
  },

  // Truncate text on client (immediate)
  truncate: (text: string, length: number = 100): string => {
    if (!text || text.length <= length) return text;
    return text.substring(0, length) + '...';
  },

  // Storage utilities
  storage: {
    get: (key: string): any => {
      if (typeof window === "undefined") return null;
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      } catch {
        return null;
      }
    },

    set: (key: string, value: any): boolean => {
      if (typeof window === "undefined") return false;
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch {
        return false;
      }
    },

    remove: (key: string): boolean => {
      if (typeof window === "undefined") return false;
      try {
        localStorage.removeItem(key);
        return true;
      } catch {
        return false;
      }
    },
  },
};
