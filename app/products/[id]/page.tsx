"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Star,
  ShoppingCart,
  Plus,
  Minus,
  ArrowLeft,
  Share2,
  Heart,
  CheckCircle,
  XCircle,
  ZoomIn,
  Shield,
  Truck,
  RotateCcw,
  Headphones,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { productsApi, Product, formatPrice, getMediaUrl } from "@/config";
import ProductReviews from "@/components/ProductReviews";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { API_DOMAIN } from "@/lib/api-helpers";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadProduct();
    }
  }, [params.id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await productsApi.getById(params.id as string);

      if (response.success && response.data) {
        setProduct(response.data);
      } else {
        setError("Không tìm thấy sản phẩm");
      }
    } catch (error: any) {
      console.error("Failed to load product:", error);
      setError("Không thể tải thông tin sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= (product?.stock_quantity || 0)) {
      setQuantity(newQuantity);
    }
  };

  const addToCart = async () => {
    if (!product) return;

    if (!isAuthenticated || !user?.id) {
      toast.error("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng");
      router.push("/login?message=Vui lòng đăng nhập để sử dụng giỏ hàng");
      return;
    }

    setAddingToCart(true);
    try {
      const response = await fetch(`${API_DOMAIN}/api/cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          product_id: product.id,
          quantity: quantity,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Đã thêm ${quantity} ${product.name} vào giỏ hàng`);
        window.dispatchEvent(new Event("cartUpdated"));
      } else {
        toast.error(data.message || "Có lỗi xảy ra khi thêm vào giỏ hàng");
      }
    } catch (error) {
      console.error("Add to cart error:", error);
      toast.error("Có lỗi xảy ra khi thêm vào giỏ hàng");
    } finally {
      setAddingToCart(false);
    }
  };

  const buyNow = async () => {
    if (!product) return;

    setAddingToCart(true);
    try {
      if (isAuthenticated && user?.id) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/cart`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: user.id,
            product_id: product.id,
            quantity: quantity,
          }),
        });

        const data = await response.json();

        if (data.success) {
          router.push("/checkout");
        } else {
          toast.error(data.message || "Có lỗi xảy ra");
        }
      } else {
        const guestPurchase = {
          product_id: product.id,
          product_name: product.name,
          sku: product.sku,
          price: product.price,
          sale_price: product.sale_price,
          final_price: product.sale_price || product.price,
          quantity: quantity,
          images: product.images,
          total: (product.sale_price || product.price) * quantity,
        };

        localStorage.setItem("guest_purchase", JSON.stringify(guestPurchase));
        router.push("/guest-checkout");
      }
    } catch (error) {
      console.error("Buy now error:", error);
      toast.error("Có lỗi xảy ra");
    } finally {
      setAddingToCart(false);
    }
  };

  const calculateDiscount = (price: number, salePrice?: number) => {
    if (!salePrice) return 0;
    return Math.round(((price - salePrice) / price) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-4">
                <div className="aspect-square bg-gray-200 rounded-xl"></div>
                <div className="grid grid-cols-5 gap-3">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="aspect-square bg-gray-200 rounded-lg"
                    ></div>
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                <div className="h-8 bg-gray-200 rounded"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-12 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              Không tìm thấy sản phẩm
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const images = product.images || [];
  const mainImage = images[selectedImageIndex] || images[0] || "";
  const isInStock = product.stock_quantity > 0;
  const finalPrice = product.sale_price || product.price;
  const discount = calculateDiscount(product.price, product.sale_price);

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
          <Link href="/" className="hover:text-red-600 transition-colors">
            Trang chủ
          </Link>
          <span>/</span>
          <Link
            href="/products"
            className="hover:text-red-600 transition-colors"
          >
            Sản phẩm
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">{product.name}</span>
        </nav>

        {/* Main Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-12">
          {/* Left - Images Gallery */}
          <div className="lg:col-span-6">
            <div className="sticky top-6 space-y-4">
              {/* Main Image */}
              <motion.div
                className="relative aspect-square overflow-hidden rounded-2xl border-2 border-gray-100 bg-white shadow-lg group cursor-zoom-in"
                onClick={() => setIsZoomModalOpen(true)}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <Image
                  src={getMediaUrl(mainImage)}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  priority
                />

                {/* Zoom indicator */}
                <div className="absolute top-4 right-4 bg-black/50 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ZoomIn className="h-5 w-5" />
                </div>

                {/* Sale badge */}
                {discount > 0 && (
                  <div className="absolute top-4 left-4">
                    <Badge variant="destructive" className="text-sm font-bold">
                      -{discount}%
                    </Badge>
                  </div>
                )}

                {/* Navigation arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImageIndex((prev) =>
                          prev === 0 ? images.length - 1 : prev - 1,
                        );
                      }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImageIndex((prev) =>
                          prev === images.length - 1 ? 0 : prev + 1,
                        );
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}

                {/* Image counter */}
                {images.length > 1 && (
                  <div className="absolute bottom-4 right-4 bg-black/70 text-white text-sm px-3 py-1 rounded-full">
                    {selectedImageIndex + 1} / {images.length}
                  </div>
                )}
              </motion.div>

              {/* Thumbnail Gallery */}
              {images.length > 1 && (
                <div className="grid grid-cols-5 gap-3">
                  <AnimatePresence>
                    {images.map((image, index) => (
                      <motion.button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-all duration-200 ${
                          selectedImageIndex === index
                            ? "border-red-500 shadow-lg"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Image
                          src={getMediaUrl(image)}
                          alt={`${product.name} ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                        {selectedImageIndex === index && (
                          <div className="absolute inset-0 bg-red-500/20"></div>
                        )}
                      </motion.button>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>

          {/* Right - Product Info */}
          <div className="lg:col-span-6 space-y-8">
            {/* Product Title & Basic Info */}
            <div className="space-y-4">
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                {product.name}
              </h1>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  SKU: {product.sku}
                </span>
                {/* Rating */}
                <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(Number(product.avg_rating) || 0)
                            ? "text-yellow-400 fill-current"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {(Number(product.avg_rating) || 0).toFixed(1)}/5 (
                    {product.review_count || 0} đánh giá)
                  </span>
                </div>
              </div>
            </div>

            {/* Price Section */}
            <div className="space-y-3 p-6 bg-gray-50 rounded-2xl">
              <div className="flex items-baseline space-x-4">
                <span className="text-4xl font-bold text-red-600">
                  {formatPrice(finalPrice)}
                </span>
                {product.sale_price && (
                  <span className="text-xl text-gray-500 line-through">
                    {formatPrice(product.price)}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">Giá đã bao gồm VAT</p>
            </div>

            {/* Stock Status */}
            <div className="flex items-center space-x-3 p-4 rounded-xl bg-green-50 border border-green-200">
              {isInStock ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-green-700 font-medium">
                    Còn hàng ({product.stock_quantity} sản phẩm)
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span className="text-red-600 font-medium">Hết hàng</span>
                </>
              )}
            </div>

            {/* Short Description */}
            {product.short_description && (
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-gray-700 leading-relaxed">
                  {product.short_description}
                </p>
              </div>
            )}

            {/* Quantity & Actions */}
            {isInStock && (
              <div className="space-y-6">
                {/* Quantity Selector */}
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-700">
                    Số lượng:
                  </span>
                  <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                      className="px-4 py-2 h-12"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="px-6 py-2 min-w-[80px] text-center text-lg font-medium">
                      {quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleQuantityChange(1)}
                      disabled={quantity >= product.stock_quantity}
                      className="px-4 py-2 h-12"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-4">
                  <div className="flex space-x-3">
                    <Button
                      onClick={addToCart}
                      disabled={addingToCart}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white h-14 text-lg font-medium rounded-xl"
                    >
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      {addingToCart ? "Đang thêm..." : "Thêm vào giỏ hàng"}
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className="h-14 w-14 rounded-xl"
                    >
                      <Heart className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className="h-14 w-14 rounded-xl"
                    >
                      <Share2 className="h-5 w-5" />
                    </Button>
                  </div>

                  <Button
                    onClick={buyNow}
                    disabled={addingToCart}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white h-14 text-lg font-medium rounded-xl"
                  >
                    {addingToCart ? "Đang xử lý..." : "Mua ngay"}
                  </Button>
                </div>
              </div>
            )}

            {/* Service Features */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-200">
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-green-50">
                <Truck className="h-5 w-5 text-green-600" />
                <span className="text-sm text-green-700 font-medium">
                  Miễn phí giao hàng
                </span>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-blue-50">
                <Shield className="h-5 w-5 text-blue-600" />
                <span className="text-sm text-blue-700 font-medium">
                  Bảo hành chính hãng
                </span>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-orange-50">
                <RotateCcw className="h-5 w-5 text-orange-600" />
                <span className="text-sm text-orange-700 font-medium">
                  Đổi trả trong 7 ngày
                </span>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-purple-50">
                <Headphones className="h-5 w-5 text-purple-600" />
                <span className="text-sm text-purple-700 font-medium">
                  Hỗ trợ 24/7
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details & Reviews */}
        <Card className="border-0 shadow-lg rounded-2xl">
          <CardContent className="p-8">
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-14 bg-gray-100 rounded-xl">
                <TabsTrigger
                  value="description"
                  className="text-base font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg"
                >
                  Mô tả sản phẩm
                </TabsTrigger>
                <TabsTrigger
                  value="specifications"
                  className="text-base font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg"
                >
                  Thông số kỹ thuật
                </TabsTrigger>
                <TabsTrigger
                  value="reviews"
                  className="text-base font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg"
                >
                  Đánh giá
                </TabsTrigger>
              </TabsList>

              <TabsContent value="description" className="mt-8">
                <div className="prose max-w-none prose-lg">
                  {product.description ? (
                    <div
                      dangerouslySetInnerHTML={{ __html: product.description }}
                      className="text-gray-700 leading-relaxed"
                    />
                  ) : (
                    <p className="text-gray-600 text-center py-12">
                      Chưa có mô tả chi tiết cho sản phẩm này.
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="specifications" className="mt-8">
                {product.specifications &&
                Object.keys(product.specifications).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(product.specifications).map(
                      ([key, value]) => (
                        <div
                          key={key}
                          className="flex justify-between items-center py-4 px-6 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                          <span className="font-medium text-gray-700">
                            {key}:
                          </span>
                          <span className="text-gray-900 font-medium">
                            {String(value)}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-12">
                    Chưa có thông số kỹ thuật chi tiết.
                  </p>
                )}
              </TabsContent>

              <TabsContent value="reviews" className="mt-8">
                <ProductReviews
                  productId={product.id}
                  productName={product.name}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Zoom Modal */}
      <Dialog open={isZoomModalOpen} onOpenChange={setIsZoomModalOpen}>
        <DialogContent className="max-w-6xl w-full h-[90vh] p-0 bg-black border-0">
          <TransformWrapper
            initialScale={1}
            minScale={0.5}
            maxScale={3}
            centerOnInit
          >
            <TransformComponent
              wrapperClass="w-full h-full flex items-center justify-center"
              contentClass="w-full h-full flex items-center justify-center"
            >
              <div className="relative w-full h-full flex items-center justify-center">
                <Image
                  src={getMediaUrl(mainImage)}
                  alt={product.name}
                  width={1200}
                  height={1200}
                  className="max-w-full max-h-full object-contain"
                  priority
                />
              </div>
            </TransformComponent>
          </TransformWrapper>

          {/* Navigation in zoom modal */}
          {images.length > 1 && (
            <>
              <button
                onClick={() =>
                  setSelectedImageIndex((prev) =>
                    prev === 0 ? images.length - 1 : prev - 1,
                  )
                }
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full p-3 transition-colors"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={() =>
                  setSelectedImageIndex((prev) =>
                    prev === images.length - 1 ? 0 : prev + 1,
                  )
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full p-3 transition-colors"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {/* Image counter in zoom modal */}
          <div className="absolute top-4 left-4 bg-white/20 text-white px-4 py-2 rounded-full">
            {selectedImageIndex + 1} / {images.length}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
