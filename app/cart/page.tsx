"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { formatPrice, getMediaUrl, Domain } from "@/config";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface CartItem {
  id: number;
  product_id: number;
  product_name: string;
  sku: string;
  price: number;
  sale_price?: number;
  final_price: number;
  quantity: number;
  stock_quantity: number;
  images: string[];
  total: number;
}

interface CartSummary {
  itemCount: number;
  subtotal: number;
  total: number;
}

export default function CartPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [summary, setSummary] = useState<CartSummary>({
    itemCount: 0,
    subtotal: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadCart();
    } else {
      // Redirect to login if not authenticated
      router.push("/login?message=Vui lòng đăng nhập để xem giỏ hàng");
    }
  }, [user, isAuthenticated, router]);

  const loadCart = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const response = await fetch(`${Domain}/api/cart?user_id=${user.id}`, { headers });
      const data = await response.json();

      if (data.success) {
        setCartItems(data.data.items);
        setSummary(data.data.summary);
      } else {
        toast.error("Không thể tải giỏ hàng");
      }
    } catch (error) {
      console.error("Failed to load cart:", error);
      toast.error("Có l��i xảy ra khi tải giỏ hàng");
    } finally {
      setLoading(false);
    }
  };

  const loadGuestCart = async () => {
    try {
      setLoading(true);
      const guestCart = localStorage.getItem("guest_cart");
      if (guestCart) {
        const parsedCart = JSON.parse(guestCart);
        const productIds = Object.keys(parsedCart);

        if (productIds.length > 0) {
          const cartItems = [];
          let itemCount = 0;
          let subtotal = 0;

          for (const productId of productIds) {
            const quantity = parsedCart[productId];
            if (quantity > 0) {
              try {
                const token = localStorage.getItem("token");
                const headers: HeadersInit = {
                  "Content-Type": "application/json",
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                };
                const response = await fetch(`${Domain}/api/products/${productId}`, { headers });
                const data = await response.json();

                if (data.success && data.data) {
                  const product = data.data;
                  const finalPrice = product.sale_price || product.price;
                  const total = finalPrice * quantity;

                  cartItems.push({
                    id: parseInt(productId),
                    product_id: product.id,
                    product_name: product.name,
                    sku: product.sku,
                    price: product.price,
                    sale_price: product.sale_price,
                    final_price: finalPrice,
                    quantity: quantity,
                    stock_quantity: product.stock_quantity,
                    images: product.images || [],
                    total: total,
                  });

                  itemCount += quantity;
                  subtotal += total;
                }
              } catch (error) {
                console.error(`Failed to load product ${productId}:`, error);
              }
            }
          }

          setCartItems(cartItems);
          setSummary({ itemCount, subtotal, total: subtotal });
        } else {
          setCartItems([]);
          setSummary({ itemCount: 0, subtotal: 0, total: 0 });
        }
      } else {
        setCartItems([]);
        setSummary({ itemCount: 0, subtotal: 0, total: 0 });
      }
    } catch (error) {
      console.error("Failed to load guest cart:", error);
      setCartItems([]);
      setSummary({ itemCount: 0, subtotal: 0, total: 0 });
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (cartId: number, newQuantity: number) => {
    try {
      setUpdating(cartId);

      if (isAuthenticated && user?.id) {
        const token = localStorage.getItem("token");
        const headers: HeadersInit = {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
        const response = await fetch(`${Domain}/api/cart`, {
          method: "PUT",
          headers,
          body: JSON.stringify({ cart_id: cartId, quantity: newQuantity }),
        });

        const data = await response.json();

        if (data.success) {
          await loadCart();
          window.dispatchEvent(new Event("cartUpdated"));
          toast.success("Cập nhật giỏ hàng thành công");
        } else {
          toast.error(data.message || "Có lỗi xảy ra");
        }
      } else {
        const guestCart = JSON.parse(
          localStorage.getItem("guest_cart") || "{}",
        );
        const productId = cartId.toString();

        if (newQuantity <= 0) {
          delete guestCart[productId];
        } else {
          guestCart[productId] = newQuantity;
        }

        localStorage.setItem("guest_cart", JSON.stringify(guestCart));
        await loadGuestCart();
        window.dispatchEvent(new Event("cartUpdated"));
        toast.success("Cập nhật giỏ hàng thành công");
      }
    } catch (error) {
      console.error("Failed to update cart:", error);
      toast.error("Có lỗi xảy ra khi cập nhật giỏ hàng");
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (cartId: number) => {
    try {
      if (isAuthenticated && user?.id) {
        const token = localStorage.getItem("token");
        const headers: HeadersInit = {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
        const response = await fetch(`${Domain}/api/cart?cart_id=${cartId}`, {
          method: "DELETE",
          headers,
        });

        const data = await response.json();

        if (data.success) {
          await loadCart();
          window.dispatchEvent(new Event("cartUpdated"));
          toast.success("Đã xóa sản phẩm khỏi giỏ hàng");
        } else {
          toast.error(data.message || "Có lỗi xảy ra");
        }
      } else {
        const guestCart = JSON.parse(
          localStorage.getItem("guest_cart") || "{}",
        );
        const productId = cartId.toString();

        delete guestCart[productId];
        localStorage.setItem("guest_cart", JSON.stringify(guestCart));

        await loadGuestCart();
        window.dispatchEvent(new Event("cartUpdated"));
        toast.success("Đã xóa sản phẩm khỏi giỏ hàng");
      }
    } catch (error) {
      console.error("Failed to remove item:", error);
      toast.error("Có lỗi xảy ra khi xóa sản phẩm");
    }
  };

  const handleQuantityChange = (
    cartId: number,
    currentQuantity: number,
    delta: number,
  ) => {
    const newQuantity = currentQuantity + delta;
    if (newQuantity >= 0) {
      updateQuantity(cartId, newQuantity);
    }
  };

  const proceedToCheckout = () => {
    if (cartItems.length === 0) {
      toast.error("Giỏ hàng trống");
      return;
    }

    if (!isAuthenticated) {
      localStorage.setItem("redirect_after_login", "/checkout");
      router.push("/login?message=Vui lòng đăng nhập để tiếp tục thanh toán");
      return;
    }

    router.push("/checkout");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
              <div className="h-64 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Giỏ hàng</h1>
            <p className="text-gray-600">
              {summary.itemCount} sản phẩm trong giỏ hàng
            </p>
          </div>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tiếp tục mua sắm
          </Button>
        </div>

        {cartItems.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Giỏ hàng trống</h2>
              <p className="text-gray-600 mb-6">
                Hãy thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm
              </p>
              <Link href="/products">
                <Button>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Khám phá sản phẩm
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="relative w-24 h-24 flex-shrink-0">
                        <Image
                          src={getMediaUrl(item.images[0] || "")}
                          alt={item.product_name}
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/products/${item.product_id}`}
                          className="text-lg font-semibold text-gray-900 hover:text-red-600 transition-colors"
                        >
                          {item.product_name}
                        </Link>
                        <p className="text-sm text-gray-500 mt-1">
                          SKU: {item.sku}
                        </p>

                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-lg font-bold text-red-600">
                            {formatPrice(item.final_price)}
                          </span>
                          {item.sale_price && (
                            <span className="text-sm text-gray-500 line-through">
                              {formatPrice(item.price)}
                            </span>
                          )}
                        </div>

                        {item.quantity > item.stock_quantity && (
                          <Alert className="mt-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              Chỉ còn {item.stock_quantity} sản phẩm trong kho
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-3">
                        <div className="flex items-center border border-gray-300 rounded">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleQuantityChange(item.id, item.quantity, -1)
                            }
                            disabled={updating === item.id}
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="px-3 py-1 min-w-[50px] text-center">
                            {updating === item.id ? "..." : item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleQuantityChange(item.id, item.quantity, 1)
                            }
                            disabled={
                              updating === item.id ||
                              item.quantity >= item.stock_quantity
                            }
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        <div className="text-lg font-bold">
                          {formatPrice(item.total)}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Tóm tắt đơn hàng</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Tạm tính ({summary.itemCount} sản phẩm):</span>
                    <span>{formatPrice(summary.subtotal)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Phí vận chuyển:</span>
                    <span className="text-green-600">Miễn phí</span>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Tổng cộng:</span>
                      <span className="text-red-600">
                        {formatPrice(summary.total)}
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={proceedToCheckout}
                    className="w-full bg-red-600 hover:bg-red-700"
                    size="lg"
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Tiến hành thanh toán
                  </Button>

                  <div className="text-xs text-gray-500 space-y-2 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Thanh toán an toàn SSL</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Miễn phí đổi trả trong 7 ngày</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Hỗ trợ 24/7</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
