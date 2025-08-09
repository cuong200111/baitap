"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Star,
  Filter,
  Search,
  Grid3X3,
  List,
  ChevronDown,
  X,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Product, Category, formatPrice, getMediaUrl } from "@/config";
import { apiWrappers } from "@/lib/api-wrapper";

interface Filters {
  search: string;
  category_ids?: number[]; // Changed to array for multiple categories
  min_price?: number;
  max_price?: number;
  featured?: boolean;
  status: string;
  sort: string;
}

function ProductsPageContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const [filters, setFilters] = useState<Filters>({
    search: searchParams.get("search") || "",
    category_ids: searchParams.get("category")
      ? [parseInt(searchParams.get("category")!)]
      : [],
    min_price: undefined,
    max_price: undefined,
    featured: undefined,
    status: "active",
    sort: "created_at_desc",
  });

  const [priceRange, setPriceRange] = useState([0, 50000000]); // 0 to 50M VND

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, [filters, pagination.page]);

  const loadCategories = async () => {
    try {
      const response = await apiWrappers.categories.getAll({ flat: true });
      if (response.success && response.data) {
        setCategories(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        ...filters,
        // Send category_ids as comma-separated string if multiple categories selected
        category_ids:
          filters.category_ids && filters.category_ids.length > 0
            ? filters.category_ids.join(",")
            : undefined,
        page: pagination.page,
        limit: pagination.limit,
        min_price: filters.min_price || undefined,
        max_price: filters.max_price || undefined,
      };

      const response = await apiWrappers.products.getAll(params);

      if (response.success && response.data) {
        let productData = [];
        let paginationData = { ...pagination };

        if (Array.isArray(response.data)) {
          productData = response.data;
        } else if (
          response.data.products &&
          Array.isArray(response.data.products)
        ) {
          productData = response.data.products;
          if (response.data.pagination) {
            paginationData = { ...pagination, ...response.data.pagination };
          }
        }

        setProducts(productData);
        setPagination(paginationData);
      }
    } catch (error: any) {
      console.error("Failed to load products:", error);
      setError("Không thể tải danh sách sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof Filters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleCategoryToggle = (categoryId: number, checked: boolean) => {
    setFilters((prev) => {
      const currentIds = prev.category_ids || [];
      let newIds;

      if (checked) {
        // Add category if not already selected
        newIds = currentIds.includes(categoryId)
          ? currentIds
          : [...currentIds, categoryId];
      } else {
        // Remove category
        newIds = currentIds.filter((id) => id !== categoryId);
      }

      return { ...prev, category_ids: newIds };
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePriceRangeChange = (values: number[]) => {
    setPriceRange(values);
    setFilters((prev) => ({
      ...prev,
      min_price: values[0] > 0 ? values[0] : undefined,
      max_price: values[1] < 50000000 ? values[1] : undefined,
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      category_ids: [],
      min_price: undefined,
      max_price: undefined,
      featured: undefined,
      status: "active",
      sort: "created_at_desc",
    });
    setPriceRange([0, 50000000]);
  };

  const calculateDiscount = (price: number, salePrice?: number) => {
    if (!salePrice) return 0;
    return Math.round(((price - salePrice) / price) * 100);
  };

  const renderProductCard = (product: Product) => {
    const discount = calculateDiscount(product.price, product.sale_price);
    const finalPrice = product.sale_price || product.price;

    if (viewMode === "list") {
      return (
        <Link key={product.id} href={`/products/${product.id}`}>
          <Card className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex space-x-4">
                <div className="flex-shrink-0">
                  <Image
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
                        {(Number(product.avg_rating) || 0).toFixed(1)}
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
                <Badge variant="destructive">-{discount}%</Badge>
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
                  {(Number(product.avg_rating) || 0).toFixed(1)}
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Tất cả sản phẩm</h1>
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div
            className={`lg:col-span-1 ${showFilters ? "block" : "hidden lg:block"}`}
          >
            <Card className="sticky top-4">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Bộ lọc</h3>
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Xóa
                  </Button>
                </div>

                <div className="space-y-6">
                  {/* Search */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Tìm kiếm
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Tìm s���n phẩm..."
                        value={filters.search}
                        onChange={(e) =>
                          handleFilterChange("search", e.target.value)
                        }
                        className="pl-9"
                      />
                    </div>
                  </div>

                  {/* Categories */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Danh mục ({filters.category_ids?.length || 0} đã chọn)
                    </label>
                    <div className="max-h-48 overflow-y-auto space-y-2 border rounded-lg p-3">
                      {categories.map((category) => (
                        <div
                          key={category.id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`category-${category.id}`}
                            checked={
                              filters.category_ids?.includes(category.id) ||
                              false
                            }
                            onCheckedChange={(checked) =>
                              handleCategoryToggle(
                                category.id,
                                checked as boolean,
                              )
                            }
                          />
                          <label
                            htmlFor={`category-${category.id}`}
                            className="text-sm cursor-pointer flex-1"
                          >
                            {category.name}
                          </label>
                        </div>
                      ))}
                      {categories.length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-2">
                          Đang tải danh mục...
                        </p>
                      )}
                    </div>
                    {filters.category_ids &&
                      filters.category_ids.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFilterChange("category_ids", [])}
                          className="mt-2 text-xs"
                        >
                          Bỏ chọn tất cả
                        </Button>
                      )}
                  </div>

                  {/* Price Range */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Khoảng giá: {formatPrice(priceRange[0])} -{" "}
                      {formatPrice(priceRange[1])}
                    </label>
                    <Slider
                      min={0}
                      max={50000000}
                      step={100000}
                      value={priceRange}
                      onValueChange={handlePriceRangeChange}
                      className="w-full"
                    />
                  </div>

                  {/* Featured */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="featured"
                      checked={filters.featured || false}
                      onCheckedChange={(checked) =>
                        handleFilterChange("featured", checked || undefined)
                      }
                    />
                    <label htmlFor="featured" className="text-sm font-medium">
                      Chỉ sản phẩm nổi bật
                    </label>
                  </div>

                  {/* Sort */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Sắp xếp
                    </label>
                    <Select
                      value={filters.sort}
                      onValueChange={(value) =>
                        handleFilterChange("sort", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="created_at_desc">
                          Mới nhất
                        </SelectItem>
                        <SelectItem value="created_at_asc">Cũ nhất</SelectItem>
                        <SelectItem value="price_asc">Giá tăng dần</SelectItem>
                        <SelectItem value="price_desc">Giá giảm dần</SelectItem>
                        <SelectItem value="name_asc">Tên A-Z</SelectItem>
                        <SelectItem value="name_desc">Tên Z-A</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Products */}
          <div className="lg:col-span-3">
            {/* Mobile Filter Toggle */}
            <Button
              variant="outline"
              className="lg:hidden mb-4 w-full"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Bộ lọc
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>

            {/* Results Summary */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">
                  {loading
                    ? "Đang tải..."
                    : `Hiển thị ${products.length} sản phẩm`}
                </p>
              </div>

              {/* Active Filters */}
              {filters.category_ids && filters.category_ids.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {filters.category_ids.map((categoryId) => {
                    const category = categories.find(
                      (c) => c.id === categoryId,
                    );
                    return category ? (
                      <Badge
                        key={categoryId}
                        variant="secondary"
                        className="text-xs"
                      >
                        {category.name}
                        <button
                          onClick={() =>
                            handleCategoryToggle(categoryId, false)
                          }
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
            </div>

            {/* Products Grid/List */}
            {loading ? (
              <div
                className={`grid gap-6 ${
                  viewMode === "grid"
                    ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
                    : "grid-cols-1"
                }`}
              >
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="bg-gray-200 rounded-lg h-48 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={loadProducts}>Thử lại</Button>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">
                  Không tìm thấy sản phẩm nào
                </p>
                <Button onClick={clearFilters}>Xóa bộ lọc</Button>
              </div>
            ) : (
              <div
                className={`grid gap-6 ${
                  viewMode === "grid"
                    ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
                    : "grid-cols-1"
                }`}
              >
                {products.map(renderProductCard)}
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    disabled={pagination.page === 1}
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: prev.page - 1,
                      }))
                    }
                  >
                    Trước
                  </Button>
                  {[...Array(Math.min(5, pagination.totalPages))].map(
                    (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <Button
                          key={pageNum}
                          variant={
                            pagination.page === pageNum ? "default" : "outline"
                          }
                          onClick={() =>
                            setPagination((prev) => ({
                              ...prev,
                              page: pageNum,
                            }))
                          }
                        >
                          {pageNum}
                        </Button>
                      );
                    },
                  )}
                  <Button
                    variant="outline"
                    disabled={pagination.page === pagination.totalPages}
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: prev.page + 1,
                      }))
                    }
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50">
          <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1">
                  <div className="h-64 bg-gray-200 rounded-lg"></div>
                </div>
                <div className="lg:col-span-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="bg-gray-200 rounded-lg h-48 mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                        <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <ProductsPageContent />
    </Suspense>
  );
}
