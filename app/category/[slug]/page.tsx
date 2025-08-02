"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Star, Grid3X3, List } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { AppLayout } from "@/components/AppLayout";
import { Domain, getMediaUrl } from "@/config";

// Simple API functions to avoid import issues
const categoriesApi = {
  getAll: async (params?: any) => {
    const queryParams = new URLSearchParams();
    if (params?.flat) queryParams.append("flat", "true");

    const response = await fetch(`${Domain}/api/categories?${queryParams}`);
    return response.json();
  },
};

const productsApi = {
  getAll: async (params?: any) => {
    const queryParams = new URLSearchParams();
    if (params?.category_id)
      queryParams.append("category_id", params.category_id.toString());
    if (params?.status) queryParams.append("status", params.status);
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const response = await fetch(`${Domain}/api/products?${queryParams}`);
    return response.json();
  },
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
};

interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  price: number;
  sale_price?: number;
  stock_quantity: number;
  images?: string[];
  avg_rating?: number;
  review_count?: number;
  featured?: boolean;
  created_at?: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  children?: Category[];
}

interface CategoryPageProps {
  params: {
    slug: string;
  };
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("created_at_desc");
  const [suggestedCategories, setSuggestedCategories] = useState<Category[]>(
    [],
  );

  useEffect(() => {
    loadCategoryAndProducts();
  }, [params.slug, sortBy]);

  const loadCategoryAndProducts = async () => {
    try {
      setLoading(true);
      setError("");

      console.log("🔍 Loading category for slug:", params.slug);

      // Get category by slug from SQL database
      const categoriesResponse = await categoriesApi.getAll({ flat: true });
      console.log("📂 Categories response:", categoriesResponse);

      if (categoriesResponse.success && categoriesResponse.data) {
        const categories = Array.isArray(categoriesResponse.data)
          ? categoriesResponse.data
          : [];
        console.log(
          "📋 Available categories:",
          categories.map((c: any) => c.slug),
        );

        const foundCategory = categories.find(
          (cat: any) => cat.slug === params.slug,
        );

        console.log("🎯 Found category:", foundCategory);

        if (foundCategory) {
          setCategory(foundCategory);

          // Get products for this category from SQL database
          const productsResponse = await productsApi.getAll({
            category_id: foundCategory.id,
            status: "active",
            limit: 50,
          });

          if (productsResponse.success && productsResponse.data) {
            let productData = [];
            if (Array.isArray(productsResponse.data)) {
              productData = productsResponse.data;
            } else if (
              productsResponse.data.products &&
              Array.isArray(productsResponse.data.products)
            ) {
              productData = productsResponse.data.products;
            }
            setProducts(productData);
            console.log("🛍️ Loaded products:", productData.length);
          }
        } else {
          console.log("❌ Category not found for slug:", params.slug);

          // Find similar categories for suggestions
          const similarCategories = categories
            .filter((cat: any) => {
              const slugKeywords = params.slug.split("-");
              return slugKeywords.some(
                (keyword) =>
                  cat.name.toLowerCase().includes(keyword.toLowerCase()) ||
                  cat.slug.toLowerCase().includes(keyword.toLowerCase()),
              );
            })
            .slice(0, 6);

          console.log("💡 Suggested categories:", similarCategories);
          setSuggestedCategories(
            similarCategories.length > 0
              ? similarCategories
              : categories.slice(0, 6),
          );
          setError("Không tìm thấy danh mục");
        }
      }
    } catch (error: any) {
      console.error("Failed to load category:", error);
      setError("Không thể tải danh mục từ database");
    } finally {
      setLoading(false);
    }
  };

  const calculateDiscount = (price: number, salePrice?: number) => {
    if (!salePrice) return 0;
    return Math.round(
      ((Number(price) - Number(salePrice)) / Number(price)) * 100,
    );
  };

  const sortProducts = (products: Product[]) => {
    return [...products].sort((a, b) => {
      switch (sortBy) {
        case "price_asc":
          return (a.sale_price || a.price) - (b.sale_price || b.price);
        case "price_desc":
          return (b.sale_price || b.price) - (a.sale_price || a.price);
        case "name_asc":
          return a.name.localeCompare(b.name);
        case "name_desc":
          return b.name.localeCompare(a.name);
        case "created_at_asc":
          return (
            new Date(a.created_at || "").getTime() -
            new Date(b.created_at || "").getTime()
          );
        default: // created_at_desc
          return (
            new Date(b.created_at || "").getTime() -
            new Date(a.created_at || "").getTime()
          );
      }
    });
  };

  const renderProductCard = (product: Product) => {
    const discount = calculateDiscount(product.price, product.sale_price);
    console.log(discount);
    const finalPrice = product.sale_price || product.price;

    if (viewMode === "list") {
      return (
        <Link key={product.id} href={`/products/${product.id}`}>
          <Card className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex space-x-4">
                <div className="flex-shrink-0">
                  <img
                    src={getMediaUrl(
                      (product.images && product.images[0]) || "",
                    )}
                    alt={product.name}
                    width={120}
                    height={120}
                    className="w-24 h-24 object-cover rounded"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {product.short_description}
                  </p>
                  <div className="flex items-center mb-2">
                    <div className="flex items-center text-yellow-500 mr-2">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="text-sm ml-1">
                        {product.avg_rating || "0.0"}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      ({product.review_count || 0} đánh giá)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-red-600">
                        {formatPrice(finalPrice)}
                      </span>
                      {product.sale_price && (
                        <>
                          <span className="text-sm text-gray-500 line-through">
                            {formatPrice(product.price)}
                          </span>
                          <Badge variant="destructive">-{discount}%</Badge>
                        </>
                      )}
                    </div>
                    <Badge
                      variant={
                        product.stock_quantity > 0 ? "default" : "secondary"
                      }
                    >
                      {product.stock_quantity > 0 ? "Còn hàng" : "Hết hàng"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      );
    }

    return (
      <Link key={product.id} href={`/products/${product.id}`}>
        <Card className="overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer">
          <div className="relative">
            <Image
              src={getMediaUrl((product.images && product.images[0]) || "")}
              alt={product.name}
              width={300}
              height={200}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {product.sale_price && (
              <div className="absolute top-2 left-2">
                <Badge variant="destructive">{discount}%</Badge>
              </div>
            )}
            {product.featured ? (
              <div className="absolute top-2 right-2">
                <Badge className="bg-yellow-500 text-black">HOT</Badge>
              </div>
            ) : (
              ""
            )}
            {product.stock_quantity === 0 && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <Badge variant="secondary">Hết hàng</Badge>
              </div>
            )}
          </div>
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
              {product.name}
            </h3>
            <div className="flex items-center mb-2">
              <div className="flex items-center text-yellow-500 mr-2">
                <Star className="h-4 w-4 fill-current" />
                <span className="text-sm ml-1">
                  {product.avg_rating || "0.0"}
                </span>
              </div>
              <span className="text-sm text-gray-500">
                ({product.review_count || 0})
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-lg font-bold text-red-600">
                  {formatPrice(finalPrice)}
                </span>
                {product.sale_price && (
                  <span className="text-sm text-gray-500 line-through ml-2">
                    {formatPrice(product.price)}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, index) => (
                <div key={index}>
                  <div className="bg-gray-200 rounded-lg h-48 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !category) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          {/* Error Header */}
          <div className="text-center py-8 mb-8">
            <div className="text-6xl mb-4">🔍</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Danh mục không tồn tại
            </h1>
            <p className="text-gray-600 mb-4">
              Chúng tôi không tìm thấy danh mục "
              {params.slug.replace(/-/g, " ")}" trong database.
            </p>
            <div className="flex justify-center space-x-4">
              <Button onClick={() => window.history.back()} variant="outline">
                Quay lại
              </Button>
              <Button asChild>
                <Link href="/">Trang chủ</Link>
              </Button>
            </div>
          </div>

          {/* Suggested Categories */}
          {suggestedCategories.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                Có thể bạn đang tìm kiếm
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {suggestedCategories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/category/${cat.slug}`}
                    className="group"
                  >
                    <Card className="text-center p-4 hover:shadow-lg transition-shadow group-hover:border-red-300">
                      <CardContent className="p-0">
                        <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white text-xl font-bold group-hover:scale-105 transition-transform">
                          {cat.name.charAt(0)}
                        </div>
                        <h3 className="font-medium text-gray-900 text-sm group-hover:text-red-600 transition-colors">
                          {cat.name}
                        </h3>
                        {cat.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {cat.description}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Search Alternative */}
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Hoặc tìm kiếm sản phẩm
            </h3>
            <div className="max-w-md mx-auto">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const searchTerm = (e.target as any).search.value;
                  if (searchTerm.trim()) {
                    window.location.href = `/products?search=${encodeURIComponent(searchTerm)}`;
                  }
                }}
              >
                <div className="relative">
                  <input
                    name="search"
                    type="text"
                    placeholder={`Tìm kiếm "${params.slug.replace(/-/g, " ")}"`}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  >
                    Tìm kiếm
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  const sortedProducts = sortProducts(products);

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Category Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {category.name}
          </h1>
          {category.description && (
            <p className="text-gray-600">{category.description}</p>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <p className="text-sm text-gray-600">{products.length} sản phẩm</p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at_desc">Mới nhất</SelectItem>
                <SelectItem value="created_at_asc">Cũ nhất</SelectItem>
                <SelectItem value="price_asc">Giá tăng dần</SelectItem>
                <SelectItem value="price_desc">Giá giảm dần</SelectItem>
                <SelectItem value="name_asc">Tên A-Z</SelectItem>
                <SelectItem value="name_desc">Tên Z-A</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode */}
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Products */}
        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">
              Chưa có sản phẩm nào trong danh mục này
            </p>
            <Link href="/products">
              <Button>Xem tất cả sản phẩm</Button>
            </Link>
          </div>
        ) : (
          <div
            className={`grid gap-6 ${
              viewMode === "grid"
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                : "grid-cols-1"
            }`}
          >
            {sortedProducts.map(renderProductCard)}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
