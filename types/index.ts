export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent_id?: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  children?: Category[];
  children_count?: number;
  products_count?: number;
}

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
  manage_stock: boolean;
  featured: boolean;
  status: "active" | "inactive" | "draft";
  images?: string[];
  attributes?: Record<string, any>;
  specifications?: Record<string, any>;
  weight?: number;
  dimensions?: string;
  created_at: string;
  updated_at: string;
  categories?: Category[];
  variants?: ProductVariant[];
  average_rating?: number;
  total_reviews?: number;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  name: string;
  sku: string;
  price: number;
  sale_price?: number;
  stock_quantity: number;
  attributes: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  role: "admin" | "user";
  avatar?: string;
  address?: string;
  province_id?: number;
  province_name?: string;
  district_id?: number;
  district_name?: string;
  ward_id?: number;
  ward_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any[];
}
