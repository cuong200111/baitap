"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Star,
  ShoppingCart,
  Truck,
  Shield,
  Headphones,
  Award,
} from "lucide-react";
import Link from "next/link";
import { Category, Product, formatPrice, getMediaUrl } from "@/config";
import { apiWrappers } from "@/lib/api-wrapper";
import { AppLayout } from "@/components/AppLayout";

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [categoriesResponse, productsResponse] = await Promise.all([
        apiWrappers.categories.getAll({ parent_id: null }),
        apiWrappers.products.getAll({ featured: true, limit: 8 }),
      ]);

      console.log("Categories response:", categoriesResponse);
      console.log("Products response:", productsResponse);

      if (categoriesResponse.success && categoriesResponse.data) {
        const categoryData = Array.isArray(categoriesResponse.data)
          ? categoriesResponse.data
          : [];
        setCategories(categoryData.slice(0, 6));
      }

      if (productsResponse.success && productsResponse.data) {
        // Handle both formats: array or { products: [], pagination: {} }
        let productData = [];
        if (Array.isArray(productsResponse.data)) {
          productData = productsResponse.data;
        } else if (
          productsResponse.data.products &&
          Array.isArray(productsResponse.data.products)
        ) {
          productData = productsResponse.data.products;
        }
        setFeaturedProducts(productData.slice(0, 4));
      }
    } catch (error: any) {
      console.error("Failed to load data:", error);
      setError("Không thể tải dữ liệu. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const calculateDiscount = (price: number, salePrice?: number) => {
    if (!salePrice) return 0;
    return Math.round(((price - salePrice) / price) * 100);
  };

  const services = [
    {
      icon: Truck,
      title: "Giao hàng miễn phí",
      description: "Đơn hàng từ 500,000��",
    },
    {
      icon: Shield,
      title: "Bảo hành chính hãng",
      description: "Lên đến 36 tháng",
    },
    {
      icon: Headphones,
      title: "Hỗ trợ 24/7",
      description: "Tư vấn chuyên nghiệp",
    },
    {
      icon: Award,
      title: "Chất lượng đảm bảo",
      description: "Sản phẩm chính hãng 100%",
    },
  ];

  if (error) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadData}>Thử lại</Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="bg-gray-50">
        {/* Hero Banner */}
        <section className="relative">
          <div className="container mx-auto px-4 py-8">
            <div className="relative bg-gradient-to-r from-red-600 to-red-800 rounded-2xl overflow-hidden">
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="relative p-8 md:p-16 text-white">
                <div className="max-w-2xl">
                  <h1 className="text-4xl md:text-6xl font-bold mb-4">
                    SIÊU SALE
                    <span className="block text-yellow-400">TẾT 2024</span>
                  </h1>
                  <p className="text-xl mb-6">
                    Giảm giá lên đến 50% cho tất cả sản phẩm Gaming và Laptop
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      size="lg"
                      className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                    >
                      Mua ngay
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className="border-white text-white hover:bg-white hover:text-red-600"
                    >
                      Xem ưu đãi
                    </Button>
                  </div>
                </div>
              </div>
              <div className="absolute right-8 top-8 bottom-8 hidden lg:block">
                <img
                  src="https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400&h=400&fit=crop"
                  alt="Gaming Setup"
                  className="h-full w-auto object-cover rounded-lg"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-8">
              Danh mục sản phẩm
            </h2>
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="bg-gray-200 rounded-lg h-48 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                ))}
              </div>
            ) : categories && categories.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/category/${category.slug}`}
                    className="group"
                  >
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="aspect-square overflow-hidden">
                        <img
                          src={getMediaUrl(category.image || "")}
                          alt={category.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <CardContent className="p-4 text-center">
                        <h3 className="font-semibold text-gray-900">
                          {category.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {category.products_count || 0}+ sản phẩm
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">
                  Chưa có danh mục nào. Hãy thêm danh mục trong trang quản trị.
                </p>
                <Link href="/admin/categories">
                  <Button className="mt-4">Quản l�� danh mục</Button>
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold">Sản phẩm nổi bật</h2>
              <Link
                href="/products"
                className="text-red-600 hover:text-red-700"
              >
                Xem tất cả →
              </Link>
            </div>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="bg-gray-200 rounded-lg h-48 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : featuredProducts && featuredProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredProducts.map((product) => (
                  <Link key={product.id} href={`/products/${product.id}`}>
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer">
                      <div className="relative">
                        <img
                          src={getMediaUrl(
                            (product.images && product.images[0]) || "",
                          )}
                          alt={product.name}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {product.sale_price && (
                          <div className="absolute top-2 left-2">
                            <span className="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">
                              -
                              {calculateDiscount(
                                product.price,
                                product.sale_price,
                              )}
                              %
                            </span>
                          </div>
                        )}
                        {product.featured ? (
                          <div className="absolute top-2 right-2">
                            <span className="bg-yellow-500 text-black px-2 py-1 rounded text-xs font-bold">
                              HOT
                            </span>
                          </div>
                        ) : (
                          ""
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
                            ({product.review_count || 0} đánh giá)
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-lg font-bold text-red-600">
                              {formatPrice(product.sale_price || product.price)}
                            </span>
                            {product.sale_price && (
                              <span className="text-sm text-gray-500 line-through ml-2">
                                {formatPrice(product.price)}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          className="w-full mt-3 bg-red-600 hover:bg-red-700"
                          onClick={(e) => {
                            e.preventDefault();
                            window.location.href = `/products/${product.id}`;
                          }}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Mua ngay
                        </Button>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">
                  Chưa có sản phẩm nổi bật nào. Hãy thêm sản phẩm và đánh dấu
                  &quot;n��i bật&quot; trong trang quản trị.
                </p>
                <Link href="/admin/products">
                  <Button className="mt-4">Quản lý sản phẩm</Button>
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Services */}
        <section className="py-12 bg-gray-100">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {services.map((service, index) => (
                <Card key={index} className="text-center p-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                    <service.icon className="h-8 w-8 text-red-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {service.title}
                  </h3>
                  <p className="text-sm text-gray-600">{service.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter */}
        <section className="py-12 bg-red-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Đăng ký nhận thông tin khuyến mãi
            </h2>
            <p className="text-xl mb-8">
              Nhận ngay mã giảm giá 100,000�� cho đơn hàng đầu tiên
            </p>
            <div className="max-w-md mx-auto flex gap-4">
              <input
                type="email"
                placeholder="Nhập email của bạn"
                className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
              <Button className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8">
                Đăng ký
              </Button>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
