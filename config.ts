import { API_CONFIG } from "./lib/config-client";
import { configApi, utilsApi, seoApi, clientUtils } from "./lib/api-client";

// API Configuration - Direct backend connection
export const API_BASE_URL = API_CONFIG.BASE_URL;

// Backend Domain for direct API calls
export const Domain = API_BASE_URL;

// Format price in Vietnamese Dong (client-side utility)
export const formatPrice = clientUtils.formatPrice;

// Media URL helper
export const getMediaUrl = (path: string): string => {
  if (!path) return "/placeholder.svg";
  if (path.startsWith("http")) return path;
  if (path.startsWith("/uploads/")) return path;
  return `${Domain}/uploads/${path}`;
};

// User Management
export interface User {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  role: "user" | "admin";
  is_active: boolean;
  created_at: string;
  avatar?: string;
}

// Product Management
export interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  sku: string;
  price: number;
  sale_price?: number;
  stock_quantity: number;
  featured: boolean;
  status: "active" | "inactive" | "draft";
  images: string[];
  specifications?: Record<string, any>;
  categories?: Category[];
  avg_rating?: number;
  review_count?: number;
  created_at: string;
  updated_at: string;
}

// Category Management
export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent_id?: number;
  is_active: boolean;
  sort_order: number;
  products_count?: number;
  created_at: string;
  updated_at: string;
  children?: Category[];
}

// Generic API Response
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  status?: number;
}
// Helper function to call API with optional token
async function callApi<T>(url: string, options: RequestInit = {}): Promise<T> {
  let headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, { ...options, headers });
  return response.json();
}

// API Functions
export const usersApi = {
  getAll(params: Record<string, any> = {}): Promise<ApiResponse<User[]>> {
    const searchParams = new URLSearchParams(params);
    return callApi(`${Domain}/api/users?${searchParams}`);
  },

  getById(id: number): Promise<ApiResponse<User>> {
    return callApi(`${Domain}/api/users/${id}`);
  },

  create(userData: Partial<User>): Promise<ApiResponse<User>> {
    return callApi(`${Domain}/api/users`, {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },

  update(id: number, userData: Partial<User>): Promise<ApiResponse<User>> {
    return callApi(`${Domain}/api/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  },

  delete(id: number): Promise<ApiResponse<void>> {
    return callApi(`${Domain}/api/users/${id}`, {
      method: "DELETE",
    });
  },

  changePassword(id: number, passwordData: { new_password: string }): Promise<ApiResponse<void>> {
    return callApi(`${Domain}/api/users/${id}/password`, {
      method: "PUT",
      body: JSON.stringify(passwordData),
    });
  },
};

export const productsApi = {
  async getAll(params: Record<string, any> = {}): Promise<
    ApiResponse<{
      products: Product[];
      pagination: any;
    }>
  > {
    try {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const data = await callApi<ApiResponse<any>>(
        `${Domain}/api/products?${searchParams}`,
      );
      return {
        ...data,
        status: data.status ?? 200,
      };
    } catch (error: any) {
      console.error("Products API error:", error);
      return {
        success: false,
        message: error.message || "Failed to fetch products",
        status: 500,
      };
    }
  },

  getById(id: number): Promise<ApiResponse<Product>> {
    return callApi(`${Domain}/api/products/${id}`);
  },

  create(productData: Partial<Product>): Promise<ApiResponse<Product>> {
    return callApi(`${Domain}/api/products`, {
      method: "POST",
      body: JSON.stringify(productData),
    });
  },

  update(
    id: number,
    productData: Partial<Product>,
  ): Promise<ApiResponse<Product>> {
    return callApi(`${Domain}/api/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(productData),
    });
  },

  delete(id: number): Promise<ApiResponse<void>> {
    return callApi(`${Domain}/api/products/${id}`, {
      method: "DELETE",
    });
  },
};

export const authApi = {
  async login(
    email: string,
    password: string,
  ): Promise<
    ApiResponse<{
      token: string;
      user: User;
    }>
  > {
    const data = await callApi<ApiResponse<any>>(`${Domain}/api/auth/login`, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    return {
      ...data,
      status: data.status ?? 200,
    };
  },

  async register(userData: {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
  }): Promise<
    ApiResponse<{
      token: string;
      user: User;
    }>
  > {
    const data = await callApi<ApiResponse<any>>(
      `${Domain}/api/auth/register`,
      {
        method: "POST",
        body: JSON.stringify(userData),
      },
    );
    return {
      ...data,
      status: data.status ?? 200,
    };
  },

  async getProfile(): Promise<ApiResponse<User>> {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (!token) {
      return {
        success: false,
        message: "No token found",
        status: 401,
      };
    }

    const data = await callApi<ApiResponse<User>>(`${Domain}/api/auth/profile`);
    return {
      ...data,
      status: data.status ?? 200,
    };
  },

  async verifyToken(): Promise<ApiResponse<User>> {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (!token) {
      return {
        success: false,
        message: "No token found",
        status: 401,
      };
    }

    const data = await callApi<ApiResponse<User>>(
      `${Domain}/api/auth/verify-token`,
      {
        method: "POST",
      },
    );
    return {
      ...data,
      status: data.status ?? 200,
    };
  },
};

export const categoriesApi = {
  async getAll(
    params: Record<string, any> = {},
  ): Promise<ApiResponse<Category[]>> {
    try {
      const searchParams = new URLSearchParams(params);
      const data = await callApi<ApiResponse<any>>(
        `${Domain}/api/categories?${searchParams}`,
      );
      return {
        ...data,
        status: data.status ?? 200,
      };
    } catch (error: any) {
      console.error("Categories API error:", error);
      return {
        success: false,
        message: error.message || "Failed to fetch categories",
        status: 500,
      };
    }
  },

  getById(id: number): Promise<ApiResponse<Category>> {
    return callApi(`${Domain}/api/categories/${id}`);
  },

  create(categoryData: Partial<Category>): Promise<ApiResponse<Category>> {
    return callApi(`${Domain}/api/categories`, {
      method: "POST",
      body: JSON.stringify(categoryData),
    });
  },

  update(
    id: number,
    categoryData: Partial<Category>,
  ): Promise<ApiResponse<Category>> {
    return callApi(`${Domain}/api/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(categoryData),
    });
  },

  delete(id: number): Promise<ApiResponse<void>> {
    return callApi(`${Domain}/api/categories/${id}`, {
      method: "DELETE",
    });
  },
};
// Media File Interface
export interface MediaFile {
  id: number;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  path: string;
  url: string;
  alt_text?: string;
  title?: string;
  uploaded_by: number;
  entity_type?: string;
  entity_id?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const mediaApi = {
  getAll(params: Record<string, any> = {}): Promise<ApiResponse<MediaFile[]>> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    return callApi(`${Domain}/api/media?${searchParams}`);
  },

  upload(
    file: File,
    entityType: string = "general",
  ): Promise<ApiResponse<MediaFile>> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("entity_type", entityType);

    // Get token for authenticated upload
    let headers: Record<string, string> = {};
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    return fetch(`${Domain}/api/media`, {
      method: "POST",
      body: formData,
      headers, // Don't set Content-Type, browser will set it with boundary
    }).then((response) => response.json());
  },

  getById(id: number): Promise<ApiResponse<MediaFile>> {
    return callApi(`${Domain}/api/media/${id}`);
  },

  update(
    id: number,
    data: Partial<MediaFile>,
  ): Promise<ApiResponse<MediaFile>> {
    return callApi(`${Domain}/api/media/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete(id: number): Promise<ApiResponse<void>> {
    return callApi(`${Domain}/api/media/${id}`, {
      method: "DELETE",
    });
  },
};
export interface Review {
  id: number;
  user_id: number;
  user_name?: string;
  full_name?: string;
  user_avatar?: string;
  avatar?: string;
  rating: number;
  title?: string;
  comment?: string;
  helpful_count: number;
  verified_purchase?: boolean;
  is_approved?: boolean;
  created_at: string;
  images?: string[];
}

export interface ReviewSummary {
  total_reviews: number;
  average_rating: number;
  rating_5_count: number;
  rating_4_count: number;
  rating_3_count: number;
  rating_2_count: number;
  rating_1_count: number;
}

export interface ReviewPagination {
  current_page: number;
  total_pages: number;
  total_items: number;
  per_page: number;
}

export const reviewsApi = {
  async getByProduct(
    productId: number,
    params: Record<string, any> = {},
  ): Promise<
    ApiResponse<{
      reviews: Review[];
      summary: ReviewSummary;
      pagination: ReviewPagination;
    }>
  > {
    try {
      const searchParams = new URLSearchParams(params);
      const data = await callApi<ApiResponse<any>>(
        `${Domain}/api/reviews?${searchParams}&product_id=${productId}`,
      );
      return {
        ...data,
        status: data.status ?? 200,
      };
    } catch (error: any) {
      console.error("Reviews API error:", error);
      return {
        success: false,
        message: error.message || "Failed to fetch reviews",
        status: 500,
      };
    }
  },

  async add(reviewData: {
    product_id: number;
    rating: number;
    title?: string;
    comment?: string;
    images?: string[];
  }): Promise<ApiResponse<Review>> {
    try {
      const data = await callApi<ApiResponse<any>>(`${Domain}/api/reviews`, {
        method: "POST",
        body: JSON.stringify(reviewData),
      });
      return {
        ...data,
        status: data.status ?? 200,
      };
    } catch (error: any) {
      console.error("Add review error:", error);
      return {
        success: false,
        message: error.message || "Failed to submit review",
        status: 500,
      };
    }
  },
};
// SEO Configuration moved to backend and lib/config-client.ts
// This keeps the config.ts file focused on API definitions
